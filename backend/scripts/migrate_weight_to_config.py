"""
Migration script: copy weight/electrical data from equipment-level tables
(weight_balances, electrical_loads) into per-config fields on config_equipment.

Also adds is_frozen column to configurations table.

Uses sqlite3 directly (no SQLAlchemy).
"""

import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).parent.parent / "data" / "aeroequip.db"

# Columns to add to config_equipment (name, type, default)
CONFIG_EQUIPMENT_COLUMNS = [
    ("config_name", "VARCHAR(200)", None),
    ("mass_kg", "FLOAT", None),
    ("cg_x", "FLOAT", None),
    ("cg_y", "FLOAT", None),
    ("cg_z", "FLOAT", None),
    ("inertia_ix", "FLOAT", None),
    ("inertia_iy", "FLOAT", None),
    ("inertia_iz", "FLOAT", None),
    ("inertia_ixy", "FLOAT", None),
    ("inertia_ixz", "FLOAT", None),
    ("inertia_iyz", "FLOAT", None),
    ("weight_target_kg", "FLOAT", None),
    ("overweight_risk", "VARCHAR(200)", None),
    ("power_kva_normal", "FLOAT", None),
    ("power_kva_emergency", "FLOAT", None),
    ("power_kva_max", "FLOAT", None),
]


def get_existing_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    """Return set of column names for a table."""
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def add_columns(conn: sqlite3.Connection) -> None:
    """Add new columns to config_equipment and configurations (skip if exists)."""
    # --- config_equipment ---
    existing = get_existing_columns(conn, "config_equipment")
    added = 0
    for col_name, col_type, default in CONFIG_EQUIPMENT_COLUMNS:
        if col_name not in existing:
            default_clause = f" DEFAULT {default}" if default is not None else ""
            conn.execute(
                f"ALTER TABLE config_equipment ADD COLUMN {col_name} {col_type}{default_clause}"
            )
            added += 1
            print(f"  + config_equipment.{col_name} ({col_type})")
    if added == 0:
        print("  (all config_equipment columns already exist)")

    # --- configurations.is_frozen ---
    cfg_cols = get_existing_columns(conn, "configurations")
    if "is_frozen" not in cfg_cols:
        conn.execute(
            "ALTER TABLE configurations ADD COLUMN is_frozen BOOLEAN DEFAULT 0"
        )
        print("  + configurations.is_frozen (BOOLEAN DEFAULT 0)")
    else:
        print("  (configurations.is_frozen already exists)")

    conn.commit()


def migrate_weight_data(conn: sqlite3.Connection) -> int:
    """Copy mass_kg from weight_balances into config_equipment rows."""
    cur = conn.execute("""
        UPDATE config_equipment
        SET mass_kg = (
            SELECT wb.mass_kg
            FROM weight_balances wb
            WHERE wb.equipment_id = config_equipment.equipment_id
        )
        WHERE mass_kg IS NULL
          AND EXISTS (
            SELECT 1 FROM weight_balances wb
            WHERE wb.equipment_id = config_equipment.equipment_id
          )
    """)
    conn.commit()
    return cur.rowcount


def migrate_electrical_data(conn: sqlite3.Connection) -> int:
    """Copy power_kva_* from electrical_loads into config_equipment rows."""
    cur = conn.execute("""
        UPDATE config_equipment
        SET
            power_kva_normal = (
                SELECT el.power_kva_normal
                FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            ),
            power_kva_emergency = (
                SELECT el.power_kva_emergency
                FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            ),
            power_kva_max = (
                SELECT el.power_kva_max
                FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            )
        WHERE power_kva_normal IS NULL
          AND EXISTS (
            SELECT 1 FROM electrical_loads el
            WHERE el.equipment_id = config_equipment.equipment_id
          )
    """)
    conn.commit()
    return cur.rowcount


def print_summary(conn: sqlite3.Connection) -> None:
    """Print counts for verification."""
    total = conn.execute("SELECT COUNT(*) FROM config_equipment").fetchone()[0]
    with_mass = conn.execute(
        "SELECT COUNT(*) FROM config_equipment WHERE mass_kg IS NOT NULL"
    ).fetchone()[0]
    with_power = conn.execute(
        "SELECT COUNT(*) FROM config_equipment WHERE power_kva_normal IS NOT NULL"
    ).fetchone()[0]
    wb_count = conn.execute("SELECT COUNT(*) FROM weight_balances").fetchone()[0]
    el_count = conn.execute("SELECT COUNT(*) FROM electrical_loads").fetchone()[0]

    print(f"\n--- Summary ---")
    print(f"  config_equipment rows total:       {total}")
    print(f"  rows with mass_kg populated:       {with_mass}")
    print(f"  rows with power_kva populated:     {with_power}")
    print(f"  weight_balances source rows:        {wb_count}")
    print(f"  electrical_loads source rows:       {el_count}")


def main() -> None:
    print(f"Database: {DB_PATH}")
    if not DB_PATH.exists():
        print("ERROR: database file not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    try:
        print("\n[1/3] Adding columns...")
        add_columns(conn)

        print("\n[2/3] Migrating weight data...")
        weight_rows = migrate_weight_data(conn)
        print(f"  Updated {weight_rows} config_equipment rows with weight data")

        print("\n[3/3] Migrating electrical data...")
        elec_rows = migrate_electrical_data(conn)
        print(f"  Updated {elec_rows} config_equipment rows with electrical data")

        print_summary(conn)
        print("\nMigration complete.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
