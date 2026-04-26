# Equipment Library Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the equipment library page with three-layer toolbar, dual view (table/card), ATA multi-select, column-header search, and knowledge panels.

**Architecture:** Split the monolithic EquipmentLibraryPage into focused components: a toolbar, a table view, and a card view. Backend API gets `ata_chapters` multi-select parameter. Frontend adds a static knowledge dictionary for attribute explanations. The existing page is replaced entirely.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, ShadCN/UI, FastAPI

**Key File Map:**

| File | Responsibility |
|------|---------------|
| `backend/app/api/equipment_library.py` | Add `ata_chapters` multi-select param, `ata_options` endpoint |
| `frontend/src/api/equipment-library.ts` | Update API client params |
| `frontend/src/pages/EquipmentLibraryPage.tsx` | REWRITE: orchestrate toolbar + view switching |
| `frontend/src/components/equipment-library/LibraryToolbar.tsx` | NEW: top bar (title, program select, view switch) |
| `frontend/src/components/equipment-library/LibraryFilters.tsx` | NEW: filter bar (ATA multi-select, status tabs, batch actions) |
| `frontend/src/components/equipment-library/TableView.tsx` | NEW: table view with attribute tabs + column-header search |
| `frontend/src/components/equipment-library/CardView.tsx` | NEW: card grid + expanded detail card |
| `frontend/src/components/equipment-library/KnowledgePanel.tsx` | NEW: attribute explanation popup |
| `frontend/src/components/equipment-library/knowledge-data.ts` | NEW: static knowledge dictionary |
| `frontend/src/components/equipment-library/column-defs.ts` | NEW: shared column/attribute group definitions |

---

### Task 1: Backend — add ATA multi-select and ATA options endpoint

**Files:**
- Modify: `backend/app/api/equipment_library.py`
- Modify: `frontend/src/api/equipment-library.ts`

- [ ] **Step 1: Add `ata_chapters` param and `/ata-options` endpoint to backend**

In `backend/app/api/equipment_library.py`, change the `ata_chapter` single param to `ata_chapters` comma-separated multi-select. Add a new endpoint that returns available ATA chapters.

Replace the `ata_chapter` filter block in the `list_equipment_library` function:

```python
    if ata_chapter:
        query = query.where(Equipment.ata_chapter.startswith(ata_chapter))
        count_query = count_query.where(Equipment.ata_chapter.startswith(ata_chapter))
```

With:

```python
    ata_chapters: str | None = Query(None, description="Comma-separated ATA chapters for multi-select"),
```

And the filter logic:

```python
    if ata_chapters:
        ata_list = [a.strip() for a in ata_chapters.split(",") if a.strip()]
        if ata_list:
            query = query.where(Equipment.ata_chapter.in_(ata_list))
            count_query = count_query.where(Equipment.ata_chapter.in_(ata_list))
```

Add a new endpoint after the list endpoint:

```python
@router.get("/ata-options")
async def get_ata_options(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return distinct ATA chapters that have equipment in the library."""
    result = await db.execute(
        select(Equipment.ata_chapter, func.count(Equipment.id).label("count"))
        .group_by(Equipment.ata_chapter)
        .order_by(Equipment.ata_chapter)
    )
    return [{"ata": row.ata_chapter, "count": row.count} for row in result.all()]
```

- [ ] **Step 2: Update frontend API client**

In `frontend/src/api/equipment-library.ts`, update the params type:

```typescript
export async function listLibraryEquipment(params: {
  search?: string;
  ata_chapters?: string;  // comma-separated
  library_status?: string;
  offset?: number;
  limit?: number;
}): Promise<LibraryListResponse> {
  const { data } = await client.get('/equipment-library', { params });
  return data;
}

export interface ATAOption {
  ata: string;
  count: number;
}

export async function getATAOptions(): Promise<ATAOption[]> {
  const { data } = await client.get('/equipment-library/ata-options');
  return data;
}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: equipment library API supports ATA multi-select and ATA options endpoint"
```

---

### Task 2: Extract shared column definitions and knowledge data

**Files:**
- Create: `frontend/src/components/equipment-library/column-defs.ts`
- Create: `frontend/src/components/equipment-library/knowledge-data.ts`

- [ ] **Step 1: Create column definitions**

Create `frontend/src/components/equipment-library/column-defs.ts`:

