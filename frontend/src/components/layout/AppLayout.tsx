import { useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, GitBranch, LayoutDashboard, Database,
  GripVertical, ShoppingCart, PanelLeftClose, PanelLeft,
  Plane, LogOut, Settings, Sun, Moon, Check, ChevronDown,
  Weight, Zap, Thermometer, MapPin, Cable, ClipboardCheck, Users,
  Sparkles, BarChart3, FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalNav } from './GlobalNav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useThemeStore } from '@/store/themeStore';

interface SubMenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: SubMenuItem[];
}

const DEFAULT_MENU: MenuItem[] = [
  { key: '/equipment-library', icon: <Database className="size-4" />, label: '设备库' },
  {
    key: '/workstation', icon: <Eye className="size-4" />, label: '构型查看',
    children: [
      { key: '/workstation?tab=weight', icon: <Weight className="size-3.5" />, label: '重量分析' },
      { key: '/workstation?tab=elec-details', icon: <Zap className="size-3.5" />, label: '电负载分析' },
      { key: '/workstation?tab=do160', icon: <Thermometer className="size-3.5" />, label: '环境综合' },
      { key: '/workstation?tab=layout', icon: <MapPin className="size-3.5" />, label: '设备布置' },
      { key: '/workstation?tab=micd', icon: <ClipboardCheck className="size-3.5" />, label: 'MICD管控' },
      { key: '/workstation?tab=ewis', icon: <Cable className="size-3.5" />, label: 'EWIS' },
    ],
  },
  { key: '/config', icon: <GitBranch className="size-4" />, label: '构型管理' },
  { key: '/dashboard', icon: <LayoutDashboard className="size-4" />, label: '管理看板' },
  { key: '/procurement', icon: <ShoppingCart className="size-4" />, label: '采购进度' },
  { key: '/ai-reports', icon: <Sparkles className="size-4" />, label: 'AI 报告' },
  { key: '/micd-stats', icon: <BarChart3 className="size-4" />, label: 'MICD 统计' },
  { key: '/report-parsing', icon: <FileSearch className="size-4" />, label: '报告解析' },
];

const PAGE_TITLES: Record<string, string> = {
  '/equipment-library': '设备库',
  '/workstation': '构型查看',
  '/config': '构型管理',
  '/dashboard': '管理看板',
  '/procurement': '采购进度',
  '/user-management': '用户管理',
  '/ai-reports': 'AI 报告生成',
  '/micd-stats': 'MICD 工作量统计',
  '/report-parsing': '报告解析',
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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
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

  const { mode, setMode } = useThemeStore();

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
              <span className="truncate text-xs text-muted-foreground leading-tight">
                设备管理平台
              </span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.key.split('?')[0];
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedKey === item.key;
              const isDragging = dragIndex === index;
              const isOver = overIndex === index && dragIndex !== index;

              const handleClick = () => {
                if (hasChildren) {
                  setExpandedKey(isExpanded ? null : item.key);
                  navigate(item.key);
                } else {
                  navigate(item.key);
                }
              };

              const navItem = (
                <div key={item.key}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    onClick={handleClick}
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
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && hasChildren && (
                      <ChevronDown className={cn("size-3.5 text-muted-foreground/50 transition-transform duration-200", isExpanded && "rotate-180")} />
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                  </div>
                  {/* Sub-menu */}
                  {!collapsed && hasChildren && isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/50 pl-2.5">
                      {item.children!.map(sub => {
                        const subActive = location.pathname + location.search === sub.key;
                        return (
                          <div
                            key={sub.key}
                            onClick={(e) => { e.stopPropagation(); navigate(sub.key); }}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                              subActive
                                ? "text-primary font-medium bg-primary/5"
                                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <span className="shrink-0">{sub.icon}</span>
                            <span className="truncate">{sub.label}</span>
                          </div>
                        );
                      })}
                    </div>
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

            {/* User Management */}
            {(() => {
              const umActive = location.pathname === '/user-management';
              const umItem = (
                <div
                  onClick={() => navigate('/user-management')}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 select-none",
                    umActive
                      ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <span className={cn("shrink-0", umActive && "text-primary")}><Users className="size-4" /></span>
                  {!collapsed && <span className="flex-1 truncate">用户管理</span>}
                  {umActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                </div>
              );
              if (collapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger render={<div />}>{umItem}</TooltipTrigger>
                    <TooltipContent side="right">用户管理</TooltipContent>
                  </Tooltip>
                );
              }
              return umItem;
            })()}

            {/* Separator before settings */}
            <div className="my-2 mx-1">
              <Separator />
            </div>

            {/* Settings menu item */}
            <Popover>
              <PopoverTrigger render={
                <div
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 select-none",
                    "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <span className="shrink-0"><Settings className="size-4" /></span>
                  {!collapsed && <span className="truncate">设置</span>}
                </div>
              } />
              <PopoverContent side="right" align="start" className="w-[220px]">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">界面风格</div>
                  <div className="space-y-1">
                    <ThemeOption
                      icon={<Sun className="size-4" />}
                      label="ShadCN"
                      description="Light Mode"
                      active={mode === 'shadcn'}
                      onClick={() => setMode('shadcn')}
                    />
                    <ThemeOption
                      icon={<Moon className="size-4" />}
                      label="MUI"
                      description="Dark Mode"
                      active={mode === 'mui'}
                      onClick={() => setMode('mui')}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                <span className="truncate text-xs text-muted-foreground">管理员</span>
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
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 overflow-hidden border-b border-border bg-background/80 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          {pageTitle && (
            <h1 className="shrink-0 text-sm font-medium text-foreground whitespace-nowrap">{pageTitle}</h1>
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

function ThemeOption({ icon, label, description, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "hover:bg-muted text-foreground"
      )}
    >
      <div className={cn(
        "flex size-8 items-center justify-center rounded-md",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {active && <Check className="size-4 text-primary shrink-0" />}
    </button>
  );
}
