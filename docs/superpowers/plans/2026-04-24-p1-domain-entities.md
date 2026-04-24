# Phase 2: Domain Entities (P1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new domain entities (MICD records, DO-160 multi-category qualification, physical asset lifecycle) and build a weight reduction dashboard that compares device weights across configurations.

**Architecture:** Three new SQLAlchemy models linked to ConfigEquipment. MICD and DO-160 are 1:N (one equipment can have multiple records). Physical asset fields are added directly to ConfigEquipment (7 new columns for the 8-step lifecycle checklist). Weight reduction is a read-only computation endpoint that matches equipment across configs by `part_number` and diffs their `mass_kg`. Frontend adds new management tabs and dashboard visualizations.

**Tech Stack:** FastAPI, SQLAlchemy (async), SQLite + aiosqlite, React 18, TypeScript, Tailwind CSS 4, ShadCN/UI, Zustand

**Dependencies:** Requires Phase 1 (P0) completion — ConfigEquipment per-config weight fields, equipment library, freeze mechanism.

**Key File Map:**

| File | Responsibility |
|------|---------------|
| `backend/app/models/micd.py` | NEW: MICDRecord model |
| `backend/app/models/do160.py` | NEW: DO160Record model with 25-category enum |
| `backend/app/models/configuration.py` | Add physical asset lifecycle fields to ConfigEquipment |
| `backend/app/api/micd.py` | NEW: MICD CRUD endpoints |
| `backend/app/api/do160.py` | NEW: DO-160 CRUD endpoints |
| `backend/app/api/weight_reduction.py` | NEW: Weight reduction computation endpoint |
| `backend/scripts/migrate_p1_entities.py` | NEW: Migration script for new tables + CE columns |
| `frontend/src/types/index.ts` | Add MICD, DO160, PhysicalAsset types |
| `frontend/src/api/micd.ts` | NEW: MICD API client |
| `frontend/src/api/do160.ts` | NEW: DO-160 API client |
| `frontend/src/api/weight-reduction.ts` | NEW: Weight reduction API client |
| `frontend/src/components/workstation/tabs/MICDTab.tsx` | NEW: MICD management tab |
| `frontend/src/components/workstation/tabs/DO160Tab.tsx` | REWRITE: Multi-category DO-160 view |
| `frontend/src/pages/ProcurementPage.tsx` | Extend with physical asset lifecycle fields |
| `frontend/src/components/workstation/tabs/WeightTab.tsx` | Add reduction comparison section |
| `frontend/src/pages/DashboardPage.tsx` | Add reduction summary card |

---

### Task 1: Create MICDRecord model + DO160Record model + migration

**Files:**
- Create: `backend/app/models/micd.py`
- Create: `backend/app/models/do160.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/models/configuration.py` (add physical asset fields + relationships)
- Create: `backend/scripts/migrate_p1_entities.py`

- [ ] **Step 1: Create MICDRecord model**

Create `backend/app/models/micd.py`:

```python
import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, Float, Boolean, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MICDRecord(Base):
    __tablename__ = "micd_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属构型ID")
    equipment_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属设备ID")

    # MICD fields (from requirements 5.1)
    installation_structure_id: Mapped[str | None] = mapped_column(String(100), comment="安装结构件编号")
    bonding_surface: Mapped[str | None] = mapped_column(String(200), comment="电搭接面")
    fastener_brand: Mapped[str | None] = mapped_column(String(100), comment="紧固件牌号")
    fastener_count: Mapped[int | None] = mapped_column(comment="紧固件数量")
    fastener_team: Mapped[str | None] = mapped_column(String(100), comment="紧固件归属团队")
    bracket_model: Mapped[str | None] = mapped_column(String(100), comment="设备托架型号")
    bracket_source: Mapped[str | None] = mapped_column(String(20), comment="托架来源: 自制/外购")
    bracket_mass_kg: Mapped[float | None] = mapped_column(Float, comment="托架重量(kg)")
    screw_spec: Mapped[str | None] = mapped_column(String(100), comment="螺钉规格")
    wire_bonding_size: Mapped[str | None] = mapped_column(String(100), comment="线搭接接口尺寸")
    model_config: Mapped[str | None] = mapped_column(String(100), comment="数模采用构型")
    has_tolerance_drawing: Mapped[bool | None] = mapped_column(Boolean, comment="是否包含公差尺寸工程图")
    tolerance_drawing_url: Mapped[str | None] = mapped_column(String(500), comment="公差尺寸工程图附件路径")

    # Confirmation status (requirements 5.2)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否已签字确认MICD")
    confirmed_at: Mapped[date | None] = mapped_column(Date, comment="确认日期")
    confirmed_by: Mapped[str | None] = mapped_column(String(50), comment="确认人")

    notes: Mapped[str | None] = mapped_column(Text, comment="备注")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 2: Create DO160Record model**

Create `backend/app/models/do160.py`:

```python
import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# DO-160 test categories (~25 sections from RTCA DO-160)
DO160_CATEGORIES = (
    "sec4_temperature",       # 第4章 温度
    "sec5_altitude",          # 第5章 高度
    "sec6_temp_variation",    # 第6章 温度变化
    "sec7_humidity",          # 第7章 湿度
    "sec8_shock",             # 第8章 冲击
    "sec9_vibration",         # 第9章 振动
    "sec10_explosion",        # 第10章 防爆
    "sec11_waterproof",       # 第11章 防水
    "sec12_fluids",           # 第12章 流体敏感性
    "sec13_sand_dust",        # 第13章 沙尘
    "sec14_fungus",           # 第14章 霉菌
    "sec15_salt_spray",       # 第15章 盐雾
    "sec16_magnetic",         # 第16章 磁效应
    "sec17_grounding",        # 第17章 接地
    "sec18_ac_power",         # 第18章 交流供电
    "sec19_induced_signal",   # 第19章 感应信号敏感度
    "sec20_rf_susceptibility",# 第20章 射频敏感度
    "sec21_rf_emission",      # 第21章 射频发射
    "sec22_lightning_direct",  # 第22章 雷电直接效应
    "sec23_lightning_indirect",# 第23章 雷电间接效应
    "sec24_icing",            # 第24章 结冰
    "sec25_esd",              # 第25章 静电放电
    "sec26_fire",             # 第26章 防火
    "sec27_smoke",            # 第27章 烟雾
)