```typescript
export type ColDef = {
  key: string;
  label: string;
  align?: 'center' | 'right';
  mono?: boolean;
  searchable?: boolean;  // show column-header search input
};

export type AttrGroup = {
  key: string;
  label: string;
  icon: string;
  color: string;  // tailwind text color class
  columns: ColDef[];
};

export const ATTR_GROUPS: AttrGroup[] = [
  {
    key: 'identity', label: '标识与分类', icon: '🏷', color: 'text-foreground',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'name_en', label: '英文名称', searchable: true },
      { key: 'abbreviation_en', label: '英文缩写', searchable: true },
      { key: 'ata_chapter', label: 'ATA' },
      { key: 'equipment_type', label: '类型' },
      { key: 'dal', label: 'DAL' },
      { key: 'supplier_part_number', label: '供应商件号', searchable: true },
      { key: 'description', label: '描述', searchable: true },
    ],
  },
  {
    key: 'physical', label: '物理特性', icon: '📐', color: 'text-blue-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'dimensions_mm', label: '尺寸(mm)', searchable: true },
      { key: 'connector_count', label: '连接器数量', align: 'right' },
      { key: 'is_metal_shell', label: '金属壳体', align: 'center' },
      { key: 'metal_shell_non_conductive', label: '壳体不导电处理', searchable: true },
    ],
  },
  {
    key: 'electrical', label: '电气特性', icon: '⚡', color: 'text-amber-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'is_electrical', label: '电设备', align: 'center' },
      { key: 'is_primary_electrical', label: '一级用电', align: 'center' },
      { key: 'has_eicd', label: 'EICD', align: 'center' },
      { key: 'power_voltage', label: '���电电压' },
      { key: 'voltage_range', label: '电压范围' },
      { key: 'power_redundancy', label: '供电余度' },
      { key: 'power_watts', label: '用电功率' },
      { key: 'power_kva_normal', label: '正常功耗(kW)', align: 'right' },
      { key: 'power_kva_emergency', label: '应急功耗(kW)', align: 'right' },
      { key: 'power_kva_max', label: '峰值功耗(kW)', align: 'right' },
      { key: 'soft_start', label: '软启动' },
      { key: 'peak_power_time_s', label: '峰值时间(s)' },
      { key: 'dissimilar_supply', label: '异类供电' },
      { key: 'emergency_sheddable', label: '应急可卸' },
    ],
  },
  {
    key: 'grounding', label: '接地与搭接', icon: '🔌', color: 'text-emerald-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'internal_grounding', label: '内部共地', searchable: true },
      { key: 'shell_grounding_method', label: '壳体接地方式', searchable: true },
      { key: 'shell_grounding_fault_path', label: '故障电流路径' },
      { key: 'grounding_special_requirements', label: '接地特殊要求', searchable: true },
      { key: 'grounding_terminal_diameter', label: '接地端子内径' },
      { key: 'bonding_method', label: '搭接方式' },
      { key: 'bonding_type', label: '搭接类型' },
      { key: 'bonding_resistance', label: '搭接阻值(mΩ)' },
    ],
  },
  {
    key: 'mechanical', label: '机械接口', icon: '🔧', color: 'text-violet-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'screw_spec', label: '螺钉牌号', searchable: true },
      { key: 'bracket_delegated_158', label: '托架委托158', align: 'center' },
      { key: 'has_tolerance_drawing', label: '公差工程图', align: 'center' },
    ],
  },
];

/** Compute attribute fill percentage for a device */
export function computeFillRate(item: Record<string, any>): number {
  const allKeys = ATTR_GROUPS.flatMap(g => g.columns.map(c => c.key));
  const unique = [...new Set(allKeys)];
  const filled = unique.filter(k => item[k] !== null && item[k] !== undefined && item[k] !== '').length;
  return Math.round((filled / unique.length) * 100);
}
```

- [ ] **Step 2: Create knowledge data**

Create `frontend/src/components/equipment-library/knowledge-data.ts`:

