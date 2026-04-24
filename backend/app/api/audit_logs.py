from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("")
async def list_audit_logs(
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc())
    count_query = select(func.count(AuditLog.id))

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
        count_query = count_query.where(AuditLog.entity_type == entity_type)

    if entity_id:
        query = query.where(AuditLog.entity_id == entity_id)
        count_query = count_query.where(AuditLog.entity_id == entity_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    logs = list(result.scalars().all())

    # Fetch usernames for all user_ids in results
    user_ids = list({log.user_id for log in logs})
    user_map: dict[str, str] = {}
    if user_ids:
        user_result = await db.execute(
            select(User.id, User.display_name).where(User.id.in_(user_ids))
        )
        for uid, display_name in user_result.all():
            user_map[uid] = display_name

    items = [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "user_name": user_map.get(log.user_id, "Unknown"),
            "reason": log.reason,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]

    return {"items": items, "total": total, "offset": offset, "limit": limit}
