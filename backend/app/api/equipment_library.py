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
    ata_chapters: str | None = Query(None, description="Comma-separated ATA chapters for multi-select"),
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

    if ata_chapters:
        ata_list = [a.strip() for a in ata_chapters.split(",") if a.strip()]
        if ata_list:
            query = query.where(Equipment.ata_chapter.in_(ata_list))
            count_query = count_query.where(Equipment.ata_chapter.in_(ata_list))

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
            "library_status": equip.library_status,
            # 组1: 标识与分类
            "part_number": equip.part_number,
            "name": equip.name,
            "name_en": equip.name_en,
            "abbreviation_en": equip.abbreviation_en,
            "ata_chapter": equip.ata_chapter,
            "equipment_type": equip.equipment_type,
            "dal": equip.dal,
            "supplier_part_number": equip.supplier_part_number,
            "description": equip.description,
            "notes": equip.notes,
            # 组2: 物理特性
            "dimensions_mm": equip.dimensions_mm,
            "connector_count": equip.connector_count,
            "is_metal_shell": equip.is_metal_shell,
            "metal_shell_non_conductive": equip.metal_shell_non_conductive,
            # 组3: 电气特性
            "is_electrical": equip.is_electrical,
            "is_primary_electrical": equip.is_primary_electrical,
            "has_eicd": equip.has_eicd,
            "power_voltage": equip.power_voltage,
            "voltage_range": equip.voltage_range,
            "power_redundancy": equip.power_redundancy,
            "power_watts": equip.power_watts,
            "power_kva_normal": equip.power_kva_normal,
            "power_kva_emergency": equip.power_kva_emergency,
            "power_kva_max": equip.power_kva_max,
            "soft_start": equip.soft_start,
            "peak_power_time_s": equip.peak_power_time_s,
            "dissimilar_supply": equip.dissimilar_supply,
            "emergency_sheddable": equip.emergency_sheddable,
            # 组4: 接地与搭接
            "internal_grounding": equip.internal_grounding,
            "shell_grounding_method": equip.shell_grounding_method,
            "shell_grounding_fault_path": equip.shell_grounding_fault_path,
            "grounding_special_requirements": equip.grounding_special_requirements,
            "grounding_terminal_diameter": equip.grounding_terminal_diameter,
            "bonding_method": equip.bonding_method,
            "bonding_type": equip.bonding_type,
            "bonding_resistance": equip.bonding_resistance,
            # 组5: 机械接口
            "screw_spec": equip.screw_spec,
            "bracket_delegated_158": equip.bracket_delegated_158,
            "has_tolerance_drawing": equip.has_tolerance_drawing,
            "warnings": equip.warnings,
        })

    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.get("/ata-options")
async def get_ata_options(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return distinct ATA chapters that have equipment in the library."""
    result = await db.execute(
        select(Equipment.ata_chapter, func.count(Equipment.id).label("count"))
        .group_by(Equipment.ata_chapter)
        .order_by(Equipment.ata_chapter)
    )
    return [{"ata": row.ata_chapter, "count": row.count} for row in result.all()]


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


@router.patch("/{equipment_id}")
async def update_library_equipment(
    equipment_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update equipment attributes in the library."""
    equip = await db.get(Equipment, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="设备不存在")
    read_only = {"id", "part_number", "created_at", "updated_at", "library_status"}
    for key, value in body.items():
        if key in read_only:
            continue
        if hasattr(equip, key):
            setattr(equip, key, value)
    await db.commit()
    return {"id": equip.id, "status": "updated"}


@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete an equipment entry from the library."""
    equip = await db.get(Equipment, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="设备不存在")
    await db.delete(equip)
    await db.commit()
    return {"status": "deleted"}


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
