import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  FileCheck, 
  Lock, 
  ArrowRight, 
  ShieldAlert, 
  BarChart3, 
  Layers, 
  ChevronRight, 
  Sparkles, 
  MapPin,
  Search,
  Filter,
  UserCheck,
  AlertOctagon,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalRecords: number;
  enteredCount: number;
  completionRate: string;
  statusCounts: {
    DRAFT: number;
    SUBMITTED: number;
    VALIDATED: number;
    MODERATED: number;
    APPROVED: number;
    EXPORT_READY: number;
    LOCKED: number;
  };
  sampledCount: number;
  interventionCount: number;
  tpDistribution: {
    TP6: number;
    TP5: number;
    TP4: number;
    TP3: number;
    TP2: number;
    TP1: number;
  };
  subjectStats: Record<string, { name: string; avg: number; count: number }>;
}

export const Dashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeCycle, t, reloadStatsTrigger } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [interventionList, setInterventionList] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('ALL');
  const [taskSearch, setTaskSearch] = useState<string>('');

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: 'bg-rose-100 text-[#7D121D] border-rose-300 font-bold',
    COORDINATOR: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    TEACHER: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    KPMP: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    LEADER: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    DATA_OFFICER: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
  };

  useEffect(() => {
    if (!activeCycle) return;
    setLoading(true);
    fetch(`/api/system/stats?cycleId=${activeCycle.id}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });

    fetch(`/api/deliverables/intervention-report?cycleId=${activeCycle.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.students) setInterventionList(data.students.slice(0, 5));
      })
      .catch(err => console.error('Error fetching interventions:', err));

    fetch(`/api/system/pending-workflow-users?cycleId=${activeCycle.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.tasks) setPendingTasks(data.tasks);
      })
      .catch(err => console.error('Error fetching pending workflow tasks:', err));
  }, [activeCycle, reloadStatsTrigger]);

  const filteredTasks = pendingTasks.filter(task => {
    const matchesRole = selectedTaskFilter === 'ALL' || task.userRole === selectedTaskFilter;
    const matchesSearch = !taskSearch.trim() || 
      task.userName.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.userId.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.userEmail.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.taskType.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.scope.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#7D121D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">{t('Memuatkan maklumat pentaksiran...', 'Loading assessment data...')}</p>
        </div>
      </div>
    );
  }

  const samplePercentage = stats.totalRecords > 0 
    ? ((stats.sampledCount / stats.totalRecords) * 100).toFixed(1) 
    : '0.0';

  const pipelineStages = [
    { key: 'DRAFT', label: t('1. Draf Guru', '1. Teacher Draft'), count: stats.statusCounts.DRAFT, color: 'bg-slate-50 text-slate-700 border-slate-300' },
    { key: 'SUBMITTED', label: t('2. Dihantar', '2. Submitted'), count: stats.statusCounts.SUBMITTED, color: 'bg-amber-50 text-amber-900 border-amber-300' },
    { key: 'VALIDATED', label: t('3. Disemak Penyelaras', '3. Validated'), count: stats.statusCounts.VALIDATED, color: 'bg-orange-50 text-orange-900 border-orange-300' },
    { key: 'MODERATED', label: t('4. Moderasi KPMP', '4. KPMP Moderated'), count: stats.statusCounts.MODERATED, color: 'bg-amber-100/70 text-amber-950 border-amber-400' },
    { key: 'APPROVED', label: t('5. Diluluskan', '5. Approved'), count: stats.statusCounts.APPROVED, color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
    { key: 'EXPORT_READY', label: t('6. Sedia SBPPA', '6. SBPPA Ready'), count: stats.statusCounts.EXPORT_READY, color: 'bg-rose-50 text-[#7D121D] border-rose-300 font-bold' },
    { key: 'LOCKED', label: t('7. Dikunci', '7. Locked'), count: stats.statusCounts.LOCKED, color: 'bg-purple-50 text-purple-900 border-purple-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Section with SAS Maroon & Gold Branding */}
      <div className="bg-gradient-to-r from-[#580B12] via-[#7D121D] to-[#9B1C2A] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-amber-400/20">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Sekolah Agama Suria (XCA4301) • PPD Tuaran, Sabah
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {t('Sesi 2026/2027 • Tahun 4', 'Session 2026/2027 • Year 4')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white flex items-center gap-2">
                my_SAS_MATRIKS — {t('Status Pentaksiran Matriks Pembelajaran', 'Matriks Pembelajaran Assessment Status')}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
                {t(
                  'Pemantauan operasi kemasukan skor mentah instrumen, moderasi Ketua Panitia (KPMP), dan penyediaan fail pelaporan SBPPA KPM.',
                  'Operational monitoring of raw score entry, Subject Head (KPMP) moderation, and SBPPA reporting file preparation.'
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigate('scores')}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-md hover:scale-105 cursor-pointer"
            >
              <span>{t('Kemasukan Markah Guru', 'Teacher Score Entry')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{t('Jumlah Murid Tahun 4', 'Total Enrolled Students')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {stats.totalStudents} <span className="text-xs font-normal text-amber-200">({stats.totalClasses} {t('Kelas', 'Classes')})</span>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('Markah Mentah Diisi', 'Scores Recorded')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {stats.enteredCount} <span className="text-xs font-normal text-amber-200">/ {stats.totalRecords}</span>
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span>{t('Kadar Sedia SBPPA', 'SBPPA Ready Rate')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-amber-300">
                {stats.completionRate}%
              </div>
            </div>

            <div 
              onClick={() => {
                const el = document.getElementById('intervention-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onNavigate('scores');
              }}
              className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-rose-400/40 hover:bg-rose-950/40 cursor-pointer transition hover:scale-105 group"
              title={t('Klik untuk melihat senarai murid memerlukan intervensi', 'Click to view students needing intervention')}
            >
              <div className="flex items-center justify-between text-rose-200 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:animate-bounce" />
                  <span>{t('Perlu Intervensi', 'Needs Intervention')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-rose-300 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-rose-300">
                {stats.interventionCount} <span className="text-xs font-normal text-rose-200">({t('Skor < 40', 'Score < 40')})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progression Pipeline */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#7D121D]" />
            <h2 className="text-base font-bold text-slate-900">
              {t('Aliran Kerja Penentusahan & Kelulusan (Workflow Pipeline)', 'Verification & Approval Workflow Pipeline')}
            </h2>
          </div>
          <span className="text-xs text-[#7D121D] font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            {t('Prosedur Piawai KPM MP', 'KPM MP Standard Procedure')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              className={`p-3 rounded-xl border flex flex-col justify-between transition hover:shadow-xs ${stage.color}`}
            >
              <span className="text-xs font-bold leading-tight">{stage.label}</span>
              <div className="text-xl font-black mt-2">{stage.count}</div>
              <span className="text-[10px] opacity-80 mt-0.5">{t('rekod murid', 'records')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Workflow Pending Actions Tracker by User ID */}
      <div className="bg-white rounded-2xl border-2 border-rose-300/80 p-5 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7D121D] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  {t('Status Tindakan Pegawai dalam Aliran Kerja (Workflow Pending Actions)', 'Workflow Pending Actions by Officer ID')}
                </h2>
                <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-2xs">
                  {pendingTasks.length} {t('Tindakan Tertangguh', 'Pending Actions')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'Senarai ID pengguna dan pegawai yang mempunyai tugasan pentaksiran tertangguh dalam kitaran aktif Sekolah Agama Suria.',
                  'List of user IDs and officers with outstanding workflow responsibilities in current active cycle.'
                )}
              </p>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTaskFilter(selectedTaskFilter === 'TEACHER' ? 'ALL' : 'TEACHER')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                selectedTaskFilter === 'TEACHER'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span>Guru Belum Hantar:</span>
              <span className="bg-white/90 text-emerald-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingTasks.filter(t => t.userRole === 'TEACHER').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedTaskFilter(selectedTaskFilter === 'KPMP' ? 'ALL' : 'KPMP')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                selectedTaskFilter === 'KPMP'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                  : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
              }`}
            >
              <span>Kuorum Panitia:</span>
              <span className="bg-white/90 text-orange-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingTasks.filter(t => t.userRole === 'KPMP').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedTaskFilter(selectedTaskFilter === 'SUPER_ADMIN' ? 'ALL' : 'SUPER_ADMIN')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                selectedTaskFilter === 'SUPER_ADMIN'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                  : 'bg-rose-50 text-[#7D121D] border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>Kelulusan Pentadbir:</span>
              <span className="bg-white/90 text-[#7D121D] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingTasks.filter(t => t.userRole === 'SUPER_ADMIN').length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Buttons & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#7D121D]" />
              Tapis Peranan:
            </span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'TEACHER', label: 'Guru' },
              { id: 'KPMP', label: 'Ketua Panitia' },
              { id: 'COORDINATOR', label: 'Penyelaras' },
              { id: 'SUPER_ADMIN', label: 'Pentadbir' },
              { id: 'DATA_OFFICER', label: 'Guru Data' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedTaskFilter(r.id)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                  selectedTaskFilter === r.id
                    ? 'bg-[#7D121D] text-white border-[#7D121D] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              placeholder="Cari nama, ID pengguna, subjek..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs w-60 sm:w-64 focus:ring-2 focus:ring-[#7D121D] focus:border-[#7D121D] outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Pending Tasks Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-gradient-to-r from-amber-50/70 to-rose-50/50 text-slate-900 font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ID Pengguna & Pegawai</th>
                <th className="py-2.5 px-3">Peranan Aliran Kerja</th>
                <th className="py-2.5 px-3">Kelas / Mata Pelajaran</th>
                <th className="py-2.5 px-3">Tindakan Tertangguh</th>
                <th className="py-2.5 px-3">Status Tindakan</th>
                <th className="py-2.5 px-3 text-right">Tindakan Pantas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Tiada rekod tindakan tertangguh mengikut tapisan ini.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => (
                  <tr key={task.id} className="hover:bg-amber-50/30 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#7D121D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {task.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{task.userName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                            ID: <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200 font-bold">{task.userId.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${roleBadgeColor[task.userRole] || 'bg-slate-100 text-slate-700'}`}>
                        {task.userRole}
                      </span>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{task.roleTitle}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{task.scope}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#7D121D] flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{task.taskType}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 max-w-xs leading-snug">{task.description}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        task.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                          : task.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'OVERDUE' ? 'bg-rose-600' : 'bg-amber-600'}`}></span>
                        {task.statusLabel}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>Sasaran:</span>
                        <span className="font-semibold text-slate-600">{task.deadline}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate(task.targetTab)}
                        className="bg-gradient-to-r from-[#7D121D] to-[#9B1C2A] hover:from-[#580B12] hover:to-[#7D121D] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition shadow-xs hover:shadow flex items-center gap-1.5 ml-auto cursor-pointer"
                        title={`Buka modul ${task.actionLabel}`}
                      >
                        <span>{task.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 text-amber-300" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Grid: Mastery Distribution & Panitia Moderation Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tahap Penguasaan TP1 - TP6 Chart */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#7D121D]" />
                <h2 className="text-base font-bold text-slate-900">
                  {t('Taburan Tahap Penguasaan (TP1 - TP6)', 'Mastery Level Distribution (TP1 - TP6)')}
                </h2>
              </div>
              <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                {t('Piawaian Skor Mentah KPM', 'MOE Raw Score Standard')}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {[
                { tp: 'TP6', label: 'TP6 - Cemerlang (85 - 100)', count: stats.tpDistribution.TP6, color: 'bg-emerald-600' },
                { tp: 'TP5', label: 'TP5 - Sangat Baik (70 - 84)', count: stats.tpDistribution.TP5, color: 'bg-amber-500' },
                { tp: 'TP4', label: 'TP4 - Baik (55 - 69)', count: stats.tpDistribution.TP4, color: 'bg-orange-500' },
                { tp: 'TP3', label: 'TP3 - Memuaskan (40 - 54)', count: stats.tpDistribution.TP3, color: 'bg-yellow-500' },
                { tp: 'TP2', label: 'TP2 - Perlu Bimbingan (20 - 39)', count: stats.tpDistribution.TP2, color: 'bg-rose-500' },
                { tp: 'TP1', label: 'TP1 - Perlu Bimbingan Rapi (0 - 19)', count: stats.tpDistribution.TP1, color: 'bg-red-700' },
              ].map((item) => {
                const totalAssessed = Object.values(stats.tpDistribution).reduce((a, b) => a + b, 0);
                const percent = totalAssessed > 0 ? ((item.count / totalAssessed) * 100).toFixed(1) : '0.0';

                return (
                  <div key={item.tp} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-bold text-slate-900">{item.count} murid ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('* TP3 merupakan Tahap Penguasaan Minimum KPM', '* TP3 is MOE Minimum Mastery Benchmark')}</span>
            <button 
              onClick={() => onNavigate('deliverables')}
              className="text-[#7D121D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{t('Jana Laporan Penuh', 'Generate Full Report')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPMP Moderation Quorum & Subject Breakdown */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#7D121D]" />
                <h2 className="text-base font-bold text-slate-900">
                  {t('Kuorum Moderasi KPMP & Prestasi Mata Pelajaran', 'KPMP Moderation Quorum & Subject Performance')}
                </h2>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded font-extrabold ${
                Number(samplePercentage) >= 10.0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-950 border border-amber-300'
              }`}>
                {samplePercentage}% {t('Dimoderasi (Min. 10%)', 'Moderated (Min. 10%)')}
              </span>
            </div>

            {/* Quorum Progress Alert */}
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-slate-700 mb-4">
              <div className="flex items-center justify-between mb-1.5 font-semibold">
                <span>{t('Status Pematuhan Sampel Rawak Panitia (≥ 10%)', 'Panitia Random Sample Compliance (≥ 10%)')}</span>
                <span className="font-bold text-[#7D121D]">{stats.sampledCount} {t('rekod disemak', 'records checked')}</span>
              </div>
              <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#7D121D] h-full rounded-full"
                  style={{ width: `${Math.min(100, Number(samplePercentage) * 5)}%` }}
                ></div>
              </div>
            </div>

            {/* Subject average marks table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-amber-200 text-slate-500 font-bold uppercase">
                    <th className="pb-2">{t('Kod & Mata Pelajaran', 'Subject & Code')}</th>
                    <th className="pb-2 text-center">{t('Bil. Rekod', 'Count')}</th>
                    <th className="pb-2 text-right">{t('Purata Skor Mentah', 'Avg Raw Score')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(stats.subjectStats).map(([code, sub]) => (
                    <tr key={code} className="hover:bg-amber-50/40 transition">
                      <td className="py-2 font-medium text-slate-900">
                        <span className="font-mono bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded mr-1.5 text-[11px] font-bold">
                          {code}
                        </span>
                        {sub.name}
                      </td>
                      <td className="py-2 text-center text-slate-600">{sub.count}</td>
                      <td className="py-2 text-right font-black text-[#7D121D]">{sub.avg} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('Ketua Panitia SAS memoderasi sekurang-kurangnya 10% sampel.', 'SAS KPMP moderates ≥ 10% sample.')}</span>
            <button
              onClick={() => onNavigate('moderation')}
              className="text-[#7D121D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{t('Pusat Moderasi KPMP', 'KPMP Moderation Center')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Intervention Alert Table */}
      {interventionList.length > 0 && (
        <div id="intervention-section" className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-5 shadow-xs scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  {t('Murid Memerlukan Bimbingan Intervensi Segera (SAS)', 'Students Requiring Immediate Intervention (SAS)')}
                </h3>
                <p className="text-xs text-rose-800">
                  {t('Murid yang memperoleh skor mentah bawah 40 atau Tahap Penguasaan TP1 / TP2.', 'Students scoring below 40 or at TP1 / TP2 levels.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('deliverables')}
              className="text-xs font-bold bg-[#7D121D] hover:bg-[#580B12] text-white px-3.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              {t('Lihat Senarai Lengkap Intervensi', 'View Complete Intervention Report')}
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-rose-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-rose-100/60 text-rose-950 font-bold border-b border-rose-200">
                <tr>
                  <th className="py-2.5 px-3">{t('Nama Murid', 'Student Name')}</th>
                  <th className="py-2.5 px-3">{t('Kelas', 'Class')}</th>
                  <th className="py-2.5 px-3">{t('Mata Pelajaran', 'Subject')}</th>
                  <th className="py-2.5 px-3 text-center">{t('Skor Mentah', 'Raw Score')}</th>
                  <th className="py-2.5 px-3">{t('Tahap Penguasaan', 'Mastery Level')}</th>
                  <th className="py-2.5 px-3">{t('Cadangan Tindakan Panitia SAS', 'Recommended SAS Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interventionList.map((st, i) => (
                  <tr key={i} className="hover:bg-rose-50/40">
                    <td className="py-2 px-3 font-semibold text-slate-900">{st.studentName}</td>
                    <td className="py-2 px-3 text-slate-600">{st.className}</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{st.subjectName}</td>
                    <td className="py-2 px-3 text-center font-black text-rose-700">{st.rawScore} / 100</td>
                    <td className="py-2 px-3">
                      <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        {st.masteryLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 text-[11px]">{st.suggestedIntervention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};