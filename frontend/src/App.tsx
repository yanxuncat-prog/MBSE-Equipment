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
