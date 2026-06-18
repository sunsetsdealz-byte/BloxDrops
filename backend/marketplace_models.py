"""BloxDrops Marketplace — Pydantic models for Phase 2.1 foundation.

Collections:
- `ownerships`              : who owns each edition of each drop
- `marketplace_listings`    : active sale listings
- `bloxbucks_transactions`  : BB ledger (kind: topup | spend | earn | royalty | grant)
"""
from typing import Optional
from pydantic import BaseModel, Field


class ListingCreate(BaseModel):
    generation_id: str
    edition_number: int = 1
    price_bloxbucks: int = Field(ge=100, description="Price in BloxBucks (min 100 BB)")


class BuyRequest(BaseModel):
    # currency reserved for future USD support
    currency: str = "bloxbucks"


class AdminGrantBB(BaseModel):
    user_email: str
    amount: int = Field(ge=1, le=1_000_000)
    reason: str = "admin_grant"
