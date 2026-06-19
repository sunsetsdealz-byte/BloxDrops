"""Regression: the /api/generations/{id}/rig endpoint must be mounted and
require auth. Real Meshy rigging is gated behind FAL_KEY + a completed
generation owned by the caller, so we only smoke-test the auth/404 paths
here (the actual fal.ai call is exercised separately during manual QA).
"""
import os
import httpx
import pytest


BASE = os.environ.get("BACKEND_URL", "http://localhost:8001")


@pytest.mark.asyncio
async def test_rig_endpoint_requires_auth():
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{BASE}/api/generations/000000000000000000000000/rig")
    assert r.status_code == 401, f"Expected 401 unauthorized, got {r.status_code}: {r.text}"


@pytest.mark.asyncio
async def test_rig_endpoint_404_on_missing_gen(monkeypatch):
    """With a valid JWT but non-existent generation_id, should 404."""
    # Skipped in CI unless TEST_JWT env is set
    token = os.environ.get("TEST_JWT")
    if not token:
        pytest.skip("Set TEST_JWT to run authenticated path")
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/api/generations/000000000000000000000000/rig",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert r.status_code == 404
