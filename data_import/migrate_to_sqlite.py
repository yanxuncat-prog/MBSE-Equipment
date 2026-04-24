"""Import data from the two source SQLite databases into the app's SQLite database."""
import sqlite3, uuid, re, os

APP_DB = os.path.join(os.path.dirname(__file__), "..", "backend", "data", "aeroequip.db")
SQLITE_12 = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_1&2号构型.db"
SQLITE_X  = "/Users/yanxunmaosmacbook/Documents/设备管理/设备管理数据/equipment_X号构型.db"


def sg(row, key):
    try: return row[key]
    except (IndexError, KeyError): return None

def pb(val):
    if val is None: return None
    s = str(val).strip()
    if s in ("是", "有", "1"): return 1
    if s in ("否", "无", "0"): return 0
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

def src_rows(path, sql):
    c = sqlite3.connect(path)
    c.row_factory = sqlite3.Row
    r = c.execute(sql).fetchall()
    c.close()
    return r

def uid(): return str(uuid.uuid4())


def import_config(cur, config_id, db_path, prefix):
    equip_rows = src_rows(db_path, "SELECT * FROM 设备")
    load_rows  = src_rows(db_path, "SELECT * FROM 负载电气特性")
    phase_rows = src_rows(db_path, "SELECT * FROM 飞行阶段定义")
    mode_rows  = src_rows(db_path, "SELECT * FROM 负载工作模式")

    # Aggregate loads by device name: take max normal power and max peak power
    load_map = {}
    for r in load_rows:
        n = sg(r, "设备名称")
        if not n or not n.strip(): continue
        n = n.strip()
        normal = pf(sg(r, "工作功率(kW)")) or 0.0
        peak = pf(sg(r, "峰值功率(kW)"))
        if n not in load_map:
            load_map[n] = {"normal": normal, "peak": peak}
        else:
            load_map[n]["normal"] = max(load_map[n]["normal"], normal)
            if peak is not None:
                load_map[n]["peak"] = max(load_map[n].get("peak") or 0, peak)

    pn_seen = set()
    tbd_n = 0
    stats = {"equip": 0, "weight": 0, "elec": 0}

    for row in equip_rows:
        name = sg(row, "设备名称")
        if not name or not name.strip(): continue
        name = name.strip()
        eid = uid()

        raw = (sg(row, "设备编号") or "").strip()
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
          ) VALUES (?,?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?, ?,?, ?,?, ?,?,?, ?,?, ?,?, ?,?)
        """, (
            eid, pn, name, ata(sg(row, "系统章节")), "LRU", "in_development",
            sg(row, "系统章节"), sg(row, "LIN号"), sg(row, "长*高*宽"),
            pb(sg(row, "是否有EICD")), pb(sg(row, "是否是电设备")), pb(sg(row, "是否为一级用电设备")),
            sg(row, "供电余度"), sg(row, "供电电压"), sg(row, "用电功率"),
            sg(row, "构型分类"),
            sg(row, "设计要求等级"), sg(row, "DO-160温度高度鉴定等级"),
            sg(row, "鉴定工作温度范围"), sg(row, "鉴定符合情况"),
            sg(row, "正常工作温度(℃)"), sg(row, "短时工作温度(℃)"), sg(row, "地面停放温度(℃)"),
            sg(row, "高度(m)"), sg(row, "鉴定报告编号"),
            pb(sg(row, "首飞是否上机") or sg(row, "是否首飞上机")),
            pb(sg(row, "二阶段是否上机")),
            sg(row, "备注"), sg(row, "要求等级对应温度"),
        ))
        stats["equip"] += 1

        cur.execute("""
          INSERT INTO config_equipment (
            config_id, equipment_id,
            sta, bl, wl,
            install_method, bonding_method, bonding_type,
            bonding_resistance, bonding_position, in_pace_drawing,
            layout_adjustment, notes, use_batch0_device
          ) VALUES (?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?)
        """, (
            config_id, eid,
            pf(sg(row, "重心X(mm)")), pf(sg(row, "重心Y(mm)")), pf(sg(row, "重心Z(mm)")),
            sg(row, "安装方式"), sg(row, "电搭接方式"), sg(row, "电搭接类型"),
            sg(row, "电搭接阻值要求(mΩ)"), sg(row, "搭接位置"),
            pb(sg(row, "是否已在PACE图纸中体现")),
            sg(row, "总体布置调整需求"),
            sg(row, "电搭接备注") or sg(row, "X构型_备注列") or sg(row, "设备清单批注"),
            pb(sg(row, "是否使用")),
        ))

        mass = pf(sg(row, "重量(kg)"))
        if mass is not None and mass > 0:
            cur.execute("INSERT INTO weight_balances (id, equipment_id, mass_kg) VALUES (?,?,?)",
                        (uid(), eid, mass))
            stats["weight"] += 1

        if name in load_map:
            ld = load_map[name]
            cur.execute("INSERT INTO electrical_loads (id, equipment_id, power_kva_normal, power_kva_emergency, power_kva_max) VALUES (?,?,?,?,?)",
                        (uid(), eid, ld["normal"], None, ld.get("peak")))
            stats["elec"] += 1

    # ── 负载电气特性 (全量导入每条记录) ──
    for r in load_rows:
        cur.execute("""
          INSERT INTO electrical_details (
            id, config_id, load_id, equipment_name, lin_number, ata_chapter, part_number,
            voltage_level, voltage_range, soft_start, peak_power_kw, peak_power_time_s,
            supply_channels, dissimilar_supply, emergency_sheddable,
            working_power_kw, actual_power_kw, power_margin, measured_current_a, peak_to_working_ratio
          ) VALUES (?,?,?,?,?,?,?, ?,?,?,?,?, ?,?,?, ?,?,?,?,?)
        """, (
            uid(), config_id,
            sg(r, "负载ID"), sg(r, "设备名称"), sg(r, "LIN号"), sg(r, "系统章节"), sg(r, "设备编号"),
            sg(r, "正常工作电压等级(V)"), sg(r, "正常工作电压范围(V)"), sg(r, "是否需要软启动"),
            sg(r, "峰值功率(kW)"), sg(r, "峰值功率时间(s)"),
            sg(r, "供电路数"), sg(r, "有无供电非相似需求"), sg(r, "应急是否可卸载"),
            sg(r, "工作功率(kW)"), sg(r, "实际功率(kW)"), sg(r, "功率余量"),
            sg(r, "实测电流(A)"), sg(r, "峰值功率/工作功率"),
        ))
    stats["details"] = len(load_rows)

    # ── 飞行阶段定义 ──
    for r in phase_rows:
        cur.execute("""
          INSERT INTO flight_phases (
            id, config_id, phase_code, phase_name, original_phase, duration_min,
            phase_definition, control_surface, speed_tas, altitude,
            peak_simultaneity, emergency_simultaneity, power_source_270v
          ) VALUES (?,?,?,?,?,?, ?,?,?,?, ?,?,?)
        """, (
            uid(), config_id,
            sg(r, "阶段编号"), sg(r, "阶段名称"), sg(r, "原统计运行阶段"), sg(r, "时长(min)"),
            sg(r, "阶段定义"), sg(r, "舵面情况"), sg(r, "飞行速度TAS"), sg(r, "飞行高度"),
            sg(r, "峰值最大功率同时系数"), sg(r, "应急最大功率同时系数"), sg(r, "270V主要功率来源"),
        ))
    stats["phases"] = len(phase_rows)

    # ── 负载工作模式 ──
    for r in mode_rows:
        cur.execute("""
          INSERT INTO load_work_modes (
            id, config_id, load_id, work_mode, equipment_name, lin_number,
            ata_chapter, part_number, voltage_level, emergency_sheddable,
            load_type, power_demand_kw, g0,g1,g2,g3,g4,g5,g6,g7,g8
          ) VALUES (?,?,?,?,?,?, ?,?,?,?, ?,?, ?,?,?,?,?,?,?,?,?)
        """, (
            uid(), config_id,
            sg(r, "负载ID"), sg(r, "工作模式"), sg(r, "设备名称"), sg(r, "LIN号"),
            sg(r, "系统章节"), sg(r, "设备编号"), sg(r, "正常工作电压等级(V)"), sg(r, "应急是否可卸载"),
            sg(r, "负载类型"), sg(r, "功率需求(kW)"),
            sg(r, "G0"), sg(r, "G1"), sg(r, "G2"), sg(r, "G3"),
            sg(r, "G4"), sg(r, "G5"), sg(r, "G6"), sg(r, "G7"), sg(r, "G8"),
        ))
    stats["modes"] = len(mode_rows)

    print(f"  [{prefix}] {stats['equip']} equip, {stats['weight']} weights, {stats['elec']} agg_loads, {stats['details']} details, {stats['phases']} phases, {stats['modes']} modes")


def main():
    conn = sqlite3.connect(APP_DB)
    cur = conn.cursor()

    # Get admin user id
    cur.execute("SELECT id FROM users WHERE username='admin'")
    admin_id = cur.fetchone()[0]

    # Create hierarchy
    pid = uid(); sid = uid(); cid_12 = uid(); cid_x = uid()
    cur.execute("INSERT INTO programs (id,name,aircraft_type,description) VALUES (?,?,?,?)",
                (pid, "CE-25A", "大型宽体客机", "CE-25A型飞机设备管理"))
    cur.execute("INSERT INTO series (id,program_id,variant_name,description) VALUES (?,?,?,?)",
                (sid, pid, "基本型", "CE-25A基本型"))
    cur.execute("INSERT INTO configurations (id,series_id,version,status,description,created_by) VALUES (?,?,?,?,?,?)",
                (cid_12, sid, "1&2构型", "baseline", "1&2构型基线", admin_id))
    cur.execute("INSERT INTO configurations (id,series_id,version,status,description,created_by) VALUES (?,?,?,?,?,?)",
                (cid_x, sid, "X构型", "baseline", "X构型基线", admin_id))
    conn.commit()

    print("Importing 1&2构型...")
    import_config(cur, cid_12, SQLITE_12, "12")
    conn.commit()

    print("Importing X构型...")
    import_config(cur, cid_x, SQLITE_X, "X")
    conn.commit()

    # Verify
    print("\n=== Verification ===")
    for t in ["equipment", "config_equipment", "weight_balances", "electrical_loads", "electrical_details", "flight_phases", "load_work_modes"]:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t:20s} {cur.fetchone()[0]}")

    cur.execute("""
      SELECT c.version,
        (SELECT COUNT(*) FROM config_equipment ce WHERE ce.config_id=c.id),
        (SELECT COUNT(*) FROM config_equipment ce WHERE ce.config_id=c.id AND ce.sta IS NOT NULL)
      FROM configurations c ORDER BY c.version
    """)
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]} equipment, {r[2]} with STA")

    conn.close()


if __name__ == "__main__":
    main()
