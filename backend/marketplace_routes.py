"""BloxDrops Marketplace + BloxBucks routes — Phase 2.1 + 2.4 (USD).

Royalty: 5% to ORIGINAL creator (drop.user_id) on every user-to-user sale.
If seller IS the original creator, no royalty split — seller gets 95% & platform keeps 5%.

USD listings (Phase 2.4):
- Seller must have completed Stripe Connect onboarding (charges_enabled=true).
- Buyer pays via Stripe Checkout (destination charges with transfer_data).
- application_fee_amount = 10% (5% real platform fee in USD + 5% royalty placeholder).
- On payment confirmed → ownership transfers, listing marked sold,
  original creator credited 5% as BB (1 BB = 1 USD cent).
"""
import os
import logging
import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from auth_utils import get_current_user
from marketplace_models import ListingCreate, BuyRequest, UsdCheckoutRequest, AdminGrantBB
from drops_utils import enrich_drop
from models import now_utc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

ROYALTY_PCT = 0.05  # 5% to original creator on resales
PLATFORM_FEE_PCT = 0.05  # 5% platform fee to the company owner (admin "Blox")
MIN_LISTING_BB = 100
MIN_LISTING_USD_CENTS = 100  # $1.00


def _stripe():
    """Return the raw Stripe SDK with the live key, or raise 503."""
    import stripe
    key = os.environ.get("STRIPE_API_KEY", "")
    if key == "sk_test_emergent" or not key.startswith(("sk_test_", "sk_live_")):
        raise HTTPException(503, "Stripe Connect requires a real Stripe secret key.")
    stripe.api_key = key
    return stripe


async def _get_platform_owner_id(db) -> Optional[str]:
    """Find the user_id of the platform owner (admin user with name 'Blox')."""
    owner = await db.users.find_one(
        {"is_platform_owner": True},
        {"_id": 1},
    )
    if not owner:
        # Fallback to admin named Blox (case-insensitive)
        owner = await db.users.find_one(
            {"role": "admin", "name": {"$regex": "^blox$", "$options": "i"}},
            {"_id": 1},
        )
    return str(owner["_id"]) if owner else None


# -------------------------------------------------------------------- helpers
def _new_id() -> str:
    return uuid.uuid4().hex


async def _record_bb_tx(db, user_id: str, kind: str, amount: int, balance_after: int, related: dict = None):
    await db.bloxbucks_transactions.insert_one({
        "_id": ObjectId(),
        "user_id": user_id,
        "kind": kind,                # topup | spend | earn | royalty | grant | platform_fee
        "amount": amount,            # positive int (direction implied by kind)
        "balance_after": balance_after,
        "related": related or {},
        "created_at": now_utc().isoformat(),
    })


async def _adjust_balance(db, user_id: str, delta: int) -> int:
    """Atomically adjust a user's BB balance; returns new balance."""
    res = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$inc": {"bloxbucks_balance": delta}},
        return_document=True,
    )
    if not res:
        raise HTTPException(404, "User not found")
    return int(res.get("bloxbucks_balance", 0))


async def _ensure_ownership(db, generation_id: str, owner_user_id: str, edition_number: int = 1, acquisition_type: str = "mint", source_listing_id: Optional[str] = None):
    """Idempotently insert an ownership row."""
    existing = await db.ownerships.find_one({
        "generation_id": generation_id,
        "edition_number": edition_number,
    })
    if existing:
        return existing
    doc = {
        "_id": ObjectId(),
        "generation_id": generation_id,
        "edition_number": edition_number,
        "owner_user_id": owner_user_id,
        "acquired_at": now_utc().isoformat(),
        "acquisition_type": acquisition_type,
        "source_listing_id": source_listing_id,
    }
    await db.ownerships.insert_one(doc)
    return doc


# =================================================================== ROUTES

# -- BloxBucks: read my balance + recent tx ----------------------------------
@router.get("/bloxbucks/me")
async def bloxbucks_me(user=Depends(get_current_user)):
    from server import db
    u = await db.users.find_one({"_id": ObjectId(user["id"])}, {"bloxbucks_balance": 1})
    balance = int((u or {}).get("bloxbucks_balance") or 0)
    cursor = db.bloxbucks_transactions.find({"user_id": user["id"]}).sort([("created_at", -1)]).limit(20)
    tx = []
    async for t in cursor:
        t["id"] = str(t.pop("_id"))
        tx.append(t)
    return {"balance": balance, "transactions": tx}


