"""Stripe Connect Express — creator payouts onboarding (Phase 2.3).

Flow:
1. POST /api/connect/onboard → create Express account if missing, return hosted
   onboarding URL (account_link).
2. User completes KYC on stripe-hosted page → redirected to /profile?connect=success
3. GET /api/connect/status → re-fetches the account from Stripe and syncs
   `stripe_charges_enabled`, `stripe_payouts_enabled`, `stripe_details_submitted`
   to MongoDB.

Uses raw `stripe` SDK (Connect features are not exposed by emergentintegrations).
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


def _stripe():
    import stripe
    key = os.environ.get("STRIPE_API_KEY", "")
    # Detect the emergentintegrations proxy key — real Stripe Connect needs a real sk_test_/sk_live_ key
    if key == "sk_test_emergent" or not key.startswith(("sk_test_", "sk_live_")):
        raise HTTPException(
            503,
            "Stripe Connect requires a real Stripe secret key. "
            "Add `STRIPE_API_KEY=sk_test_...` from https://dashboard.stripe.com/test/apikeys to backend/.env and restart."
        )
    stripe.api_key = key
    return stripe


@router.get("/connect/configured")
async def connect_configured():
    """Public probe — does the backend have a real Stripe key configured for Connect?"""
    key = os.environ.get("STRIPE_API_KEY", "")
    real_key = key.startswith(("sk_test_", "sk_live_")) and key != "sk_test_emergent"
    return {"configured": real_key, "mode": "live" if key.startswith("sk_live_") else "test" if real_key else "missing"}


class OnboardRequest(BaseModel):
    origin_url: str = Field(min_length=8)


@router.post("/connect/onboard")
async def connect_onboard(payload: OnboardRequest, user=Depends(get_current_user)):
    """Create (or fetch) Express account and return hosted onboarding URL."""
    from server import db
    stripe = _stripe()
    origin = payload.origin_url.rstrip("/")

    udoc = await db.users.find_one({"_id": ObjectId(user["id"])})
    account_id = udoc.get("stripe_account_id")

    try:
        if not account_id:
            acc = stripe.Account.create(
                type="express",
                email=user["email"],
                capabilities={
                    "transfers": {"requested": True},
                },
                business_type="individual",
                metadata={"bloxdrops_user_id": user["id"]},
            )
            account_id = acc.id
            await db.users.update_one(
                {"_id": ObjectId(user["id"])},
                {"$set": {
                    "stripe_account_id": account_id,
                    "stripe_account_created_at": now_utc().isoformat(),
                    "stripe_charges_enabled": False,
                    "stripe_payouts_enabled": False,
                    "stripe_details_submitted": False,
                }},
            )
            logger.info("Created Stripe Connect account %s for user %s", account_id, user["id"])

        link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=f"{origin}/profile?connect=refresh",
            return_url=f"{origin}/profile?connect=success",
            type="account_onboarding",
        )
        return {"url": link.url, "account_id": account_id}
    except Exception as e:
        logger.exception("connect_onboard failed: %s", e)
        raise HTTPException(500, f"Stripe error: {e}")


@router.get("/connect/status")
async def connect_status(user=Depends(get_current_user)):
    """Fetch latest account state from Stripe + sync to DB."""
    from server import db

    udoc = await db.users.find_one({"_id": ObjectId(user["id"])})
    account_id = udoc.get("stripe_account_id")
    if not account_id:
        return {
            "onboarded": False,
            "account_id": None,
            "charges_enabled": False,
            "payouts_enabled": False,
            "details_submitted": False,
        }

    stripe = _stripe()
    try:
        acc = stripe.Account.retrieve(account_id)
    except Exception as e:
        logger.warning("Account.retrieve failed: %s", e)
        raise HTTPException(500, "Could not fetch Stripe account status")

    charges_enabled = bool(getattr(acc, "charges_enabled", False))
    payouts_enabled = bool(getattr(acc, "payouts_enabled", False))
    details_submitted = bool(getattr(acc, "details_submitted", False))

    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {
            "stripe_charges_enabled": charges_enabled,
            "stripe_payouts_enabled": payouts_enabled,
            "stripe_details_submitted": details_submitted,
            "stripe_status_updated_at": now_utc().isoformat(),
            **({"stripe_onboarded_at": now_utc().isoformat()} if details_submitted and not udoc.get("stripe_onboarded_at") else {}),
        }},
    )

    return {
        "onboarded": charges_enabled or payouts_enabled,
        "account_id": account_id,
        "charges_enabled": charges_enabled,
        "payouts_enabled": payouts_enabled,
        "details_submitted": details_submitted,
        "requirements": {
            "currently_due": list(getattr(acc.requirements, "currently_due", []) or []),
            "eventually_due": list(getattr(acc.requirements, "eventually_due", []) or []),
            "disabled_reason": getattr(acc.requirements, "disabled_reason", None),
        } if hasattr(acc, "requirements") else None,
    }


@router.post("/connect/login-link")
async def connect_login_link(user=Depends(get_current_user)):
    """Generate a one-time login link to the Express dashboard for the creator."""
    from server import db
    stripe = _stripe()
    udoc = await db.users.find_one({"_id": ObjectId(user["id"])})
    account_id = udoc.get("stripe_account_id")
    if not account_id:
        raise HTTPException(400, "No connected account — onboard first")
    try:
        link = stripe.Account.create_login_link(account_id)
        return {"url": link.url}
    except Exception as e:
        logger.exception("login link failed: %s", e)
        raise HTTPException(500, f"Stripe error: {e}")
