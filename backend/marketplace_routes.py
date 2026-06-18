"""BloxDrops Marketplace + BloxBucks routes — Phase 2.1.

Royalty: 5% to ORIGINAL creator (drop.user_id) on every user-to-user sale.
If seller IS the original creator, no royalty split — seller gets 100%.
"""
import logging
import uuid
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from auth_utils import get_current_user
from marketplace_models import ListingCreate, BuyRequest, AdminGrantBB
from drops_utils import enrich_drop
from models import now_utc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

ROYALTY_PCT = 0.05  # 5% to original creator on resales
PLATFORM_FEE_PCT = 0.05  # 5% platform fee to the company owner (admin "Blox")
MIN_LISTING_BB = 100


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
        "kind": kind,                # topup | spend | earn | royalty | grant
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
        items.append(listing)
    return {"items": items, "count": len(items)}


# -- List for sale -----------------------------------------------------------
@router.post("/marketplace/list")
async def marketplace_list(payload: ListingCreate, user=Depends(get_current_user)):
    from server import db
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

    if payload.price_bloxbucks < MIN_LISTING_BB:
        raise HTTPException(400, f"Minimum listing price is {MIN_LISTING_BB} BB")

    doc = {
        "_id": ObjectId(),
        "generation_id": payload.generation_id,
        "edition_number": payload.edition_number,
        "seller_user_id": user["id"],
        "price_bloxbucks": payload.price_bloxbucks,
        "price_usd": None,
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


# -- Buy with BloxBucks ------------------------------------------------------
@router.post("/marketplace/buy/{listing_id}")
async def marketplace_buy(listing_id: str, payload: BuyRequest, user=Depends(get_current_user)):
    from server import db
    if payload.currency != "bloxbucks":
        raise HTTPException(400, "Only BloxBucks purchases are supported in Phase 2.1")

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

    # Fetch drop to find original creator
    gen = await db.generations.find_one({"_id": ObjectId(listing["generation_id"])})
    if not gen:
        raise HTTPException(404, "Drop not found")
    original_creator_id = gen["user_id"]
    seller_id = listing["seller_user_id"]
    platform_owner_id = await _get_platform_owner_id(db)

    # === Splits ===
    # Platform fee: 5% to "Blox" owner, on every sale.
    # Creator royalty: 5% to original creator, only when seller is NOT the creator (resale).
    # Seller take: whatever remains.
    platform_fee = max(1, int(price * PLATFORM_FEE_PCT)) if platform_owner_id else 0
    if seller_id == original_creator_id:
        royalty = 0
    else:
        royalty = max(1, int(price * ROYALTY_PCT))
    seller_take = price - royalty - platform_fee
    if seller_take < 0:
        # Defensive: shouldn't happen with MIN_LISTING_BB=100, but guard anyway
        raise HTTPException(400, "Sale price too low after fees")

    # === Atomic-ish settlement (Mongo transactions would be cleanest but our setup is single-replica) ===
    # 1. Debit buyer
    buyer_new = await _adjust_balance(db, user["id"], -price)
    await _record_bb_tx(db, user["id"], "spend", price, buyer_new,
                        {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"]})

    # 2. Credit seller
    seller_new = await _adjust_balance(db, seller_id, seller_take)
    await _record_bb_tx(db, seller_id, "earn", seller_take, seller_new,
                        {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"]})

    # 3. Royalty to original creator (if applicable)
    if royalty > 0:
        creator_new = await _adjust_balance(db, original_creator_id, royalty)
        await _record_bb_tx(db, original_creator_id, "royalty", royalty, creator_new,
                            {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"], "from_seller": seller_id})

    # 4. Platform fee to "Blox" owner
    if platform_fee > 0 and platform_owner_id and platform_owner_id != seller_id:
        owner_new = await _adjust_balance(db, platform_owner_id, platform_fee)
        await _record_bb_tx(db, platform_owner_id, "platform_fee", platform_fee, owner_new,
                            {"listing_id": listing_id, "generation_id": listing["generation_id"], "edition_number": listing["edition_number"], "from_seller": seller_id})

    # 5. Transfer ownership: delete old row, insert buyer's row
    await db.ownerships.delete_one({
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
    })
    await db.ownerships.insert_one({
        "_id": ObjectId(),
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
        "owner_user_id": user["id"],
        "acquired_at": now_utc().isoformat(),
        "acquisition_type": "purchase",
        "source_listing_id": listing_id,
    })

    # 6. Mark listing sold
    await db.marketplace_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {
            "status": "sold",
            "sold_at": now_utc().isoformat(),
            "sold_to_user_id": user["id"],
            "sold_price": price,
            "sold_currency": "bloxbucks",
        }},
    )

    return {
        "ok": True,
        "price": price,
        "seller_take": seller_take,
        "royalty": royalty,
        "platform_fee": platform_fee,
        "buyer_balance_after": buyer_new,
        "generation_id": listing["generation_id"],
        "edition_number": listing["edition_number"],
    }