```typescript
export interface KnowledgeEntry {
  label: string;
  definition: string;
  values?: string;
  standard?: string;
}

export const KNOWLEDGE: Record<string, KnowledgeEntry> = {
  part_number: {
    label: '件号 (Part Number)',
    definition: '设备在设计图纸和制造中的唯一编号。格式��� NNNNENNNNNGXXX，其中前4位对应ATA章节。',
    standard: 'ATA iSpec 2200',
  },
  dal: {
    label: 'DAL (Design Assurance Level)',
    definition: '设计保证等级，源自 DO-178C/DO-254 标准，定义软件/硬件开发严格程度。',
    values: 'A (灾难性) → B (危险) → C (重大) → D (轻微) �� E (无影响)',
    standard: 'RTCA DO-178C §2.2, SAE ARP4754A',
  },
  is_electrical: {
    label: '是否电设备',
    definition: '标识该设备是否需要电力供应才能工作。电设备需纳���电负载分析。',
  },
  is_primary_electrical: {
    label: '一级用电设备',
    definition: '关键飞行安全相关的电气设备，断电可能影响飞行安全，需优先保障供电。',
    standard: 'CS-25.1351',
  },
  has_eicd: {
    label: 'EICD (电气接口控制文件)',
    definition: '标识该设备是否已建立 EICD 文档，定义电气连接器针脚分配和信号接口。',
    standard: 'ARP4754A',
  },
  power_voltage: {
    label: '供电电压',
    definition: '设备正常工作所需的电源电压等级。CE-25A 采用 270VDC/28VDC/800VDC ��种电压体制。',
    values: '270V / 28V / 800V',
  },
  power_kva_normal: {
    label: '正常功耗 (kW)',
    definition: '设备在正常工作模式下的稳态功率消耗。',
  },
  power_kva_emergency: {
    label: '应急功耗 (kW)',
    definition: '设备在应急模式下的功率消耗，通常低于正常模式（部分功能降级）。',
  },
  power_kva_max: {
    label: '峰值功耗 (kW)',
    definition: '设备启动或瞬态过程中的最大功率，通常持续时间很短。',
  },
  dimensions_mm: {
    label: '外形尺寸 (mm)',
    definition: '设备外廓的长×高×宽尺寸，用于布置空间校核。',
  },
  connector_count: {
    label: '连接器数量',
    definition: '设备上的电气连接器或接线柱总数，影响线束设计和 EWIS 分析。',
  },
  is_metal_shell: {
    label: '金属壳体',
    definition: '壳体材质是否为金属。金属壳体影响接地方式和电磁屏蔽特性。',
  },
  bonding_method: {
    label: '电搭接方式',
    definition: '设备与飞机结构之间建立电气连接的方式，确保电磁兼容和雷电防护。',
    values: '面搭接 / 线搭接',
    standard: 'SAE ARP1870',
  },
  bonding_type: {
    label: '电搭接类型',
    definition: '搭接的分类等级，决定搭接阻值要求和测试标准。',
    values: 'A类 / B类 / C类',
  },
  bonding_resistance: {
    label: '搭接阻值要求 (mΩ)',
    definition: '搭接连接的最大允许电阻值，单位毫欧。A类要求最严格（≤2.5mΩ）。',
    standard: 'SAE ARP1870, MIL-B-5087',
  },
  screw_spec: {
    label: '螺钉牌号',
    definition: '安装设备所用紧固件的型号规格（长度待定需现场确认）。',
  },
  bracket_delegated_158: {
    label: '标准托架是否委托158设计+装配',
    definition: '标识该设备的安装托架是否由158厂负责设计和装配。',
  },
  has_tolerance_drawing: {
    label: '是否有公差尺寸工程图',
    definition: '标识该设备是否已提供包含公差标注的安装接口工程图纸。',
  },
  soft_start: {
    label: '软启动',
    definition: '设备是否需要软启动（缓慢升压），避免启动瞬间的大电流冲击。',
  },
  emergency_sheddable: {
    label: '应急可卸',
    definition: '在应急供电模式下，该设备是否可以被切断供电（卸载），以节省电力给关键设备。',
  },
  dissimilar_supply: {
    label: '异类供电',
    definition: '设备是否需要来自不同类型电源的冗余供电（如同时需要左发电机和右发电机供电）。',
  },
  internal_grounding: {
    label: '设备内共地情况',
    definition: '设备内部各电路模块的接地连接方式（共地/独立地/浮地）。',
  },
  shell_grounding_method: {
    label: '壳体接地方式',
    definition: '设备金属壳体与飞机结构之间的接地连接方式。',
  },
  grounding_terminal_diameter: {
    label: '结构侧接地端子内径',
    definition: '安装位置结构件上接地端子的内径尺寸，用于选配接地线缆。',
  },
};
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: shared column definitions and knowledge dictionary for equipment library"
```

---

### Task 3: Create KnowledgePanel component

**Files:**
- Create: `frontend/src/components/equipment-library/KnowledgePanel.tsx`

- [ ] **Step 1: Create KnowledgePanel**

```tsx
import { KNOWLEDGE } from './knowledge-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  fieldKey: string | null;
  open: boolean;
  onClose: () => void;
}

export function KnowledgePanel({ fieldKey, open, onClose }: Props) {
  const entry = fieldKey ? KNOWLEDGE[fieldKey] : null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">{entry?.label ?? fieldKey}</DialogTitle>
        </DialogHeader>
        {entry ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{entry.definition}</p>
            {entry.values && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">取值范围：</span>
                <span className="text-xs">{entry.values}</span>
              </div>
            )}
            {entry.standard && (
              <div className="text-xs text-blue-600">参考标准：{entry.standard}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无该属性的说明信息。</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: KnowledgePanel component for attribute explanations"
```

---

### Task 4: Create TableView component with column-header search

**Files:**
- Create: `frontend/src/components/equipment-library/TableView.tsx`