# Human-readable labels
DO160_CATEGORY_LABELS = {
    "sec4_temperature": "温度(第4章)",
    "sec5_altitude": "高度(第5章)",
    "sec6_temp_variation": "温度变化(第6章)",
    "sec7_humidity": "湿度(第7章)",
    "sec8_shock": "冲击(第8章)",
    "sec9_vibration": "振动(第9章)",
    "sec10_explosion": "防爆(第10章)",
    "sec11_waterproof": "防水(第11章)",
    "sec12_fluids": "流体敏感性(第12章)",
    "sec13_sand_dust": "沙尘(第13章)",
    "sec14_fungus": "霉菌(第14章)",
    "sec15_salt_spray": "盐雾(第15章)",
    "sec16_magnetic": "磁效应(第16章)",
    "sec17_grounding": "接地(第17章)",
    "sec18_ac_power": "交流供电(第18章)",
    "sec19_induced_signal": "感应信号敏感度(第19章)",
    "sec20_rf_susceptibility": "射频敏感度(第20章)",
    "sec21_rf_emission": "射频发射(第21章)",
    "sec22_lightning_direct": "雷电直接效应(第22章)",
    "sec23_lightning_indirect": "雷电间接效应(第23章)",
    "sec24_icing": "结冰(第24章)",
    "sec25_esd": "静电放电(第25章)",
    "sec26_fire": "防火(第26章)",
    "sec27_smoke": "烟雾(第27章)",
}

COMPLIANCE_STATUS = ("compliant", "non_compliant", "pending", "not_applicable")


class DO160Record(Base):
    __tablename__ = "do160_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属构型ID")
    equipment_id: Mapped[str] = mapped_column(String(36), index=True, comment="所属设备ID")

    test_category: Mapped[str] = mapped_column(String(30), index=True, comment="DO-160测试类别(sec4_temperature等)")
    design_level: Mapped[str | None] = mapped_column(String(50), comment="设计要求等级(如A1, B2)")
    qual_level: Mapped[str | None] = mapped_column(String(50), comment="鉴定等级")
    compliance_status: Mapped[str] = mapped_column(String(20), default="pending", comment="鉴定状态: compliant/non_compliant/pending/not_applicable")
    qual_report_number: Mapped[str | None] = mapped_column(String(200), comment="鉴定报告编号")
    notes: Mapped[str | None] = mapped_column(Text, comment="备注")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 3: Add physical asset lifecycle fields to ConfigEquipment**

In `backend/app/models/configuration.py`, add after the existing procurement fields:

```python
    # Physical asset lifecycle (requirements 7.1) — extends procurement tracking
    actual_arrival_date: Mapped[date | None] = mapped_column(Date, comment="实际到货日期")
    micd_confirmed: Mapped[bool | None] = mapped_column(comment="MICD是否已签署确认")
    structure_ready: Mapped[bool | None] = mapped_column(comment="实物是否已开口(结构准备完成)")
    installation_ready: Mapped[bool | None] = mapped_column(comment="设备是否达到安装要求")
    planned_install_date: Mapped[date | None] = mapped_column(Date, comment="计划上机日期")
    actual_install_date: Mapped[date | None] = mapped_column(Date, comment="实际上机日期")
```

Note: `ready_for_aircraft` (达到装机要求) is computed: `procurement_status == 'delivered' AND micd_confirmed AND structure_ready AND installation_ready`.

- [ ] **Step 4: Update model registry**

In `backend/app/models/__init__.py`, add:

```python
from app.models.micd import MICDRecord
from app.models.do160 import DO160Record
```

And add to `__all__`: `"MICDRecord", "DO160Record"`

- [ ] **Step 5: Write migration script**

Create `backend/scripts/migrate_p1_entities.py`:

