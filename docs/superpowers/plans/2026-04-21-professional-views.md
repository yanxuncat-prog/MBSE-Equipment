# Professional Engineer Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 professional Tabs to the config view page (overview, weight, electrical, DO-160, bonding, layout, EWIS), each with specialized stat cards, filtered table columns, and domain-specific chart panels.

**Architecture:** Refactor WorkstationPage into a Tab container that loads equipment data once and distributes to Tab components. Each Tab renders StatsRow + ProfessionalTable + ProfessionalPanel with domain-specific columns and charts. All charts use inline SVG, no external charting library.

**Tech Stack:** React 18, TypeScript, Ant Design 5 Tabs/Table/Card/Statistic, SVG charts, existing API + WebSocket

**Spec:** `docs/superpowers/specs/2026-04-21-professional-views-design.md`

---

## File Structure

```
frontend/src/components/workstation/
├── shared/
│   ├── StatsCard.tsx              # Single stat card: value + label + color
│   ├── StatsRow.tsx               # Flex row container for StatsCards
│   ├── ProfessionalTable.tsx      # Generic infinite-scroll table accepting column defs
│   └── ProfessionalPanel.tsx      # Right-side 280px panel container
├── tabs/
│   ├── OverviewTab.tsx            # Wraps existing EquipmentTable + ConstraintPanel
│   ├── WeightTab.tsx              # W&B: mass/CG/MTOW stats + weight columns + CG chart
│   ├── ElectricalTab.tsx          # E-Load: bus status + power columns + bus chart
│   ├── DO160Tab.tsx               # DO-160: DAL/temp stats + qualification columns + DAL pie
│   ├── BondingTab.tsx             # Bonding: grounding stats + bonding columns + distribution
│   ├── LayoutTab.tsx              # Layout: zone stats + position columns + density bar
│   └── EWISTab.tsx                # EWIS: connector stats + EICD columns + coverage ring
└── charts/
    ├── CoverageRing.tsx           # Reusable SVG donut for coverage percentage
    ├── HorizontalBar.tsx          # Reusable horizontal bar chart (for ATA/zone distributions)
    ├── SimpleDonut.tsx            # Reusable SVG donut for category distributions
    └── ConnectorHistogram.tsx     # Connector count distribution
```

Also modified:
- `frontend/src/pages/WorkstationPage.tsx` — refactored to Tab container with shared data loading

---

## Task 1: Shared Components (StatsCard, StatsRow, ProfessionalTable, ProfessionalPanel)

**Files:**
- Create: `frontend/src/components/workstation/shared/StatsCard.tsx`
- Create: `frontend/src/components/workstation/shared/StatsRow.tsx`
- Create: `frontend/src/components/workstation/shared/ProfessionalTable.tsx`
- Create: `frontend/src/components/workstation/shared/ProfessionalPanel.tsx`

- [ ] **Step 1: Create StatsCard**

```tsx
// frontend/src/components/workstation/shared/StatsCard.tsx
import React from 'react';
import { Card, Statistic } from 'antd';

interface Props {
  title: string;
  value: number | string;
  suffix?: string;
  color?: string;
  precision?: number;
}

export function StatsCard({ title, value, suffix, color = '#333', precision }: Props) {
  return (
    <Card size="small" style={{ flex: 1 }}>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        precision={precision}
        valueStyle={{ color, fontSize: 20 }}
      />
    </Card>
  );
}
```

- [ ] **Step 2: Create StatsRow**

```tsx
// frontend/src/components/workstation/shared/StatsRow.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function StatsRow({ children }: Props) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create ProfessionalTable**

A generic infinite-scroll Ant Table that accepts column definitions and equipment data. Extracts the scrolling/sentinel logic from existing EquipmentTable.

```tsx
// frontend/src/components/workstation/shared/ProfessionalTable.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Table, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Equipment } from '../../../types';

interface Props {
  columns: ColumnsType<Equipment>;
  data: Equipment[];
  scrollX?: number;
  onRowClick?: (equip: Equipment) => void;
  rowClassName?: (record: Equipment) => string;
  summary?: () => React.ReactNode;
}

