import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.bus import BusDefinition
from app.api.deps import get_current_user

router = APIRouter(prefix="/buses", tags=["buses"])


@router.get("")
async def list_buses(
    program_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(BusDefinition).where(BusDefinition.program_id == program_id).order_by(BusDefinition.bus_name)
    )
    buses = result.scalars().all()
    return [
        {
            "id": str(b.id), "bus_name": b.bus_name, "bus_type": b.bus_type,
            "rated_capacity_kva": b.rated_capacity_kva,
        }
        for b in buses
    ]