- [ ] **Step 1: Create TableView**

A table component that:
- Receives `items`, `activeGroup`, `selected`, `onToggleSelect`, `onSelectAll`, `onConfirmOne`, `showActions`
- Renders attribute group tabs at top
- Renders table header with column names
- Renders a search input row below the header (yellow bg) for searchable columns
- Filters items client-side by column search inputs
- Each column header label has a small ⓘ icon that opens KnowledgePanel
- Uses `BoolIcon` and `Cell` helpers (define inline)

The component accepts `attrGroup` as prop and renders only that group's columns. It also manages column search state internally.

Props:
```typescript
interface TableViewProps {
  items: LibraryEquipment[];
  attrGroup: string;
  onAttrGroupChange: (g: string) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onConfirmOne: (id: string) => void;
  showActions: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: TableView component with attribute tabs and column-header search"
```

---

### Task 5: Create CardView component with grid + expanded detail

**Files:**
- Create: `frontend/src/components/equipment-library/CardView.tsx`

- [ ] **Step 1: Create CardView**

A card grid component that:
- Receives `items`, `onConfirmOne`, `showActions`
- Default: 3-column grid of summary cards showing: name, part_number, status badge, 4 key attrs (ATA, type, voltage, power), fill rate percentage
- Click card: expand inline to full detail card showing all 5 attribute groups in 2-column grid
- Each group has colored header (matching AttrGroup color)
- Each attribute has ⓘ icon opening KnowledgePanel
- Expanded card has "确认入库" button if draft
- Click outside or ✕ to collapse back

Props:
```typescript
interface CardViewProps {
  items: LibraryEquipment[];
  onConfirmOne: (id: string) => void;
  showActions: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: CardView component with grid thumbnails and expanded detail cards"
```

---

### Task 6: Create LibraryToolbar and LibraryFilters components

**Files:**
- Create: `frontend/src/components/equipment-library/LibraryToolbar.tsx`
- Create: `frontend/src/components/equipment-library/LibraryFilters.tsx`

- [ ] **Step 1: Create LibraryToolbar**

Top bar with:
- 🗄 title + total count badge
- Program selector (Select dropdown from `listPrograms()`)
- View toggle buttons (表单 / 卡片)

Props:
```typescript
interface ToolbarProps {
  total: number;
  viewMode: 'table' | 'card';
  onViewModeChange: (m: 'table' | 'card') => void;
}
```

Note: Program selector is for future use — currently only CE-25A exists. Show the dropdown but it's cosmetic for now (no filtering by program since equipment table doesn't have program_id yet).

- [ ] **Step 2: Create LibraryFilters**

Filter bar with:
- ATA multi-select dropdown (checkbox list from `getATAOptions()`)
- Status tabs (全部 / 待确认 / 已入库) with counts
- Batch confirm button (when selections exist)

Props:
```typescript
interface FiltersProps {
  ataOptions: ATAOption[];
  selectedATAs: string[];
  onATAChange: (atas: string[]) => void;
  statusTab: 'all' | 'draft' | 'valid';
  onStatusChange: (s: 'all' | 'draft' | 'valid') => void;
  draftCount: number;
  validCount: number;
  selectedCount: number;
  onBatchConfirm: () => void;
}
```

For ATA multi-select: use ShadCN Popover with a checkbox list inside. Show selected count on the trigger button.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: LibraryToolbar and LibraryFilters components"
```

---

### Task 7: Rewrite EquipmentLibraryPage as orchestrator

**Files:**
- Modify: `frontend/src/pages/EquipmentLibraryPage.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the entire file. The page becomes a thin orchestrator that:
1. Manages state: viewMode, statusTab, selectedATAs, attrGroup, selected items
2. Fetches data via `listLibraryEquipment` and `getATAOptions`
3. Computes draftCount/validCount from loaded items
4. Passes props to child components:
   - `<LibraryToolbar>`
   - `<LibraryFilters>`
   - `{viewMode === 'table' ? <TableView> : <CardView>}`

Data flow:
- ATA options loaded once on mount
- Equipment list re-fetched when statusTab or selectedATAs change
- Column search is client-side (no API call)
- View mode switch is instant (no re-fetch)

- [ ] **Step 2: Verify compilation**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: rewrite EquipmentLibraryPage with dual view and multi-level filters"
```

---

## End-to-End Verification

After all tasks:
1. Navigate to /equipment-library
2. Table view: switch attribute tabs, type in column search inputs, verify filtering works
3. Card view: see grid, click to expand, see all 5 groups, click ⓘ to see knowledge panel
4. ATA multi-select: select/deselect ATAs, verify list updates
5. Status tabs: switch between 全部/Draft/Valid
6. Batch confirm: select items, click batch confirm, verify status changes
