"""BloxCraft AI — iteration 4 backend tests.

Covers:
- Password reset flow (forgot → reset → login → re-reset back)
- Image upload Pillow MIME sniffing (real PNG vs fake .png with text content)
- Roblox export endpoints: /manifest, /checklist, /glb (auth, 403, 400)
- Live fal.ai text-to-3d kickoff (admin) — verify demo_mode=false; poll limited
"""
import io
import os
import time
import uuid
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://ai-generator-66.preview.emergentagent.com"
).rstrip("/")

ADMIN_EMAIL = "admin@bloxcraft.ai"
ADMIN_PASSWORD = "BloxCraft2026!"


def _make_png_bytes(w=64, h=64):
    """Tiny valid PNG (>= 100 bytes) using deflate / zlib for IDAT."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(h):
        raw += b"\x00" + (b"\xff\x00\x80") * w  # filter byte + RGB pixels
    idat = zlib.compress(raw)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    # Pad to ensure >= 100 bytes
    return png


@pytest.fixture(scope="module")
def http():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(http):
    r = http.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def user_b(http):
    email = f"it4_{uuid.uuid4().hex[:8]}@example.com"
    pw = "secret12345"
    r = http.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": pw, "name": "IT4"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": pw, "token": d["access_token"], "user": d["user"]}


# ============== Image upload Pillow sniffing ==============
class TestImageUploadPillow:
    def test_real_png_accepted(self, http, admin_headers):
        png = _make_png_bytes()
        assert len(png) >= 100, f"Test PNG too small: {len(png)}"
        files = {"file": ("real.png", png, "image/png")}
        r = http.post(
            f"{BASE_URL}/api/uploads/image",
            headers=admin_headers,
            files=files,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d
        assert d["path"].startswith("/api/uploads/")

    def test_fake_png_rejected(self, http, admin_headers):
        """Text bytes renamed as .png with image/png content-type must be rejected."""
        fake = b"This is just text content disguised as an image. " * 4
        assert len(fake) >= 100
        files = {"file": ("fake.png", fake, "image/png")}
        r = http.post(
            f"{BASE_URL}/api/uploads/image",
            headers=admin_headers,
            files=files,
            timeout=20,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        assert "valid image" in r.text.lower() or "not a valid" in r.text.lower()

    def test_upload_no_auth_401(self, http):
        png = _make_png_bytes()
        files = {"file": ("real.png", png, "image/png")}
        r = http.post(f"{BASE_URL}/api/uploads/image", files=files, timeout=20)
        assert r.status_code in (401, 403)


# ============== Password Reset ==============
class TestPasswordReset:
    def test_forgot_returns_dev_link(self, http):
        r = http.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert "dev_reset_link" in d
        assert "token=" in d["dev_reset_link"]

    def test_forgot_unknown_email_still_ok(self, http):
        r = http.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "no-such-user@example.com"},
            timeout=20,
        )
        # Always 200 to prevent email enumeration
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_reset_invalid_token_400(self, http):
        r = http.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "ZZ_invalid_token_xyz", "password": "NewBlox2026!"},
            timeout=20,
        )
        assert r.status_code == 400

    def test_full_reset_flow_and_reuse_blocked(self, http):
        # 1. forgot → token
        r1 = http.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL},
            timeout=20,
        )
        assert r1.status_code == 200, r1.text
        link = r1.json()["dev_reset_link"]
        token = link.split("token=")[-1]
        assert len(token) > 10

        # 2. reset to a new password
        new_pw = "NewBlox2026!"
        r2 = http.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token, "password": new_pw},
            timeout=20,
        )
        assert r2.status_code == 200, r2.text
        assert r2.json().get("ok") is True

        # 3. Login with new password
        r3 = http.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": new_pw},
            timeout=20,
        )
        assert r3.status_code == 200, r3.text

        # 4. Reuse same token → 400 'already been used'
        r4 = http.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token, "password": "OtherPwd2026!"},
            timeout=20,
        )
        assert r4.status_code == 400, r4.text
        assert "already" in r4.text.lower() or "used" in r4.text.lower()

        # 5. Restore admin password for downstream tests via new forgot+reset
        r5 = http.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL},
            timeout=20,
        )
        assert r5.status_code == 200
        tok2 = r5.json()["dev_reset_link"].split("token=")[-1]
        r6 = http.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": tok2, "password": ADMIN_PASSWORD},
            timeout=20,
        )
        assert r6.status_code == 200, r6.text

        # 6. Confirm restoration
        r7 = http.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=20,
        )
        assert r7.status_code == 200, "Admin password restoration FAILED"


# ============== Roblox Export ==============
def _get_or_make_completed_gen(http, headers):
    """Get a completed generation for admin, generating via demo if needed."""
    r = http.get(f"{BASE_URL}/api/me/generations", headers=headers, timeout=15)
    if r.status_code == 200:
        for g in r.json().get("items", []):
            if g.get("status") == "completed" and g.get("model_url"):
                return g
    # Fall back: kick off via text-to-3d
    rc = http.post(
        f"{BASE_URL}/api/generate/text-to-3d",
        headers=headers,
        json={"prompt": "export test crown", "attachment_type": "Hat", "style": "auto"},
        timeout=30,
    )
    assert rc.status_code == 200, rc.text
    gid = rc.json()["id"]
    # Poll up to 60s for completion (demo ~4s; live can be 2-3min so skip if pending)
    for _ in range(20):
        time.sleep(3)
        g = http.get(f"{BASE_URL}/api/generate/{gid}", headers=headers, timeout=15)
        if g.status_code == 200 and g.json().get("status") == "completed":
            return g.json()
    pytest.skip("No completed generation available for export test (live fal.ai slow)")


class TestRobloxExport:
    @pytest.fixture(scope="class")
    def completed_gen(self, http, admin_headers):
        return _get_or_make_completed_gen(http, admin_headers)

    def test_manifest(self, http, admin_headers, completed_gen):
        gid = completed_gen["id"]
        r = http.get(f"{BASE_URL}/api/export/{gid}/manifest", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for key in (
            "asset_name", "attachment_type", "attachment_point",
            "recommended_price_robux", "category", "files", "upload_instructions",
        ):
            assert key in d, f"manifest missing {key}: {d}"
        assert isinstance(d["upload_instructions"], list) and len(d["upload_instructions"]) >= 3
        assert "glb_url" in d["files"]

    def test_checklist(self, http, admin_headers, completed_gen):
        gid = completed_gen["id"]
        r = http.get(f"{BASE_URL}/api/export/{gid}/checklist", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checks" in d and isinstance(d["checks"], list) and len(d["checks"]) >= 3
        assert d.get("passed") is True
        assert "polygon_budget" in d

    def test_glb_download(self, http, admin_headers, completed_gen):
        gid = completed_gen["id"]
        r = http.get(
            f"{BASE_URL}/api/export/{gid}/glb",
            headers=admin_headers,
            timeout=60,
            stream=True,
        )
        assert r.status_code == 200, r.text[:200]
        ct = r.headers.get("content-type", "")
        cd = r.headers.get("content-disposition", "")
        assert "model/gltf-binary" in ct or "gltf" in ct, f"unexpected content-type: {ct}"
        assert "attachment" in cd and ".glb" in cd, f"unexpected disposition: {cd}"
        # consume a small chunk
        chunk = next(r.iter_content(1024), None)
        assert chunk is not None and len(chunk) > 0

    def test_export_others_403(self, http, user_b, completed_gen):
        """A non-admin who does not own the generation gets 403."""
        gid = completed_gen["id"]
        hb = {"Authorization": f"Bearer {user_b['token']}"}
        r = http.get(f"{BASE_URL}/api/export/{gid}/manifest", headers=hb, timeout=15)
        assert r.status_code == 403, r.text

    def test_export_pending_400(self, http, user_b):
        """A pending generation should not be exportable (400)."""
        hb = {"Authorization": f"Bearer {user_b['token']}"}
        rc = http.post(
            f"{BASE_URL}/api/generate/text-to-3d",
            headers=hb,
            json={"prompt": "pending export test", "attachment_type": "Hat", "style": "auto"},
            timeout=30,
        )
        assert rc.status_code == 200, rc.text
        gid = rc.json()["id"]
        # Try immediately — should still be pending (demo waits ~4s)
        r = http.get(f"{BASE_URL}/api/export/{gid}/manifest", headers=hb, timeout=15)
        # Either pending → 400, or already completed (race) → 200; accept 400 expected
        if r.status_code == 200:
            pytest.skip("Generation completed too fast to test pending-400 branch")
        assert r.status_code == 400, r.text

    def test_export_nonexistent_404(self, http, admin_headers):
        r = http.get(
            f"{BASE_URL}/api/export/507f1f77bcf86cd799439011/manifest",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 404


# ============== Live fal.ai (optional, do not fail on timeout) ==============
class TestLiveFal:
    def test_fal_kickoff_demo_mode_false(self, http, admin_headers):
        """Verify text-to-3d with FAL_KEY set returns demo_mode=false."""
        # Check meta first
        m = http.get(f"{BASE_URL}/api/meta", timeout=15)
        assert m.status_code == 200
        if not m.json().get("fal_configured"):
            pytest.skip("FAL not configured in /api/meta")

        r = http.post(
            f"{BASE_URL}/api/generate/text-to-3d",
            headers=admin_headers,
            json={"prompt": "glowing red demon hoodie", "attachment_type": "Hoodie", "style": "auto"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "pending"
        # demo_mode could be omitted; if present must be False when FAL_KEY is set
        if "demo_mode" in d:
            assert d["demo_mode"] is False, f"Expected live mode, got demo_mode=True: {d}"
        gid = d["id"]

        # Poll lightly — up to 60s only, real fal.ai may take 2-3 min so allow skip
        completed = None
        for _ in range(10):
            time.sleep(6)
            g = http.get(f"{BASE_URL}/api/generate/{gid}", headers=admin_headers, timeout=20)
            if g.status_code == 200 and g.json().get("status") == "completed":
                completed = g.json()
                break
            if g.status_code == 200 and g.json().get("status") == "failed":
                pytest.fail(f"Live fal.ai generation failed: {g.json()}")
        if not completed:
            pytest.skip("Live fal.ai generation still pending after 60s (acceptable per request)")
        # If completed, sanity-check the model_url
        url = completed.get("model_url", "")
        assert url.startswith("http"), f"Bad model_url: {url}"
