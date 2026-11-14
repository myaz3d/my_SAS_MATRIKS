import React from 'react';
import { 
  Building2, 
  Globe, 
  Wifi, 
  Calendar, 
  Eye, 
  EyeOff,
  MapPin,
  Sparkles,
  LogOut,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  FileCheck,
  Users,
  UserCheck,
  FileDown,
  History,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../../shared/types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    currentUser, 
    logout,
    activeCycle, 
    setActiveCycle, 
    availableCycles, 
    language, 
    setLanguage, 
    t,
    isOnline,
    maskPII,
    setMaskPII,
  } = useApp();

  const roleBadgeColor: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-rose-100 text-[#7D121D] border-rose-300 font-bold',
    COORDINATOR: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    TEACHER: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    KPMP: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    LEADER: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    DATA_OFFICER: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
  };

  const userRole = currentUser?.role || 'TEACHER';

  // Role-based navigation items with icons & compact responsive wrapping
  const allNavItems: { id: string; label: string; icon: React.FC<{ className?: string }>; roles: UserRole[] }[] = [
    { id: 'dashboard-student', label: t('Papan Pemuka Pelajar', 'Student Dashboard'), icon: GraduationCap, roles: ['SUPER_ADMIN', 'COORDINATOR', 'TEACHER', 'KPMP', 'LEADER', 'DATA_OFFICER'] },
    { id: 'dashboard-officer', label: t('Papan Pemuka Pegawai', 'Officer Dashboard'), icon: Briefcase, roles: ['SUPER_ADMIN', 'COORDINATOR', 'TEACHER', 'KPMP', 'LEADER', 'DATA_OFFICER'] },
    { id: 'scores', label: t('Kemasukan Markah', 'Score Entry'), icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'COORDINATOR', 'TEACHER', 'KPMP'] },
    { id: 'moderation', label: t('Semakan & Moderasi', 'Moderation'), icon: FileCheck, roles: ['SUPER_ADMIN', 'COORDINATOR', 'KPMP', 'LEADER'] },
    { id: 'roster', label: t('Pengurusan Murid', 'Student Roster'), icon: Users, roles: ['SUPER_ADMIN', 'COORDINATOR', 'DATA_OFFICER', 'TEACHER'] },
    { id: 'users', label: t('ID Pengguna', 'User IDs'), icon: UserCheck, roles: ['SUPER_ADMIN', 'COORDINATOR'] },
    { id: 'deliverables', label: t('Pakej SBPPA', 'SBPPA Packages'), icon: FileDown, roles: ['SUPER_ADMIN', 'COORDINATOR', 'DATA_OFFICER', 'LEADER'] },
    { id: 'audit', label: t('Log Audit', 'Audit Logs'), icon: History, roles: ['SUPER_ADMIN', 'COORDINATOR', 'LEADER'] },
    { id: 'integration', label: t('Integrasi Rasmi', 'Official Integration'), icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <header className="bg-white border-b border-amber-200/80 sticky top-0 z-40 shadow-xs w-full">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 border-b border-amber-100/60">
        {/* School Crest & System Name */}
        <div className="flex items-center gap-2.5">
          <img 
            src="/SAS.jpg" 
            alt="Logo Sekolah Agama Suria" 
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl border border-amber-300 bg-white shadow-xs p-0.5 hover:scale-105 transition-transform" 
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-[#7D121D] text-base sm:text-lg tracking-tight flex items-center gap-1">
                my_SAS_MATRIKS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                SR SABK • Tuaran
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3 h-3 text-[#7D121D]" />
                Sekolah Agama Suria
              </span>
              <span>•</span>
              <span className="font-mono bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded text-[10px] font-bold">
                XCA4301
              </span>
              <span>•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 text-[11px]">
                <MapPin className="w-3 h-3 text-amber-600" />
                PPD Tuaran, Sabah
              </span>
            </div>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cycle Selector */}
          <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-200 rounded-xl px-2 py-1 text-xs text-amber-950">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <select
              value={activeCycle?.id || ''}
              onChange={(e) => {
                const found = availableCycles.find(c => c.id === e.target.value);
                if (found) setActiveCycle(found);
              }}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {availableCycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Sync / Offline indicator */}
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2 py-1 rounded-xl font-semibold">
            <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="hidden md:inline">{isOnline ? t('Dalam Talian', 'Online') : t('Luar Talian', 'Offline')}</span>
          </div>

          {/* Mask PII Toggle */}
          <button
            onClick={() => setMaskPII(!maskPII)}
            title={maskPII ? t('Nyah-topeng Maklumat Sensitif (PDPA)', 'Unmask PII') : t('Topeng Maklumat Sensitif (PDPA)', 'Mask PII')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-xl border transition ${
              maskPII ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
            }`}
          >
            {maskPII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{maskPII ? 'PDPA: Mask' : 'PDPA: Plain'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'ms' ? 'en' : 'ms')}
            className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-amber-100/50 text-slate-700 px-2 py-1 rounded-xl font-semibold border border-slate-200 transition"
          >
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold uppercase text-[11px]">{language}</span>
          </button>

          {/* Active User Profile Card & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-300 rounded-xl px-2 py-1 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#7D121D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left max-w-[120px] sm:max-w-[180px]">
                  <span className="text-xs font-extrabold text-slate-900 truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate leading-tight">
                    {currentUser.email}
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border uppercase ml-0.5 ${roleBadgeColor[currentUser.role]}`}>
                  {currentUser.role}
                </span>
              </div>

              {/* Dedicated Logout Button */}
              <button
                onClick={() => logout()}
                title={t('Log Keluar Sistem', 'Sign Out')}
                className="flex items-center gap-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-[#7D121D] border border-rose-300 px-2.5 py-1 rounded-xl transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Log Keluar', 'Logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs - Flex Wrap with ZERO Horizontal Scroll */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <nav className="flex flex-wrap items-center gap-1 sm:gap-1.5 py-1.5" aria-label="Tabs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#7D121D] text-white shadow-xs border-b-2 border-amber-400'
                    : 'text-slate-700 hover:text-[#7D121D] hover:bg-amber-100/50 bg-slate-50/80 border border-slate-200/70'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-[#7D121D]'}`} />
                {item.id === 'integration' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
