from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.configuration import ConfigCreate, ConfigResponse, ConfigDiffResponse
from app.services import configuration_svc

router = APIRouter(tags=["configurations"])


def _to_response(data: dict) -> ConfigResponse:
    """Convert service result dict to ConfigResponse."""
    config = data["config"]
    return ConfigResponse(
        id=str(config.id),
        series_id=str(config.series_id),
        version=config.version,
        status=config.status,
        description=config.description,
        created_by=str(config.created_by) if config.created_by else None,
        locked_at=config.locked_at.isoformat() if config.locked_at else None,
        created_at=config.created_at.isoformat(),
        equipment_count=data["equipment_count"],
    )


class CloneBody(BaseModel):
    version: str


@router.get("/configurations", response_model=list[ConfigResponse])
async def list_configurations(
    series_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    results = await configuration_svc.list_configs(db, series_id)
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


@router.post("/configurations/{config_id}/equipment/{equipment_id}", status_code=204)
async def add_equipment(
    config_id: str,
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await configuration_svc.add_equipment_to_config(db, config_id, equipment_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/configurations/{config_id}/equipment/{equipment_id}", status_code=204)
async def remove_equipment(
    config_id: str,
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await configuration_svc.remove_equipment_from_config(db, config_id, equipment_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
