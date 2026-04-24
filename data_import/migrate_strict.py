"""
Strict re-import: wipe all data and rebuild from the two SQLite databases.
Every field is explicitly mapped. Two configurations, fully independent.
"""

import sqlite3, uuid, re, psycopg2

PG_DSN = "dbname=aeroequip user=aeroequip password=devpassword host=localhost port=5432"
SQLITE_12 = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_1&2号构型.db"
SQLITE_X  = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_X号构型.db"
ADMIN_UID = "f9faf4bc-e92f-459d-b476-f39d1676b984"


# ── helpers ──────────────────────────────────────────────
def sg(row, key):
    try: return row[key]
    except (IndexError, KeyError): return None

def pb(val):
    if val is None: return None
    s = str(val).strip()
    if s in ("是", "有", "1"): return True
    if s in ("否", "无", "0"): return False
    return None

def pf(val):
    if val is None: return None
    s = str(val).strip()
    if not s or s in ("/", "-", "TBD", "—", "N/A"): return None
    s = s.replace(",", "")
    m = re.match(r"[-+]?\d*\.?\d+", s)
    return float(m.group()) if m else None

def ata(chapter):
    if not chapter: return "00"
    m = re.search(r"(\d{2})", chapter)
    return m.group(1) if m else "00"

def rows(path, sql):
    c = sqlite3.connect(path)
    c.row_factory = sqlite3.Row
    r = c.execute(sql).fetchall()
    c.close()
    return r


# ── import one config ────────────────────────────────────
def import_config(cur, config_id, db_path, prefix):
    equip_rows  = rows(db_path, "SELECT * FROM 设备")
    load_rows   = rows(db_path, "SELECT * FROM 负载电气特性")
    phase_rows  = rows(db_path, "SELECT * FROM 飞行阶段定义")
    mode_rows   = rows(db_path, "SELECT * FROM 负载工作模式")

    # index loads by 设备名称
    load_map = {}
    for r in load_rows:
        n = sg(r, "设备名称")
        if n and n.strip():
            load_map.setdefault(n.strip(), []).append(r)

    pn_seen = set()
    tbd_n = 0
    stats = {"equip": 0, "weight": 0, "elec": 0}

    for row in equip_rows:
        name = sg(row, "设备名称")
        if not name or not name.strip(): continue
        name = name.strip()
        eid = str(uuid.uuid4())

        # ── part_number ──
        raw = sg(row, "设备编号") or ""
        raw = raw.strip()
        if raw and raw != "TBD":
            pn = f"{prefix}-{raw}"
            if pn in pn_seen:
                i = 2
                while f"{pn}-{i}" in pn_seen: i += 1
                pn = f"{pn}-{i}"
        else:
            tbd_n += 1
            pn = f"{prefix}-TBD-{tbd_n:04d}"
        pn_seen.add(pn)

        # ── equipment row ──
        cur.execute("""
          INSERT INTO equipment (
            id, part_number, name, ata_chapter, equipment_type, status,
            description, lin_number, dimensions_mm,
            has_eicd, is_electrical, is_primary_electrical,
            power_redundancy, power_voltage, power_watts,
            config_category,
            do160_temp_design_level, do160_temp_qual_level,
            do160_temp_qual_range, do160_temp_compliance,
            normal_operating_temp, short_term_temp, ground_storage_temp,
            operating_altitude, qual_report_number,
            first_flight_onboard, phase2_onboard,
            notes, voltage_range
          ) VALUES (
            %s,%s,%s,%s,%s,%s,
            %s,%s,%s,
            %s,%s,%s,
            %s,%s,%s,
            %s,
            %s,%s,
            %s,%s,
            %s,%s,%s,
            %s,%s,
            %s,%s,
            %s,%s
          )
        """, (
            eid, pn, name, ata(sg(row, "系统章节")), "LRU", "in_development",
            sg(row, "系统章节"),
            sg(row, "LIN号"),
            sg(row, "长*高*宽"),
            pb(sg(row, "是否有EICD")),
            pb(sg(row, "是否是电设备")),
            pb(sg(row, "是否为一级用电设备")),
            sg(row, "供电余度"),
            sg(row, "供电电压"),
            sg(row, "用电功率"),
            sg(row, "构型分类"),
            sg(row, "设计要求等级"),
            sg(row, "DO-160温度高度鉴定等级"),
            sg(row, "鉴定工作温度范围"),
            sg(row, "鉴定符合情况"),
            sg(row, "正常工作温度(℃)"),
            sg(row, "短时工作温度(℃)"),
            sg(row, "地面停放温度(℃)"),
            sg(row, "高度(m)"),
            sg(row, "鉴定报告编号"),
            pb(sg(row, "首飞是否上机") or sg(row, "是否首飞上机")),
            pb(sg(row, "二阶段是否上机")),
            sg(row, "备注"),
            sg(row, "要求等级对应温度"),
        ))
        stats["equip"] += 1

        # ── config_equipment row ──
        cur.execute("""
          INSERT INTO config_equipment (
            config_id, equipment_id,
            sta, bl, wl,
            install_method, bonding_method, bonding_type,
            bonding_resistance, bonding_position, in_pace_drawing,
            layout_adjustment, notes,
            use_batch0_device
          ) VALUES (%s,%s, %s,%s,%s, %s,%s,%s, %s,%s,%s, %s,%s, %s)
        """, (
            config_id, eid,
            pf(sg(row, "重心X(mm)")),
            pf(sg(row, "重心Y(mm)")),
            pf(sg(row, "重心Z(mm)")),
            sg(row, "安装方式"),
            sg(row, "电搭接方式"),
            sg(row, "电搭接类型"),
            sg(row, "电搭接阻值要求(mΩ)"),
            sg(row, "搭接位置"),
            pb(sg(row, "是否已在PACE图纸中体现")),
            sg(row, "总体布置调整需求"),
            sg(row, "电搭接备注") or sg(row, "X构型_备注列") or sg(row, "设备清单批注"),
            pb(sg(row, "是否使用")),
        ))

        # ── weight_balance row ──
        mass = pf(sg(row, "重量(kg)"))
        if mass is not None and mass > 0:
            cur.execute(
                "INSERT INTO weight_balances (id, equipment_id, mass_kg) VALUES (%s,%s,%s)",
                (str(uuid.uuid4()), eid, mass),
            )
            stats["weight"] += 1

        # ── electrical_loads (first matching load record) ──
        if name in load_map:
            ld = load_map[name][0]
            normal = pf(sg(ld, "工作功率(kW)")) or 0.0
            peak   = pf(sg(ld, "峰值功率(kW)"))
            cur.execute(
                "INSERT INTO electrical_loads (id, equipment_id, power_kva_normal, power_kva_emergency, power_kva_max) VALUES (%s,%s,%s,%s,%s)",
                (str(uuid.uuid4()), eid, normal, None, peak),
            )
            stats["elec"] += 1

    print(f"  [{prefix}] {stats['equip']} equipment, {stats['weight']} weights, {stats['elec']} loads")
    return stats