# -- BloxBucks: admin grants (testing / promo) -------------------------------
@router.post("/bloxbucks/admin/grant")
async def bloxbucks_admin_grant(payload: AdminGrantBB, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    from server import db
    target = await db.users.find_one({"email": payload.user_email.lower()})
    if not target:
        raise HTTPException(404, f"No user with email {payload.user_email}")
    target_id = str(target["_id"])
    new_balance = await _adjust_balance(db, target_id, payload.amount)
    await _record_bb_tx(db, target_id, "grant", payload.amount, new_balance,
                        {"reason": payload.reason, "granted_by": user["id"]})
    return {"user_id": target_id, "new_balance": new_balance, "granted": payload.amount}


# -- My collection -----------------------------------------------------------
@router.get("/me/collection")
async def my_collection(user=Depends(get_current_user)):
    """Drops owned by me (one row per edition I hold)."""
    from server import db
    owned = []
    async for own in db.ownerships.find({"owner_user_id": user["id"]}).sort([("acquired_at", -1)]):
        gen = await db.generations.find_one({"_id": ObjectId(own["generation_id"])})
        if not gen:
            continue
        gen["id"] = str(gen.pop("_id"))
        enrich_drop(gen)
        # active listing on this edition?
        listing = await db.marketplace_listings.find_one({
            "generation_id": gen["id"],
            "edition_number": own["edition_number"],
            "status": "open",
        })
        owned.append({
            "ownership_id": str(own["_id"]),
            "edition_number": own["edition_number"],
            "acquired_at": own["acquired_at"],
            "is_listed": bool(listing),
            "listing_id": str(listing["_id"]) if listing else None,
            "listing_price_bb": listing.get("price_bloxbucks") if listing else None,
            "listing_price_usd_cents": listing.get("price_usd_cents") if listing else None,
            "drop": gen,
        })
    return {"items": owned, "count": len(owned)}


# -- Marketplace browse ------------------------------------------------------
@router.get("/marketplace")
async def marketplace_browse(sort: str = "newest", limit: int = 40):
    """Open listings, joined with their drop docs."""
    from server import db
    sort_key = [("listed_at", -1)] if sort == "newest" else [("price_bloxbucks", 1)]
    items = []
    async for listing in db.marketplace_listings.find({"status": "open"}).sort(sort_key).limit(limit):
        gen = await db.generations.find_one({"_id": ObjectId(listing["generation_id"])})
        if not gen:
            continue
        gen["id"] = str(gen.pop("_id"))
        enrich_drop(gen)
        listing["id"] = str(listing.pop("_id"))
        listing["drop"] = gen
        # Seller info — name + Connect verified state (USD-ready badge)
        try:
            seller = await db.users.find_one(
                {"_id": ObjectId(listing["seller_user_id"])},
                {"name": 1, "stripe_charges_enabled": 1},
            )
            listing["seller_name"] = (seller or {}).get("name") or "creator"
            listing["seller_verified"] = bool((seller or {}).get("stripe_charges_enabled"))
        except Exception:
            listing["seller_name"] = "creator"
            listing["seller_verified"] = False
        items.append(listing)
    return {"items": items, "count": len(items)}


# -- List for sale -----------------------------------------------------------
@router.post("/marketplace/list")
async def marketplace_list(payload: ListingCreate, user=Depends(get_current_user)):
    from server import db
    # Must specify at least one price
    if not payload.price_bloxbucks and not payload.price_usd_cents:
        raise HTTPException(400, "Specify price_bloxbucks and/or price_usd_cents")

    if payload.price_bloxbucks is not None and payload.price_bloxbucks < MIN_LISTING_BB:
        raise HTTPException(400, f"Minimum BB listing is {MIN_LISTING_BB} BB")
    if payload.price_usd_cents is not None and payload.price_usd_cents < MIN_LISTING_USD_CENTS:
        raise HTTPException(400, f"Minimum USD listing is ${MIN_LISTING_USD_CENTS/100:.2f}")

    # Verify caller owns this edition
    ownership = await db.ownerships.find_one({
        "generation_id": payload.generation_id,
        "edition_number": payload.edition_number,
        "owner_user_id": user["id"],
    })
    if not ownership:
        raise HTTPException(403, "You don't own this edition")

    # Don't allow listing of `is_coming_soon` drops
    gen = await db.generations.find_one({"_id": ObjectId(payload.generation_id)})
    if not gen:
        raise HTTPException(404, "Drop not found")
    if gen.get("is_coming_soon"):
        raise HTTPException(400, "This drop is marked Coming Soon and cannot be listed yet")

    # Block duplicate open listings
    existing = await db.marketplace_listings.find_one({
        "generation_id": payload.generation_id,
        "edition_number": payload.edition_number,
        "status": "open",
    })
    if existing:
        raise HTTPException(409, "This edition is already listed")

    # USD listings require Connect onboarded seller
    if payload.price_usd_cents:
        udoc = await db.users.find_one({"_id": ObjectId(user["id"])})
        if not udoc.get("stripe_account_id") or not udoc.get("stripe_charges_enabled"):
            raise HTTPException(
                400,
                "Stripe Connect onboarding required for USD listings. "
                "Visit your Profile and click 'Connect Stripe' to start.",
            )

    doc = {
        "_id": ObjectId(),
        "generation_id": payload.generation_id,
        "edition_number": payload.edition_number,
        "seller_user_id": user["id"],
        "price_bloxbucks": payload.price_bloxbucks,
        "price_usd_cents": payload.price_usd_cents,
        "status": "open",
        "listed_at": now_utc().isoformat(),
        "sold_at": None,
        "sold_to_user_id": None,
        "sold_price": None,
        "sold_currency": None,
    }
    await db.marketplace_listings.insert_one(doc)
    doc["id"] = str(doc.pop("_id"))
    return {"listing": doc}


# -- Cancel listing ----------------------------------------------------------
@router.post("/marketplace/unlist/{listing_id}")
async def marketplace_unlist(listing_id: str, user=Depends(get_current_user)):
    from server import db
    try:
        listing = await db.marketplace_listings.find_one({"_id": ObjectId(listing_id)})
    except Exception:
        raise HTTPException(404, "Listing not found")
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["seller_user_id"] != user["id"]:
        raise HTTPException(403, "Only the seller can cancel this listing")
    if listing["status"] != "open":
        raise HTTPException(400, f"Listing is {listing['status']}, cannot cancel")

    await db.marketplace_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"status": "cancelled", "sold_at": now_utc().isoformat()}},
    )
    return {"ok": True}


