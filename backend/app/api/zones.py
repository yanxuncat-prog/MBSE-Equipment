import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.zone import Zone
from app.api.deps import get_current_user

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("")
async def list_zones(
    program_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Zone).where(Zone.program_id == program_id).order_by(Zone.zone_code)
    )
    zones = result.scalars().all()
    return [
        {
            "id": str(z.id), "zone_code": z.zone_code, "name": z.name,
            "sta_from": z.sta_from, "sta_to": z.sta_to,
            "wl_from": z.wl_from, "wl_to": z.wl_to,
            "bl_from": z.bl_from, "bl_to": z.bl_to,
        }
        for z in zones
    ]
