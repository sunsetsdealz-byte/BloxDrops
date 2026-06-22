"""Roblox Open Cloud integration — direct upload pipeline.

Roblox Open Cloud Assets API accepts both `.fbx` and `.glb`/`.gltf` for the
`Model` asset type (since the Mar/Apr 2024 3D-import update). Our fal.ai pipeline
produces GLB directly, so we upload the raw `.glb` bytes with MIME
`model/gltf-binary` — zero conversion, zero system deps, instant push.

The user generates an Open Cloud API key at https://create.roblox.com/dashboard/credentials
with the `asset:write` permission. We store {api_key, roblox_user_id} on the
user document; the key is treated as secret and never returned to the client
after save.
"""
import os
import logging
import httpx
import asyncio
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from bson import ObjectId

from auth_utils import get_current_user

router = APIRouter(prefix="/api/roblox")
logger = logging.getLogger(__name__)

OPEN_CLOUD = "https://apis.roblox.com/assets/v1"


class ConnectRequest(BaseModel):
    api_key: str = Field(min_length=10, max_length=2048)
    roblox_user_id: str = Field(min_length=1, max_length=30, pattern=r"^\d+$")


def _mask_key(k: str) -> str:
    if not k or len(k) < 8:
        return "••••"
    return f"{k[:4]}••••{k[-4:]}"


@router.post("/connect")
async def connect(payload: ConnectRequest, user=Depends(get_current_user)):
    """Save the user's Roblox API key + numeric userId."""
    from server import db
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {
            "roblox": {
                "api_key": payload.api_key,
                "user_id": payload.roblox_user_id,
                "connected_at": datetime.now(timezone.utc).isoformat(),
            },
        }},
    )
    return {"ok": True, "roblox_user_id": payload.roblox_user_id, "key_masked": _mask_key(payload.api_key)}


@router.delete("/disconnect")
async def disconnect(user=Depends(get_current_user)):
    from server import db
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$unset": {"roblox": ""}},
    )
    return {"ok": True}


@router.get("/status")
async def status(user=Depends(get_current_user)):
    from server import db
    u = await db.users.find_one({"_id": ObjectId(user["id"])}, {"roblox": 1})
    rb = (u or {}).get("roblox") or {}
    if not rb.get("api_key"):
        return {"connected": False}
    return {
        "connected": True,
        "roblox_user_id": rb.get("user_id"),
        "key_masked": _mask_key(rb.get("api_key", "")),
        "connected_at": rb.get("connected_at"),
    }


async def _get_creds(user_id: str) -> dict:
    from server import db
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"roblox": 1})
    rb = (u or {}).get("roblox") or {}
    if not rb.get("api_key") or not rb.get("user_id"):
        raise HTTPException(status_code=400, detail="Connect your Roblox account first")
    return rb


async def _poll_operation(api_key: str, operation_id: str, max_attempts: int = 25):
    """Poll Open Cloud operation status until done or fail."""
    headers = {"x-api-key": api_key}
    async with httpx.AsyncClient(timeout=30.0) as client:
        for _ in range(max_attempts):
            r = await client.get(
                f"https://apis.roblox.com/assets/v1/operations/{operation_id}",
                headers=headers,
            )
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Operation poll failed: {r.text[:200]}")
            data = r.json()
            if data.get("done"):
                if data.get("error"):
                    raise HTTPException(status_code=502, detail=f"Roblox: {data['error'].get('message', 'upload failed')}")
                return data.get("response", {})
            await asyncio.sleep(2)
    raise HTTPException(status_code=504, detail="Roblox upload timed out (still processing on their side)")


