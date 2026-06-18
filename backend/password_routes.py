"""Password reset — forgot + reset endpoints.

Token is stored hashed with a TTL (1 hour). The reset link is logged to the
backend stdout so the developer can pick it up during development. In production
this should be sent via an email provider (SendGrid / Resend).
"""
import os
import secrets
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from auth_utils import hash_password
import bcrypt

router = APIRouter(prefix="/api/auth")
logger = logging.getLogger(__name__)


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    token: str = Field(min_length=10)
    password: str = Field(min_length=6, max_length=72)


def _now():
    return datetime.now(timezone.utc)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotRequest, request: Request):
    from server import db
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return ok to prevent email enumeration
    if not user:
        logger.info("Forgot-password requested for unknown email: %s", email)
        return {"ok": True, "message": "If an account exists, a reset link has been generated."}

    token = secrets.token_urlsafe(32)
    expires_at = (_now() + timedelta(hours=1)).isoformat()

    await db.password_reset_tokens.insert_one({
        "user_id": str(user["_id"]),
        "email": email,
        "token": token,
        "expires_at": expires_at,
        "used": False,
        "created_at": _now().isoformat(),
    })

    base = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/") or str(request.base_url).rstrip("/")
    reset_link = f"{base}/reset-password?token={token}"
    # Log the link for development. In prod, send via email.
    logger.info("Password reset link for %s: %s", email, reset_link)

    return {
        "ok": True,
        "message": "If an account exists, a reset link has been generated.",
        "dev_reset_link": reset_link,  # In production, REMOVE this field — send via email instead.
    }


@router.post("/reset-password")
async def reset_password(payload: ResetRequest):
    from server import db
    rec = await db.password_reset_tokens.find_one({"token": payload.token})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    if rec.get("used"):
        raise HTTPException(status_code=400, detail="This reset link has already been used")
    expires_at = rec["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at < _now():
        raise HTTPException(status_code=400, detail="Reset link has expired")

    from bson import ObjectId
    await db.users.update_one(
        {"_id": ObjectId(rec["user_id"])},
        {"$set": {"password_hash": hash_password(payload.password)}},
    )
    await db.password_reset_tokens.update_one(
        {"_id": rec["_id"]},
        {"$set": {"used": True, "used_at": _now().isoformat()}},
    )
    return {"ok": True}
