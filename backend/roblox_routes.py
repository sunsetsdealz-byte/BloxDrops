"""Roblox Open Cloud integration — direct upload pipeline.

Roblox Open Cloud Assets API accepts FBX for `Model` assets, authenticated via
`x-api-key`. Our fal.ai pipeline produces GLB, which we convert to FBX server-
side via headless Blender (see `glb_to_fbx.py`) before pushing as `Model`. This
delivers a real 3D asset to the creator's inventory — not a flat decal.

The user generates an Open Cloud API key at https://create.roblox.com/dashboard/credentials
with the `asset:write` permission. We store {api_key, roblox_user_id} on the
user document; the key is treated as secret and never returned to the client
after save.
"""
import os
import logging
import httpx
import asyncio
import shutil
import tempfile
import subprocess
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


BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender")
GLB_TO_FBX_SCRIPT = os.path.join(os.path.dirname(__file__), "glb_to_fbx.py")


def _convert_glb_to_fbx_sync(glb_bytes: bytes) -> bytes:
    """Run headless Blender to convert GLB bytes → FBX bytes.

    Blocking subprocess — call from an executor.
    """
    tmp = tempfile.mkdtemp(prefix="bloxdrops_fbx_")
    try:
        glb_path = os.path.join(tmp, "in.glb")
        fbx_path = os.path.join(tmp, "out.fbx")
        with open(glb_path, "wb") as f:
            f.write(glb_bytes)

        result = subprocess.run(
            [
                BLENDER_BIN,
                "--background",
                "--python",
                GLB_TO_FBX_SCRIPT,
                "--",
                glb_path,
                fbx_path,
            ],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if result.returncode != 0 or not os.path.exists(fbx_path):
            logger.error("Blender conversion failed: stdout=%s stderr=%s", result.stdout[-400:], result.stderr[-400:])
            raise HTTPException(
                status_code=502,
                detail="3D model conversion failed. Try regenerating the drop.",
            )
        with open(fbx_path, "rb") as f:
            return f.read()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


async def _convert_glb_to_fbx(glb_bytes: bytes) -> bytes:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _convert_glb_to_fbx_sync, glb_bytes)


@router.post("/upload/{generation_id}")
async def upload_to_roblox(generation_id: str, user=Depends(get_current_user)):
    """Push the creation as a 3D Model (.fbx) to the creator's Roblox inventory.

    Pipeline:
    1. Verify ownership + generation is completed with a model_url (GLB).
    2. Fetch the GLB bytes.
    3. Convert GLB → FBX server-side via headless Blender.
    4. POST to Open Cloud /assets with assetType=Model + multipart fileContent.
    5. Poll the returned operation until done, persist the assetId.
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

    # 2) Convert GLB → FBX via headless Blender
    try:
        fbx_bytes = await _convert_glb_to_fbx(glb_bytes)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Blender conversion threw")
        raise HTTPException(status_code=502, detail=f"3D conversion error: {str(e)[:160]}")

    if len(fbx_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Converted FBX exceeded 20 MB — Roblox limit.")

    # 3) Build the Open Cloud Create Asset request
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
        "fileContent": (f"{asset_name.replace(' ', '_')}.fbx", fbx_bytes, "model/fbx"),
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

    # 4) Record the push on the generation doc for the activity timeline
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
        "studio_note": "Open Roblox Studio → Toolbox → My Models to drop the asset in, then use Avatar → Accessory Fitting Tool to publish to the Marketplace.",
    }
