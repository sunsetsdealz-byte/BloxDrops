"""BloxCraft AI — backend models & shared utilities."""
from datetime import datetime, timezone
from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, BeforeValidator, EmailStr, ConfigDict
from bson import ObjectId


def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    return dt.isoformat()


# ============== AUTH ==============
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    plan: str = "free"
    credits: int = 20
    created_at: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    name: str = Field(min_length=1, max_length=50)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserPublic
    access_token: str


# ============== GENERATIONS ==============
class GenerationRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=500)
    attachment_type: str = "Hat"  # Hat, Hair, Back, Neck, Face, Hoodie, Shirt, Pants, auto
    style: str = "auto"  # auto, anime, gothic, streetwear, cyberpunk, realistic, fantasy
    challenge_id: Optional[str] = None


class ImageGenerationRequest(BaseModel):
    image_url: str
    attachment_type: str = "auto"
    style: str = "auto"


class PromptEnhanceRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=200)
    attachment_type: str = "Hat"
    style: str = "auto"


class GenerationPublic(BaseModel):
    id: str
    user_id: str
    creator_name: str
    prompt: str
    original_prompt: Optional[str] = None
    attachment_type: str
    style: str
    type: str  # text | image
    source_image_url: Optional[str] = None
    model_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str
    likes: int = 0
    battle_wins: int = 0
    battle_losses: int = 0
    remix_count: int = 0
    remixed_from: Optional[str] = None
    challenge_id: Optional[str] = None
    is_liked: bool = False
    created_at: str


# ============== BATTLE ==============
class BattleVoteRequest(BaseModel):
    battle_id: str
    winner_id: str


# ============== CHALLENGE ==============
class ChallengePublic(BaseModel):
    id: str
    title: str
    theme: str
    description: str
    starts_at: str
    ends_at: str
    is_active: bool
    entry_count: int = 0


# ============== PAYMENTS ==============
class CheckoutRequest(BaseModel):
    plan_id: str  # creator | pro
    origin_url: str


# Subscription packages (fixed server-side — never trust client price)
PACKAGES = {
    "creator": {"name": "Creator", "price": 9.0, "credits": 300, "currency": "usd"},
    "pro": {"name": "Pro", "price": 18.0, "credits": 700, "currency": "usd"},
}

# Style options
STYLES = ["auto", "anime", "gothic", "streetwear", "cyberpunk", "realistic", "fantasy", "kawaii", "horror", "y2k"]
ATTACHMENT_TYPES = ["Hat", "Hair", "Back", "Neck", "Face", "Shoulder", "Waist", "Front", "Hoodie", "Shirt", "Pants", "Jacket", "auto"]
