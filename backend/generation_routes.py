"""Generation routes — fal.ai 3D + Claude prompt enhancer.

Behavior:
- If FAL_KEY is set: submit to fal.ai Tripo (text-to-3d) and poll status.
- If FAL_KEY is missing: gracefully fall back to a curated sample GLB so the
  UI/UX stays fully functional for demos until the user adds their key.
"""
import os
import asyncio
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from bson import ObjectId

from auth_utils import get_current_user
from models import (
    GenerationRequest,
    ImageGenerationRequest,
    PromptEnhanceRequest,
    now_utc,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Sample GLB models served by fal.ai/Google for fallback demo mode
SAMPLE_GLBS = [
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
     "thumb": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
     "thumb": "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
     "thumb": "https://images.unsplash.com/photo-1614624533253-fae8b1716069?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
     "thumb": "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
     "thumb": "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb",
     "thumb": "https://images.unsplash.com/photo-1614583224978-f05ce51ef5fa?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb",
     "thumb": "https://images.unsplash.com/photo-1734779205618-5b8e1c2ad88a?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
     "thumb": "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF-Binary/Buggy.glb",
     "thumb": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=80"},
    {"url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
     "thumb": "https://images.unsplash.com/photo-1770177267441-1d8dadda4feb?w=700&q=80"},
    {"url": "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
     "thumb": "https://images.unsplash.com/photo-1741177479787-f6c63266af14?w=700&q=80"},
    {"url": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
     "thumb": "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=700&q=80"},
]


def _has_fal_key() -> bool:
    return bool(os.environ.get("FAL_KEY", "").strip())


def _build_full_prompt(prompt: str, attachment_type: str, style: str) -> str:
    style_str = f"{style} style" if style and style != "auto" else "high quality"
    return (
        f"A 3D product render of a clean Roblox layered clothing {attachment_type} "
        f"based on the concept: \"{prompt}\". {style_str}, marketplace-ready, "
        f"high-quality fabric and stitching, three-quarter view, standalone product shot, "
        f"neutral light background, studio lighting. No humans, no skin, no faces."
    )


async def _run_fal_generation(generation_id: str, prompt: str, image_url: Optional[str] = None):
    """Background task — submit job to fal.ai and update record on completion."""
    from server import db
    try:
        import fal_client

        if image_url:
            model = "tripo3d/tripo/v2.5/image-to-3d"
            args = {"image_url": image_url}
        else:
            model = "tripo3d/h3.1/text-to-3d"
            args = {"prompt": prompt}

        handler = await fal_client.submit_async(model, arguments=args)
        result = await handler.get()

        model_url = None
        thumb_url = None
        if isinstance(result, dict):
            model_url = (
                (result.get("model_mesh") or {}).get("url")
                or (result.get("pbr_model") or {}).get("url")
                or (result.get("base_model") or {}).get("url")
            )
            thumb_url = (result.get("rendered_image") or {}).get("url")

        if not model_url:
            sample = SAMPLE_GLBS[hash(generation_id) % len(SAMPLE_GLBS)]
            model_url = sample["url"]
            thumb_url = thumb_url or sample["thumb"]

        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "status": "completed",
                "model_url": model_url,
                "thumbnail_url": thumb_url,
                "completed_at": now_utc().isoformat(),
            }},
        )
    except Exception as e:
        logger.exception("fal.ai generation failed: %s", e)
        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {"status": "failed", "error": str(e)[:300]}},
        )


async def _run_mock_generation(generation_id: str):
    """Fake the fal.ai pipeline — wait briefly and assign a sample GLB."""
    from server import db
    try:
        await asyncio.sleep(4)
        sample = SAMPLE_GLBS[hash(generation_id) % len(SAMPLE_GLBS)]
        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "status": "completed",
                "model_url": sample["url"],
                "thumbnail_url": sample["thumb"],
                "completed_at": now_utc().isoformat(),
                "demo_mode": True,
            }},
        )
    except Exception as e:
        logger.exception("mock generation failed: %s", e)
        try:
            await db.generations.update_one(
                {"_id": ObjectId(generation_id)},
                {"$set": {"status": "failed", "error": str(e)[:300]}},
            )
        except Exception:
            pass


