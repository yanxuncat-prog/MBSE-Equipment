"""Configuration platform (CATIA) integration stubs — to be implemented after intranet deployment."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["config-platform"])

class FetchModelsRequest(BaseModel):
    equipment_ids: list[str]

@router.get("/config-platform/status")
async def platform_status(user: User = Depends(get_current_user)):
    return {"connected": False, "message": "待内网部署后对接配置平台(CATIA)"}

@router.post("/config-platform/fetch-models")
async def fetch_models(body: FetchModelsRequest, user: User = Depends(get_current_user)):
    return {
        "status": "not_available",
        "message": "外网环境无法连接配置平台，请在内网环境使用此功能",
        "requested_count": len(body.equipment_ids),
    }
