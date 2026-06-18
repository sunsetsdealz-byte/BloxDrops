"""Admin-only user management — promote / demote roles + manage subscriptions."""
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from bson import ObjectId

from auth_utils import get_current_user
from models import PACKAGES

router = APIRouter(prefix="/api/admin")


def _require_admin(user):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


def _is_seed_admin(email: str) -> bool:
    return (email or "").lower() == os.environ.get("ADMIN_EMAIL", "").lower()


@router.get("/users")
async def list_users(
    user=Depends(get_current_user),
    q: str = Query("", description="Search by email or name"),
    limit: int = 100,
):
    _require_admin(user)
    from server import db
    filt = {}
    if q.strip():
        filt = {"$or": [
            {"email": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
        ]}
    cursor = db.users.find(filt).sort([("created_at", -1)]).limit(limit)
    items = []
    async for u in cursor:
        items.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": u.get("name", ""),
            "role": u.get("role", "user"),
            "plan": u.get("plan", "free"),
            "credits": u.get("credits", 0),
            "is_seed_admin": _is_seed_admin(u["email"]),
            "created_at": (
                u["created_at"].isoformat()
                if isinstance(u.get("created_at"), datetime)
                else u.get("created_at", "")
            ),
        })
    return {"items": items, "count": len(items)}


@router.post("/users/{user_id}/promote")
async def promote_user(user_id: str, user=Depends(get_current_user)):
    _require_admin(user)
    from server import db
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "admin"}},
    )
    return {"ok": True, "role": "admin"}


@router.post("/users/{user_id}/demote")
async def demote_user(user_id: str, user=Depends(get_current_user)):
    _require_admin(user)
    from server import db
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # Protect the seed admin so the app can't be locked out
    if _is_seed_admin(target["email"]):
        raise HTTPException(status_code=400, detail="Cannot demote the seed admin")
    # Protect against self-demotion
    if str(target["_id"]) == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": "user"}},
    )
    return {"ok": True, "role": "user"}


# ============== SUBSCRIPTION MANAGEMENT ==============
ALLOWED_PLANS = {"free"} | set(PACKAGES.keys())  # free + every paid plan


class SetPlanRequest(BaseModel):
    plan_id: str = Field(description="free | creator | creator_annual | pro | pro_annual")
    grant_credits: bool = False
    set_credits: int | None = None  # optional explicit credit count


@router.post("/users/{user_id}/set-plan")
async def set_plan(user_id: str, payload: SetPlanRequest, user=Depends(get_current_user)):
    """Activate or disable a subscription for any user. plan_id='free' disables."""
    _require_admin(user)
    if payload.plan_id not in ALLOWED_PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {payload.plan_id}")
    from server import db
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    update = {"plan": payload.plan_id, "plan_activated_at": datetime.utcnow().isoformat()}
    inc = {}
    pkg = PACKAGES.get(payload.plan_id)
    if payload.set_credits is not None:
        update["credits"] = max(0, int(payload.set_credits))
    elif payload.grant_credits and pkg:
        # Grant the credits attached to the plan (incremental)
        inc["credits"] = int(pkg["credits"])

    ops = {"$set": update}
    if inc:
        ops["$inc"] = inc

    await db.users.update_one({"_id": ObjectId(user_id)}, ops)
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    return {
        "ok": True,
        "plan": updated.get("plan"),
        "credits": updated.get("credits", 0),
    }
