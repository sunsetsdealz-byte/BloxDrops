"""Community feed, likes, remix, battle, challenges, leaderboard."""
import os
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from bson import ObjectId

from auth_utils import get_current_user, get_optional_user
from models import BattleVoteRequest, now_utc
from drops_utils import enrich_drop

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _hydrate(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    enrich_drop(doc)
    return doc


# ============== FEED ==============
@router.get("/feed")
async def feed(
    sort: str = Query("recent", regex="^(recent|popular|trending)$"),
    challenge_id: Optional[str] = None,
    limit: int = Query(40, le=100),
    skip: int = 0,
    user=Depends(get_optional_user),
):
    from server import db
    # Expire stale boosts before reading the feed
    await db.generations.update_many(
        {"is_featured": True, "featured_until": {"$lt": now_utc().isoformat()}},
        {"$set": {"is_featured": False}},
    )

    q = {"status": "completed"}
    if challenge_id:
        q["challenge_id"] = challenge_id
    sort_spec = [("created_at", -1)]
    if sort == "popular":
        sort_spec = [("likes", -1), ("created_at", -1)]
    elif sort == "trending":
        sort_spec = [("battle_wins", -1), ("likes", -1)]

    # Always pin featured first
    pinned_cursor = db.generations.find({**q, "is_featured": True}).sort([("featured_until", -1)]).limit(8)
    pinned = [d async for d in pinned_cursor]
    pinned_ids = {p["_id"] for p in pinned}

    rest_cursor = db.generations.find(
        {**q, "_id": {"$nin": list(pinned_ids)}}
    ).sort(sort_spec).skip(skip).limit(limit)

    docs = pinned + [d async for d in rest_cursor]

    liked_ids = set()
    if user:
        my_likes = await db.likes.find({"user_id": user["id"]}).to_list(500)
        liked_ids = {l["generation_id"] for l in my_likes}

    items = []
    for d in docs:
        item = _hydrate(d)
        item["is_liked"] = item["id"] in liked_ids
        items.append(item)
    return {"items": items, "count": len(items)}


@router.post("/generations/{generation_id}/like")
async def toggle_like(generation_id: str, user=Depends(get_current_user)):
    from server import db
    existing = await db.likes.find_one({"user_id": user["id"], "generation_id": generation_id})
    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        await db.generations.update_one({"_id": ObjectId(generation_id)}, {"$inc": {"likes": -1}})
        return {"liked": False}
    await db.likes.insert_one({
        "user_id": user["id"],
        "generation_id": generation_id,
        "created_at": now_utc().isoformat(),
    })
    await db.generations.update_one({"_id": ObjectId(generation_id)}, {"$inc": {"likes": 1}})
    return {"liked": True}


@router.post("/generations/{generation_id}/remix")
async def remix(generation_id: str, user=Depends(get_current_user)):
    """Create a draft prompt based on the source generation."""
    from server import db
    try:
        src = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Source not found")
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.generations.update_one({"_id": ObjectId(generation_id)}, {"$inc": {"remix_count": 1}})
    return {
        "prompt": src.get("original_prompt") or src.get("prompt"),
        "attachment_type": src.get("attachment_type", "Hat"),
        "style": src.get("style", "auto"),
        "remixed_from": generation_id,
    }


@router.get("/me/generations")
async def my_generations(user=Depends(get_current_user), limit: int = 60):
    from server import db
    cursor = db.generations.find({"user_id": user["id"]}).sort([("created_at", -1)]).limit(limit)
    items = [_hydrate(d) async for d in cursor]
    return {"items": items}


@router.delete("/generations/{generation_id}")
async def delete_my_generation(generation_id: str, user=Depends(get_current_user)):
    """Owner (or admin) deletes a creation.

    Guards:
    - Cannot delete the Founder/1-of-1 reserved drop ($50,000 USD)
    - Cannot delete while it has an active marketplace listing — the owner must cancel that first
    - Cascades: removes likes, ownerships, marketplace listings (status=cancelled if not open),
      and the generation itself.
    """
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Creation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Creation not found")

    is_admin = user.get("role") == "admin"
    if gen.get("user_id") != user["id"] and not is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own creations")

    # Protect the Founder 1/1 drop
    if gen.get("release_price_usd") == 50000:
        raise HTTPException(status_code=400, detail="The Founder drop is permanent and cannot be deleted")

    # Block if any active listings exist for this generation
    active = await db.marketplace_listings.find_one({
        "generation_id": generation_id,
        "status": "open",
    })
    if active:
        raise HTTPException(
            status_code=400,
            detail="Cancel the active marketplace listing for this drop before deleting.",
        )

    # Cascade cleanup
    await db.likes.delete_many({"generation_id": generation_id})
    await db.ownerships.delete_many({"generation_id": generation_id})
    await db.marketplace_listings.delete_many({"generation_id": generation_id})
    await db.generations.delete_one({"_id": ObjectId(generation_id)})

    return {"ok": True, "deleted_id": generation_id}


# ============== NFT METADATA EDITOR ==============
class NFTTrait(BaseModel):
    trait_type: str = Field(min_length=1, max_length=32)
    value: str = Field(min_length=1, max_length=64)


class NFTMetadataUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, max_length=80)
    description: Optional[str] = Field(default=None, max_length=600)
    traits: Optional[List[NFTTrait]] = Field(default=None, max_length=12)
    # Admin-only field: rarity tier override (common / rare / epic / legendary / mythic).
    # Ignored when sent by non-admin users.
    rarity_tier: Optional[str] = Field(default=None)


