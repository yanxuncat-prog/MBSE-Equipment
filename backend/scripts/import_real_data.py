"""Import real CE-25A equipment data from Excel files into AeroEquip platform."""
import asyncio
import re
import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import openpyxl
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, async_session_factory, Base
from app.models import (
    User, Program, Series, Configuration, Equipment, Installation,
    WeightBalance, ElectricalLoad, Zone, BusDefinition, Supplier,
    AuditLog, config_equipment,
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Try multiple paths: container mount or relative
_candidates = [
    "/app/EXCEL数据",
    os.path.join(os.path.dirname(__file__), "..", "..", "EXCEL数据"),
    os.path.join(os.path.dirname(__file__), "..", "EXCEL数据"),
]
DATA_DIR = next((p for p in _candidates if os.path.isdir(p)), _candidates[0])
print(f"Data directory: {DATA_DIR}")

# Zone mapping: 安装区域文本 → zone_code + zone_name
ZONE_MAPPING = {
    "机头": ("100", "机头段"),
    "驾驶舱": ("110", "驾驶舱"),
    "下机身前段": ("120", "下机身前段"),
    "右侧前机身": ("130", "右侧前机身"),
    "左侧前机身": ("130", "左侧前机身"),
    "客舱": ("140", "客舱段"),
    "下机身后段": ("150", "下机身后段"),
    "机翼": ("200", "机翼段"),
    "短舱": ("300", "短舱/发动机"),
    "尾段": ("400", "尾段"),
    "设备架": ("110", "驾驶舱"),
}

# ATA chapter cleanup: "EATA23 通信系统" → "23"
def clean_ata(raw: str) -> str:
    if not raw:
        return "99"
    raw = str(raw).strip()
    m = re.search(r'ATA(\d{2})', raw, re.IGNORECASE)
    if m:
        return m.group(1)
    m = re.match(r'(\d{2})', raw)
    if m:
        return m.group(1)
    return raw[:2] if len(raw) >= 2 else "99"


def get_zone_code(area_text: str) -> tuple[str, str, str]:
    """Returns (zone_code, zone_name, rack_position)."""
    if not area_text:
        return ("999", "未知", "")
    area = str(area_text).strip()
    parts = area.split("-", 1)
    prefix = parts[0]
    detail = parts[1] if len(parts) > 1 else ""

    for key, (code, name) in ZONE_MAPPING.items():
        if key in prefix:
            return (code, name, detail)
    return ("999", "未知", area)


async def reset_and_init(db: AsyncSession):
    """Drop all data and recreate."""
    print("Resetting database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables recreated.")


async def create_base_data(db: AsyncSession) -> dict:
    """Create users, program, series, zones, buses. Returns lookup dicts."""
    # Users
    admin = User(username="admin", hashed_password=pwd_context.hash("admin123"),
                 display_name="系统管理员", role="admin")
    engineer = User(username="engineer", hashed_password=pwd_context.hash("eng123"),
                    display_name="设备工程师", role="engineer")
    db.add_all([admin, engineer])
    await db.flush()

    # Program + Series
    program = Program(name="CE-25A", aircraft_type="大型宽体客机",
                      description="CE-25A电动飞机设备管理")
    db.add(program)
    await db.flush()

    series = Series(program_id=program.id, variant_name="基本型",
                    description="CE-25A基本型")
    db.add(series)
    await db.flush()

    # Zones (based on real area data)
    zone_map = {}  # zone_code → Zone object
    zones_def = [
        ("100", "机头段", 0, 120, 100, 250),
        ("110", "驾驶舱", 120, 350, 150, 280),
        ("120", "下机身前段", 120, 500, 50, 150),
        ("130", "前机身侧面", 350, 500, 100, 280),
        ("140", "客舱段", 350, 800, 150, 300),
        ("150", "下机身后段", 500, 850, 50, 150),
        ("200", "机翼段", 400, 700, 80, 200),
        ("300", "短舱/发动机", 350, 650, 50, 180),
        ("400", "尾段", 850, 1100, 100, 280),
        ("999", "未知", 0, 1100, 0, 300),
    ]
    for code, name, sf, st, wf, wt in zones_def:
        z = Zone(series_id=series.id, zone_code=code, name=name,
                 sta_from=sf, sta_to=st, wl_from=wf, wl_to=wt)
        db.add(z)
        await db.flush()
        zone_map[code] = z

    # Bus definitions (CE-25A electric aircraft)
    bus_map = {}
    buses_def = [
        ("AC BUS 1", "AC", 30.0),
        ("AC BUS 2", "AC", 30.0),
        ("DC BUS 1", "DC", 15.0),
        ("DC BUS 2", "DC", 15.0),
        ("DC ESS", "DC", 8.0),
        ("HOT BAT BUS", "DC", 5.0),
    ]
    for bname, btype, cap in buses_def:
        b = BusDefinition(series_id=series.id, bus_name=bname,
                          bus_type=btype, rated_capacity_kva=cap)
        db.add(b)
        await db.flush()
        bus_map[bname] = b

    await db.commit()
    return {
        "admin": admin, "engineer": engineer,
        "program": program, "series": series,
        "zone_map": zone_map, "bus_map": bus_map,
    }


async def import_main_list(db: AsyncSession, base: dict) -> dict:
    """Import from 机载系统设备清单_2026.0415.xlsx — 1&2号构型 sheet."""
    filepath = os.path.join(DATA_DIR, "机载系统设备清单_2026.0415.xlsx")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return {}

    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    zone_map = base["zone_map"]
    equip_by_number = {}  # part_number → Equipment

    # Column index mapping per sheet (X号构型 has extra col at index 7)
    # 1&2号: weight=11, area=5, is_electric=13
    # X号:   weight=12, area=5, is_electric=14 (shifted by 1 after col 7)
    COL_MAP = {
        0: {"weight": 11, "area": 5, "is_electric": 13},  # 1&2号构型
        1: {"weight": 12, "area": 5, "is_electric": 14},  # X号构型
    }

    for sheet_idx, sheet_name, config_name in [(0, "1&2号构型", "1/2号机"), (1, "X号构型", "X号机")]:
        ws = wb[wb.sheetnames[sheet_idx]]
        rows = list(ws.iter_rows(min_row=2, values_only=True))
        cols = COL_MAP[sheet_idx]
        print(f"\nImporting {sheet_name}: {len(rows)} rows (weight col={cols['weight']})")

        success = 0
        skipped = 0
        for row in rows:
            name = str(row[1] or "").strip()
            if not name:
                skipped += 1
                continue

            part_number = str(row[2] or "").strip()
            if not part_number:
                part_number = str(row[3] or "").strip()
            if not part_number:
                part_number = f"UNNAMED-{uuid.uuid4().hex[:8]}"

            # If already imported, try to supplement missing weight data
            if part_number in equip_by_number:
                existing = equip_by_number[part_number]
                weight = row[cols["weight"]]
                if weight is not None and isinstance(weight, (int, float)):
                    # Check if existing has no weight — supplement it
                    from sqlalchemy import select as sel
                    wb_check = await db.execute(sel(WeightBalance).where(WeightBalance.equipment_id == existing.id))
                    if wb_check.scalar_one_or_none() is None:
                        try:
                            zone_obj = zone_map.get(get_zone_code(str(row[5] or "").strip())[0], zone_map.get("999"))
                            approx_sta = (zone_obj.sta_from + zone_obj.sta_to) / 2 if zone_obj else 500
                            wb_new = WeightBalance(equipment_id=existing.id, mass_kg=float(weight), arm_sta=approx_sta)
                            db.add(wb_new)
                            await db.flush()
                        except Exception:
                            pass
                success += 1
                continue

            ata = clean_ata(str(row[0] or ""))
            area = str(row[cols["area"]] or "").strip()
            zone_code, zone_name, rack_pos = get_zone_code(area)
            weight = row[cols["weight"]]
            is_electric = str(row[cols["is_electric"]] or "").strip()

            equip = Equipment(
                part_number=part_number,
                name=name,
                ata_chapter=ata,
                equipment_type="LRU" if is_electric == "是" else "structural",
                status="approved",
                description=f"区域: {area}" if area else None,
            )
            db.add(equip)
            try:
                await db.flush()
            except Exception as e:
                await db.rollback()
                skipped += 1
                continue

            # Installation
            zone_obj = zone_map.get(zone_code, zone_map.get("999"))
            # Approximate STA based on zone
            approx_sta = (zone_obj.sta_from + zone_obj.sta_to) / 2 if zone_obj else 500
            approx_wl = (zone_obj.wl_from + zone_obj.wl_to) / 2 if zone_obj else 180
            # Add some spread within zone
            import random
            sta_offset = random.uniform(-50, 50)
            wl_offset = random.uniform(-20, 20)

            inst = Installation(
                equipment_id=equip.id,
                zone_id=zone_obj.id if zone_obj else None,
                sta=approx_sta + sta_offset,
                wl=approx_wl + wl_offset,
                bl=random.uniform(-30, 30),
                rack_position=rack_pos if rack_pos else None,
            )
            db.add(inst)

            # Weight (skip #N/A, strings, etc.)
            if weight is not None and isinstance(weight, (int, float)):
                try:
                    mass = float(weight)
                    if mass > 0:
                        wb_obj = WeightBalance(
                            equipment_id=equip.id,
                            mass_kg=mass,
                            arm_sta=approx_sta + sta_offset,
                        )
                        db.add(wb_obj)
                except (ValueError, TypeError):
                    pass

            equip_by_number[part_number] = equip
            success += 1

        await db.commit()
        print(f"  Imported: {success}, Skipped: {skipped}")

    wb.close()
    return equip_by_number


async def import_supplier_info(db: AsyncSession, equip_map: dict, base: dict):
    """Supplement supplier data from 0号机 ATA sheet."""
    filepath = os.path.join(DATA_DIR, "CE-25A 0号机_2026-04-21.xlsx")
    if not os.path.exists(filepath):
        print("0号机 file not found, skipping supplier import")
        return

    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]  # ATA章节设备表
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    print(f"\nImporting supplier info from 0号机: {len(rows)} rows")

    # Collect unique suppliers
    supplier_cache = {}  # name → Supplier object
    updated = 0

    for row in rows:
        doors_number = str(row[1] or "").strip()  # DOORS编号
        supplier_name = str(row[7] or "").strip()

        if not doors_number or not supplier_name or supplier_name == "TBD":
            continue

        # Find matching equipment by DOORS number
        equip = equip_map.get(doors_number)
        if not equip:
            continue

        # Create or get supplier
        if supplier_name not in supplier_cache:
            s = Supplier(name=supplier_name)
            db.add(s)
            await db.flush()
            supplier_cache[supplier_name] = s

        equip.supplier_id = supplier_cache[supplier_name].id
        updated += 1

    await db.commit()
    print(f"  Suppliers created: {len(supplier_cache)}, Equipment updated: {updated}")
    wb.close()