```python
"""Create P1 tables (micd_records, do160_records) and add physical asset columns.

Run: python -m scripts.migrate_p1_entities
"""
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

    # 1. Create micd_records table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS micd_records (
            id VARCHAR(36) PRIMARY KEY,
            config_id VARCHAR(36) NOT NULL,
            equipment_id VARCHAR(36) NOT NULL,
            installation_structure_id VARCHAR(100),
            bonding_surface VARCHAR(200),
            fastener_brand VARCHAR(100),
            fastener_count INTEGER,
            fastener_team VARCHAR(100),
            bracket_model VARCHAR(100),
            bracket_source VARCHAR(20),
            bracket_mass_kg FLOAT,
            screw_spec VARCHAR(100),
            wire_bonding_size VARCHAR(100),
            model_config VARCHAR(100),
            has_tolerance_drawing BOOLEAN,
            tolerance_drawing_url VARCHAR(500),
            is_confirmed BOOLEAN DEFAULT 0,
            confirmed_at DATE,
            confirmed_by VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_micd_config ON micd_records(config_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_micd_equipment ON micd_records(equipment_id)")
    print("  Created table: micd_records")

    # 2. Create do160_records table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS do160_records (
            id VARCHAR(36) PRIMARY KEY,
            config_id VARCHAR(36) NOT NULL,
            equipment_id VARCHAR(36) NOT NULL,
            test_category VARCHAR(30) NOT NULL,
            design_level VARCHAR(50),
            qual_level VARCHAR(50),
            compliance_status VARCHAR(20) DEFAULT 'pending',
            qual_report_number VARCHAR(200),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_config ON do160_records(config_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_equipment ON do160_records(equipment_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_do160_category ON do160_records(test_category)")
    print("  Created table: do160_records")

    # 3. Add physical asset columns to config_equipment
    ce_cols = {row[1] for row in cur.execute("PRAGMA table_info(config_equipment)").fetchall()}
    new_ce_cols = [
        ("actual_arrival_date", "DATE"),
        ("micd_confirmed", "BOOLEAN"),
        ("structure_ready", "BOOLEAN"),
        ("installation_ready", "BOOLEAN"),
        ("planned_install_date", "DATE"),
        ("actual_install_date", "DATE"),
    ]
    for col_name, col_type in new_ce_cols:
        if col_name not in ce_cols:
            cur.execute(f"ALTER TABLE config_equipment ADD COLUMN {col_name} {col_type}")
            print(f"  Added column: config_equipment.{col_name}")

    # 4. Migrate existing DO-160 temperature data from equipment table to do160_records
    # The equipment table has: do160_temp_design_level, do160_temp_qual_level, do160_temp_compliance
    import uuid as _uuid
    rows = cur.execute("""
        SELECT ce.config_id, ce.equipment_id,
               e.do160_temp_design_level, e.do160_temp_qual_level, e.do160_temp_compliance
        FROM config_equipment ce
        JOIN equipment e ON e.id = ce.equipment_id
        WHERE e.do160_temp_design_level IS NOT NULL
           OR e.do160_temp_qual_level IS NOT NULL
           OR e.do160_temp_compliance IS NOT NULL
    """).fetchall()

    migrated = 0
    for config_id, equipment_id, design_level, qual_level, compliance_text in rows:
        # Normalize compliance text to status enum
        status = "pending"
        if compliance_text:
            text_lower = compliance_text.lower().strip()
            if "符合" in text_lower and "不" not in text_lower:
                status = "compliant"
            elif "不符合" in text_lower or "不满足" in text_lower:
                status = "non_compliant"
            elif "待" in text_lower or "确认" in text_lower:
                status = "pending"

        cur.execute("""
            INSERT INTO do160_records (id, config_id, equipment_id, test_category, design_level, qual_level, compliance_status)
            VALUES (?, ?, ?, 'sec4_temperature', ?, ?, ?)
        """, (str(_uuid.uuid4()), config_id, equipment_id, design_level, qual_level, status))
        migrated += 1

    print(f"  Migrated {migrated} temperature DO-160 records from equipment table")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
```

- [ ] **Step 6: Run migration**

Run: `cd /Users/yanxunmaosmacbook/Documents/设备管理/backend && python -m scripts.migrate_p1_entities`

Verify: `python3 -c "import sqlite3; conn = sqlite3.connect('data/aeroequip.db'); print('micd_records:', conn.execute('SELECT COUNT(*) FROM micd_records').fetchone()[0]); print('do160_records:', conn.execute('SELECT COUNT(*) FROM do160_records').fetchone()[0]); conn.close()"`

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/micd.py backend/app/models/do160.py backend/app/models/__init__.py backend/app/models/configuration.py backend/scripts/migrate_p1_entities.py
git commit -m "feat: MICD, DO-160, physical asset models + migration with temperature data"
```

---

### Task 2: Create MICD CRUD API

**Files:**
- Create: `backend/app/api/micd.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create MICD API endpoints**

