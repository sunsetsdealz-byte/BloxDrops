"""BloxCraft AI — FastAPI server entry point."""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from models import (
    RegisterRequest, LoginRequest, UserPublic, AuthResponse,
    PACKAGES, STYLES, ATTACHMENT_TYPES, now_utc,
)
from auth_utils import (
    hash_password, verify_password, create_access_token, get_current_user,
)

logger = logging.getLogger("bloxcraft")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ============== DB ==============
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# ============== STARTUP ==============
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bloxcraft.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "plan": "pro",
            "credits": 9999,
            "created_at": now_utc(),
        })
        logger.info("Seeded admin user: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


CHALLENGE_SEEDS = [
    {"title": "Cyberpunk Streetwear", "theme": "cyberpunk", "description": "Neon-lit gear from the year 2099. Glowing accents only."},
    {"title": "Cozy Holiday Vibes", "theme": "cozy", "description": "Knitted sweaters, fluffy hats, snowflakes & warmth."},
    {"title": "Anime Hero Drop", "theme": "anime", "description": "Spiky hair, oversized hoodies, dramatic capes. Show off!"},
    {"title": "Gothic Royal Court", "theme": "gothic", "description": "Crowns, lace, midnight black & blood red."},
    {"title": "Y2K Throwback", "theme": "y2k", "description": "Pixel butterflies, low-rise everything, chrome accents."},
    {"title": "Mythical Beasts", "theme": "fantasy", "description": "Dragon scales, fairy wings, horns of legend."},
    {"title": "Streetwear Saints", "theme": "streetwear", "description": "Big logos, sneakers culture, oversized fits."},
]


async def seed_challenges():
    count = await db.challenges.count_documents({})
    if count > 0:
        return
    now = now_utc()
    for i, seed in enumerate(CHALLENGE_SEEDS):
        starts = now - timedelta(days=(len(CHALLENGE_SEEDS) - 1 - i))
        ends = starts + timedelta(days=7)
        await db.challenges.insert_one({
            **seed,
            "starts_at": starts.isoformat(),
            "ends_at": ends.isoformat(),
            "is_active": i == len(CHALLENGE_SEEDS) - 1,
            "created_at": now.isoformat(),
        })
    logger.info("Seeded %d challenges", len(CHALLENGE_SEEDS))


async def seed_demo_creations():
    """Seed a few sample creations so the gallery & battle screens aren't empty."""
    if await db.generations.count_documents({}) > 0:
        return
    samples = [
        {"prompt": "Glowing neon cyberpunk visor with circuit patterns", "type": "Hat", "style": "cyberpunk",
         "model_url": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
         "thumb": "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=600&q=80"},
        {"prompt": "Anime spiky red and black hair with golden tips", "type": "Hair", "style": "anime",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
         "thumb": "https://images.unsplash.com/photo-1741177479787-f6c63266af14?w=600&q=80"},
        {"prompt": "Gothic black hoodie with red demon eyes and stitched smile", "type": "Hoodie", "style": "gothic",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
         "thumb": "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=600&q=80"},
        {"prompt": "Pastel kawaii bunny ears headband with bows", "type": "Hat", "style": "kawaii",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
         "thumb": "https://images.unsplash.com/photo-1770177267441-1d8dadda4feb?w=600&q=80"},
        {"prompt": "Flaming axe with crystal handle, Genshin style", "type": "Back", "style": "fantasy",
         "model_url": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
         "thumb": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80"},
        {"prompt": "Y2K chrome butterfly hair clips with pink glitter", "type": "Hair", "style": "y2k",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
         "thumb": "https://images.unsplash.com/photo-1734779205618-5b8e1c2ad88a?w=600&q=80"},
    ]
    admin = await db.users.find_one({"role": "admin"})
    admin_id = str(admin["_id"]) if admin else "system"
    for s in samples:
        await db.generations.insert_one({
            "user_id": admin_id,
            "creator_name": "BloxCraft",
            "prompt": s["prompt"],
            "original_prompt": s["prompt"],
            "type": "text",
            "attachment_type": s["type"],
            "style": s["style"],
            "source_image_url": None,
            "model_url": s["model_url"],
            "thumbnail_url": s["thumb"],
            "status": "completed",
            "likes": int(20 + 80 * (hash(s["prompt"]) % 7) / 7),
            "battle_wins": int(5 + (hash(s["prompt"]) % 15)),
            "battle_losses": int(2 + (hash(s["prompt"]) % 8)),
            "remix_count": int(hash(s["prompt"]) % 10),
            "remixed_from": None,
            "challenge_id": None,
            "created_at": now_utc().isoformat(),
            "demo_mode": True,
        })
    logger.info("Seeded %d demo creations", len(samples))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.generations.create_index("user_id")
    await db.generations.create_index("status")
    await db.likes.create_index([("user_id", 1), ("generation_id", 1)], unique=True)
    await db.battles.create_index("voter_id")
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.login_attempts.create_index("identifier")

    await seed_admin()
    await seed_challenges()
    await seed_demo_creations()

    # Write test credentials
    try:
        memdir = Path("/app/memory")
        memdir.mkdir(parents=True, exist_ok=True)
        (memdir / "test_credentials.md").write_text(
            "# BloxCraft AI — Test Credentials\n\n"
            "## Admin\n"
            f"- Email: `{os.environ.get('ADMIN_EMAIL', 'admin@bloxcraft.ai')}`\n"
            f"- Password: `{os.environ.get('ADMIN_PASSWORD', 'admin123')}`\n"
            "- Role: admin\n\n"
            "## Test Users\n"
            "Register via POST /api/auth/register with any unique email + 6+ char password.\n\n"
            "## Auth Endpoints\n"
            "- POST /api/auth/register\n"
            "- POST /api/auth/login\n"
            "- POST /api/auth/logout\n"
            "- GET /api/auth/me  (Bearer token required)\n\n"
            "## Notes\n"
            "- Tokens returned in JSON `access_token` field — send as `Authorization: Bearer <token>`.\n"
            "- Demo mode: when FAL_KEY env is empty, generation endpoints return sample GLB models after ~4s.\n"
        )
    except Exception as e:
        logger.warning("could not write test_credentials.md: %s", e)

    yield
    client.close()


app = FastAPI(title="BloxCraft AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== AUTH ROUTES ==============
auth_router = APIRouter(prefix="/api/auth")


def _user_to_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "plan": u.get("plan", "free"),
        "credits": u.get("credits", 0),
        "created_at": (u["created_at"].isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at", "")),
    }


@auth_router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": "user",
        "plan": "free",
        "credits": 20,
        "created_at": now_utc(),
    }
    res = await db.users.insert_one(doc)
    user_id = str(res.inserted_id)
    token = create_access_token(user_id, email)
    return {
        "user": _user_to_public({"_id": res.inserted_id, **doc}),
        "access_token": token,
    }


@auth_router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request):
    email = payload.email.lower().strip()
    # Use forwarded IP if available, fall back to email-only bucket so K8s ingress
    # rotating upstream IPs cannot bypass the 5-attempt cap.
    fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = fwd or (request.client.host if request.client else "unknown")
    identifier = f"email:{email}"  # primary bucket — email-only
    _ip_bucket = f"ip:{ip}:{email}"  # secondary, for analytics only

    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked_until = attempt["locked_until"]
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        # Increment attempts
        new_count = (attempt["count"] + 1) if attempt else 1
        update = {"count": new_count, "last_attempt": now_utc().isoformat(), "identifier": identifier}
        if new_count >= 5:
            update["locked_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one(
            {"identifier": identifier}, {"$set": update}, upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Clear attempts
    await db.login_attempts.delete_one({"identifier": identifier})

    token = create_access_token(str(user["_id"]), email)
    return {"user": _user_to_public(user), "access_token": token}


@auth_router.get("/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return user


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


app.include_router(auth_router)

# Mount feature routers
from generation_routes import router as gen_router
from community_routes import router as comm_router
from payment_routes import router as pay_router

app.include_router(gen_router)
app.include_router(comm_router)
app.include_router(pay_router)


# ============== META ==============
@app.get("/api/")
async def root():
    return {"app": "BloxCraft AI", "ok": True}


@app.get("/api/meta")
async def meta():
    return {
        "styles": STYLES,
        "attachment_types": ATTACHMENT_TYPES,
        "plans": [{"id": k, **v} for k, v in PACKAGES.items()],
        "fal_configured": bool(os.environ.get("FAL_KEY", "").strip()),
    }
