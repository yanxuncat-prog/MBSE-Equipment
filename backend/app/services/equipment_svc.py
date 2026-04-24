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
                ce_alias.install_method,
                ce_alias.bonding_method,
                ce_alias.bonding_type,
                ce_alias.bonding_resistance,
                ce_alias.bonding_position,
                ce_alias.in_pace_drawing,
                ce_alias.layout_adjustment,
                ce_alias.use_batch0_device,
                ce_alias.procurement_status,
                ce_alias.procurement_location,
                ce_alias.planned_delivery_date,
                ce_alias.estimated_delivery_date,
                ce_alias.procurement_notes,
                ce_alias.config_name,
                ce_alias.mass_kg,
                ce_alias.cg_x,
                ce_alias.cg_y,
                ce_alias.cg_z,
                ce_alias.inertia_ix,
                ce_alias.inertia_iy,
                ce_alias.inertia_iz,
                ce_alias.inertia_ixy,
                ce_alias.inertia_ixz,
                ce_alias.inertia_iyz,
                ce_alias.weight_target_kg,
                ce_alias.overweight_risk,
                ce_alias.power_kva_normal,
                ce_alias.power_kva_emergency,
                ce_alias.power_kva_max,
                ce_alias.actual_arrival_date,
                ce_alias.micd_confirmed,
                ce_alias.structure_ready,
                ce_alias.installation_ready,
                ce_alias.planned_install_date,
                ce_alias.actual_install_date,
            )
            .where(ce_alias.config_id == config_id)
        )
        count_query = count_query.join(
            ce_alias, ce_alias.equipment_id == Equipment.id
        ).where(ce_alias.config_id == config_id)

    if ata_chapter:
        query = query.where(Equipment.ata_chapter.startswith(ata_chapter))
        count_query = count_query.where(Equipment.ata_chapter.startswith(ata_chapter))

    if zone_id:
        if ce_alias is not None:
            query = query.where(ce_alias.zone_id == zone_id)
            count_query = count_query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == zone_id)
        else:
            # Without a config context, filter by zone across all config_equipment rows
            query = query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == zone_id)
            count_query = count_query.join(
                ConfigEquipmentModel, ConfigEquipmentModel.equipment_id == Equipment.id, isouter=True
            ).where(ConfigEquipmentModel.zone_id == zone_id)

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
        # Result rows contain (Equipment, zone_id, sta, wl, bl, rack_position, bus_id, notes, install_method, ...)
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
            ce_install_method = row[8]
            ce_bonding_method = row[9]
            ce_bonding_type = row[10]
            ce_bonding_resistance = row[11]
            ce_bonding_position = row[12]
            ce_in_pace_drawing = row[13]
            ce_layout_adjustment = row[14]
            ce_use_batch0_device = row[15]
            ce_procurement_status = row[16]
            ce_procurement_location = row[17]
            ce_planned_delivery_date = row[18]
            ce_estimated_delivery_date = row[19]
            ce_procurement_notes = row[20]
            ce_config_name = row[21]
            ce_mass_kg = row[22]
            ce_cg_x = row[23]
            ce_cg_y = row[24]
            ce_cg_z = row[25]
            ce_inertia_ix = row[26]
            ce_inertia_iy = row[27]
            ce_inertia_iz = row[28]
            ce_inertia_ixy = row[29]
            ce_inertia_ixz = row[30]
            ce_inertia_iyz = row[31]
            ce_weight_target_kg = row[32]
            ce_overweight_risk = row[33]
            ce_power_kva_normal = row[34]
            ce_power_kva_emergency = row[35]
            ce_power_kva_max = row[36]
            ce_actual_arrival_date = row[37]
            ce_micd_confirmed = row[38]
            ce_structure_ready = row[39]
            ce_installation_ready = row[40]
            ce_planned_install_date = row[41]
            ce_actual_install_date = row[42]

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
                install_method=ce_install_method,
                config_name=ce_config_name,
                mass_kg=ce_mass_kg,
                cg_x=ce_cg_x,
                cg_y=ce_cg_y,
                cg_z=ce_cg_z,
                inertia_ix=ce_inertia_ix,
                inertia_iy=ce_inertia_iy,
                inertia_iz=ce_inertia_iz,
                inertia_ixy=ce_inertia_ixy,
                inertia_ixz=ce_inertia_ixz,
                inertia_iyz=ce_inertia_iyz,
                weight_target_kg=ce_weight_target_kg,
                overweight_risk=ce_overweight_risk,
                power_kva_normal=ce_power_kva_normal,
                power_kva_emergency=ce_power_kva_emergency,
                power_kva_max=ce_power_kva_max,
                bonding_method=ce_bonding_method,
                bonding_type=ce_bonding_type,
                bonding_resistance=ce_bonding_resistance,
                bonding_position=ce_bonding_position,
                in_pace_drawing=ce_in_pace_drawing,
                layout_adjustment=ce_layout_adjustment,
                use_batch0_device=ce_use_batch0_device,
                procurement_status=ce_procurement_status,
                procurement_location=ce_procurement_location,
                planned_delivery_date=str(ce_planned_delivery_date) if ce_planned_delivery_date else None,
                estimated_delivery_date=str(ce_estimated_delivery_date) if ce_estimated_delivery_date else None,
                procurement_notes=ce_procurement_notes,
                actual_arrival_date=str(ce_actual_arrival_date) if ce_actual_arrival_date else None,
                micd_confirmed=ce_micd_confirmed,
                structure_ready=ce_structure_ready,
                installation_ready=ce_installation_ready,
                planned_install_date=str(ce_planned_install_date) if ce_planned_install_date else None,
                actual_install_date=str(ce_actual_install_date) if ce_actual_install_date else None,
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
        .where(Equipment.id == equipment_id)
    )
    return result.scalar_one_or_none()


async def create_equipment(db: AsyncSession, data: EquipmentCreate, user_id: str) -> Equipment:
    equip = Equipment(
        part_number=data.part_number,
        name=data.name,
        ata_chapter=data.ata_chapter,
        equipment_type=data.equipment_type,
        supplier_id=data.supplier_id if data.supplier_id else None,
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
        user_id=user_id,
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
            value = value
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
        user_id=user_id,
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
        user_id=user_id,
    )
    db.add(audit)
    await db.delete(equip)
    await db.commit()
    return True