```python
"""MICD record management — 1:N relationship with config equipment."""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.micd import MICDRecord
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["micd"])


class MICDCreate(BaseModel):
    config_id: str
    equipment_id: str
    installation_structure_id: str | None = None
    bonding_surface: str | None = None
    fastener_brand: str | None = None
    fastener_count: int | None = None
    fastener_team: str | None = None
    bracket_model: str | None = None
    bracket_source: str | None = None
    bracket_mass_kg: float | None = None
    screw_spec: str | None = None
    wire_bonding_size: str | None = None
    model_config: str | None = None
    has_tolerance_drawing: bool | None = None
    notes: str | None = None


class MICDUpdate(BaseModel):
    installation_structure_id: str | None = None
    bonding_surface: str | None = None
    fastener_brand: str | None = None
    fastener_count: int | None = None
    fastener_team: str | None = None
    bracket_model: str | None = None
    bracket_source: str | None = None
    bracket_mass_kg: float | None = None
    screw_spec: str | None = None
    wire_bonding_size: str | None = None
    model_config: str | None = None
    has_tolerance_drawing: bool | None = None
    notes: str | None = None


class MICDConfirm(BaseModel):
    confirmed_by: str


@router.get("/micd")
async def list_micd(
    config_id: str = Query(...),
    equipment_id: str | None = Query(None),
    limit: int = Query(200, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(MICDRecord).where(MICDRecord.config_id == config_id)
    if equipment_id:
        query = query.where(MICDRecord.equipment_id == equipment_id)
    query = query.order_by(MICDRecord.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    records = result.scalars().all()

    count_q = select(func.count()).select_from(MICDRecord).where(MICDRecord.config_id == config_id)
    if equipment_id:
        count_q = count_q.where(MICDRecord.equipment_id == equipment_id)
    total = (await db.execute(count_q)).scalar() or 0

    return {
        "items": [_to_dict(r) for r in records],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.post("/micd", status_code=201)
async def create_micd(
    body: MICDCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = MICDRecord(id=str(uuid.uuid4()), **body.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.patch("/micd/{record_id}")
async def update_micd(
    record_id: str,
    body: MICDUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = await db.get(MICDRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.post("/micd/{record_id}/confirm")
async def confirm_micd(
    record_id: str,
    body: MICDConfirm,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = await db.get(MICDRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")
    record.is_confirmed = True
    record.confirmed_at = date.today()
    record.confirmed_by = body.confirmed_by
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.delete("/micd/{record_id}", status_code=204)
async def delete_micd(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = await db.get(MICDRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="MICD record not found")
    await db.delete(record)
    await db.commit()


@router.get("/micd/stats")
async def micd_stats(
    config_id: str = Query(...),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """MICD workload statistics (requirements 14.1)."""
    query = select(MICDRecord).where(MICDRecord.config_id == config_id)

    result = await db.execute(query)
    records = result.scalars().all()

    total = len(records)
    confirmed = sum(1 for r in records if r.is_confirmed)

    # Filter by date range for workload stats
    confirmed_in_range = confirmed
    if start_date or end_date:
        from datetime import date as _date
        filtered = [r for r in records if r.is_confirmed and r.confirmed_at]
        if start_date:
            sd = _date.fromisoformat(start_date)
            filtered = [r for r in filtered if r.confirmed_at >= sd]
        if end_date:
            ed = _date.fromisoformat(end_date)
            filtered = [r for r in filtered if r.confirmed_at <= ed]
        confirmed_in_range = len(filtered)

    return {
        "total_records": total,
        "confirmed": confirmed,
        "unconfirmed": total - confirmed,
        "confirmed_in_range": confirmed_in_range,
    }


def _to_dict(r: MICDRecord) -> dict:
    return {
        "id": r.id,
        "config_id": r.config_id,
        "equipment_id": r.equipment_id,
        "installation_structure_id": r.installation_structure_id,
        "bonding_surface": r.bonding_surface,
        "fastener_brand": r.fastener_brand,
        "fastener_count": r.fastener_count,
        "fastener_team": r.fastener_team,
        "bracket_model": r.bracket_model,
        "bracket_source": r.bracket_source,
        "bracket_mass_kg": r.bracket_mass_kg,
        "screw_spec": r.screw_spec,
        "wire_bonding_size": r.wire_bonding_size,
        "model_config": r.model_config,
        "has_tolerance_drawing": r.has_tolerance_drawing,
        "tolerance_drawing_url": r.tolerance_drawing_url,
        "is_confirmed": r.is_confirmed,
        "confirmed_at": r.confirmed_at.isoformat() if r.confirmed_at else None,
        "confirmed_by": r.confirmed_by,
        "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
```

- [ ] **Step 2: Register in main.py**

```python
from app.api.micd import router as micd_router
app.include_router(micd_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/micd.py backend/app/main.py
git commit -m "feat: MICD CRUD API with confirmation and workload statistics"
```

---

### Task 3: Create DO-160 CRUD API

