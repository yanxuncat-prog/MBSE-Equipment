import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ToolOutlined,
  EnvironmentOutlined,
  BranchesOutlined,
  QuestionCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { GlobalNav } from './GlobalNav';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/guide', icon: <QuestionCircleOutlined />, label: '使用指南' },
  { key: '/workstation', icon: <ToolOutlined />, label: '工程师工作台' },
  { key: '/spatial', icon: <EnvironmentOutlined />, label: '空间视图' },
  { key: '/config', icon: <BranchesOutlined />, label: '构型管理' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '管理看板' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>AeroEquip</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <GlobalNav />
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
