from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.electrical_detail import FlightPhase, LoadWorkMode
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["electrical_details"])


@router.get("/flight-phases")
async def list_flight_phases(
    program_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FlightPhase)
        .where(FlightPhase.program_id == program_id)
        .order_by(FlightPhase.phase_code)
    )
    rows = result.scalars().all()
    return [_phase_to_dict(r) for r in rows]


@router.get("/load-work-modes")
async def list_load_work_modes(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LoadWorkMode)
        .where(LoadWorkMode.config_id == config_id)
        .order_by(LoadWorkMode.lin_number, LoadWorkMode.load_id, LoadWorkMode.work_mode)
    )
    rows = result.scalars().all()
    return [_mode_to_dict(r) for r in rows]


def _phase_to_dict(r):
    return {
        "id": r.id, "program_id": r.program_id,
        "phase_code": r.phase_code, "phase_name": r.phase_name,
        "original_phase": r.original_phase, "duration_min": r.duration_min,
        "phase_definition": r.phase_definition, "control_surface": r.control_surface,
        "speed_tas": r.speed_tas, "altitude": r.altitude,
        "peak_simultaneity": r.peak_simultaneity, "emergency_simultaneity": r.emergency_simultaneity,
        "power_source_270v": r.power_source_270v,
    }


def _mode_to_dict(r):
    return {
        "id": r.id, "config_id": r.config_id, "lin_number": r.lin_number,
        "load_id": r.load_id, "work_mode": r.work_mode,
        "voltage_level": r.voltage_level, "emergency_sheddable": r.emergency_sheddable,
        "load_type": r.load_type, "power_demand_kw": r.power_demand_kw,
        "g0": r.g0, "g1": r.g1, "g2": r.g2, "g3": r.g3,
        "g4": r.g4, "g5": r.g5, "g6": r.g6, "g7": r.g7, "g8": r.g8,
    }
