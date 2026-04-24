from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import openpyxl
from io import BytesIO
from datetime import date

from app.database import get_db
from app.models import Equipment, Configuration
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["excel"])

EXPORT_COLUMNS = [
    ("设备名称", "equipment", "name"),
    ("件号", "equipment", "part_number"),
    ("ATA章节", "equipment", "ata_chapter"),
    ("LIN号", "config_equipment", "lin_number"),
    ("类型", "equipment", "equipment_type"),
    ("状态", "config_equipment", "equipment_status"),
    ("描述", "equipment", "description"),
    ("是否电设备", "equipment", "is_electrical"),
    ("一级用电设备", "equipment", "is_primary_electrical"),
    ("是否有EICD", "equipment", "has_eicd"),
    ("负责人", "config_equipment", "responsible_person"),
    ("设备等级", "config_equipment", "equipment_level"),
    ("是否选装", "config_equipment", "is_optional"),
    ("特殊布线", "config_equipment", "has_special_wiring"),
    ("内部编号", "config_equipment", "internal_number"),
    ("重量(kg)", "config_equipment", "mass_kg"),
    ("重心X(mm)", "config_equipment", "cg_x"),
    ("重心Y(mm)", "config_equipment", "cg_y"),
    ("重心Z(mm)", "config_equipment", "cg_z"),
    ("重量指标(kg)", "config_equipment", "weight_target_kg"),
    ("STA(mm)", "config_equipment", "sta"),
    ("BL(mm)", "config_equipment", "bl"),
    ("WL(mm)", "config_equipment", "wl"),
    ("尺寸(mm)", "equipment", "dimensions_mm"),
    ("安装方式", "config_equipment", "install_method"),
    ("搭接方式", "config_equipment", "bonding_method"),
    ("搭接类型", "config_equipment", "bonding_type"),
    ("搭接阻值(mΩ)", "config_equipment", "bonding_resistance"),
    ("搭接位置", "config_equipment", "bonding_position"),
    ("PACE图纸", "config_equipment", "in_pace_drawing"),
    ("布置调整需求", "config_equipment", "layout_adjustment"),
    ("供电电压", "equipment", "power_voltage"),
    ("供电余度", "equipment", "power_redundancy"),
    ("用电功率", "equipment", "power_watts"),
    ("正常功耗(kW)", "config_equipment", "power_kva_normal"),
    ("应急功耗(kW)", "config_equipment", "power_kva_emergency"),
    ("峰值功耗(kW)", "config_equipment", "power_kva_max"),
    ("备注", "equipment", "notes"),
]


@router.get("/export/equipment")
async def export_equipment(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    config = await db.get(Configuration, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment),
        )
        .where(ConfigEquipmentModel.config_id == config_id)
        .order_by(ConfigEquipmentModel.equipment_id)
    )
    ce_list = list(result.scalars().unique().all())

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "设备清单"

    # Header row with bold font
    from openpyxl.styles import Font
    bold = Font(bold=True)
    for col_idx, (col_name, _, _) in enumerate(EXPORT_COLUMNS, 1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = bold

    # Data rows
    for row_idx, ce in enumerate(ce_list, 2):
        e = ce.equipment
        for col_idx, (_, source, field) in enumerate(EXPORT_COLUMNS, 1):
            if source == "equipment":
                val = getattr(e, field, None)
            elif source == "config_equipment":
                val = getattr(ce, field, None)
            elif source == "weight_balance":
                val = getattr(e.weight_balance, field, None) if e.weight_balance else None
            elif source == "electrical_load":
                val = getattr(e.electrical_load, field, None) if e.electrical_load else None
            else:
                val = None
            if val is True:
                val = "是"
            elif val is False:
                val = "否"
            ws.cell(row=row_idx, column=col_idx, value=val)

    # Auto-fit column widths (approximate)
    for col_idx, (col_name, _, _) in enumerate(EXPORT_COLUMNS, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = max(len(col_name) * 2 + 4, 12)

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)

    filename = f"{config.version}_设备清单_{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
