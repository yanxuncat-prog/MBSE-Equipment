"""File attachment upload and serving for MICD tolerance drawings."""
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["attachments"])
UPLOAD_DIR = Path(__file__).parent.parent.parent / "data" / "attachments"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/attachments/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"不支持的文件类型: {ext}. 支持: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, f"文件过大, 最大 {MAX_SIZE // 1024 // 1024}MB")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filepath.write_bytes(content)

    return {"url": f"/api/attachments/{filename}", "filename": filename, "size": len(content)}

@router.get("/attachments/{filename}")
async def get_attachment(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(404, "File not found")
    # Security: prevent directory traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(400, "Invalid filename")
    return FileResponse(filepath)