# -- Settlement helper used by BOTH BB and USD purchase flows ----------------
async def _settle_purchase(db, listing: dict, buyer_id: str, price_paid: int, currency: str, stripe_session_id: Optional[str] = None):
    """Common settlement: transfer ownership + record platform_fee / royalty bookkeeping.

    For BB:
      - `price_paid` is the BB amount.
      - seller_take, royalty, platform_fee are all in BB and credited to user balances.
    For USD:
      - `price_paid` is USD cents. Seller's 90% is handled by Stripe Transfer (destination charge).
      - We credit the original creator royalty as BB equivalent (1 BB = 1 cent).
      - Platform USD fee is kept on Stripe; the BB ledger only records the royalty side.
    """
    listing_id = str(listing["_id"]) if "_id" in listing else listing.get("id")
    seller_id = listing["seller_user_id"]
    gen = await db.generations.find_one({"_id": ObjectId(listing["generation_id"])})
    original_creator_id = gen["user_id"] if gen else seller_id
    platform_owner_id = await _get_platform_owner_id(db)

    # === Splits ===
    if currency == "bloxbucks":
        platform_fee = max(1, int(price_paid * PLATFORM_FEE_PCT)) if platform_owner_id else 0
        royalty = 0 if seller_id == original_creator_id else max(1, int(price_paid * ROYALTY_PCT))
        seller_take = price_paid - royalty - platform_fee
        if seller_take < 0:
            raise HTTPException(400, "Sale price too low after fees")

        # Debit buyer
        buyer_new = await _adjust_balance(db, buyer_id, -price_paid)
        await _record_bb_tx(db, buyer_id, "spend", price_paid, buyer_new,
                            {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"]})
        # Credit seller
        seller_new = await _adjust_balance(db, seller_id, seller_take)
        await _record_bb_tx(db, seller_id, "earn", seller_take, seller_new,
                            {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"]})
        # Royalty
        if royalty > 0:
            creator_new = await _adjust_balance(db, original_creator_id, royalty)
            await _record_bb_tx(db, original_creator_id, "royalty", royalty, creator_new,
                                {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"], "from_seller": seller_id})
        # Platform fee
        if platform_fee > 0 and platform_owner_id and platform_owner_id != seller_id:
            owner_new = await _adjust_balance(db, platform_owner_id, platform_fee)
            await _record_bb_tx(db, platform_owner_id, "platform_fee", platform_fee, owner_new,
                                {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"], "from_seller": seller_id})
        sold_extra = {}

    else:  # usd
        # USD royalty: credit BB equivalent (1 cent = 1 BB) to original creator (on resale only)
        royalty_bb = 0 if seller_id == original_creator_id else max(1, int(price_paid * ROYALTY_PCT))
        if royalty_bb > 0:
            creator_new = await _adjust_balance(db, original_creator_id, royalty_bb)
            await _record_bb_tx(db, original_creator_id, "royalty", royalty_bb, creator_new,
                                {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"], "from_seller": seller_id, "currency": "usd", "stripe_session_id": stripe_session_id})
        sold_extra = {"stripe_session_id": stripe_session_id}

    # Transfer ownership
    await db.ownerships.delete_one({
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
    })
    await db.ownerships.insert_one({
        "_id": ObjectId(),
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
        "owner_user_id": buyer_id,
        "acquired_at": now_utc().isoformat(),
        "acquisition_type": "purchase",
        "source_listing_id": listing_id,
    })
    # Mark listing sold
    await db.marketplace_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {
            "status": "sold",
            "sold_at": now_utc().isoformat(),
            "sold_to_user_id": buyer_id,
            "sold_price": price_paid,
            "sold_currency": currency,
            **sold_extra,
        }},
    )


# -- Buy with BloxBucks ------------------------------------------------------
@router.post("/marketplace/buy/{listing_id}")
async def marketplace_buy(listing_id: str, payload: BuyRequest, user=Depends(get_current_user)):
    from server import db
    if payload.currency != "bloxbucks":
        raise HTTPException(400, "Use /marketplace/buy_usd for USD purchases")

    try:
        listing = await db.marketplace_listings.find_one({"_id": ObjectId(listing_id)})
    except Exception:
        raise HTTPException(404, "Listing not found")
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["status"] != "open":
        raise HTTPException(400, "Listing no longer available")
    if listing["seller_user_id"] == user["id"]:
        raise HTTPException(400, "You can't buy your own listing")

    price = int(listing.get("price_bloxbucks") or 0)
    if price <= 0:
        raise HTTPException(400, "Listing has no BloxBucks price set")

    # Check buyer balance
    buyer = await db.users.find_one({"_id": ObjectId(user["id"])}, {"bloxbucks_balance": 1})
    if int((buyer or {}).get("bloxbucks_balance") or 0) < price:
        raise HTTPException(402, "Insufficient BloxBucks balance")

    await _settle_purchase(db, listing, user["id"], price, "bloxbucks")

    buyer_after = (await db.users.find_one({"_id": ObjectId(user["id"])}, {"bloxbucks_balance": 1}) or {}).get("bloxbucks_balance", 0)
    return {
        "ok": True,
        "price": price,
        "currency": "bloxbucks",
        "buyer_balance_after": int(buyer_after),
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
    }


# -- Buy with USD via Stripe Checkout (Connect destination charge) -----------
@router.post("/marketplace/buy_usd/{listing_id}")
async def marketplace_buy_usd_checkout(listing_id: str, payload: UsdCheckoutRequest, user=Depends(get_current_user)):
    from server import db
    stripe = _stripe()

    try:
        listing = await db.marketplace_listings.find_one({"_id": ObjectId(listing_id)})
    except Exception:
        raise HTTPException(404, "Listing not found")
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["status"] != "open":
        raise HTTPException(400, "Listing no longer available")
    if listing["seller_user_id"] == user["id"]:
        raise HTTPException(400, "You can't buy your own listing")
    price_cents = int(listing.get("price_usd_cents") or 0)
    if price_cents <= 0:
        raise HTTPException(400, "Listing has no USD price set")

    # Seller's Connect account must be charges-enabled
    seller = await db.users.find_one({"_id": ObjectId(listing["seller_user_id"])})
    seller_acct = (seller or {}).get("stripe_account_id")
    if not seller_acct or not seller.get("stripe_charges_enabled"):
        raise HTTPException(400, "Seller has not completed Stripe Connect onboarding")

    # Fee = 10% of price (5% real platform fee + 5% royalty placeholder in USD)
    # If seller is the original creator, royalty doesn't apply but we still take 5% platform.
    gen = await db.generations.find_one({"_id": ObjectId(listing["generation_id"])})
    is_resale = bool(gen) and gen.get("user_id") != listing["seller_user_id"]
    fee_pct = 0.10 if is_resale else 0.05
    fee_cents = max(1, int(price_cents * fee_pct))

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/marketplace?usd_session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/marketplace?usd_status=cancelled"

    drop_name = (gen.get("original_prompt") or gen.get("prompt") or "BloxDrops item")[:90] if gen else "BloxDrops item"

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.get("email"),
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": price_cents,
                    "product_data": {
                        "name": f"BloxDrops · {drop_name}",
                        "description": f"Edition #{listing['edition_number']}",
                    },
                },
                "quantity": 1,
            }],
            payment_intent_data={
                "application_fee_amount": fee_cents,
                "transfer_data": {"destination": seller_acct},
                "metadata": {
                    "bloxdrops_listing_id": listing_id,
                    "bloxdrops_buyer_id": user["id"],
                    "bloxdrops_seller_id": listing["seller_user_id"],
                    "bloxdrops_generation_id": listing["generation_id"],
                    "bloxdrops_edition_number": str(listing["edition_number"]),
                    "kind": "marketplace_usd",
                },
            },
            metadata={
                "bloxdrops_listing_id": listing_id,
                "kind": "marketplace_usd",
            },
        )
    except Exception as e:
        logger.exception("marketplace_buy_usd checkout failed: %s", e)
        raise HTTPException(500, f"Stripe error: {e}")

    # Track pending checkout for idempotent settlement on return
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user["id"],
        "kind": "marketplace_usd",
        "listing_id": listing_id,
        "amount_cents": price_cents,
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now_utc().isoformat(),
    })

    return {"url": session.url, "session_id": session.id, "price_cents": price_cents, "fee_cents": fee_cents}


@router.get("/marketplace/buy_usd/status/{session_id}")
async def marketplace_buy_usd_status(session_id: str, user=Depends(get_current_user)):
    """Polled by frontend after returning from Stripe — settles ownership on first 'paid'."""
    from server import db
    stripe = _stripe()

    tx = await db.payment_transactions.find_one({"session_id": session_id, "kind": "marketplace_usd"})
    if not tx:
        raise HTTPException(404, "Transaction not found")
    if tx["user_id"] != user["id"]:
        raise HTTPException(403, "Not your transaction")

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        logger.warning("Session.retrieve failed: %s", e)
        raise HTTPException(500, "Could not fetch Stripe session")

    payment_status = session.payment_status  # "paid" | "unpaid"
    overall_status = session.status  # "complete" | "open" | "expired"

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": overall_status,
            "payment_status": payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    settled = bool(tx.get("settled"))
    if payment_status == "paid" and not settled:
        listing = await db.marketplace_listings.find_one({"_id": ObjectId(tx["listing_id"])})
        if listing and listing["status"] == "open":
            await _settle_purchase(db, listing, user["id"], int(tx["amount_cents"]), "usd", stripe_session_id=session_id)
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"settled": True, "settled_at": now_utc().isoformat()}},
            )
            settled = True

    return {
        "status": overall_status,
        "payment_status": payment_status,
        "settled": settled,
        "listing_id": tx["listing_id"],
        "amount_cents": tx.get("amount_cents"),
    }
