"""Iteration 8 — Phase 2.4 (USD listings), Admin Creator Connect status, Connect probe."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-generator-66.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@bloxdrops.com"
ADMIN_PASSWORD = "BloxDrops2026!"

ADMIN_GEN_ID = "6a3378223bc360a01b1ff640"
ADMIN_EDITION = 1


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def user_token():
    import uuid
    email = f"TEST_it8_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "It8Tester"}, timeout=30)
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


# ============== CONNECT PROBES ==============

def test_connect_configured_returns_test_mode():
    r = requests.get(f"{API}/connect/configured", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("configured") is True
    assert data.get("mode") == "test"


def test_connect_onboard_returns_stripe_url(admin_headers):
    r = requests.post(f"{API}/connect/onboard", json={"origin_url": BASE_URL}, headers=admin_headers, timeout=60)
    assert r.status_code == 200, f"onboard failed: {r.status_code} {r.text}"
    data = r.json()
    assert "url" in data and data["url"].startswith("https://connect.stripe.com/"), f"bad url: {data.get('url')}"
    assert data.get("account_id", "").startswith("acct_")


# ============== ADMIN CREATORS CONNECT STATUS ==============

def test_admin_creators_connect_status(admin_headers):
    r = requests.get(f"{API}/admin/creators-connect-status", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "onboarded" in data and "pending" in data and "never_started" in data
    assert "counts" in data
    counts = data["counts"]
    assert counts.get("onboarded") == len(data["onboarded"])
    assert counts.get("pending") == len(data["pending"])
    assert counts.get("never_started") == len(data["never_started"])
    # Admin should be in pending (started onboarding but not finished)
    pending_emails = [p.get("email", "").lower() for p in data["pending"]]
    assert ADMIN_EMAIL.lower() in pending_emails, f"admin not in pending: {pending_emails}"


def test_admin_creators_connect_status_forbidden_for_non_admin(user_headers):
    r = requests.get(f"{API}/admin/creators-connect-status", headers=user_headers, timeout=30)
    assert r.status_code == 403, f"expected 403 got {r.status_code} {r.text}"


# ============== MARKETPLACE LISTING VALIDATIONS ==============

def _unlist_if_open(headers, generation_id, edition):
    """Clean up any open listing on the admin's edition."""
    r = requests.get(f"{API}/marketplace", timeout=30)
    if r.status_code != 200:
        return
    for item in r.json().get("items", []):
        if item.get("generation_id") == generation_id and item.get("edition_number") == edition:
            requests.post(f"{API}/marketplace/unlist/{item['id']}", headers=headers, timeout=30)


def test_listing_validation_missing_prices(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 400, r.text
    assert "price" in r.text.lower()


def test_listing_validation_bb_below_min(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_bloxbucks": 50}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    # 422 from Pydantic ge=100, or 400 from route logic — both valid rejections
    assert r.status_code in (400, 422), r.text
    assert "100" in r.text or "minimum" in r.text.lower() or "greater_than_equal" in r.text


def test_listing_validation_usd_below_min(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_usd_cents": 50}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code in (400, 422), r.text


def test_listing_usd_only_without_connect_fails(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_usd_cents": 999}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 400, r.text
    assert "stripe connect" in r.text.lower() or "onboarding" in r.text.lower()


def test_listing_bb_only_succeeds_and_appears_in_browse(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_bloxbucks": 500}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    listing = r.json()["listing"]
    listing_id = listing["id"]
    assert listing["price_bloxbucks"] == 500
    assert listing.get("price_usd_cents") is None

    # Verify it shows up in browse
    rb = requests.get(f"{API}/marketplace", timeout=30)
    assert rb.status_code == 200
    items = rb.json().get("items", [])
    found = next((i for i in items if i.get("id") == listing_id), None)
    assert found is not None, "newly listed item missing from browse"
    # both BB & USD fields visible (USD may be None)
    assert "price_bloxbucks" in found
    assert "price_usd_cents" in found
    assert "seller_name" in found
    assert found["price_bloxbucks"] == 500

    # Cleanup — unlist
    ru = requests.post(f"{API}/marketplace/unlist/{listing_id}", headers=admin_headers, timeout=30)
    assert ru.status_code == 200, ru.text


# ============== BUY_USD VALIDATIONS ==============

def test_buy_usd_rejects_bb_only_listing(admin_headers, user_headers):
    """Create a BB-only listing as admin, then try to buy_usd as another user → 400."""
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_bloxbucks": 500}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    listing_id = r.json()["listing"]["id"]

    try:
        rb = requests.post(
            f"{API}/marketplace/buy_usd/{listing_id}",
            json={"origin_url": BASE_URL},
            headers=user_headers,
            timeout=30,
        )
        assert rb.status_code == 400, f"expected 400 got {rb.status_code}: {rb.text}"
        assert "usd" in rb.text.lower() or "price" in rb.text.lower()
    finally:
        requests.post(f"{API}/marketplace/unlist/{listing_id}", headers=admin_headers, timeout=30)


def test_buy_usd_seller_cannot_buy_own(admin_headers):
    """Seller buying own listing should fail. We test BB-priced listing → returns 400 'no USD price' or 'own listing'."""
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    # List with BB price only (we cannot list USD as admin since Connect KYC incomplete)
    payload = {"generation_id": ADMIN_GEN_ID, "edition_number": ADMIN_EDITION, "price_bloxbucks": 500}
    r = requests.post(f"{API}/marketplace/list", json=payload, headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    listing_id = r.json()["listing"]["id"]

    try:
        rb = requests.post(
            f"{API}/marketplace/buy_usd/{listing_id}",
            json={"origin_url": BASE_URL},
            headers=admin_headers,
            timeout=30,
        )
        # Could be 400 for own listing OR 400 for no USD price
        assert rb.status_code == 400, f"expected 400 got {rb.status_code}: {rb.text}"
        msg = rb.text.lower()
        assert ("own listing" in msg) or ("no usd price" in msg) or ("usd" in msg)
    finally:
        requests.post(f"{API}/marketplace/unlist/{listing_id}", headers=admin_headers, timeout=30)


def test_marketplace_browse_returns_seller_name_and_both_price_fields(admin_headers):
    _unlist_if_open(admin_headers, ADMIN_GEN_ID, ADMIN_EDITION)
    r = requests.get(f"{API}/marketplace", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("items"), list)
    # Schema is enforced by listing tests; here just ensure response shape
    for item in data["items"]:
        assert "price_bloxbucks" in item
        assert "price_usd_cents" in item
        assert "seller_name" in item
