"""Community feed, likes, remix, battle, challenges, leaderboard."""
import os
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
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