export function ProfessionalTable({ columns, data, scrollX = 1600, onRowClick, rowClassName, summary }: Props) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: scrollX }}
      rowClassName={rowClassName}
      summary={summary}
      onRow={onRowClick ? (record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      }) : undefined}
    />
  );
}
```

- [ ] **Step 4: Create ProfessionalPanel**

```tsx
// frontend/src/components/workstation/shared/ProfessionalPanel.tsx
import React from 'react';
import { Card } from 'antd';

interface Props {
  children: React.ReactNode;
}

export function ProfessionalPanel({ children }: Props) {
  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      paddingLeft: 16,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workstation/
git commit -m "feat: shared components for professional views — StatsCard, StatsRow, ProfessionalTable, ProfessionalPanel"
```

---

## Task 2: Reusable Chart Components

**Files:**
- Create: `frontend/src/components/workstation/charts/CoverageRing.tsx`
- Create: `frontend/src/components/workstation/charts/HorizontalBar.tsx`
- Create: `frontend/src/components/workstation/charts/SimpleDonut.tsx`
- Create: `frontend/src/components/workstation/charts/ConnectorHistogram.tsx`

- [ ] **Step 1: Create CoverageRing (reusable progress donut)**

```tsx
// frontend/src/components/workstation/charts/CoverageRing.tsx
import React from 'react';

interface Props {
  covered: number;
  total: number;
  label: string;
  color?: string;
  size?: number;
}

export function CoverageRing({ covered, total, label, color = '#34C759', size = 120 }: Props) {
  const pct = total > 0 ? covered / total : 0;
  const r = (size - 20) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = pct * circumference;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f0f0f0" strokeWidth={10} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
        <text x={cx} y={cx - 4} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">
          {(pct * 100).toFixed(0)}%
        </text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="#999" fontSize={9}>
          {covered}/{total}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create HorizontalBar (reusable for ATA/zone distributions)**

```tsx
// frontend/src/components/workstation/charts/HorizontalBar.tsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const COLORS = ['#5ac8fa', '#007aff', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#ffcc00', '#30b0c7', '#a2845e', '#636366'];

interface BarItem {
  label: string;
  value: number;
  suffix?: string;
}

interface Props {
  items: BarItem[];
  title?: string;
}

export function HorizontalBar({ items, title }: Props) {
  const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 1;

  return (
    <div>
      {title && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <Text style={{ width: 60, fontSize: 10, textAlign: 'right', marginRight: 6, color: '#999' }}>{item.label}</Text>
          <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.value / maxValue) * 100}%`,
              height: '100%',
              background: COLORS[i % COLORS.length],
              borderRadius: 3,
              transition: 'width 0.3s',
              minWidth: item.value > 0 ? 2 : 0,
            }} />
          </div>
          <Text style={{ width: 50, fontSize: 10, marginLeft: 6, color: '#666' }}>{item.value}{item.suffix || ''}</Text>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create SimpleDonut (category distribution)**

