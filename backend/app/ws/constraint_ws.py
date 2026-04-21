import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.services import constraint_svc

router = APIRouter()

# Simple in-memory connection manager
_connections: dict[str, list[WebSocket]] = {}


async def broadcast_to_config(config_id: str, data: dict):
    """Broadcast validation results to all WebSocket clients watching a config."""
    conns = _connections.get(config_id, [])
    dead = []
    for ws in conns:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        conns.remove(ws)


@router.websocket("/ws/constraints/{config_id}")
async def constraint_websocket(websocket: WebSocket, config_id: str):
    await websocket.accept()

    if config_id not in _connections:
        _connections[config_id] = []
    _connections[config_id].append(websocket)

    try:
        # Send initial validation on connect
        async with async_session_factory() as db:
            report = await constraint_svc.validate_config(db, config_id)
            await websocket.send_json(report.model_dump())

        # Keep connection alive, listen for trigger messages
        while True:
            data = await websocket.receive_text()
            # Client can send "refresh" to trigger re-validation
            if data.strip() == "refresh":
                async with async_session_factory() as db:
                    report = await constraint_svc.validate_config(db, config_id)
                    await broadcast_to_config(config_id, report.model_dump())
    except WebSocketDisconnect:
        _connections.get(config_id, []).remove(websocket) if websocket in _connections.get(config_id, []) else None
