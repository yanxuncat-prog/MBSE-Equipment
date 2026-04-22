# Frontend Migration: Ant Design → Tailwind + shadcn/ui

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Ant Design components and inline styles with Tailwind CSS + shadcn/ui, matching the visual style of the 功能与需求 platform exactly.

**Architecture:** Shell-first progressive migration. Install Tailwind + shadcn alongside Ant Design, migrate layout shell first, then pages one by one, finally remove antd. All 33 source files under `frontend/src/` will be touched.

**Tech Stack:** Tailwind CSS 4, @base-ui/react, shadcn/ui components, lucide-react icons, class-variance-authority, sonner toasts

---

## File Structure

### New files to create
- `frontend/postcss.config.mjs` — PostCSS config for Tailwind CSS 4
- `frontend/src/app.css` — Global CSS with oklch color tokens (replaces no existing CSS)
- `frontend/src/lib/utils.ts` — `cn()` utility for Tailwind class merging
- `frontend/src/components/ui/button.tsx` — shadcn Button
- `frontend/src/components/ui/card.tsx` — shadcn Card
- `frontend/src/components/ui/input.tsx` — shadcn Input
- `frontend/src/components/ui/select.tsx` — shadcn Select
- `frontend/src/components/ui/table.tsx` — shadcn Table
- `frontend/src/components/ui/tabs.tsx` — shadcn Tabs
- `frontend/src/components/ui/dialog.tsx` — shadcn Dialog (replaces antd Modal)
- `frontend/src/components/ui/sheet.tsx` — shadcn Sheet (replaces antd Drawer)
- `frontend/src/components/ui/badge.tsx` — shadcn Badge (replaces antd Tag)
- `frontend/src/components/ui/tooltip.tsx` — shadcn Tooltip
- `frontend/src/components/ui/checkbox.tsx` — shadcn Checkbox
- `frontend/src/components/ui/label.tsx` — shadcn Label
- `frontend/src/components/ui/separator.tsx` — shadcn Separator (replaces antd Divider)
- `frontend/src/components/ui/dropdown-menu.tsx` — shadcn DropdownMenu
- `frontend/src/components/ui/popover.tsx` — shadcn Popover
- `frontend/src/components/ui/scroll-area.tsx` — shadcn ScrollArea
- `frontend/src/components/ui/skeleton.tsx` — shadcn Skeleton (replaces antd Spin)
- `frontend/src/components/ui/avatar.tsx` — shadcn Avatar
- `frontend/src/components/ui/textarea.tsx` — shadcn Textarea
- `frontend/src/components/ui/sonner.tsx` — Toaster component (replaces antd message)

### Files to modify
- `frontend/package.json` — Add new deps, eventually remove antd
- `frontend/vite.config.ts` — Add `@/` path alias
- `frontend/tsconfig.json` — Add path alias mapping
- `frontend/src/main.tsx` — Import global CSS
- `frontend/src/App.tsx` — Remove ConfigProvider, add Toaster
- `frontend/src/components/layout/AppLayout.tsx` — Full rewrite
- `frontend/src/components/layout/GlobalNav.tsx` — Full rewrite
- `frontend/src/pages/LoginPage.tsx` — Full rewrite
- `frontend/src/pages/GuidePage.tsx` — Full rewrite
- `frontend/src/pages/DashboardPage.tsx` — Full rewrite
- `frontend/src/pages/WorkstationPage.tsx` — Full rewrite
- `frontend/src/pages/ConfigPage.tsx` — Full rewrite
- `frontend/src/pages/EquipmentDefPage.tsx` — Full rewrite
- `frontend/src/pages/ProcurementPage.tsx` — Full rewrite
- `frontend/src/pages/SpatialViewPage.tsx` — Full rewrite
- `frontend/src/components/equipment/EquipmentTable.tsx` — Full rewrite
- `frontend/src/components/equipment/EquipmentForm.tsx` — Full rewrite
- `frontend/src/components/equipment/EquipmentDetail.tsx` — Full rewrite
- `frontend/src/components/configuration/ConfigTimeline.tsx` — Full rewrite
- `frontend/src/components/configuration/ConfigDiff.tsx` — Full rewrite
- `frontend/src/components/constraints/ConstraintPanel.tsx` — Full rewrite
- `frontend/src/components/constraints/CGIndicator.tsx` — Tailwind styling
- `frontend/src/components/constraints/BusLoadBar.tsx` — Full rewrite
- `frontend/src/components/spatial/SpatialView.tsx` — Full rewrite
- `frontend/src/components/spatial/EquipmentMarker.tsx` — Tailwind styling
- `frontend/src/components/spatial3d/AircraftScene3D.tsx` — Overlay controls
- `frontend/src/components/workstation/tabs/OverviewTab.tsx` — Tailwind styling
- `frontend/src/components/workstation/tabs/WeightTab.tsx` — Full rewrite
- `frontend/src/components/workstation/tabs/ElectricalTab.tsx` — Full rewrite
- `frontend/src/components/workstation/tabs/DO160Tab.tsx` — Full rewrite
- `frontend/src/components/workstation/tabs/BondingTab.tsx` — Full rewrite
- `frontend/src/components/workstation/tabs/LayoutTab.tsx` — Full rewrite
- `frontend/src/components/workstation/tabs/EWISTab.tsx` — Full rewrite
- `frontend/src/components/workstation/shared/ProfessionalTable.tsx` — Full rewrite
- `frontend/src/components/workstation/shared/ProfessionalPanel.tsx` — Tailwind styling
- `frontend/src/components/workstation/shared/StatsCard.tsx` — Tailwind styling
- `frontend/src/components/workstation/shared/StatsRow.tsx` — Tailwind styling

