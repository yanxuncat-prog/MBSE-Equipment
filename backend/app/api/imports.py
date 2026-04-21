import tempfile
import shutil

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services import import_svc

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/equipment")
async def import_equipment(
    file: UploadFile = File(...),
    config_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    result = await import_svc.import_from_excel(db, tmp_path)

    # If config_id provided, add imported equipment to that config
    if config_id and result["success_count"] > 0:
        from app.services import configuration_svc
        # Note: in a full implementation, we'd track which equipment was just imported
        # For MVP, the user can manually add to config after import
        pass

    return result
