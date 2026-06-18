"""VFX auto-detection from a Roblox catalog URL (or any public image URL).

Flow:
  1. Extract the Roblox assetId from the catalog URL (or accept a direct image URL).
  2. Fetch the Roblox official thumbnail PNG (high res).
  3. Send the image (base64) to a vision LLM with a strict classification prompt.
  4. Parse JSON → return the closest matching VFX preset key.
"""
from __future__ import annotations

import base64
import json
import os
import re
from typing import Optional, Tuple

import httpx
from dotenv import load_dotenv
from emergentintegrations.llm.chat import (
    LlmChat,
    UserMessage,
    ImageContent,
    TextDelta,
    StreamDone,
)

from drops_utils import VFX_PRESETS

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Vision model — best visuals as picked by user
_VISION_PROVIDER = "gemini"
_VISION_MODEL = "gemini-3.1-pro-preview"


# Roblox catalog URLs always carry the assetId as the first numeric segment after /catalog/
_ROBLOX_ID_RE = re.compile(r"roblox\.com/(?:catalog|library)/(\d+)", re.IGNORECASE)
_FALLBACK_ID_RE = re.compile(r"(\d{6,})")


def _extract_asset_id(url: str) -> Optional[str]:
    m = _ROBLOX_ID_RE.search(url)
    if m:
        return m.group(1)
    # Fallback: any 6+ digit run (covers stripped URLs etc)
    m = _FALLBACK_ID_RE.search(url)
    if m and "roblox" in url.lower():
        return m.group(1)
    return None


async def _roblox_thumbnail_url(asset_id: str) -> Optional[str]:
    """Resolve a Roblox assetId to its official high-res thumbnail PNG URL."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            "https://thumbnails.roblox.com/v1/assets",
            params={"assetIds": asset_id, "size": "420x420", "format": "Png", "isCircular": "false"},
        )
        r.raise_for_status()
        data = r.json().get("data", [])
        if not data:
            return None
        return data[0].get("imageUrl")


async def _download_as_base64(image_url: str) -> Tuple[str, str]:
    """Returns (base64_str, mime_type). Sniffs content-type from response headers."""
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        r = await client.get(image_url)
        r.raise_for_status()
        mime = r.headers.get("content-type", "image/png").split(";")[0].strip()
        return base64.b64encode(r.content).decode("ascii"), mime


def _build_prompt() -> str:
    bullet_list = "\n".join(
        f"- {key}: {cfg['label']} (color {cfg['color']})" for key, cfg in VFX_PRESETS.items()
    )
    return (
        "You are classifying the visual effect / particle aura around a Roblox UGC accessory.\n"
        "Look at the image carefully. Find the dominant glow / flame / particle / lightning effect "
        "around the item (NOT the solid mesh color). Match it to the SINGLE closest preset below.\n\n"
        f"Available presets:\n{bullet_list}\n\n"
        "Respond with **strict JSON only** — no markdown, no prose, no code fences:\n"
        '{ "preset": "<one of the keys above>", "label": "<the matching label>", '
        '"reason": "<one short sentence describing what you saw>" }\n\n'
        "If the item has NO visible particle/aura effect at all, return:\n"
        '{ "preset": null, "label": "None", "reason": "<short reason>" }'
    )


async def classify_image_vfx(image_url_or_base64: dict) -> dict:
    """Call the vision LLM with the image and return parsed classification.

    image_url_or_base64: {"image_base64": "...", "mime": "image/png"}
    """
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY missing — cannot run vision classification")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vfx-classify-{os.urandom(4).hex()}",
        system_message="You are a strict JSON-only classifier of Roblox UGC visual effects.",
    ).with_model(_VISION_PROVIDER, _VISION_MODEL)

    image = ImageContent(image_base64=image_url_or_base64["image_base64"])

    chunks = []
    async for ev in chat.stream_message(
        UserMessage(text=_build_prompt(), file_contents=[image])
    ):
        if isinstance(ev, TextDelta):
            chunks.append(ev.content)
        elif isinstance(ev, StreamDone):
            break

    raw = "".join(chunks).strip()
    # Tolerate ``` fences just in case
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json\n"):
            raw = raw[5:]

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned non-JSON: {raw[:200]}") from e

    preset = parsed.get("preset")
    if preset is not None and preset not in VFX_PRESETS:
        # Model picked something it shouldn't have — null it out, keep the reason
        parsed["preset"] = None
        parsed["label"] = "None"
    return parsed


async def detect_vfx_from_url(input_url: str) -> dict:
    """Top-level entry point used by the admin endpoint.

    Accepts either:
      - A Roblox catalog URL  → fetches the official asset thumbnail
      - A direct image URL     → uses the image as-is

    Returns: { preset, label, reason, source_image_url, asset_id (or None) }
    """
    asset_id = _extract_asset_id(input_url)
    if asset_id:
        image_url = await _roblox_thumbnail_url(asset_id)
        if not image_url:
            raise ValueError(f"Couldn't resolve a Roblox thumbnail for asset {asset_id}")
    else:
        image_url = input_url  # treat as direct image URL

    b64, mime = await _download_as_base64(image_url)
    cls = await classify_image_vfx({"image_base64": b64, "mime": mime})
    return {
        "preset": cls.get("preset"),
        "label": cls.get("label"),
        "reason": cls.get("reason", ""),
        "source_image_url": image_url,
        "asset_id": asset_id,
    }
