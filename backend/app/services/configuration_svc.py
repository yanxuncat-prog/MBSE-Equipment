import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Configuration, Equipment, ConfigEquipment
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.schemas.configuration import ConfigCreate, DiffItem, ConfigDiffResponse


async def list_configs(db: AsyncSession, program_id: str) -> list[dict]:
    """Returns all configs for a program with equipment count."""
    stmt = (
        select(
            Configuration,
            func.count(ConfigEquipmentModel.lin_number).label("equipment_count"),
        )
        .outerjoin(ConfigEquipmentModel, ConfigEquipmentModel.config_id == Configuration.id)
        .where(Configuration.program_id == program_id)
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
            func.count(ConfigEquipmentModel.lin_number).label("equipment_count"),
        )
        .outerjoin(ConfigEquipmentModel, ConfigEquipmentModel.config_id == Configuration.id)
        .where(Configuration.id == config_id)
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
        program_id=data.program_id,
        version=data.version,
        description=data.description,
        created_by=user_id,
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
        select(Configuration).where(Configuration.id == source_id)
    )
    source = source_result.scalar_one_or_none()
    if source is None:
        return None

    # Create the new config
    new_config = Configuration(
        program_id=source.program_id,
        version=new_version,
        description=f"Cloned from {source.version}",
        created_by=user_id,
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
            lin_number=ce.lin_number,
            equipment_id=ce.equipment_id,
            zone_id=ce.zone_id,
            sta=ce.sta,
            wl=ce.wl,
            bl=ce.bl,
            rack_position=ce.rack_position,
            notes=ce.notes,
        )
        db.add(new_ce)

    await db.commit()
    await db.refresh(new_config)
    return {"config": new_config, "equipment_count": len(source_entries)}


