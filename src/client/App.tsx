import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OfficialBanner } from './components/OfficialBanner';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { OfficerDashboard } from './components/OfficerDashboard';
import { ScoreEntryGrid } from './components/ScoreEntryGrid';
import { ModerationView } from './components/ModerationView';
import { RosterManagement } from './components/RosterManagement';
import { ClassManagement } from './components/ClassManagement';
import { SBPPAExportPackage } from './components/SBPPAExportPackage';
import { AuditLogView } from './components/AuditLogView';
import { OfficialIntegrationSettings } from './components/OfficialIntegrationSettings';
import { UserManagement } from './components/UserManagement';
import { LoginView } from './components/LoginView';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard-student');

  // If not logged in, show official Login screen
  if (!currentUser) {
    return <LoginView />;
  }

  // RBAC Access Control Guard
  const roleAllowedTabs: Record<string, string[]> = {
    SUPER_ADMIN: ['dashboard-student', 'dashboard-officer', 'dashboard', 'scores', 'moderation', 'roster', 'classes', 'users', 'deliverables', 'audit', 'integration'],
    COORDINATOR: ['dashboard-student', 'dashboard-officer', 'dashboard', 'scores', 'moderation', 'roster', 'classes', 'users', 'deliverables', 'audit'],
    KPMP: ['dashboard-student', 'dashboard-officer', 'dashboard', 'scores', 'moderation', 'deliverables'],
    TEACHER: ['dashboard-student', 'dashboard-officer', 'dashboard', 'scores', 'roster'],
    DATA_OFFICER: ['dashboard-student', 'dashboard-officer', 'dashboard', 'roster', 'classes', 'deliverables'],
    LEADER: ['dashboard-student', 'dashboard-officer', 'dashboard', 'moderation', 'deliverables', 'audit'],
  };

  const allowedTabs = roleAllowedTabs[currentUser.role] || ['dashboard-student', 'dashboard-officer', 'dashboard'];
  const effectiveTab = allowedTabs.includes(activeTab) ? activeTab : 'dashboard-student';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden w-full">
      {/* Official Required Compliance Banner */}
      <OfficialBanner />

      {/* Main Navbar */}
      <Navbar activeTab={effectiveTab} setActiveTab={setActiveTab} />

      {/* Tab Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {(effectiveTab === 'dashboard-student' || effectiveTab === 'dashboard') && (
          <StudentDashboard onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {effectiveTab === 'dashboard-officer' && (
          <OfficerDashboard onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {effectiveTab === 'scores' && <ScoreEntryGrid />}
        {effectiveTab === 'moderation' && <ModerationView />}
        {effectiveTab === 'roster' && <RosterManagement />}
        {effectiveTab === 'classes' && <ClassManagement onNavigate={(tab) => setActiveTab(tab)} />}
        {effectiveTab === 'users' && <UserManagement />}
        {effectiveTab === 'deliverables' && <SBPPAExportPackage onNavigate={(tab) => setActiveTab(tab)} />}
        {effectiveTab === 'audit' && <AuditLogView />}
        {effectiveTab === 'integration' && <OfficialIntegrationSettings />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-amber-200/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/SAS.jpg" alt="Logo SAS" className="w-6 h-6 object-contain rounded-md" />
            <span className="font-extrabold text-[#7D121D]">my_SAS_MATRIKS</span> — Sistem Pengurusan Operasi Matriks Pembelajaran (SR SABK)
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span>Sekolah Agama Suria, Tuaran (XCA4301)</span>
            <span>•</span>
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold">v1.0.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