### Files to delete (final cleanup)
- `frontend/src/styles/layout.ts` — Constants absorbed into Tailwind classes

### Files unchanged (no antd, pure SVG/Three.js)
- `frontend/src/components/charts/CGEnvelopeChart.tsx`
- `frontend/src/components/charts/BusStatusDots.tsx`
- `frontend/src/components/charts/ATADistributionBar.tsx`
- `frontend/src/components/charts/ZoneDonutChart.tsx`
- `frontend/src/components/workstation/charts/SimpleDonut.tsx`
- `frontend/src/components/workstation/charts/HorizontalBar.tsx`
- `frontend/src/components/workstation/charts/CoverageRing.tsx`
- `frontend/src/components/workstation/charts/ConnectorHistogram.tsx`
- `frontend/src/components/spatial/AircraftSideView.tsx`
- `frontend/src/components/spatial/AircraftTopView.tsx`
- `frontend/src/components/spatial/SectionView.tsx`
- `frontend/src/components/spatial/ZoneOverlay.tsx`
- `frontend/src/components/spatial3d/AircraftModel.tsx`
- `frontend/src/components/spatial3d/ZonePlanes.tsx`
- `frontend/src/components/spatial3d/EquipmentMarker3D.tsx`
- `frontend/src/components/spatial3d/FuselageSTL.tsx`
- `frontend/src/components/spatial3d/StaRuler.tsx`
- `frontend/src/api/*` — Unchanged
- `frontend/src/store/*` — Unchanged
- `frontend/src/hooks/*` — Unchanged
- `frontend/src/types/*` — Unchanged

---

## Task 1: Infrastructure — Install Dependencies & Configure Tooling

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`
- Create: `frontend/postcss.config.mjs`

- [ ] **Step 1: Install new dependencies**

```bash
cd frontend
npm install @base-ui/react@^1.3.0 class-variance-authority@^0.7.1 clsx@^2.1.1 lucide-react@^1.7.0 sonner@^2.0.7 tailwind-merge@^3.5.0 tw-animate-css@^1.4.0 shadcn@^4.1.2
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4
```

- [ ] **Step 2: Create PostCSS config**

Create `frontend/postcss.config.mjs`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 3: Add path alias to vite.config.ts**

Replace `frontend/vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 4: Add path alias to tsconfig.json**

Replace `frontend/tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Verify build still works**

```bash
cd frontend && npm run build
```

Expected: Build succeeds (no Tailwind CSS used yet, just tooling installed).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/postcss.config.mjs frontend/vite.config.ts frontend/tsconfig.json
git commit -m "build: add Tailwind CSS 4 + shadcn/ui infrastructure"
```

---

## Task 2: Design System — Global CSS & Utilities

**Files:**
- Create: `frontend/src/app.css`
- Create: `frontend/src/lib/utils.ts`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create global CSS with oklch color tokens**

Create `frontend/src/app.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(0.985 0.002 250);
  --foreground: oklch(0.15 0.02 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.02 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.02 260);
  --primary: oklch(0.45 0.18 260);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.955 0.015 250);
  --secondary-foreground: oklch(0.25 0.04 260);
  --muted: oklch(0.955 0.01 250);
  --muted-foreground: oklch(0.48 0.02 260);
  --accent: oklch(0.955 0.015 250);
  --accent-foreground: oklch(0.25 0.04 260);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.905 0.015 250);
  --input: oklch(0.905 0.015 250);
  --ring: oklch(0.55 0.18 260);
  --chart-1: oklch(0.55 0.18 260);
  --chart-2: oklch(0.65 0.15 160);
  --chart-3: oklch(0.72 0.17 75);
  --chart-4: oklch(0.60 0.20 310);
  --chart-5: oklch(0.55 0.15 30);
  --radius: 0.625rem;
  --sidebar: oklch(0.98 0.005 250);
  --sidebar-foreground: oklch(0.15 0.02 260);
  --sidebar-primary: oklch(0.45 0.18 260);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.94 0.025 250);
  --sidebar-accent-foreground: oklch(0.25 0.04 260);
  --sidebar-border: oklch(0.91 0.015 250);
  --sidebar-ring: oklch(0.55 0.18 260);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Step 2: Create utility functions**

Create `frontend/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Import global CSS in main.tsx**

Replace `frontend/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Verify the app loads with Tailwind active**

```bash
cd frontend && npm run dev
```

Open browser — the body background should now be the oklch background color. Ant Design components will still render on top with their own styles.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app.css frontend/src/lib/utils.ts frontend/src/main.tsx
git commit -m "feat: add oklch design system and Tailwind global CSS"
```

---

## Task 3: Copy shadcn/ui Components

**Files:**
- Create: All 23 files under `frontend/src/components/ui/`

Source: Copy from `/Users/yanxunmaosmacbook/Documents/功能与需求/function-requirement-platform/src/components/ui/`

- [ ] **Step 1: Copy all shadcn/ui component files**

Copy every file from the source project's `src/components/ui/` directory to `frontend/src/components/ui/`. The files are:

```
avatar.tsx, badge.tsx, button.tsx, card.tsx, checkbox.tsx, command.tsx,
confirm-dialog.tsx, dialog.tsx, dropdown-menu.tsx, empty-state.tsx,
input-group.tsx, input.tsx, label.tsx, popover.tsx, scroll-area.tsx,
select.tsx, separator.tsx, sheet.tsx, skeleton.tsx, sonner.tsx,
table.tsx, tabs.tsx, textarea.tsx, tooltip.tsx
```

Do NOT copy `sidebar.tsx` — it's too tightly coupled to Next.js and we'll build our own sidebar.

