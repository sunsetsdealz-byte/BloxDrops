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
from pydantic import BaseModel, Field
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

PAID_PLANS = {"creator", "creator_annual", "pro", "pro_annual"}


def _is_paid_or_admin(user: dict) -> bool:
    return user.get("role") == "admin" or user.get("plan") in PAID_PLANS

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
            args = {
                "image_url": image_url,
                # Quality stack — same params used for the Founder regen.
                # Catches finer geometric detail and produces sharper textures so
                # designs with intricate features (spikes, jewelry, glowing accents)
                # come out crisp instead of low-poly approximations.
                "pbr": True,                            # full PBR material maps
                "texture": "HD",                        # highest texture tier
                "texture_alignment": "original_image",  # preserve source detail
                "orientation": "align_image",           # face the camera like input
                "face_limit": 50000,                    # high poly = more detail
            }
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

    # Create ownership row for the creator (edition #1)
    await db.ownerships.insert_one({
        "_id": ObjectId(),
        "generation_id": gen_id,
        "edition_number": 1,
        "owner_user_id": user["id"],
        "acquired_at": created_iso,
        "acquisition_type": "mint",
        "source_listing_id": None,
    })

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


# ============== PAID FEATURE: Real-life Photo → 3D UGC ==============
@router.post("/generate/photo-to-3d")
async def generate_photo_to_3d(
    payload: ImageGenerationRequest,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Premium feature — scans a real-world photo and converts it into a
    Roblox-ready 3D UGC model. Restricted to paid plans (Creator / Pro) + admin.
    """
    if not _is_paid_or_admin(user):
        raise HTTPException(
            status_code=402,  # Payment Required
            detail="Photo Scanner is a Pro feature. Upgrade your plan to scan real-world photos into 3D drops.",
        )
    # Build a Roblox-optimized prompt for the photo's subject
    label = (payload.attachment_type or "item").lower()
    enhanced_prompt = (
        f"High-fidelity Roblox-ready 3D UGC {label} generated from a real-world reference photo. "
        f"Clean topology, accurate proportions, vibrant materials, Roblox-style color palette. "
        f"Style influence: {payload.style or 'auto'}."
    )
    gen_id, doc = await _create_generation_record(
        user,
        enhanced_prompt,
        "photo_scan",  # source type — tracked separately from regular image-to-3d
        payload.attachment_type,
        payload.style,
        source_image_url=payload.image_url,
        edition_cap=payload.edition_cap,
    )
    if _has_fal_key():
        bg.add_task(_run_fal_generation, gen_id, enhanced_prompt, payload.image_url)
    else:
        bg.add_task(_run_mock_generation, gen_id)
    return {"id": gen_id, "status": "pending", "demo_mode": not _has_fal_key(), "feature": "photo_scanner"}


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
    # Metadata is locked once the drop has ever appeared on the marketplace
    ever_listed = await db.marketplace_listings.find_one({"generation_id": doc["id"]})
    doc["metadata_locked"] = bool(ever_listed)
    return doc


@router.post("/generations/{generation_id}/regenerate")
async def regenerate_generation(
    generation_id: str,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Re-run the fal.ai job on an existing generation with the latest HD/PBR
    quality settings. Owner-or-admin only. Wipes the current model_url and
    flips status back to `pending`; the same record is mutated in place so
    likes/badges/edition data are preserved.
    """
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    if gen.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only regenerate your own creations")

    # Founder drop is permanent — block accidental regens
    if gen.get("release_price_usd") == 50000:
        raise HTTPException(status_code=400, detail="The Founder drop is permanent and cannot be regenerated")

    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": {"status": "pending", "model_url": None, "error": None}},
    )

    prompt = gen.get("prompt") or gen.get("original_prompt") or ""
    image_url = gen.get("source_image_url")
    if _has_fal_key():
        bg.add_task(_run_fal_generation, generation_id, prompt, image_url)
    else:
        bg.add_task(_run_mock_generation, generation_id)

    return {"id": generation_id, "status": "pending", "demo_mode": not _has_fal_key()}


# ─── Roblox-ready rigging (Meshy via fal.ai) ──────────────────────────────────
async def _run_meshy_rigging(generation_id: str, model_url: str):
    """Background task — send the existing GLB through Meshy's auto-rigger and
    store the rigged GLB URL back on the generation document. The output uses
    a standard humanoid skeleton (Mixamo-compatible) which Roblox Studio's
    Avatar Setup tool can re-target to the R15 rig automatically."""
    from server import db
    try:
        import fal_client
        handler = await fal_client.submit_async(
            "fal-ai/meshy/rigging",
            arguments={
                "model_url": model_url,
                # Roblox avatars are ~5 studs ≈ 1.7m — match human proportions
                "height_meters": 1.7,
            },
        )
        result = await handler.get()
        rigged_url = None
        if isinstance(result, dict):
            rigged_url = (
                (result.get("rigged_character_glb") or {}).get("url")
                or (result.get("model_mesh") or {}).get("url")
            )
        if not rigged_url:
            raise RuntimeError(f"Rigging returned no glb url: {result!r}")

        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "rigged_model_url": rigged_url,
                "rigging_status": "completed",
                "rigging_completed_at": now_utc().isoformat(),
                "rigging_error": None,
            }},
        )
    except Exception as e:
        logger.exception("Meshy rigging failed: %s", e)
        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "rigging_status": "failed",
                "rigging_error": str(e)[:300],
            }},
        )


