"""
Migrate equipment data from two SQLite databases into PostgreSQL as independent sets.

Each configuration gets its own independent equipment records — no deduplication.
  - equipment_X号构型.db    → CE-25A X构型 (独立设备集)
  - equipment_1&2号构型.db  → CE-25A 1&2构型 (独立设备集)
"""

import sqlite3
import uuid
import re
import psycopg2
from psycopg2.extras import execute_values

PG_DSN = "dbname=aeroequip user=aeroequip password=devpassword host=localhost port=5432"
SQLITE_X = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_X号构型.db"
SQLITE_12 = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_1&2号构型.db"
ADMIN_USER_ID = "f9faf4bc-e92f-459d-b476-f39d1676b984"


def sqlite_rows(db_path, sql):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(sql).fetchall()
    conn.close()
    return rows


def safe_get(row, key, default=None):
    try:
        return row[key]
    except (IndexError, KeyError):
        return default


def parse_bool(val):
    if val is None:
        return None
    s = str(val).strip()
    if s in ("是", "有", "1", "true", "True", "yes"):
        return True
    if s in ("否", "无", "0", "false", "False", "no", ""):
        return False
    return None


def parse_float(val):
    if val is None:
        return None
    s = str(val).strip()
    if s in ("", "/", "-", "TBD", "—", "N/A"):
        return None
    s = s.replace(",", "")
    m = re.match(r"[-+]?\d*\.?\d+", s)
    return float(m.group()) if m else None


def extract_ata(chapter_str):
    if not chapter_str:
        return "00"
    m = re.search(r"(\d{2})", chapter_str)
    return m.group(1) if m else "00"