- [ ] **Step 2: Remove "use client" directives from all files**

In Vite + React, `"use client"` is not needed. Remove it from the top of every copied file. This is cosmetic (it won't break), but keeps things clean.

- [ ] **Step 3: Fix the Toaster/sonner.tsx — remove next-themes dependency**

Replace `frontend/src/components/ui/sonner.tsx` with a Vite-compatible version:

```tsx
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

- [ ] **Step 4: Verify imports compile**

```bash
cd frontend && npx tsc --noEmit
```

Fix any import issues. The `@/` alias should resolve correctly from Task 1.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat: add shadcn/ui component library (23 components)"
```

---

## Task 4: Layout Shell — AppLayout + GlobalNav

This is the highest-impact change — transforms the entire visual frame.

**Files:**
- Rewrite: `frontend/src/components/layout/AppLayout.tsx`
- Rewrite: `frontend/src/components/layout/GlobalNav.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Rewrite AppLayout.tsx**

Replace `frontend/src/components/layout/AppLayout.tsx` with:

```tsx
import React, { useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench, Eye, GitBranch, HelpCircle, LayoutDashboard,
  GripVertical, Database, ShoppingCart, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalNav } from './GlobalNav';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const DEFAULT_MENU: MenuItem[] = [
  { key: '/guide', icon: <HelpCircle className="size-4" />, label: '使用指南' },
  { key: '/equipment-def', icon: <Database className="size-4" />, label: '设备定义' },
  { key: '/workstation', icon: <Eye className="size-4" />, label: '构型查看' },
  { key: '/config', icon: <GitBranch className="size-4" />, label: '构型管理' },
  { key: '/dashboard', icon: <LayoutDashboard className="size-4" />, label: '管理看板' },
  { key: '/procurement', icon: <ShoppingCart className="size-4" />, label: '采购进度' },
];

const STORAGE_KEY = 'aeroequip_menu_order';

function loadMenuOrder(): MenuItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const keys: string[] = JSON.parse(saved);
      const map = new Map(DEFAULT_MENU.map(m => [m.key, m]));
      const ordered = keys.map(k => map.get(k)).filter(Boolean) as MenuItem[];
      for (const item of DEFAULT_MENU) {
        if (!keys.includes(item.key)) ordered.push(item);
      }
      return ordered;
    }
  } catch { /* ignore */ }
  return DEFAULT_MENU;
}

