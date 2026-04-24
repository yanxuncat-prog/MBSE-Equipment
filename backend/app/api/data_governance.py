from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/data-governance", tags=["data-governance"])

TABLE_DISPLAY = {
    "equipment": "设备主表",
    "config_equipment": "构型设备关联",
    "electrical_details": "负载电气特性",
    "flight_phases": "飞行阶段定义",
    "load_work_modes": "负载工作模式",
    "configurations": "构型",
    "programs": "型号",
    "users": "用户",
}


@router.get("/tables")
async def get_tables(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tables_to_show = [
        "equipment", "config_equipment",
        "load_work_modes",
    ]

    result = []
    for table in tables_to_show:
        # Get row count for this config
        if table == "equipment":
            count_q = text(
                "SELECT COUNT(*) FROM config_equipment ce "
                "JOIN equipment e ON e.id = ce.equipment_id "
                "WHERE ce.config_id = :cid"
            )
        elif table in ("electrical_details", "flight_phases", "load_work_modes"):
            count_q = text(f"SELECT COUNT(*) FROM {table} WHERE config_id = :cid")
        elif table == "config_equipment":
            count_q = text(f"SELECT COUNT(*) FROM {table} WHERE config_id = :cid")
            count_q = text(
                f"SELECT COUNT(*) FROM {table} t "
                "JOIN config_equipment ce ON ce.equipment_id = t.equipment_id "
                "WHERE ce.config_id = :cid"
            )
        else:
            count_q = text(f"SELECT COUNT(*) FROM {table}")

        row_count = (await db.execute(count_q, {"cid": config_id})).scalar() or 0

        # Get column info
        col_q = text(f"PRAGMA table_info({table})")
        cols_result = await db.execute(col_q)
        columns = []
        for col in cols_result:
            columns.append({
                "name": col[1],
                "type": col[2] or "TEXT",
                "nullable": not col[3],
            })

        result.append({
            "table_name": table,
            "display_name": TABLE_DISPLAY.get(table, table),
            "row_count": row_count,
            "column_count": len(columns),
            "columns": columns,
        })

    return result
