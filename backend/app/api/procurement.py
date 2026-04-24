import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.configuration import ConfigEquipment
from app.api.deps import get_current_user

router = APIRouter(prefix="/configurations", tags=["procurement"])


class ProcurementUpdate(BaseModel):
    procurement_status: str | None = None
    procurement_location: str | None = None
    planned_delivery_date: str | None = None
    estimated_delivery_date: str | None = None
    procurement_notes: str | None = None


class BatchProcurementUpdate(BaseModel):
    equipment_ids: list[str]
    procurement_status: str | None = None
    procurement_location: str | None = None


def _parse_date(s: str | None):
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None


@router.put("/{config_id}/equipment/{equip_id}/procurement")
async def update_procurement(
    config_id: str,
    equip_id: str,
    body: ProcurementUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ConfigEquipment).where(
            ConfigEquipment.config_id == config_id,
            ConfigEquipment.equipment_id == equip_id,
        )
    )
    ce = result.scalar_one_or_none()
    if not ce:
        raise HTTPException(status_code=404, detail="Config equipment not found")

    if body.procurement_status is not None:
        ce.procurement_status = body.procurement_status
    if body.procurement_location is not None:
        ce.procurement_location = body.procurement_location
    if body.planned_delivery_date is not None:
        ce.planned_delivery_date = _parse_date(body.planned_delivery_date)
    if body.estimated_delivery_date is not None:
        ce.estimated_delivery_date = _parse_date(body.estimated_delivery_date)
    if body.procurement_notes is not None:
        ce.procurement_notes = body.procurement_notes

    await db.commit()
    return {"ok": True}


@router.put("/{config_id}/procurement/batch")
async def batch_update_procurement(
    config_id: str,
    body: BatchProcurementUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cid = config_id
    eids = [eid for eid in body.equipment_ids]
    result = await db.execute(
        select(ConfigEquipment).where(
            ConfigEquipment.config_id == cid,
            ConfigEquipment.equipment_id.in_(eids),
        )
    )
    entries = result.scalars().all()
    for ce in entries:
        if body.procurement_status is not None:
            ce.procurement_status = body.procurement_status
        if body.procurement_location is not None:
            ce.procurement_location = body.procurement_location
    await db.commit()
    return {"ok": True, "updated": len(entries)}