**Files:**
- Create: `backend/app/api/do160.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create DO-160 API endpoints**

```python
"""DO-160 multi-category qualification records."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.do160 import DO160Record, DO160_CATEGORIES, DO160_CATEGORY_LABELS
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["do160"])


class DO160Create(BaseModel):
    config_id: str
    equipment_id: str
    test_category: str
    design_level: str | None = None
    qual_level: str | None = None
    compliance_status: str = "pending"
    qual_report_number: str | None = None
    notes: str | None = None


class DO160Update(BaseModel):
    design_level: str | None = None
    qual_level: str | None = None
    compliance_status: str | None = None
    qual_report_number: str | None = None
    notes: str | None = None


@router.get("/do160/categories")
async def list_categories(user: User = Depends(get_current_user)):
    """Return all 24 DO-160 test categories with labels."""
    return [
        {"key": cat, "label": DO160_CATEGORY_LABELS.get(cat, cat)}
        for cat in DO160_CATEGORIES
    ]


@router.get("/do160")
async def list_do160(
    config_id: str = Query(...),
    equipment_id: str | None = Query(None),
    test_category: str | None = Query(None),
    limit: int = Query(500, le=1000),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(DO160Record).where(DO160Record.config_id == config_id)
    if equipment_id:
        query = query.where(DO160Record.equipment_id == equipment_id)
    if test_category:
        query = query.where(DO160Record.test_category == test_category)
    query = query.order_by(DO160Record.test_category, DO160Record.created_at).offset(offset).limit(limit)

    result = await db.execute(query)
    records = result.scalars().all()

    count_q = select(func.count()).select_from(DO160Record).where(DO160Record.config_id == config_id)
    if equipment_id:
        count_q = count_q.where(DO160Record.equipment_id == equipment_id)
    if test_category:
        count_q = count_q.where(DO160Record.test_category == test_category)
    total = (await db.execute(count_q)).scalar() or 0

    return {"items": [_to_dict(r) for r in records], "total": total, "offset": offset, "limit": limit}


@router.post("/do160", status_code=201)
async def create_do160(
    body: DO160Create,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.test_category not in DO160_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {body.test_category}")
    record = DO160Record(id=str(uuid.uuid4()), **body.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.patch("/do160/{record_id}")
async def update_do160(
    record_id: str,
    body: DO160Update,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = await db.get(DO160Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="DO-160 record not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return _to_dict(record)


@router.delete("/do160/{record_id}", status_code=204)
async def delete_do160(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = await db.get(DO160Record, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="DO-160 record not found")
    await db.delete(record)
    await db.commit()


@router.get("/do160/summary")
async def do160_summary(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Summary statistics for DO-160 qualification by category."""
    result = await db.execute(
        select(DO160Record).where(DO160Record.config_id == config_id)
    )
    records = result.scalars().all()

    by_category = {}
    for r in records:
        cat = r.test_category
        if cat not in by_category:
            by_category[cat] = {"total": 0, "compliant": 0, "non_compliant": 0, "pending": 0}
        by_category[cat]["total"] += 1
        if r.compliance_status in by_category[cat]:
            by_category[cat][r.compliance_status] += 1

    return {
        "total_records": len(records),
        "categories": [
            {
                "key": cat,
                "label": DO160_CATEGORY_LABELS.get(cat, cat),
                **by_category.get(cat, {"total": 0, "compliant": 0, "non_compliant": 0, "pending": 0}),
            }
            for cat in DO160_CATEGORIES
            if cat in by_category
        ],
    }


def _to_dict(r: DO160Record) -> dict:
    return {
        "id": r.id,
        "config_id": r.config_id,
        "equipment_id": r.equipment_id,
        "test_category": r.test_category,
        "category_label": DO160_CATEGORY_LABELS.get(r.test_category, r.test_category),
        "design_level": r.design_level,
        "qual_level": r.qual_level,
        "compliance_status": r.compliance_status,
        "qual_report_number": r.qual_report_number,
        "notes": r.notes,
    }
