"""File upload route — saves image refs for image-to-3D and serves them publicly.

Uses Pillow to verify the bytes really are a decodable image (not just trust the
multipart Content-Type header), which prevents arbitrary blob uploads.
"""
import os
import uuid
import io
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError

from auth_utils import get_current_user

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_SIZE = 8 * 1024 * 1024  # 8 MB
MAX_DIMENSION = 4096  # px


@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 8 MB)")
    if len(data) < 100:
        raise HTTPException(status_code=400, detail="File too small to be a valid image")

    # Pillow MIME sniffing — verify the bytes really decode as a known image format
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except (UnidentifiedImageError, Exception):
        raise HTTPException(status_code=400, detail="File is not a valid image")

    # Re-open after verify() to read metadata (verify closes the image)
    img2 = Image.open(io.BytesIO(data))
    if img2.format not in ALLOWED_PIL_FORMATS:
        raise HTTPException(status_code=400, detail=f"Image format {img2.format} not allowed")
    if max(img2.size) > MAX_DIMENSION:
        raise HTTPException(status_code=400, detail=f"Image too large (max {MAX_DIMENSION}px on each side)")

    ext_map = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
    ext = ext_map[img2.format]
    fname = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / fname
    dest.write_bytes(data)

    backend_url = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
    public_path = f"/api/uploads/{fname}"
    return {"url": f"{backend_url}{public_path}" if backend_url else public_path, "path": public_path}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    p = UPLOAD_DIR / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(p))
