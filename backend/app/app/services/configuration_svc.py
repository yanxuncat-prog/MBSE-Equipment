import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Configuration, Equipment, ConfigEquipment
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.schemas.configuration import ConfigCreate, DiffItem, ConfigDiffResponse


async def list_configs(db: AsyncSession, series_id: str) -> list[dict]:
    """Returns all configs for a series with equipment count."""
    stmt = (
        select(
            Configuration,
            func.count(ConfigEquipmentModel.equipment_id).label("equipment_count"),
        )
        .outerjoin(ConfigEquipmentModel, ConfigEquipmentModel.config_id == Configuration.id)
        .where(Configuration.series_id == uuid.UUID(series_id))
        .group_by(Configuration.id)
        .order_by(Configuration.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    configs = []
    for row in rows:
        config = row[0]
        count = row[1]
        configs.append({"config": config, "equipment_count": count})
    return configs


async def get_config(db: AsyncSession, config_id: str) -> dict | None:
    """Single config with equipment_count."""
    stmt = (
        select(
            Configuration,
            func.count(ConfigEquipmentModel.equipment_id).label("equipment_count"),
        )
        .outerjoin(ConfigEquipmentModel, ConfigEquipmentModel.config_id == Configuration.id)
        .where(Configuration.id == uuid.UUID(config_id))
        .group_by(Configuration.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if row is None:
        return None
    return {"config": row[0], "equipment_count": row[1]}


async def create_config(db: AsyncSession, data: ConfigCreate, user_id: str) -> dict:
    """Creates a new draft config."""
    config = Configuration(
        series_id=uuid.UUID(data.series_id),
        version=data.version,
        description=data.description,
        created_by=uuid.UUID(user_id),
        status="draft",
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return {"config": config, "equipment_count": 0}


async def clone_config(db: AsyncSession, source_id: str, new_version: str, user_id: str) -> dict:
    """Copies all equipment associations (with config-level data) from source to a new draft config."""
    # Load the source config
    source_result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(source_id))
    )
    source = source_result.scalar_one_or_none()
    if source is None:
        return None

    # Create the new config
    new_config = Configuration(
        series_id=source.series_id,
        version=new_version,
        description=f"Cloned from {source.version}",
        created_by=uuid.UUID(user_id),
        status="draft",
    )
    db.add(new_config)
    await db.flush()

    # Copy ConfigEquipment entries (including zone/sta/bus data)
    ce_result = await db.execute(
        select(ConfigEquipmentModel).where(ConfigEquipmentModel.config_id == source.id)
    )
    source_entries = list(ce_result.scalars().all())

    for ce in source_entries:
        new_ce = ConfigEquipmentModel(
            config_id=new_config.id,
            equipment_id=ce.equipment_id,
            zone_id=ce.zone_id,
            sta=ce.sta,
            wl=ce.wl,
            bl=ce.bl,
            rack_position=ce.rack_position,
            bus_id=ce.bus_id,
            notes=ce.notes,
        )
        db.add(new_ce)

    await db.commit()
    await db.refresh(new_config)
    return {"config": new_config, "equipment_count": len(source_entries)}


async def lock_baseline(db: AsyncSession, config_id: str) -> dict | None:
    """Sets status to 'baseline', sets frozen_at timestamp. Fails if already locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if config is None:
        return None

    if config.status != "draft":
        raise ValueError(f"Configuration is already '{config.status}', cannot lock")

    config.status = "baseline"
    config.frozen_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(config)

    # Get equipment count
    count_result = await db.execute(
        select(func.count(ConfigEquipmentModel.equipment_id)).where(
            ConfigEquipmentModel.config_id == config.id
        )
    )
    count = count_result.scalar() or 0
    return {"config": config, "equipment_count": count}


async def add_equipment_to_config(
    db: AsyncSession, config_id: str, equipment_id: str
) -> bool:
    """Adds equipment to config via ConfigEquipment. Fails if config is locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise ValueError("Configuration not found")
    if config.status != "draft":
        raise ValueError("Cannot modify a locked configuration")

    # Verify equipment exists
    equip_result = await db.execute(
        select(Equipment.id).where(Equipment.id == uuid.UUID(equipment_id))
    )
    if equip_result.scalar_one_or_none() is None:
        raise ValueError("Equipment not found")

    # Check if already associated
    existing = await db.execute(
        select(ConfigEquipmentModel).where(
            ConfigEquipmentModel.config_id == uuid.UUID(config_id),
            ConfigEquipmentModel.equipment_id == uuid.UUID(equipment_id),
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("Equipment already in this configuration")

    ce = ConfigEquipmentModel(
        config_id=uuid.UUID(config_id),
        equipment_id=uuid.UUID(equipment_id),
    )
    db.add(ce)
    await db.commit()
    return True


async def remove_equipment_from_config(
    db: AsyncSession, config_id: str, equipment_id: str
) -> bool:
    """Removes from config. Fails if locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise ValueError("Configuration not found")
    if config.status != "draft":
        raise ValueError("Cannot modify a locked configuration")

    stmt = delete(ConfigEquipmentModel).where(
        ConfigEquipmentModel.config_id == uuid.UUID(config_id),
        ConfigEquipmentModel.equipment_id == uuid.UUID(equipment_id),
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise ValueError("Equipment not found in this configuration")
    await db.commit()
    return True


async def _load_config_equipment(
    db: AsyncSession, config_id: uuid.UUID
) -> list[ConfigEquipmentModel]:
    """Load all ConfigEquipment entries for a config with equipment, weight_balance, and electrical_load."""
    stmt = (
        select(ConfigEquipmentModel)
        .where(ConfigEquipmentModel.config_id == config_id)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.weight_balance),
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.electrical_load),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def diff_configs(
    db: AsyncSession, config_a_id: str, config_b_id: str
) -> ConfigDiffResponse:
    """Compares equipment lists between two configs.

    Returns added/removed/modified items with field-level diffs and impact summary.
    """
    # Load both configs
    config_a_result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_a_id))
    )
    config_a = config_a_result.scalar_one_or_none()
    if config_a is None:
        raise ValueError("Configuration A not found")

    config_b_result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_b_id))
    )
    config_b = config_b_result.scalar_one_or_none()
    if config_b is None:
        raise ValueError("Configuration B not found")

    # Load ConfigEquipment for both configs
    ce_a_list = await _load_config_equipment(db, config_a.id)
    ce_b_list = await _load_config_equipment(db, config_b.id)

    # Create lookup dicts by equipment id
    ce_a_map = {str(ce.equipment_id): ce for ce in ce_a_list}
    ce_b_map = {str(ce.equipment_id): ce for ce in ce_b_list}

    ids_a = set(ce_a_map.keys())
    ids_b = set(ce_b_map.keys())

    added_ids = ids_b - ids_a
    removed_ids = ids_a - ids_b
    common_ids = ids_a & ids_b

    added: list[DiffItem] = []
    removed: list[DiffItem] = []
    modified: list[DiffItem] = []

    # Track impact summary values
    net_mass_change = 0.0
    bus_load_changes: dict[str, dict] = {}

    for eid in added_ids:
        ce = ce_b_map[eid]
        e = ce.equipment
        added.append(
            DiffItem(
                equipment_id=eid,
                part_number=e.part_number,
                name=e.name,
                change_type="added",
            )
        )
        if e.weight_balance:
            net_mass_change += e.weight_balance.mass_kg
        if e.electrical_load and ce.bus_id:
            bus_id = str(ce.bus_id)
            if bus_id not in bus_load_changes:
                bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
            bus_load_changes[bus_id]["normal_kva_change"] += e.electrical_load.power_kva_normal

    for eid in removed_ids:
        ce = ce_a_map[eid]
        e = ce.equipment
        removed.append(
            DiffItem(
                equipment_id=eid,
                part_number=e.part_number,
                name=e.name,
                change_type="removed",
            )
        )
        if e.weight_balance:
            net_mass_change -= e.weight_balance.mass_kg
        if e.electrical_load and ce.bus_id:
            bus_id = str(ce.bus_id)
            if bus_id not in bus_load_changes:
                bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
            bus_load_changes[bus_id]["normal_kva_change"] -= e.electrical_load.power_kva_normal

    for eid in common_ids:
        ce_a = ce_a_map[eid]
        ce_b = ce_b_map[eid]
        ea = ce_a.equipment
        eb = ce_b.equipment
        changes: dict = {}

        # Compare weight_balance fields
        wb_a = ea.weight_balance
        wb_b = eb.weight_balance
        if wb_a and wb_b:
            if wb_a.mass_kg != wb_b.mass_kg:
                changes["weight_balance.mass_kg"] = {
                    "from": wb_a.mass_kg,
                    "to": wb_b.mass_kg,
                }
            net_mass_change += (wb_b.mass_kg - wb_a.mass_kg)
        elif wb_b and not wb_a:
            changes["weight_balance"] = {"from": None, "to": "added"}
            net_mass_change += wb_b.mass_kg
        elif wb_a and not wb_b:
            changes["weight_balance"] = {"from": "present", "to": None}
            net_mass_change -= wb_a.mass_kg

        # Compare config-level attributes (sta, zone, bus)
        for field in ("sta", "wl", "bl", "rack_position"):
            val_a = getattr(ce_a, field)
            val_b = getattr(ce_b, field)
            if val_a != val_b:
                changes[f"config.{field}"] = {"from": val_a, "to": val_b}

        # Compare bus assignment (config-level)
        bus_a = str(ce_a.bus_id) if ce_a.bus_id else None
        bus_b = str(ce_b.bus_id) if ce_b.bus_id else None
        if bus_a != bus_b:
            changes["config.bus_id"] = {"from": bus_a, "to": bus_b}

        # Compare zone assignment (config-level)
        zone_a = str(ce_a.zone_id) if ce_a.zone_id else None
        zone_b = str(ce_b.zone_id) if ce_b.zone_id else None
        if zone_a != zone_b:
            changes["config.zone_id"] = {"from": zone_a, "to": zone_b}

        # Compare electrical_load fields (equipment-level)
        el_a = ea.electrical_load
        el_b = eb.electrical_load
        if el_a and el_b:
            for field in ("power_kva_normal", "power_kva_emergency", "power_kva_max"):
                val_a = getattr(el_a, field)
                val_b = getattr(el_b, field)
                if val_a != val_b:
                    changes[f"electrical_load.{field}"] = {
                        "from": val_a,
                        "to": val_b,
                    }
            # Track bus load changes for common items
            normal_diff = (el_b.power_kva_normal or 0) - (el_a.power_kva_normal or 0)
            if normal_diff != 0 and ce_b.bus_id:
                bus_id_b = str(ce_b.bus_id)
                if bus_id_b not in bus_load_changes:
                    bus_load_changes[bus_id_b] = {"normal_kva_change": 0.0}
                bus_load_changes[bus_id_b]["normal_kva_change"] += normal_diff
        elif el_b and not el_a:
            changes["electrical_load"] = {"from": None, "to": "added"}
            if ce_b.bus_id:
                bus_id = str(ce_b.bus_id)
                if bus_id not in bus_load_changes:
                    bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
                bus_load_changes[bus_id]["normal_kva_change"] += el_b.power_kva_normal
        elif el_a and not el_b:
            changes["electrical_load"] = {"from": "present", "to": None}
            if ce_a.bus_id:
                bus_id = str(ce_a.bus_id)
                if bus_id not in bus_load_changes:
                    bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
                bus_load_changes[bus_id]["normal_kva_change"] -= el_a.power_kva_normal

        if changes:
            modified.append(
                DiffItem(
                    equipment_id=eid,
                    part_number=eb.part_number,
                    name=eb.name,
                    change_type="modified",
                    changes=changes,
                )
            )

    impact_summary = {
        "net_mass_change_kg": round(net_mass_change, 4),
        "equipment_added": len(added),
        "equipment_removed": len(removed),
        "equipment_modified": len(modified),
        "bus_load_changes": bus_load_changes,
    }

    return ConfigDiffResponse(
        config_a_id=config_a_id,
        config_a_version=config_a.version,
        config_b_id=config_b_id,
        config_b_version=config_b.version,
        added=added,
        removed=removed,
        modified=modified,
        impact_summary=impact_summary,
    )