async def create_configurations(db: AsyncSession, equip_map: dict, base: dict):
    """Create configurations and assign equipment."""
    series = base["series"]
    admin = base["admin"]

    # Load all equipment
    result = await db.execute(select(Equipment))
    all_equip = result.scalars().all()
    print(f"\nTotal equipment in DB: {len(all_equip)}")

    # Read which equipment belongs to which config from the source files
    # For now, create 3 configs with all equipment, then remove some from X号
    configs_to_create = [
        ("V1.0-基线", "baseline", "1/2号机基线构型"),
        ("V1.1-0号机", "draft", "0号机构型（首飞）"),
        ("V2.0-X号机", "draft", "X号机构型"),
    ]

    for version, status, desc in configs_to_create:
        config = Configuration(
            series_id=series.id,
            version=version,
            status=status,
            description=desc,
            created_by=admin.id,
        )
        db.add(config)
        await db.flush()

        for equip in all_equip:
            await db.execute(
                config_equipment.insert().values(config_id=config.id, equipment_id=equip.id)
            )
        print(f"  Config '{version}' ({status}): {len(all_equip)} equipment")

    await db.commit()


async def main():
    print("=" * 60)
    print("AeroEquip — Real CE-25A Data Import")
    print("=" * 60)

    await reset_and_init(None)

    async with async_session_factory() as db:
        base = await create_base_data(db)
        equip_map = await import_main_list(db, base)
        await import_supplier_info(db, equip_map, base)
        await create_configurations(db, equip_map, base)

    # Final stats
    async with async_session_factory() as db:
        equip_count = (await db.execute(select(Equipment))).scalars().all()
        wb_count = (await db.execute(select(WeightBalance))).scalars().all()
        inst_count = (await db.execute(select(Installation))).scalars().all()
        sup_count = (await db.execute(select(Supplier))).scalars().all()
        config_count = (await db.execute(select(Configuration))).scalars().all()
        zone_count = (await db.execute(select(Zone))).scalars().all()

    print("\n" + "=" * 60)
    print("Import Complete!")
    print(f"  设备: {len(equip_count)}")
    print(f"  安装位置: {len(inst_count)}")
    print(f"  重量数据: {len(wb_count)}")
    print(f"  供应商: {len(sup_count)}")
    print(f"  区域: {len(zone_count)}")
    print(f"  构型: {len(config_count)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
