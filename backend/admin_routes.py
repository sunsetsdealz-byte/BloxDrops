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
            "banned": bool(u.get("banned")),
            "is_seed_admin": _is_seed_admin(u["email"]),
            "created_at": (
                u["created_at"].isoformat()
                if isinstance(u.get("created_at"), datetime)
                else u.get("created_at", "")
            ),
        })
    return {"items": items, "count": len(items)}


# ============== BAN / UNBAN ==============
@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, user=Depends(get_current_user)):
    _require_admin(user)
    from server import db
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if _is_seed_admin(target["email"]):
        raise HTTPException(status_code=400, detail="Cannot ban the seed admin")
    if str(target["_id"]) == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot ban yourself")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"banned": True, "banned_at": datetime.utcnow().isoformat(), "banned_by": user["id"]}},
    )
    return {"ok": True, "banned": True}


@router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, user=Depends(get_current_user)):
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
        {"$unset": {"banned": "", "banned_at": "", "banned_by": ""}},
    )
    return {"ok": True, "banned": False}


# ============== DELETE USER ==============
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(get_current_user)):
    _require_admin(user)
    from server import db
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if _is_seed_admin(target["email"]):
        raise HTTPException(status_code=400, detail="Cannot delete the seed admin")
    if str(target["_id"]) == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    # Cascade: drop owned data
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.generations.delete_many({"user_id": user_id})
    await db.bloxbucks_transactions.delete_many({"user_id": user_id})
    await db.ownerships.delete_many({"owner_user_id": user_id})
    await db.marketplace_listings.delete_many({"seller_user_id": user_id})
    await db.payment_transactions.delete_many({"user_id": user_id})
    return {"ok": True, "deleted_email": target["email"]}


# ============== ADMIN PASSWORD RESET ==============
class AdminResetPwdRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, payload: AdminResetPwdRequest, user=Depends(get_current_user)):
    """Admin sets a new password for any user.

    NOTE: We cannot retrieve existing passwords — they're stored as one-way bcrypt
    hashes (industry standard, required by GDPR/SOC2). Use this to issue a new
    password and share it with the user out-of-band (email/SMS).
    """
    _require_admin(user)
    from server import db
    from auth_utils import hash_password
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "password_hash": hash_password(payload.new_password),
            "password_reset_by_admin_at": datetime.utcnow().isoformat(),
            "password_reset_by_admin_id": user["id"],
        }},
    )
    # Clear any login attempt lockouts so the user can immediately sign in
    await db.login_attempts.delete_many({"identifier": f"email:{target['email']}"})
    return {"ok": True, "email": target["email"]}


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



@router.get("/platform-stats")
async def platform_stats(user=Depends(get_current_user)):
    """Lifetime + 24h totals of platform fees + royalties earned by the Blox platform owner."""
    _require_admin(user)
    from server import db
    from datetime import timedelta
    from models import now_utc

    owner = await db.users.find_one({"is_platform_owner": True}, {"_id": 1, "bloxbucks_balance": 1})
    if not owner:
        owner = await db.users.find_one({"role": "admin", "name": {"$regex": "^blox$", "$options": "i"}}, {"_id": 1, "bloxbucks_balance": 1})
    if not owner:
        return {"platform_owner": None, "lifetime_fees_bb": 0, "lifetime_royalties_bb": 0, "fees_24h_bb": 0, "balance_bb": 0, "recent": []}

    owner_id = str(owner["_id"])
    cutoff_24h = (now_utc() - timedelta(hours=24)).isoformat()

    # Aggregate platform_fee tx (Blox earns these as the owner)
    lifetime_fees = 0
    fees_24h = 0
    async for t in db.bloxbucks_transactions.find({"user_id": owner_id, "kind": "platform_fee"}):
        lifetime_fees += int(t.get("amount") or 0)
        if t.get("created_at", "") >= cutoff_24h:
            fees_24h += int(t.get("amount") or 0)

    # Total royalties paid out across the platform (analytics, not Blox's earnings)
    total_royalties = 0
    async for t in db.bloxbucks_transactions.find({"kind": "royalty"}):
        total_royalties += int(t.get("amount") or 0)

    # Recent platform-fee tx for Blox
    recent = []
    async for t in db.bloxbucks_transactions.find({"user_id": owner_id, "kind": "platform_fee"}).sort([("created_at", -1)]).limit(10):
        t["id"] = str(t.pop("_id"))
        recent.append(t)

    # Sales count
    sales_count = await db.marketplace_listings.count_documents({"status": "sold"})

    # USD top-up revenue (from payment_transactions)
    total_topup_usd = 0
    async for tx in db.payment_transactions.find({"kind": "bloxbucks_topup", "payment_status": "paid"}):
        total_topup_usd += float(tx.get("amount") or 0)

    return {
        "platform_owner_id": owner_id,
        "balance_bb": int(owner.get("bloxbucks_balance") or 0),
        "lifetime_fees_bb": lifetime_fees,
        "fees_24h_bb": fees_24h,
        "total_royalties_bb": total_royalties,
        "total_sales_count": sales_count,
        "total_topup_revenue_usd": round(total_topup_usd, 2),
        "recent_fee_transactions": recent,
    }


@router.get("/creators-connect-status")
async def creators_connect_status(user=Depends(get_current_user)):
    """List all users with Stripe Connect accounts + their KYC state.

    Returns three buckets:
      - onboarded: charges_enabled = True (can receive USD payouts)
      - pending: stripe_account_id exists but charges_enabled = False
      - never_started: no stripe_account_id at all (creators with at least one drop)
    """
    _require_admin(user)
    from server import db

    onboarded = []
    pending = []
    async for u in db.users.find(
        {"stripe_account_id": {"$exists": True, "$ne": None}},
        {"_id": 1, "email": 1, "name": 1, "stripe_account_id": 1,
         "stripe_charges_enabled": 1, "stripe_payouts_enabled": 1,
         "stripe_details_submitted": 1, "stripe_account_created_at": 1,
         "stripe_onboarded_at": 1},
    ):
        row = {
            "id": str(u["_id"]),
            "email": u.get("email"),
            "name": u.get("name") or u.get("email", "").split("@")[0],
            "stripe_account_id": u.get("stripe_account_id"),
            "charges_enabled": bool(u.get("stripe_charges_enabled")),
            "payouts_enabled": bool(u.get("stripe_payouts_enabled")),
            "details_submitted": bool(u.get("stripe_details_submitted")),
            "created_at": u.get("stripe_account_created_at"),
            "onboarded_at": u.get("stripe_onboarded_at"),
        }
        if row["charges_enabled"]:
            onboarded.append(row)
        else:
            pending.append(row)

    # Creators (have at least one generation) without any Stripe account
    creator_ids = set()
    async for gen in db.generations.find({"status": "completed"}, {"user_id": 1}):
        if gen.get("user_id"):
            creator_ids.add(gen["user_id"])

    never_started = []
    for cid in creator_ids:
        try:
            uobj = await db.users.find_one(
                {"_id": ObjectId(cid), "stripe_account_id": {"$in": [None, "", False]}},
                {"_id": 1, "email": 1, "name": 1},
            )
            if uobj:
                never_started.append({
                    "id": str(uobj["_id"]),
                    "email": uobj.get("email"),
                    "name": uobj.get("name") or uobj.get("email", "").split("@")[0],
                })
        except Exception:
            continue

    return {
        "onboarded": onboarded,
        "pending": pending,
        "never_started": never_started,
        "counts": {
            "onboarded": len(onboarded),
            "pending": len(pending),
            "never_started": len(never_started),
        },
    }
