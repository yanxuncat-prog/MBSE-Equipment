# 专业工程师视图设计规格

> 版本: 1.0 | 日期: 2026-04-21

---

## 1. 概述

在构型查看页面内增加 7 个 Tab，为不同专业的工程师提供专用视图。每个 Tab 包含：专业统计卡片、专业列表（只显示该专业关心的列）、专业图表面板。所有 Tab 共享同一个构型上下文。

### Tab 列表

| Tab | Key | 目标用户 | 核心指标 |
|-----|-----|---------|---------|
| 总览 | overview | 所有人 | 全字段表格（当前默认视图） |
| 重量管理 | weight | 重量工程师 | CG/MTOW/力矩/按ATA重量汇总 |
| 电气负荷 | electrical | 电气工程师 | 母线负荷/功耗/供电余度/飞行阶段 |
| 环境鉴定 | do160 | 适航/环境工程师 | DAL/鉴定等级/温度/鉴定覆盖率 |
| 接地搭接 | bonding | EMC工程师 | 壳体材质/接地方式/搭接类型/阻值 |
| 安装布局 | layout | 总体布置工程师 | 坐标/区域/尺寸/安装方式/密度 |
| EWIS | ewis | EWIS工程师 | 连接器数/EICD覆盖率/布线需求 |

---

## 2. 架构

### 2.1 页面结构

```
构型查看页 (WorkstationPage)
├── 顶栏: 型号/系列/构型选择 + 添加设备 + 搜索
├── Ant Design Tabs
│   ├── Tab: 总览 (overview)     → <OverviewTab />
│   ├── Tab: 重量 (weight)       → <WeightTab />
│   ├── Tab: 电气 (electrical)   → <ElectricalTab />
│   ├── Tab: 环境 (do160)        → <DO160Tab />
│   ├── Tab: 接地 (bonding)      → <BondingTab />
│   ├── Tab: 布局 (layout)       → <LayoutTab />
│   └── Tab: EWIS (ewis)        → <EWISTab />
└── 共享: ConstraintPanel (右侧面板，显示当前 Tab 相关的约束)
```

### 2.2 组件复用

每个 Tab 组件的内部结构统一：

```tsx
function ProfessionalTab({ equipment, configId }) {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        {/* 顶部：统计卡片行 */}
        <StatsRow data={...} />
        {/* 中间：专业表格 */}
        <ProfessionalTable columns={专业列} data={equipment} />
      </div>
      {/* 右侧：专业图表面板 */}
      <ProfessionalPanel>
        <Chart1 />
        <Chart2 />
      </ProfessionalPanel>
    </div>
  );
}
```

共享的基础组件：
- `StatsCard` — 统计数字卡片（数值 + 标签 + 颜色）
- `StatsRow` — 一行统计卡片容器
- `ProfessionalTable` — 无限滚动表格（复用 EquipmentTable 的滚动逻辑，但列定义不同）
- `ProfessionalPanel` — 右侧 280px 面板容器

### 2.3 数据流

所有 Tab 共享同一份设备数据（从构型查看页统一加载），不重复请求 API。Tab 切换只是改变表格列定义和统计计算，不触发新的网络请求。

---

## 3. 各 Tab 详细规格

### 3.1 总览 Tab (overview)

保持现有的全字段表格 + 约束面板，不做改动。这是当前构型查看页的默认视图直接移入 Tab。

### 3.2 重量管理 Tab (weight)

**统计卡片（4个）：**
- 总重量 (kg)：所有有重量数据设备的 mass_kg 之和
- CG 位置 (%MAC)：从约束引擎结果取
- MTOW 余量 (kg)：从约束引擎结果取
- 缺重量数据：没有 weight_balance 的设备数量

**表格列：**
LIN号(fixed) | 名称(fixed) | ATA | 重量(kg) | STA(力臂) | 力矩(kg·mm) | 区域 | 供应商 | 状态

- 力矩列 = mass_kg × config_data.sta（计算列）
- 默认按重量降序排序
- 筛选器：有重量/无重量
- 底部汇总行：总重量、总力矩、平均力臂
- 支持按 ATA 分组显示（每组显示小计）

**右侧面板：**
- CG 包线图（复用 CGEnvelopeChart）
- 按 ATA 重量分布横条图
- 按区域重量分布横条图

### 3.3 电气负荷 Tab (electrical)

**统计卡片（3个）：**
- 母线状态总览：彩色圆点矩阵（复用 BusStatusDots）
- 最高负荷母线：负荷率百分比
- 一级用电设备数：is_primary_electrical == true 的数量

**表格列：**
LIN号(fixed) | 名称(fixed) | 母线 | 功耗(kVA) | 供电电压 | 供电余度 | 一级设备 | 是否电设备 | ATA

- 默认按母线分组
- 每组显示母线小计负荷和余量
- 筛选器：按母线、仅电设备、仅一级设备
- 非电设备行灰色显示

**右侧面板：**
- 母线负荷柱状图（全尺寸版）
- 飞行阶段切换器（正常/应急/最大）— 切换后重新计算负荷
- 母线负荷占比饼图

### 3.4 环境鉴定 Tab (do160)

**统计卡片（4个）：**
- 有鉴定数据：dal 字段非空的设备数
- 缺鉴定数据：dal 字段为空的设备数
- 有温度数据：do160_temp_qual_level 非空的数量
- 首飞未上机：first_flight_onboard == false 的数量

