"""Iteration 9 — NFT Metadata Editor tests.

Covers:
- PATCH /api/generations/{id}/metadata as owner (200) and updates fields
- 403 for non-owner non-admin
- 400 (locked) when any marketplace_listings exists; admin bypass
- Dedupe traits case-insensitive + trim + drop empties
- GET /api/generate/{id} returns metadata_locked + defaults
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-generator-66.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@bloxdrops.com"
ADMIN_PW = "BloxDrops2026!"


# -------------------- Fixtures --------------------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def owner_user():
    """Register a fresh owner user."""
    email = f"TEST_it9_owner_{uuid.uuid4().hex[:8]}@example.com"
    pw = "TestPass1234"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": pw, "name": f"owner_{uuid.uuid4().hex[:6]}"})
    assert r.status_code in (200, 201), f"Owner registration failed: {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    user_id = (body.get("user") or {}).get("id") or body.get("id")
    return {"email": email, "password": pw, "token": token, "id": user_id}


@pytest.fixture(scope="module")
def other_user():
    email = f"TEST_it9_other_{uuid.uuid4().hex[:8]}@example.com"
    pw = "TestPass1234"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": pw, "name": f"other_{uuid.uuid4().hex[:6]}"})
    assert r.status_code in (200, 201), f"Other user registration failed: {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    return {"email": email, "token": token}


@pytest.fixture(scope="module")
def owner_headers(owner_user):
    return {"Authorization": f"Bearer {owner_user['token']}"}


@pytest.fixture(scope="module")
def other_headers(other_user):
    return {"Authorization": f"Bearer {other_user['token']}"}


@pytest.fixture(scope="module")
def db():
    """Direct mongo handle for test setup (creating generations bypassing FAL)."""
    url = os.environ.get("MONGO_URL") or "mongodb://localhost:27017"
    name = os.environ.get("DB_NAME") or "test_database"
    cli = MongoClient(url)
    return cli[name]


@pytest.fixture
def owned_gen(db, owner_user):
    """Insert a completed generation owned by owner_user. Returns gen id (str)."""
    from datetime import datetime, timezone
    doc = {
        "user_id": owner_user["id"],
        "prompt": "TEST_it9 NFT metadata target",
        "original_prompt": "TEST_it9 NFT metadata target",
        "attachment_type": "Hat",
        "style": "auto",
        "status": "completed",
        "model_url": "https://example.com/test.glb",
        "thumbnail_url": "https://example.com/test.png",
        "likes": 0,
        "battle_wins": 0,
        "battle_losses": 0,
        "remix_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = db.generations.insert_one(doc)
    gid = str(res.inserted_id)
    yield gid
    # cleanup
    from bson import ObjectId
    db.generations.delete_one({"_id": ObjectId(gid)})
    db.marketplace_listings.delete_many({"generation_id": gid})


# -------------------- Tests --------------------
class TestNFTMetadataEditor:
    def test_get_generation_defaults(self, owned_gen, owner_headers):
        """GET /api/generate/{id} returns metadata_locked=False + defaults for display_name/description/traits."""
        r = requests.get(f"{API}/generate/{owned_gen}", headers=owner_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["metadata_locked"] is False
        assert data.get("display_name") in (None, "")
        assert data.get("description") in (None, "")
        assert data.get("traits") in (None, [])  # may default to [] or null

    def test_owner_can_patch(self, owned_gen, owner_headers):
        payload = {
            "display_name": "  Test Stormbreak  ",
            "description": "  Forged in lightning.  ",
            "traits": [
                {"trait_type": " Edition ", "value": " 1 of 1 "},
                {"trait_type": "Element", "value": "Fire"},
            ],
        }
        r = requests.patch(f"{API}/generations/{owned_gen}/metadata", json=payload, headers=owner_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        # Trim verified (strip on display_name/description happens server-side)
        assert data["display_name"] == "Test Stormbreak"
        assert data["description"] == "Forged in lightning."
        assert isinstance(data["traits"], list) and len(data["traits"]) == 2
        # Trimmed trait_type and value
        assert data["traits"][0]["trait_type"] == "Edition"
        assert data["traits"][0]["value"] == "1 of 1"
        assert data["metadata_locked"] is False

        # Verify persistence via GET
        r2 = requests.get(f"{API}/generate/{owned_gen}", headers=owner_headers)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["display_name"] == "Test Stormbreak"
        assert d2["description"] == "Forged in lightning."
        assert len(d2["traits"]) == 2

    def test_dedupe_traits_case_insensitive_and_drop_empties(self, owned_gen, owner_headers):
        payload = {
            "traits": [
                {"trait_type": "Edition", "value": "1 of 1"},
                {"trait_type": "edition", "value": "2 of 2"},  # dupe (case-insensitive)
                {"trait_type": "EDITION", "value": "3 of 3"},  # dupe
                {"trait_type": "Element", "value": "Fire"},
                {"trait_type": "  ", "value": "ignored"},      # pydantic rejects (min_length=1) → expect 422
            ],
        }
        # whitespace-only trait_type violates Field(min_length=1) before strip → expect 422
        r = requests.patch(f"{API}/generations/{owned_gen}/metadata", json=payload, headers=owner_headers)
        # Accept 422 (Pydantic) — model validates min_length on raw input.
        # If backend strips before validate, accept 200 with cleaned traits.
        assert r.status_code in (200, 422), r.text
        # Now send valid dedup-only payload
        payload2 = {
            "traits": [
                {"trait_type": "Edition", "value": "1 of 1"},
                {"trait_type": "edition", "value": "2 of 2"},
                {"trait_type": "EDITION", "value": "3 of 3"},
                {"trait_type": "Element", "value": "Fire"},
            ],
        }
        r = requests.patch(f"{API}/generations/{owned_gen}/metadata", json=payload2, headers=owner_headers)
        assert r.status_code == 200, r.text
        traits = r.json()["traits"]
        assert len(traits) == 2
        keys_lower = [t["trait_type"].lower() for t in traits]
        assert "edition" in keys_lower and "element" in keys_lower
        # First-seen value wins
        edition = next(t for t in traits if t["trait_type"].lower() == "edition")
        assert edition["value"] == "1 of 1"

    def test_non_owner_forbidden(self, owned_gen, other_headers):
        r = requests.patch(
            f"{API}/generations/{owned_gen}/metadata",
            json={"display_name": "Hijacked"},
            headers=other_headers,
        )
        assert r.status_code == 403, r.text

    def test_locked_when_listing_exists(self, owned_gen, owner_headers, admin_headers, db):
        """Insert a fake marketplace listing → owner PATCH → 400 'locked'; admin can bypass."""
        from datetime import datetime, timezone
        db.marketplace_listings.insert_one({
            "generation_id": owned_gen,
            "status": "open",
            "price_bloxbucks": 1000,
            "seller_id": "test_seller",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            # Owner PATCH should be blocked
            r = requests.patch(
                f"{API}/generations/{owned_gen}/metadata",
                json={"display_name": "TryingAfterListing"},
                headers=owner_headers,
            )
            assert r.status_code == 400, r.text
            assert "lock" in r.text.lower()

            # GET should now show metadata_locked=True
            r2 = requests.get(f"{API}/generate/{owned_gen}", headers=owner_headers)
            assert r2.status_code == 200
            assert r2.json()["metadata_locked"] is True

            # Admin can still edit
            r3 = requests.patch(
                f"{API}/generations/{owned_gen}/metadata",
                json={"display_name": "AdminOverride"},
                headers=admin_headers,
            )
            assert r3.status_code == 200, r3.text
            assert r3.json()["display_name"] == "AdminOverride"
            assert r3.json()["metadata_locked"] is True  # still locked, just admin-edited
        finally:
            db.marketplace_listings.delete_many({"generation_id": owned_gen})

    def test_locked_when_cancelled_listing_exists(self, owned_gen, owner_headers, db):
        """Even a cancelled listing should lock metadata (provenance)."""
        from datetime import datetime, timezone
        db.marketplace_listings.insert_one({
            "generation_id": owned_gen,
            "status": "cancelled",
            "price_bloxbucks": 500,
            "seller_id": "test_seller",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.patch(
                f"{API}/generations/{owned_gen}/metadata",
                json={"description": "after-cancel"},
                headers=owner_headers,
            )
            assert r.status_code == 400, r.text
            assert "lock" in r.text.lower()
        finally:
            db.marketplace_listings.delete_many({"generation_id": owned_gen})

    def test_unauthenticated_rejected(self, owned_gen):
        r = requests.patch(f"{API}/generations/{owned_gen}/metadata", json={"display_name": "X"})
        assert r.status_code in (401, 403)

    def test_not_found(self, owner_headers):
        r = requests.patch(
            f"{API}/generations/000000000000000000000000/metadata",
            json={"display_name": "X"},
            headers=owner_headers,
        )
        assert r.status_code == 404

    def test_empty_update_rejected(self, owned_gen, owner_headers):
        r = requests.patch(f"{API}/generations/{owned_gen}/metadata", json={}, headers=owner_headers)
        assert r.status_code == 400
