from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.constraint import ValidationRequest, ValidationReport
from app.services import constraint_svc

router = APIRouter(prefix="/constraints", tags=["constraints"])


@router.post("/validate", response_model=ValidationReport)
async def validate(
    body: ValidationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await constraint_svc.validate_config(
        db,
        config_id=body.config_id,
        hypothetical_adds=body.hypothetical_adds,
        hypothetical_removes=body.hypothetical_removes,
        phase=body.phase,
    )
