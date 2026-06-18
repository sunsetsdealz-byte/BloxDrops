"""Stripe subscription/credit-pack checkout."""
import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from bson import ObjectId

from auth_utils import get_current_user
from models import CheckoutRequest, BoostCheckoutRequest, PACKAGES, BOOST_PRICE, BOOST_DURATION_HOURS, now_utc

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _checkout_client(host_url: str):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    api_key = os.environ["STRIPE_API_KEY"]
    base = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/") or host_url.rstrip("/")
    webhook_url = f"{base}/api/webhook/stripe"
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


@router.post("/payments/checkout")
async def create_checkout(payload: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    if payload.plan_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    pkg = PACKAGES[payload.plan_id]
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/pricing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing?status=cancelled"

    from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest
    client = _checkout_client(str(request.base_url))
    req = CheckoutSessionRequest(
        amount=float(pkg["price"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "plan_id": payload.plan_id,
            "credits": str(pkg["credits"]),
        },
    )
    session = await client.create_checkout_session(req)

    from server import db
    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": pkg["price"],
        "currency": pkg["currency"],
        "plan_id": payload.plan_id,
        "credits": pkg["credits"],
        "status": "initiated",
        "payment_status": "pending",
        "metadata": {"user_id": user["id"], "plan_id": payload.plan_id},
        "created_at": now_utc().isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request, user=Depends(get_current_user)):
    from server import db
    client = _checkout_client(str(request.base_url))
    status_resp = await client.get_checkout_status(session_id)

    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Idempotency: do not double-credit
    already_paid = tx.get("payment_status") == "paid"

    new_payment_status = status_resp.payment_status
    new_status = status_resp.status

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": new_status,
            "payment_status": new_payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    if new_payment_status == "paid" and not already_paid:
        # Grant credits + upgrade plan
        await db.users.update_one(
            {"_id": ObjectId(tx["user_id"])},
            {
                "$inc": {"credits": tx["credits"]},
                "$set": {"plan": tx["plan_id"]},
            },
        )

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": status_resp.amount_total,
        "currency": status_resp.currency,
    }


@router.post("/webhook/stripe")
async def webhook_stripe(request: Request):
    from server import db
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    client = _checkout_client(str(request.base_url))
    try:
        event = await client.handle_webhook(body, sig)
    except Exception as e:
        logger.exception("webhook failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))

    if event.payment_status == "paid" and event.session_id:
        tx = await db.payment_transactions.find_one({"session_id": event.session_id})
        if tx and tx.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}},
            )
            await db.users.update_one(
                {"_id": ObjectId(tx["user_id"])},
                {"$inc": {"credits": tx["credits"]}, "$set": {"plan": tx["plan_id"]}},
            )
    return {"received": True}


@router.get("/pricing/plans")
async def list_plans():
    return {
        "plans": [{"id": k, **v} for k, v in PACKAGES.items()],
        "boost": {"price": BOOST_PRICE, "duration_hours": BOOST_DURATION_HOURS},
    }


# ============== FEATURED FOR ROBUX BOOST ==============
@router.post("/boost/checkout")
async def boost_checkout(payload: BoostCheckoutRequest, request: Request, user=Depends(get_current_user)):
    """Create a Stripe checkout to pin a creation to the top of the feed for 24h."""
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(payload.generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    if gen.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only boost your own creations")

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/profile?boost_session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/profile?status=cancelled"

    from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest
    client = _checkout_client(str(request.base_url))
    req = CheckoutSessionRequest(
        amount=float(BOOST_PRICE),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "generation_id": payload.generation_id,
            "kind": "boost",
        },
    )
    session = await client.create_checkout_session(req)

    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": BOOST_PRICE,
        "currency": "usd",
        "kind": "boost",
        "generation_id": payload.generation_id,
        "status": "initiated",
        "payment_status": "pending",
        "metadata": {"user_id": user["id"], "generation_id": payload.generation_id, "kind": "boost"},
        "created_at": now_utc().isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}


@router.get("/boost/status/{session_id}")
async def boost_status(session_id: str, request: Request, user=Depends(get_current_user)):
    """Poll boost checkout status — on first 'paid' transition, pin the creation for 24h."""
    from server import db
    from datetime import timedelta

    client = _checkout_client(str(request.base_url))
    status_resp = await client.get_checkout_status(session_id)
    tx = await db.payment_transactions.find_one({"session_id": session_id, "kind": "boost"})
    if not tx:
        raise HTTPException(status_code=404, detail="Boost transaction not found")

    already_paid = tx.get("payment_status") == "paid"

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status_resp.status,
            "payment_status": status_resp.payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    if status_resp.payment_status == "paid" and not already_paid:
        featured_until = (now_utc() + timedelta(hours=BOOST_DURATION_HOURS)).isoformat()
        await db.generations.update_one(
            {"_id": ObjectId(tx["generation_id"])},
            {"$set": {"is_featured": True, "featured_until": featured_until}},
        )

    return {
        "status": status_resp.status,
        "payment_status": status_resp.payment_status,
    }
