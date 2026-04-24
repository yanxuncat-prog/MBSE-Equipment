"""
P2 Migration: Add specialty/ata_chapters to users,
create notifications and equipment_constraints tables,
update existing admin user role to system_integrator.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "aeroequip.db"


def run():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    # ── 1. Add new columns to users table ────────────────────────────
    existing_cols = {row[1] for row in cur.execute("PRAGMA table_info(users)").fetchall()}

    new_columns = [
        ("specialty", "VARCHAR(50)"),
        ("ata_chapters", "JSON"),
    ]

    added = 0
    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            added += 1

    print(f"[OK] users table: {added} new columns added (skipped {len(new_columns) - added} existing)")

    # ── 2. Create notifications table ────────────────────────────────
    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id          VARCHAR(36) PRIMARY KEY,
        user_id     VARCHAR(36) NOT NULL REFERENCES users(id),
        title       VARCHAR(200) NOT NULL,
        message     TEXT,
        entity_type VARCHAR(50),
        entity_id   VARCHAR(100),
        is_read     BOOLEAN DEFAULT 0,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)")

    print("[OK] notifications table created")

    # ── 3. Create equipment_constraints table ────────────────────────
    cur.execute("""
    CREATE TABLE IF NOT EXISTS equipment_constraints (
        id              VARCHAR(36) PRIMARY KEY,
        config_id       VARCHAR(36) NOT NULL,
        equipment_a_id  VARCHAR(36) NOT NULL,
        equipment_b_id  VARCHAR(36) NOT NULL,
        constraint_type VARCHAR(30) NOT NULL,
        description     TEXT,
        created_by      VARCHAR(36),
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_equipment_constraints_config_id ON equipment_constraints (config_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_equipment_constraints_equipment_a_id ON equipment_constraints (equipment_a_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_equipment_constraints_equipment_b_id ON equipment_constraints (equipment_b_id)")

    print("[OK] equipment_constraints table created")

    # ── 4. Update existing admin user role ───────────────────────────
    cur.execute("""
        UPDATE users SET role = 'system_integrator' WHERE role = 'admin'
    """)
    updated = cur.rowcount
    print(f"[OK] Updated {updated} admin user(s) to system_integrator role")

    conn.commit()

    # ── Verification ─────────────────────────────────────────────────
    user_cols = {row[1] for row in cur.execute("PRAGMA table_info(users)").fetchall()}
    notif_count = cur.execute("SELECT COUNT(*) FROM notifications").fetchone()[0]
    constraint_count = cur.execute("SELECT COUNT(*) FROM equipment_constraints").fetchone()[0]
    si_count = cur.execute("SELECT COUNT(*) FROM users WHERE role = 'system_integrator'").fetchone()[0]

    print(f"\n=== Verification ===")
    print(f"  users columns:                {sorted(user_cols)}")
    print(f"  notifications rows:           {notif_count}")
    print(f"  equipment_constraints rows:   {constraint_count}")
    print(f"  system_integrator users:      {si_count}")

    conn.close()
    print("\n[DONE] P2 migration complete.")


if __name__ == "__main__":
    run()
