import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  ShieldCheck, 
  Mail, 
  Building, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ChevronRight, 
  Sparkles,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface OfficerDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

interface OfficerDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    subjectHeadOf?: string | null;
    school?: {
      name: string;
      code: string;
    };
    createdAt: string;
  };
  assignments: Array<{
    id: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    totalStudents: number;
    draftCount: number;
    submittedCount: number;
    approvedCount: number;
    averageScore: number | null;
    status: string;
  }>;
  panitiaStats: {
    subjectCode: string;
    subjectName: string;
    totalRecords: number;
    sampledCount: number;
    requiredCount: number;
    moderatedCount: number;
    quorumRate: number;
    isQuorumMet: boolean;
  } | null;
  summary: {
    totalAssignments: number;
    role: string;
    roleTitle: string;
  };
}

export const OfficerDetailModal: React.FC<OfficerDetailModalProps> = ({ 
  userId, 
  onClose,
  onNavigate 
}) => {
  const { activeCycle, t } = useApp();
  const [data, setData] = useState<OfficerDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const cycleParam = activeCycle ? `?cycleId=${activeCycle.id}` : '';
    fetch(`/api/auth/users/${userId}${cycleParam}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuatkan maklumat pegawai');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId, activeCycle]);

  if (!userId) return null;

  const roleMeta: Record<string, { title: string; color: string; desc: string; badge: string }> = {
    SUPER_ADMIN: {
      title: 'Pentadbir Utama Sistem (Super Admin)',
      color: 'bg-rose-100 text-[#7D121D] border-rose-300',
      badge: 'bg-[#7D121D] text-white',
      desc: 'Mempunyai kawalan teknikal dan pentadbiran penuh ke atas konfigurasi sistem my_SAS_MATRIKS, pengurusan akaun ID pengguna, dan pengawalan akses operasi pentaksiran sekolah.',
    },
    LEADER: {
      title: 'Pihak Pengurusan / Pentadbir Sekolah',
      color: 'bg-purple-100 text-purple-900 border-purple-300',
      badge: 'bg-purple-700 text-white',
      desc: 'Membantu pihak pengurusan sekolah dalam pemantauan aliran kerja pentaksiran bilik darjah dan semakan status operasi akademik sekolah.',
    },
    COORDINATOR: {
      title: 'Penyelaras Matriks Pembelajaran (PBD/SBPPA)',
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      badge: 'bg-amber-600 text-white',
      desc: 'Bertanggungjawab memastikan kelengkapan penyerahan skor mentah guru, penentusahan format pra-moderasi, dan penyelarasan jadual pentaksiran Tahun 4 SAS.',
    },
    KPMP: {
      title: 'Ketua Panitia Mata Pelajaran (KPMP)',
      color: 'bg-orange-100 text-orange-900 border-orange-300',
      badge: 'bg-orange-600 text-white',
      desc: 'Mengetuai semakan kualiti pentaksiran panitia, melaksanakan moderasi sekurang-kurangnya 10% sampel rawak murid, dan mengesahkan konsistensi rubrik skor mentah.',
    },
    TEACHER: {
      title: 'Guru Mata Pelajaran',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      badge: 'bg-emerald-600 text-white',
      desc: 'Bertanggungjawab memasukkan markah mentah murid (0-100) dan menentukan Tahap Penguasaan instrumen (TP1-TP6) bagi kelas yang ditugaskan mengikut garis panduan KPM.',
    },
    DATA_OFFICER: {
      title: 'Pegawai Data Sekolah',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      badge: 'bg-cyan-700 text-white',
      desc: 'Mengurus pakej penyediaan data berkanun XLSX/CSV SBPPA untuk kemasukan atau muat naik ke portal rasmi Kementerian Pendidikan Malaysia.',
    },
  };

  const userRole = data?.user.role || 'TEACHER';
  const roleInfo = roleMeta[userRole] || roleMeta.TEACHER;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-amber-300/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#580B12] via-[#7D121D] to-[#9B1C2A] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-amber-400/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-black/30 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Profil & Penugasan Pegawai
                </span>
                <span className="text-xs text-amber-200/90 font-medium">
                  {activeCycle?.name || 'Sesi 2026/2027'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Maklumat Peranan & Penugasan Rasmi (SAS)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#7D121D] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                Memuatkan profil dan rekod penugasan pegawai...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center text-rose-800 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Officer Profile Card */}
              <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0 ${roleInfo.badge}`}>
                    {data.user.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${roleInfo.color}`}>
                        {data.user.role}
                      </span>
                      {data.user.subjectHeadOf && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-950 border border-orange-300 px-2 py-0.5 rounded-full">
                          Ketua Panitia {data.user.subjectHeadOf}
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Akaun Sah Aktif
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {data.user.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-amber-700" />
                        {data.user.email}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        ID: <strong className="text-slate-800">{data.user.id}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Jawatan Rasmi:</div>
                  <div className="text-xs sm:text-sm font-extrabold text-[#7D121D] mt-0.5">
                    {data.summary.roleTitle}
                  </div>
                </div>
              </div>

              {/* Scope & Responsibilities (RBAC Deskripsi) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7D121D]" />
                  Skop Tugas &amp; Bidang Kuasa Aliran Kerja
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {roleInfo.desc}
                </p>
              </div>

              {/* KPMP Specific Panitia Quorum Card */}
              {data.panitiaStats && (
                <div className="bg-amber-50/60 border border-amber-300/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-800" />
                      <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">
                        Status Kuorum Moderasi Panitia ({data.panitiaStats.subjectCode} - {data.panitiaStats.subjectName})
                      </h4>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      data.panitiaStats.isQuorumMet ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}>
                      {data.panitiaStats.isQuorumMet ? 'Kuorum Mematuhi KPM' : 'Belum Capai Kuorum (Min 10%)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3">
                    <div className="bg-white border border-amber-200 rounded p-2">
                      <div className="text-[10px] font-bold text-slate-500">Jumlah Rekod</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">{data.panitiaStats.totalRecords}</div>
                    </div>
                    <div className="bg-white border border-amber-200 rounded p-2">
                      <div className="text-[10px] font-bold text-slate-500">Sampel Disemak</div>
                      <div className="text-base font-black text-amber-800 mt-0.5">{data.panitiaStats.sampledCount}</div>
                    </div>
                    <div className="bg-white border border-amber-200 rounded p-2">
                      <div className="text-[10px] font-bold text-slate-500">Sasaran Min. (10%)</div>
                      <div className="text-base font-black text-slate-700 mt-0.5">{data.panitiaStats.requiredCount}</div>
                    </div>
                    <div className="bg-white border border-amber-200 rounded p-2">
                      <div className="text-[10px] font-bold text-slate-500">Kadar Semakan</div>
                      <div className="text-base font-black text-[#7D121D] mt-0.5">{data.panitiaStats.quorumRate}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Assignments Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#7D121D]" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {data.user.role === 'TEACHER' 
                        ? `Senarai Penugasan Mengajar (${data.assignments.length} Penugasan)`
                        : data.user.role === 'KPMP' 
                        ? 'Penugasan Mengajar & Tanggungjawab Panitia'
                        : 'Skop Pengurusan Sekolah'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tahun 4 SAS • Sesi 2026/2027
                  </span>
                </div>

                {data.assignments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {data.user.role === 'SUPER_ADMIN' || data.user.role === 'COORDINATOR' || data.user.role === 'DATA_OFFICER' ? (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700">
                          Pegawai ini mempunyai bidang kuasa pentadbiran di peringkat keseluruhan sekolah (Semua Kelas & Semua Mata Pelajaran).
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tiada kelas mengajar individu yang dikhususkan.
                        </p>
                      </div>
                    ) : (
                      'Tiada penugasan mengajar aktif bagi pegawai ini.'
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">KELAS</th>
                          <th className="py-2.5 px-3">KOD & MATA PELAJARAN</th>
                          <th className="py-2.5 px-3 text-center">ENROLMEN</th>
                          <th className="py-2.5 px-3 text-center">STATUS KEMASUKAN</th>
                          <th className="py-2.5 px-3 text-center">PURATA KELAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.assignments.map((assign, idx) => (
                          <tr key={assign.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="py-3 px-3 font-extrabold text-slate-900">
                              {assign.className}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              <span className="font-mono text-amber-800 font-bold mr-1.5">{assign.subjectCode}</span>
                              {assign.subjectName}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-slate-800">{assign.totalStudents}</span>
                              <span className="text-[10px] text-slate-500"> Murid</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {assign.draftCount > 0 ? (
                                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  {assign.draftCount} Murid Dalam Draf
                                </span>
                              ) : assign.totalStudents > 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Selesai Dihantar
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Belum Mula</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                              {assign.averageScore !== null ? `${assign.averageScore}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Sekolah Agama Suria • Kod Sekolah: <strong>XCA4301</strong>
          </div>
          <button
            onClick={onClose}
            className="bg-[#7D121D] hover:bg-[#580B12] text-white font-extrabold text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            Tutup Paparan
          </button>
        </div>
      </div>
    </div>
  );
};
