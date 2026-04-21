import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Equipment, Configuration, BusDefinition
from app.models.configuration import config_equipment
from app.engines import WeightBalanceEngine, ElectricalLoadEngine, ConstraintStatus
from app.schemas.constraint import ValidationReport, EngineResult

# MVP defaults for CE-25A (will be configurable per series later)
DEFAULT_MAC_LE_STA = 500.0
DEFAULT_MAC_LENGTH = 200.0
DEFAULT_CG_FWD_LIMIT = 20.0
DEFAULT_CG_AFT_LIMIT = 40.0
DEFAULT_MTOW_KG = 100_000.0


async def _load_equipment_for_config(db: AsyncSession, config_id: str) -> list[Equipment]:
    result = await db.execute(
        select(Equipment)
        .join(config_equipment, config_equipment.c.equipment_id == Equipment.id)
        .where(config_equipment.c.config_id == uuid.UUID(config_id))
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
        )
    )
    return list(result.scalars().unique().all())


async def _load_equipment_by_ids(db: AsyncSession, ids: list[str]) -> list[Equipment]:
    if not ids:
        return []
    uuids = [uuid.UUID(i) for i in ids]
    result = await db.execute(
        select(Equipment)
        .where(Equipment.id.in_(uuids))
        .options(
            selectinload(Equipment.installation),
            selectinload(Equipment.weight_balance),
            selectinload(Equipment.electrical_load),
        )
    )
    return list(result.scalars().unique().all())


def _equipment_to_dict(equip: Equipment) -> dict:
    d = {"id": str(equip.id), "part_number": equip.part_number, "name": equip.name}
    if equip.weight_balance:
        d["weight_balance"] = {
            "mass_kg": equip.weight_balance.mass_kg,
            "arm_sta": equip.weight_balance.arm_sta,
            "arm_bl": equip.weight_balance.arm_bl,
            "arm_wl": equip.weight_balance.arm_wl,
        }
    else:
        d["weight_balance"] = None
    if equip.electrical_load:
        d["electrical_load"] = {
            "bus_id": str(equip.electrical_load.bus_id),
            "bus_name": "",
            "power_kva_normal": equip.electrical_load.power_kva_normal,
            "power_kva_emergency": equip.electrical_load.power_kva_emergency,
            "power_kva_max": equip.electrical_load.power_kva_max,
        }
    else:
        d["electrical_load"] = None
    return d


async def _load_bus_definitions(db: AsyncSession, series_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(BusDefinition).where(BusDefinition.series_id == series_id)
    )
    buses = result.scalars().all()
    return [
        {"id": str(b.id), "bus_name": b.bus_name, "bus_type": b.bus_type, "rated_capacity_kva": b.rated_capacity_kva}
        for b in buses
    ]


async def validate_config(
    db: AsyncSession,
    config_id: str,
    hypothetical_adds: list[str] | None = None,
    hypothetical_removes: list[str] | None = None,
    phase: str = "normal",
) -> ValidationReport:
    # Load config to get series_id
    config = await db.get(Configuration, uuid.UUID(config_id))
    if not config:
        return ValidationReport(config_id=config_id, overall_status="blocked", engines=[
            EngineResult(engine_name="system", status="blocked", summary="构型不存在", details={})
        ])

    # Load equipment
    equipment_list = await _load_equipment_for_config(db, config_id)

    # Apply hypothetical changes
    if hypothetical_adds:
        extra = await _load_equipment_by_ids(db, hypothetical_adds)
        existing_ids = {e.id for e in equipment_list}
        equipment_list.extend(e for e in extra if e.id not in existing_ids)

    if hypothetical_removes:
        remove_set = {uuid.UUID(rid) for rid in hypothetical_removes}
        equipment_list = [e for e in equipment_list if e.id not in remove_set]

    # Convert to dicts
    equip_dicts = [_equipment_to_dict(e) for e in equipment_list]

    # Load bus definitions for this series
    bus_defs = await _load_bus_definitions(db, config.series_id)

    # Run engines
    wb_engine = WeightBalanceEngine(
        mac_leading_edge_sta=DEFAULT_MAC_LE_STA,
        mac_length=DEFAULT_MAC_LENGTH,
        cg_forward_limit_pct=DEFAULT_CG_FWD_LIMIT,
        cg_aft_limit_pct=DEFAULT_CG_AFT_LIMIT,
        mtow_kg=DEFAULT_MTOW_KG,
    )
    eload_engine = ElectricalLoadEngine(bus_definitions=bus_defs)

    wb_result = wb_engine.evaluate(equip_dicts)
    eload_result = eload_engine.evaluate(equip_dicts, phase=phase)

    # Aggregate overall status
    results = [wb_result, eload_result]
    if any(r.status == ConstraintStatus.BLOCKED for r in results):
        overall = "blocked"
    elif any(r.status == ConstraintStatus.WARNING for r in results):
        overall = "warning"
    else:
        overall = "pass"

    return ValidationReport(
        config_id=config_id,
        overall_status=overall,
        engines=[
            EngineResult(engine_name=r.engine_name, status=r.status.value, summary=r.summary, details=r.details)
            for r in results
        ],
    )
