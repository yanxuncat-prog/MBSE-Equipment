import uuid
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Equipment, Installation, WeightBalance, ElectricalLoad, AuditLog
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate


async def list_equipment(
    db: AsyncSession,
    config_id: str | None = None,
    ata_chapter: str | None = None,
    zone_id: str | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[Equipment], int]:
    query = (
        select(Equipment)
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
        )
    )
    count_query = select(func.count(Equipment.id))

    if config_id:
        from app.models.configuration import config_equipment
        query = query.join(config_equipment, config_equipment.c.equipment_id == Equipment.id).where(
            config_equipment.c.config_id == uuid.UUID(config_id)
        )
        count_query = count_query.join(config_equipment, config_equipment.c.equipment_id == Equipment.id).where(
            config_equipment.c.config_id == uuid.UUID(config_id)
        )

    if ata_chapter:
        query = query.where(Equipment.ata_chapter.startswith(ata_chapter))
        count_query = count_query.where(Equipment.ata_chapter.startswith(ata_chapter))

    if zone_id:
        query = query.join(Installation, Installation.equipment_id == Equipment.id, isouter=True).where(
            Installation.zone_id == uuid.UUID(zone_id)
        )
        count_query = count_query.join(Installation, Installation.equipment_id == Equipment.id, isouter=True).where(
            Installation.zone_id == uuid.UUID(zone_id)
        )

    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Equipment.part_number.ilike(pattern), Equipment.name.ilike(pattern)))
        count_query = count_query.where(or_(Equipment.part_number.ilike(pattern), Equipment.name.ilike(pattern)))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(offset).limit(limit).order_by(Equipment.ata_chapter, Equipment.part_number)
    result = await db.execute(query)
    items = list(result.scalars().unique().all())

    return items, total


async def get_equipment(db: AsyncSession, equipment_id: str) -> Equipment | None:
    result = await db.execute(
        select(Equipment)
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
        )
        .where(Equipment.id == uuid.UUID(equipment_id))
    )
    return result.scalar_one_or_none()


async def create_equipment(db: AsyncSession, data: EquipmentCreate, user_id: str) -> Equipment:
    equip = Equipment(
        part_number=data.part_number,
        name=data.name,
        ata_chapter=data.ata_chapter,
        equipment_type=data.equipment_type,
        supplier_id=uuid.UUID(data.supplier_id) if data.supplier_id else None,
        status=data.status,
        description=data.description,
    )
    db.add(equip)
    await db.flush()

    if data.installation:
        inst = Installation(
            equipment_id=equip.id,
            zone_id=uuid.UUID(data.installation.zone_id) if data.installation.zone_id else None,
            sta=data.installation.sta,
            wl=data.installation.wl,
            bl=data.installation.bl,
            rack_position=data.installation.rack_position,
        )
        db.add(inst)

    if data.weight_balance:
        wb = WeightBalance(
            equipment_id=equip.id,
            mass_kg=data.weight_balance.mass_kg,
            arm_sta=data.weight_balance.arm_sta,
            arm_bl=data.weight_balance.arm_bl,
            arm_wl=data.weight_balance.arm_wl,
        )
        db.add(wb)

    if data.electrical_load:
        el = ElectricalLoad(
            equipment_id=equip.id,
            bus_id=uuid.UUID(data.electrical_load.bus_id),
            power_kva_normal=data.electrical_load.power_kva_normal,
            power_kva_emergency=data.electrical_load.power_kva_emergency,
            power_kva_max=data.electrical_load.power_kva_max,
        )
        db.add(el)

    audit = AuditLog(
        entity_type="equipment",
        entity_id=equip.id,
        action="create",
        new_value=data.model_dump(),
        user_id=uuid.UUID(user_id),
    )
    db.add(audit)
    await db.commit()
    await db.refresh(equip, ["installation", "weight_balance", "electrical_load"])
    return equip


async def update_equipment(db: AsyncSession, equipment_id: str, data: EquipmentUpdate, user_id: str) -> Equipment | None:
    equip = await get_equipment(db, equipment_id)
    if not equip:
        return None

    old_values = {}
    update_fields = data.model_dump(exclude_unset=True, exclude={"installation", "weight_balance", "electrical_load"})
    for field, value in update_fields.items():
        old_values[field] = getattr(equip, field)
        if field == "supplier_id" and value:
            value = uuid.UUID(value)
        setattr(equip, field, value)

    if data.installation is not None:
        if equip.installation:
            for k, v in data.installation.model_dump().items():
                if k == "zone_id" and v:
                    v = uuid.UUID(v)
                setattr(equip.installation, k, v)
        else:
            inst = Installation(
                equipment_id=equip.id,
                zone_id=uuid.UUID(data.installation.zone_id) if data.installation.zone_id else None,
                sta=data.installation.sta, wl=data.installation.wl, bl=data.installation.bl,
                rack_position=data.installation.rack_position,
            )
            db.add(inst)

    if data.weight_balance is not None:
        if equip.weight_balance:
            for k, v in data.weight_balance.model_dump().items():
                setattr(equip.weight_balance, k, v)
        else:
            wb = WeightBalance(equipment_id=equip.id, **data.weight_balance.model_dump())
            db.add(wb)

    if data.electrical_load is not None:
        if equip.electrical_load:
            for k, v in data.electrical_load.model_dump().items():
                if k == "bus_id" and v:
                    v = uuid.UUID(v)
                setattr(equip.electrical_load, k, v)
        else:
            el_data = data.electrical_load.model_dump()
            el_data["bus_id"] = uuid.UUID(el_data["bus_id"])
            el = ElectricalLoad(equipment_id=equip.id, **el_data)
            db.add(el)

    audit = AuditLog(
        entity_type="equipment", entity_id=equip.id, action="update",
        old_value=old_values, new_value=data.model_dump(exclude_unset=True),
        user_id=uuid.UUID(user_id),
    )
    db.add(audit)
    await db.commit()
    await db.refresh(equip, ["installation", "weight_balance", "electrical_load"])
    return equip


async def delete_equipment(db: AsyncSession, equipment_id: str, user_id: str) -> bool:
    equip = await get_equipment(db, equipment_id)
    if not equip:
        return False

    audit = AuditLog(
        entity_type="equipment", entity_id=equip.id, action="delete",
        old_value={"part_number": equip.part_number, "name": equip.name},
        user_id=uuid.UUID(user_id),
    )
    db.add(audit)
    await db.delete(equip)
    await db.commit()
    return True
