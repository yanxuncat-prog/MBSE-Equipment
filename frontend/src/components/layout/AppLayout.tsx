import React, { useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, GitBranch, HelpCircle, LayoutDashboard,
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
