import uuid
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Equipment, WeightBalance, ElectricalLoad, AuditLog, ConfigEquipment
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, ConfigEquipmentData, EquipmentResponse


async def list_equipment(
    db: AsyncSession,
    config_id: str | None = None,
    ata_chapter: str | None = None,
    zone_id: str | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[EquipmentResponse], int]:
    query = (
        select(Equipment)
        .options(
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
            selectinload(Equipment.supplier),
        )
    )
    count_query = select(func.count(Equipment.id))

    # When querying within a config, join ConfigEquipment to get config-level data
    ce_alias = None
    if config_id:
        ce_alias = ConfigEquipmentModel
        query = (
            query
            .join(ce_alias, ce_alias.equipment_id == Equipment.id)
            .options(
                selectinload(Equipment.weight_balance),
                selectinload(Equipment.electrical_load),
                selectinload(Equipment.supplier),
            )
            .add_columns(
                ce_alias.zone_id,
                ce_alias.sta,
                ce_alias.wl,
                ce_alias.bl,
                ce_alias.rack_position,
                ce_alias.bus_id,
                ce_alias.notes,
            )
            .where(ce_alias.config_id == uuid.UUID(config_id))
        )
        count_query = count_query.join(
            ce_alias, ce_alias.equipment_id == Equipment.id
        ).where(ce_alias.config_id == uuid.UUID(config_id))

    if ata_chapter:
        query = query.where(Equipment.ata_chapter.startswith(ata_chapter))
        count_query = count_query.where(Equipment.ata_chapter.startswith(ata_chapter))

    if zone_id:
        if ce_alias is not None:
            query = query.where(ce_alias.zone_id == uuid.UUID(zone_id))
            count_query = count_query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == uuid.UUID(zone_id))
        else:
            # Without a config context, filter by zone across all config_equipment rows
            query = query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == uuid.UUID(zone_id))
            count_query = count_query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == uuid.UUID(zone_id))

    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Equipment.part_number.ilike(pattern), Equipment.name.ilike(pattern)))
        count_query = count_query.where(or_(Equipment.part_number.ilike(pattern), Equipment.name.ilike(pattern)))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(offset).limit(limit).order_by(Equipment.ata_chapter, Equipment.part_number)
    result = await db.execute(query)

    items: list[EquipmentResponse] = []
    if config_id:
        # Result rows contain (Equipment, zone_id, sta, wl, bl, rack_position, bus_id, notes)
        seen = set()
        for row in result.unique().all():
            equip = row[0]
            if equip.id in seen:
                continue
            seen.add(equip.id)

            ce_zone_id = row[1]
            ce_sta = row[2]
            ce_wl = row[3]
            ce_bl = row[4]
            ce_rack_position = row[5]
            ce_bus_id = row[6]
            ce_notes = row[7]

            # Resolve zone name and bus name via lazy load or direct query
            zone_name = None
            if ce_zone_id:
                from app.models import Zone
                zone_obj = await db.get(Zone, ce_zone_id)
                zone_name = zone_obj.name if zone_obj else None

            bus_name = None
            if ce_bus_id:
                from app.models import BusDefinition
                bus_obj = await db.get(BusDefinition, ce_bus_id)
                bus_name = bus_obj.bus_name if bus_obj else None

            config_data = ConfigEquipmentData(
                zone_id=ce_zone_id,
                zone_name=zone_name,
                sta=ce_sta,
                wl=ce_wl,
                bl=ce_bl,
                rack_position=ce_rack_position,
                bus_id=ce_bus_id,
                bus_name=bus_name,
                notes=ce_notes,
            )

            resp = EquipmentResponse.model_validate(equip)
            resp.config_data = config_data
            resp.supplier_name = equip.supplier.name if equip.supplier else None
            items.append(resp)
    else:
        rows = list(result.scalars().unique().all())
        for equip in rows:
            resp = EquipmentResponse.model_validate(equip)
            resp.supplier_name = equip.supplier.name if equip.supplier else None
            items.append(resp)

    return items, total


async def get_equipment(db: AsyncSession, equipment_id: str) -> Equipment | None:
    result = await db.execute(
        select(Equipment)
        .options(
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
            selectinload(Equipment.supplier),
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

    if data.weight_balance:
        wb = WeightBalance(
            equipment_id=equip.id,
            mass_kg=data.weight_balance.mass_kg,
        )
        db.add(wb)

    if data.electrical_load:
        el = ElectricalLoad(
            equipment_id=equip.id,
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
    await db.refresh(equip, ["weight_balance", "electrical_load"])
    return equip


async def update_equipment(db: AsyncSession, equipment_id: str, data: EquipmentUpdate, user_id: str) -> Equipment | None:
    equip = await get_equipment(db, equipment_id)
    if not equip:
        return None

    old_values = {}
    update_fields = data.model_dump(exclude_unset=True, exclude={"weight_balance", "electrical_load"})
    for field, value in update_fields.items():
        old_values[field] = getattr(equip, field)
        if field == "supplier_id" and value:
            value = uuid.UUID(value)
        setattr(equip, field, value)

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
                setattr(equip.electrical_load, k, v)
        else:
            el = ElectricalLoad(equipment_id=equip.id, **data.electrical_load.model_dump())
            db.add(el)

    audit = AuditLog(
        entity_type="equipment", entity_id=equip.id, action="update",
        old_value=old_values, new_value=data.model_dump(exclude_unset=True),
        user_id=uuid.UUID(user_id),
    )
    db.add(audit)
    await db.commit()
    await db.refresh(equip, ["weight_balance", "electrical_load"])
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
