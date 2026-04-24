"""EICD platform integration — currently independent, sync planned for future."""
from fastapi import APIRouter, Depends
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["eicd"])

@router.get("/eicd/status")
async def eicd_status(user: User = Depends(get_current_user)):
    return {
        "status": "independent",
        "message": "EICD平台独立管理连接器和针孔关系。当前与设备管理平台断开联动，各自独立管理。后续再考虑数据同步机制。",
    }