# ── main ─────────────────────────────────────────────────
def main():
    pg = psycopg2.connect(PG_DSN)
    pg.autocommit = False
    cur = pg.cursor()

    try:
        # 1. WIPE everything except users
        print("1. Clearing all data...")
        for t in [
            "change_requests", "config_equipment", "installations",
            "electrical_loads", "weight_balances", "audit_logs",
            "bus_definitions", "zones",
            "configurations", "series", "equipment", "suppliers", "programs",
        ]:
            cur.execute(f"DELETE FROM {t}")
        pg.commit()

        # 2. Program hierarchy
        print("2. Creating hierarchy...")
        pid = str(uuid.uuid4())
        sid = str(uuid.uuid4())
        cid_12 = str(uuid.uuid4())
        cid_x  = str(uuid.uuid4())

        cur.execute("INSERT INTO programs (id,name,aircraft_type,description) VALUES (%s,%s,%s,%s)",
                    (pid, "CE-25A", "大型宽体客机", "CE-25A型飞机设备管理"))
        cur.execute("INSERT INTO series (id,program_id,variant_name,description) VALUES (%s,%s,%s,%s)",
                    (sid, pid, "基本型", "CE-25A基本型"))
        cur.execute("INSERT INTO configurations (id,series_id,version,status,description,created_by) VALUES (%s,%s,%s,%s,%s,%s)",
                    (cid_12, sid, "1&2构型", "baseline", "1&2构型基线", ADMIN_UID))
        cur.execute("INSERT INTO configurations (id,series_id,version,status,description,created_by) VALUES (%s,%s,%s,%s,%s,%s)",
                    (cid_x, sid, "X构型", "baseline", "X构型基线", ADMIN_UID))
        pg.commit()

        # 3. Import
        print("3. Importing 1&2构型...")
        import_config(cur, cid_12, SQLITE_12, "12")
        pg.commit()

        print("4. Importing X构型...")
        import_config(cur, cid_x, SQLITE_X, "X")
        pg.commit()

        # 5. Verify
        print("\n=== Verification ===")
        for table in ["equipment", "config_equipment", "weight_balances", "electrical_loads"]:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            print(f"  {table:20s} {cur.fetchone()[0]}")

        cur.execute("""
          SELECT s.variant_name, c.version,
            (SELECT COUNT(*) FROM config_equipment ce WHERE ce.config_id=c.id) as cnt,
            (SELECT COUNT(*) FROM config_equipment ce WHERE ce.config_id=c.id AND ce.sta IS NOT NULL) as has_sta
          FROM configurations c JOIN series s ON s.id=c.series_id
          ORDER BY c.version
        """)
        print("\n  Per-config:")
        for r in cur.fetchall():
            print(f"    {r[1]}: {r[2]} equipment, {r[3]} with STA")

    except Exception as e:
        pg.rollback()
        import traceback; traceback.print_exc()
        raise
    finally:
        cur.close()
        pg.close()

if __name__ == "__main__":
    main()
