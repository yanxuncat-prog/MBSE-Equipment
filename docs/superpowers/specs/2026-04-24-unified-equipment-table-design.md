# 统一设备表 + 行内展开属性管理 设计文档

> 版本 V1.0 | 2026-04-24

## 1 目标

将 5 个子菜单页面（重量分析、电负载分析、DO-160、设备布置、EWIS）中的表格统一到"构型查看"总览页的一张设备主表中。每行设备可展开，展开后显示 4 个 Tab（总览、重量/布置、电负载、环境综合），覆盖该设备的全部字段，支持就地编辑。

## 2 交互设计

### 2.1 设备主表（收起状态）

全宽自适应表格，核心列：

| 列 | 宽度 | 来源 |
|---|------|------|
| ▸ (展开箭头) | 30px | 交互 |
| 编辑 | 60px | 操作 |
| 名称 | 160px | equipment.name |
| 件号 | 140px | equipment.part_number |
| ATA | 50px | equipment.ata_chapter |
| LIN号 | 100px | equipment.lin_number |
| 重量(kg) | 80px | weight_balance.mass_kg |
| 供电电压 | 80px | equipment.power_voltage |
| DO-160 | 60px | equipment.do160_temp_design_level |
| 状态 | 70px | equipment.status |

- 表格宽度 = 100%，自适应窗口
- 保留 ATA 筛选器、列搜索、列值筛选功能
- 保留行首编辑按钮（打开编辑弹窗）
- 点击展开箭头 ▸ → 箭头旋转为 ▾，该行下方展开属性面板

### 2.2 展开区域

展开后显示一个嵌套面板，占满表格宽度，包含 4 个 Tab：

#### Tab 1: 总览
4 个并排小卡片，每个展示该设备在对应维度的 2-3 个关键指标：

- **重量**：重量值、重量指标、超重风险
- **布置**：STA / BL / WL 坐标、安装方式
- **电负载**：供电电压、正常功耗、供电余度
- **环境**：DO-160 设计等级、鉴定符合情况、正常工作温度

全部只读，作为概览。

#### Tab 2: 重量/布置
可编辑字段（2 列 grid）：

重量侧：mass_kg, dimensions_mm, weight_target(重量指标), overweight_risk(超重风险)
布置侧：sta, bl, wl, install_method, layout_adjustment, bonding_position, in_pace_drawing

#### Tab 3: 电负载
可编辑字段：

power_voltage, power_redundancy, voltage_range, power_watts,
power_kva_normal, power_kva_emergency, power_kva_max,
bonding_method, bonding_type, bonding_resistance,
is_electrical, is_primary_electrical, has_eicd

#### Tab 4: 环境综合
可编辑字段：

do160_temp_design_level, do160_temp_qual_level, do160_temp_qual_range,
do160_temp_compliance, normal_operating_temp, short_term_temp,
ground_storage_temp, operating_altitude, qual_report_number

### 2.3 编辑交互

- 每个 Tab（除总览外）的字段直接显示为表单控件
- 修改后自动标记为"已修改"（蓝色左边框）
- Tab 底部有"保存"按钮，调用 PATCH /configurations/{config_id}/equipment/{equipment_id}
- 保存后刷新该行数据

## 3 对子菜单页面的影响

5 个子菜单页面保留可视化图表，删除底部表格：

| 页面 | 保留 | 删除 |
|------|------|------|
| 重量分析 (WeightTab) | KPI + Treemap | ProfessionalTable |
| 电负载分析 (ElectricalDetailsTab) | KPI + 功率曲线 + 峰值统计表 | 负载明细 ProfessionalTable |
| DO-160 (DO160Tab) | KPI + Sankey 流向图 | 明细 ProfessionalTable |
| 设备布置 (LayoutTab) | KPI + 三视图散点 + 区段柱状图 | 设备位置明细 ProfessionalTable |
| EWIS (EWISTab) | 占位提示 | 不变 |

## 4 实现方案

### 4.1 新增组件

`frontend/src/components/equipment/ExpandableRow.tsx`：
- 接收 Equipment 对象
- 渲染 4 个 Tab 的内容
- 总览 Tab 用 4 个 Card 展示关键指标
- 其余 Tab 用 2 列 grid 表单
- 保存按钮调用 PATCH API

### 4.2 修改组件

`frontend/src/components/workstation/shared/ProfessionalTable.tsx`：
- 新增 `expandable` prop：`{ render: (record: T) => React.ReactNode }`
- 管理展开状态 `expandedKeys: Set<string>`
- 展开行的箭头列（ChevronRight → ChevronDown）
- 展开内容渲染在 TableRow 之后的 `<tr><td colSpan={...}>` 中

`frontend/src/components/workstation/tabs/OverviewTab.tsx`：
- EquipmentTable 传入 expandable prop

`frontend/src/components/equipment/EquipmentTable.tsx`：
- 定义 expandable.render，返回 ExpandableRow 组件

### 4.3 子菜单页面修改

WeightTab、ElectricalDetailsTab、DO160Tab、LayoutTab：
- 删除底部的 `<ProfessionalTable>` 及相关 columns 定义
- 保留可视化部分

## 5 字段完整清单

### 总览 Tab 展示字段
重量：mass_kg, dimensions_mm
布置：sta, bl, wl, install_method
电负载：power_voltage, power_kva_normal, power_redundancy
环境：do160_temp_design_level, do160_temp_compliance, normal_operating_temp

### 重量/布置 Tab 可编辑字段 (11)
mass_kg, dimensions_mm, sta, bl, wl, install_method, layout_adjustment, bonding_position, in_pace_drawing, responsible_person, notes

### 电负载 Tab 可编辑字段 (13)
power_voltage, power_redundancy, voltage_range, power_watts, power_kva_normal, power_kva_emergency, power_kva_max, bonding_method, bonding_type, bonding_resistance, is_electrical, is_primary_electrical, has_eicd

### 环境综合 Tab 可编辑字段 (9)
do160_temp_design_level, do160_temp_qual_level, do160_temp_qual_range, do160_temp_compliance, normal_operating_temp, short_term_temp, ground_storage_temp, operating_altitude, qual_report_number
