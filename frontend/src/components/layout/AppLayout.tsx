import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ToolOutlined,
  EnvironmentOutlined,
  BranchesOutlined,
  QuestionCircleOutlined,
  DashboardOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { GlobalNav } from './GlobalNav';

const { Sider, Header, Content } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const DEFAULT_MENU: MenuItem[] = [
  { key: '/guide', icon: <QuestionCircleOutlined />, label: '使用指南' },
  { key: '/workstation', icon: <ToolOutlined />, label: '工程师工作台' },
  { key: '/spatial', icon: <EnvironmentOutlined />, label: '空间视图' },
  { key: '/config', icon: <BranchesOutlined />, label: '构型管理' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '管理看板' },
];

const STORAGE_KEY = 'aeroequip_menu_order';

function loadMenuOrder(): MenuItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const keys: string[] = JSON.parse(saved);
      const map = new Map(DEFAULT_MENU.map(m => [m.key, m]));
      const ordered = keys.map(k => map.get(k)).filter(Boolean) as MenuItem[];
      // Append any new items not in saved order
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Minimal drag image
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Hidden drag image */}
      <div ref={dragNodeRef} style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1 }} />

      <Sider width={200} theme="dark" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>AeroEquip</span>
        </div>
        <div style={{ padding: '0 0' }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px 10px 24px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(24,144,255,0.2)' : 'transparent',
                  borderRight: isActive ? '3px solid #1890ff' : '3px solid transparent',
                  borderTop: isOver && dragIndex !== null && dragIndex > index ? '2px solid #1890ff' : '2px solid transparent',
                  borderBottom: isOver && dragIndex !== null && dragIndex < index ? '2px solid #1890ff' : '2px solid transparent',
                  opacity: isDragging ? 0.4 : 1,
                  transition: 'background 0.2s, opacity 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <HolderOutlined style={{ color: '#555', fontSize: 10, marginRight: 10, cursor: 'grab', flexShrink: 0 }} />
                <span style={{ color: isActive ? '#1890ff' : 'rgba(255,255,255,0.65)', fontSize: 16, marginRight: 10, flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <GlobalNav />
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 'calc(100vh - 96px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
