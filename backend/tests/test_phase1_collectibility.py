"""Iteration 7 — Phase 1 NFT-like collectibility (editions, rarity, signed drops).

Tests:
- Auth: register + login
- POST /api/generate/text-to-3d accepts edition_cap=[0,1,10,50,100] and sanitizes invalid values to 0
- GET /api/generate/{id} returns: edition_cap, edition_number=1, editions_minted=1,
  mint_id (32-hex), signature_hash (32-hex), rarity_tier, rarity_label, rarity_color,
  rarity_score, is_founder_signed
- GET /api/feed | /api/me/generations | /api/leaderboard items enriched with drop fields
- GET /api/battle/random both contenders enriched
- Admin gens are is_founder_signed=true; non-admin user gens are is_founder_signed=false
- Rarity tier computation: 1-of-1 zero engagement -> epic; unlimited zero engagement -> common;
  high-engagement standard drop -> legendary
"""
import os
import re
import uuid
import time
import pytest
import requests

# Load frontend/.env so REACT_APP_BACKEND_URL is available when running pytest from CLI
def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if url:
        return url.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except FileNotFoundError:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()
ADMIN_EMAIL = "admin@bloxdrops.com"
ADMIN_PASSWORD = "BloxDrops2026!"

HEX32 = re.compile(r"^[0-9a-f]{32}$")
RARITY_TIERS = {"common", "rare", "epic", "legendary", "mythic"}


# ============== Fixtures ==============
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def test_user(session):
    """Register a brand-new user and return user info + token."""
    email = f"TEST_phase1_{uuid.uuid4().hex[:8]}@example.com"
    pw = "TestPass123!"
    name = "Phase1 Tester"
    r = session.post(f"{BASE_URL}/api/auth/register",
                     json={"email": email, "password": pw, "name": name}, timeout=20)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return {"email": email, "password": pw, "token": data["access_token"], "user": data["user"]}


@pytest.fixture(scope="module")
def user_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}"}


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"admin login failed {r.status_code}: {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ============== Helpers ==============
def _create_gen(session, headers, edition_cap, prompt_suffix=""):
    body = {
        "prompt": f"phase1 test {prompt_suffix} {uuid.uuid4().hex[:6]}",
        "attachment_type": "Hat",
        "style": "cyberpunk",
        "edition_cap": edition_cap,
    }
    r = session.post(f"{BASE_URL}/api/generate/text-to-3d", json=body, headers=headers, timeout=20)
    return r


def _assert_drop_fields(item, expected_cap=None, require_strict_signature=True):
    # Required drop fields
    assert "edition_cap" in item, f"missing edition_cap in {item}"
    if expected_cap is not None:
        assert item["edition_cap"] == expected_cap, f"expected cap {expected_cap} got {item['edition_cap']}"
    assert "edition_number" in item
    assert "editions_minted" in item
    assert "mint_id" in item and item["mint_id"], "mint_id missing/empty"
    assert "rarity_tier" in item and item["rarity_tier"] in RARITY_TIERS
    assert "rarity_label" in item
    assert "rarity_color" in item
    assert "rarity_score" in item
    assert "is_founder_signed" in item


# ============== Auth ==============
class TestAuth:
    def test_register_returns_token(self, test_user):
        assert "token" in test_user
        assert len(test_user["token"]) > 20

    def test_login_returns_token(self, session, test_user):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": test_user["email"], "password": test_user["password"]},
                         timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"].lower() == test_user["email"].lower()


# ============== Edition Cap Acceptance ==============
class TestEditionCapAcceptance:
    @pytest.mark.parametrize("cap", [0, 1, 10, 50, 100])
    def test_create_with_valid_edition_cap(self, session, user_headers, cap):
        r = _create_gen(session, user_headers, cap, prompt_suffix=f"cap{cap}")
        assert r.status_code == 200, f"cap={cap} failed: {r.status_code} {r.text}"
        data = r.json()
        assert "id" in data
        assert data["status"] == "pending"

    def test_create_with_invalid_edition_cap_sanitizes_to_zero(self, session, user_headers):
        """edition_cap=999 (not whitelisted) should be sanitized to 0 (unlimited)."""
        r = _create_gen(session, user_headers, 999, prompt_suffix="invalid")
        assert r.status_code == 200, f"invalid cap should not error: {r.status_code} {r.text}"
        gen_id = r.json()["id"]
        # Verify it was persisted as 0
        g = session.get(f"{BASE_URL}/api/generate/{gen_id}", headers=user_headers, timeout=15)
        assert g.status_code == 200
        assert g.json()["edition_cap"] == 0