async def lock_baseline(db: AsyncSession, config_id: str) -> dict | None:
    """Sets status to 'baseline', sets frozen_at timestamp. Fails if already locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == config_id)
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
        select(func.count(ConfigEquipmentModel.lin_number)).where(
            ConfigEquipmentModel.config_id == config.id
        )
    )
    count = count_result.scalar() or 0
    return {"config": config, "equipment_count": count}


async def add_equipment_to_config(
    db: AsyncSession, config_id: str, lin_number: str, equipment_id: str | None = None
) -> bool:
    """Adds equipment to config via ConfigEquipment. Fails if config is locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == config_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise ValueError("Configuration not found")
    if config.status != "draft":
        raise ValueError("Cannot modify a locked configuration")

    # Verify equipment exists if provided
    if equipment_id:
        equip_result = await db.execute(
            select(Equipment.id).where(Equipment.id == equipment_id)
        )
        if equip_result.scalar_one_or_none() is None:
            raise ValueError("Equipment not found")

    # Check if lin_number already used in this config
    existing = await db.execute(
        select(ConfigEquipmentModel).where(
            ConfigEquipmentModel.config_id == config_id,
            ConfigEquipmentModel.lin_number == lin_number,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("LIN number already exists in this configuration")

    ce = ConfigEquipmentModel(
        config_id=config_id,
        lin_number=lin_number,
        equipment_id=equipment_id,
    )
    db.add(ce)
    await db.commit()
    return True


async def remove_equipment_from_config(
    db: AsyncSession, config_id: str, lin_number: str
) -> bool:
    """Removes from config. Fails if locked."""
    result = await db.execute(
        select(Configuration).where(Configuration.id == config_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise ValueError("Configuration not found")
    if config.status != "draft":
        raise ValueError("Cannot modify a locked configuration")

    stmt = delete(ConfigEquipmentModel).where(
        ConfigEquipmentModel.config_id == config_id,
        ConfigEquipmentModel.lin_number == lin_number,
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise ValueError("Equipment not found in this configuration")
    await db.commit()
    return True


async def _load_config_equipment(
    db: AsyncSession, config_id: uuid.UUID
) -> list[ConfigEquipmentModel]:
    """Load all ConfigEquipment entries for a config with equipment."""
    stmt = (
        select(ConfigEquipmentModel)
        .where(ConfigEquipmentModel.config_id == config_id)
        .options(
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
        select(Configuration).where(Configuration.id == config_a_id)
    )
    config_a = config_a_result.scalar_one_or_none()
    if config_a is None:
        raise ValueError("Configuration A not found")

    config_b_result = await db.execute(
        select(Configuration).where(Configuration.id == config_b_id)
    )
    config_b = config_b_result.scalar_one_or_none()
    if config_b is None:
        raise ValueError("Configuration B not found")

    # Load ConfigEquipment for both configs
    ce_a_list = await _load_config_equipment(db, config_a.id)
    ce_b_list = await _load_config_equipment(db, config_b.id)

    # Create lookup dicts by equipment NAME (same name = same device across configs)
    ce_a_map = {ce.equipment.name: ce for ce in ce_a_list}
    ce_b_map = {ce.equipment.name: ce for ce in ce_b_list}

    names_a = set(ce_a_map.keys())
    names_b = set(ce_b_map.keys())

    added_ids = names_b - names_a
    removed_ids = names_a - names_b
    common_ids = names_a & names_b

    added: list[DiffItem] = []
    removed: list[DiffItem] = []
    modified: list[DiffItem] = []
    unchanged: list[DiffItem] = []

    # Track impact summary values
    net_mass_change = 0.0
    bus_load_changes: dict[str, dict] = {}

    for name_key in added_ids:
        ce = ce_b_map[name_key]
        e = ce.equipment
        added.append(
            DiffItem(
                equipment_id=str(ce.equipment_id),
                part_number=e.part_number,
                name=e.name,
                ata_chapter=e.ata_chapter,
                change_type="added",
            )
        )
        if ce.mass_kg:
            net_mass_change += ce.mass_kg

    for name_key in removed_ids:
        ce = ce_a_map[name_key]
        e = ce.equipment
        removed.append(
            DiffItem(
                equipment_id=str(ce.equipment_id),
                part_number=e.part_number,
                name=e.name,
                ata_chapter=e.ata_chapter,
                change_type="removed",
            )
        )
        if ce.mass_kg:
            net_mass_change -= ce.mass_kg

    for name_key in common_ids:
        ce_a = ce_a_map[name_key]
        ce_b = ce_b_map[name_key]
        ea = ce_a.equipment
        eb = ce_b.equipment
        changes: dict = {}

        def _is_empty(v):
            """Check if a value is effectively empty."""
            if v is None:
                return True
            if isinstance(v, str) and v.strip() == "":
                return True
            return False

        # Compare equipment-level fields (exclude part_number — import artifact)
        # Only flag as different when BOTH sides have non-empty values
        for field in ("dimensions_mm", "is_electrical",
                       "has_eicd", "power_redundancy", "power_voltage", "power_watts",
                       "bonding_method", "bonding_type", "bonding_resistance"):
            val_a = getattr(ea, field, None)
            val_b = getattr(eb, field, None)
            if _is_empty(val_a) and _is_empty(val_b):
                continue
            if _is_empty(val_a) or _is_empty(val_b):
                continue  # one side empty — data completeness issue, not a real diff
            if val_a != val_b:
                changes[field] = {"from": val_a, "to": val_b}

        # Compare mass_kg from config_equipment
        mass_a = ce_a.mass_kg
        mass_b = ce_b.mass_kg
        if mass_a is not None and mass_b is not None:
            if abs(mass_a - mass_b) > 0.001:
                changes["mass_kg"] = {
                    "from": round(mass_a, 4),
                    "to": round(mass_b, 4),
                }
            net_mass_change += (mass_b - mass_a)
        elif mass_b is not None:
            net_mass_change += mass_b
        elif mass_a is not None:
            net_mass_change -= mass_a

        # Compare config-level attributes — only when both have data
        for field in ("install_method",):
            val_a = getattr(ce_a, field)
            val_b = getattr(ce_b, field)
            if _is_empty(val_a) or _is_empty(val_b):
                continue
            if val_a != val_b:
                changes[field] = {"from": val_a, "to": val_b}

        # Skip sta/wl/bl/zone/bus comparison — position data comparison not meaningful here
        zone_a = str(ce_a.zone_id) if ce_a.zone_id else None
        zone_b = str(ce_b.zone_id) if ce_b.zone_id else None
        if zone_a != zone_b:
            changes["config.zone_id"] = {"from": zone_a, "to": zone_b}

        # Compare power_kva fields (equipment-level)
        for field in ("power_kva_normal", "power_kva_emergency", "power_kva_max"):
            val_a = getattr(ea, field, None)
            val_b = getattr(eb, field, None)
            if val_a != val_b:
                changes[f"equipment.{field}"] = {
                    "from": val_a,
                    "to": val_b,
                }
        # Track bus load changes for common items
        normal_diff = (eb.power_kva_normal or 0) - (ea.power_kva_normal or 0)

        if changes:
            modified.append(
                DiffItem(
                    equipment_id=str(ce_b.equipment_id),
                    part_number=eb.part_number,
                    name=eb.name,
                    ata_chapter=eb.ata_chapter,
                    change_type="modified",
                    changes=changes,
                )
            )
        else:
            unchanged.append(
                DiffItem(
                    equipment_id=str(ce_b.equipment_id),
                    part_number=eb.part_number,
                    name=eb.name,
                    ata_chapter=eb.ata_chapter,
                    change_type="unchanged",
                )
            )

    impact_summary = {
        "net_mass_change_kg": round(net_mass_change, 4),
        "equipment_added": len(added),
        "equipment_removed": len(removed),
        "equipment_modified": len(modified),
        "equipment_common": len(common_ids),
        "equipment_unchanged": len(common_ids) - len(modified),
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
        unchanged=unchanged,
        impact_summary=impact_summary,
    )