```tsx
// frontend/src/components/workstation/charts/SimpleDonut.tsx
import React from 'react';

const DEFAULT_COLORS = ['#34c759', '#5ac8fa', '#ff9500', '#ff6b6b', '#af52de', '#007aff', '#ffcc00', '#636366'];

interface Segment {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  segments: Segment[];
  title?: string;
  size?: number;
}

export function SimpleDonut({ segments, title, size = 140 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12 }}>无数据</div>;

  const r = 45;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ textAlign: 'center' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const dash = pct * circumference;
            const el = (
              <circle key={i} cx={cx} cy={cx} r={r} fill="none"
                stroke={seg.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={18}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90, ${cx}, ${cx})`}
              />
            );
            offset += dash;
            return el;
          })}
          <text x={cx} y={cx - 2} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">{total}</text>
          <text x={cx} y={cx + 11} textAnchor="middle" fill="#999" fontSize={8}>台设备</text>
        </svg>
        <div style={{ textAlign: 'left' }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#666' }}>{seg.label} ({seg.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ConnectorHistogram**

```tsx
// frontend/src/components/workstation/charts/ConnectorHistogram.tsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface Props {
  equipment: { connector_count: number | null }[];
}

export function ConnectorHistogram({ equipment }: Props) {
  const buckets = { '0': 0, '1': 0, '2-3': 0, '4-5': 0, '6+': 0, '未知': 0 };
  for (const e of equipment) {
    const c = e.connector_count;
    if (c == null) buckets['未知']++;
    else if (c === 0) buckets['0']++;
    else if (c === 1) buckets['1']++;
    else if (c <= 3) buckets['2-3']++;
    else if (c <= 5) buckets['4-5']++;
    else buckets['6+']++;
  }

  const max = Math.max(...Object.values(buckets), 1);
  const colors = ['#e0e0e0', '#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#999'];

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>连接器数分布</div>
      {Object.entries(buckets).map(([label, count], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ width: 32, fontSize: 10, textAlign: 'right', marginRight: 6, color: '#999' }}>{label}</Text>
          <div style={{ flex: 1, height: 14, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(count / max) * 100}%`,
              height: '100%',
              background: colors[i % colors.length],
              borderRadius: 3,
            }} />
          </div>
          <Text style={{ width: 30, fontSize: 10, marginLeft: 4, color: '#666' }}>{count}</Text>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workstation/charts/
git commit -m "feat: reusable chart components — CoverageRing, HorizontalBar, SimpleDonut, ConnectorHistogram"
```

---

## Task 3: OverviewTab + Refactor WorkstationPage to Tab Container

**Files:**
- Create: `frontend/src/components/workstation/tabs/OverviewTab.tsx`
- Modify: `frontend/src/pages/WorkstationPage.tsx`

- [ ] **Step 1: Create OverviewTab**

Move existing EquipmentTable + ConstraintPanel into a Tab component. The parent page provides equipment data and report.

```tsx
// frontend/src/components/workstation/tabs/OverviewTab.tsx
import React from 'react';
import { EquipmentTable } from '../../equipment/EquipmentTable';
import { ConstraintPanel } from '../../constraints/ConstraintPanel';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  configId: string | null;
  search: string;
  report: ValidationReport | null;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
}

export function OverviewTab({ configId, search, report, onEdit, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <EquipmentTable configId={configId} search={search} onEdit={onEdit} onSelect={onSelect} />
      </div>
      <ConstraintPanel report={report} />
    </div>
  );
}
```

- [ ] **Step 2: Refactor WorkstationPage to Tab container**

```tsx
// frontend/src/pages/WorkstationPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, message } from 'antd';
import { useConfigStore } from '../store/configStore';
import { useConstraintWS } from '../hooks/useConstraintWS';
import { createEquipment, updateEquipment, listEquipment } from '../api/equipment';
import { workstationActions } from '../components/layout/GlobalNav';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import { EquipmentDetail } from '../components/equipment/EquipmentDetail';
import { OverviewTab } from '../components/workstation/tabs/OverviewTab';
import { WeightTab } from '../components/workstation/tabs/WeightTab';
import { ElectricalTab } from '../components/workstation/tabs/ElectricalTab';
import { DO160Tab } from '../components/workstation/tabs/DO160Tab';
import { BondingTab } from '../components/workstation/tabs/BondingTab';
import { LayoutTab } from '../components/workstation/tabs/LayoutTab';
import { EWISTab } from '../components/workstation/tabs/EWISTab';
import type { Equipment } from '../types';

