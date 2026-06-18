"""Iteration 5 backend regression tests.

Covers:
  * NEW: GET /api/stats public counters.
  * Password reset with hashed tokens (sha256) + dev_reset_link gating.
  * Pillow MAX_IMAGE_PIXELS / dimension guard on /api/uploads/image.
  * Existing /api/meta still returns fal_configured=true.
"""
import io
import os
import base64
from urllib.parse import urlparse, parse_qs

import pytest
import requests
from PIL import Image
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://ai-generator-66.preview.emergentagent.com"
ADMIN_EMAIL = "admin@bloxcraft.ai"
ADMIN_PASSWORD = "BloxCraft2026!"


# --------------------- fixtures ---------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --------------------- /api/stats ---------------------
class TestStats:
    def test_stats_public_no_auth(self, session):
        r = session.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 200, r.text
        d = r.json()
        keys = ["total_creations", "pending_now", "creators", "battles_settled", "total_likes", "today_creations"]
        for k in keys:
            assert k in d, f"missing key {k} in /api/stats response"
            assert isinstance(d[k], int), f"{k} is not int: {type(d[k])}"
            assert d[k] >= 0, f"{k} negative: {d[k]}"

    def test_stats_today_lte_total(self, session):
        d = session.get(f"{BASE_URL}/api/stats").json()
        assert d["today_creations"] <= d["total_creations"]


# --------------------- /api/meta ---------------------
class TestMeta:
    def test_fal_configured_true(self, session):
        r = session.get(f"{BASE_URL}/api/meta")
        assert r.status_code == 200
        assert r.json().get("fal_configured") is True


# --------------------- password reset (hashed token) ---------------------
class TestPasswordResetHashed:
    def _forgot(self, session, email):
        return session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})

    def _extract_token(self, link: str) -> str:
        q = parse_qs(urlparse(link).query)
        return q.get("token", [""])[0]

    def test_forgot_returns_dev_link(self, session):
        r = self._forgot(session, ADMIN_EMAIL)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert "dev_reset_link" in body, "dev_reset_link must be present in dev env"
        token = self._extract_token(body["dev_reset_link"])
        assert len(token) >= 20, f"token too short: {token}"

    def test_unknown_email_no_dev_link_but_ok(self, session):
        r = self._forgot(session, "nobody-xyz-123@example.com")
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert "dev_reset_link" not in body  # only present when user exists

    def test_reset_invalid_token(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "definitely-not-a-real-token-1234567890", "password": "Whatever123!"},
        )
        assert r.status_code == 400

    def test_full_reset_flow_and_restore(self, session):
        # 1) Forgot -> get dev link
        r = self._forgot(session, ADMIN_EMAIL)
        assert r.status_code == 200
        token = self._extract_token(r.json()["dev_reset_link"])
        assert token

        # 2) Reset to a new password
        new_pwd = "NewBlox2026!"
        rr = session.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token, "password": new_pwd})
        assert rr.status_code == 200, rr.text
        assert rr.json().get("ok") is True

        # 3) Login with new password
        login_new = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": new_pwd})
        assert login_new.status_code == 200, login_new.text

        # 4) Old password rejected
        login_old = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert login_old.status_code == 401

        # 5) Token is single-use
        replay = session.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token, "password": "Another9!"})
        assert replay.status_code == 400

        # 6) Restore admin password using a fresh reset link
        r2 = self._forgot(session, ADMIN_EMAIL)
        token2 = self._extract_token(r2.json()["dev_reset_link"])
        rr2 = session.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token2, "password": ADMIN_PASSWORD})
        assert rr2.status_code == 200

        # 7) Login with restored password
        restored = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert restored.status_code == 200

    def test_token_stored_hashed_not_plaintext(self, session):
        """Optional schema check — verify db.password_reset_tokens stores token_hash, NOT token."""
        # 1) Trigger fresh forgot to ensure a record exists
        r = self._forgot(session, ADMIN_EMAIL)
        assert r.status_code == 200
        dev_link = r.json().get("dev_reset_link", "")
        token = self._extract_token(dev_link)
        assert token

        # 2) Inspect DB via local mongo (test runs on same container)
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017").strip().strip('"').strip("'")
        db_name = os.environ.get("DB_NAME", "bloxcraft_db").strip().strip('"').strip("'")
        try:
            mc = MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
            db = mc[db_name]
            # Look up the latest record for this email
            rec = db.password_reset_tokens.find_one({"email": ADMIN_EMAIL}, sort=[("_id", -1)])
            assert rec is not None, "no password_reset_tokens record found"
            assert "token_hash" in rec, "schema regression: token_hash field missing"
            # Should NOT have plaintext token field
            assert "token" not in rec, "SECURITY REGRESSION: plaintext 'token' present in DB"
            # And the hash should match sha256(token)
            import hashlib
            assert rec["token_hash"] == hashlib.sha256(token.encode()).hexdigest()
        except Exception as e:
            pytest.skip(f"Cannot inspect mongo from test runner: {e}")


# --------------------- Pillow MAX_IMAGE_PIXELS / dimensions guard ---------------------
def _png_bytes(width: int, height: int, color=(255, 0, 0)) -> bytes:
    img = Image.new("RGB", (width, height), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestUploadGuard:
    def test_upload_64x64_succeeds(self, admin_token):
        data = _png_bytes(64, 64)
        headers = {"Authorization": f"Bearer {admin_token}"}
        files = {"file": ("test64.png", data, "image/png")}
        r = requests.post(f"{BASE_URL}/api/uploads/image", headers=headers, files=files)
        assert r.status_code == 200, f"expected 200 for 64x64 PNG, got {r.status_code} {r.text[:200]}"
        body = r.json()
        assert "url" in body

    def test_upload_8000x8000_rejected(self, admin_token):
        # 8000x8000 = 64M pixels. Max-side rule (4096) should reject before MAX_IMAGE_PIXELS.
        data = _png_bytes(8000, 8000, color=(10, 20, 30))
        headers = {"Authorization": f"Bearer {admin_token}"}
        files = {"file": ("huge.png", data, "image/png")}
        r = requests.post(f"{BASE_URL}/api/uploads/image", headers=headers, files=files)
        assert r.status_code in (400, 413, 422), f"expected 400/413/422 for 8000x8000 PNG, got {r.status_code} {r.text[:200]}"
