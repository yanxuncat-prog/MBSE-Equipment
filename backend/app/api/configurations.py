import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.configuration import Configuration, ConfigEquipment as ConfigEquipmentModel
from app.models.audit_log import AuditLog
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.configuration import ConfigCreate, ConfigResponse, ConfigDiffResponse
from app.schemas.equipment import EquipmentFullUpdate
from app.services import configuration_svc

router = APIRouter(tags=["configurations"])

FROZEN_MASTER_FIELDS = {"name", "part_number"}


def _serialize(val):
    """Convert non-JSON-serializable values (e.g. date) to strings."""
    if isinstance(val, date):
        return val.isoformat()
    return val


def _to_response(data: dict) -> ConfigResponse:
    """Convert service result dict to ConfigResponse."""
    config = data["config"]
    return ConfigResponse(
        id=str(config.id),
        program_id=str(config.program_id),
        version=config.version,
        status=config.status,
        description=config.description,
        created_by=str(config.created_by) if config.created_by else None,
        frozen_at=config.frozen_at.isoformat() if config.frozen_at else None,
        created_at=config.created_at.isoformat(),
        equipment_count=data["equipment_count"],
    )


class CloneBody(BaseModel):
    version: str


@router.get("/configurations", response_model=list[ConfigResponse])
async def list_configurations(
    program_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    results = await configuration_svc.list_configs(db, program_id)
    return [_to_response(r) for r in results]


@router.post("/configurations", response_model=ConfigResponse, status_code=201)
async def create_configuration(
    data: ConfigCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await configuration_svc.create_config(db, data, str(user.id))
    return _to_response(result)


@router.post("/configurations/{config_id}/clone", response_model=ConfigResponse, status_code=201)
async def clone_configuration(
    config_id: str,
    body: CloneBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await configuration_svc.clone_config(db, config_id, body.version, str(user.id))
    if result is None:
        raise HTTPException(status_code=404, detail="Source configuration not found")
    return _to_response(result)


@router.post("/configurations/{config_id}/lock", response_model=ConfigResponse)
async def lock_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        result = await configuration_svc.lock_baseline(db, config_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result is None:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return _to_response(result)


@router.post("/configurations/{config_id}/freeze", response_model=ConfigResponse)
async def freeze_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Freeze a configuration — prevents edits to master fields (name, part_number, lin_number)."""
    result = await db.execute(select(Configuration).where(Configuration.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    config.frozen_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(config)
    # Build a response-compatible dict
    count_result = await db.execute(
        select(ConfigEquipmentModel).where(ConfigEquipmentModel.config_id == config_id)
    )
    equipment_count = len(count_result.scalars().all())
    return _to_response({"config": config, "equipment_count": equipment_count})


@router.post("/configurations/{config_id}/unfreeze", response_model=ConfigResponse)
async def unfreeze_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Unfreeze a configuration — re-enables edits to master fields."""
    result = await db.execute(select(Configuration).where(Configuration.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    config.frozen_at = None
    await db.commit()
    await db.refresh(config)
    count_result = await db.execute(
        select(ConfigEquipmentModel).where(ConfigEquipmentModel.config_id == config_id)
    )
    equipment_count = len(count_result.scalars().all())
    return _to_response({"config": config, "equipment_count": equipment_count})


class AddEquipmentBody(BaseModel):
    lin_number: str
    equipment_id: str | None = None


@router.post("/configurations/{config_id}/equipment", status_code=204)
async def add_equipment(
    config_id: str,
    body: AddEquipmentBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await configuration_svc.add_equipment_to_config(
            db, config_id, body.lin_number, body.equipment_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/configurations/{config_id}/equipment/{lin_number}", status_code=204)
async def remove_equipment(
    config_id: str,
    lin_number: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await configuration_svc.remove_equipment_from_config(db, config_id, lin_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/configurations/{config_id}/equipment/{lin_number}")
async def update_config_equipment(
    config_id: str,
    lin_number: str,
    body: EquipmentFullUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    reason: str | None = Query(None, description="变更原因(可选)"),
):
    """Update equipment + config-equipment + weight + electrical in one call."""
    # Load the configuration to check freeze status
    config_result = await db.execute(
        select(Configuration).where(Configuration.id == config_id)
    )
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    # Load config_equipment record by (config_id, lin_number)
    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment),
        )
        .where(ConfigEquipmentModel.config_id == config_id, ConfigEquipmentModel.lin_number == lin_number)
    )
    ce = result.scalar_one_or_none()
    if not ce:
        raise HTTPException(status_code=404, detail="设备未在该构型中")

    equip = ce.equipment
    old_values: dict[str, object] = {}
    new_values: dict[str, object] = {}

    # Update equipment (master) fields
    if body.equipment:
        for field, value in body.equipment.model_dump(exclude_unset=True).items():
            if field == 'weight_balance':
                continue
            if not hasattr(equip, field):
                continue
            # Freeze enforcement: reject edits to master identity fields
            if config.frozen_at is not None and field in FROZEN_MASTER_FIELDS:
                raise HTTPException(
                    status_code=403,
                    detail=f"构型已冻结，不允许修改主数据字段: {field}",
                )
            old_val = getattr(equip, field)
            if old_val != value:
                old_values[f"equipment.{field}"] = _serialize(old_val)
                new_values[f"equipment.{field}"] = _serialize(value)
                setattr(equip, field, value)

    # Update config_equipment fields
    if body.config_equipment:
        for field, value in body.config_equipment.model_dump(exclude_unset=True).items():
            if not hasattr(ce, field):
                continue
            old_val = getattr(ce, field)
            if old_val != value:
                old_values[f"config_equipment.{field}"] = _serialize(old_val)
                new_values[f"config_equipment.{field}"] = _serialize(value)
                setattr(ce, field, value)

    # Audit log: only create if at least one field actually changed
    if old_values:
        audit = AuditLog(
            id=str(uuid.uuid4()),
            entity_type="config_equipment",
            entity_id=f"{config_id}:{lin_number}",
            action="update",
            old_value=old_values,
            new_value=new_values,
            user_id=str(user.id),
            reason=reason,
        )
        db.add(audit)

    await db.commit()
    return {"status": "ok"}


@router.get("/configurations/{config_a_id}/diff/{config_b_id}", response_model=ConfigDiffResponse)
async def diff_configurations(
    config_a_id: str,
    config_b_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return await configuration_svc.diff_configs(db, config_a_id, config_b_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