function saveMenuOrder(items: MenuItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(m => m.key)));
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(loadMenuOrder);
  const [collapsed, setCollapsed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (dragNodeRef.current) {
      e.dataTransfer.setDragImage(dragNodeRef.current, 0, 0);
    }
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    setMenuItems(prev => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, dragged);
      saveMenuOrder(next);
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const sidebarWidth = collapsed ? 56 : 224;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Hidden drag image */}
      <div ref={dragNodeRef} className="fixed -top-[9999px] -left-[9999px] size-px" />

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <div className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-200",
            collapsed ? "w-8 justify-center" : "w-full"
          )}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </div>
            {!collapsed && (
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                AeroEquip
              </span>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.key;
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;

            return (
              <div
                key={item.key}
                draggable
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                onClick={() => navigate(item.key)}
                className={cn(
                  "group relative mx-2 mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors select-none",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  isDragging && "opacity-40",
                  isOver && dragIndex !== null && dragIndex > index && "border-t-2 border-primary",
                  isOver && dragIndex !== null && dragIndex < index && "border-b-2 border-primary",
                )}
              >
                {!collapsed && (
                  <GripVertical className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 cursor-grab" />
                )}
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col transition-all duration-200" style={{ marginLeft: sidebarWidth }}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
          <GlobalNav />
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/50 min-h-[calc(100vh-88px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite GlobalNav.tsx**

Replace `frontend/src/components/layout/GlobalNav.tsx` with:

```tsx
import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '@/store/configStore';
import { listPrograms, listSeries, listConfigs } from '@/api/configurations';
import type { Program, Series, Configuration } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const workstationActions = {
  onAdd: null as (() => void) | null,
  onSearch: null as ((value: string) => void) | null,
  searchValue: '',
};

export function GlobalNav() {
  const { activeProgramId, activeSeriesId, activeConfigId, setActiveProgram, setActiveSeries, setActiveConfig } = useConfigStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const isWorkstation = location.pathname === '/workstation';
  const isEquipmentDef = location.pathname === '/equipment-def';
  const needsConfig = !isEquipmentDef && location.pathname !== '/guide';

  useEffect(() => {
    listPrograms().then(setPrograms).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeProgramId) {
      listSeries(activeProgramId).then((s) => {
        setSeriesList(s);
        if (s.length > 0 && !activeSeriesId) setActiveSeries(s[0].id);
      }).catch(() => {});
    }
  }, [activeProgramId]);

  useEffect(() => {
    if (activeSeriesId) {
      listConfigs(activeSeriesId).then((c) => {
        setConfigs(c);
        if (c.length > 0 && !activeConfigId) setActiveConfig(c[0].id);
      }).catch(() => {});
    }
  }, [activeSeriesId]);

  useEffect(() => {
    if (programs.length > 0 && !activeProgramId) {
      setActiveProgram(programs[0].id);
    }
  }, [programs]);

  const handleSearch = (value: string) => {
    setSearch(value);
    workstationActions.onSearch?.(value);
  };

  return (
    <div className="flex w-full items-center gap-2">
      {isEquipmentDef && (
        <span className="text-sm text-muted-foreground">设备定义 — 管理设备固有属性（不依赖构型）</span>
      )}

      {needsConfig && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">型号:</span>
          <Select value={activeProgramId || ''} onValueChange={setActiveProgram}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="选择型号" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">系列:</span>
          <Select value={activeSeriesId || ''} onValueChange={setActiveSeries}>
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue placeholder="选择系列" />
            </SelectTrigger>
            <SelectContent>
              {seriesList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.variant_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">构型:</span>
          <Select value={activeConfigId || ''} onValueChange={setActiveConfig}>
            <SelectTrigger size="sm" className="w-[160px]">
              <SelectValue placeholder="选择构型" />
            </SelectTrigger>
            <SelectContent>
              {configs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{`${c.version} (${c.status})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isWorkstation && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" onClick={() => workstationActions.onAdd?.()}>
            <Plus className="size-3.5" />
            添加设备
          </Button>
          <div className="relative w-[200px]">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索件号/名称"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx — remove ConfigProvider, add Toaster**

Replace `frontend/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkstationPage } from '@/pages/WorkstationPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { LoginPage } from '@/pages/LoginPage';
import { GuidePage } from '@/pages/GuidePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EquipmentDefPage } from '@/pages/EquipmentDefPage';
import { ProcurementPage } from '@/pages/ProcurementPage';

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/guide" replace />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/equipment-def" element={<EquipmentDefPage />} />
            <Route path="/workstation" element={<WorkstationPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Verify app loads with new layout**

```bash
cd frontend && npm run dev
```

Open browser — the sidebar and header should now render in the new shadcn/Tailwind style. Inner pages will still show antd components (this is expected during progressive migration).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/ frontend/src/App.tsx
git commit -m "feat: new layout shell with collapsible sidebar and shadcn header"
```

---

## Task 5: LoginPage Migration

**Files:**
- Rewrite: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Rewrite LoginPage**

Replace `frontend/src/pages/LoginPage.tsx` with:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '@/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { username, password });
      localStorage.setItem('token', data.access_token);
      navigate('/workstation');
    } catch {
      toast.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>AeroEquip 设备管理平台</CardTitle>
          <CardDescription>请登录您的账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Test login page renders**

Navigate to `/login` in browser. Verify the card renders with the shadcn style.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: migrate LoginPage to shadcn/ui"
```

---

## Task 6: GuidePage Migration

**Files:**
- Rewrite: `frontend/src/pages/GuidePage.tsx`

- [ ] **Step 1: Read current GuidePage to understand content structure**

Read `frontend/src/pages/GuidePage.tsx` — it uses antd Card, Steps, Tag, Alert, Typography, and many icons. The content is static documentation.

- [ ] **Step 2: Rewrite GuidePage with Tailwind + shadcn**

Replace all antd imports with lucide-react icons + shadcn Card + Badge. Convert `Steps` to a custom ordered list with Tailwind. Convert `Alert` to a styled div with ring/border. Convert all inline styles to Tailwind classes.

Key mappings:
- `Card` → `Card` + `CardHeader` + `CardContent` from shadcn
- `Steps` → Custom `<ol>` with Tailwind-styled step indicators
- `Tag` → `Badge` from shadcn
- `Alert` → `<div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">`
- `Typography.Title` → `<h2 className="text-lg font-semibold">`
- `Typography.Paragraph` → `<p className="text-sm text-muted-foreground">`
- `Divider` → `Separator` from shadcn
- All `@ant-design/icons` → equivalent `lucide-react` icons

- [ ] **Step 3: Verify guide page renders**

Navigate to `/guide` and verify all sections display correctly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/GuidePage.tsx
git commit -m "feat: migrate GuidePage to shadcn/ui"
```

---

## Task 7: Workstation Shared Components

These are used across all workstation tabs and must be migrated before the tabs.

**Files:**
- Rewrite: `frontend/src/components/workstation/shared/ProfessionalTable.tsx`
- Rewrite: `frontend/src/components/workstation/shared/ProfessionalPanel.tsx`
- Rewrite: `frontend/src/components/workstation/shared/StatsCard.tsx`
- Rewrite: `frontend/src/components/workstation/shared/StatsRow.tsx`

- [ ] **Step 1: Rewrite ProfessionalTable**

Replace `frontend/src/components/workstation/shared/ProfessionalTable.tsx`. This is the most critical shared component — it currently wraps antd `Table`. Replace with shadcn `Table` components.

The current component accepts antd `ColumnsType` and renders an antd `Table`. The new version must accept a compatible column definition and render using shadcn Table primitives.

```tsx
import React from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Column<T> {
  title: string;
  dataIndex?: string;
  key: string;
  width?: number;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface ProfessionalTableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T) => { onClick?: () => void };
  selectedRowKey?: string;
  maxHeight?: string;
  className?: string;
}

export function ProfessionalTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  rowKey = 'id',
  onRow,
  selectedRowKey,
  maxHeight = 'calc(100vh - 300px)',
  className,
}: ProfessionalTableProps<T>) {
  const getKey = (record: T) =>
    typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey]);

  return (
    <ScrollArea className={cn("rounded-lg border", className)} style={{ maxHeight }}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map(col => (
              <TableHead
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSource.map((record, rowIndex) => {
            const key = getKey(record);
            const rowProps = onRow?.(record);
            return (
              <TableRow
                key={key}
                onClick={rowProps?.onClick}
                className={cn(
                  rowProps?.onClick && "cursor-pointer",
                  selectedRowKey === key && "bg-primary/5"
                )}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                  >
                    {col.render
                      ? col.render(col.dataIndex ? record[col.dataIndex] : undefined, record, rowIndex)
                      : col.dataIndex ? String(record[col.dataIndex] ?? '') : ''}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {dataSource.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Rewrite ProfessionalPanel, StatsCard, StatsRow**

Replace `ProfessionalPanel.tsx`:

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ProfessionalPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function ProfessionalPanel({ children, className }: ProfessionalPanelProps) {
  return (
    <div className={cn("w-[280px] shrink-0 space-y-4 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
```

Replace `StatsCard.tsx`:

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  color?: string;
  className?: string;
}

export function StatsCard({ label, value, color, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
```

Replace `StatsRow.tsx`:

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsRow({ children, className }: StatsRowProps) {
  return (
    <div className={cn("grid auto-cols-fr grid-flow-col gap-3", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/workstation/shared/
git commit -m "feat: migrate workstation shared components to shadcn/ui"
```

---

## Task 8: Constraint Components

**Files:**
- Rewrite: `frontend/src/components/constraints/ConstraintPanel.tsx`
- Rewrite: `frontend/src/components/constraints/CGIndicator.tsx`
- Rewrite: `frontend/src/components/constraints/BusLoadBar.tsx`

- [ ] **Step 1: Rewrite ConstraintPanel**

Replace antd Card/Space/Tag/Typography with shadcn Card + Badge + Tailwind. Replace `CheckCircleOutlined`, `WarningOutlined`, `StopOutlined` with lucide `CircleCheck`, `AlertTriangle`, `CircleX`.

Key mapping:
- `<Card size="small" title="...">` → `<Card size="sm"><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>`
- `<Tag color="success">` → `<Badge variant="secondary" className="bg-green-100 text-green-700">`
- `<Typography.Text>` → `<span className="text-sm">`

- [ ] **Step 2: Rewrite CGIndicator**

Replace `Typography` import with plain `<span>` elements using Tailwind classes. Convert all inline `style={{...}}` to Tailwind classes. The SVG content stays as-is since it's custom visualization code.

- [ ] **Step 3: Rewrite BusLoadBar**

Replace antd `Progress` with a custom Tailwind progress bar:

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface BusLoadBarProps {
  busName: string;
  load: number;
  capacity: number;
}

export function BusLoadBar({ busName, load, capacity }: BusLoadBarProps) {
  const pct = capacity > 0 ? (load / capacity) * 100 : 0;
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{busName}</span>
        <span className="text-muted-foreground">{load.toFixed(1)} / {capacity} A ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/constraints/
git commit -m "feat: migrate constraint components to shadcn/ui"
```

---

## Task 9: Equipment Components

**Files:**
- Rewrite: `frontend/src/components/equipment/EquipmentTable.tsx`
- Rewrite: `frontend/src/components/equipment/EquipmentForm.tsx`
- Rewrite: `frontend/src/components/equipment/EquipmentDetail.tsx`

- [ ] **Step 1: Rewrite EquipmentTable**

Read current `EquipmentTable.tsx` (250 lines). Replace:
- antd `Table` → Use the new `ProfessionalTable` from Task 7
- antd `Tag` → shadcn `Badge`
- antd `Button` → shadcn `Button`
- antd `Popconfirm` → shadcn `ConfirmDialog` or inline confirmation
- antd `message` → `toast` from sonner
- antd `Spin` → `Skeleton` or lucide `Loader2`
- `DeleteOutlined` → lucide `Trash2`
- `ColumnsType` → `Column<T>[]` from new ProfessionalTable
- All inline styles → Tailwind classes

The infinite scroll and Intersection Observer logic stays the same.

- [ ] **Step 2: Rewrite EquipmentForm**

Replace:
- antd `Modal` → shadcn `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter`
- antd `Form` / `Form.Item` → native `<form>` + `<Label>` + `<Input>` with state
- antd `Select` → shadcn `Select`
- antd `InputNumber` → `<Input type="number">`
- antd `Tabs` → shadcn `Tabs`

- [ ] **Step 3: Rewrite EquipmentDetail**

Replace:
- antd `Drawer` → shadcn `Sheet` + `SheetContent` + `SheetHeader` + `SheetTitle`
- antd `Descriptions` → a custom description list with Tailwind grid
- antd `Tag` → shadcn `Badge`
- antd `Divider` → shadcn `Separator`

Pattern for Descriptions replacement:

```tsx
<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
  <div className="text-muted-foreground">件号</div>
  <div>{equipment.part_number}</div>
  <div className="text-muted-foreground">名称</div>
  <div>{equipment.name}</div>
</div>
```

- [ ] **Step 4: Test equipment workflow**

Navigate to `/equipment-def`, verify table renders, create/edit/delete works, detail drawer opens.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/equipment/
git commit -m "feat: migrate equipment components to shadcn/ui"
```

---

## Task 10: Configuration Components

**Files:**
- Rewrite: `frontend/src/components/configuration/ConfigTimeline.tsx`
- Rewrite: `frontend/src/components/configuration/ConfigDiff.tsx`
- Rewrite: `frontend/src/pages/ConfigPage.tsx`

- [ ] **Step 1: Rewrite ConfigTimeline**

Replace antd `Timeline` with a custom Tailwind timeline:

```tsx
{/* Timeline item pattern */}
<div className="relative pl-6 pb-4 last:pb-0">
  <div className="absolute left-0 top-1 size-3 rounded-full border-2 border-primary bg-background" />
  <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border last:hidden" />
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">{version}</span>
    <Badge variant="secondary">{status}</Badge>
  </div>
</div>
```

Replace `LockOutlined` with lucide `Lock`. Replace `Tag` with `Badge`.

- [ ] **Step 2: Rewrite ConfigDiff**

Replace:
- antd `Select` → shadcn `Select`
- antd `Table` → `ProfessionalTable`
- antd `Tag` → `Badge`
- antd `Switch` → shadcn `Checkbox` with label
- antd `Statistic` → custom stat component
- antd `Row/Col` → Tailwind grid
- `PlusOutlined/MinusOutlined/SwapOutlined` → lucide `Plus/Minus/ArrowLeftRight`

- [ ] **Step 3: Rewrite ConfigPage**

Replace:
- antd `Button` → shadcn `Button`
- antd `Modal` → shadcn `Dialog`
- antd `Input` → shadcn `Input`
- antd `message` → `toast`
- `PlusOutlined/CopyOutlined/LockOutlined` → lucide equivalents

- [ ] **Step 4: Test config workflow**

Navigate to `/config`, verify timeline, diff, create/clone actions.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/configuration/ frontend/src/pages/ConfigPage.tsx
git commit -m "feat: migrate configuration components to shadcn/ui"
```

---

## Task 11: DashboardPage

**Files:**
- Rewrite: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Read and rewrite DashboardPage**

Read current `DashboardPage.tsx` (212 lines). Replace:
- antd `Card` → shadcn `Card`
- antd `Row/Col` → Tailwind `grid grid-cols-4 gap-4`
- antd `Statistic` → Custom stat component: `<div className="text-2xl font-bold">{value}</div>`
- antd `Tag` → `Badge`
- antd `Timeline` → Custom Tailwind timeline (same pattern as ConfigTimeline)
- antd `Spin` → `Skeleton`
- antd icons → lucide equivalents
- All inline styles → Tailwind classes

- [ ] **Step 2: Test dashboard**

Navigate to `/dashboard`, verify all KPI cards, charts, and timeline render.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: migrate DashboardPage to shadcn/ui"
```

---

## Task 12: WorkstationPage + OverviewTab

**Files:**
- Rewrite: `frontend/src/pages/WorkstationPage.tsx`
- Rewrite: `frontend/src/components/workstation/tabs/OverviewTab.tsx`

- [ ] **Step 1: Rewrite WorkstationPage**

Replace antd `Tabs` with shadcn `Tabs`:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Replace antd Tabs with:
<Tabs defaultValue="overview">
  <TabsList variant="line">
    <TabsTrigger value="overview">总览</TabsTrigger>
    <TabsTrigger value="weight">重量</TabsTrigger>
    <TabsTrigger value="electrical">电气</TabsTrigger>
    <TabsTrigger value="do160">DO-160</TabsTrigger>
    <TabsTrigger value="bonding">搭接</TabsTrigger>
    <TabsTrigger value="layout">布局</TabsTrigger>
    <TabsTrigger value="ewis">EWIS</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  {/* etc */}
</Tabs>
```

Replace `message` with `toast`.

- [ ] **Step 2: Rewrite OverviewTab**

Replace any antd usage and inline styles with Tailwind `flex gap-4` layout.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/WorkstationPage.tsx frontend/src/components/workstation/tabs/OverviewTab.tsx
git commit -m "feat: migrate WorkstationPage and OverviewTab to shadcn/ui"
```

---

## Task 13: WeightTab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/WeightTab.tsx` (471 lines)

- [ ] **Step 1: Read and rewrite WeightTab**

Replace:
- antd `Card` → shadcn `Card`
- antd `Tag` → `Badge`
- antd `Tooltip` → shadcn `Tooltip` + `TooltipTrigger` + `TooltipContent`
- antd `Typography` → Tailwind text classes
- antd `ColumnsType` → `Column<T>[]` from ProfessionalTable
- All inline styles → Tailwind classes
- The treemap and custom SVG visualizations stay as-is (they don't use antd)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/WeightTab.tsx
git commit -m "feat: migrate WeightTab to shadcn/ui"
```

---

## Task 14: ElectricalTab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/ElectricalTab.tsx` (542 lines)

- [ ] **Step 1: Read and rewrite ElectricalTab**

Same antd replacement pattern as WeightTab. The Sankey diagram SVG stays as-is.

Replace:
- antd `Card` → shadcn `Card`
- antd `Button` → shadcn `Button`
- antd `Tag` → `Badge`
- antd `Tooltip` → shadcn `Tooltip`
- antd `Typography` → Tailwind text classes
- antd `ColumnsType` → `Column<T>[]`
- All inline styles → Tailwind classes

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/ElectricalTab.tsx
git commit -m "feat: migrate ElectricalTab to shadcn/ui"
```

---

## Task 15: DO160Tab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/DO160Tab.tsx` (407 lines)

- [ ] **Step 1: Read and rewrite DO160Tab**

Replace:
- antd `Card` → shadcn `Card`
- antd `Switch` → shadcn `Checkbox` (or a custom toggle)
- antd `Tooltip` → shadcn `Tooltip`
- antd `Typography` → Tailwind text classes
- antd `ColumnsType` → `Column<T>[]`
- All inline styles → Tailwind classes

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/DO160Tab.tsx
git commit -m "feat: migrate DO160Tab to shadcn/ui"
```

---

## Task 16: BondingTab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/BondingTab.tsx` (273 lines)

- [ ] **Step 1: Read and rewrite BondingTab**

Replace:
- antd `Card` → shadcn `Card`
- antd `Collapse` → Native HTML `<details>`/`<summary>` with Tailwind styling, or build a simple collapsible:

```tsx
const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

<div className="rounded-lg border">
  <button
    onClick={() => toggleGroup(key)}
    className="flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-muted/50"
  >
    <span>{title}</span>
    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
  </button>
  {open && <div className="border-t p-3">{content}</div>}
</div>
```

- antd `Tag` → `Badge`
- antd `Tooltip` → shadcn `Tooltip`
- antd `ColumnsType` → `Column<T>[]`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/BondingTab.tsx
git commit -m "feat: migrate BondingTab to shadcn/ui"
```

---

## Task 17: LayoutTab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/LayoutTab.tsx` (375 lines)

- [ ] **Step 1: Read and rewrite LayoutTab**

Replace:
- antd `Card` → shadcn `Card`
- antd `Segmented` → shadcn `TabsList` inline variant or custom button group:

```tsx
<div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px]">
  {options.map(opt => (
    <button
      key={opt.value}
      onClick={() => setValue(opt.value)}
      className={cn(
        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
        value === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {opt.label}
    </button>
  ))}
</div>
```

- antd `Tooltip` → shadcn `Tooltip`
- antd `Spin` → `Skeleton` or `Loader2` spinner
- antd `Typography` → Tailwind text classes
- antd `ColumnsType` → `Column<T>[]`
- The 3D AircraftScene3D embed and its overlay controls will be addressed in Task 20

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/LayoutTab.tsx
git commit -m "feat: migrate LayoutTab to shadcn/ui"
```

---

## Task 18: EWISTab

**Files:**
- Rewrite: `frontend/src/components/workstation/tabs/EWISTab.tsx` (476 lines)

- [ ] **Step 1: Read and rewrite EWISTab**

Same antd replacement pattern as other tabs:
- antd `Card` → shadcn `Card`
- antd `Tag` → `Badge`
- antd `Tooltip` → shadcn `Tooltip`
- antd `Typography` → Tailwind text classes
- antd `ColumnsType` → `Column<T>[]`
- All inline styles → Tailwind classes

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workstation/tabs/EWISTab.tsx
git commit -m "feat: migrate EWISTab to shadcn/ui"
```

---

## Task 19: EquipmentDefPage + ProcurementPage

**Files:**
- Rewrite: `frontend/src/pages/EquipmentDefPage.tsx` (273 lines)
- Rewrite: `frontend/src/pages/ProcurementPage.tsx` (572 lines)

- [ ] **Step 1: Rewrite EquipmentDefPage**

Replace:
- antd `Table` → `ProfessionalTable`
- antd `Tag` → `Badge`
- antd `Button` → shadcn `Button`
- antd `Input` → shadcn `Input`
- antd `Popconfirm` → confirm dialog
- antd `message` → `toast`
- antd `Spin` → `Skeleton`
- antd `Drawer` → `Sheet`
- antd `Descriptions` → Tailwind grid description list
- antd `Divider` → `Separator`
- `PlusOutlined/SearchOutlined/DeleteOutlined` → lucide equivalents

- [ ] **Step 2: Rewrite ProcurementPage**

This is the largest page (572 lines). Replace:
- antd `Table` → `ProfessionalTable`
- antd `Tag` → `Badge` with status-colored classes
- antd `Card` → shadcn `Card`
- antd `Select` → shadcn `Select`
- antd `Checkbox` → shadcn `Checkbox`
- antd `Drawer` → `Sheet`
- antd `Button` → shadcn `Button`
- antd `DatePicker` → Use a native date input or install `react-day-picker`:

```tsx
<Input type="date" value={date} onChange={e => setDate(e.target.value)} />
```

- antd `Input` → shadcn `Input`
- antd `message` → `toast`
- antd `Badge` → shadcn `Badge`
- `EditOutlined` → lucide `Pencil`
- Custom SVG charts (donut, bars) stay as-is
- All inline styles → Tailwind classes

For overdue row highlighting:
```tsx
<TableRow className={cn(isOverdue && "bg-destructive/5")}>
```

- [ ] **Step 3: Test both pages**

Navigate to `/equipment-def` and `/procurement`, verify tables, filters, drawers work.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/EquipmentDefPage.tsx frontend/src/pages/ProcurementPage.tsx
git commit -m "feat: migrate EquipmentDefPage and ProcurementPage to shadcn/ui"
```

---

## Task 20: Spatial & 3D Components

**Files:**
- Rewrite: `frontend/src/components/spatial/SpatialView.tsx`
- Modify: `frontend/src/components/spatial/EquipmentMarker.tsx`
- Modify: `frontend/src/components/spatial3d/AircraftScene3D.tsx`
- Rewrite: `frontend/src/pages/SpatialViewPage.tsx`

- [ ] **Step 1: Rewrite SpatialView**

Replace:
- antd `Tabs` → shadcn `Tabs`
- antd `Slider` → native range `<input type="range">` with Tailwind styling
- antd `Typography` → Tailwind text classes
- antd `Spin` → `Skeleton` or `Loader2`

- [ ] **Step 2: Restyle EquipmentMarker**

Convert all inline React styles to Tailwind classes. No antd imports to remove, just styling migration.

- [ ] **Step 3: Restyle AircraftScene3D overlay controls**

The Three.js Canvas and @react-three/fiber code stays untouched. Only the Html overlay components (rendered via `@react-three/drei`'s `Html`) need their inline styles converted to Tailwind classes. Any button-like controls in the 3D view should use shadcn `Button`.

- [ ] **Step 4: Rewrite SpatialViewPage**

Replace `message` import with `toast`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/spatial/ frontend/src/components/spatial3d/AircraftScene3D.tsx frontend/src/pages/SpatialViewPage.tsx
git commit -m "feat: migrate spatial/3D view controls to shadcn/ui"
```

---

## Task 21: Final Cleanup — Remove Ant Design

**Files:**
- Modify: `frontend/package.json`
- Delete: `frontend/src/styles/layout.ts`

- [ ] **Step 1: Search for any remaining antd imports**

```bash
cd frontend && grep -r "from 'antd'" src/ && grep -r "from '@ant-design" src/
```

Expected: No matches. If any remain, migrate those files first.

- [ ] **Step 2: Search for remaining inline styles**

```bash
cd frontend && grep -r "style={{" src/ --include="*.tsx" -l
```

Review each match. Chart/SVG components may legitimately use inline styles for dynamic values (like `width: ${pct}%`). Non-chart components should use Tailwind classes.

- [ ] **Step 3: Remove antd dependencies**

```bash
cd frontend && npm uninstall antd @ant-design/icons
```

- [ ] **Step 4: Remove layout constants file**

Delete `frontend/src/styles/layout.ts` — its constants have been absorbed into Tailwind classes throughout the migration.

- [ ] **Step 5: Remove any remaining antd CSS imports**

Search for and remove any antd CSS imports (there may not be any since the project used inline styles).

- [ ] **Step 6: Full build verification**

```bash
cd frontend && npx tsc --noEmit && npm run build
```

Expected: Clean build with zero errors.

- [ ] **Step 7: Full visual verification**

```bash
cd frontend && npm run dev
```

Navigate through every page and verify:
- `/login` — Login form renders with card style
- `/guide` — Documentation page with cards and steps
- `/equipment-def` — Table with search, detail sheet
- `/workstation` — All 7 tabs render correctly
- `/config` — Timeline, diff, create/clone dialogs
- `/dashboard` — KPI cards, charts, timeline
- `/procurement` — Table with filters, edit sheet, status badges

- [ ] **Step 8: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove antd, cleanup layout constants — migration complete"
```

---

## Migration Reference: Ant Design → shadcn/ui Component Map

| Ant Design | shadcn/ui | Import |
|---|---|---|
| `Button` | `Button` | `@/components/ui/button` |
| `Card` | `Card, CardHeader, CardTitle, CardContent, CardFooter` | `@/components/ui/card` |
| `Input` | `Input` | `@/components/ui/input` |
| `Select` | `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` | `@/components/ui/select` |
| `Table` | `ProfessionalTable` (custom) or `Table, TableHeader, TableBody, TableRow, TableHead, TableCell` | `@/components/ui/table` |
| `Tabs` | `Tabs, TabsList, TabsTrigger, TabsContent` | `@/components/ui/tabs` |
| `Modal` | `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` | `@/components/ui/dialog` |
| `Drawer` | `Sheet, SheetContent, SheetHeader, SheetTitle` | `@/components/ui/sheet` |
| `Tag` | `Badge` | `@/components/ui/badge` |
| `Tooltip` | `Tooltip, TooltipTrigger, TooltipContent` | `@/components/ui/tooltip` |
| `Divider` | `Separator` | `@/components/ui/separator` |
| `Checkbox` | `Checkbox` | `@/components/ui/checkbox` |
| `Form.Item` + `label` | `<Label>` + component | `@/components/ui/label` |
| `Popconfirm` | `ConfirmDialog` | `@/components/ui/confirm-dialog` |
| `Spin` | `Skeleton` or `<Loader2 className="animate-spin" />` | `@/components/ui/skeleton` or `lucide-react` |
| `message.success/error` | `toast.success/error` | `sonner` |
| `ConfigProvider` | Not needed | — |
| `Typography.Title` | `<h2 className="text-lg font-semibold">` | Plain HTML + Tailwind |
| `Typography.Text` | `<span className="text-sm">` | Plain HTML + Tailwind |
| `Row / Col` | `<div className="grid grid-cols-N gap-4">` | Plain HTML + Tailwind |
| `Space` | `<div className="flex items-center gap-2">` | Plain HTML + Tailwind |
| `Statistic` | Custom: title + value div | Plain HTML + Tailwind |
| `Timeline` | Custom timeline with `pl-6 border-l` pattern | Plain HTML + Tailwind |
| `Steps` | Custom ordered list with step indicators | Plain HTML + Tailwind |
| `Collapse` | `<details>` / custom collapsible | Plain HTML + Tailwind |
| `Segmented` | Custom button group with `bg-muted` container | Plain HTML + Tailwind |
| `Progress` | Custom `<div>` with width% | Plain HTML + Tailwind |
| `Descriptions` | `<div className="grid grid-cols-2 gap-2">` | Plain HTML + Tailwind |
| `Alert` | `<div className="rounded-lg border bg-primary/5 p-3">` | Plain HTML + Tailwind |

## Icon Migration: @ant-design/icons → lucide-react

| @ant-design/icons | lucide-react |
|---|---|
| `ToolOutlined` | `Wrench` |
| `EnvironmentOutlined` | `MapPin` |
| `BranchesOutlined` | `GitBranch` |
| `QuestionCircleOutlined` | `HelpCircle` |
| `DashboardOutlined` | `LayoutDashboard` |
| `HolderOutlined` | `GripVertical` |
| `DatabaseOutlined` | `Database` |
| `EyeOutlined` | `Eye` |
| `ShoppingOutlined` | `ShoppingCart` |
| `PlusOutlined` | `Plus` |
| `SearchOutlined` | `Search` |
| `DeleteOutlined` | `Trash2` |
| `EditOutlined` | `Pencil` |
| `CheckCircleOutlined` | `CircleCheck` |
| `WarningOutlined` | `AlertTriangle` |
| `StopOutlined` | `CircleX` |
| `CopyOutlined` | `Copy` |
| `LockOutlined` | `Lock` |
| `LoginOutlined` | `LogIn` |
| `FileTextOutlined` | `FileText` |
| `SwapOutlined` | `ArrowLeftRight` |
| `MinusOutlined` | `Minus` |
