# AeroEquip UI/UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 系统性修复前端审计发现的 30+ 个硬编码颜色、14 处字体不统一、响应式问题，完善数据录入（Excel 导入导出 + 内联编辑），增加采购地图和登录优化。

**Architecture:** 分 6 个阶段递进实施：基础修复 → 数据录入 → Excel 功能 → 内联编辑 → 采购地图 → 登录优化。每个阶段独立可交付。

**Tech Stack:** React 18 + TypeScript + Tailwind CSS 4 + ShadCN/UI + FastAPI + SQLite + openpyxl

---

## 阶段一：基础前端修复（硬编码颜色 + 字体统一）

### Task 1: 清除残余硬编码颜色

**Files:**
- Modify: `frontend/src/pages/ProcurementPage.tsx`
- Modify: `frontend/src/components/workstation/tabs/ElectricalTab.tsx`
- Modify: `frontend/src/components/spatial3d/AircraftScene3D.tsx`
- Modify: `frontend/src/components/spatial3d/StaRuler.tsx`
- Modify: `frontend/src/components/spatial/EquipmentMarker.tsx`
- Modify: `frontend/src/components/constraints/CGIndicator.tsx`

- [ ] **Step 1: 搜索全部残余硬编码颜色**

```bash
grep -rn 'fill="#\|color: "#\|stroke="#' frontend/src/ --include="*.tsx" | grep -v node_modules | grep -v 'var(--'
```

- [ ] **Step 2: 批量替换**

替换规则：
- `fill="#333"` / `fill="#000"` → `fill="var(--foreground)"`
- `fill="#666"` / `fill="#999"` / `fill="#888"` → `fill="var(--muted-foreground)"`
- `fill="#ccc"` / `fill="#ddd"` / `fill="#e8e8e8"` / `fill="#f0f0f0"` → `fill="var(--muted)"`
- `fill="#fff"` → `fill="var(--primary-foreground)"`
- `stroke="#ccc"` / `stroke="#ddd"` → `stroke="var(--border)"`
- `color: '#xxx'` inline styles → 对应的 CSS 变量
- `#34C759` / green → `var(--status-ok)`
- `#FF9500` / orange → `var(--status-warn)`
- `#FF3B30` / red → `var(--status-danger)`
- `#007AFF` / `#5AC8FA` / blue → `var(--chart-1)`

- [ ] **Step 3: TypeScript 编译检查**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "fix: replace all hardcoded hex colors with CSS variables"
```

### Task 2: 统一字体大小

**Files:**
- Modify: 14 个含 `text-[9px]` ~ `text-[12px]` 的 .tsx 文件

- [ ] **Step 1: 搜索残余的像素字体**

```bash
grep -rn 'text-\[9px\]\|text-\[10px\]\|text-\[11px\]\|text-\[12px\]' frontend/src/ --include="*.tsx" | grep -v node_modules
```

- [ ] **Step 2: 批量替换为 Tailwind 标准尺寸**

```bash
cd frontend/src
find . -name "*.tsx" -exec sed -i '' 's/text-\[9px\]/text-xs/g; s/text-\[10px\]/text-xs/g; s/text-\[11px\]/text-xs/g; s/text-\[12px\]/text-xs/g' {} +
```

- [ ] **Step 3: TypeScript 编译检查 + Commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "fix: unify font sizes to Tailwind scale"
```

### Task 3: 登录页默认不选构型

**Files:**
- Modify: `frontend/src/components/layout/GlobalNav.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: 修改 GlobalNav 自动选择逻辑**

在 `GlobalNav.tsx` 中，构型的自动选择应该只在用户手动选择了型号之后才触发，而不是页面加载时自动选中第一个。修改 useEffect：

```typescript
// 只在用户主动操作后才自动选系列和构型
useEffect(() => {
  if (programs.length > 0 && !activeProgramId) {
    setActiveProgram(programs[0].id);
  }
}, [programs]);
```

改为不自动触发，让用户手动选。或保持自动选型号但不自动选构型——在 `listConfigs` 回调中去掉 `if (!activeConfigId) setActiveConfig(c[0].id)` 逻辑。

- [ ] **Step 2: 验证登录后需手动选构型才能看到数据**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix: don't auto-select config on login"
```

---

## 阶段二：Excel 导出功能 (P2)

### Task 4: 后端 Excel 导出接口

**Files:**
- Create: `backend/app/api/excel_export.py`
- Modify: `backend/app/main.py`（注册路由）

- [ ] **Step 1: 创建导出接口**

