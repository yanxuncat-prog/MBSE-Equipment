import uuid
from io import BytesIO
from typing import Any

import openpyxl
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Equipment, Configuration
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.models.user import User
from app.api.deps import get_current_user
from app.api.excel_export import EXPORT_COLUMNS

router = APIRouter(tags=["excel"])

# In-memory cache for preview sessions
_preview_store: dict[str, dict[str, Any]] = {}

# Boolean columns that use "是"/"否" in Excel
BOOL_FIELDS = {
    "is_electrical", "is_primary_electrical", "has_eicd",
    "in_pace_drawing", "is_optional", "has_special_wiring",
}

# Float fields that should be converted from string/int
FLOAT_FIELDS = {
    "mass_kg", "sta", "bl", "wl",
    "cg_x", "cg_y", "cg_z", "weight_target_kg",
    "power_kva_normal", "power_kva_emergency", "power_kva_max",
}


def _normalize_value(field: str, raw_value: Any) -> Any:
    """Convert an Excel cell value to the expected Python type."""
    if raw_value is None:
        return None
    if field in BOOL_FIELDS:
        if isinstance(raw_value, bool):
            return raw_value
        s = str(raw_value).strip()
        if s == "是":
            return True
        elif s == "否":
            return False
        return None
    if field in FLOAT_FIELDS:
        if raw_value == "" or raw_value is None:
            return None
        try:
            return float(raw_value)
        except (ValueError, TypeError):
            return None
    # String fields
    if isinstance(raw_value, (int, float)):
        # Avoid trailing .0 for ints stored as float in Excel
        if isinstance(raw_value, float) and raw_value == int(raw_value):
            return str(int(raw_value))
        return str(raw_value)
    if isinstance(raw_value, str):
        return raw_value.strip() if raw_value.strip() else None
    return str(raw_value)


def _get_current_value(source: str, field: str, equipment: Equipment,
                       config_equip: ConfigEquipmentModel) -> Any:
    """Get the current value of a field from the database objects."""
    if source == "equipment":
        return getattr(equipment, field, None)
    elif source == "config_equipment":
        return getattr(config_equip, field, None)
    elif source == "electrical_load":
        el = equipment.electrical_load
        return getattr(el, field, None) if el else None
    return None


def _display_value(val: Any) -> Any:
    """Convert a value to a display-friendly format for the diff."""
    if val is True:
        return "是"
    elif val is False:
        return "否"
    return val


def _parse_excel(file_bytes: bytes) -> list[dict[str, Any]]:
    """Parse an uploaded Excel file into a list of row dicts keyed by field tuples."""
    wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active

    # Read header row to map column indices to EXPORT_COLUMNS entries
    header_row = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]

    col_map: dict[int, tuple[str, str, str]] = {}
    for idx, header in enumerate(header_row):
        if header is None:
            continue
        header_str = str(header).strip()
        for col_name, source, field in EXPORT_COLUMNS:
            if col_name == header_str:
                col_map[idx] = (col_name, source, field)
                break

    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        # Find the name column value
        name_value = None
        row_data: dict[str, dict[str, Any]] = {}
        for idx, cell_value in enumerate(row):
            if idx not in col_map:
                continue
            col_name, source, field = col_map[idx]
            normalized = _normalize_value(field, cell_value)
            if field == "name" and source == "equipment":
                name_value = normalized
            row_data[f"{source}.{field}"] = {
                "col_name": col_name,
                "source": source,
                "field": field,
                "value": normalized,
            }

        if name_value:
            rows.append({"name": name_value, "fields": row_data})

    wb.close()
    return rows


class PreviewResponse(BaseModel):
    preview_id: str
    added: list[str]
    modified: list[dict[str, Any]]
    unchanged_count: int


class ApplyRequest(BaseModel):
    preview_id: str


class ApplyResponse(BaseModel):
    success_count: int
    error_count: int
    errors: list[str]


