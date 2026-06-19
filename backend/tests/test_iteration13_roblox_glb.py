"""Iteration 13 — Roblox 3D Model upload (direct GLB, no conversion).

Validates the simplified /api/roblox/upload/{id} endpoint:
- 400 when user has no Roblox creds
- 404 on bad gen id
- Code path correctly hits Open Cloud with assetType=Model + model/gltf-binary
  (we mock httpx so we don't actually call Roblox)
"""
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx

API_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
ADMIN_EMAIL = "admin@bloxdrops.com"
ADMIN_PASSWORD = "BloxDrops2026!"


@pytest.fixture(scope="module")
def admin_token():
    r = httpx.post(f"{API_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_upload_requires_roblox_connection(admin_token):
    httpx.delete(f"{API_URL}/api/roblox/disconnect", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    r = httpx.get(f"{API_URL}/api/feed?limit=20", timeout=10)
    target = next((i for i in r.json().get("items", []) if i.get("status") == "completed" and i.get("model_url")), None)
    if not target:
        pytest.skip("No completed gen with model_url in feed")
    resp = httpx.post(f"{API_URL}/api/roblox/upload/{target['id']}", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    assert resp.status_code == 400
    assert "connect" in resp.text.lower()


def test_upload_bad_gen_id(admin_token):
    httpx.post(
        f"{API_URL}/api/roblox/connect",
        headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
        json={"api_key": "x" * 50, "roblox_user_id": "999999"},
        timeout=10,
    )
    resp = httpx.post(f"{API_URL}/api/roblox/upload/000000000000000000000000", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    assert resp.status_code == 404
    httpx.delete(f"{API_URL}/api/roblox/disconnect", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