@router.patch("/generations/{generation_id}/metadata")
async def update_generation_metadata(
    generation_id: str,
    payload: NFTMetadataUpdate,
    user=Depends(get_current_user),
):
    """Owner-only NFT metadata editor.

    Lets the creator add a custom display name, description / lore,
    and OpenSea-style key/value traits (e.g. "Edition: 1 of 1") to
    their generation.

    Locking rule:
    - Editable freely until the drop is first listed on the marketplace.
    - Once ANY marketplace listing exists for this generation (open,
      sold, or cancelled), the metadata becomes immutable to preserve
      buyer-facing provenance.
    - Admins can always edit.
    """
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Creation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Creation not found")

    is_admin = user.get("role") == "admin"
    if gen.get("user_id") != user["id"] and not is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own creations")

    # Lock once the drop has ever been listed on the marketplace
    if not is_admin:
        ever_listed = await db.marketplace_listings.find_one({"generation_id": generation_id})
        if ever_listed:
            raise HTTPException(
                status_code=400,
                detail="Metadata is locked — this drop was listed on the marketplace. Provenance is now permanent.",
            )

    update: dict = {}
    if payload.display_name is not None:
        update["display_name"] = payload.display_name.strip() or None
    if payload.description is not None:
        update["description"] = payload.description.strip() or None
    if payload.traits is not None:
        # Dedupe by trait_type (case-insensitive), preserve order
        seen = set()
        cleaned = []
        for t in payload.traits:
            key = t.trait_type.strip()
            val = t.value.strip()
            if not key or not val:
                continue
            k_lower = key.lower()
            if k_lower in seen:
                continue
            seen.add(k_lower)
            cleaned.append({"trait_type": key, "value": val})
        update["traits"] = cleaned

    # Admin-only: rarity tier override
    if payload.rarity_tier is not None and is_admin:
        tier = payload.rarity_tier.lower().strip()
        allowed = {"common", "rare", "epic", "legendary", "mythic"}
        if tier not in allowed:
            raise HTTPException(status_code=400, detail=f"Invalid rarity tier. Allowed: {sorted(allowed)}")
        update["rarity_tier"] = tier

    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")

    update["metadata_updated_at"] = now_utc().isoformat()

    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": update},
    )

    fresh = await db.generations.find_one({"_id": ObjectId(generation_id)})
    result = _hydrate(fresh)
    # After update, recompute lock state for the client
    ever_listed_now = await db.marketplace_listings.find_one({"generation_id": generation_id})
    result["metadata_locked"] = bool(ever_listed_now)
    return result