def import_one_config(cur, config_id, db_path, label, part_prefix):
    """Import one SQLite database as an independent equipment set for a configuration."""
    rows = sqlite_rows(db_path, "SELECT * FROM 设备")
    loads = sqlite_rows(db_path, "SELECT * FROM 负载电气特性")

    print(f"   [{label}] {len(rows)} equipment, {len(loads)} electrical loads")

    # Build load lookup by 设备名称
    load_by_name = {}
    for row in loads:
        name = safe_get(row, "设备名称")
        if name and name.strip():
            load_by_name[name.strip()] = row

    part_number_seen = set()
    tbd_counter = 0
    equip_inserted = 0
    weight_inserted = 0
    load_inserted = 0

    for row in rows:
        name = safe_get(row, "设备名称")
        if not name or not name.strip():
            continue
        name = name.strip()

        eid = str(uuid.uuid4())

        # Generate unique part number
        raw_pn = safe_get(row, "设备编号", "")
        if raw_pn and raw_pn.strip() and raw_pn.strip() != "TBD":
            pn = raw_pn.strip()
            # Prefix to ensure uniqueness across configs
            pn_candidate = f"{part_prefix}-{pn}"
            if pn_candidate in part_number_seen:
                suffix = 2
                while f"{pn_candidate}-{suffix}" in part_number_seen:
                    suffix += 1
                pn_candidate = f"{pn_candidate}-{suffix}"
            pn = pn_candidate
        else:
            tbd_counter += 1
            pn = f"{part_prefix}-TBD-{tbd_counter:04d}"
        part_number_seen.add(pn)

        ata = extract_ata(safe_get(row, "系统章节", ""))

        # Insert equipment
        cur.execute("""
            INSERT INTO equipment (
                id, part_number, name, ata_chapter, equipment_type, status,
                description, lin_number, dimensions_mm,
                has_eicd, is_electrical, is_primary_electrical,
                power_redundancy, power_voltage, power_watts,
                shell_grounding_method, config_category,
                do160_temp_design_level, do160_temp_qual_level,
                do160_temp_qual_range, do160_temp_compliance,
                normal_operating_temp, short_term_temp, ground_storage_temp,
                operating_altitude, qual_report_number,
                first_flight_onboard, phase2_onboard,
                notes, voltage_range
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s,
                %s, %s
            )
        """, (
            eid, pn, name, ata, "LRU", "in_development",
            safe_get(row, "系统章节", ""),
            safe_get(row, "LIN号"),
            safe_get(row, "长*高*宽"),
            parse_bool(safe_get(row, "是否有EICD")),
            parse_bool(safe_get(row, "是否是电设备")),
            parse_bool(safe_get(row, "是否为一级用电设备")),
            safe_get(row, "供电余度"),
            safe_get(row, "供电电压"),
            safe_get(row, "用电功率"),
            safe_get(row, "电搭接方式"),
            label,
            safe_get(row, "设计要求等级"),
            safe_get(row, "DO-160温度高度鉴定等级"),
            safe_get(row, "鉴定工作温度范围"),
            safe_get(row, "鉴定符合情况"),
            safe_get(row, "正常工作温度(℃)"),
            safe_get(row, "短时工作温度(℃)"),
            safe_get(row, "地面停放温度(℃)"),
            safe_get(row, "高度(m)"),
            safe_get(row, "鉴定报告编号"),
            parse_bool(safe_get(row, "首飞是否上机") or safe_get(row, "是否首飞上机")),
            parse_bool(safe_get(row, "二阶段是否上机")),
            safe_get(row, "备注"),
            safe_get(row, "要求等级对应温度"),
        ))
        equip_inserted += 1

        # Insert config_equipment link
        cur.execute("""
            INSERT INTO config_equipment (
                config_id, equipment_id,
                install_method, bonding_method, bonding_type,
                bonding_resistance, bonding_position, in_pace_drawing,
                layout_adjustment, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            config_id, eid,
            safe_get(row, "安装方式"),
            safe_get(row, "电搭接方式"),
            safe_get(row, "电搭接类型"),
            safe_get(row, "电搭接阻值要求(mΩ)"),
            safe_get(row, "搭接位置"),
            parse_bool(safe_get(row, "是否已在PACE图纸中体现")),
            safe_get(row, "总体布置调整需求"),
            safe_get(row, "备注"),
        ))

        # Insert weight_balance
        mass = parse_float(safe_get(row, "重量(kg)"))
        if mass is not None and mass > 0:
            cur.execute(
                "INSERT INTO weight_balances (id, equipment_id, mass_kg) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), eid, mass),
            )
            weight_inserted += 1

        # Insert electrical_load if available
        if name in load_by_name:
            ld = load_by_name[name]
            normal = parse_float(safe_get(ld, "工作功率(kW)")) or 0.0
            peak = parse_float(safe_get(ld, "峰值功率(kW)"))
            cur.execute(
                "INSERT INTO electrical_loads (id, equipment_id, power_kva_normal, power_kva_emergency, power_kva_max) VALUES (%s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), eid, normal, None, peak),
            )
            load_inserted += 1

    print(f"   [{label}] Inserted: {equip_inserted} equipment, {weight_inserted} weights, {load_inserted} loads")
    return equip_inserted


def main():
    pg = psycopg2.connect(PG_DSN)
    pg.autocommit = False
    cur = pg.cursor()

    try:
        # 1. CLEAR ALL DATA (keep users)
        print("1. Clearing existing data...")
        for t in [
            "change_requests", "config_equipment", "installations",
            "electrical_loads", "weight_balances", "audit_logs",
            "bus_definitions", "zones",
            "configurations", "series", "equipment", "suppliers", "programs",
        ]:
            cur.execute(f"DELETE FROM {t}")
        pg.commit()
        print("   Done.\n")

        # 2. CREATE PROGRAM HIERARCHY
        print("2. Creating program hierarchy...")
        program_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO programs (id, name, aircraft_type, description) VALUES (%s, %s, %s, %s)",
            (program_id, "CE-25A", "大型宽体客机", "CE-25A型飞机设备管理"),
        )

        series_x_id = str(uuid.uuid4())
        series_12_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO series (id, program_id, variant_name, description) VALUES (%s, %s, %s, %s)",
            (series_x_id, program_id, "X构型", "CE-25A X构型"),
        )
        cur.execute(
            "INSERT INTO series (id, program_id, variant_name, description) VALUES (%s, %s, %s, %s)",
            (series_12_id, program_id, "1&2构型", "CE-25A 1&2号构型"),
        )

        config_x_id = str(uuid.uuid4())
        config_12_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO configurations (id, series_id, version, status, description, created_by) VALUES (%s, %s, %s, %s, %s, %s)",
            (config_x_id, series_x_id, "V1.0", "baseline", "X构型基线", ADMIN_USER_ID),
        )
        cur.execute(
            "INSERT INTO configurations (id, series_id, version, status, description, created_by) VALUES (%s, %s, %s, %s, %s, %s)",
            (config_12_id, series_12_id, "V1.0", "baseline", "1&2构型基线", ADMIN_USER_ID),
        )
        pg.commit()
        print(f"   CE-25A → X构型 (config {config_x_id})")
        print(f"   CE-25A → 1&2构型 (config {config_12_id})\n")

        # 3. IMPORT EACH DATABASE INDEPENDENTLY
        print("3. Importing X构型...")
        n_x = import_one_config(cur, config_x_id, SQLITE_X, "X构型", "X")
        pg.commit()

        print("\n4. Importing 1&2构型...")
        n_12 = import_one_config(cur, config_12_id, SQLITE_12, "1&2构型", "12")
        pg.commit()

        # 4. SUMMARY
        print("\n" + "=" * 50)
        print("Migration complete!")
        for table in ["equipment", "config_equipment", "weight_balances", "electrical_loads"]:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            print(f"  {table:20s} {cur.fetchone()[0]}")

        # Verify independence
        cur.execute("""
            SELECT s.variant_name,
                   (SELECT COUNT(*) FROM config_equipment ce WHERE ce.config_id = c.id) AS equip_count
            FROM configurations c
            JOIN series s ON s.id = c.series_id
            ORDER BY s.variant_name
        """)
        print("\n  Per-configuration counts:")
        for row in cur.fetchall():
            print(f"    {row[0]}: {row[1]} equipment")

    except Exception as e:
        pg.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        cur.close()
        pg.close()


if __name__ == "__main__":
    main()
