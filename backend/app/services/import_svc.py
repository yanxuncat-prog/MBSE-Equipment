import uuid
from openpyxl import load_workbook
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Equipment, Installation, WeightBalance, ElectricalLoad


COLUMN_MAP = {
    "件号": "part_number",
    "名称": "name",
    "ATA章节": "ata_chapter",
    "类型": "equipment_type",
    "重量kg": "mass_kg",
    "STA": "sta",
    "WL": "wl",
    "BL": "bl",
    "区域ID": "zone_id",
    "母线ID": "bus_id",
    "功耗kVA": "power_kva_normal",
    "状态": "status",
    "描述": "description",
}

TYPE_MAP = {
    "LRU": "LRU",
    "SRU": "SRU",
    "结构件": "structural",
    "线缆": "cable",
}


async def import_from_excel(
    db: AsyncSession,
    file_path: str,
    zone_map: dict[str, str] | None = None,   # zone_code -> zone_id
    bus_map: dict[str, str] | None = None,     # bus_name -> bus_id
) -> dict:
    """Import equipment from Excel file. Returns summary with success_count, error_rows."""
    wb = load_workbook(file_path, read_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(min_row=1, values_only=True))
    if not rows:
        return {"success_count": 0, "error_rows": [], "total_rows": 0}

    headers = [str(h).strip() if h else "" for h in rows[0]]
    col_idx = {}
    for i, h in enumerate(headers):
        if h in COLUMN_MAP:
            col_idx[COLUMN_MAP[h]] = i

    success_count = 0
    error_rows = []

    for row_num, row in enumerate(rows[1:], start=2):
        try:
            def val(key):
                idx = col_idx.get(key)
                if idx is None or idx >= len(row):
                    return None
                return row[idx]

            part_number = str(val("part_number") or "").strip()
            if not part_number:
                error_rows.append({"row": row_num, "error": "件号为空"})
                continue

            name = str(val("name") or "").strip()
            ata = str(val("ata_chapter") or "").strip()
            etype_raw = str(val("equipment_type") or "LRU").strip()
            etype = TYPE_MAP.get(etype_raw, etype_raw)
            if etype not in ("LRU", "SRU", "structural", "cable"):
                etype = "LRU"
            status_val = str(val("status") or "approved").strip()
            if status_val not in ("in_development", "qualifying", "approved", "discontinued"):
                status_val = "approved"

            equip = Equipment(
                part_number=part_number,
                name=name,
                ata_chapter=ata,
                equipment_type=etype,
                status=status_val,
                description=str(val("description") or "").strip() or None,
            )
            db.add(equip)
            await db.flush()

            # Installation
            sta = val("sta")
            wl = val("wl")
            bl = val("bl")
            zone_raw = str(val("zone_id") or "").strip()
            zone_uuid = None
            if zone_raw and zone_map and zone_raw in zone_map:
                zone_uuid = uuid.UUID(zone_map[zone_raw])
            elif zone_raw:
                try:
                    zone_uuid = uuid.UUID(zone_raw)
                except ValueError:
                    pass

            if sta is not None or zone_uuid is not None:
                inst = Installation(
                    equipment_id=equip.id,
                    zone_id=zone_uuid,
                    sta=float(sta) if sta is not None else None,
                    wl=float(wl) if wl is not None else None,
                    bl=float(bl) if bl is not None else None,
                )
                db.add(inst)

            # Weight Balance
            mass = val("mass_kg")
            if mass is not None:
                wb_obj = WeightBalance(
                    equipment_id=equip.id,
                    mass_kg=float(mass),
                    arm_sta=float(sta) if sta is not None else 0.0,
                    arm_bl=float(bl) if bl is not None else 0.0,
                    arm_wl=float(wl) if wl is not None else 0.0,
                )
                db.add(wb_obj)

            # Electrical Load
            power = val("power_kva_normal")
            bus_raw = str(val("bus_id") or "").strip()
            bus_uuid = None
            if bus_raw and bus_map and bus_raw in bus_map:
                bus_uuid = uuid.UUID(bus_map[bus_raw])
            elif bus_raw:
                try:
                    bus_uuid = uuid.UUID(bus_raw)
                except ValueError:
                    pass

            if power is not None and bus_uuid is not None:
                el = ElectricalLoad(
                    equipment_id=equip.id,
                    bus_id=bus_uuid,
                    power_kva_normal=float(power),
                )
                db.add(el)

            success_count += 1

        except Exception as exc:
            error_rows.append({"row": row_num, "error": str(exc)})

    await db.commit()
    wb.close()

    return {
        "success_count": success_count,
        "error_rows": error_rows,
        "total_rows": len(rows) - 1,
    }
