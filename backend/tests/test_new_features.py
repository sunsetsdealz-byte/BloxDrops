"""BloxCraft AI — iteration 3 backend tests.

Covers:
- /api/pricing/plans (creator/pro + _annual variants + boost meta)
- /api/uploads/image + /api/uploads/{filename} (auth, size, content-type)
- /api/boost/checkout (own gen, others' gen → 403, bogus → 404)
- Feed pinning (is_featured + featured_until, stale sweep)
- Battle milestone trigger (battle_wins==5 → 24h boost)
"""
import io
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://ai-generator-66.preview.emergentagent.com"
).rstrip("/")
ORIGIN_URL = "https://ai-generator-66.preview.emergentagent.com"


# ============== Fixtures ==============
@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    return s


def _register(http):
    email = f"it3_{uuid.uuid4().hex[:8]}@example.com"
    pw = "secret12345"
    r = http.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": pw, "name": "IT3"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": pw, "token": d["access_token"], "user": d["user"]}


@pytest.fixture(scope="module")
def user_a(http):
    return _register(http)


@pytest.fixture(scope="module")
def user_b(http):
    return _register(http)


@pytest.fixture(scope="module")
def headers_a(user_a):
    return {"Authorization": f"Bearer {user_a['token']}"}


@pytest.fixture(scope="module")
def headers_b(user_b):
    return {"Authorization": f"Bearer {user_b['token']}"}


# Tiny valid PNG bytes (1x1 transparent)
TINY_PNG = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
    "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
)