```python
# backend/app/api/excel_export.py
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import openpyxl
from io import BytesIO
from datetime import date

from app.database import get_db
from app.models import Equipment, Configuration
from app.models.configuration import ConfigEquipment as ConfigEquipmentModel
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(tags=["excel"])

# 列映射：中文列名 → (数据来源, 字段名)
EXPORT_COLUMNS = [
    ("设备名称", "equipment", "name"),
    ("件号", "equipment", "part_number"),
    ("ATA章节", "equipment", "ata_chapter"),
    ("LIN号", "equipment", "lin_number"),
    ("类型", "equipment", "equipment_type"),
    ("状态", "equipment", "status"),
    ("是否电设备", "equipment", "is_electrical"),
    ("是否有EICD", "equipment", "has_eicd"),
    ("首飞装机", "equipment", "first_flight_onboard"),
    ("重量(kg)", "weight_balance", "mass_kg"),
    ("STA(mm)", "config_equipment", "sta"),
    ("BL(mm)", "config_equipment", "bl"),
    ("WL(mm)", "config_equipment", "wl"),
    ("安装方式", "config_equipment", "install_method"),
    ("搭接方式", "config_equipment", "bonding_method"),
    ("搭接类型", "config_equipment", "bonding_type"),
    ("搭接阻值(mΩ)", "config_equipment", "bonding_resistance"),
    ("供电电压", "equipment", "power_voltage"),
    ("供电余度", "equipment", "power_redundancy"),
    ("DO-160设计等级", "equipment", "do160_temp_design_level"),
    ("DO-160鉴定符合", "equipment", "do160_temp_compliance"),
    ("正常工作温度", "equipment", "normal_operating_temp"),
    ("备注", "equipment", "notes"),
]

@router.get("/export/equipment")
async def export_equipment(
    config_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    config = await db.get(Configuration, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="构型不存在")

    result = await db.execute(
        select(ConfigEquipmentModel)
        .options(
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.weight_balance),
            selectinload(ConfigEquipmentModel.equipment).selectinload(Equipment.electrical_load),
        )
        .where(ConfigEquipmentModel.config_id == config_id)
    )
    ce_list = list(result.scalars().unique().all())

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "设备清单"

    # Header
    for col_idx, (cn, _, _) in enumerate(EXPORT_COLUMNS, 1):
        ws.cell(row=1, column=col_idx, value=cn)

    # Data rows
    for row_idx, ce in enumerate(ce_list, 2):
        e = ce.equipment
        for col_idx, (_, source, field) in enumerate(EXPORT_COLUMNS, 1):
            if source == "equipment":
                val = getattr(e, field, None)
            elif source == "config_equipment":
                val = getattr(ce, field, None)
            elif source == "weight_balance":
                val = getattr(e.weight_balance, field, None) if e.weight_balance else None
            elif source == "electrical_load":
                val = getattr(e.electrical_load, field, None) if e.electrical_load else None
            else:
                val = None
            # Convert booleans
            if val is True: val = "是"
            elif val is False: val = "否"
            ws.cell(row=row_idx, column=col_idx, value=val)

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)

    filename = f"{config.version}_设备清单_{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
```

- [ ] **Step 2: 注册路由**

在 `backend/app/main.py` 添加：
```python
from app.api.excel_export import router as excel_export_router
app.include_router(excel_export_router, prefix="/api")
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Excel export API endpoint"
```

### Task 5: 前端导出按钮

**Files:**
- Modify: `frontend/src/components/workstation/shared/ProfessionalTable.tsx`

- [ ] **Step 1: 在工具栏添加导出按钮**

在 ProfessionalTable 的 toolbar div 中，record count 前面添加：

```tsx
import { Download } from 'lucide-react';

// In toolbar, before count span:
<Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
  onClick={() => {
    const configId = /* from props or context */;
    window.open(`/api/export/equipment?config_id=${configId}`, '_blank');
  }}>
  <Download className="size-3" />
  导出
</Button>
```

需要在 props 中传入 `configId` 或从 `useConfigStore` 获取。

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Excel export button to table toolbar"
```

---

## 阶段三：Excel 导入功能 (P3)

### Task 6: 后端 Excel 导入预览接口

**Files:**
- Create: `backend/app/api/excel_import.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 创建导入预览接口**

接口 `POST /api/configurations/{config_id}/import-preview`：
- 接收上传的 Excel 文件
- 按设备名称匹配现有记录
- 返回差异预览（added / modified / unchanged）
- modified 项包含字段级变更明细 `{field: {old, new}}`

- [ ] **Step 2: 创建导入执行接口**

接口 `POST /api/configurations/{config_id}/import-apply`：
- 接收预览结果的确认
- 执行批量更新
- 返回成功/失败统计

- [ ] **Step 3: Commit**

### Task 7: 前端导入 UI

**Files:**
- Create: `frontend/src/components/equipment/ImportDialog.tsx`
- Modify: `frontend/src/components/workstation/shared/ProfessionalTable.tsx`

- [ ] **Step 1: 创建 ImportDialog 组件**

包含：
- 文件上传区域（拖拽 + 点击选择）
- 预览结果展示（新增/修改/无变化的统计 + 变更明细表）
- 确认/取消按钮

- [ ] **Step 2: 在工具栏添加导入按钮**

导出按钮旁边添加"导入"按钮。

- [ ] **Step 3: Commit**

---

## 阶段四：表格内联编辑 (P4)

### Task 8: ProfessionalTable 内联编辑能力

