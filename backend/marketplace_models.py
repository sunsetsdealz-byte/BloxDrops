"""BloxDrops Marketplace — Pydantic models for Phase 2.1 + 2.4 (USD).

Collections:
- `ownerships`              : who owns each edition of each drop
- `marketplace_listings`    : active sale listings
- `bloxbucks_transactions`  : BB ledger (kind: topup | spend | earn | royalty | grant | platform_fee)
- `payment_transactions`    : Stripe Checkout sessions (BB topups + USD drop purchases)
"""
from typing import Optional
from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    generation_id: str
    edition_number: int = 1
    price_bloxbucks: Optional[int] = Field(default=None, ge=100, description="Price in BloxBucks (min 100 BB)")
    price_usd_cents: Optional[int] = Field(default=None, ge=100, description="Price in USD cents (min $1.00)")


class BuyRequest(BaseModel):
    currency: str = "bloxbucks"  # "bloxbucks" or "usd"


class UsdCheckoutRequest(BaseModel):
    origin_url: str = Field(min_length=8)


class AdminGrantBB(BaseModel):
    user_email: str
    amount: int = Field(ge=1, le=1_000_000)
    reason: str = "admin_grant"