```

- [ ] **Step 2: Register in main.py**

```python
from app.api.do160 import router as do160_router
app.include_router(do160_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/do160.py backend/app/main.py
git commit -m "feat: DO-160 multi-category CRUD API with summary statistics"
```

---

### Task 4: Create weight reduction computation API

**Files:**
- Create: `backend/app/api/weight_reduction.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create weight reduction endpoint**

```python
"""Weight reduction computation — cross-config weight comparison."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.equipment import Equipment
from app.models.configuration import ConfigEquipment
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["weight-reduction"])


@router.get("/weight-reduction")
async def compute_weight_reduction(
    base_config_id: str = Query(..., description="基准构型(如0号机)"),
    compare_config_id: str = Query(..., description="对比构型(如1&2号机)"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Compute per-device weight reduction between two configurations.
    
    Matches devices by Equipment.part_number (via equipment library).
    Returns reduction = base_mass - compare_mass (positive = lighter).
    """
    # Load base config equipment with part_number
    base_result = await db.execute(
        select(ConfigEquipment, Equipment.part_number, Equipment.name, Equipment.ata_chapter)
        .join(Equipment, ConfigEquipment.equipment_id == Equipment.id)
        .where(ConfigEquipment.config_id == base_config_id)
    )
    base_items = {row.part_number: row for row in base_result.all()}

    # Load compare config equipment
    compare_result = await db.execute(
        select(ConfigEquipment, Equipment.part_number, Equipment.name, Equipment.ata_chapter)
        .join(Equipment, ConfigEquipment.equipment_id == Equipment.id)
        .where(ConfigEquipment.config_id == compare_config_id)
    )
    compare_items = {row.part_number: row for row in compare_result.all()}

    # Match by part_number
    all_part_numbers = set(base_items.keys()) | set(compare_items.keys())
    items = []
    total_base_mass = 0.0
    total_compare_mass = 0.0

    for pn in sorted(all_part_numbers):
        base = base_items.get(pn)
        comp = compare_items.get(pn)

        base_mass = base.ConfigEquipment.mass_kg if base and base.ConfigEquipment.mass_kg else None
        comp_mass = comp.ConfigEquipment.mass_kg if comp and comp.ConfigEquipment.mass_kg else None

        name = (base.name if base else comp.name) if (base or comp) else pn
        ata = (base.ata_chapter if base else comp.ata_chapter) if (base or comp) else ""

        diff = None
        if base_mass is not None and comp_mass is not None:
            diff = round(base_mass - comp_mass, 3)

        if base_mass is not None:
            total_base_mass += base_mass
        if comp_mass is not None:
            total_compare_mass += comp_mass

        items.append({
            "part_number": pn,
            "name": name,
            "ata_chapter": ata,
            "base_mass_kg": base_mass,
            "compare_mass_kg": comp_mass,
            "diff_kg": diff,
            "in_base_only": base is not None and comp is None,
            "in_compare_only": base is None and comp is not None,
        })

    # Sort by diff (largest reduction first)
    items.sort(key=lambda x: x["diff_kg"] if x["diff_kg"] is not None else 0, reverse=True)

    return {
        "base_config_id": base_config_id,
        "compare_config_id": compare_config_id,
        "total_base_mass_kg": round(total_base_mass, 2),
        "total_compare_mass_kg": round(total_compare_mass, 2),
        "total_reduction_kg": round(total_base_mass - total_compare_mass, 2),
        "matched_count": sum(1 for i in items if not i["in_base_only"] and not i["in_compare_only"]),
        "base_only_count": sum(1 for i in items if i["in_base_only"]),
        "compare_only_count": sum(1 for i in items if i["in_compare_only"]),
        "items": items,
    }
```

- [ ] **Step 2: Register in main.py**

```python
from app.api.weight_reduction import router as weight_reduction_router
app.include_router(weight_reduction_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/weight_reduction.py backend/app/main.py
git commit -m "feat: weight reduction computation API — cross-config weight comparison"
```

---

### Task 5: Frontend types + API clients for MICD, DO-160, physical assets, weight reduction

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/api/micd.ts`
- Create: `frontend/src/api/do160.ts`
- Create: `frontend/src/api/weight-reduction.ts`

- [ ] **Step 1: Add types to `frontend/src/types/index.ts`**

```typescript
// MICD Record
export interface MICDRecord {
  id: string;
  config_id: string;
  equipment_id: string;
  installation_structure_id: string | null;
  bonding_surface: string | null;
  fastener_brand: string | null;
  fastener_count: number | null;
  fastener_team: string | null;
  bracket_model: string | null;
  bracket_source: string | null;
  bracket_mass_kg: number | null;
  screw_spec: string | null;
  wire_bonding_size: string | null;
  model_config: string | null;
  has_tolerance_drawing: boolean | null;
  tolerance_drawing_url: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: string | null;
}

// DO-160 Record
export interface DO160Record {
  id: string;
  config_id: string;
  equipment_id: string;
  test_category: string;
  category_label: string;
  design_level: string | null;
  qual_level: string | null;
  compliance_status: string;
  qual_report_number: string | null;
  notes: string | null;
}

export interface DO160Category {
  key: string;
  label: string;
}

export interface DO160Summary {
  total_records: number;
  categories: Array<{
    key: string;
    label: string;
    total: number;
    compliant: number;
    non_compliant: number;
    pending: number;
  }>;
}

// Weight Reduction
export interface WeightReductionItem {
  part_number: string;
  name: string;
  ata_chapter: string;
  base_mass_kg: number | null;
  compare_mass_kg: number | null;
  diff_kg: number | null;
  in_base_only: boolean;
  in_compare_only: boolean;
}

export interface WeightReductionResult {
  base_config_id: string;
  compare_config_id: string;
  total_base_mass_kg: number;
  total_compare_mass_kg: number;
  total_reduction_kg: number;
  matched_count: number;
  base_only_count: number;
  compare_only_count: number;
  items: WeightReductionItem[];
}
```

- [ ] **Step 2: Add physical asset fields to ConfigEquipmentData**

In `frontend/src/types/index.ts`, add to the `ConfigEquipmentData` interface:

```typescript
  // Physical asset lifecycle
  actual_arrival_date: string | null;
  micd_confirmed: boolean | null;
  structure_ready: boolean | null;
  installation_ready: boolean | null;
  planned_install_date: string | null;
  actual_install_date: string | null;
```

- [ ] **Step 3: Create API client files**

Create `frontend/src/api/micd.ts`:
```typescript
import client from './client';
import type { MICDRecord } from '@/types';

export async function listMICD(params: { config_id: string; equipment_id?: string; limit?: number }): Promise<{ items: MICDRecord[]; total: number }> {
  const { data } = await client.get('/micd', { params });
  return data;
}

export async function createMICD(body: Partial<MICDRecord>): Promise<MICDRecord> {
  const { data } = await client.post('/micd', body);
  return data;
}

export async function updateMICD(id: string, body: Partial<MICDRecord>): Promise<MICDRecord> {
  const { data } = await client.patch(`/micd/${id}`, body);
  return data;
}

export async function confirmMICD(id: string, confirmedBy: string): Promise<MICDRecord> {
  const { data } = await client.post(`/micd/${id}/confirm`, { confirmed_by: confirmedBy });
  return data;
}

export async function deleteMICD(id: string): Promise<void> {
  await client.delete(`/micd/${id}`);
}

export async function getMICDStats(params: { config_id: string; start_date?: string; end_date?: string }): Promise<{ total_records: number; confirmed: number; unconfirmed: number; confirmed_in_range: number }> {
  const { data } = await client.get('/micd/stats', { params });
  return data;
}
```

Create `frontend/src/api/do160.ts`:
```typescript
import client from './client';
import type { DO160Record, DO160Category, DO160Summary } from '@/types';

export async function listDO160Categories(): Promise<DO160Category[]> {
  const { data } = await client.get('/do160/categories');
  return data;
}

export async function listDO160(params: { config_id: string; equipment_id?: string; test_category?: string; limit?: number }): Promise<{ items: DO160Record[]; total: number }> {
  const { data } = await client.get('/do160', { params });
  return data;
}

export async function createDO160(body: Partial<DO160Record>): Promise<DO160Record> {
  const { data } = await client.post('/do160', body);
  return data;
}

export async function updateDO160(id: string, body: Partial<DO160Record>): Promise<DO160Record> {
  const { data } = await client.patch(`/do160/${id}`, body);
  return data;
}

export async function deleteDO160(id: string): Promise<void> {
  await client.delete(`/do160/${id}`);
}

export async function getDO160Summary(configId: string): Promise<DO160Summary> {
  const { data } = await client.get('/do160/summary', { params: { config_id: configId } });
  return data;
}
```

Create `frontend/src/api/weight-reduction.ts`:
```typescript
import client from './client';
import type { WeightReductionResult } from '@/types';

export async function computeWeightReduction(baseConfigId: string, compareConfigId: string): Promise<WeightReductionResult> {
  const { data } = await client.get('/weight-reduction', {
    params: { base_config_id: baseConfigId, compare_config_id: compareConfigId },
  });
  return data;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/api/micd.ts frontend/src/api/do160.ts frontend/src/api/weight-reduction.ts
git commit -m "feat: frontend types and API clients for MICD, DO-160, physical assets, weight reduction"
```

---

### Task 6: MICD management tab in workstation

**Files:**
- Create: `frontend/src/components/workstation/tabs/MICDTab.tsx`
- Modify: `frontend/src/pages/WorkstationPage.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create MICDTab component**

A tab showing all MICD records for the current config, with:
- KPI cards: total records, confirmed count, unconfirmed count, confirmation rate %
- ProfessionalTable with columns: 安装结构件编号, 设备名称(from equipment), 托架型号, 托架来源, 托架重量, 螺钉规格, 确认状态(Badge: green=已确认, yellow=未确认), 确认日期
- Filter by equipment_id (optional)
- Edit dialog for MICD fields
- Confirm button (sets is_confirmed=true with date)
- Uses `listMICD`, `createMICD`, `updateMICD`, `confirmMICD`, `deleteMICD` from API

The tab receives `equipment` array prop (for equipment name lookup) and uses `useConfigStore().activeConfigId`.

- [ ] **Step 2: Add MICD tab to WorkstationPage**

Import MICDTab and add:
```tsx
<TabsContent value="micd">
  <MICDTab equipment={filteredEquipment} />
</TabsContent>
```

- [ ] **Step 3: Add MICD submenu item to AppLayout sidebar**

Add under 构型查看 submenu, after 设备布置:
```tsx
{ key: '/workstation?tab=micd', label: 'MICD管控', icon: ClipboardCheck }
```

Import `ClipboardCheck` from lucide-react.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/workstation/tabs/MICDTab.tsx frontend/src/pages/WorkstationPage.tsx frontend/src/components/layout/AppLayout.tsx
git commit -m "feat: MICD management tab with confirmation workflow"
```

---

### Task 7: Rewrite DO-160 tab for multi-category

**Files:**
- Modify: `frontend/src/components/workstation/tabs/DO160Tab.tsx`

- [ ] **Step 1: Rewrite DO160Tab**

Replace the current single-category Sankey with a multi-category view:

1. **Category filter dropdown** at top — select from 24 DO-160 categories, or "All"
2. **KPI cards**: total records, compliant count/%, non-compliant count, pending count
3. **Category compliance matrix** (when "All" selected): grid/heatmap showing each category as a row, with colored cells (green=compliant, red=non_compliant, yellow=pending, gray=N/A) for each equipment. This gives a bird's-eye view.
4. **Sankey diagram** (when specific category selected): current Sankey but filtered to one category — design level → compliance status flow
5. **Equipment list** below: ProfessionalTable showing records for the selected category with columns: 设备名称, 测试类别, 设计等级, 鉴定等级, 鉴定状态(colored Badge), 鉴定报告编号

Data source: `listDO160()` and `getDO160Summary()` from API, plus `equipment` prop for name lookup.

Keep the existing Sankey rendering code but adapt it to work with the new DO160Record data structure instead of Equipment.do160_temp_* fields.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/DO160Tab.tsx
git commit -m "feat: DO-160 multi-category tab with compliance matrix and Sankey"
```

---

### Task 8: Extend ProcurementPage with physical asset lifecycle

**Files:**
- Modify: `frontend/src/pages/ProcurementPage.tsx`

- [ ] **Step 1: Add physical asset fields to procurement page**

The ProcurementPage already tracks procurement status (inquiry→delivered). Extend it with the remaining lifecycle steps:

1. Add new status filter options: "已到货", "MICD已确认", "结构已开口", "达到安装要求", "已上机"
2. Add columns to the table (or show in expanded row):
   - 实际到货日期 (actual_arrival_date)
   - MICD确认 (micd_confirmed: checkmark/x)
   - 结构开口 (structure_ready: checkmark/x)
   - 安装要求 (installation_ready: checkmark/x)
   - 达到装机 (computed: all three above true)
   - 计划上机 (planned_install_date)
   - 实际上机 (actual_install_date)
3. Update the edit sheet to include the new fields
4. Add a visual progress indicator per device: 8 steps shown as connected dots/circles (procurement → arrival → MICD → structure → install ready → ready for aircraft → planned → installed)

The data comes from `config_data.*` fields on the Equipment objects (already loaded).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ProcurementPage.tsx
git commit -m "feat: physical asset lifecycle tracking in procurement page"
```

---

### Task 9: Weight reduction dashboard

**Files:**
- Modify: `frontend/src/components/workstation/tabs/WeightTab.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add reduction section to WeightTab**

Below the existing treemap, add a "减重分析" section:

1. **Config selector**: two dropdowns — "基准构型" (default: 0号机) and "对比构型" (default: 1&2号机)
2. **KPI cards**: 基准总重, 对比总重, 总减重量 (highlighted, with arrow indicator)
3. **Reduction bar chart**: horizontal bars showing per-ATA reduction (grouped by ata_chapter, sorted by total reduction)
4. **Top reducers table**: top 10 devices with largest weight reduction, showing: 名称, ATA, 基准重量, 对比重量, 减重量, 减重%

Data source: `computeWeightReduction(baseConfigId, compareConfigId)` from API.

Use the existing config store to get available configs for the selector. Default base=first config, compare=second config.

2. **Step 2: Add reduction summary to DashboardPage**

In DashboardPage, add a card in the KPI row or as a new section:

- Title: "全机减重进展"
- Show: total_reduction_kg, matched_count devices compared
- Subtitle: "基准 vs 对比构型"
- Use `computeWeightReduction` with the first two available configs

This should be a compact card, not a full section. Place it near the weight-related KPIs.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/workstation/tabs/WeightTab.tsx frontend/src/pages/DashboardPage.tsx
git commit -m "feat: weight reduction dashboard — comparison analysis and summary"
```

---

### Task 10: Update physical asset fields in backend schemas and PATCH endpoint

**Files:**
- Modify: `backend/app/schemas/equipment.py`
- Modify: `backend/app/api/configurations.py`

- [ ] **Step 1: Add physical asset fields to schemas**

In `ConfigEquipmentData`, add:
```python
actual_arrival_date: str | None = None
micd_confirmed: bool | None = None
structure_ready: bool | None = None
installation_ready: bool | None = None
planned_install_date: str | None = None
actual_install_date: str | None = None
```

In `ConfigEquipmentUpdate`, add the same fields.

- [ ] **Step 2: Ensure PATCH endpoint handles new fields**

The PATCH endpoint at `update_config_equipment` already iterates over `body.config_equipment.model_dump(exclude_unset=True)` and sets attributes on ConfigEquipment. Since the new fields are on ConfigEquipment and in the schema, they'll be handled automatically. Verify this by reading the code.

- [ ] **Step 3: Update equipment list service to include new fields**

Read `backend/app/services/equipment_svc.py` to find where config_data is assembled. Add the new physical asset fields to the config_data dict.

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/equipment.py backend/app/api/configurations.py backend/app/services/equipment_svc.py
git commit -m "feat: physical asset lifecycle fields in schemas and equipment API"
```

---

## End-to-End Verification

After all tasks complete:

1. **MICD**: Navigate to MICD tab → create record → edit → confirm → verify stats
2. **DO-160**: Navigate to DO-160 tab → see categories → filter by category → Sankey per category
3. **Physical Assets**: Procurement page → see lifecycle steps → edit → check progress dots
4. **Weight Reduction**: Weight tab → select two configs → see reduction chart + top reducers
5. **Dashboard**: Check reduction summary card appears with correct numbers
6. **Migration**: Verify temperature DO-160 data migrated to do160_records table

---

## Deferred Items

- **PACE import**: Requires sample file (listed in data delivery checklist). Task will be added when sample is available.
- **Image attachment upload for MICD tolerance drawings**: Deferred to Phase 4 (P3).
- **MICD workload statistics page**: Basic stats available via `/api/micd/stats`. Full reporting UI deferred to Phase 4 (P3).
