import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppLayout } from './components/layout/AppLayout';
import { WorkstationPage } from './pages/WorkstationPage';
import { SpatialViewPage } from './pages/SpatialViewPage';
import { ConfigPage } from './pages/ConfigPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/workstation" replace />} />
            <Route path="/workstation" element={<WorkstationPage />} />
            <Route path="/spatial" element={<SpatialViewPage />} />
            <Route path="/config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
