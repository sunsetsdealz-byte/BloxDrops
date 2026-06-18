"""BloxCraft AI — backend API tests.

Covers: health/meta, auth (register/login/me/lockout), generation (text-to-3d,
status polling, credits), prompt enhance, feed/like/remix, battle/vote,
leaderboard, challenges, pricing, Stripe checkout.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://ai-generator-66.preview.emergentagent.com"
).rstrip("/")

ADMIN_EMAIL = "admin@bloxcraft.ai"
ADMIN_PASSWORD = "BloxCraft2026!"
ORIGIN_URL = "https://ai-generator-66.preview.emergentagent.com"


# ============== Fixtures ==============
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def new_user(session):
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    pw = "secret12345"
    r = session.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": pw, "name": "Test User"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": pw, "token": data["access_token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(new_user):
    return {"Authorization": f"Bearer {new_user['token']}"}


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


# ============== Health & Meta ==============
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_meta(self, session):
        r = session.get(f"{BASE_URL}/api/meta", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "fal_configured" in d
        assert "plans" in d and len(d["plans"]) >= 2
        assert "styles" in d and isinstance(d["styles"], list)
        assert "attachment_types" in d and isinstance(d["attachment_types"], list)


# ============== Auth ==============
class TestAuth:
    def test_register_returns_token_credits(self, new_user):
        u = new_user["user"]
        assert u["plan"] == "free"
        assert u["credits"] == 20
        assert new_user["token"]

    def test_duplicate_register_400(self, session, new_user):
        r = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": new_user["email"], "password": "another1", "name": "Dup"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_login_success(self, session, new_user):
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": new_user["email"], "password": new_user["password"]},
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["user"]["email"] == new_user["email"]

    def test_login_wrong_password_401(self, session):
        # use a fresh user so we don't blow up other tests
        email = f"wp_{uuid.uuid4().hex[:8]}@example.com"
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "rightpass123", "name": "WP"},
            timeout=15,
        )
        r = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "wrong-pass"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_me_endpoint(self, session, auth_headers, new_user):
        r = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == new_user["email"]

    def test_me_no_token_401(self, session):
        s = requests.Session()  # no auth header
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_brute_force_lockout_429(self, session):
        """Verifies lockout triggers after 5 failures.

        NOTE: Lockout key = "{client_ip}:{email}". Behind the K8s ingress, the
        same external client may appear under 2+ different upstream IPs, which
        spreads attempts across multiple buckets and prevents the lock from
        triggering. We retry up to 12 times to give the ingress a chance to
        keep sending us to the same upstream IP. If 429 still never appears
        this is reported as a backend issue (lockout-bypass).
        """
        email = f"bf_{uuid.uuid4().hex[:8]}@example.com"
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "rightpass123", "name": "BF"},
            timeout=15,
        )
        codes = []
        for _ in range(12):
            r = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "wrong-pass"},
                timeout=15,
            )
            codes.append(r.status_code)
            if r.status_code == 429:
                break
        assert 429 in codes, (
            f"Expected 429 after repeated failures, got {codes}. "
            "Likely cause: lockout key uses request.client.host which varies "
            "across K8s ingress upstream IPs — partial brute-force bypass."
        )

    def test_admin_login(self, session, admin_token):
        # Validate admin profile via /me
        r = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=15,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["plan"] == "pro"
        assert d["credits"] >= 100


# ============== Generation ==============
class TestGeneration:
    def test_text_to_3d_flow_and_credit_deduct(self, session, auth_headers, new_user):
        # baseline credits
        me0 = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15).json()
        credits_before = me0["credits"]

        r = session.post(
            f"{BASE_URL}/api/generate/text-to-3d",
            headers=auth_headers,
            json={"prompt": "neon cyber visor", "attachment_type": "Hat", "style": "cyberpunk"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        gen_id = d["id"]

        # Wait up to ~12s for demo mode completion (sleeps 4s)
        completed = None
        for _ in range(12):
            time.sleep(1.2)
            g = session.get(
                f"{BASE_URL}/api/generate/{gen_id}", headers=auth_headers, timeout=15
            )
            assert g.status_code == 200
            if g.json().get("status") == "completed":
                completed = g.json()
                break
        assert completed is not None, "generation did not complete in time"
        assert completed.get("model_url")
        assert completed.get("thumbnail_url")

        me1 = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15).json()
        assert me1["credits"] == credits_before - 1

    def test_out_of_credits_402(self, session):
        """Register a fresh user, drain credits via direct DB? Can't. Instead,
        try to exhaust by spamming until 402. Capped to avoid runaway."""
        email = f"drain_{uuid.uuid4().hex[:8]}@example.com"
        r = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": email, "password": "secret12345", "name": "Drain"},
            timeout=15,
        )
        token = r.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}
        last = None
        for _ in range(22):
            last = session.post(
                f"{BASE_URL}/api/generate/text-to-3d",
                headers=h,
                json={"prompt": "xx", "attachment_type": "Hat", "style": "auto"},
                timeout=15,
            )
            if last.status_code == 402:
                break
        assert last is not None
        assert last.status_code == 402, f"Expected 402 once drained, last={last.status_code}"


# ============== Prompt enhance ==============
class TestPromptEnhance:
    def test_enhance(self, session, auth_headers):
        r = session.post(
            f"{BASE_URL}/api/prompt/enhance",
            headers=auth_headers,
            json={"prompt": "red hat", "attachment_type": "Hat", "style": "cyberpunk"},
            timeout=60,
        )
        if r.status_code == 500:
            pytest.skip(f"LLM unreachable: {r.text}")
        assert r.status_code == 200, r.text
        out = r.json().get("enhanced", "")
        assert isinstance(out, str)
        assert len(out) > len("red hat")


# ============== Feed / Like / Remix ==============
class TestFeedLikeRemix:
    @pytest.fixture(scope="class")
    def some_gen_id(self, session):
        r = session.get(f"{BASE_URL}/api/feed?sort=recent", timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert items, "feed should have seeded items"
        return items[0]["id"]

    def test_feed_recent(self, session):
        r = session.get(f"{BASE_URL}/api/feed?sort=recent", timeout=15)
        assert r.status_code == 200
        assert len(r.json()["items"]) >= 6

    def test_feed_popular(self, session):
        r = session.get(f"{BASE_URL}/api/feed?sort=popular", timeout=15)
        assert r.status_code == 200

    def test_feed_trending(self, session):
        r = session.get(f"{BASE_URL}/api/feed?sort=trending", timeout=15)
        assert r.status_code == 200

    def test_like_toggle(self, session, auth_headers, some_gen_id):
        r1 = session.post(
            f"{BASE_URL}/api/generations/{some_gen_id}/like",
            headers=auth_headers,
            timeout=15,
        )
        assert r1.status_code == 200
        liked1 = r1.json()["liked"]
        r2 = session.post(
            f"{BASE_URL}/api/generations/{some_gen_id}/like",
            headers=auth_headers,
            timeout=15,
        )
        assert r2.status_code == 200
        assert r2.json()["liked"] != liked1

    def test_remix(self, session, auth_headers, some_gen_id):
        r = session.post(
            f"{BASE_URL}/api/generations/{some_gen_id}/remix",
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["remixed_from"] == some_gen_id
        assert "prompt" in d and "attachment_type" in d and "style" in d

    def test_my_generations(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/me/generations", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert "items" in r.json()


# ============== Battle ==============
class TestBattle:
    def test_battle_random_and_vote(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/battle/random", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        battle_id = d["battle_id"]
        a_id = d["a"]["id"]
        b_id = d["b"]["id"]
        assert a_id != b_id

        v1 = session.post(
            f"{BASE_URL}/api/battle/vote",
            headers=auth_headers,
            json={"battle_id": battle_id, "winner_id": a_id},
            timeout=15,
        )
        assert v1.status_code == 200

        # Voting same battle again -> 400
        v2 = session.post(
            f"{BASE_URL}/api/battle/vote",
            headers=auth_headers,
            json={"battle_id": battle_id, "winner_id": a_id},
            timeout=15,
        )
        assert v2.status_code == 400


# ============== Leaderboard / Challenges ==============
class TestLeaderboardChallenges:
    def test_leaderboard(self, session):
        r = session.get(f"{BASE_URL}/api/leaderboard", timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        # Verify sorted desc by battle_wins
        wins = [i.get("battle_wins", 0) for i in items]
        assert wins == sorted(wins, reverse=True)

    def test_challenge_today(self, session):
        r = session.get(f"{BASE_URL}/api/challenges/today", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("challenge") is not None

    def test_challenge_list(self, session):
        r = session.get(f"{BASE_URL}/api/challenges", timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        assert all("entry_count" in i for i in items)


# ============== Pricing & Stripe ==============
class TestPaymentsPricing:
    def test_pricing_plans(self, session):
        r = session.get(f"{BASE_URL}/api/pricing/plans", timeout=15)
        assert r.status_code == 200
        plans = r.json()["plans"]
        ids = [p["id"] for p in plans]
        assert "creator" in ids and "pro" in ids
        for p in plans:
            assert "price" in p and "credits" in p

    def test_stripe_checkout(self, session, auth_headers):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            headers=auth_headers,
            json={"plan_id": "creator", "origin_url": ORIGIN_URL},
            timeout=30,
        )
        if r.status_code == 500:
            pytest.skip(f"Stripe checkout backend error (sandbox): {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("url", "").startswith("http")
        assert d.get("session_id")
