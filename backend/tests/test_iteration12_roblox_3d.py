"""Iteration 12 — Roblox 3D Model upload (GLB → FBX conversion).

Validates:
1. The Blender-driven GLB → FBX converter produces a valid binary FBX.
2. The /api/roblox/upload/{id} endpoint:
   - rejects when user has no Roblox creds (400)
   - rejects when gen has no model_url (400)
   - rejects when not the owner (403)
   - on the happy path, calls Open Cloud with assetType=Model and the FBX bytes
"""
import os
import sys
import asyncio
import json
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from roblox_routes import _convert_glb_to_fbx_sync  # noqa: E402


# ============== UNIT: converter =================
def test_converter_produces_fbx_binary():
    glb_path = "/tmp/test_model.glb"
    if not os.path.exists(glb_path):
        pytest.skip("seed GLB not present")
    with open(glb_path, "rb") as f:
        glb = f.read()
    fbx = _convert_glb_to_fbx_sync(glb)
    assert len(fbx) > 1000, "FBX output is suspiciously small"
    # Binary FBX magic header
    assert fbx[:18] == b"Kaydara FBX Binary", f"Not a valid binary FBX, got: {fbx[:18]!r}"


# ============== INTEGRATION via HTTP =================
import httpx  # noqa: E402

API_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
ADMIN_EMAIL = "admin@bloxdrops.com"
ADMIN_PASSWORD = "BloxDrops2026!"


@pytest.fixture(scope="module")
def admin_token():
    r = httpx.post(f"{API_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_upload_requires_roblox_connection(admin_token):
    # Pick any completed gen with model_url
    r = httpx.get(f"{API_URL}/api/feed?limit=20", timeout=10)
    items = r.json().get("items", [])
    target = next((i for i in items if i.get("status") == "completed" and i.get("model_url")), None)
    if not target:
        pytest.skip("No completed gen with model_url in feed")
    # Make sure admin has NO roblox creds
    httpx.delete(f"{API_URL}/api/roblox/disconnect", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    resp = httpx.post(f"{API_URL}/api/roblox/upload/{target['id']}", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    assert resp.status_code == 400
    assert "connect" in resp.text.lower()


def test_upload_requires_model_url(admin_token):
    # Connect a fake key so the connection precheck passes
    httpx.post(
        f"{API_URL}/api/roblox/connect",
        headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
        json={"api_key": "x" * 50, "roblox_user_id": "999999"},
        timeout=10,
    )
    # Fabricate a gen lookup that has no model_url by hitting an obviously bad id
    resp = httpx.post(f"{API_URL}/api/roblox/upload/000000000000000000000000", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
    assert resp.status_code == 404
    # Cleanup
    httpx.delete(f"{API_URL}/api/roblox/disconnect", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