@router.post("/configurations/{config_id}/import-preview", response_model=PreviewResponse)
async def import_preview(
    config_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload an Excel file and preview changes (diff) before applying."""
    # Validate config exists
    config = await db.get(Configuration, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    # Validate file type
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="仅支持 .xlsx 格式文件")

    # Read and parse the Excel file
    file_bytes = await file.read()
    try:
        parsed_rows = _parse_excel(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel 解析失败: {str(e)}")

    if not parsed_rows:
        raise HTTPException(status_code=400, detail="Excel 文件中未找到有效数据行")

    # Load current equipment in this config
    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.electrical_load),
        )
        .where(ConfigEquipmentModel.config_id == config_id)
        .order_by(ConfigEquipmentModel.lin_number)
    )
    ce_list = list(result.scalars().unique().all())

    # Build lookup by equipment name
    existing_by_name: dict[str, ConfigEquipmentModel] = {}
    for ce in ce_list:
        existing_by_name[ce.equipment.name] = ce

    # Compare
    added: list[str] = []
    modified: list[dict[str, Any]] = []
    unchanged_count = 0

    # Store parsed data for apply phase
    added_rows: list[dict] = []
    modified_rows: list[dict] = []

    for row in parsed_rows:
        name = row["name"]
        if name not in existing_by_name:
            added.append(name)
            added_rows.append(row)
        else:
            ce = existing_by_name[name]
            equipment = ce.equipment
            changes: dict[str, dict[str, Any]] = {}

            for key, field_info in row["fields"].items():
                source = field_info["source"]
                field = field_info["field"]
                col_name = field_info["col_name"]
                new_val = field_info["value"]

                if field == "name" and source == "equipment":
                    continue  # Skip the name itself, it's the match key

                current_val = _get_current_value(source, field, equipment, ce)

                # Normalize for comparison
                # Convert both to comparable types
                cmp_new = new_val
                cmp_old = current_val

                # For float fields, compare numerically
                if field in FLOAT_FIELDS:
                    try:
                        cmp_new = float(new_val) if new_val is not None else None
                    except (ValueError, TypeError):
                        cmp_new = None
                    try:
                        cmp_old = float(current_val) if current_val is not None else None
                    except (ValueError, TypeError):
                        cmp_old = None

                # For string comparisons, normalize empty to None
                if isinstance(cmp_old, str) and not cmp_old.strip():
                    cmp_old = None
                if isinstance(cmp_new, str) and not cmp_new.strip():
                    cmp_new = None

                if cmp_new != cmp_old:
                    changes[col_name] = {
                        "old": _display_value(current_val),
                        "new": _display_value(new_val),
                    }

            if changes:
                modified.append({"name": name, "changes": changes})
                modified_rows.append({"name": name, "row": row})
            else:
                unchanged_count += 1

    # Store preview data
    preview_id = str(uuid.uuid4())
    _preview_store[preview_id] = {
        "config_id": config_id,
        "added_rows": added_rows,
        "modified_rows": modified_rows,
        "user_id": user.id,
    }

    return PreviewResponse(
        preview_id=preview_id,
        added=added,
        modified=modified,
        unchanged_count=unchanged_count,
    )


@router.post("/configurations/{config_id}/import-apply", response_model=ApplyResponse)
async def import_apply(
    config_id: str,
    body: ApplyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Apply the previously previewed import changes."""
    preview = _preview_store.pop(body.preview_id, None)
    if preview is None:
        raise HTTPException(status_code=404, detail="预览会话不存在或已过期")

    if preview["config_id"] != config_id:
        raise HTTPException(status_code=400, detail="构型ID与预览会话不匹配")

    config = await db.get(Configuration, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    # Reload existing equipment for modification
    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.electrical_load),
        )
        .where(ConfigEquipmentModel.config_id == config_id)
    )
    ce_list = list(result.scalars().unique().all())
    existing_by_name: dict[str, ConfigEquipmentModel] = {}
    for ce in ce_list:
        existing_by_name[ce.equipment.name] = ce

    success_count = 0
    error_count = 0
    errors: list[str] = []

    # Process added equipment
    for row in preview["added_rows"]:
        try:
            name = row["name"]
            equip_fields: dict[str, Any] = {}
            ce_fields: dict[str, Any] = {}
            el_fields: dict[str, Any] = {}

            for key, field_info in row["fields"].items():
                source = field_info["source"]
                field = field_info["field"]
                value = field_info["value"]
                if value is None:
                    continue
                if source == "equipment":
                    equip_fields[field] = value
                elif source == "config_equipment":
                    ce_fields[field] = value
                elif source == "electrical_load":
                    el_fields[field] = value

            # Create equipment with required defaults
            equipment_id = str(uuid.uuid4())
            new_equip = Equipment(
                id=equipment_id,
                name=equip_fields.get("name", name),
                part_number=equip_fields.get("part_number", f"AUTO-{uuid.uuid4().hex[:8].upper()}"),
                ata_chapter=equip_fields.get("ata_chapter", "00"),
                equipment_type=equip_fields.get("equipment_type", "LRU"),
                **{k: v for k, v in equip_fields.items()
                   if k not in ("name", "part_number", "ata_chapter", "equipment_type")},
            )
            db.add(new_equip)

            # Create config_equipment link (lin_number is PK, auto-generate if missing)
            if "lin_number" not in ce_fields or not ce_fields["lin_number"]:
                ce_fields["lin_number"] = f"AUTO-{uuid.uuid4().hex[:8].upper()}"
            new_ce = ConfigEquipmentModel(
                config_id=config_id,
                lin_number=ce_fields.pop("lin_number"),
                equipment_id=equipment_id,
                **ce_fields,
            )
            db.add(new_ce)

            # Create electrical_load if any fields (backward compat)
            if el_fields:
                # Also sync to ConfigEquipment
                for pf in ("power_kva_normal", "power_kva_emergency", "power_kva_max"):
                    if pf in el_fields and el_fields[pf] is not None:
                        setattr(new_ce, pf, el_fields[pf])

            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append(f"添加设备 '{row['name']}' 失败: {str(e)}")

    # Process modified equipment
    for mod in preview["modified_rows"]:
        try:
            name = mod["name"]
            row = mod["row"]
            ce = existing_by_name.get(name)
            if ce is None:
                error_count += 1
                errors.append(f"设备 '{name}' 已不存在于当前构型中")
                continue

            equipment = ce.equipment

            for key, field_info in row["fields"].items():
                source = field_info["source"]
                field = field_info["field"]
                value = field_info["value"]

                if field == "name" and source == "equipment":
                    continue

                if source == "equipment":
                    setattr(equipment, field, value)
                elif source == "config_equipment":
                    setattr(ce, field, value)
                elif source == "electrical_load":
                    if field in ("power_kva_normal", "power_kva_emergency", "power_kva_max"):
                        setattr(ce, field, value)

            success_count += 1
        except Exception as e:
            error_count += 1
            errors.append(f"更新设备 '{mod['name']}' 失败: {str(e)}")

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"数据库提交失败: {str(e)}")

    return ApplyResponse(
        success_count=success_count,
        error_count=error_count,
        errors=errors,
    )