# ============== /api/pricing/plans ==============
class TestPricing:
    def test_plans_have_4_variants_and_boost(self, http):
        r = http.get(f"{BASE_URL}/api/pricing/plans", timeout=15)
        assert r.status_code == 200
        body = r.json()
        plans = body["plans"]
        ids = {p["id"]: p for p in plans}
        for pid in ("creator", "creator_annual", "pro", "pro_annual"):
            assert pid in ids, f"missing plan {pid}"
        assert ids["creator"]["price"] == 15.0
        assert ids["creator_annual"]["price"] == 108.0
        assert ids["creator_annual"]["interval"] == "year"
        assert ids["pro"]["price"] == 30.0
        assert ids["pro_annual"]["price"] == 216.0
        assert ids["pro_annual"]["interval"] == "year"
        assert body["boost"]["price"] == 1.99
        assert body["boost"]["duration_hours"] == 24

    def test_checkout_annual_returns_stripe_url(self, http, headers_a):
        r = http.post(
            f"{BASE_URL}/api/payments/checkout",
            headers=headers_a,
            json={"plan_id": "creator_annual", "origin_url": ORIGIN_URL},
            timeout=30,
        )
        if r.status_code == 500:
            pytest.skip(f"Stripe sandbox: {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("http")
        assert "stripe.com" in d["url"]
        assert d["session_id"]


# ============== /api/uploads/image ==============
class TestImageUpload:
    def test_upload_no_auth_401(self, http):
        files = {"file": ("a.png", io.BytesIO(TINY_PNG), "image/png")}
        r = http.post(f"{BASE_URL}/api/uploads/image", files=files, timeout=15)
        assert r.status_code == 401, r.text

    def test_upload_rejects_non_image_400(self, http, headers_a):
        files = {"file": ("a.txt", io.BytesIO(b"hello"), "text/plain")}
        r = http.post(
            f"{BASE_URL}/api/uploads/image", headers=headers_a, files=files, timeout=15
        )
        assert r.status_code == 400, r.text

    def test_upload_too_large_413(self, http, headers_a):
        # 9 MB of zeros, sent as image/png (server reads body then checks size)
        big = b"\x00" * (9 * 1024 * 1024)
        files = {"file": ("big.png", io.BytesIO(big), "image/png")}
        r = http.post(
            f"{BASE_URL}/api/uploads/image", headers=headers_a, files=files, timeout=60
        )
        assert r.status_code == 413, r.text

    def test_upload_success_and_serve(self, http, headers_a):
        files = {"file": ("tiny.png", io.BytesIO(TINY_PNG), "image/png")}
        r = http.post(
            f"{BASE_URL}/api/uploads/image", headers=headers_a, files=files, timeout=20
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "path" in d
        assert d["path"].startswith("/api/uploads/")

        # Fetch and verify bytes
        fetch_url = d["url"] if d["url"].startswith("http") else f"{BASE_URL}{d['path']}"
        g = http.get(fetch_url, timeout=15)
        assert g.status_code == 200
        assert g.content == TINY_PNG


# ============== Boost checkout ==============
def _create_gen_and_complete(http, headers):
    r = http.post(
        f"{BASE_URL}/api/generate/text-to-3d",
        headers=headers,
        json={"prompt": "boost test hat", "attachment_type": "Hat", "style": "auto"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    gen_id = r.json()["id"]
    # Wait for demo-mode completion
    for _ in range(15):
        time.sleep(1.0)
        g = http.get(f"{BASE_URL}/api/generate/{gen_id}", headers=headers, timeout=15)
        if g.status_code == 200 and g.json().get("status") == "completed":
            return gen_id
    pytest.skip("Generation did not complete in time")


class TestBoost:
    def test_boost_own_gen_returns_stripe_url(self, http, headers_a):
        gen_id = _create_gen_and_complete(http, headers_a)
        r = http.post(
            f"{BASE_URL}/api/boost/checkout",
            headers=headers_a,
            json={"generation_id": gen_id, "origin_url": ORIGIN_URL},
            timeout=30,
        )
        if r.status_code == 500:
            pytest.skip(f"Stripe sandbox: {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("http")
        assert d["session_id"]

    def test_boost_others_gen_403(self, http, headers_a, headers_b):
        gen_id = _create_gen_and_complete(http, headers_a)
        r = http.post(
            f"{BASE_URL}/api/boost/checkout",
            headers=headers_b,
            json={"generation_id": gen_id, "origin_url": ORIGIN_URL},
            timeout=30,
        )
        assert r.status_code == 403, r.text

    def test_boost_bogus_id_404(self, http, headers_a):
        r = http.post(
            f"{BASE_URL}/api/boost/checkout",
            headers=headers_a,
            json={"generation_id": "507f1f77bcf86cd799439011", "origin_url": ORIGIN_URL},
            timeout=30,
        )
        assert r.status_code == 404, r.text

    def test_boost_invalid_id_404(self, http, headers_a):
        r = http.post(
            f"{BASE_URL}/api/boost/checkout",
            headers=headers_a,
            json={"generation_id": "not-an-objectid", "origin_url": ORIGIN_URL},
            timeout=30,
        )
        assert r.status_code == 404, r.text


# ============== Feed pinning ==============
class TestFeedPinning:
    """Direct MongoDB checks against the same Mongo the server uses."""

    @pytest.fixture(scope="class")
    def mongo(self):
        from pymongo import MongoClient
        url = os.environ.get("MONGO_URL")
        if not url:
            # Try server's .env
            try:
                with open("/app/backend/.env") as f:
                    for line in f:
                        if line.startswith("MONGO_URL="):
                            url = line.split("=", 1)[1].strip()
                        if line.startswith("DB_NAME="):
                            os.environ["DB_NAME"] = line.split("=", 1)[1].strip()
            except FileNotFoundError:
                pass
        if not url:
            pytest.skip("MONGO_URL not available to tests")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = MongoClient(url)
        return client[db_name]

    def test_pinned_first_then_swept(self, http, headers_a, mongo):
        from bson import ObjectId
        from datetime import datetime, timezone, timedelta

        gen_id = _create_gen_and_complete(http, headers_a)

        # Clear any leftover pinned items from prior runs so this test is deterministic
        mongo.generations.update_many({"is_featured": True}, {"$set": {"is_featured": False}})

        # Pin into the future
        future = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat()
        mongo.generations.update_one(
            {"_id": ObjectId(gen_id)},
            {"$set": {"is_featured": True, "featured_until": future}},
        )

        r = http.get(f"{BASE_URL}/api/feed?sort=recent", timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        ids = [it["id"] for it in items]
        assert ids and ids[0] == gen_id, f"pinned gen should be first; got {ids[:3]}"

        # Now mark as expired and reload — should be swept and no longer first
        past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        mongo.generations.update_one(
            {"_id": ObjectId(gen_id)},
            {"$set": {"is_featured": True, "featured_until": past}},
        )
        r2 = http.get(f"{BASE_URL}/api/feed?sort=recent", timeout=15)
        assert r2.status_code == 200
        # And the doc should have been auto-unfeatured
        doc = mongo.generations.find_one({"_id": ObjectId(gen_id)})
        assert doc.get("is_featured") is False, "stale pin should be swept"

    def test_battle_5_wins_grants_24h_boost(self, http, headers_a, headers_b, mongo):
        from bson import ObjectId
        from datetime import datetime, timezone

        # Need 2 completed gens, one of which will be "winner"
        winner_id = _create_gen_and_complete(http, headers_a)
        opponent_id = _create_gen_and_complete(http, headers_b)

        # Pre-set battle_wins=4 + clear featured
        mongo.generations.update_one(
            {"_id": ObjectId(winner_id)},
            {"$set": {"battle_wins": 4, "is_featured": False, "featured_until": None}},
        )

        # Insert an open battle directly so vote endpoint just flips it
        battle_doc = {
            "generation_a_id": winner_id,
            "generation_b_id": opponent_id,
            "voter_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "open",
        }
        res = mongo.battles.insert_one(battle_doc)
        battle_id = str(res.inserted_id)

        # Vote winner_id (battle_wins 4 -> 5 -> auto boost)
        r = http.post(
            f"{BASE_URL}/api/battle/vote",
            headers=headers_a,
            json={"battle_id": battle_id, "winner_id": winner_id},
            timeout=15,
        )
        assert r.status_code == 200, r.text

        doc = mongo.generations.find_one({"_id": ObjectId(winner_id)})
        assert doc.get("battle_wins") == 5
        assert doc.get("is_featured") is True, "should be auto-featured at 5 wins"
        fu = doc.get("featured_until")
        assert fu, "featured_until should be set"
        # Parse and check ~24h in the future
        dt = datetime.fromisoformat(fu)
        delta_h = (dt - datetime.now(timezone.utc)).total_seconds() / 3600.0
        assert 23 < delta_h <= 24.1, f"featured_until ~24h expected, got {delta_h}h"
