"""Local disk image / document uploads. Cloudinary-ready abstraction."""
from __future__ import annotations
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from auth import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif"}
ALLOWED_DOC = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"}
MAX_BYTES = 8 * 1024 * 1024  # 8MB per file


def _safe_ext(filename: str, allowed: set[str]) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unsupported file type: {ext or 'none'}")
    return ext


async def _save(file: UploadFile, allowed: set[str]) -> str:
    ext = _safe_ext(file.filename or "file", allowed)
    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large (max 8 MB)")
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(body)
    return f"/api/uploads/file/{name}"


@router.post("/images")
async def upload_images(files: list[UploadFile] = File(...), _user: dict = Depends(get_current_user)):
    if not files:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No files provided")
    urls = []
    for f in files:
        urls.append(await _save(f, ALLOWED_IMAGE))
    return {"urls": urls}


@router.post("/documents")
async def upload_documents(files: list[UploadFile] = File(...), _user: dict = Depends(get_current_user)):
    urls = []
    for f in files:
        urls.append(await _save(f, ALLOWED_DOC))
    return {"urls": urls}


@router.get("/file/{name}")
async def serve_file(name: str):
    # sanitize path
    safe = Path(name).name
    path = UPLOAD_DIR / safe
    if not path.exists() or not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return FileResponse(path)
