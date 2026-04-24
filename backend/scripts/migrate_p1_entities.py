"""
P1 Migration: Create micd_records and do160_records tables,
add physical asset lifecycle columns to config_equipment,
and migrate existing DO-160 temperature data from equipment table.
"""
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent.parent / "data" / "aeroequip.db"


def run():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    # ── 1. Create micd_records table ──────────────────────────────────
    cur.execute("""
    CREATE TABLE IF NOT EXISTS micd_records (
        id              VARCHAR(36) PRIMARY KEY,
        config_id       VARCHAR(36) NOT NULL,
        equipment_id    VARCHAR(36) NOT NULL,

        installation_structure_id VARCHAR(100),
        bonding_surface     VARCHAR(200),
        fastener_brand      VARCHAR(100),
        fastener_count      INTEGER,
        fastener_team       VARCHAR(100),
        bracket_model       VARCHAR(100),
        bracket_source      VARCHAR(20),
        bracket_mass_kg     FLOAT,
        screw_spec          VARCHAR(100),
        wire_bonding_size   VARCHAR(100),
        model_config        VARCHAR(100),
        has_tolerance_drawing BOOLEAN,
        tolerance_drawing_url VARCHAR(500),

        is_confirmed    BOOLEAN DEFAULT 0,
        confirmed_at    DATE,
        confirmed_by    VARCHAR(50),

        notes           TEXT,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    # Indexes for micd_records
    cur.execute("CREATE INDEX IF NOT EXISTS ix_micd_records_config_id ON micd_records (config_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_micd_records_equipment_id ON micd_records (equipment_id)")

    print("[OK] micd_records table created")

    # ── 2. Create do160_records table ─────────────────────────────────
    cur.execute("""
    CREATE TABLE IF NOT EXISTS do160_records (
        id              VARCHAR(36) PRIMARY KEY,
        config_id       VARCHAR(36) NOT NULL,
        equipment_id    VARCHAR(36) NOT NULL,

        test_category       VARCHAR(30) NOT NULL,
        design_level        VARCHAR(50),
        qual_level          VARCHAR(50),
        compliance_status   VARCHAR(20) DEFAULT 'pending',
        qual_report_number  VARCHAR(200),
        notes               TEXT,

        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    # Indexes for do160_records
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_records_config_id ON do160_records (config_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_records_equipment_id ON do160_records (equipment_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_records_test_category ON do160_records (test_category)")

    print("[OK] do160_records table created")

    # ── 3. Add physical asset lifecycle columns to config_equipment ───
    existing_cols = {row[1] for row in cur.execute("PRAGMA table_info(config_equipment)").fetchall()}

    new_columns = [
        ("actual_arrival_date", "DATE"),
        ("micd_confirmed", "BOOLEAN"),
        ("structure_ready", "BOOLEAN"),
        ("installation_ready", "BOOLEAN"),
        ("planned_install_date", "DATE"),
        ("actual_install_date", "DATE"),
    ]

    added = 0
    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            cur.execute(f"ALTER TABLE config_equipment ADD COLUMN {col_name} {col_type}")
            added += 1

    print(f"[OK] config_equipment: {added} new columns added (skipped {len(new_columns) - added} existing)")

    # ── 4. Migrate DO-160 temperature data ────────────────────────────
    # Join equipment (which has the DO-160 temp fields) with config_equipment
    # to get config_id, and create one do160_records row per (config, equipment) pair.
    cur.execute("""
        SELECT ce.config_id, e.id,
               e.do160_temp_design_level,
               e.do160_temp_qual_level,
               e.do160_temp_compliance,
               e.qual_report_number
        FROM equipment e
        JOIN config_equipment ce ON e.id = ce.equipment_id
        WHERE e.do160_temp_design_level IS NOT NULL
           OR e.do160_temp_qual_level IS NOT NULL
           OR e.do160_temp_compliance IS NOT NULL
    """)
    rows = cur.fetchall()

    # Check for existing migrated records to avoid duplicates on re-run
    existing_count = cur.execute(
        "SELECT COUNT(*) FROM do160_records WHERE test_category = 'sec4_temperature'"
    ).fetchone()[0]

    if existing_count > 0:
        print(f"[SKIP] {existing_count} sec4_temperature records already exist, skipping migration")
    else:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        migrated = 0
        for config_id, equip_id, design_level, qual_level, compliance_text, report_num in rows:
            # Normalize compliance status
            compliance_status = _normalize_compliance(compliance_text)

            cur.execute("""
                INSERT INTO do160_records
                    (id, config_id, equipment_id, test_category,
                     design_level, qual_level, compliance_status,
                     qual_report_number, notes, created_at, updated_at)
                VALUES (?, ?, ?, 'sec4_temperature', ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()), config_id, equip_id,
                design_level, qual_level, compliance_status,
                report_num, compliance_text,  # preserve original text in notes
                now, now,
            ))
            migrated += 1

        print(f"[OK] Migrated {migrated} equipment rows -> do160_records (sec4_temperature)")

    conn.commit()

    # ── Verification ──────────────────────────────────────────────────
    micd_count = cur.execute("SELECT COUNT(*) FROM micd_records").fetchone()[0]
    do160_count = cur.execute("SELECT COUNT(*) FROM do160_records").fetchone()[0]
    arrival_count = cur.execute(
        "SELECT COUNT(*) FROM config_equipment WHERE actual_arrival_date IS NOT NULL"
    ).fetchone()[0]

    print(f"\n=== Verification ===")
    print(f"  micd_records rows:                           {micd_count}")
    print(f"  do160_records rows:                          {do160_count}")
    print(f"  config_equipment with actual_arrival_date:   {arrival_count}")

    conn.close()
    print("\n[DONE] Migration complete.")


def _normalize_compliance(text: str | None) -> str:
    """Normalize Chinese compliance text to enum value."""
    if not text:
        return "pending"
    t = text.strip()
    if t == "符合":
        return "compliant"
    elif t == "不符合":
        return "non_compliant"
    elif "不符合" in t:
        return "non_compliant"
    elif "符合" in t and "不符合" not in t:
        return "compliant"
    elif t in ("待确认", "待定", ""):
        return "pending"
    elif t == "不适用":
        return "not_applicable"
    else:
        return "pending"


if __name__ == "__main__":
    run()
