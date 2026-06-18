"""File upload route — saves image refs for image-to-3D and serves them publicly."""
import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse

from auth_utils import get_current_user

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE = 8 * 1024 * 1024  # 8 MB


@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Read & validate size
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 8 MB)")

    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "png"
    fname = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / fname
    dest.write_bytes(data)

    # Build public URL via the same backend
    backend_url = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
    public_path = f"/api/uploads/{fname}"
    return {"url": f"{backend_url}{public_path}" if backend_url else public_path, "path": public_path}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    # Basic path traversal guard
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    p = UPLOAD_DIR / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(p))