**Files:**
- Modify: `frontend/src/components/workstation/shared/ProfessionalTable.tsx`

- [ ] **Step 1: Column 接口扩展**

```typescript
export interface Column<T> {
  // ...existing fields
  editable?: boolean | 'select';
  editOptions?: { value: string; label: string }[];
}
```

- [ ] **Step 2: 实现双击编辑**

内部状态管理：
```typescript
const [editingCell, setEditingCell] = useState<{rowKey: string, colKey: string} | null>(null);
const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, any>>>(new Map());
```

双击 → 显示 Input/Select → 回车/失焦 → 存入 pendingChanges → 顶部显示修改计数条

- [ ] **Step 3: 实现批量保存**

工具栏显示"已修改 N 项" + 保存/撤销按钮。保存时调用 `PATCH /configurations/{config_id}/equipment/{equipment_id}` 逐条更新。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add inline editing to ProfessionalTable"
```

---

## 阶段五：采购进度中国地图

### Task 9: 中国地图组件

**Files:**
- Create: `frontend/src/components/procurement/ChinaMap.tsx`
- Create: `frontend/public/china-geo.json`（简化版中国省份 GeoJSON）
- Modify: `frontend/src/pages/ProcurementPage.tsx`

- [ ] **Step 1: 获取简化版中国地图 GeoJSON**

从公开数据源获取省级边界 GeoJSON（~200KB），放入 `frontend/public/china-geo.json`。

- [ ] **Step 2: 创建 ChinaMap SVG 组件**

纯 SVG 渲染（不依赖 D3）：
- 读取 GeoJSON，用简单的墨卡托投影转换为 SVG path
- 每个省份一个 path，可 hover 高亮
- 城市标记点：按 `procurement_location` 字段聚合设备数
- 点大小正比于设备数
- 点击城市显示设备列表

- [ ] **Step 3: 集成到 ProcurementPage**

在现有采购进度页面顶部嵌入地图，支持按 ATA 筛选。

- [ ] **Step 4: Commit**

---

## 阶段六：视觉一致性收尾

### Task 10: 响应式布局修复

**Files:**
- Modify: `frontend/src/components/layout/GlobalNav.tsx`（移动端 select 宽度）
- Modify: `frontend/src/components/layout/AppLayout.tsx`（侧边栏宽度变量化）
- Modify: `frontend/src/components/workstation/tabs/OverviewTab.tsx`（flex-col 断点）

- [ ] **Step 1: GlobalNav 响应式**

Select 组件添加 `w-full md:w-[140px]`。

- [ ] **Step 2: 侧边栏宽度提取为 CSS 变量**

```css
:root {
  --sidebar-width: 240px;
  --sidebar-collapsed: 60px;
}
```

- [ ] **Step 3: OverviewTab 移动端断点**

```tsx
<div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-180px)]">
```

- [ ] **Step 4: Commit**

### Task 11: SVG 图表可访问性

**Files:**
- Modify: 所有含 `<svg>` 的组件（WeightTab、LayoutTab、ElectricalDetailsTab、DO160Tab、ConfigDiff 等）

- [ ] **Step 1: 为每个 SVG 图表添加 ARIA 属性**

```tsx
<svg role="img" aria-label="重量分布矩形树图">
  <title>重量分布矩形树图</title>
  ...
</svg>
```

- [ ] **Step 2: Commit**

### Task 12: 数字格式化

**Files:**
- Create: `frontend/src/lib/format.ts`
- Modify: 各页面中的大数字显示

- [ ] **Step 1: 创建格式化工具**

```typescript
export function fmtNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
```

- [ ] **Step 2: 在 KPI 卡片和表格中使用**

将 `totalWeight.toFixed(0)` 替换为 `fmtNumber(totalWeight)`，大数字显示为 `100,000` 格式。

- [ ] **Step 3: Commit**

---

## 实施顺序与依赖关系

```
阶段一 (Task 1-3): 基础修复，无依赖
     ↓
阶段二 (Task 4-5): Excel 导出，依赖后端 openpyxl
     ↓
阶段三 (Task 6-7): Excel 导入，依赖 Task 4 的列映射定义
     ↓
阶段四 (Task 8): 内联编辑，依赖已有的 PATCH API
     ↓
阶段五 (Task 9): 地图，独立可并行
     ↓
阶段六 (Task 10-12): 收尾，独立可并行
```

## 验收标准

- [ ] 零硬编码 hex 颜色（`grep` 不应找到任何 `fill="#` 或 `color: '#`）
- [ ] 零像素字体（不应有 `text-[9px]` ~ `text-[12px]`）
- [ ] 编辑弹窗覆盖全部 60+ 字段，保存后数据持久化
- [ ] Excel 导出文件包含全部字段，中文列名
- [ ] Excel 导入支持差异预览和批量更新
- [ ] 表格双击可内联编辑
- [ ] 采购页面中国地图显示城市设备分布
- [ ] 登录后不自动选中构型
- [ ] 所有 SVG 图表有 ARIA 标签
- [ ] TypeScript 零编译错误