@router.post("/upload/{generation_id}")
async def upload_to_roblox(generation_id: str, user=Depends(get_current_user)):
    """Push the creation as a 3D Model (.glb) to the creator's Roblox inventory.

    Pipeline:
    1. Verify ownership + generation is completed with a model_url (GLB).
    2. Fetch the GLB bytes.
    3. POST to Open Cloud /assets with assetType=Model + multipart fileContent
       (MIME `model/gltf-binary`). Roblox accepts GLB natively for Model uploads.
    4. Poll the returned operation until done, persist the assetId.
    """
    from server import db
    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Generation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    if gen["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your creation")
    if gen.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Generation not ready")
    if not gen.get("model_url"):
        raise HTTPException(status_code=400, detail="No 3D model attached to this drop")

    creds = await _get_creds(user["id"])

    # 1) Fetch the GLB bytes
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        glb_resp = await client.get(gen["model_url"])
        if glb_resp.status_code != 200 or not glb_resp.content:
            raise HTTPException(status_code=502, detail="Couldn't fetch the .glb file")
        glb_bytes = glb_resp.content

    # Roblox Open Cloud caps single asset uploads at 20 MB
    if len(glb_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Model is over 20 MB — Roblox rejects assets above that size.")

    # 2) Build the Open Cloud Create Asset request
    import json as _json
    asset_name = ((gen.get("display_name") or gen.get("original_prompt") or "BloxDrops Item").strip() or "BloxDrops Item")[:50]
    description = (gen.get("description") or f"Generated with BloxDrops AI · {gen.get('attachment_type', 'Item')} · {gen.get('style', 'auto')}")[:600]

    request_payload = {
        "assetType": "Model",
        "displayName": asset_name,
        "description": description,
        "creationContext": {"creator": {"userId": int(creds["user_id"])}},
    }
    files = {
        "request": (None, _json.dumps(request_payload), "application/json"),
        "fileContent": (f"{asset_name.replace(' ', '_')}.glb", glb_bytes, "model/gltf-binary"),
    }
    headers = {"x-api-key": creds["api_key"]}

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{OPEN_CLOUD}/assets", files=files, headers=headers)
    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="Roblox rejected the API key — re-connect.")
    if r.status_code == 403:
        raise HTTPException(status_code=403, detail="Roblox: missing 'asset:write' permission on this key.")
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Roblox upload failed: {r.text[:300]}")

    op = r.json()
    operation_path = op.get("path") or op.get("name") or ""
    operation_id = operation_path.split("/")[-1] if operation_path else ""
    if not operation_id:
        raise HTTPException(status_code=502, detail=f"Roblox didn't return an operation id: {op}")

    result = await _poll_operation(creds["api_key"], operation_id)
    asset_id = result.get("assetId") or result.get("response", {}).get("assetId")
    response_obj = result if "assetId" in result else result.get("response", {})
    final_asset_id = response_obj.get("assetId") or asset_id

    # 3) Record the push on the generation doc for the activity timeline
    await db.generations.update_one(
        {"_id": ObjectId(generation_id)},
        {"$set": {
            "roblox_asset_id": str(final_asset_id) if final_asset_id else None,
            "roblox_asset_type": "Model",
            "roblox_pushed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    return {
        "ok": True,
        "asset_id": final_asset_id,
        "asset_type": "Model",
        "inventory_url": (
            f"https://create.roblox.com/store/asset/{final_asset_id}"
            if final_asset_id
            else (f"https://www.roblox.com/users/{creds['user_id']}/inventory#!/models" if creds.get("user_id") else None)
        ),
        "accessory_rbxmx_url": f"/api/roblox/accessory/{generation_id}.rbxmx",
        "studio_note": "Download the Accessory file and drag it into Studio Explorer — it's pre-wrapped as an Avatar Item. Then right-click → Save to Roblox.",
    }


# ============== ACCESSORY .rbxmx DOWNLOAD ==============
from fastapi.responses import Response  # noqa: E402


@router.get("/accessory/{generation_id}.rbxmx")
async def download_accessory_rbxmx(generation_id: str, user=Depends(get_current_user)):
    """Return a pre-wrapped Accessory .rbxmx for a generation that was already
    pushed to Roblox. The user drags this file into Studio Explorer and submits.
    """
    logger.info(f"RBXMX download requested for generation {generation_id}")
    from server import db
    from rbxmx_builder import build_accessory_rbxmx

    try:
        gen = await db.generations.find_one({"_id": ObjectId(generation_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Creation not found")
    if not gen:
        raise HTTPException(status_code=404, detail="Creation not found")
    if gen["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your creation")
    asset_id = gen.get("roblox_asset_id")
    if not asset_id:
        raise HTTPException(
            status_code=400,
            detail="Push this drop to Roblox first — then come back to download the Accessory file.",
        )

    xml = build_accessory_rbxmx(
        asset_id=asset_id,
        asset_name=(gen.get("display_name") or gen.get("original_prompt") or "BloxDrops Item")[:60],
        attachment_type=gen.get("attachment_type", "Hat"),
        description=(gen.get("description") or "")[:280],
    )
    safe_filename = (gen.get("display_name") or gen.get("original_prompt") or "bloxdrops_accessory")[:40]
    safe_filename = "".join(c if c.isalnum() else "_" for c in safe_filename).strip("_") or "bloxdrops_accessory"

    return Response(
        content=xml,
        media_type="application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}.rbxmx"',
        },
    )