**表格列：**
LIN号(fixed) | 名称(fixed) | DAL | 设计要求等级 | 鉴定等级 | 鉴定符合情况 | 正常工作温度 | 短时工作温度 | 地面停放温度 | 高度 | 鉴定报告号 | 首飞上机 | 二阶段上机

- 鉴定符合情况列：红色标注不符合项
- 筛选器：DAL 等级(A/B/C/D)、有/无鉴定、首飞/二阶段状态
- 默认按 DAL 等级排序（A 最高优先）

**右侧面板：**
- DAL 分布饼图（A/B/C/D 各多少台）
- 鉴定覆盖率进度环（已鉴定/总数）
- 首飞/二阶段上机统计

### 3.5 接地搭接 Tab (bonding)

**统计卡片（4个）：**
- 面搭接数量
- 线搭接数量
- 无接地数量
- 缺搭接数据数量

**表格列：**
LIN号(fixed) | 名称(fixed) | 壳体金属 | 壳体特殊处理 | 接地方式 | 搭接类型 | 搭接阻值(mΩ) | 搭接位置 | 故障电流路径 | 特殊接地要求 | PACE图纸 | 物理特性

- 接地方式列：颜色编码（面搭接=绿、线搭接=蓝、无=灰）
- 筛选器：接地方式、壳体材质（金属/非金属）、搭接类型
- 缺失搭接数据行背景浅红

**右侧面板：**
- 接地方式分布环形图
- 搭接类型分布条图
- 壳体材质分布（金属 vs 非金属）

### 3.6 安装布局 Tab (layout)

**统计卡片（3个）：**
- 安装区域数
- 最密集区域（设备数最多的 Zone）
- 需布局调整数（layout_adjustment 非空的数量）

**表格列：**
LIN号(fixed) | 名称(fixed) | 区域 | 机架位置 | STA | WL | BL | 尺寸(mm) | 安装方式 | 布局调整需求 | 使用0号机设备

- 默认按区域分组，每组显示设备数小计
- 筛选器：按区域、按安装方式、有布局调整需求
- 有布局调整需求的行黄色高亮

**右侧面板：**
- 区域设备分布柱状图
- 按区域分布的简化侧视图（小型 SVG）
- "打开 3D 视图" 快捷按钮

### 3.7 EWIS Tab (ewis)

**统计卡片（3个）：**
- 有 EICD：has_eicd == true 的数量
- 总连接器数：connector_count 之和
- 特殊布线需求：has_special_wiring == true 的数量

**表格列：**
LIN号(fixed) | 名称(fixed) | 连接器数 | 有EICD | 特殊布线 | ATA | 区域 | 电压范围 | 供应商

- 默认按连接器数降序（布线复杂度高的优先）
- 筛选器：有/无 EICD、有特殊布线需求
- 连接器数 ≥ 5 的行橙色高亮（高复杂度）

**右侧面板：**
- EICD 覆盖率进度环
- 连接器数量分布直方图（0-1/2-3/4-5/6+）
- 按 ATA 系统的 EICD 覆盖率表

---

## 4. 技术实现

### 4.1 文件结构

```
frontend/src/components/workstation/
├── tabs/
│   ├── OverviewTab.tsx          # 当前表格+约束面板移入
│   ├── WeightTab.tsx
│   ├── ElectricalTab.tsx
│   ├── DO160Tab.tsx
│   ├── BondingTab.tsx
│   ├── LayoutTab.tsx
│   └── EWISTab.tsx
├── shared/
│   ├── StatsCard.tsx            # 统计数字卡片
│   ├── StatsRow.tsx             # 统计卡片行容器
│   ├── ProfessionalTable.tsx    # 通用专业表格（接受 columns 定义）
│   └── ProfessionalPanel.tsx    # 右侧面板容器
└── charts/
    ├── WeightByATABar.tsx       # 按ATA重量分布
    ├── DALPieChart.tsx          # DAL分布饼图
    ├── CoverageRing.tsx         # 覆盖率进度环（通用）
    ├── BondingDistribution.tsx  # 接地方式分布
    ├── ZoneDensityBar.tsx       # 区域密度柱状图
    └── ConnectorHistogram.tsx   # 连接器数分布
```

### 4.2 后端

不需要新的 API 端点。所有统计在前端计算——设备数据已全量加载（含所有 40+ 字段），前端有足够数据做分组/汇总/计数。

约束引擎结果（CG/母线负荷）通过现有 WebSocket 获取。

### 4.3 性能

- 366 台设备的前端统计计算 < 10ms，无需后端聚合
- 切换 Tab 不触发 API 请求（共享数据）
- 图表用 SVG 内联绘制，无第三方图表库

---

## 5. 修改范围

| 文件 | 改动 |
|------|------|
| WorkstationPage.tsx | 重构为 Tab 容器，统一数据加载后分发给各 Tab |
| 新建 7 个 Tab 组件 | 各专业视图实现 |
| 新建 4 个共享组件 | StatsCard/StatsRow/ProfessionalTable/ProfessionalPanel |
| 新建 6 个图表组件 | 各专业图表 |
| EquipmentTable.tsx | 可复用为 ProfessionalTable 的基础（列定义参数化） |

预计新增 ~20 个文件，总代码量 ~2000 行。
