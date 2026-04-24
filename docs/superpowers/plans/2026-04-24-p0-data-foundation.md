# Phase 1: Data Foundation (P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the data model so weight/CG data is per-configuration (enabling cross-config weight reduction comparison), formalize the Equipment Library concept, add baseline freeze for 0号机, and enhance change logging with field-level tracking.

**Architecture:** The existing Equipment table already serves as EquipmentMaster (part_number unique). ConfigEquipment is the per-config junction. We move weight/CG data from the global WeightBalance table to per-config fields on ConfigEquipment, add a `config_name` override field, implement configuration freeze via a `is_frozen` flag, and enhance AuditLog usage with field-level diff capture in the PATCH endpoint.

**Tech Stack:** FastAPI, SQLAlchemy (async), SQLite + aiosqlite, React 18, TypeScript, Tailwind CSS 4, ShadCN/UI, Zustand

**Key File Map:**

| File | Responsibility |
|------|---------------|
| `backend/app/models/configuration.py` | ConfigEquipment + Configuration models (add weight fields, freeze flag) |
| `backend/app/schemas/equipment.py` | Pydantic schemas (add weight fields to ConfigEquipmentData/Update) |
| `backend/app/api/configurations.py` | PATCH endpoint (per-config weight writes, freeze enforcement, audit logging) |
| `backend/app/api/equipment.py` | GET endpoint (return per-config weight) |
| `backend/app/api/equipment_library.py` | NEW: Equipment Library CRUD endpoints |
| `backend/app/api/audit_logs.py` | NEW: Query audit log entries |
| `backend/scripts/migrate_weight_to_config.py` | NEW: One-time migration script |
| `frontend/src/types/index.ts` | TypeScript types (add weight to ConfigEquipmentData) |
| `frontend/src/api/equipment-library.ts` | NEW: Equipment library API client |
| `frontend/src/api/audit-logs.ts` | NEW: Audit log API client |
| `frontend/src/pages/EquipmentLibraryPage.tsx` | NEW: Equipment library page |
| `frontend/src/components/equipment/ChangeLogViewer.tsx` | NEW: Change log component |
| `frontend/src/components/equipment/ExpandableRow.tsx` | Update weight display source |
| `frontend/src/components/workstation/tabs/WeightTab.tsx` | Update weight data source |
| `frontend/src/components/workstation/tabs/OverviewTab.tsx` | Update weight in preview panel |

---

### Task 1: Add per-config weight/CG fields to ConfigEquipment model

**Files:**
- Modify: `backend/app/models/configuration.py:13-50`

- [ ] **Step 1: Add weight/CG columns to ConfigEquipment model**

Open `backend/app/models/configuration.py` and add weight, CG, inertia, and config_name fields after the existing procurement fields (after line 45):

```python
class ConfigEquipment(Base):
    __tablename__ = "config_equipment"

    config_id: Mapped[str] = mapped_column(String(36), ForeignKey("configurations.id"), primary_key=True)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), primary_key=True)

    # Display name override (may differ from Equipment.name per config)
    config_name: Mapped[str | None] = mapped_column(String(200), comment="构型中的设备名称(可与设备库名称不同)")

    # Installation position (config-specific)
    zone_id: Mapped[str | None] = mapped_column(ForeignKey("zones.id"))
    sta: Mapped[float | None] = mapped_column(Float, comment="Fuselage Station")
    wl: Mapped[float | None] = mapped_column(Float, comment="Waterline")
    bl: Mapped[float | None] = mapped_column(Float, comment="Buttline")
    rack_position: Mapped[str | None] = mapped_column(String(100))

    # Bus assignment (config-specific)
    bus_id: Mapped[str | None] = mapped_column(ForeignKey("bus_definitions.id"))

    notes: Mapped[str | None] = mapped_column(String(500))

    # --- Per-config weight & CG (moved from global WeightBalance) ---
    mass_kg: Mapped[float | None] = mapped_column(Float, comment="设备实测重量(kg)")
    cg_x: Mapped[float | None] = mapped_column(Float, comment="重心X坐标(mm,全机坐标系)")
    cg_y: Mapped[float | None] = mapped_column(Float, comment="重心Y坐标(mm)")
    cg_z: Mapped[float | None] = mapped_column(Float, comment="重心Z坐标(mm)")
    inertia_ix: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ix(kg·m²)")
    inertia_iy: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iy(kg·m²)")
    inertia_iz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iz(kg·m²)")
    inertia_ixy: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ixy(kg·m²)")
    inertia_ixz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Ixz(kg·m²)")
    inertia_iyz: Mapped[float | None] = mapped_column(Float, comment="转动惯量Iyz(kg·m²)")
    weight_target_kg: Mapped[float | None] = mapped_column(Float, comment="重量指标(PACE分配,kg)")
    overweight_risk: Mapped[str | None] = mapped_column(String(200), comment="超重风险说明")

    # --- Per-config electrical load (moved from global ElectricalLoad) ---
    power_kva_normal: Mapped[float | None] = mapped_column(Float, comment="正常功耗(kW)")
    power_kva_emergency: Mapped[float | None] = mapped_column(Float, comment="应急功耗(kW)")
    power_kva_max: Mapped[float | None] = mapped_column(Float, comment="峰值功耗(kW)")

    # Bonding/grounding (config-specific because installation method varies)
    install_method: Mapped[str | None] = mapped_column(String(200), comment="安装方式")
    bonding_method: Mapped[str | None] = mapped_column(String(50), comment="电搭接方式")
    bonding_type: Mapped[str | None] = mapped_column(String(100), comment="电搭接类型")
    bonding_resistance: Mapped[str | None] = mapped_column(String(50), comment="电搭接阻值要求(mΩ)")
    bonding_position: Mapped[str | None] = mapped_column(String(200), comment="搭接位置(结构零件号)")
    in_pace_drawing: Mapped[bool | None] = mapped_column(comment="是否已在PACE图纸中体现")
    layout_adjustment: Mapped[str | None] = mapped_column(String(500), comment="总体布置调整需求")
    use_batch0_device: Mapped[bool | None] = mapped_column(comment="是否使用0号机设备")

    # Procurement tracking
    procurement_status: Mapped[str | None] = mapped_column(String(20), comment="采购状态: inquiry/contracted/producing/inspecting/shipping/delivered")
    procurement_location: Mapped[str | None] = mapped_column(String(50), comment="设备当前位置城市")
    planned_delivery_date: Mapped[date | None] = mapped_column(Date, comment="计划交付日期")
    estimated_delivery_date: Mapped[date | None] = mapped_column(Date, comment="预计/实际交付日期")
    procurement_notes: Mapped[str | None] = mapped_column(Text, comment="采购备注")

    # Relationships
    equipment: Mapped["Equipment"] = relationship()
    zone: Mapped["Zone | None"] = relationship()
    bus: Mapped["BusDefinition | None"] = relationship()
```

