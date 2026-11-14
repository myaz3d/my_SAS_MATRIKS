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
  Calendar,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OfficerDashboardStats {
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
  subjectStats: Record<string, { name: string; avg: number; count: number }>;
}

export const OfficerDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeCycle, t, reloadStatsTrigger } = useApp();
  const [stats, setStats] = useState<OfficerDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
        console.error('Error fetching officer stats:', err);
        setLoading(false);
      });

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
          <p className="text-sm text-slate-500 font-medium">{t('Memuatkan aktiviti aliran kerja pegawai...', 'Loading officer workflow data...')}</p>
        </div>
      </div>
    );
  }

  const samplePercentage = stats.totalRecords > 0 
    ? ((stats.sampledCount / stats.totalRecords) * 100).toFixed(1) 
    : '0.0';

  const pipelineStages = [
    { key: 'DRAFT', label: t('1. Draf Guru', '1. Teacher Draft'), count: stats.statusCounts.DRAFT, color: 'bg-slate-50 text-slate-700 border-slate-300', nav: 'scores' },
    { key: 'SUBMITTED', label: t('2. Dihantar', '2. Submitted'), count: stats.statusCounts.SUBMITTED, color: 'bg-amber-50 text-amber-900 border-amber-300', nav: 'moderation' },
    { key: 'VALIDATED', label: t('3. Disemak Penyelaras', '3. Validated'), count: stats.statusCounts.VALIDATED, color: 'bg-orange-50 text-orange-900 border-orange-300', nav: 'moderation' },
    { key: 'MODERATED', label: t('4. Moderasi KPMP', '4. KPMP Moderated'), count: stats.statusCounts.MODERATED, color: 'bg-amber-100/70 text-amber-950 border-amber-400', nav: 'moderation' },
    { key: 'APPROVED', label: t('5. Diluluskan', '5. Approved'), count: stats.statusCounts.APPROVED, color: 'bg-emerald-50 text-emerald-900 border-emerald-300', nav: 'deliverables' },
    { key: 'EXPORT_READY', label: t('6. Sedia SBPPA', '6. SBPPA Ready'), count: stats.statusCounts.EXPORT_READY, color: 'bg-rose-50 text-[#7D121D] border-rose-300 font-bold', nav: 'deliverables' },
    { key: 'LOCKED', label: t('7. Dikunci', '7. Locked'), count: stats.statusCounts.LOCKED, color: 'bg-purple-50 text-purple-900 border-purple-300', nav: 'deliverables' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with SAS Maroon & Gold Theme */}
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
                <Briefcase className="w-7 h-7 text-amber-400" />
                my_SAS_MATRIKS — {t('Papan Pemuka Pegawai (Aktiviti & Aliran Kerja)', 'Officer Dashboard (Workflow & Operational Activity)')}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
                {t(
                  'Pemantauan operasi penyerahan skor oleh guru, kuorum moderasi Ketua Panitia (KPMP), kelulusan pentadbir sekolah, dan penjejakan tindakan pegawai tertangguh.',
                  'Operational monitoring of score submission by teachers, Subject Head (KPMP) moderation quorum, administrator approvals, and tracking pending officer actions.'
                )}
              </p>
            </div>

            {/* Quick Switch to Student Dashboard & Score View */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard-student')}
                className="bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-400/40 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Buka Papan Pemuka Pelajar"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>{t('Papan Pemuka Pelajar →', 'Student Dashboard →')}</span>
              </button>

              <button
                onClick={() => onNavigate('scores')}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
              >
                <span>{t('Kemasukan Markah Guru', 'Teacher Score Entry')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics for Officers Only */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('Markah Mentah Diisi', 'Scores Recorded')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {stats.enteredCount} <span className="text-xs font-normal text-amber-200">/ {stats.totalRecords}</span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                100% Selesai Diisi
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
              <div className="text-[11px] text-amber-200/80 mt-1">
                30 daripada 95 rekod sedia SBPPA
              </div>
            </div>

            <div 
              onClick={() => onNavigate('moderation')}
              className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20 cursor-pointer hover:bg-black/40 transition"
              title="Klik untuk ke Pusat Moderasi KPMP"
            >
              <div className="flex items-center justify-between text-amber-200 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  <span>{t('Kuorum Moderasi KPMP', 'KPMP Quorum')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {samplePercentage}% <span className="text-xs font-normal text-amber-200">({stats.sampledCount} rekod)</span>
              </div>
              <div className="text-[11px] text-amber-300 mt-1">
                Sasaran minimum KPM: ≥ 10%
              </div>
            </div>

            <div 
              onClick={() => {
                const el = document.getElementById('pending-workflow-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20 border-l-4 border-l-rose-500 cursor-pointer hover:bg-black/40 transition"
              title={t('Klik untuk lihat tindakan pegawai tertangguh', 'Click to view pending actions')}
            >
              <div className="flex items-center justify-between text-amber-200 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>{t('Pegawai Perlu Bertindak', 'Pending Actions')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-rose-300">
                {pendingTasks.length} <span className="text-xs font-normal text-amber-200">Pegawai</span>
              </div>
              <div className="text-[11px] text-rose-300 font-semibold mt-1">
                Tindakan Aliran Kerja Tertangguh
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Pipeline Progression Bar */}
      <div className="bg-white rounded-2xl border border-amber-200/70 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#7D121D]" />
              {t('Aliran Kerja Penentusahan & Kelulusan (Workflow Pipeline)', 'Verification & Approval Pipeline')}
            </h2>
            <p className="text-xs text-slate-500">
              Status pengaliran rekod pentaksiran dari peringkat draf guru sehingga fail SBPPA sedia dijana.
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
            Prosedur Piawai KPM MP
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mt-4">
          {pipelineStages.map((stg) => (
            <div 
              key={stg.key} 
              onClick={() => onNavigate(stg.nav)}
              className={`p-3 rounded-xl border text-center transition shadow-2xs hover:scale-105 cursor-pointer ${stg.color}`}
              title={`Klik untuk ke modul berkaitan ${stg.label}`}
            >
              <div className="text-xs font-bold leading-tight truncate">{stg.label}</div>
              <div className="text-xl sm:text-2xl font-black mt-1">{stg.count}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">rekod murid</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kuorum Moderasi KPMP & Prestasi Panitia */}
      <div className="bg-white rounded-2xl border border-amber-200/70 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#7D121D]" />
              {t('Kuorum Moderasi KPMP & Status Semakan Panitia', 'KPMP Moderation Quorum & Department Review')}
            </h2>
            <p className="text-xs text-slate-500">
              Ketua Panitia Mata Pelajaran (KPMP) diwajibkan menyemak dan memoderasi sekurang-kurangnya 10% sampel rawak rekod yang dihantar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl">
              {samplePercentage}% Dimoderasi (Min. 10%)
            </span>
            <button
              onClick={() => onNavigate('moderation')}
              className="bg-[#7D121D] hover:bg-[#580B12] text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
            >
              Pusat Moderasi KPMP <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Status Pematuhan Sampel Rawak Panitia (≥ 10%)</span>
            <span className="font-bold text-[#7D121D]">{stats.sampledCount} rekod disemak / 10 rekod minimum</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${Number(samplePercentage) >= 10 ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-[#7D121D]'}`} 
              style={{ width: `${Math.min(100, (Number(samplePercentage) / 10) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="text-[11px] font-bold text-slate-500">MP01 Bahasa Melayu</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">Cikgu Siti Nurhaliza (KPMP)</div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">3 / 30 Sampel (10.0%) - Lulus</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="text-[11px] font-bold text-slate-500">MP03 Matematik</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">Cikgu Tan Wei Keong (KPMP)</div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">4 / 30 Sampel (13.3%) - Lulus</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-rose-50/50 border-rose-200">
            <div className="text-[11px] font-bold text-rose-700">MP04 Sains</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">Ketua Panitia Sains</div>
            <div className="text-xs text-rose-700 font-bold mt-0.5">0 / 20 Sampel (0.0%) - Tertangguh</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-3 bg-rose-50/50 border-rose-200">
            <div className="text-[11px] font-bold text-rose-700">MP05 Sejarah</div>
            <div className="text-sm font-extrabold text-slate-900 mt-1">Ketua Panitia Sejarah</div>
            <div className="text-xs text-rose-700 font-bold mt-0.5">0 / 15 Sampel (0.0%) - Tertangguh</div>
          </div>
        </div>
      </div>

      {/* Main Section: Status Tindakan Pegawai dalam Aliran Kerja (Workflow Pending Actions) */}
      <div id="pending-workflow-section" className="bg-white rounded-2xl border border-amber-300/80 p-5 shadow-xs scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#7D121D]" />
                Status Tindakan Pegawai dalam Aliran Kerja (Workflow Pending Actions)
              </h2>
              <span className="text-xs font-black bg-rose-100 text-[#7D121D] border border-rose-300 px-2 py-0.5 rounded-full">
                {pendingTasks.length} TINDAKAN TERTANGGUH
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Senarai ID pengguna dan pegawai yang mempunyai tugasan pentaksiran tertangguh dalam kitaran aktif Sekolah Agama Suria.
            </p>
          </div>

          {/* Quick Summary Counts */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setSelectedTaskFilter('TEACHER')}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer"
            >
              Guru Belum Hantar: <strong>{pendingTasks.filter(t => t.userRole === 'TEACHER').length}</strong>
            </button>
            <button 
              onClick={() => setSelectedTaskFilter('KPMP')}
              className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer"
            >
              Kuorum Panitia: <strong>{pendingTasks.filter(t => t.userRole === 'KPMP').length}</strong>
            </button>
            <button 
              onClick={() => setSelectedTaskFilter('SUPER_ADMIN')}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-[#7D121D] border border-rose-300 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer"
            >
              Kelulusan Pentadbir: <strong>{pendingTasks.filter(t => t.userRole === 'SUPER_ADMIN').length}</strong>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 mb-4 text-xs">
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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Pending Actions Table */}
        <div className="overflow-x-auto border border-amber-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-amber-200 text-[11px] font-black text-slate-700 uppercase bg-amber-100/50">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ID Pengguna &amp; Pegawai</th>
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
                            ID: <span className="text-[#7D121D] font-bold">{task.userId.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase inline-block ${roleBadgeColor[task.userRole] || 'bg-slate-100 text-slate-800'}`}>
                        {task.userRole}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{task.roleLabel}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {task.scope}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 text-xs">{task.taskType}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-tight">{task.description}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        BELUM SELESAI
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate(task.targetTab || task.actionUrl || 'scores')}
                        className="bg-[#7D121D] hover:bg-[#580B12] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                        title={`Buka modul ${task.actionLabel}`}
                      >
                        <span>{task.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
