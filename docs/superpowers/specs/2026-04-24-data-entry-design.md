# 数据录入功能设计文档

> 版本 V1.0 | 2026-04-24

## 1 目标

解决当前平台数据录入的三个核心问题：
1. 编辑覆盖率极低（62 个字段仅 10 个可编辑）
2. 构型级数据（STA/BL/WL、搭接、采购）看起来能编辑但实际保存不了
3. 无批量录入能力

## 2 用户场景

- **逐条编辑**：工程师在网页上选择特定字段编辑某台设备
- **批量导入**：用 Excel 填好数据后整体导入更新
- **网页内联编辑**：在表格中直接双击单元格修改
- 暂不做权限隔离，所有用户可编辑所有字段

## 3 设计方案

### 3.1 扩展编辑弹窗（字段可选）

#### 交互流程

1. 用户点击某行的"编辑"按钮
2. 弹出**字段选择器**（第一步），展示所有可编辑字段分组：
   - 基本信息（件号、名称、中英文名、ATA、LIN号、类型、状态、描述）
   - 分类属性（电设备、一级用电、EICD、首飞装机、二阶段、DAL、设备等级）
   - 重量/位置（重量、重量指标、超重风险、STA、BL、WL）
   - 电气特性（供电电压、功率正常/应急/峰值、供电余度、电压范围）
   - 搭接/安装（搭接方式、类型、阻值、位置、安装方式、PACE图纸、布置调整）
   - DO-160（设计等级、鉴定等级、温度范围、符合情况、工作温度、高度、报告号）
   - 备注（设备备注）
3. 用户勾选要编辑的**字段组**（默认全选，可取消不需要的组）
4. 点击"开始编辑" → 弹出编辑表单，只显示勾选的字段组
5. 编辑完成点"保存"

#### 快捷方式

- 提供"快速编辑"预设：
  - "重量" → 只显示重量相关字段
  - "搭接" → 只显示搭接相关字段
  - "DO-160" → 只显示 DO-160 相关字段
  - "全部" → 显示所有字段
- 这些预设显示为编辑弹窗顶部的快捷标签

#### 弹窗布局

- 宽度 720px，固定高度内容区 400px
- 选中的字段组作为 Tab 展示
- 每个 Tab 内字段用 2 列 grid 布局
- 枚举字段用下拉框，布尔字段用开关，文本字段用输入框，数值字段用数字输入框

### 3.2 后端：构型级数据更新接口

#### 新增 API

```
PATCH /api/configurations/{config_id}/equipment/{equipment_id}
```

请求体：
```json
{
  "equipment": {
    "name": "xxx",
    "is_electrical": true,
    "do160_temp_design_level": "B2",
    ...
  },
  "config_equipment": {
    "sta": 8500.0,
    "bl": -200.0,
    "wl": 500.0,
    "bonding_type": "C类",
    "install_method": "四角螺栓安装",
    ...
  },
  "weight_balance": {
    "mass_kg": 12.5
  },
  "electrical_load": {
    "power_kva_normal": 0.5,
    "power_kva_emergency": 0.3,
    "power_kva_max": 1.2
  }
}
```

后端逻辑：
- 拆分请求体为 4 部分：equipment 表、config_equipment 表、weight_balances 表、electrical_loads 表
- 分别更新对应记录
- 返回更新后的完整设备数据

#### 修改现有接口

`PUT /api/equipment/{id}` 扩展 EquipmentUpdate schema，增加全部 40+ 个 equipment 表字段的可选更新支持。

### 3.3 表格内联编辑

#### 交互设计

- ProfessionalTable 新增 `inlineEditable` prop
- 双击单元格 → 单元格变为编辑状态（Input/Select）
- 回车或失焦 → 调用保存 API
- Esc → 取消编辑
- 顶部出现提示条："已修改 3 项" + [保存全部] [撤销] 按钮
- 支持 Tab 键跳到同行下一个可编辑单元格

#### 可编辑列标记

Column 定义中新增 `editable?: boolean | 'select'` 属性：
- `true` → 双击变 Input
- `'select'` → 双击变 Select（需配合 `options` 属性）
- 未设置 → 不可编辑

#### 批量保存

修改的单元格高亮显示（左边框蓝色条），未保存前可撤销。点击"保存全部"一次性提交所有修改。