- [ ] **Step 2: Add is_frozen flag to Configuration model**

In the same file, add `is_frozen` to the `Configuration` class:

```python
class Configuration(Base):
    __tablename__ = "configurations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    series_id: Mapped[str] = mapped_column(ForeignKey("series.id"))
    version: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    description: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_frozen: Mapped[bool] = mapped_column(default=False, comment="基线冻结:令号/DM号/设备名称不可修改")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    series: Mapped["Series"] = relationship(back_populates="configurations")
    config_equipment_entries: Mapped[list["ConfigEquipment"]] = relationship(cascade="all, delete-orphan")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/configuration.py
git commit -m "feat: add per-config weight/CG/electrical fields and freeze flag to data model"
```

---

### Task 2: Write migration script to copy existing weight/electrical data to ConfigEquipment

**Files:**
- Create: `backend/scripts/migrate_weight_to_config.py`

- [ ] **Step 1: Write the migration script**

```python
"""Migrate weight and electrical data from global tables to per-config ConfigEquipment columns.

Run: python -m scripts.migrate_weight_to_config
"""
import asyncio
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "aeroequip.db"


def migrate():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Step 1: Add new columns to config_equipment (ignore if already exist)
    new_columns = [
        ("config_name", "VARCHAR(200)"),
        ("mass_kg", "FLOAT"),
        ("cg_x", "FLOAT"),
        ("cg_y", "FLOAT"),
        ("cg_z", "FLOAT"),
        ("inertia_ix", "FLOAT"),
        ("inertia_iy", "FLOAT"),
        ("inertia_iz", "FLOAT"),
        ("inertia_ixy", "FLOAT"),
        ("inertia_ixz", "FLOAT"),
        ("inertia_iyz", "FLOAT"),
        ("weight_target_kg", "FLOAT"),
        ("overweight_risk", "VARCHAR(200)"),
        ("power_kva_normal", "FLOAT"),
        ("power_kva_emergency", "FLOAT"),
        ("power_kva_max", "FLOAT"),
    ]

    existing = {row[1] for row in cur.execute("PRAGMA table_info(config_equipment)").fetchall()}
    for col_name, col_type in new_columns:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE config_equipment ADD COLUMN {col_name} {col_type}")
            print(f"  Added column: config_equipment.{col_name}")

    # Step 2: Add is_frozen to configurations
    config_cols = {row[1] for row in cur.execute("PRAGMA table_info(configurations)").fetchall()}
    if "is_frozen" not in config_cols:
        cur.execute("ALTER TABLE configurations ADD COLUMN is_frozen BOOLEAN DEFAULT 0")
        print("  Added column: configurations.is_frozen")

    # Step 3: Copy weight data from weight_balances → config_equipment
    wb_count = cur.execute("""
        UPDATE config_equipment
        SET mass_kg = (
            SELECT wb.mass_kg FROM weight_balances wb
            WHERE wb.equipment_id = config_equipment.equipment_id
        )
        WHERE EXISTS (
            SELECT 1 FROM weight_balances wb
            WHERE wb.equipment_id = config_equipment.equipment_id
        )
    """).rowcount
    print(f"  Migrated {wb_count} weight records to config_equipment")

    # Step 4: Copy electrical load data from electrical_loads → config_equipment
    el_count = cur.execute("""
        UPDATE config_equipment
        SET power_kva_normal = (
                SELECT el.power_kva_normal FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            ),
            power_kva_emergency = (
                SELECT el.power_kva_emergency FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            ),
            power_kva_max = (
                SELECT el.power_kva_max FROM electrical_loads el
                WHERE el.equipment_id = config_equipment.equipment_id
            )
        WHERE EXISTS (
            SELECT 1 FROM electrical_loads el
            WHERE el.equipment_id = config_equipment.equipment_id
        )
    """).rowcount
    print(f"  Migrated {el_count} electrical records to config_equipment")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
```

- [ ] **Step 2: Run the migration**

Run: `cd /Users/yanxunmaosmacbook/Documents/设备管理/backend && python -m scripts.migrate_weight_to_config`

Expected output:
```
  Added column: config_equipment.config_name
  Added column: config_equipment.mass_kg
  ...
  Migrated N weight records to config_equipment
  Migrated N electrical records to config_equipment
  Migration complete.
```

- [ ] **Step 3: Verify migration**

Run: `cd /Users/yanxunmaosmacbook/Documents/设备管理/backend && python3 -c "
import sqlite3
conn = sqlite3.connect('data/aeroequip.db')
cur = conn.cursor()
total = cur.execute('SELECT COUNT(*) FROM config_equipment').fetchone()[0]
with_weight = cur.execute('SELECT COUNT(*) FROM config_equipment WHERE mass_kg IS NOT NULL').fetchone()[0]
with_elec = cur.execute('SELECT COUNT(*) FROM config_equipment WHERE power_kva_normal IS NOT NULL').fetchone()[0]
print(f'Total config_equipment: {total}')
print(f'With weight: {with_weight}')
print(f'With electrical: {with_elec}')
conn.close()
"`

