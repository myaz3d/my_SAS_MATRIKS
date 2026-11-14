import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  MapPin,
  Search,
  Filter,
  FileSpreadsheet,
  Award,
  BookOpen,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentDetailModal } from './StudentDetailModal';

interface StudentDashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalRecords: number;
  tpDistribution: {
    TP6: number;
    TP5: number;
    TP4: number;
    TP3: number;
    TP2: number;
    TP1: number;
  };
  subjectStats: Record<string, { name: string; avg: number; count: number }>;
  classStats?: { name: string; students: number; avgScore: number; male: number; female: number }[];
}

export const StudentDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { activeCycle, t, maskPII, reloadStatsTrigger } = useApp();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [interventionList, setInterventionList] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
        console.error('Error fetching student stats:', err);
        setLoading(false);
      });

    fetch(`/api/deliverables/intervention-report?cycleId=${activeCycle.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.students) setInterventionList(data.students);
      })
      .catch(err => console.error('Error fetching intervention students:', err));
  }, [activeCycle, reloadStatsTrigger]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#7D121D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">{t('Memuatkan maklumat murid SAS...', 'Loading SAS student data...')}</p>
        </div>
      </div>
    );
  }

  // Calculate student metrics
  const totalTpStudents = Object.values(stats.tpDistribution).reduce((a, b) => a + b, 0);
  const passingMinimumCount = (stats.tpDistribution.TP6 || 0) + 
                              (stats.tpDistribution.TP5 || 0) + 
                              (stats.tpDistribution.TP4 || 0) + 
                              (stats.tpDistribution.TP3 || 0);
  const passingMinimumRate = totalTpStudents > 0 
    ? ((passingMinimumCount / totalTpStudents) * 100).toFixed(1) 
    : '0.0';

  const avgSubjectScores = Object.values(stats.subjectStats);
  const overallAvgScore = avgSubjectScores.length > 0
    ? (avgSubjectScores.reduce((acc, curr) => acc + curr.avg, 0) / avgSubjectScores.length).toFixed(1)
    : '0.0';

  const classesBreakdown = [
    { name: '4 Cemerlang', students: 30, avgScore: 72.4, male: 14, female: 16, room: 'Blok Al-Ghazali' },
    { name: '4 Gemilang', students: 30, avgScore: 70.8, male: 15, female: 15, room: 'Blok Ibn Sina' },
    { name: '4 Terbilang', students: 30, avgScore: 70.1, male: 16, female: 14, room: 'Blok Al-Farabi' },
  ];

  const filteredInterventions = interventionList.filter(st => {
    const matchesClass = selectedClassFilter === 'ALL' || st.class === selectedClassFilter;
    const matchesSearch = !studentSearch.trim() || 
      st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (st.mykid && st.mykid.includes(studentSearch)) ||
      (st.subject && st.subject.toLowerCase().includes(studentSearch.toLowerCase()));
    return matchesClass && matchesSearch;
  });

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
                <GraduationCap className="w-7 h-7 text-amber-400" />
                my_SAS_MATRIKS — {t('Papan Pemuka Pelajar (Prestasi & Intervensi Murid)', 'Student Dashboard (Performance & Intervention)')}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
                {t(
                  'Pemantauan status enrolmen murid Tahun 4, pencapaian Tahap Penguasaan instrumen (TP1 - TP6), purata markah mata pelajaran, dan program intervensi murid SAS.',
                  'Monitoring Year 4 student enrollment, Mastery Level attainment (TP1 - TP6), subject averages, and SAS student intervention programs.'
                )}
              </p>
            </div>

            {/* Quick Switch to Officer Dashboard & Score View */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard-officer')}
                className="bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-400/40 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
                title="Buka Papan Pemuka Pegawai"
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>{t('Papan Pemuka Pegawai →', 'Officer Dashboard →')}</span>
              </button>

              <button
                onClick={() => onNavigate('roster')}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer"
              >
                <span>{t('Pengurusan Murid', 'Student Roster')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics for Students Only */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{t('Jumlah Murid Tahun 4', 'Total Students')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {stats.totalStudents} <span className="text-xs font-normal text-amber-200">({stats.totalClasses} {t('Kelas', 'Classes')})</span>
              </div>
              <div className="text-[11px] text-amber-200/80 mt-1">
                4 Cemerlang, Gemilang, Terbilang
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{t('Purata Skor Keseluruhan', 'Overall Score Avg')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {overallAvgScore} <span className="text-xs font-normal text-amber-200">/ 100</span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Tahap Baik (TP5)
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span>{t('Kadar Capai Minimum (≥ TP3)', 'Minimum Attainment')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-amber-300">
                {passingMinimumRate}%
              </div>
              <div className="text-[11px] text-amber-200/80 mt-1">
                {passingMinimumCount} daripada {totalTpStudents} rekod murid
              </div>
            </div>

            <div 
              onClick={() => {
                const el = document.getElementById('intervention-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20 border-l-4 border-l-rose-500 cursor-pointer hover:bg-black/40 transition"
              title={t('Klik untuk lihat senarai murid perlu intervensi', 'Click to view students needing intervention')}
            >
              <div className="flex items-center justify-between text-amber-200 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{t('Perlu Intervensi (Skor < 40)', 'Need Intervention')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-rose-300">
                {interventionList.length} <span className="text-xs font-normal text-amber-200">{t('Murid', 'Students')}</span>
              </div>
              <div className="text-[11px] text-rose-300 font-semibold mt-1">
                Bimbingan TP1 &amp; TP2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Enrolment & Performance Cards */}
      <div className="bg-white rounded-2xl border border-amber-200/70 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7D121D]" />
              Enrolmen &amp; Prestasi Mengikut Kelas (Tahun 4 SAS)
            </h2>
            <p className="text-xs text-slate-500">
              Pecahan bilangan murid dan purata markah mentah instrumen mengikut kelas semasa.
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
            3 Kelas Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classesBreakdown.map((cls, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-gradient-to-b from-amber-50/40 to-white hover:border-amber-400 transition shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-slate-900 text-sm">{cls.name}</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  {cls.room}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <div className="text-2xl font-black text-[#7D121D]">{cls.students}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Murid Berdaftar</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-700">{cls.avgScore} %</div>
                  <div className="text-[11px] text-slate-500 font-medium">Purata Skor Kelas</div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Lelaki: <strong>{cls.male}</strong></span>
                <span>Perempuan: <strong>{cls.female}</strong></span>
                <button 
                  onClick={() => onNavigate('scores')}
                  className="text-[11px] text-[#7D121D] font-bold hover:underline cursor-pointer"
                >
                  Lihat Skor →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: TP Distribution & Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TP1 - TP6 Distribution */}
        <div className="bg-white rounded-2xl border border-amber-200/70 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#7D121D]" />
                {t('Taburan Tahap Penguasaan (TP1 – TP6)', 'Mastery Level Distribution (TP1 – TP6)')}
              </h2>
              <p className="text-xs text-slate-500">
                Piawaian rasmi skor mentah instrumen Matriks Pembelajaran KPM.
              </p>
            </div>
            <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded-md border border-amber-300">
              Piawaian Skor KPM
            </span>
          </div>

          <div className="space-y-3">
            {[
              { tp: 'TP6', label: 'Cemerlang (85 – 100)', count: stats.tpDistribution.TP6 || 0, color: 'bg-emerald-600' },
              { tp: 'TP5', label: 'Sangat Baik (70 – 84)', count: stats.tpDistribution.TP5 || 0, color: 'bg-emerald-500' },
              { tp: 'TP4', label: 'Baik (55 – 69)', count: stats.tpDistribution.TP4 || 0, color: 'bg-amber-500' },
              { tp: 'TP3', label: 'Memuas (40 – 54) *Tahap Minimum', count: stats.tpDistribution.TP3 || 0, color: 'bg-orange-500' },
              { tp: 'TP2', label: 'Perlu Bimbingan (20 – 39)', count: stats.tpDistribution.TP2 || 0, color: 'bg-rose-500' },
              { tp: 'TP1', label: 'Bimbingan Rapi (0 – 19)', count: stats.tpDistribution.TP1 || 0, color: 'bg-rose-700' },
            ].map(item => {
              const pct = totalTpStudents > 0 
                ? ((item.count / totalTpStudents) * 100).toFixed(1) 
                : '0.0';
              return (
                <div key={item.tp} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-extrabold text-slate-900">{item.tp}</span>
                      <span>— {item.label}</span>
                    </span>
                    <span className="text-slate-900 font-bold">{item.count} murid ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>* TP3 merupakan Tahap Penguasaan Minimum KPM</span>
            <button 
              onClick={() => onNavigate('deliverables')}
              className="text-[#7D121D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Jana Laporan Penuh <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subject Performance & Averages */}
        <div className="bg-white rounded-2xl border border-amber-200/70 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#7D121D]" />
                {t('Prestasi Skor Mentah Mengikut Mata Pelajaran', 'Subject Raw Score Performance')}
              </h2>
              <p className="text-xs text-slate-500">
                Purata skor mentah dan jumlah rekod dinilai bagi setiap subjek Tahun 4 SAS.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg">
              {Object.keys(stats.subjectStats).length} Mata Pelajaran
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-amber-200/80 text-[11px] font-extrabold text-slate-600 uppercase bg-amber-50/50">
                  <th className="py-2.5 px-3">Kod &amp; Mata Pelajaran</th>
                  <th className="py-2.5 px-3 text-center">Bil. Rekod</th>
                  <th className="py-2.5 px-3 text-right">Purata Skor</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(stats.subjectStats).map(([code, data]) => (
                  <tr key={code} className="hover:bg-amber-50/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1 rounded font-bold">{code}</span>
                      <span>{data.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{data.count}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#7D121D]">
                      {data.avg.toFixed(1)} / 100
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {data.avg >= 70 ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">TP5 Baik</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">TP4 Memuaskan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Prestasi dikira secara automatik dari skor mentah rasmi</span>
            <button 
              onClick={() => onNavigate('scores')}
              className="text-[#7D121D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Semak Markah Guru <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Intervention Section for Students */}
      <div id="intervention-section" className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              {t('Senarai Murid Memerlukan Bimbingan Intervensi Segera (SAS)', 'Students Requiring Immediate Intervention (SAS)')}
            </h2>
            <p className="text-xs text-rose-700">
              Murid yang memperoleh skor mentah bawah 40 atau berada pada Tahap Penguasaan TP1 / TP2 dalam instrumen pentaksiran.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by class */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                <option value="4 Cemerlang">4 Cemerlang</option>
                <option value="4 Gemilang">4 Gemilang</option>
                <option value="4 Terbilang">4 Terbilang</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Cari murid / MyKid..."
                className="pl-7 pr-3 py-1 border border-slate-200 rounded-xl text-xs w-44 focus:ring-2 focus:ring-[#7D121D] outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>

            <button
              onClick={() => onNavigate('deliverables')}
              className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Eksport Laporan Intervensi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-rose-100 text-[11px] font-extrabold text-slate-600 uppercase bg-rose-50/50">
                <th className="py-2.5 px-3">Nama Murid</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Mata Pelajaran</th>
                <th className="py-2.5 px-3 text-center">Skor Mentah</th>
                <th className="py-2.5 px-3">Tahap Penguasaan</th>
                <th className="py-2.5 px-3">Cadangan Tindakan Panitia SAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredInterventions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Tiada rekod murid memerlukan intervensi mengikut kriteria carian.
                  </td>
                </tr>
              ) : (
                filteredInterventions.map((st, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/40 transition">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedStudentId(st.studentId || st.id)}
                        className="text-left font-bold text-[#7D121D] hover:text-[#580B12] hover:underline transition cursor-pointer flex items-center gap-1 group"
                        title="Klik untuk lihat profil murid dan markah penuh"
                      >
                        <span>{st.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0" />
                      </button>
                      {st.mykid && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {maskPII ? '******-**-****' : st.mykid}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{st.class}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{st.subject}</td>
                    <td className="py-2.5 px-3 text-center font-black text-rose-600 bg-rose-50/50 rounded">
                      {st.score} / 100
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                        {st.tp || 'TP2 - Perlu Bimbingan'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {st.recommendedAction || 'Modul Pemulihan & Pengukuhan Berjadual Panitia'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile & Full Score Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};
