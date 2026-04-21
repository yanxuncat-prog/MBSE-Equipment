import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, insert, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Configuration, Equipment, config_equipment
from app.schemas.configuration import ConfigCreate, DiffItem, ConfigDiffResponse


async def list_configs(db: AsyncSession, series_id: str) -> list[dict]:
    """Returns all configs for a series with equipment count."""
    stmt = (
        select(
            Configuration,
            func.count(config_equipment.c.equipment_id).label("equipment_count"),
        )
        .outerjoin(config_equipment, config_equipment.c.config_id == Configuration.id)
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
            func.count(config_equipment.c.equipment_id).label("equipment_count"),
        )
        .outerjoin(config_equipment, config_equipment.c.config_id == Configuration.id)
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
    """Copies all equipment associations from source to a new draft config."""
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

    # Copy equipment associations
    equip_stmt = select(config_equipment.c.equipment_id).where(
        config_equipment.c.config_id == source.id
    )
    equip_result = await db.execute(equip_stmt)
    equipment_ids = [row[0] for row in equip_result.all()]

    if equipment_ids:
        await db.execute(
            insert(config_equipment),
            [
                {"config_id": new_config.id, "equipment_id": eid}
                for eid in equipment_ids
            ],
        )

    await db.commit()
    await db.refresh(new_config)
    return {"config": new_config, "equipment_count": len(equipment_ids)}


async def lock_baseline(db: AsyncSession, config_id: str) -> dict | None:
    """Sets status to 'baseline', sets locked_at timestamp. Fails if already locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if config is None:
        return None

    if config.status != "draft":
        raise ValueError(f"Configuration is already '{config.status}', cannot lock")

    config.status = "baseline"
    config.locked_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(config)

    # Get equipment count
    count_result = await db.execute(
        select(func.count(config_equipment.c.equipment_id)).where(
            config_equipment.c.config_id == config.id
        )
    )
    count = count_result.scalar() or 0
    return {"config": config, "equipment_count": count}


async def add_equipment_to_config(
    db: AsyncSession, config_id: str, equipment_id: str
) -> bool:
    """Adds equipment to config's M:N. Fails if config is locked."""
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
        select(config_equipment).where(
            config_equipment.c.config_id == uuid.UUID(config_id),
            config_equipment.c.equipment_id == uuid.UUID(equipment_id),
        )
    )
    if existing.first() is not None:
        raise ValueError("Equipment already in this configuration")

    await db.execute(
        insert(config_equipment).values(
            config_id=uuid.UUID(config_id),
            equipment_id=uuid.UUID(equipment_id),
        )
    )
    await db.commit()
    return True


async def remove_equipment_from_config(
    db: AsyncSession, config_id: str, equipment_id: str
) -> bool:
    """Removes from M:N. Fails if locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise ValueError("Configuration not found")
    if config.status != "draft":
        raise ValueError("Cannot modify a locked configuration")

    stmt = delete(config_equipment).where(
        config_equipment.c.config_id == uuid.UUID(config_id),
        config_equipment.c.equipment_id == uuid.UUID(equipment_id),
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise ValueError("Equipment not found in this configuration")
    await db.commit()
    return True


async def _load_config_equipment(
    db: AsyncSession, config_id: uuid.UUID
) -> list[Equipment]:
    """Load all equipment for a config with weight_balance and electrical_load eagerly loaded."""
    stmt = (
        select(Equipment)
        .join(config_equipment, config_equipment.c.equipment_id == Equipment.id)
        .where(config_equipment.c.config_id == config_id)
        .options(
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
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

    # Load equipment for both configs
    equip_a_list = await _load_config_equipment(db, config_a.id)
    equip_b_list = await _load_config_equipment(db, config_b.id)

    # Create lookup dicts by equipment id
    equip_a_map = {str(e.id): e for e in equip_a_list}
    equip_b_map = {str(e.id): e for e in equip_b_list}

    ids_a = set(equip_a_map.keys())
    ids_b = set(equip_b_map.keys())

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
        e = equip_b_map[eid]
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
        if e.electrical_load:
            bus_id = str(e.electrical_load.bus_id)
            if bus_id not in bus_load_changes:
                bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
            bus_load_changes[bus_id]["normal_kva_change"] += e.electrical_load.power_kva_normal

    for eid in removed_ids:
        e = equip_a_map[eid]
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
        if e.electrical_load:
            bus_id = str(e.electrical_load.bus_id)
            if bus_id not in bus_load_changes:
                bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
            bus_load_changes[bus_id]["normal_kva_change"] -= e.electrical_load.power_kva_normal

    for eid in common_ids:
        ea = equip_a_map[eid]
        eb = equip_b_map[eid]
        changes: dict = {}

        # Compare weight_balance fields
        wb_a = ea.weight_balance
        wb_b = eb.weight_balance
        if wb_a and wb_b:
            for field in ("mass_kg", "arm_sta", "arm_bl", "arm_wl"):
                val_a = getattr(wb_a, field)
                val_b = getattr(wb_b, field)
                if val_a != val_b:
                    changes[f"weight_balance.{field}"] = {
                        "from": val_a,
                        "to": val_b,
                    }
            net_mass_change += (wb_b.mass_kg - wb_a.mass_kg)
        elif wb_b and not wb_a:
            changes["weight_balance"] = {"from": None, "to": "added"}
            net_mass_change += wb_b.mass_kg
        elif wb_a and not wb_b:
            changes["weight_balance"] = {"from": "present", "to": None}
            net_mass_change -= wb_a.mass_kg

        # Compare electrical_load fields
        el_a = ea.electrical_load
        el_b = eb.electrical_load
        if el_a and el_b:
            for field in ("bus_id", "power_kva_normal", "power_kva_emergency", "power_kva_max"):
                val_a = getattr(el_a, field)
                val_b = getattr(el_b, field)
                # Convert UUID to str for comparison
                if field == "bus_id":
                    val_a = str(val_a) if val_a else None
                    val_b = str(val_b) if val_b else None
                if val_a != val_b:
                    changes[f"electrical_load.{field}"] = {
                        "from": val_a,
                        "to": val_b,
                    }
            # Track bus load changes for common items
            normal_diff = (el_b.power_kva_normal or 0) - (el_a.power_kva_normal or 0)
            if normal_diff != 0:
                bus_id_b = str(el_b.bus_id)
                if bus_id_b not in bus_load_changes:
                    bus_load_changes[bus_id_b] = {"normal_kva_change": 0.0}
                bus_load_changes[bus_id_b]["normal_kva_change"] += normal_diff
        elif el_b and not el_a:
            changes["electrical_load"] = {"from": None, "to": "added"}
            bus_id = str(el_b.bus_id)
            if bus_id not in bus_load_changes:
                bus_load_changes[bus_id] = {"normal_kva_change": 0.0}
            bus_load_changes[bus_id]["normal_kva_change"] += el_b.power_kva_normal
        elif el_a and not el_b:
            changes["electrical_load"] = {"from": "present", "to": None}
            bus_id = str(el_a.bus_id)
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
