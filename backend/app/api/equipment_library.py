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
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Subquery: count of configs using each equipment
    config_count_sq = (
        select(
            ConfigEquipment.equipment_id,
            func.count(ConfigEquipment.config_id).label("config_count"),
        )
        .group_by(ConfigEquipment.equipment_id)
        .subquery()
    )

    query = (
        select(
            Equipment,
            func.coalesce(config_count_sq.c.config_count, 0).label("config_count"),
        )
        .outerjoin(config_count_sq, config_count_sq.c.equipment_id == Equipment.id)
    )
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

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Equipment.ata_chapter, Equipment.part_number).offset(offset).limit(limit)
    result = await db.execute(query)

    items = []
    for row in result.all():
        equip = row[0]
        cfg_count = row[1]
        items.append({
            "id": equip.id,
            "part_number": equip.part_number,
            "name": equip.name,
            "name_en": equip.name_en,
            "ata_chapter": equip.ata_chapter,
            "equipment_type": equip.equipment_type,
            "dal": equip.dal,
            "is_electrical": equip.is_electrical,
            "is_primary_electrical": equip.is_primary_electrical,
            "has_eicd": equip.has_eicd,
            "dimensions_mm": equip.dimensions_mm,
            "power_voltage": equip.power_voltage,
            "power_kva_normal": equip.power_kva_normal,
            "supplier_part_number": equip.supplier_part_number,
            "config_count": cfg_count,
        })

    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.get("/{equipment_id}/configs")
async def get_equipment_configs(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Fetch master equipment record
    equip = await db.get(Equipment, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Fetch all config_equipment rows for this equipment, joined with Configuration
    result = await db.execute(
        select(ConfigEquipment, Configuration)
        .join(Configuration, Configuration.id == ConfigEquipment.config_id)
        .where(ConfigEquipment.equipment_id == equipment_id)
        .order_by(Configuration.version)
    )

    configs = []
    for ce, cfg in result.all():
        configs.append({
            "config_id": cfg.id,
            "config_version": cfg.version,
            "config_name": ce.config_name,
            "mass_kg": ce.mass_kg,
            "frozen_at": cfg.frozen_at.isoformat() if cfg.frozen_at else None,
        })

    return {
        "equipment": {
            "id": equip.id,
            "part_number": equip.part_number,
            "master_name": equip.name,
            "ata_chapter": equip.ata_chapter,
            "equipment_type": equip.equipment_type,
        },
        "configs": configs,
    }
