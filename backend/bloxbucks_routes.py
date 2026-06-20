"""BloxBucks Top-Up via Stripe Checkout — Phase 2.2.

Buyer flow:
1. POST /api/bloxbucks/topup/checkout {package_id, origin_url} → Stripe URL
2. User completes payment on Stripe
3. Frontend polls /api/bloxbucks/topup/status/{session_id}
4. On first 'paid' transition: credit BB to user (idempotent) + write transaction
"""
import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from bson import ObjectId
from pydantic import BaseModel, Field

from auth_utils import get_current_user
from models import now_utc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


# Server-defined packages (NEVER trust frontend amounts)
# Bonus math: Starter is the baseline (50 BB/$). Pro and Whale stack BB-per-$ for value.
BB_PACKAGES = {
    "starter": {"bb": 1000,  "usd": 19.99,  "label": "Starter",     "perk": ""},
    "pro":     {"bb": 5000,  "usd": 49.99,  "label": "Pro",         "perk": "+100% bonus value"},
    "whale":   {"bb": 25000, "usd": 199.99, "label": "Whale Pack",  "perk": "+150% bonus · best value"},
}


class TopUpRequest(BaseModel):
    package_id: str = Field(min_length=1)
    origin_url: str = Field(min_length=8)


def _stripe():
    """Configure & return the native stripe SDK module."""
    import stripe
    stripe.api_key = os.environ["STRIPE_API_KEY"]
    return stripe


def _create_bb_checkout(*, amount_usd: float, success_url: str, cancel_url: str,
                        product_name: str, metadata: dict):
    stripe = _stripe()
    return stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": product_name},
                "unit_amount": int(round(float(amount_usd) * 100)),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )


@router.get("/bloxbucks/packages")
async def list_bb_packages():
    return {"packages": [{"id": k, **v} for k, v in BB_PACKAGES.items()]}


@router.post("/bloxbucks/topup/checkout")
async def topup_checkout(payload: TopUpRequest, request: Request, user=Depends(get_current_user)):
    if payload.package_id not in BB_PACKAGES:
        raise HTTPException(400, "Unknown package")
    pkg = BB_PACKAGES[payload.package_id]
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/marketplace?topup_session={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/marketplace?topup_status=cancelled"

    from server import db
    session = _create_bb_checkout(
        amount_usd=float(pkg["usd"]),
        success_url=success_url,
        cancel_url=cancel_url,
        product_name=f"BloxBucks — {pkg['label']} ({pkg['bb']} BB)",
        metadata={
            "user_id": user["id"],
            "kind": "bloxbucks_topup",
            "package_id": payload.package_id,
            "bb": str(pkg["bb"]),
        },
    )

    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "session_id": session.id,
        "amount": pkg["usd"],
        "currency": "usd",
        "kind": "bloxbucks_topup",
        "package_id": payload.package_id,
        "bb": pkg["bb"],
        "status": "initiated",
        "payment_status": "pending",
        "metadata": {"user_id": user["id"], "kind": "bloxbucks_topup", "package_id": payload.package_id},
        "created_at": now_utc().isoformat(),
    })
    return {"url": session.url, "session_id": session.id}


async def _credit_bb_for_session(db, session_id: str):
    """Idempotent: credit BloxBucks for a paid bloxbucks_topup tx."""
    tx = await db.payment_transactions.find_one({"session_id": session_id, "kind": "bloxbucks_topup"})
    if not tx or tx.get("bb_credited"):
        return tx
    bb = int(tx.get("bb") or 0)
    if bb <= 0:
        return tx
    res = await db.users.find_one_and_update(
        {"_id": ObjectId(tx["user_id"])},
        {"$inc": {"bloxbucks_balance": bb}},
        return_document=True,
    )
    new_balance = int((res or {}).get("bloxbucks_balance") or 0)
    await db.bloxbucks_transactions.insert_one({
        "_id": ObjectId(),
        "user_id": tx["user_id"],
        "kind": "topup",
        "amount": bb,
        "balance_after": new_balance,
        "related": {"stripe_session_id": session_id, "package_id": tx.get("package_id"), "usd": tx.get("amount")},
        "created_at": now_utc().isoformat(),
    })
    await db.payment_transactions.update_one(
        {"_id": tx["_id"]},
        {"$set": {"bb_credited": True, "bb_credited_at": now_utc().isoformat()}},
    )
    return tx


@router.get("/bloxbucks/topup/status/{session_id}")
async def topup_status(session_id: str, request: Request, user=Depends(get_current_user)):
    from server import db
    stripe = _stripe()
    sess = stripe.checkout.Session.retrieve(session_id)

    tx = await db.payment_transactions.find_one({"session_id": session_id, "kind": "bloxbucks_topup"})
    if not tx:
        raise HTTPException(404, "Transaction not found")
    if tx["user_id"] != user["id"]:
        raise HTTPException(403, "Not your transaction")

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": sess.status,
            "payment_status": sess.payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    if sess.payment_status == "paid":
        await _credit_bb_for_session(db, session_id)

    new_balance = (await db.users.find_one({"_id": ObjectId(user["id"])}, {"bloxbucks_balance": 1}) or {}).get("bloxbucks_balance", 0)
    return {
        "status": sess.status,
        "payment_status": sess.payment_status,
        "bb_credited": tx.get("bb_credited", False) or sess.payment_status == "paid",
        "bb_amount": tx.get("bb"),
        "new_balance": int(new_balance),
    }
