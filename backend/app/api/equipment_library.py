from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.equipment import Equipment
from app.models.configuration import ConfigEquipment, Configuration
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/equipment-library", tags=["equipment-library"])


@router.get("")
async def list_equipment_library(
    search: str | None = Query(None),
    ata_chapter: str | None = Query(None),
    library_status: str | None = Query(None, description="draft or valid"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Equipment)
    count_query = select(func.count(Equipment.id))

    if search:
        pattern = f"%{search}%"
        search_filter = or_(
            Equipment.part_number.ilike(pattern),
            Equipment.name.ilike(pattern),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if ata_chapter:
        query = query.where(Equipment.ata_chapter.startswith(ata_chapter))
        count_query = count_query.where(Equipment.ata_chapter.startswith(ata_chapter))

    if library_status:
        query = query.where(Equipment.library_status == library_status)
        count_query = count_query.where(Equipment.library_status == library_status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Equipment.ata_chapter, Equipment.part_number).offset(offset).limit(limit)
    result = await db.execute(query)

    items = []
    for equip in result.scalars().all():
        items.append({
            "id": equip.id,
            "part_number": equip.part_number,
            "name": equip.name,
            "name_en": equip.name_en,
            "ata_chapter": equip.ata_chapter,
            "equipment_type": equip.equipment_type,
            "library_status": equip.library_status,
            "dal": equip.dal,
            "is_electrical": equip.is_electrical,
            "is_primary_electrical": equip.is_primary_electrical,
            "has_eicd": equip.has_eicd,
            "dimensions_mm": equip.dimensions_mm,
            "power_voltage": equip.power_voltage,
            "power_kva_normal": equip.power_kva_normal,
            "supplier_part_number": equip.supplier_part_number,
        })

    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.post("/{equipment_id}/validate")
async def validate_equipment(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Confirm a draft equipment entry — changes status from draft to valid."""
    equip = await db.get(Equipment, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="设备不存在")
    if equip.library_status == "valid":
        raise HTTPException(status_code=400, detail="设备已是有效状态")
    equip.library_status = "valid"
    await db.commit()
    return {"id": equip.id, "library_status": "valid"}


@router.post("/validate-batch")
async def validate_batch(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Batch confirm multiple draft equipment entries."""
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="请提供设备ID列表")
    result = await db.execute(
        select(Equipment).where(Equipment.id.in_(ids), Equipment.library_status == "draft")
    )
    equipments = result.scalars().all()
    for equip in equipments:
        equip.library_status = "valid"
    await db.commit()
    return {"validated_count": len(equipments)}