### 3.4 Excel 批量导入/导出

#### 导出

- 按钮位置：ProfessionalTable 工具栏右侧
- 导出内容：当前构型下全部设备的全部字段（equipment + config_equipment + weight + electrical_load）
- 格式：.xlsx，列名为中文
- 文件名：`{构型名称}_设备清单_{日期}.xlsx`

#### 导入

- 按钮位置：ProfessionalTable 工具栏右侧，"导出"按钮旁边
- 流程：
  1. 上传 .xlsx 文件
  2. 后端解析，按设备名称匹配现有记录
  3. 返回差异预览：新增 N 行、修改 N 行（含字段级变更明细）、无变化 N 行
  4. 用户确认 → 执行批量更新
  5. 返回执行结果

#### 后端接口

```
POST /api/configurations/{config_id}/import-preview
Body: multipart/form-data (Excel file)
Response: { added: [...], modified: [...], unchanged_count: N }

POST /api/configurations/{config_id}/import-apply
Body: { preview_id: "xxx" }
Response: { success_count, error_count, errors: [...] }
```

## 4 实现优先级

| 阶段 | 内容 | 预计工作量 |
|------|------|-----------|
| P0 | 后端构型级更新接口 + 扩展 EquipmentUpdate schema | 后端 1 个文件 |
| P1 | 扩展编辑弹窗（字段选择器 + 全部字段覆盖） | 前端 2 个文件 |
| P2 | Excel 导出功能 | 前后端各 1 个文件 |
| P3 | Excel 导入 + 差异预览 | 前后端各 2 个文件 |
| P4 | 表格内联编辑 | 前端 1 个文件（ProfessionalTable 扩展） |

## 5 数据模型

### 字段分组定义

```typescript
const FIELD_GROUPS = {
  basic: {
    label: '基本信息',
    fields: ['part_number', 'name', 'name_en', 'abbreviation_en', 'ata_chapter',
             'lin_number', 'internal_number', 'equipment_type', 'status', 'description'],
    target: 'equipment',
  },
  classify: {
    label: '分类属性',
    fields: ['is_electrical', 'is_primary_electrical', 'has_eicd', 'has_special_wiring',
             'first_flight_onboard', 'phase2_onboard', 'dal', 'equipment_level', 'is_optional'],
    target: 'equipment',
  },
  weight: {
    label: '重量/位置',
    fields: ['mass_kg', 'weight_target', 'overweight_risk'],
    positionFields: ['sta', 'bl', 'wl'],
    target: 'mixed', // mass_kg → weight_balances, sta/bl/wl → config_equipment
  },
  electrical: {
    label: '电气特性',
    fields: ['power_voltage', 'power_watts', 'power_redundancy', 'voltage_range',
             'power_kva_normal', 'power_kva_emergency', 'power_kva_max'],
    target: 'mixed', // power_voltage etc → equipment, power_kva* → electrical_loads
  },
  bonding: {
    label: '搭接/安装',
    fields: ['bonding_method', 'bonding_type', 'bonding_resistance', 'bonding_position',
             'install_method', 'in_pace_drawing', 'layout_adjustment'],
    target: 'config_equipment',
  },
  do160: {
    label: 'DO-160',
    fields: ['do160_temp_design_level', 'do160_temp_qual_level', 'do160_temp_qual_range',
             'do160_temp_compliance', 'normal_operating_temp', 'short_term_temp',
             'ground_storage_temp', 'operating_altitude', 'qual_report_number'],
    target: 'equipment',
  },
  notes: {
    label: '备注',
    fields: ['notes', 'responsible_person'],
    target: 'equipment',
  },
};
```

### 字段元数据

每个字段定义：
```typescript
interface FieldMeta {
  key: string;
  label: string;         // 中文显示名
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: { value: string; label: string }[];  // select 类型的选项
  required?: boolean;
  target: 'equipment' | 'config_equipment' | 'weight_balances' | 'electrical_loads';
}
```

## 6 非功能需求

- 编辑弹窗打开/关闭不应该触发页面数据全量重新加载，只刷新被编辑的那条记录
- Excel 导入限制单次最大 2000 行
- 内联编辑的自动保存 debounce 300ms
- 所有编辑操作记录审计日志（操作人、时间、字段、旧值、新值）
