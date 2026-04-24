import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.micd import MICDRecord
from app.api.deps import get_current_user

router = APIRouter(prefix="/micd", tags=["micd"])


# ── Pydantic schemas ────────────────────────────────────────────────

class MICDCreate(BaseModel):
    config_id: str
    equipment_id: str
    installation_structure_id: str | None = None
    bonding_surface: str | None = None
    fastener_brand: str | None = None
    fastener_count: int | None = None
    fastener_team: str | None = None
    bracket_model: str | None = None
    bracket_source: str | None = None
    bracket_mass_kg: float | None = None
    screw_spec: str | None = None
    wire_bonding_size: str | None = None
    model_config: str | None = None
    has_tolerance_drawing: bool | None = None
    tolerance_drawing_url: str | None = None
    notes: str | None = None


class MICDUpdate(BaseModel):
    installation_structure_id: str | None = None
    bonding_surface: str | None = None
    fastener_brand: str | None = None
    fastener_count: int | None = None
    fastener_team: str | None = None
    bracket_model: str | None = None
    bracket_source: str | None = None
    bracket_mass_kg: float | None = None
    screw_spec: str | None = None
    wire_bonding_size: str | None = None
    model_config: str | None = None
    has_tolerance_drawing: bool | None = None
    tolerance_drawing_url: str | None = None
    notes: str | None = None


class MICDConfirm(BaseModel):
    confirmed_by: str


# ── Helpers ──────────────────────────────────────────────────────────

def _to_dict(r: MICDRecord) -> dict:
    return {
        "id": r.id,
        "config_id": r.config_id,
        "equipment_id": r.equipment_id,
        "installation_structure_id": r.installation_structure_id,
        "bonding_surface": r.bonding_surface,
        "fastener_brand": r.fastener_brand,
        "fastener_count": r.fastener_count,
        "fastener_team": r.fastener_team,
        "bracket_model": r.bracket_model,
        "bracket_source": r.bracket_source,
        "bracket_mass_kg": r.bracket_mass_kg,
        "screw_spec": r.screw_spec,
        "wire_bonding_size": r.wire_bonding_size,
        "model_config": r.model_config,
        "has_tolerance_drawing": r.has_tolerance_drawing,
        "tolerance_drawing_url": r.tolerance_drawing_url,
        "is_confirmed": r.is_confirmed,
        "confirmed_at": r.confirmed_at.isoformat() if r.confirmed_at else None,
        "confirmed_by": r.confirmed_by,
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@router.get("/stats")
async def micd_stats(
    config_id: str = Query(...),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    base = select(MICDRecord).where(MICDRecord.config_id == config_id)

    total_result = await db.execute(
        select(func.count()).select_from(MICDRecord).where(MICDRecord.config_id == config_id)
    )
    total = total_result.scalar() or 0

    confirmed_result = await db.execute(
        select(func.count()).select_from(MICDRecord).where(
            MICDRecord.config_id == config_id,
            MICDRecord.is_confirmed == True,
        )
    )
    confirmed = confirmed_result.scalar() or 0

    unconfirmed = total - confirmed

    confirmed_in_range = 0
    if start_date and end_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
            ed = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
        range_result = await db.execute(
            select(func.count()).select_from(MICDRecord).where(
                MICDRecord.config_id == config_id,
                MICDRecord.is_confirmed == True,
                MICDRecord.confirmed_at >= sd,
                MICDRecord.confirmed_at <= ed,
            )
        )
        confirmed_in_range = range_result.scalar() or 0

    return {
        "total": total,
        "confirmed": confirmed,
        "unconfirmed": unconfirmed,
        "confirmed_in_range": confirmed_in_range,
    }


@router.get("")
async def list_micd(
    config_id: str = Query(...),
    equipment_id: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(MICDRecord).where(MICDRecord.config_id == config_id)
    count_q = select(func.count()).select_from(MICDRecord).where(MICDRecord.config_id == config_id)

    if equipment_id:
        q = q.where(MICDRecord.equipment_id == equipment_id)
        count_q = count_q.where(MICDRecord.equipment_id == equipment_id)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    q = q.order_by(MICDRecord.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(q)
    records = result.scalars().all()

    return {
        "items": [_to_dict(r) for r in records],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.post("")
async def create_micd(
    body: MICDCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = MICDRecord(
        id=str(uuid.uuid4()),
        config_id=body.config_id,
        equipment_id=body.equipment_id,
        installation_structure_id=body.installation_structure_id,
        bonding_surface=body.bonding_surface,
        fastener_brand=body.fastener_brand,
        fastener_count=body.fastener_count,
        fastener_team=body.fastener_team,
        bracket_model=body.bracket_model,
        bracket_source=body.bracket_source,
        bracket_mass_kg=body.bracket_mass_kg,
        screw_spec=body.screw_spec,
        wire_bonding_size=body.wire_bonding_size,
        model_config=body.model_config,
        has_tolerance_drawing=body.has_tolerance_drawing,
        tolerance_drawing_url=body.tolerance_drawing_url,
        notes=body.notes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.patch("/{record_id}")
async def update_micd(
    record_id: str,
    body: MICDUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(MICDRecord).where(MICDRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.post("/{record_id}/confirm")
async def confirm_micd(
    record_id: str,
    body: MICDConfirm,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(MICDRecord).where(MICDRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")

    record.is_confirmed = True
    record.confirmed_at = date.today()
    record.confirmed_by = body.confirmed_by

    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.delete("/{record_id}", status_code=204)
async def delete_micd(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(MICDRecord).where(MICDRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")

    await db.delete(record)
    await db.commit()
