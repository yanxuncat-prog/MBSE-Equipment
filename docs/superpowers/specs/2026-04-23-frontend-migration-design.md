# 前端技术栈迁移设计：Ant Design → Tailwind + shadcn/ui

**日期**: 2026-04-23
**目标**: 将设备管理前端从 Ant Design 完全迁移至 Tailwind CSS + shadcn/ui，视觉风格完全对齐功能与需求平台

## 约束

- 保留 Vite + React Router（不迁移至 Next.js）
- 后端 FastAPI 不变
- Three.js 3D 可视化核心保留，覆盖层控件用新风格重写
- 渐进迁移（Shell-First），过渡期两套 UI 库共存

## 基础设施变更

### 新增依赖
- tailwindcss 4.x + postcss 4 + @tailwindcss/postcss
- @base-ui/react（底层无样式组件原语）
- lucide-react（图标库，替代 @ant-design/icons）
- class-variance-authority（组件变体管理）
- clsx + tailwind-merge（条件类名）
- sonner（toast 通知，替代 antd message/notification）
- react-day-picker（日期选择，替代 antd DatePicker）

### 移除依赖（最终阶段）
- antd
- @ant-design/icons
- dayjs（如仅被 antd DatePicker 使用）

### 设计系统移植
- 从功能与需求复制 `globals.css`（oklch 色彩令牌、CSS 自定义属性）
- 复制 `components/ui/` 目录（26 个 shadcn 基础组件）
- 复制 `lib/utils.ts`（cn 工具函数）

## 布局外壳

### Header（替代 AppLayout 的 Layout.Header + GlobalNav）
- 高度 h-14（56px），sticky，backdrop-blur
- 左侧：Logo "AeroEquip" + 品牌标识
- 中部：Program/Series/Configuration 选择器（shadcn Select）
- 右侧：用户头像 + 退出按钮
- 工位页特有：搜索框 + "添加设备"按钮

### Sidebar（替代 Layout.Sider）
- 可折叠：56px（收起）/ 224px（展开）
- 平滑过渡动画 duration-200
- 拖拽排序菜单项，localStorage 持久化
- 活跃项高亮（背景色变化 + 左侧指示条）
- 菜单项：向导、设备定义、工位、配置、仪表板、采购

### Content 区域
- 白色背景 + rounded-xl + subtle shadow
- 适当内边距和间距

## 页面迁移清单

### 1. LoginPage
- antd Form → shadcn Input + Button + 原生 form
- antd message → sonner toast

### 2. GuidePage
- antd Card/Typography → shadcn Card + Tailwind 排版

### 3. DashboardPage
- antd Card/Statistic → shadcn Card + 自定义统计组件
- antd Timeline → Tailwind 自定义 Timeline
- 图表组件保留（SVG 自绘），容器样式改 Tailwind

### 4. WorkstationPage（7 个 Tab）
- antd Tabs → shadcn Tabs
- 所有子 Tab（Overview、Weight、Electrical、DO160、Bonding、Layout、EWIS）：
  - ProfessionalPanel → shadcn Card 风格重写
  - ProfessionalTable → shadcn Table
  - StatsCard/StatsRow → Tailwind 自定义卡片
  - antd Tag/Badge → shadcn Badge
  - antd Drawer → shadcn Sheet
  - antd Modal → shadcn Dialog
  - antd Select/Input → shadcn Select/Input

### 5. EquipmentDefPage
- antd Table → shadcn Table
- antd Modal/Form → shadcn Dialog + 表单组件

### 6. ConfigPage
- antd Table/Card → shadcn Table/Card
- 配置对比视图样式迁移

### 7. ProcurementPage
- antd Table/Tag/Timeline → shadcn Table/Badge + Tailwind Timeline
- antd DatePicker → react-day-picker

## 3D 可视化

- react-three/fiber + drei 核心不变
- Html 覆盖层中的控件：
  - 设备标签弹窗 → Tailwind 样式 + shadcn Tooltip/Popover
  - 3D/2D 切换按钮 → shadcn Button
  - 控制面板 → shadcn Card

## 组件映射

| Ant Design | shadcn/ui 替代 |
|---|---|
| Layout (Sider/Header/Content) | 自定义 Layout 组件 |
| Table | Table |
| Button | Button (7+ size/variant) |
| Modal | Dialog |
| Drawer | Sheet |
| Select | Select |
| Input | Input |
| Tabs | Tabs |
| Card | Card |
| Tag/Badge | Badge |
| DatePicker | react-day-picker |
| Form/Form.Item | 原生 form + Label + Input |
| Statistic | 自定义组件 |
| Timeline | 自定义 Tailwind 组件 |
| ConfigProvider | 不需要 |
| message/notification | sonner |
| Tooltip | Tooltip |
| Progress | 自定义 Tailwind 组件 |
| Dropdown | DropdownMenu |

## 迁移顺序

1. **Phase 1 — 基础设施**: 安装依赖、配置 Tailwind、移植设计系统
2. **Phase 2 — shadcn 组件**: 移植 ui/ 组件目录、utils
3. **Phase 3 — 布局外壳**: Header + Sidebar + Content 框架
4. **Phase 4 — 简单页面**: LoginPage、GuidePage
5. **Phase 5 — 核心页面**: DashboardPage、ConfigPage、ProcurementPage
6. **Phase 6 — 工位页面**: WorkstationPage + 7 个 Tab
7. **Phase 7 — 3D 可视化**: Three.js 覆盖层控件
8. **Phase 8 — 清理**: 移除 antd、@ant-design/icons、清理未使用代码
