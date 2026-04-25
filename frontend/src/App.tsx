import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkstationPage } from '@/pages/WorkstationPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProcurementPage } from '@/pages/ProcurementPage';
import { EquipmentLibraryPage } from '@/pages/EquipmentLibraryPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { AIReportPage } from '@/pages/AIReportPage';
import { ReportParsingPage } from '@/pages/ReportParsingPage';
import { ConfigPlatformPage } from '@/pages/ConfigPlatformPage';

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/workstation" replace />} />
            <Route path="/workstation" element={<WorkstationPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/equipment-library" element={<EquipmentLibraryPage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/ai-reports" element={<AIReportPage />} />
            <Route path="/report-parsing" element={<ReportParsingPage />} />
            <Route path="/config-platform" element={<ConfigPlatformPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}