# ============== GET /generate/{id} enrichment ==============
class TestGetGenerationEnrichment:
    @pytest.fixture(scope="class")
    def created_gen(self, session, user_headers):
        r = _create_gen(session, user_headers, 1, prompt_suffix="1of1")
        assert r.status_code == 200
        return r.json()["id"]

    def test_get_generation_has_all_drop_fields(self, session, user_headers, created_gen):
        r = session.get(f"{BASE_URL}/api/generate/{created_gen}", headers=user_headers, timeout=15)
        assert r.status_code == 200
        item = r.json()
        _assert_drop_fields(item, expected_cap=1)
        # Strict checks for freshly created gen
        assert item["edition_number"] == 1
        assert item["editions_minted"] == 1
        assert HEX32.match(item["mint_id"]), f"mint_id not 32-hex: {item['mint_id']}"
        assert "signature_hash" in item
        assert HEX32.match(item["signature_hash"]), f"signature_hash not 32-hex: {item['signature_hash']}"

    def test_non_admin_user_gen_not_founder_signed(self, session, user_headers, created_gen):
        r = session.get(f"{BASE_URL}/api/generate/{created_gen}", headers=user_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["is_founder_signed"] is False

    def test_1of1_zero_engagement_is_epic(self, session, user_headers, created_gen):
        r = session.get(f"{BASE_URL}/api/generate/{created_gen}", headers=user_headers, timeout=15)
        assert r.status_code == 200
        item = r.json()
        assert item["edition_cap"] == 1
        assert item["rarity_score"] == 0
        assert item["rarity_tier"] == "epic", f"1of1 zero-engagement should be epic, got {item['rarity_tier']}"

    def test_unlimited_zero_engagement_is_common(self, session, user_headers):
        r = _create_gen(session, user_headers, 0, prompt_suffix="unlimited")
        assert r.status_code == 200
        gen_id = r.json()["id"]
        g = session.get(f"{BASE_URL}/api/generate/{gen_id}", headers=user_headers, timeout=15)
        assert g.status_code == 200
        item = g.json()
        assert item["edition_cap"] == 0
        assert item["rarity_tier"] == "common", f"unlimited zero-engagement should be common, got {item['rarity_tier']}"


# ============== Admin signing ==============
class TestAdminSigning:
    def test_admin_gen_is_founder_signed(self, session, admin_headers):
        r = _create_gen(session, admin_headers, 10, prompt_suffix="adminsigned")
        assert r.status_code == 200, f"admin create failed: {r.status_code} {r.text}"
        gen_id = r.json()["id"]
        g = session.get(f"{BASE_URL}/api/generate/{gen_id}", headers=admin_headers, timeout=15)
        assert g.status_code == 200
        item = g.json()
        assert item["is_founder_signed"] is True, "admin-created gen must have is_founder_signed=True"


# ============== Read endpoints enrichment ==============
class TestFeedEnrichment:
    def test_feed_items_enriched(self, session):
        r = session.get(f"{BASE_URL}/api/feed?limit=5", timeout=15)
        assert r.status_code == 200
        data = r.json()
        items = data.get("items", [])
        if not items:
            pytest.skip("feed empty — no completed gens yet")
        for it in items:
            assert "rarity_tier" in it, f"feed item missing rarity_tier: keys={list(it.keys())}"
            assert it["rarity_tier"] in RARITY_TIERS
            assert "rarity_label" in it
            assert "edition_cap" in it
            assert "edition_number" in it
            assert "mint_id" in it and it["mint_id"], "mint_id missing in feed item"


class TestMyGenerationsEnrichment:
    def test_my_generations_enriched(self, session, user_headers):
        r = session.get(f"{BASE_URL}/api/me/generations", headers=user_headers, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert len(items) >= 1, "user should have at least 1 gen from earlier tests"
        for it in items:
            assert "rarity_tier" in it
            assert "edition_cap" in it
            assert "mint_id" in it and it["mint_id"]
            assert "is_founder_signed" in it


class TestLeaderboardEnrichment:
    def test_leaderboard_items_enriched(self, session):
        r = session.get(f"{BASE_URL}/api/leaderboard", timeout=15)
        assert r.status_code == 200
        items = r.json().get("items", [])
        if not items:
            pytest.skip("no completed gens on leaderboard")
        for it in items:
            assert "rarity_tier" in it
            assert "rarity_label" in it
            assert "edition_cap" in it


class TestBattleRandomEnrichment:
    def test_battle_both_contenders_enriched(self, session, user_headers):
        r = session.get(f"{BASE_URL}/api/battle/random", headers=user_headers, timeout=15)
        if r.status_code == 404:
            pytest.skip("not enough completed gens for battle")
        assert r.status_code == 200
        data = r.json()
        for side in ("a", "b"):
            it = data[side]
            assert "rarity_tier" in it, f"{side} missing rarity_tier"
            assert "edition_cap" in it
            assert "mint_id" in it and it["mint_id"]


# ============== Legacy backfill (high engagement) ==============
class TestRarityComputation:
    def test_high_engagement_standard_drop_is_legendary_via_db(self):
        """Simulate legacy doc with likes=50 and edition_cap=0 -> compute_rarity_tier should be legendary."""
        import importlib.util, sys, os as _os
        path = "/app/backend/drops_utils.py"
        spec = importlib.util.spec_from_file_location("drops_utils", path)
        mod = importlib.util.module_from_spec(spec)
        sys.modules["drops_utils"] = mod
        spec.loader.exec_module(mod)
        # standard drop (unlimited), 50 likes -> score=50 -> legendary
        doc = {"likes": 50, "battle_wins": 0, "remix_count": 0, "edition_cap": 0}
        assert mod.compute_rarity_tier(doc) == "legendary"

        # 1-of-1 zero engagement -> epic
        assert mod.compute_rarity_tier({"likes": 0, "edition_cap": 1}) == "epic"

        # unlimited zero engagement -> common
        assert mod.compute_rarity_tier({"likes": 0, "edition_cap": 0}) == "common"

        # legacy doc with no edition_cap field: enrich should default to 0/unlimited
        legacy = {"id": "abc-def-123", "likes": 0, "battle_wins": 0, "remix_count": 0}
        enriched = mod.enrich_drop(dict(legacy))
        assert enriched["edition_cap"] == 0
        assert enriched["edition_number"] == 1
        assert enriched["editions_minted"] == 1
        assert enriched["mint_id"]  # backfilled
        assert enriched["rarity_tier"] == "common"
