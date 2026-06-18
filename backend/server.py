"""BloxDrops AI — FastAPI server entry point."""
import os
from dotenv import load_dotenv, dotenv_values
from pathlib import Path
ROOT_DIR = Path(__file__).parent
# Load .env WITHOUT overriding K8s-injected env vars (MONGO_URL, DB_NAME etc.
# must come from the production environment, not from a local .env file).
load_dotenv(ROOT_DIR / ".env", override=False)
# Surgical override: if STRIPE_API_KEY is the placeholder `sk_test_emergent`
# (injected at the shell level in some Kubernetes pods), prefer the value from
# the .env file so local/preview Stripe Connect works.
_env_file = dotenv_values(ROOT_DIR / ".env")
if os.environ.get("STRIPE_API_KEY", "") in ("", "sk_test_emergent") and _env_file.get("STRIPE_API_KEY"):
    os.environ["STRIPE_API_KEY"] = _env_file["STRIPE_API_KEY"]

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

logger = logging.getLogger("bloxdrops")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ============== DB ==============
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


# ============== STARTUP ==============
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bloxdrops.com").lower()
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
    """Seed a diverse set of unique sample creations for the gallery + battle.

    Each seed uses a unique public GLB so no two creations share a model.
    Re-seeds when the v2 marker is missing (lets us upgrade old demos).
    """
    has_v2 = await db.generations.count_documents({"demo_seed_v": 2}) > 0
    if has_v2:
        return

    # Wipe the old cycling demo set so the feed is clean
    await db.generations.delete_many({"demo_mode": True})

    samples = [
        # Roblox UGC head/hair/face
        {"prompt": "Glowing cyberpunk LED visor with shifting circuit patterns",
         "type": "Hat", "style": "cyberpunk",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
         "thumb": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=700&q=80"},
        # Torso / layered clothing
        {"prompt": "Pastel kawaii bunny-ear headband with cherry-blossom bows",
         "type": "Hat", "style": "kawaii",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
         "thumb": "https://images.unsplash.com/photo-1770177267441-1d8dadda4feb?w=700&q=80"},
        {"prompt": "Y2K chrome butterfly hair clips with pink glitter",
         "type": "Hair", "style": "y2k",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb",
         "thumb": "https://images.unsplash.com/photo-1734779205618-5b8e1c2ad88a?w=700&q=80"},
        {"prompt": "Gothic black hoodie with red demon eyes and stitched smile",
         "type": "Hoodie", "style": "gothic",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
         "thumb": "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=700&q=80"},
        {"prompt": "Holographic streetwear puffer jacket with neon zippers",
         "type": "Jacket", "style": "streetwear",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
         "thumb": "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700&q=80"},
        {"prompt": "Horror-style ragged trench coat with bleeding seams",
         "type": "Jacket", "style": "horror",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb",
         "thumb": "https://images.unsplash.com/photo-1614583224978-f05ce51ef5fa?w=700&q=80"},

        # Back / accessories / weapons
        {"prompt": "Flaming twin-handle battle axe with crystal core",
         "type": "Back", "style": "fantasy",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
         "thumb": "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=700&q=80"},
        {"prompt": "Mecha jetpack with twin glowing thrusters",
         "type": "Back", "style": "cyberpunk",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb",
         "thumb": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=80"},
        {"prompt": "Dragon-scale shoulder pads with smoldering embers",
         "type": "Shoulder", "style": "fantasy",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
         "thumb": "https://images.unsplash.com/photo-1614624533253-fae8b1716069?w=700&q=80"},
        {"prompt": "Cosmic galaxy water-bottle backpack with star particles",
         "type": "Back", "style": "fantasy",
         "model_url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
         "thumb": "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=700&q=80"},
    ]
    admin = await db.users.find_one({"role": "admin"})
    admin_id = str(admin["_id"]) if admin else "system"
    creators = ["BloxDrops", "ShadowLord_99", "PixelPrince", "NeonDrip", "CodeKween", "MintMaster", "RobloxRoyal", "GlitchKid"]
    for i, s in enumerate(samples):
        h = hash(s["prompt"])
        await db.generations.insert_one({
            "user_id": admin_id,
            "creator_name": creators[i % len(creators)],
            "prompt": s["prompt"],
            "original_prompt": s["prompt"],
            "type": "text",
            "attachment_type": s["type"],
            "style": s["style"],
            "source_image_url": None,
            "model_url": s["model_url"],
            "thumbnail_url": s["thumb"],
            "status": "completed",
            "likes": int(20 + 80 * (abs(h) % 7) / 7),
            "battle_wins": int(5 + (abs(h) % 15)),
            "battle_losses": int(2 + (abs(h) % 8)),
            "remix_count": int(abs(h) % 10),
            "remixed_from": None,
            "challenge_id": None,
            "created_at": now_utc().isoformat(),
            "demo_mode": True,
            "demo_seed_v": 2,
        })
    logger.info("Seeded %d unique demo creations", len(samples))


GENESIS_CAP = 100  # First 100 mint_ids ever are marked GENESIS forever


async def seed_genesis_collection():
    """Mark the earliest GENESIS_CAP generations (by created_at ASC) as Genesis.

    Idempotent — only flips drops that don't already have is_genesis set.
    New generations created while total drops < GENESIS_CAP are auto-marked Genesis
    via _create_generation_record (it queries the count before insert).
    """
    already = await db.generations.count_documents({"is_genesis": True})
    if already >= GENESIS_CAP:
        return
    needed = GENESIS_CAP - already
    cursor = db.generations.find(
        {"is_genesis": {"$ne": True}}
    ).sort([("created_at", 1)]).limit(needed)
    ids = [d["_id"] async for d in cursor]
    if ids:
        await db.generations.update_many(
            {"_id": {"$in": ids}},
            {"$set": {"is_genesis": True}},
        )
        logger.info("Marked %d drops as GENESIS (total Genesis now: %d)", len(ids), already + len(ids))


# Stale public placeholder GLBs from an earlier seed iteration. Generations
# still pointing at these get either re-pointed (Founder $50K 1/1) or deleted.
_STALE_MODEL_URLS = [
    "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
]
_FOUNDER_GLB = (
    "https://v3b.fal.media/files/b/0a9ed7e2/"
    "Q8Bo19MzdvvhsrSiyu1Nj_tripo_pbr_model_15f6c82a-5bb1-46af-861c-16498dc53ea2.glb"
)


async def _scrub_stale_model_urls():
    """Run on startup. Idempotent — no-op once the DB is clean."""
    founder_res = await db.generations.update_one(
        {"release_price_usd": 50000, "model_url": {"$in": _STALE_MODEL_URLS + [None, ""]}},
        {"$set": {"model_url": _FOUNDER_GLB}},
    )
    del_res = await db.generations.delete_many({
        "model_url": {"$in": _STALE_MODEL_URLS},
        "release_price_usd": {"$ne": 50000},
    })
    if founder_res.modified_count or del_res.deleted_count:
        logger.info(
            "Scrubbed stale model URLs (founder repointed: %d, demo deleted: %d)",
            founder_res.modified_count, del_res.deleted_count,
        )


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
    # Demo creations seeding intentionally disabled — feed is real-creator only.
    # await seed_demo_creations()
    await seed_genesis_collection()
    # Self-heal: scrub any leftover modelviewer.dev placeholder GLBs (astronaut /
    # robot) so users only ever see real generations and the Founder drop loads
    # its proper HD/PBR model on first request.
    await _scrub_stale_model_urls()

    # Write test credentials
    try:
        memdir = Path("/app/memory")
        memdir.mkdir(parents=True, exist_ok=True)
        (memdir / "test_credentials.md").write_text(
            "# BloxDrops AI — Test Credentials\n\n"
            "## Admin\n"
            f"- Email: `{os.environ.get('ADMIN_EMAIL', 'admin@bloxdrops.com')}`\n"
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


app = FastAPI(title="BloxDrops AI", lifespan=lifespan)

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

    # Banned accounts can't log in
    if user.get("banned"):
        raise HTTPException(status_code=403, detail="This account has been banned by an administrator.")

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
from upload_routes import router as upload_router
from export_routes import router as export_router
from password_routes import router as password_router
from roblox_routes import router as roblox_router
from admin_routes import router as admin_router
from marketplace_routes import router as marketplace_router
from bloxbucks_routes import router as bloxbucks_router
from connect_routes import router as connect_router

app.include_router(gen_router)
app.include_router(comm_router)
app.include_router(pay_router)
app.include_router(upload_router)
app.include_router(export_router)
app.include_router(password_router)
app.include_router(roblox_router)
app.include_router(admin_router)
app.include_router(marketplace_router)
app.include_router(bloxbucks_router)
app.include_router(connect_router)


# ============== META ==============
@app.get("/api/")
async def root():
    return {"app": "BloxDrops AI", "ok": True}


@app.get("/api/meta")
async def meta():
    return {
        "styles": STYLES,
        "attachment_types": ATTACHMENT_TYPES,
        "plans": [{"id": k, **v} for k, v in PACKAGES.items()],
        "fal_configured": bool(os.environ.get("FAL_KEY", "").strip()),
    }


@app.get("/api/stats")
async def public_stats():
    """Lightweight site-wide counters used by the landing page live ticker."""
    total = await db.generations.count_documents({"status": "completed"})
    pending = await db.generations.count_documents({"status": "pending"})
    creators = len(await db.generations.distinct("user_id"))
    battles = await db.battles.count_documents({"status": "voted"})
    likes = await db.likes.count_documents({})
    today_start = (now_utc().replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()
    today = await db.generations.count_documents({
        "status": "completed",
        "created_at": {"$gte": today_start},
    })
    total_genesis = await db.generations.count_documents({"is_genesis": True})
    genesis_remaining = max(0, GENESIS_CAP - total_genesis)
    return {
        "total_creations": total,
        "pending_now": pending,
        "creators": creators,
        "battles_settled": battles,
        "total_likes": likes,
        "today_creations": today,
        "genesis_total": GENESIS_CAP,
        "genesis_minted": min(total_genesis, GENESIS_CAP),
        "genesis_remaining": genesis_remaining,
    }
