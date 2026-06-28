import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { LandingPage } from './pages/landing/LandingPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { UploadPage } from './pages/upload/UploadPage';
import { ChatPage } from './pages/chat/ChatPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ChartsPage } from './pages/charts/ChartsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SystemPage } from './pages/system/SystemPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { ConnectionLostAlert } from './components/errors/ConnectionLostAlert';
import { NotFoundPage } from './pages/errors/ErrorPages';

export const App: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDataset] = useState('sales_2025_q4.csv');

  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background flex text-zinc-100 relative">
      {/* Floating Alert Bar for Network Outages */}
      <ConnectionLostAlert />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main viewport */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? '260px' : '76px' }}
      >
        <TopNavbar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          selectedDataset={selectedDataset}
        />
        
        {/* Page Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-background relative">
          {/* Subtle page-level background glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/dashboard/system" element={<SystemPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