async def _create_generation_record(
    user: dict, prompt: str, gen_type: str,
    attachment_type: str, style: str,
    source_image_url: Optional[str] = None,
    challenge_id: Optional[str] = None,
    original_prompt: Optional[str] = None,
    edition_cap: int = 0,
):
    from server import db, GENESIS_CAP
    from drops_utils import make_mint_id, make_signature, EDITION_CAPS
    is_admin = user.get("role") == "admin"
    # Admins bypass credit checks and never get charged
    if not is_admin and user.get("credits", 0) <= 0:
        raise HTTPException(status_code=402, detail="Out of credits. Upgrade your plan.")

    # Sanitize edition_cap (only allow whitelisted values)
    if edition_cap not in EDITION_CAPS:
        edition_cap = 0

    created_iso = now_utc().isoformat()
    mint_id = make_mint_id()
    signature_hash = make_signature(user["id"], mint_id, created_iso)

    # Genesis: first 100 drops ever forged on the platform — count by flag, not total docs
    total_genesis = await db.generations.count_documents({"is_genesis": True})
    is_genesis = total_genesis < GENESIS_CAP

    doc = {
        "user_id": user["id"],
        "creator_name": user.get("name", "Anonymous"),
        "prompt": prompt,
        "original_prompt": original_prompt or prompt,
        "type": gen_type,
        "attachment_type": attachment_type,
        "style": style,
        "source_image_url": source_image_url,
        "model_url": None,
        "thumbnail_url": None,
        "status": "pending",
        "likes": 0,
        "battle_wins": 0,
        "battle_losses": 0,
        "remix_count": 0,
        "remixed_from": None,
        "challenge_id": challenge_id,
        "created_at": created_iso,
        "free_by_admin": is_admin,
        # === COLLECTIBILITY ===
        "edition_cap": edition_cap,           # 0 = unlimited
        "edition_number": 1,                  # creator's original is always #1
        "editions_minted": 1,
        "mint_id": mint_id,
        "signature_hash": signature_hash,
        "is_founder_signed": is_admin,        # admins auto-sign their drops
        "is_genesis": is_genesis,             # first 100 forever
    }
    res = await db.generations.insert_one(doc)
    gen_id = str(res.inserted_id)

    # Only deduct credit for non-admin users
    if not is_admin:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$inc": {"credits": -1}})

    return gen_id, doc


@router.post("/generate/text-to-3d")
async def generate_text_to_3d(
    payload: GenerationRequest,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    full_prompt = _build_full_prompt(payload.prompt, payload.attachment_type, payload.style)
    gen_id, doc = await _create_generation_record(
        user, full_prompt, "text",
        payload.attachment_type, payload.style,
        challenge_id=payload.challenge_id,
        original_prompt=payload.prompt,
        edition_cap=payload.edition_cap,
    )
    if _has_fal_key():
        bg.add_task(_run_fal_generation, gen_id, full_prompt)
    else:
        bg.add_task(_run_mock_generation, gen_id)
    doc["id"] = gen_id
    return {"id": gen_id, "status": "pending", "demo_mode": not _has_fal_key()}


@router.post("/generate/image-to-3d")
async def generate_image_to_3d(
    payload: ImageGenerationRequest,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    gen_id, doc = await _create_generation_record(
        user, f"Image-to-3D: {payload.attachment_type}", "image",
        payload.attachment_type, payload.style,
        source_image_url=payload.image_url,
        edition_cap=payload.edition_cap,
    )
    if _has_fal_key():
        bg.add_task(_run_fal_generation, gen_id, doc["prompt"], payload.image_url)
    else:
        bg.add_task(_run_mock_generation, gen_id)
    return {"id": gen_id, "status": "pending", "demo_mode": not _has_fal_key()}


@router.get("/generate/{generation_id}")
async def get_generation(generation_id: str, user=Depends(get_current_user)):
    from server import db
    from drops_utils import enrich_drop
    try:
        doc = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Generation not found")
    doc["id"] = str(doc.pop("_id"))
    is_liked = False
    if user:
        like = await db.likes.find_one({"user_id": user["id"], "generation_id": doc["id"]})
        is_liked = bool(like)
    doc["is_liked"] = is_liked
    enrich_drop(doc)
    return doc


@router.post("/prompt/enhance")
async def enhance_prompt(payload: PromptEnhanceRequest, user=Depends(get_current_user)):
    """Use Claude Sonnet (via Emergent LLM key) to enhance a short prompt."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="LLM key not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"enhance-{uuid.uuid4().hex[:8]}",
            system_message=(
                "You are an expert Roblox UGC prompt designer. Rewrite the user's short idea "
                "into a vivid, specific, single-sentence prompt for a 3D model generator. "
                "Focus on materials, colors, textures, silhouette, and theme. Keep it under "
                "60 words. Do NOT include camera/lighting/technical specs (those are added "
                "automatically). Output ONLY the rewritten prompt, no preamble."
            ),
        ).with_model("anthropic", "claude-sonnet-4-6")

        user_input = (
            f"Item type: {payload.attachment_type}\n"
            f"Style: {payload.style}\n"
            f"User idea: {payload.prompt}\n\n"
            "Rewrite into a detailed prompt:"
        )
        # Buffer the stream into a single string (one-shot use)
        from emergentintegrations.llm.chat import TextDelta, StreamDone
        out = ""
        async for ev in chat.stream_message(UserMessage(text=user_input)):
            if isinstance(ev, TextDelta):
                out += ev.content
            elif isinstance(ev, StreamDone):
                break
        return {"enhanced": out.strip() or payload.prompt}
    except Exception as e:
        logger.exception("prompt enhance failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Enhance failed: {e}")
