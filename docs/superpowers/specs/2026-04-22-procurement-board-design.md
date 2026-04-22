# 采购进度看板设计规格

> 版本: 1.0 | 日期: 2026-04-22

---

## 1. 概述

在侧边栏新增「采购进度」菜单，提供一个看板页面展示当前构型下每台设备的采购状态、物理位置和交付计划。核心目标：让所有人实时看到"XXX设备到哪了？什么时候交货？"。

## 2. 数据模型

在现有 `ConfigEquipment` 模型上新增 5 个字段（不新建表）：

| 字段 | 类型 | 说明 |
|------|------|------|
| procurement_status | ENUM | 询价(inquiry) / 合同(contracted) / 生产中(producing) / 检验(inspecting) / 在途(shipping) / 已到货(delivered) | 默认 null（未启动）|
| procurement_location | VARCHAR(50) | 设备当前城市：北京/上海/成都/西安/沈阳/大场/其他 |
| planned_delivery_date | DATE | 计划交付日期 |
| estimated_delivery_date | DATE | 预计/实际交付日期（供应商更新） |
| procurement_notes | TEXT | 采购备注 |

逾期计算：`planned_delivery_date < today AND procurement_status NOT IN ('delivered')`

## 3. API

### 3.1 读取

复用现有 `GET /api/equipment?config_id=`，采购字段随 `config_data` 返回：

```json
{
  "config_data": {
    "zone_name": "驾驶舱",
    "sta": 280,
    "procurement_status": "producing",
    "procurement_location": "成都",
    "planned_delivery_date": "2026-06-15",
    "estimated_delivery_date": null,
    "procurement_notes": null
  }
}
```

### 3.2 更新采购状态

`PUT /api/configurations/{config_id}/equipment/{equip_id}/procurement`

```json
{
  "procurement_status": "shipping",
  "procurement_location": "在途",
  "estimated_delivery_date": "2026-06-20",
  "procurement_notes": "已从成都发货"
}
```

### 3.3 批量更新

`PUT /api/configurations/{config_id}/procurement/batch`

```json
{
  "equipment_ids": ["id1", "id2"],
  "procurement_status": "delivered",
  "procurement_location": "上海"
}
```

## 4. 前端页面

### 4.1 页面结构

```
┌─ 顶部: 状态汇总条 ──────────────────────────────────────────┐
│ [未启动 106] [询价 15] [合同 22] [生产中 180] [检验 8]        │
│ [在途 12] [已到货 45] [⚠ 逾期 23]                           │
└──────────────────────────────────────────────────────────────┘

┌─ 主区域 (flex) ──────────────────────────────────────────────┐
│                                                              │
│  左侧: 设备采购表格 (无限滚动)                                 │
│  ────────────────────────────────────────────                │
│  LIN号 | 名称 | 供应商 | 状态(Tag) | 位置 | 计划日 |          │
│  预计日 | 逾期天数 | 操作(编辑状态)                              │
│                                                              │
│  筛选: [状态▾] [位置▾] [供应商▾] [只看逾期☑]                   │
│  行颜色: 逾期=红, 在途=蓝, 已到货=绿, 未启动=灰               │
│                                                              │
│  右侧: 面板 (280px)                                          │
│  ────────────────                                            │
│  ● 城市分布饼图 (SimpleDonut)                                 │
│  ● 逾期设备 TOP 10 紧急列表                                   │
│  ● 按供应商交付统计 (HorizontalBar)                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 状态汇总条

点击任一状态数字 → 自动筛选表格到该状态。逾期数字用红色脉冲动画。

### 4.3 编辑采购状态

表格行末"操作"列：点击"编辑" → 弹出 Drawer，包含：
- 状态下拉（6选1）
- 位置下拉（城市列表）
- 计划交付日期（DatePicker）
- 预计交付日期（DatePicker）
- 备注（TextArea）
- 保存按钮

支持多选行 → 批量更新状态和位置。

### 4.4 状态颜色编码

| 状态 | 颜色 | Tag |
|------|------|-----|
| 未启动 | #8E8E93 灰 | 默认 |
| 询价 | #5AC8FA 浅蓝 | blue |
| 合同 | #007AFF 蓝 | blue |
| 生产中 | #FF9500 橙 | orange |
| 检验 | #AF52DE 紫 | purple |
| 在途 | #34C759 绿 | green |
| 已到货 | #34C759 深绿 | success |
| 逾期 | #FF3B30 红 | error（叠加在当前状态上） |

## 5. 技术实现

### 5.1 后端

- 修改 `backend/app/models/configuration.py`：ConfigEquipment 加 5 字段
- 修改 `backend/app/schemas/equipment.py`：ConfigEquipmentData 加 5 字段
- 新建 `backend/app/api/procurement.py`：PUT 单个 + PUT 批量
- 修改 `backend/app/main.py`：挂载 procurement router
- 修改导入脚本：新字段默认 null

### 5.2 前端

- 新建 `frontend/src/pages/ProcurementPage.tsx`：完整看板页面
- 修改 `frontend/src/types/index.ts`：ConfigEquipmentData 加 5 字段
- 修改 `frontend/src/components/layout/AppLayout.tsx`：加菜单项
- 修改 `frontend/src/App.tsx`：加路由
- 修改 `frontend/src/components/layout/GlobalNav.tsx`：采购页显示构型选择器
