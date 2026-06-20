"""Stripe subscription/credit-pack checkout — native Stripe SDK."""
import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from bson import ObjectId

from auth_utils import get_current_user
from models import CheckoutRequest, BoostCheckoutRequest, PACKAGES, BOOST_PRICE, BOOST_DURATION_HOURS, now_utc

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _stripe():
    """Configure & return the native stripe SDK module."""
    import stripe
    stripe.api_key = os.environ["STRIPE_API_KEY"]
    return stripe


def _amount_cents(usd_amount: float) -> int:
    return int(round(float(usd_amount) * 100))


def _create_session(*, amount_usd: float, currency: str, success_url: str, cancel_url: str,
                    product_name: str, metadata: dict):
    """Wrapper around stripe.checkout.Session.create for one-off product payments."""
    stripe = _stripe()
    return stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": currency,
                "product_data": {"name": product_name},
                "unit_amount": _amount_cents(amount_usd),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )


@router.post("/payments/checkout")
async def create_checkout(payload: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    if payload.plan_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    pkg = PACKAGES[payload.plan_id]
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/pricing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing?status=cancelled"

    session = _create_session(
        amount_usd=float(pkg["price"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        product_name=pkg.get("name") or pkg.get("label") or payload.plan_id,
        metadata={
            "user_id": user["id"],
            "plan_id": payload.plan_id,
            "credits": str(pkg["credits"]),
        },
    )

    from server import db
    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "session_id": session.id,
        "amount": pkg["price"],
        "currency": pkg["currency"],
        "plan_id": payload.plan_id,
        "credits": pkg["credits"],
        "status": "initiated",
        "payment_status": "pending",
        "metadata": {"user_id": user["id"], "plan_id": payload.plan_id},
        "created_at": now_utc().isoformat(),
    })

    return {"url": session.url, "session_id": session.id}


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request, user=Depends(get_current_user)):
    from server import db
    stripe = _stripe()
    sess = stripe.checkout.Session.retrieve(session_id)

    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    already_paid = tx.get("payment_status") == "paid"

    new_payment_status = sess.payment_status
    new_status = sess.status

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
        "amount_total": sess.amount_total,
        "currency": sess.currency,
    }


@router.post("/webhook/stripe")
async def webhook_stripe(request: Request):
    from server import db
    stripe = _stripe()
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(body, sig, webhook_secret)
        else:
            # No secret configured — parse without signature verification (dev only)
            import json as _json
            event = stripe.Event.construct_from(_json.loads(body), stripe.api_key)
    except Exception as e:
        logger.exception("webhook signature/parse failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        session_obj = event["data"]["object"]
        session_id = session_obj.get("id")
        payment_status = session_obj.get("payment_status")

        if payment_status == "paid" and session_id:
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}},
                )
                kind = tx.get("kind")
                if kind == "bloxbucks_topup":
                    from bloxbucks_routes import _credit_bb_for_session
                    await _credit_bb_for_session(db, session_id)
                elif kind == "boost":
                    from datetime import timedelta
                    featured_until = (now_utc() + timedelta(hours=24)).isoformat()
                    await db.generations.update_one(
                        {"_id": ObjectId(tx["generation_id"])},
                        {"$set": {"is_featured": True, "featured_until": featured_until}},
                    )
                else:
                    # Default = subscription / credit pack
                    if tx.get("credits") and tx.get("plan_id"):
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


# ============== ADMIN-ONLY FREE BOOST ==============
@router.post("/boost/free/{generation_id}")
async def admin_free_boost(generation_id: str, user=Depends(get_current_user)):
    """Admin-only — pin a creation for 24h without paying. Regular users get 403."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    from server import db
    from datetime import timedelta
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    featured_until = (now_utc() + timedelta(hours=BOOST_DURATION_HOURS)).isoformat()
    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": {
            "is_featured": True,
            "featured_until": featured_until,
            "free_boost_reason": "admin_freebie",
        }},
    )
    return {"ok": True, "is_featured": True, "featured_until": featured_until}


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

    session = _create_session(
        amount_usd=float(BOOST_PRICE),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        product_name=f"24h Boost — {payload.generation_id}",
        metadata={
            "user_id": user["id"],
            "generation_id": payload.generation_id,
            "kind": "boost",
        },
    )

    await db.payment_transactions.insert_one({
        "user_id": user["id"],
        "session_id": session.id,
        "amount": BOOST_PRICE,
        "currency": "usd",
        "kind": "boost",
        "generation_id": payload.generation_id,
        "status": "initiated",
        "payment_status": "pending",
        "metadata": {"user_id": user["id"], "generation_id": payload.generation_id, "kind": "boost"},
        "created_at": now_utc().isoformat(),
    })

    return {"url": session.url, "session_id": session.id}


@router.get("/boost/status/{session_id}")
async def boost_status(session_id: str, request: Request, user=Depends(get_current_user)):
    """Poll boost checkout status — on first 'paid' transition, pin the creation for 24h."""
    from server import db
    from datetime import timedelta

    stripe = _stripe()
    sess = stripe.checkout.Session.retrieve(session_id)
    tx = await db.payment_transactions.find_one({"session_id": session_id, "kind": "boost"})
    if not tx:
        raise HTTPException(status_code=404, detail="Boost transaction not found")

    already_paid = tx.get("payment_status") == "paid"

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": sess.status,
            "payment_status": sess.payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    if sess.payment_status == "paid" and not already_paid:
        featured_until = (now_utc() + timedelta(hours=BOOST_DURATION_HOURS)).isoformat()
        await db.generations.update_one(
            {"_id": ObjectId(tx["generation_id"])},
            {"$set": {"is_featured": True, "featured_until": featured_until}},
        )

    return {
        "status": sess.status,
        "payment_status": sess.payment_status,
    }