export function WorkstationPage() {
  const { activeConfigId } = useConfigStore();
  const report = useConstraintWS(activeConfigId);

  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [search, setSearch] = useState('');

  // Shared equipment data for all tabs (loaded once)
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [equipLoading, setEquipLoading] = useState(false);

  const loadAllEquipment = useCallback(async () => {
    if (!activeConfigId) { setAllEquipment([]); return; }
    setEquipLoading(true);
    try {
      const result = await listEquipment({ config_id: activeConfigId, limit: 2000 });
      setAllEquipment(result.items);
    } catch { message.error('加载设备数据失败'); }
    finally { setEquipLoading(false); }
  }, [activeConfigId]);

  useEffect(() => { loadAllEquipment(); }, [loadAllEquipment]);

  useEffect(() => {
    workstationActions.onAdd = () => { setEditEquip(null); setFormOpen(true); };
    workstationActions.onSearch = (value: string) => setSearch(value);
    return () => { workstationActions.onAdd = null; workstationActions.onSearch = null; };
  }, []);

  const handleEdit = (e: Equipment) => { setEditEquip(e); setFormOpen(true); };
  const handleSelect = (e: Equipment) => { setSelectedEquip(e); setDetailOpen(true); };
  const handleSave = async (values: any) => {
    try {
      if (editEquip) { await updateEquipment(editEquip.id, values); message.success('更新成功'); }
      else { await createEquipment(values); message.success('创建成功'); }
      setFormOpen(false);
      loadAllEquipment();
      (window as any).__constraintRefresh?.();
    } catch { message.error('保存失败'); }
  };

  return (
    <div>
      <Tabs
        defaultActiveKey="overview"
        size="small"
        items={[
          { key: 'overview', label: '总览',
            children: <OverviewTab configId={activeConfigId} search={search} report={report} onEdit={handleEdit} onSelect={handleSelect} /> },
          { key: 'weight', label: '重量管理',
            children: <WeightTab equipment={allEquipment} report={report} onSelect={handleSelect} /> },
          { key: 'electrical', label: '电气负荷',
            children: <ElectricalTab equipment={allEquipment} report={report} onSelect={handleSelect} /> },
          { key: 'do160', label: '环境鉴定',
            children: <DO160Tab equipment={allEquipment} onSelect={handleSelect} /> },
          { key: 'bonding', label: '接地搭接',
            children: <BondingTab equipment={allEquipment} onSelect={handleSelect} /> },
          { key: 'layout', label: '安装布局',
            children: <LayoutTab equipment={allEquipment} onSelect={handleSelect} /> },
          { key: 'ewis', label: 'EWIS',
            children: <EWISTab equipment={allEquipment} onSelect={handleSelect} /> },
        ]}
      />
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      <EquipmentDetail equipment={selectedEquip} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/workstation/tabs/OverviewTab.tsx frontend/src/pages/WorkstationPage.tsx
git commit -m "refactor: WorkstationPage as Tab container with OverviewTab + shared data loading"
```

---

## Task 4: Weight Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/WeightTab.tsx`

- [ ] **Step 1: Create WeightTab**

Full implementation with stats cards (total mass, CG, MTOW margin, missing count), weight-specific table columns (LIN, name, ATA, mass, STA, moment, zone, supplier, status), right panel with CG envelope chart and ATA/zone weight distribution bars.

Key details:
- Stats: computed from `allEquipment` array — `sum(wb.mass_kg)`, count where `weight_balance == null`
- CG/MTOW from `report.engines.find(e => e.engine_name === 'weight_balance').details`
- Moment column: `mass_kg * config_data.sta` (calculated in render)
- Default sort: mass descending
- ATA weight distribution: group by `ata_chapter`, sum `mass_kg` per group
- Zone weight distribution: group by `config_data.zone_name`, sum `mass_kg` per group
- Right panel uses existing `CGEnvelopeChart` + new `HorizontalBar`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/WeightTab.tsx
git commit -m "feat: Weight Tab — mass/CG/MTOW stats, weight table, CG envelope + distribution charts"
```

---

## Task 5: Electrical Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/ElectricalTab.tsx`

- [ ] **Step 1: Create ElectricalTab**

Stats: BusStatusDots (from report), highest bus load %, count of `is_primary_electrical == true`.
Table columns: LIN, name, bus_name, power_kva_normal, power_voltage, power_redundancy, is_primary_electrical, is_electrical, ATA.
Non-electrical equipment rows in gray (`rowClassName`).
Right panel: bus load bars (full size) from report data, bus load donut chart.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/ElectricalTab.tsx
git commit -m "feat: Electrical Tab — bus load stats, power table, bus status charts"
```

---

## Task 6: DO-160 Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/DO160Tab.tsx`

- [ ] **Step 1: Create DO160Tab**

Stats: count `dal != null`, count `dal == null`, count `do160_temp_qual_level != null`, count `first_flight_onboard == false`.
Table columns: LIN, name, DAL, do160_temp_design_level, do160_temp_qual_level, do160_temp_compliance, normal_operating_temp, short_term_temp, ground_storage_temp, operating_altitude, qual_report_number, first_flight_onboard, phase2_onboard.
`do160_temp_compliance` column: red text if value contains "不" or "未".
Default sort: DAL priority (A first, then B, C, D, null last).
Right panel: DAL distribution SimpleDonut, CoverageRing for qualification coverage, first-flight/phase-2 stats.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/DO160Tab.tsx
git commit -m "feat: DO-160 Tab — DAL/temperature stats, qualification table, coverage charts"
```

---

## Task 7: Bonding Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/BondingTab.tsx`

- [ ] **Step 1: Create BondingTab**

Stats: count by `shell_grounding_method` ("面搭接", "线搭接", other/null).
Table columns: LIN, name, is_metal_shell, metal_shell_non_conductive, shell_grounding_method, config_data.bonding_type, config_data.bonding_resistance, config_data.bonding_position, shell_grounding_fault_path, grounding_special_requirements, config_data.in_pace_drawing, physical_characteristics.
Grounding method column: color coded (面搭接=green tag, 线搭接=blue tag, none=gray).
Missing bonding data rows: light red background.
Right panel: grounding distribution SimpleDonut, shell material distribution (metal vs non-metal), bonding type bar chart.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/BondingTab.tsx
git commit -m "feat: Bonding Tab — grounding stats, bonding table, distribution charts"
```

---

## Task 8: Layout Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/LayoutTab.tsx`

- [ ] **Step 1: Create LayoutTab**

Stats: number of unique zones, densest zone (most equipment), count of `config_data.layout_adjustment != null`.
Table columns: LIN, name, zone_name, rack_position, STA, WL, BL, dimensions_mm, config_data.install_method, config_data.layout_adjustment, config_data.use_batch0_device.
Rows with layout_adjustment: yellow background.
Default grouped by zone.
Right panel: zone density HorizontalBar (count per zone), link button to `/spatial` page.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/LayoutTab.tsx
git commit -m "feat: Layout Tab — zone density stats, position table, zone distribution chart"
```

---

## Task 9: EWIS Tab

**Files:**
- Create: `frontend/src/components/workstation/tabs/EWISTab.tsx`

- [ ] **Step 1: Create EWISTab**

Stats: count `has_eicd == true`, sum of `connector_count`, count `has_special_wiring == true`.
Table columns: LIN, name, connector_count, has_eicd, has_special_wiring, ATA, zone_name, voltage_range, supplier_name.
Rows with `connector_count >= 5`: orange background.
Default sort: connector_count descending.
Right panel: CoverageRing for EICD coverage, ConnectorHistogram, ATA EICD coverage table (per ATA: total / has_eicd count).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/EWISTab.tsx
git commit -m "feat: EWIS Tab — connector stats, EICD coverage, wiring table"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Shared components | 4 new (StatsCard, StatsRow, ProfessionalTable, ProfessionalPanel) |
| 2 | Chart components | 4 new (CoverageRing, HorizontalBar, SimpleDonut, ConnectorHistogram) |
| 3 | OverviewTab + Page refactor | 1 new + 1 modified |
| 4 | Weight Tab | 1 new |
| 5 | Electrical Tab | 1 new |
| 6 | DO-160 Tab | 1 new |
| 7 | Bonding Tab | 1 new |
| 8 | Layout Tab | 1 new |
| 9 | EWIS Tab | 1 new |

Total: 15 new files, 1 modified file.