Expected: Counts match original weight_balances and electrical_loads row counts.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/migrate_weight_to_config.py
git commit -m "feat: migration script to copy weight/electrical data to per-config fields"
```

---

### Task 3: Update backend schemas for per-config weight/electrical

**Files:**
- Modify: `backend/app/schemas/equipment.py`

- [ ] **Step 1: Add weight/CG/electrical fields to ConfigEquipmentData schema**

In `backend/app/schemas/equipment.py`, update `ConfigEquipmentData` to include the new fields:

```python
class ConfigEquipmentData(BaseModel):
    """Config-specific attributes for an equipment item."""
    # Display name override
    config_name: str | None = None

    # Position
    zone_id: UUID | None = None
    zone_name: str | None = None
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None
    bus_id: UUID | None = None
    bus_name: str | None = None
    notes: str | None = None

    # Per-config weight & CG
    mass_kg: float | None = None
    cg_x: float | None = None
    cg_y: float | None = None
    cg_z: float | None = None
    inertia_ix: float | None = None
    inertia_iy: float | None = None
    inertia_iz: float | None = None
    inertia_ixy: float | None = None
    inertia_ixz: float | None = None
    inertia_iyz: float | None = None
    weight_target_kg: float | None = None
    overweight_risk: str | None = None

    # Per-config electrical
    power_kva_normal: float | None = None
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None

    # Bonding
    install_method: str | None = None
    bonding_method: str | None = None
    bonding_type: str | None = None
    bonding_resistance: str | None = None
    bonding_position: str | None = None
    in_pace_drawing: bool | None = None
    layout_adjustment: str | None = None
    use_batch0_device: bool | None = None

    # Procurement
    procurement_status: str | None = None
    procurement_location: str | None = None
    planned_delivery_date: str | None = None
    estimated_delivery_date: str | None = None
    procurement_notes: str | None = None
```

- [ ] **Step 2: Add weight/CG/electrical fields to ConfigEquipmentUpdate schema**

```python
class ConfigEquipmentUpdate(BaseModel):
    """Update config-specific fields."""
    config_name: str | None = None
    sta: float | None = None
    wl: float | None = None
    bl: float | None = None
    rack_position: str | None = None
    install_method: str | None = None
    bonding_method: str | None = None
    bonding_type: str | None = None
    bonding_resistance: str | None = None
    bonding_position: str | None = None
    in_pace_drawing: bool | None = None
    layout_adjustment: str | None = None
    use_batch0_device: bool | None = None
    notes: str | None = None

    # Per-config weight & CG
    mass_kg: float | None = None
    cg_x: float | None = None
    cg_y: float | None = None
    cg_z: float | None = None
    inertia_ix: float | None = None
    inertia_iy: float | None = None
    inertia_iz: float | None = None
    inertia_ixy: float | None = None
    inertia_ixz: float | None = None
    inertia_iyz: float | None = None
    weight_target_kg: float | None = None
    overweight_risk: str | None = None

    # Per-config electrical
    power_kva_normal: float | None = None
    power_kva_emergency: float | None = None
    power_kva_max: float | None = None
```

- [ ] **Step 3: Add is_frozen to ConfigResponse schema**

In `backend/app/schemas/configuration.py`, add `is_frozen`:

```python
class ConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    series_id: UUID
    version: str
    status: str
    description: str | None = None
    created_by: UUID | None = None
    locked_at: datetime | None = None
    is_frozen: bool = False
    created_at: datetime
    equipment_count: int = 0
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/equipment.py backend/app/schemas/configuration.py
git commit -m "feat: add per-config weight/CG/electrical fields to Pydantic schemas"
```

---

### Task 4: Update PATCH endpoint to use per-config weight and enforce freeze

**Files:**
- Modify: `backend/app/api/configurations.py:113-176`

- [ ] **Step 1: Update the PATCH endpoint**

Replace the `update_config_equipment` function in `backend/app/api/configurations.py`:

```python
# Frozen master fields that cannot be edited when config is frozen
FROZEN_MASTER_FIELDS = {"name", "part_number", "lin_number"}