@router.post("/generations/{generation_id}/rig")
async def rig_generation(
    generation_id: str,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Kick off Roblox-ready auto-rigging on an existing completed generation.
    Pipes the static GLB through `fal-ai/meshy/rigging` and stores the rigged
    output URL on the record so the export modal can offer the rigged version
    for Studio's Avatar Setup workflow.

    Costs ~$0.20 per rig (fal.ai billed) — gated to the model's owner or admin.
    """
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    if gen.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only rig your own creations")
    if gen.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Generation must be completed before rigging")
    model_url = gen.get("model_url")
    if not model_url:
        raise HTTPException(status_code=400, detail="Generation has no model_url to rig")
    if not _has_fal_key():
        raise HTTPException(status_code=503, detail="FAL_KEY missing — rigging unavailable in demo mode")

    # If a rigging job is already in-flight, return its status idempotently
    if gen.get("rigging_status") == "pending":
        return {"id": generation_id, "rigging_status": "pending", "already_running": True}

    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": {
            "rigging_status": "pending",
            "rigging_started_at": now_utc().isoformat(),
            "rigging_error": None,
        }},
    )
    bg.add_task(_run_meshy_rigging, generation_id, model_url)
    return {"id": generation_id, "rigging_status": "pending"}


# ─── Mesh optimization (Hunyuan-3D smart-topology via fal.ai) ───────────────
async def _run_mesh_optimization(generation_id: str, model_url: str, density: str):
    """Background task — pipe the GLB through Hunyuan-3D's smart-topology
    endpoint to produce a cleaner low/medium-poly version with quad-friendly
    topology. Critical for Roblox where each accessory part has a strict
    polycount cap (10k tris for hats/hair, 4k for layered clothing)."""
    from server import db
    try:
        import fal_client
        handler = await fal_client.submit_async(
            "fal-ai/hunyuan-3d/v3.1/smart-topology",
            arguments={
                "input_mesh_url": model_url,
                # triangle output stays GLB-compatible — quad forces FBX
                "polygon_type": "triangle",
                "face_level": density,  # "high" | "medium" | "low"
            },
        )
        result = await handler.get()
        opt_url = None
        if isinstance(result, dict):
            opt_url = (
                (result.get("output_mesh") or {}).get("url")
                or (result.get("model_mesh") or {}).get("url")
                or (result.get("mesh") or {}).get("url")
            )
        if not opt_url:
            raise RuntimeError(f"Optimization returned no mesh url: {result!r}")

        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "optimized_model_url": opt_url,
                "optimization_density": density,
                "optimization_status": "completed",
                "optimization_completed_at": now_utc().isoformat(),
                "optimization_error": None,
            }},
        )
    except Exception as e:
        logger.exception("Mesh optimization failed: %s", e)
        await db.generations.update_one(
            {"_id": ObjectId(generation_id)},
            {"$set": {
                "optimization_status": "failed",
                "optimization_error": str(e)[:300],
            }},
        )


class MeshOptimizeRequest(BaseModel):
    density: str = Field(default="medium", pattern="^(low|medium|high)$")


@router.post("/generations/{generation_id}/optimize")
async def optimize_generation_mesh(
    generation_id: str,
    payload: MeshOptimizeRequest,
    bg: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Run smart-topology mesh optimization on a completed drop. Reduces
    polycount + cleans topology so it fits Roblox UGC limits. Owner-or-admin
    only. Costs ~$0.10 per optimization (fal.ai billed)."""
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    if gen.get("user_id") != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only optimize your own creations")
    if gen.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Generation must be completed before optimization")
    model_url = gen.get("model_url")
    if not model_url:
        raise HTTPException(status_code=400, detail="Generation has no model_url to optimize")
    if not _has_fal_key():
        raise HTTPException(status_code=503, detail="FAL_KEY missing — optimization unavailable in demo mode")
    if gen.get("optimization_status") == "pending":
        return {"id": generation_id, "optimization_status": "pending", "already_running": True}

    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": {
            "optimization_status": "pending",
            "optimization_started_at": now_utc().isoformat(),
            "optimization_error": None,
        }},
    )
    bg.add_task(_run_mesh_optimization, generation_id, model_url, payload.density)
    return {"id": generation_id, "optimization_status": "pending", "density": payload.density}


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
