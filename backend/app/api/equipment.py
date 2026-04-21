from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.equipment import (
    EquipmentCreate, EquipmentUpdate, EquipmentResponse, EquipmentListResponse,
)
from app.services import equipment_svc

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=EquipmentListResponse)
async def list_equipment(
    config_id: str | None = Query(None),
    ata_chapter: str | None = Query(None),
    zone_id: str | None = Query(None),
    search: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, total = await equipment_svc.list_equipment(
        db, config_id=config_id, ata_chapter=ata_chapter,
        zone_id=zone_id, search=search, offset=offset, limit=limit,
    )
    return EquipmentListResponse(items=items, total=total, offset=offset, limit=limit)


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    equip = await equipment_svc.get_equipment(db, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equip


@router.post("", response_model=EquipmentResponse, status_code=201)
async def create_equipment(
    data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await equipment_svc.create_equipment(db, data, str(user.id))


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: str,
    data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    equip = await equipment_svc.update_equipment(db, equipment_id, data, str(user.id))
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equip


@router.delete("/{equipment_id}", status_code=204)
async def delete_equipment(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = await equipment_svc.delete_equipment(db, equipment_id, str(user.id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Equipment not found")
