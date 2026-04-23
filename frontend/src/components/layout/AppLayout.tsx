import { useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, GitBranch, HelpCircle, LayoutDashboard,
  GripVertical, Database, ShoppingCart, PanelLeftClose, PanelLeft,
  Plane, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalNav } from './GlobalNav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';

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

const PAGE_TITLES: Record<string, string> = {
  '/guide': '使用指南',
  '/equipment-def': '设备定义',
  '/workstation': '构型查看',
  '/config': '构型管理',
  '/dashboard': '管理看板',
  '/procurement': '采购进度',
};

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 60 : 240;
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Hidden drag image */}
      <div ref={dragNodeRef} className="fixed -top-[9999px] -left-[9999px] size-px" />

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Plane className="size-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
                AeroEquip
              </span>
              <span className="truncate text-[10px] text-muted-foreground leading-tight">
                设备管理平台
              </span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.key;
              const isDragging = dragIndex === index;
              const isOver = overIndex === index && dragIndex !== index;

              const navItem = (
                <div
                  key={item.key}
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(item.key)}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 select-none",
                    isActive
                      ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isDragging && "opacity-40",
                    isOver && dragIndex !== null && dragIndex > index && "border-t-2 border-primary",
                    isOver && dragIndex !== null && dragIndex < index && "border-b-2 border-primary",
                    collapsed && "justify-center px-2"
                  )}
                >
                  {!collapsed && (
                    <GripVertical className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab" />
                  )}
                  <span className={cn("shrink-0", isActive && "text-primary")}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                </div>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger render={<div />}>
                      {navItem}
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return navItem;
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* User */}
          <div className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2",
            collapsed && "justify-center px-2"
          )}>
            <Avatar size="sm">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-xs font-medium text-sidebar-foreground">Admin</span>
                <span className="truncate text-[10px] text-muted-foreground">管理员</span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              >
                <LogOut className="size-3.5" />
              </button>
            )}
          </div>

          <Separator />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex w-full items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col transition-all duration-200 ease-in-out" style={{ marginLeft: sidebarWidth }}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          {pageTitle && (
            <>
              <h1 className="text-sm font-medium text-foreground">{pageTitle}</h1>
              <Separator orientation="vertical" className="h-4" />
            </>
          )}
          <GlobalNav />
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/40 min-h-[calc(100vh-88px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