# ============== BATTLE ==============
@router.get("/battle/random")
async def random_battle(user=Depends(get_optional_user)):
    from server import db
    # Pick two random completed gens
    pipeline = [
        {"$match": {"status": "completed", "model_url": {"$ne": None}}},
        {"$sample": {"size": 2}},
    ]
    docs = await db.generations.aggregate(pipeline).to_list(2)
    if len(docs) < 2:
        raise HTTPException(status_code=404, detail="Not enough creations yet — generate more!")
    a, b = _hydrate(docs[0]), _hydrate(docs[1])
    battle = {
        "generation_a_id": a["id"],
        "generation_b_id": b["id"],
        "voter_id": user["id"] if user else None,
        "created_at": now_utc().isoformat(),
        "status": "open",
    }
    res = await db.battles.insert_one(battle)
    return {"battle_id": str(res.inserted_id), "a": a, "b": b}


@router.post("/battle/vote")
async def vote_battle(payload: BattleVoteRequest, user=Depends(get_current_user)):
    from server import db
    from datetime import timedelta
    try:
        battle = await db.battles.find_one({"_id": ObjectId(payload.battle_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Battle not found")
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    if battle.get("status") == "voted":
        raise HTTPException(status_code=400, detail="Already voted")

    if payload.winner_id not in (battle["generation_a_id"], battle["generation_b_id"]):
        raise HTTPException(status_code=400, detail="Winner must be one of the contenders")

    loser_id = (
        battle["generation_b_id"]
        if payload.winner_id == battle["generation_a_id"]
        else battle["generation_a_id"]
    )

    await db.battles.update_one(
        {"_id": ObjectId(payload.battle_id)},
        {"$set": {"status": "voted", "winner_id": payload.winner_id, "voter_id": user["id"]}},
    )
    await db.generations.update_one({"_id": ObjectId(payload.winner_id)}, {"$inc": {"battle_wins": 1}})
    await db.generations.update_one({"_id": ObjectId(loser_id)}, {"$inc": {"battle_losses": 1}})

    # Auto-grant a free 24h boost when a creation crosses 5, 25, or 100 wins (milestone rewards)
    winner = await db.generations.find_one({"_id": ObjectId(payload.winner_id)})
    if winner and winner.get("battle_wins", 0) in (5, 25, 100) and not winner.get("is_featured"):
        featured_until = (now_utc() + timedelta(hours=24)).isoformat()
        await db.generations.update_one(
            {"_id": ObjectId(payload.winner_id)},
            {"$set": {"is_featured": True, "featured_until": featured_until, "free_boost_reason": f"{winner['battle_wins']}_wins"}},
        )

    return {"ok": True, "winner_id": payload.winner_id}


@router.get("/leaderboard")
async def leaderboard(limit: int = 20):
    from server import db
    cursor = db.generations.find(
        {"status": "completed"}
    ).sort([("battle_wins", -1), ("likes", -1)]).limit(limit)
    return {"items": [_hydrate(d) async for d in cursor]}


# ============== CHALLENGES ==============
@router.get("/challenges")
async def list_challenges():
    from server import db
    cursor = db.challenges.find({}).sort([("starts_at", -1)]).limit(20)
    items = []
    async for d in cursor:
        d = _hydrate(d)
        d["entry_count"] = await db.generations.count_documents({"challenge_id": d["id"]})
        items.append(d)
    return {"items": items}


@router.get("/challenges/today")
async def today_challenge():
    from server import db
    now_iso = now_utc().isoformat()
    challenge = await db.challenges.find_one({
        "starts_at": {"$lte": now_iso},
        "ends_at": {"$gte": now_iso},
    })
    if not challenge:
        # Return latest one
        challenge = await db.challenges.find_one({}, sort=[("starts_at", -1)])
    if not challenge:
        return {"challenge": None}
    challenge = _hydrate(challenge)
    challenge["entry_count"] = await db.generations.count_documents({"challenge_id": challenge["id"]})
    return {"challenge": challenge}