@router.patch("/configurations/{config_id}/equipment/{equipment_id}")
async def update_config_equipment(
    config_id: str,
    equipment_id: str,
    body: EquipmentFullUpdate,
    reason: str | None = Query(None, description="变更原因(可选)"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update equipment + config-equipment + weight + electrical in one call.
    
    Weight and electrical data now stored on ConfigEquipment (per-config).
    Also writes AuditLog entries for field-level changes.
    """
    from app.models.audit_log import AuditLog

    # Load config + config_equipment record
    config_result = await db.execute(
        select(Configuration).where(Configuration.id == config_id)
    )
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(selectinload(ConfigEquipmentModel.equipment))
        .where(ConfigEquipmentModel.config_id == config_id, ConfigEquipmentModel.equipment_id == equipment_id)
    )
    ce = result.scalar_one_or_none()
    if not ce:
        raise HTTPException(status_code=404, detail="设备未在该构型中")

    equip = ce.equipment
    old_values = {}
    new_values = {}

    # Update equipment master fields (with freeze check)
    if body.equipment:
        for field, value in body.equipment.model_dump(exclude_unset=True).items():
            if field in ('weight_balance', 'electrical_load'):
                continue
            if config.is_frozen and field in FROZEN_MASTER_FIELDS:
                raise HTTPException(
                    status_code=403,
                    detail=f"构型已冻结，字段 '{field}' 不可修改"
                )
            if hasattr(equip, field):
                old_val = getattr(equip, field)
                if old_val != value:
                    old_values[f"equipment.{field}"] = old_val
                    new_values[f"equipment.{field}"] = value
                    setattr(equip, field, value)

    # Update config_equipment fields (including per-config weight/electrical)
    if body.config_equipment:
        for field, value in body.config_equipment.model_dump(exclude_unset=True).items():
            if hasattr(ce, field):
                old_val = getattr(ce, field)
                if old_val != value:
                    old_values[f"config.{field}"] = _serialize(old_val)
                    new_values[f"config.{field}"] = _serialize(value)
                    setattr(ce, field, value)

    # Legacy: weight_balance in body → write to ConfigEquipment.mass_kg
    if body.weight_balance:
        old_val = ce.mass_kg
        new_val = body.weight_balance.mass_kg
        if old_val != new_val:
            old_values["config.mass_kg"] = old_val
            new_values["config.mass_kg"] = new_val
            ce.mass_kg = new_val
        # Also update global WeightBalance for backward compatibility
        if equip.weight_balance:
            equip.weight_balance.mass_kg = new_val
        else:
            import uuid as _uuid
            wb = WeightBalance(id=str(_uuid.uuid4()), equipment_id=equip.id, mass_kg=new_val)
            db.add(wb)

    # Legacy: electrical_load in body → write to ConfigEquipment fields
    if body.electrical_load:
        for field in ('power_kva_normal', 'power_kva_emergency', 'power_kva_max'):
            new_val = getattr(body.electrical_load, field, None)
            if new_val is not None:
                old_val = getattr(ce, field)
                if old_val != new_val:
                    old_values[f"config.{field}"] = old_val
                    new_values[f"config.{field}"] = new_val
                    setattr(ce, field, new_val)
        # Also update global ElectricalLoad for backward compatibility
        if equip.electrical_load:
            for field, value in body.electrical_load.model_dump(exclude_unset=True).items():
                setattr(equip.electrical_load, field, value)
        else:
            import uuid as _uuid
            el = ElectricalLoad(
                id=str(_uuid.uuid4()), equipment_id=equip.id,
                power_kva_normal=body.electrical_load.power_kva_normal,
                power_kva_emergency=body.electrical_load.power_kva_emergency,
                power_kva_max=body.electrical_load.power_kva_max,
            )
            db.add(el)

    # Write audit log if anything changed
    if old_values:
        import uuid as _uuid
        log = AuditLog(
            id=str(_uuid.uuid4()),
            entity_type="config_equipment",
            entity_id=f"{config_id}:{equipment_id}",
            action="update",
            old_value=old_values,
            new_value=new_values,
            user_id=str(user.id),
            reason=reason,
        )
        db.add(log)

    await db.commit()
    return {"status": "ok"}


def _serialize(val):
    """Convert value to JSON-safe type for audit log."""
    if isinstance(val, date):
        return val.isoformat()
    return val
```

- [ ] **Step 2: Update _to_response to include is_frozen**

```python
def _to_response(data: dict) -> ConfigResponse:
    """Convert service result dict to ConfigResponse."""
    config = data["config"]
    return ConfigResponse(
        id=str(config.id),
        series_id=str(config.series_id),
        version=config.version,
        status=config.status,
        description=config.description,
        created_by=str(config.created_by) if config.created_by else None,
        locked_at=config.locked_at.isoformat() if config.locked_at else None,
        is_frozen=config.is_frozen or False,
        created_at=config.created_at.isoformat(),
        equipment_count=data["equipment_count"],
    )
```

- [ ] **Step 3: Add freeze/unfreeze endpoint**

Add after the existing `lock_configuration` endpoint:

```python
@router.post("/configurations/{config_id}/freeze")
async def freeze_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Freeze a configuration — master fields (name, part_number, lin_number) become read-only."""
    result = await db.execute(select(Configuration).where(Configuration.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    config.is_frozen = True
    await db.commit()
    count = await db.execute(
        select(func.count()).select_from(ConfigEquipmentModel).where(ConfigEquipmentModel.config_id == config_id)
    )
    return _to_response({"config": config, "equipment_count": count.scalar() or 0})


@router.post("/configurations/{config_id}/unfreeze")
async def unfreeze_configuration(
    config_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Unfreeze a configuration."""
    result = await db.execute(select(Configuration).where(Configuration.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    config.is_frozen = False
    await db.commit()
    count = await db.execute(
        select(func.count()).select_from(ConfigEquipmentModel).where(ConfigEquipmentModel.config_id == config_id)
    )
    return _to_response({"config": config, "equipment_count": count.scalar() or 0})
```

- [ ] **Step 4: Add `date` import at top of file**

```python
from datetime import date
from sqlalchemy import select, func
```

- [ ] **Step 5: Verify server starts**

Run: `cd /Users/yanxunmaosmacbook/Documents/设备管理/backend && python -c "from app.main import app; print('OK')"`

Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/configurations.py
git commit -m "feat: PATCH endpoint uses per-config weight, enforces freeze, writes audit log"
```

---

### Task 5: Update equipment list API to return per-config weight

**Files:**
- Modify: `backend/app/api/equipment.py`

- [ ] **Step 1: Update equipment list query to include per-config weight in config_data**

The equipment list endpoint at `GET /api/equipment` currently populates `config_data` from ConfigEquipment. The new weight/electrical fields are already on ConfigEquipment, so they'll be included automatically via the `ConfigEquipmentData` Pydantic schema — **as long as the serialization code maps them**.

Find the section in `backend/app/api/equipment.py` where `config_data` is populated (typically in the response building logic). Ensure the new ConfigEquipment fields (mass_kg, cg_x, etc.) are included in the dict that builds `config_data`.

Read the file first to find the exact serialization logic, then update it to include the new fields. The key change: wherever `config_data` is assembled from a ConfigEquipment row, add:

```python
"mass_kg": ce.mass_kg,
"cg_x": ce.cg_x,
"cg_y": ce.cg_y,
"cg_z": ce.cg_z,
"weight_target_kg": ce.weight_target_kg,
"overweight_risk": ce.overweight_risk,
"power_kva_normal": ce.power_kva_normal,
"power_kva_emergency": ce.power_kva_emergency,
"power_kva_max": ce.power_kva_max,
"config_name": ce.config_name,
```

- [ ] **Step 2: Verify endpoint returns new fields**

Run: `curl -s http://localhost:8000/api/equipment?config_id=<some_config_id>&limit=1 -H "Authorization: Bearer <token>" | python3 -m json.tool | grep mass_kg`

Expected: `"mass_kg": <number or null>`

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/equipment.py
git commit -m "feat: equipment list API returns per-config weight/CG/electrical in config_data"
```

---

### Task 6: Create audit log query API

**Files:**
- Create: `backend/app/api/audit_logs.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create audit log API**

```python
"""Audit log query endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["audit-logs"])


@router.get("/audit-logs")
async def list_audit_logs(
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Query audit log entries, newest first."""
    query = select(AuditLog).order_by(desc(AuditLog.timestamp))

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.where(AuditLog.entity_id == entity_id)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    # Fetch usernames
    user_ids = {log.user_id for log in logs}
    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    user_map = {str(u.id): u.display_name or u.username for u in users_result.scalars().all()}

    return [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "user_name": user_map.get(log.user_id, "unknown"),
            "reason": log.reason,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]
```

- [ ] **Step 2: Register router in main.py**

Add to `backend/app/main.py`:

```python
from app.api.audit_logs import router as audit_logs_router
```

And in the router registration section:

```python
app.include_router(audit_logs_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/audit_logs.py backend/app/main.py
git commit -m "feat: audit log query API endpoint"
```

---

### Task 7: Create Equipment Library API

**Files:**
- Create: `backend/app/api/equipment_library.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create equipment library endpoints**

The Equipment table already serves as the master library. This API provides a library-oriented view: list all unique equipment types, show which configs contain each.

```python
"""Equipment Library — master equipment type registry."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.equipment import Equipment
from app.models.configuration import ConfigEquipment, Configuration
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["equipment-library"])


@router.get("/equipment-library")
async def list_equipment_library(
    search: str | None = Query(None),
    ata_chapter: str | None = Query(None),
    offset: int = Query(0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all equipment types in the master library with config usage counts."""
    # Base query
    query = select(Equipment).order_by(Equipment.ata_chapter, Equipment.name)

    if search:
        query = query.where(
            Equipment.name.ilike(f"%{search}%") | Equipment.part_number.ilike(f"%{search}%")
        )
    if ata_chapter:
        query = query.where(Equipment.ata_chapter == ata_chapter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Fetch page
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    equipment_list = result.scalars().all()

    # For each equipment, count how many configs use it
    eq_ids = [e.id for e in equipment_list]
    if eq_ids:
        usage_query = select(
            ConfigEquipment.equipment_id,
            func.count(ConfigEquipment.config_id).label("config_count"),
        ).where(
            ConfigEquipment.equipment_id.in_(eq_ids)
        ).group_by(ConfigEquipment.equipment_id)

        usage_result = await db.execute(usage_query)
        usage_map = {row.equipment_id: row.config_count for row in usage_result}
    else:
        usage_map = {}

    items = [
        {
            "id": e.id,
            "part_number": e.part_number,
            "name": e.name,
            "ata_chapter": e.ata_chapter,
            "equipment_type": e.equipment_type,
            "status": e.status,
            "is_electrical": e.is_electrical,
            "config_count": usage_map.get(e.id, 0),
        }
        for e in equipment_list
    ]

    return {"items": items, "total": total, "offset": offset, "limit": limit}


@router.get("/equipment-library/{equipment_id}/configs")
async def get_equipment_configs(
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Show which configurations contain this equipment, with per-config names and weight."""
    equip = await db.get(Equipment, equipment_id)
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")

    result = await db.execute(
        select(ConfigEquipment, Configuration)
        .join(Configuration, ConfigEquipment.config_id == Configuration.id)
        .where(ConfigEquipment.equipment_id == equipment_id)
    )

    configs = [
        {
            "config_id": ce.config_id,
            "config_version": config.version,
            "config_name": ce.config_name or equip.name,
            "mass_kg": ce.mass_kg,
            "is_frozen": config.is_frozen,
        }
        for ce, config in result.all()
    ]

    return {
        "equipment": {
            "id": equip.id,
            "part_number": equip.part_number,
            "master_name": equip.name,
            "ata_chapter": equip.ata_chapter,
            "equipment_type": equip.equipment_type,
        },
        "configs": configs,
    }
```

- [ ] **Step 2: Register in main.py**

```python
from app.api.equipment_library import router as equipment_library_router
```

```python
app.include_router(equipment_library_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/equipment_library.py backend/app/main.py
git commit -m "feat: equipment library API — master registry with config usage"
```

---

### Task 8: Update frontend types for per-config weight

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add weight/CG/electrical fields to ConfigEquipmentData**

```typescript
export interface ConfigEquipmentData {
  // Display name override
  config_name: string | null;

  // Position
  zone_id: string | null;
  zone_name: string | null;
  sta: number | null;
  wl: number | null;
  bl: number | null;
  rack_position: string | null;
  bus_id: string | null;
  bus_name: string | null;
  notes: string | null;

  // Per-config weight & CG
  mass_kg: number | null;
  cg_x: number | null;
  cg_y: number | null;
  cg_z: number | null;
  inertia_ix: number | null;
  inertia_iy: number | null;
  inertia_iz: number | null;
  inertia_ixy: number | null;
  inertia_ixz: number | null;
  inertia_iyz: number | null;
  weight_target_kg: number | null;
  overweight_risk: string | null;

  // Per-config electrical
  power_kva_normal: number | null;
  power_kva_emergency: number | null;
  power_kva_max: number | null;

  // Bonding
  install_method: string | null;
  bonding_method: string | null;
  bonding_type: string | null;
  bonding_resistance: string | null;
  bonding_position: string | null;
  in_pace_drawing: boolean | null;
  layout_adjustment: string | null;
  use_batch0_device: boolean | null;

  // Procurement
  procurement_status: string | null;
  procurement_location: string | null;
  planned_delivery_date: string | null;
  estimated_delivery_date: string | null;
  procurement_notes: string | null;
}
```

- [ ] **Step 2: Add is_frozen to Configuration type**

```typescript
export interface Configuration {
  id: string;
  series_id: string;
  version: string;
  status: string;
  description: string | null;
  created_by: string | null;
  locked_at: string | null;
  is_frozen: boolean;
  created_at: string;
  equipment_count: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: frontend types include per-config weight/CG and freeze flag"
```

---

### Task 9: Update frontend components to use per-config weight

**Files:**
- Modify: `frontend/src/components/equipment/ExpandableRow.tsx`
- Modify: `frontend/src/components/workstation/tabs/OverviewTab.tsx`
- Modify: `frontend/src/components/workstation/tabs/WeightTab.tsx`

- [ ] **Step 1: Update ExpandableRow to read weight from config_data**

In `frontend/src/components/equipment/ExpandableRow.tsx`, change the weight tab to read from `config_data` instead of `weight_balance`:

```tsx
{activeTab === 'weight' && (
  <div className="grid grid-cols-4 gap-x-6 gap-y-3">
    <Field label="实测重量" value={display(e.config_data?.mass_kg?.toFixed(2), ' kg')} highlight />
    <Field label="重量指标" value={display(e.config_data?.weight_target_kg?.toFixed(2), ' kg')} highlight />
    <Field label="重心X" value={display(e.config_data?.cg_x?.toFixed(1), ' mm')} />
    <Field label="重心Y" value={display(e.config_data?.cg_y?.toFixed(1), ' mm')} />
    <Field label="重心Z" value={display(e.config_data?.cg_z?.toFixed(1), ' mm')} />
    <Field label="尺寸" value={display(e.dimensions_mm)} />
    <Field label="STA" value={display(e.config_data?.sta)} highlight />
    <Field label="BL" value={display(e.config_data?.bl)} />
    <Field label="WL" value={display(e.config_data?.wl)} />
    <Field label="安装方式" value={display(e.config_data?.install_method)} />
    <Field label="布置调整" value={display(e.config_data?.layout_adjustment)} />
    <Field label="PACE图纸" value={displayBool(e.config_data?.in_pace_drawing)} />
    <Field label="搭接位置" value={display(e.config_data?.bonding_position)} />
    <Field label="负责人" value={display(e.responsible_person)} />
    <Field label="超重风险" value={display(e.config_data?.overweight_risk)} />
  </div>
)}
```

Also update the electrical tab to prefer config_data:

```tsx
{activeTab === 'electrical' && (
  <div className="grid grid-cols-4 gap-x-6 gap-y-3">
    <Field label="供电电压" value={display(e.power_voltage)} highlight />
    <Field label="正常功耗" value={display(e.config_data?.power_kva_normal?.toFixed(2), ' kW')} highlight />
    <Field label="应急功耗" value={display(e.config_data?.power_kva_emergency?.toFixed(2), ' kW')} />
    <Field label="峰值功耗" value={display(e.config_data?.power_kva_max?.toFixed(2), ' kW')} />
    <Field label="供电余度" value={display(e.power_redundancy)} />
    <Field label="电压范围" value={display(e.voltage_range)} />
    <Field label="用电功率" value={display(e.power_watts)} />
    <Field label="搭接方式" value={display(e.config_data?.bonding_method)} />
    <Field label="搭接类型" value={display(e.config_data?.bonding_type)} />
    <Field label="搭接阻值" value={display(e.config_data?.bonding_resistance)} />
    <Field label="是否电设备" value={displayBool(e.is_electrical)} />
    <Field label="一级用电" value={displayBool(e.is_primary_electrical)} />
    <Field label="EICD" value={displayBool(e.has_eicd)} />
  </div>
)}
```

- [ ] **Step 2: Update OverviewTab preview panel weight display**

In the preview panel component within OverviewTab, change weight references from `equipment.weight_balance?.mass_kg` to `equipment.config_data?.mass_kg`.

- [ ] **Step 3: Update WeightTab to use per-config weight**

In WeightTab, wherever equipment weight is referenced (treemap, statistics), change from `e.weight_balance?.mass_kg` to `e.config_data?.mass_kg`.

- [ ] **Step 4: Update EquipmentTable column rendering**

In `frontend/src/components/equipment/EquipmentTable.tsx`, the weight column should read from config_data:

Change the weight column render from:
```tsx
e.weight_balance?.mass_kg?.toFixed(1)
```
to:
```tsx
(e.config_data?.mass_kg ?? e.weight_balance?.mass_kg)?.toFixed(1)
```

This provides backward compatibility: prefer config_data, fall back to weight_balance.

- [ ] **Step 5: Verify all views display weight correctly**

Start dev server: `cd /Users/yanxunmaosmacbook/Documents/设备管理/frontend && npm run dev`

Check:
1. Equipment table shows weight values
2. Expanded row shows weight data
3. Weight tab visualization uses correct data
4. Overview preview panel shows weight

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/equipment/ExpandableRow.tsx frontend/src/components/equipment/EquipmentTable.tsx frontend/src/components/workstation/tabs/OverviewTab.tsx frontend/src/components/workstation/tabs/WeightTab.tsx
git commit -m "feat: frontend reads weight/electrical from per-config data"
```

---

### Task 10: Create frontend API clients for audit logs and equipment library

**Files:**
- Create: `frontend/src/api/audit-logs.ts`
- Create: `frontend/src/api/equipment-library.ts`

- [ ] **Step 1: Create audit log API client**

```typescript
import client from './client';

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  user_name: string;
  reason: string | null;
  timestamp: string;
}

export async function listAuditLogs(params: {
  entity_type?: string;
  entity_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const { data } = await client.get('/audit-logs', { params });
  return data;
}
```

- [ ] **Step 2: Create equipment library API client**

```typescript
import client from './client';

export interface LibraryEquipment {
  id: string;
  part_number: string;
  name: string;
  ata_chapter: string;
  equipment_type: string;
  status: string;
  is_electrical: boolean | null;
  config_count: number;
}

export interface LibraryListResponse {
  items: LibraryEquipment[];
  total: number;
  offset: number;
  limit: number;
}

export interface LibraryConfigUsage {
  config_id: string;
  config_version: string;
  config_name: string;
  mass_kg: number | null;
  is_frozen: boolean;
}

export interface LibraryEquipmentDetail {
  equipment: {
    id: string;
    part_number: string;
    master_name: string;
    ata_chapter: string;
    equipment_type: string;
  };
  configs: LibraryConfigUsage[];
}

export async function listLibraryEquipment(params: {
  search?: string;
  ata_chapter?: string;
  offset?: number;
  limit?: number;
}): Promise<LibraryListResponse> {
  const { data } = await client.get('/equipment-library', { params });
  return data;
}

export async function getEquipmentConfigs(equipmentId: string): Promise<LibraryEquipmentDetail> {
  const { data } = await client.get(`/equipment-library/${equipmentId}/configs`);
  return data;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/audit-logs.ts frontend/src/api/equipment-library.ts
git commit -m "feat: frontend API clients for audit logs and equipment library"
```

---

### Task 11: Create Equipment Library page

**Files:**
- Create: `frontend/src/pages/EquipmentLibraryPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create EquipmentLibraryPage**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Database, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { listLibraryEquipment, getEquipmentConfigs, type LibraryEquipment, type LibraryEquipmentDetail } from '@/api/equipment-library';

export function EquipmentLibraryPage() {
  const [data, setData] = useState<LibraryEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<LibraryEquipmentDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLibraryEquipment({ search: search || undefined, limit: 500 });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (eq: LibraryEquipment) => {
    const res = await getEquipmentConfigs(eq.id);
    setDetail(res);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">设备库</h2>
          <span className="text-sm text-muted-foreground">共 {total} 种设备类型</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索件号或名称..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">件号</th>
                <th className="text-left px-4 py-2 font-medium">设备名称</th>
                <th className="text-left px-4 py-2 font-medium">ATA</th>
                <th className="text-left px-4 py-2 font-medium">类型</th>
                <th className="text-center px-4 py-2 font-medium">使用构型数</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((eq) => (
                <tr
                  key={eq.id}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => openDetail(eq)}
                >
                  <td className="px-4 py-2 font-mono text-xs">{eq.part_number}</td>
                  <td className="px-4 py-2">{eq.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{eq.ata_chapter}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-xs">{eq.equipment_type}</Badge>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant={eq.config_count > 0 ? 'default' : 'secondary'} className="text-xs">
                      {eq.config_count}
                    </Badge>
                  </td>
                  <td className="px-2">
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.equipment.master_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">件号：</span>{detail.equipment.part_number}</div>
                <div><span className="text-muted-foreground">ATA：</span>{detail.equipment.ata_chapter}</div>
                <div><span className="text-muted-foreground">类型：</span>{detail.equipment.equipment_type}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">使用该设备的构型 ({detail.configs.length})</h4>
                <div className="space-y-1">
                  {detail.configs.map((c) => (
                    <div key={c.config_id} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span>{c.config_version}</span>
                        {c.config_name !== detail.equipment.master_name && (
                          <span className="text-xs text-muted-foreground">({c.config_name})</span>
                        )}
                        {c.is_frozen && <Badge variant="destructive" className="text-[10px] px-1">冻结</Badge>}
                      </div>
                      <span className="text-muted-foreground">
                        {c.mass_kg != null ? `${c.mass_kg.toFixed(1)} kg` : '-'}
                      </span>
                    </div>
                  ))}
                  {detail.configs.length === 0 && (
                    <p className="text-sm text-muted-foreground">未在任何构型中使用</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Add route in App.tsx**

Add import and route:

```tsx
import { EquipmentLibraryPage } from './pages/EquipmentLibraryPage';
```

Add route inside the protected routes:

```tsx
<Route path="/equipment-library" element={<EquipmentLibraryPage />} />
```

- [ ] **Step 3: Add sidebar menu item in AppLayout.tsx**

Add "设备库" as a top-level menu item in the sidebar navigation, before the existing "构型查看" item:

```tsx
{ key: '/equipment-library', label: '设备库', icon: Database }
```

Import `Database` from `lucide-react`.

- [ ] **Step 4: Verify page loads**

Navigate to `/equipment-library` in the browser. Should show a searchable table of all equipment types with config usage counts.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/EquipmentLibraryPage.tsx frontend/src/App.tsx frontend/src/components/layout/AppLayout.tsx
git commit -m "feat: equipment library page with config usage detail"
```

---

### Task 12: Create ChangeLogViewer component and integrate with edit form

**Files:**
- Create: `frontend/src/components/equipment/ChangeLogViewer.tsx`
- Modify: `frontend/src/components/equipment/EquipmentForm.tsx`

- [ ] **Step 1: Create ChangeLogViewer component**

```tsx
import { useState, useEffect } from 'react';
import { Loader2, History } from 'lucide-react';
import { listAuditLogs, type AuditLogEntry } from '@/api/audit-logs';

interface Props {
  entityType: string;
  entityId: string;
}

function formatFieldName(key: string): string {
  const map: Record<string, string> = {
    'config.mass_kg': '重量(kg)',
    'config.cg_x': '重心X',
    'config.cg_y': '重心Y',
    'config.cg_z': '重心Z',
    'config.weight_target_kg': '重量指标',
    'config.power_kva_normal': '正常功耗',
    'config.sta': 'STA',
    'config.wl': 'WL',
    'config.bl': 'BL',
    'equipment.name': '设备名称',
    'equipment.part_number': '件号',
    'equipment.status': '状态',
  };
  return map[key] || key.replace('config.', '').replace('equipment.', '');
}

export function ChangeLogViewer({ entityType, entityId }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    listAuditLogs({ entity_type: entityType, entity_id: entityId, limit: 50 })
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin" /></div>;
  if (logs.length === 0) return <p className="text-sm text-muted-foreground py-4">暂无变更记录</p>;

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="border rounded-lg p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-3.5 text-muted-foreground" />
              <span className="font-medium">{log.user_name}</span>
              <span className="text-muted-foreground">{log.action}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : ''}
            </span>
          </div>
          {log.reason && (
            <p className="text-xs text-muted-foreground pl-5">原因: {log.reason}</p>
          )}
          {log.old_value && log.new_value && (
            <div className="pl-5 space-y-0.5">
              {Object.keys(log.new_value).map((key) => (
                <div key={key} className="text-xs">
                  <span className="text-muted-foreground">{formatFieldName(key)}: </span>
                  <span className="line-through text-red-400">{String(log.old_value![key] ?? '-')}</span>
                  <span className="mx-1">→</span>
                  <span className="text-green-600">{String(log.new_value![key] ?? '-')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add change reason field and change log tab to EquipmentForm**

In `frontend/src/components/equipment/EquipmentForm.tsx`, add:

1. A `reason` text input at the bottom of the form (before submit button):
```tsx
<div className="space-y-1">
  <label className="text-xs text-muted-foreground">变更原因(可选)</label>
  <Input
    placeholder="填写变更原因..."
    value={reason}
    onChange={(e) => setReason(e.target.value)}
  />
</div>
```

2. Pass `reason` as query parameter when saving:
```tsx
const url = `/configurations/${configId}/equipment/${equipId}?reason=${encodeURIComponent(reason)}`;
```

3. Add a "变更记录" tab that shows `<ChangeLogViewer entityType="config_equipment" entityId={`${configId}:${equipId}`} />` when editing an existing equipment.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/equipment/ChangeLogViewer.tsx frontend/src/components/equipment/EquipmentForm.tsx
git commit -m "feat: change log viewer component with reason field in edit form"
```

---

### Task 13: Add freeze/unfreeze UI to configuration management

**Files:**
- Modify: `frontend/src/api/configurations.ts`
- Modify: `frontend/src/pages/ConfigPage.tsx`

- [ ] **Step 1: Add freeze API calls**

In `frontend/src/api/configurations.ts`, add:

```typescript
export async function freezeConfig(id: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/freeze`);
  return data;
}

export async function unfreezeConfig(id: string): Promise<Configuration> {
  const { data } = await client.post(`/configurations/${id}/unfreeze`);
  return data;
}
```

- [ ] **Step 2: Add freeze button to ConfigPage**

In the configuration list on ConfigPage, add a freeze/unfreeze toggle button for each config:

```tsx
<Button
  variant={config.is_frozen ? "destructive" : "outline"}
  size="sm"
  onClick={() => handleFreeze(config)}
>
  {config.is_frozen ? '解冻' : '冻结基线'}
</Button>
```

Handler:
```tsx
const handleFreeze = async (config: Configuration) => {
  if (config.is_frozen) {
    await unfreezeConfig(config.id);
  } else {
    await freezeConfig(config.id);
  }
  loadConfigs();
};
```

- [ ] **Step 3: Show freeze badge in GlobalNav config selector**

When the active config is frozen, show a small "冻结" badge next to the config name in GlobalNav.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/configurations.ts frontend/src/pages/ConfigPage.tsx frontend/src/components/layout/GlobalNav.tsx
git commit -m "feat: freeze/unfreeze UI for configuration baseline management"
```

---

### Task 14: Update dashboard stats for per-config weight

**Files:**
- Modify: `backend/app/api/dashboard.py`

- [ ] **Step 1: Update dashboard query to use ConfigEquipment weight**

In `backend/app/api/dashboard.py`, find where weight statistics are calculated (total weight, weight distribution, etc.). Change the query from joining `weight_balances` to reading `config_equipment.mass_kg` directly.

Replace:
```python
# Old: join WeightBalance for weight data
select(WeightBalance.mass_kg).join(Equipment).join(ConfigEquipment)
```

With:
```python
# New: read directly from ConfigEquipment
select(ConfigEquipment.mass_kg).where(
    ConfigEquipment.config_id == config_id,
    ConfigEquipment.mass_kg.isnot(None)
)
```

Apply the same change to all weight-related statistics: total weight sum, weight distribution by ATA, CG envelope calculations.

- [ ] **Step 2: Verify dashboard loads**

Run: `curl -s http://localhost:8000/api/dashboard/stats?config_id=<id> -H "Authorization: Bearer <token>" | python3 -m json.tool`

Verify weight statistics match expected values.

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/dashboard.py
git commit -m "feat: dashboard uses per-config weight from config_equipment"
```

---

### Task 15: Update Excel export/import for per-config weight

**Files:**
- Modify: `backend/app/api/excel_export.py`
- Modify: `backend/app/api/excel_import.py`

- [ ] **Step 1: Update Excel export to use ConfigEquipment weight**

In `backend/app/api/excel_export.py`, change weight columns to read from ConfigEquipment instead of WeightBalance:

Replace weight column reading from `equip.weight_balance.mass_kg` with `ce.mass_kg` (where `ce` is the ConfigEquipment record).

Add new export columns for CG and weight target:
```python
{"header": "重心X(mm)", "value": ce.cg_x},
{"header": "重心Y(mm)", "value": ce.cg_y},
{"header": "重心Z(mm)", "value": ce.cg_z},
{"header": "重量指标(kg)", "value": ce.weight_target_kg},
```

Similarly update electrical columns to read from ConfigEquipment.

- [ ] **Step 2: Update Excel import to write to ConfigEquipment weight**

In `backend/app/api/excel_import.py`, when importing weight data, write to `ConfigEquipment.mass_kg` instead of creating/updating WeightBalance rows. Also write to WeightBalance for backward compatibility.

Add import handling for new columns: cg_x, cg_y, cg_z, weight_target_kg.

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/excel_export.py backend/app/api/excel_import.py
git commit -m "feat: Excel export/import uses per-config weight fields"
```

---

## End-to-End Verification

After all tasks complete:

1. **Data integrity**: Run migration script, verify weight data migrated correctly
2. **API**: Test PATCH with weight update → check ConfigEquipment.mass_kg changed, AuditLog created
3. **Freeze**: Freeze a config → try editing name → expect 403 → unfreeze → edit succeeds
4. **Equipment Library**: Navigate to /equipment-library → see all equipment types → click one → see config usage
5. **Change Log**: Edit a device → see change log entry with old/new values and reason
6. **Dashboard**: Verify weight statistics use per-config data
7. **Export/Import**: Export → check weight columns → re-import → verify data round-trips

---

## Phase 2-4 Roadmap (to be detailed before each phase)

### Phase 2: Domain Entities (P1)
- Task: MICD records model + API + frontend (1:N with ConfigEquipment)
- Task: DO-160 multi-category records model + API + frontend (1:N, 25 fixed categories)
- Task: Physical asset management model + API + frontend (1:1, 8-step checklist)
- Task: Weight reduction dashboard (cross-config diff computation + visualizations)
- Task: PACE import (batch weight target import from PACE export file)

### Phase 3: Access Control & Collaboration (P2)
- Task: Enhanced user model (roles: PMO, 系统集成, 构型管理员, 专业负责人, 专业人员, 只读)
- Task: Field-level permission enforcement
- Task: In-app notification center (站内信)
- Task: Word report export
- Task: Equipment constraint relationships (M:N, layout coordination)
- Task: Change reason field UI polish

### Phase 4: Advanced Features (P3-P4)
- Task: AI report generation (template-based)
- Task: Image attachment upload for MICD
- Task: MICD workload statistics dashboard
- Task: Report reverse parsing (Word/PDF → data backfill) — stub
- Task: Configuration platform interface reservation (UI + API stubs)
- Task: EICD integration — documented as separate system
