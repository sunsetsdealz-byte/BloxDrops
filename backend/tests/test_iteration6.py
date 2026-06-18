"""Iteration 6 — Roblox Open Cloud direct push backend tests.

Covers POST /api/roblox/connect, GET /api/roblox/status, DELETE /api/roblox/disconnect,
and POST /api/roblox/upload/{generation_id} error pathways.

For upload we use a FAKEKEY → we only verify that the route forwards
to Roblox and bubbles 401/403/502 cleanly (this is the documented spec).
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to frontend .env file
    try:
        with open("/app/frontend/.env") as f:
            for ln in f:
                if ln.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = ln.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

ADMIN_EMAIL = "admin@bloxcraft.ai"
ADMIN_PWD = "BloxCraft2026!"
FAKEKEY = "FAKEKEY1234567890"
ROBLOX_UID = "12345"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PWD},
                      timeout=15)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ensure disconnected state before tests
@pytest.fixture(scope="module", autouse=True)
def _reset(auth_headers):
    requests.delete(f"{BASE_URL}/api/roblox/disconnect", headers=auth_headers, timeout=10)
    yield
    requests.delete(f"{BASE_URL}/api/roblox/disconnect", headers=auth_headers, timeout=10)


class TestRobloxAuthAndValidation:
    def test_connect_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/roblox/connect",
                          json={"api_key": FAKEKEY, "roblox_user_id": ROBLOX_UID}, timeout=10)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}: {r.text}"

    def test_status_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/roblox/status", timeout=10)
        assert r.status_code in (401, 403)

    def test_disconnect_requires_auth(self):
        r = requests.delete(f"{BASE_URL}/api/roblox/disconnect", timeout=10)
        assert r.status_code in (401, 403)

    def test_connect_validates_non_numeric_user_id(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/roblox/connect",
                          json={"api_key": FAKEKEY, "roblox_user_id": "abc"},
                          headers=auth_headers, timeout=10)
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"

    def test_connect_validates_short_api_key(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/roblox/connect",
                          json={"api_key": "short", "roblox_user_id": ROBLOX_UID},
                          headers=auth_headers, timeout=10)
        assert r.status_code == 422


class TestRobloxLifecycle:
    def test_status_before_connect(self, auth_headers):
        # ensure disconnected
        requests.delete(f"{BASE_URL}/api/roblox/disconnect", headers=auth_headers, timeout=10)
        r = requests.get(f"{BASE_URL}/api/roblox/status", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data == {"connected": False}, data

    def test_connect_returns_masked_key_only(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/roblox/connect",
                          json={"api_key": FAKEKEY, "roblox_user_id": ROBLOX_UID},
                          headers=auth_headers, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["roblox_user_id"] == ROBLOX_UID
        assert data["key_masked"] == "FAKE••••7890"
        # raw key must NEVER appear in response
        assert FAKEKEY not in r.text

    def test_status_after_connect(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/roblox/status", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["connected"] is True
        assert data["roblox_user_id"] == ROBLOX_UID
        assert data["key_masked"] == "FAKE••••7890"
        assert "connected_at" in data
        # raw key not leaked
        assert FAKEKEY not in r.text

    def test_disconnect_clears_state(self, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/roblox/disconnect", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json() == {"ok": True}
        # status should now be disconnected
        r2 = requests.get(f"{BASE_URL}/api/roblox/status", headers=auth_headers, timeout=10)
        assert r2.status_code == 200
        assert r2.json() == {"connected": False}


class TestRobloxUploadErrorPaths:
    def test_upload_without_connection(self, auth_headers):
        # make sure we are disconnected
        requests.delete(f"{BASE_URL}/api/roblox/disconnect", headers=auth_headers, timeout=10)
        # need a completed generation that belongs to admin — easiest is to call
        # with an obviously-fake id and expect 404, since 400 is only reached
        # after gen lookup. We test all-three-errors using fake IDs anyway.
        r = requests.post(f"{BASE_URL}/api/roblox/upload/507f1f77bcf86cd799439011",
                          headers=auth_headers, timeout=15)
        # 404 (gen not found) is what we expect for a random id
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text}"

    def test_upload_nonexistent_generation(self, auth_headers):
        # connect first so we'd otherwise pass the creds check
        requests.post(f"{BASE_URL}/api/roblox/connect",
                      json={"api_key": FAKEKEY, "roblox_user_id": ROBLOX_UID},
                      headers=auth_headers, timeout=10)
        r = requests.post(f"{BASE_URL}/api/roblox/upload/507f1f77bcf86cd799439011",
                          headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_upload_invalid_object_id(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/roblox/upload/not-a-valid-id",
                          headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_upload_completed_gen_hits_roblox_and_bubbles_error(self, auth_headers):
        """If we can find one of admin's completed generations with a thumbnail,
        upload must reach apis.roblox.com and return 401/403/502 because FAKEKEY
        is bogus.  If admin has no completed generations, we skip."""
        # ensure connected
        requests.post(f"{BASE_URL}/api/roblox/connect",
                      json={"api_key": FAKEKEY, "roblox_user_id": ROBLOX_UID},
                      headers=auth_headers, timeout=10)

        # find a completed generation owned by admin
        gen_id = None
        try:
            r = requests.get(f"{BASE_URL}/api/generations/mine?limit=50",
                             headers=auth_headers, timeout=15)
            if r.status_code == 200:
                items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
                for g in items:
                    if g.get("status") == "completed" and g.get("thumbnail_url"):
                        gen_id = g.get("id") or g.get("_id")
                        break
        except Exception:
            pass

        if not gen_id:
            pytest.skip("no completed admin generation with thumbnail to test against")

        r = requests.post(f"{BASE_URL}/api/roblox/upload/{gen_id}",
                          headers=auth_headers, timeout=90)
        # We expect Roblox to reject FAKEKEY → our handler returns 401/403/502
        assert r.status_code in (401, 403, 502), f"got {r.status_code}: {r.text}"
        # the raw key must not leak in error responses
        assert FAKEKEY not in r.text
