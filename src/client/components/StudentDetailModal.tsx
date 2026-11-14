import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  Award, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles,
  Building,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

interface StudentDetailData {
  student: {
    id: string;
    studentId: string;
    mykid: string;
    fullName: string;
    gender: string;
    active: boolean;
    class?: {
      name: string;
      gradeLevel: number;
    };
  };
  subjectScores: Array<{
    subjectId: string;
    code: string;
    name: string;
    hasRecord: boolean;
    recordId: string | null;
    rawScore: number | null;
    masteryLevel: number | null;
    status: string;
    isSampled: boolean;
    correctionReason: string | null;
    cycleName: string | null;
    submittedAt: string | null;
    submittedBy: string | null;
    approvedAt: string | null;
    approvedBy: string | null;
    moderations: Array<{
      id: string;
      originalScore: number;
      moderatedScore: number;
      decision: string;
      comments: string | null;
      moderatedAt: string;
      moderator?: {
        name: string;
        role: string;
      };
    }>;
  }>;
  stats: {
    totalSubjects: number;
    recordedSubjects: number;
    averageScore: number | null;
    tpCounts: Record<string, number>;
    needsIntervention: boolean;
  };
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose }) => {
  const { maskPII, activeCycle, t } = useApp();
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullMyKid, setShowFullMyKid] = useState<boolean>(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);

    const cycleParam = activeCycle ? `?cycleId=${activeCycle.id}` : '';
    fetch(`/api/roster/students/${studentId}${cycleParam}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuatkan maklumat murid');
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
  }, [studentId, activeCycle]);

  if (!studentId) return null;

  const getTPBadge = (tp: number | null) => {
    switch (tp) {
      case 6:
        return { label: 'TP6 - Cemerlang', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 5:
        return { label: 'TP5 - Sangat Baik', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 4:
        return { label: 'TP4 - Baik', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 3:
        return { label: 'TP3 - Memuaskan (Min)', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 2:
        return { label: 'TP2 - Perlu Bimbingan', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 1:
        return { label: 'TP1 - Bimbingan Rapi', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      default:
        return { label: 'Belum Dinilai', bg: 'bg-slate-100 text-slate-600 border-slate-300' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'Draf Guru', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'SUBMITTED':
        return { label: 'Dihantar Guru', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'VALIDATED':
        return { label: 'Disemak Penyelaras', color: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'MODERATED':
        return { label: 'Moderasi KPMP', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'APPROVED':
        return { label: 'Diluluskan Pentadbir', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'EXPORT_READY':
        return { label: 'Sedia SBPPA', color: 'bg-[#7D121D]/10 text-[#7D121D] border-[#7D121D]/30 font-bold' };
      case 'LOCKED':
        return { label: 'Dikunci Berkanun', color: 'bg-slate-800 text-white border-slate-900' };
      default:
        return { label: 'Belum Diisi', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
  };

  const handlePrint = () => {
    if (!data) return;

    // Use an isolated hidden iframe so browser prints ONLY the 1-page slip and excludes background DOM
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const mykidDisplay = formatMyKid(data.student.mykid);
    const dateStr = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ms">
        <head>
          <meta charset="utf-8" />
          <title>Slip Pentaksiran - ${data.student.fullName} (${data.student.studentId})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 100%;
              height: 100%;
              background: #ffffff;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 10.5px;
              line-height: 1.35;
            }
            .slip-wrapper {
              width: 100%;
              max-width: 100%;
              page-break-inside: avoid;
              page-break-after: avoid;
              break-inside: avoid;
            }
            .header-table {
              width: 100%;
              border-bottom: 2.5px solid #7D121D;
              padding-bottom: 6px;
              margin-bottom: 6px;
            }
            .title-box {
              text-align: center;
              margin: 6px 0 8px 0;
            }
            .title-box h2 {
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .title-box p {
              font-size: 10px;
              color: #475569;
              font-weight: 600;
            }
            .student-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 8px;
              background-color: #f8fafc;
            }
            .student-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 16px;
              row-gap: 3px;
            }
            .grid-row {
              display: flex;
              align-items: baseline;
            }
            .grid-label {
              width: 110px;
              font-weight: 700;
              color: #475569;
              font-size: 10px;
            }
            .grid-val {
              font-weight: 800;
              color: #0f172a;
              font-size: 11px;
            }
            .score-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            .score-table th, .score-table td {
              border: 1px solid #cbd5e1;
              padding: 4px 6px;
            }
            .score-table th {
              background-color: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
              font-size: 9.5px;
              text-align: left;
            }
            .score-table td {
              font-size: 10px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 6px;
              margin-bottom: 8px;
              text-align: center;
            }
            .kpi-box {
              border: 1px solid #cbd5e1;
              border-radius: 5px;
              padding: 5px;
              background: #f8fafc;
            }
            .kpi-label {
              font-size: 8.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .kpi-val {
              font-size: 12px;
              font-weight: 900;
              color: #7D121D;
              margin-top: 2px;
            }
            .scale-ref {
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 4px 6px;
              margin-bottom: 12px;
              background: #fafafa;
              font-size: 8px;
              color: #475569;
            }
            .sig-table {
              width: 100%;
              margin-top: 12px;
              padding-top: 6px;
              border-top: 1px solid #cbd5e1;
            }
            .sig-col {
              width: 50%;
              text-align: center;
              vertical-align: top;
              padding: 0 15px;
            }
            .sig-line {
              border-bottom: 1px solid #64748b;
              width: 75%;
              margin: 40px auto 4px auto;
            }
            .footer-text {
              text-align: center;
              font-size: 8px;
              color: #94a3b8;
              margin-top: 8px;
              border-top: 1px solid #f1f5f9;
              padding-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="slip-wrapper">
            <table class="header-table">
              <tr>
                <td style="width: 58px; vertical-align: middle;">
                  <img src="/SAS.jpg" style="width: 50px; height: 50px; object-fit: contain;" />
                </td>
                <td style="vertical-align: middle; padding-left: 8px;">
                  <h1 style="font-size: 14px; font-weight: 900; color: #7D121D; text-transform: uppercase; margin-bottom: 1px; letter-spacing: -0.2px;">
                    Sekolah Agama Suria (SR SABK)
                  </h1>
                  <div style="font-size: 10px; font-weight: 700; color: #1e293b;">
                    PPD TUARAN, SABAH • KOD SEKOLAH: XCA4301
                  </div>
                  <div style="font-size: 8.5px; color: #64748b;">
                    Peti Surat 123, 89208 Tuaran, Sabah • E-mel: admin@sekolah.edu.my
                  </div>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <div style="display: inline-block; background: #fffbeb; border: 1px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 800; color: #78350f;">
                    SLIP RASMI SBPPA KPM
                  </div>
                  <div style="font-size: 8.5px; color: #64748b; margin-top: 2px; font-family: monospace;">
                    Tarikh: ${dateStr}
                  </div>
                </td>
              </tr>
            </table>

            <div class="title-box">
              <h2>Slip Keputusan Pentaksiran Matriks Pembelajaran Murid</h2>
              <p>${activeCycle?.name || 'Kitaran 1 - Pertengahan Sesi 2026/2027'} • Tahun ${data.student.class?.gradeLevel || 4}</p>
            </div>

            <div class="student-card">
              <div class="student-grid">
                <div class="grid-row"><span class="grid-label">Nama Penuh:</span><span class="grid-val">${data.student.fullName}</span></div>
                <div class="grid-row"><span class="grid-label">Kelas:</span><span class="grid-val">${data.student.class?.name || 'Tahun 4'}</span></div>
                <div class="grid-row"><span class="grid-label">No. Pendaftaran:</span><span class="grid-val" style="font-family: monospace;">${data.student.studentId}</span></div>
                <div class="grid-row"><span class="grid-label">Jantina:</span><span class="grid-val">${data.student.gender === 'L' ? 'Lelaki' : 'Perempuan'}</span></div>
                <div class="grid-row"><span class="grid-label">No. MyKid:</span><span class="grid-val" style="font-family: monospace;">${mykidDisplay}</span></div>
                <div class="grid-row"><span class="grid-label">Status Enrolmen:</span><span class="grid-val" style="color: #065f46;">Aktif Berdaftar</span></div>
              </div>
            </div>

            <table class="score-table">
              <thead>
                <tr>
                  <th style="width: 30px; text-align: center;">BIL</th>
                  <th style="width: 45px; text-align: center;">KOD</th>
                  <th>MATA PELAJARAN</th>
                  <th style="width: 90px; text-align: center;">SKOR MENTAH</th>
                  <th style="width: 135px; text-align: center;">TAHAP PENGUASAAN</th>
                  <th>CATATAN / STATUS ALIRAN</th>
                </tr>
              </thead>
              <tbody>
                ${data.subjectScores.map((sub, i) => {
                  const tp = getTPBadge(sub.masteryLevel);
                  return `
                    <tr>
                      <td style="text-align: center; font-family: monospace; font-size: 9px;">${i + 1}</td>
                      <td style="text-align: center; font-weight: 700; font-family: monospace;">${sub.code}</td>
                      <td>
                        <div style="font-weight: 800; color: #0f172a;">${sub.name}</div>
                        ${sub.submittedBy ? `<div style="font-size: 8px; color: #64748b;">Guru: ${sub.submittedBy}</div>` : ''}
                      </td>
                      <td style="text-align: center; font-weight: 800;">
                        ${sub.rawScore !== null ? `<span style="${sub.rawScore < 40 ? 'color: #e11d48;' : 'color: #0f172a;'}">${sub.rawScore} / 100</span>` : '<span style="color: #94a3b8; font-style: italic; font-size: 8.5px;">Belum Diisi</span>'}
                      </td>
                      <td style="text-align: center;">
                        <span style="display: inline-block; padding: 1.5px 5px; border-radius: 4px; font-weight: 800; font-size: 8.5px; border: 1px solid #cbd5e1; background: #f8fafc;">
                          ${tp.label}
                        </span>
                      </td>
                      <td style="font-size: 8.5px; color: #334155;">
                        ${sub.isSampled ? 'Sampel Rawak KPMP Disahkan' : sub.hasRecord ? 'Rekod Lengkap Draf/Disemak' : 'Belum Ditaksir'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="kpi-grid">
              <div class="kpi-box">
                <div class="kpi-label">Purata Skor</div>
                <div class="kpi-val">${data.stats.averageScore !== null ? `${data.stats.averageScore}%` : '—'}</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-label">Tahap Capaian</div>
                <div class="kpi-val" style="color: #0f172a; font-size: 11px;">
                  ${data.stats.averageScore !== null ? (
                    data.stats.averageScore >= 85 ? 'TP6 (Cemerlang)' :
                    data.stats.averageScore >= 70 ? 'TP5 (Sangat Baik)' :
                    data.stats.averageScore >= 55 ? 'TP4 (Baik)' :
                    data.stats.averageScore >= 40 ? 'TP3 (Memuaskan)' :
                    data.stats.averageScore >= 20 ? 'TP2 (Bimbingan)' : 'TP1'
                  ) : '—'}
                </div>
              </div>
              <div class="kpi-box">
                <div class="kpi-label">Tahap Min KPM</div>
                <div class="kpi-val" style="color: #0f172a; font-size: 11px;">
                  ${data.stats.tpCounts.TP3 + data.stats.tpCounts.TP4 + data.stats.tpCounts.TP5 + data.stats.tpCounts.TP6} / ${data.stats.recordedSubjects} Subjek
                </div>
              </div>
              <div class="kpi-box" style="${data.stats.needsIntervention ? 'background: #fff1f2; border-color: #f43f5e;' : 'background: #ecfdf5; border-color: #10b981;'}">
                <div class="kpi-label">Status Intervensi</div>
                <div class="kpi-val" style="font-size: 10px; ${data.stats.needsIntervention ? 'color: #9f1239;' : 'color: #065f46;'}">
                  ${data.stats.needsIntervention ? 'Perlu Intervensi' : 'Memuaskan'}
                </div>
              </div>
            </div>

            <div class="scale-ref">
              <strong>Rujukan Skala Tahap Penguasaan (TP) Rasmi KPM: </strong>
              TP1 (0-19: Bimbingan Rapi) • TP2 (20-39: Perlu Bimbingan) • TP3 (40-54: Memuaskan - Tahap Min KPM) • TP4 (55-69: Baik) • TP5 (70-84: Sangat Baik) • TP6 (85-100: Cemerlang)
            </div>

            <table class="sig-table">
              <tr>
                <td class="sig-col">
                  <div style="font-weight: 700; color: #475569; font-size: 9px; text-transform: uppercase;">
                    Disediakan Oleh (Guru Kelas / Penyelaras Tahun 4):
                  </div>
                  <div class="sig-line"></div>
                  <div style="font-weight: 800; font-size: 9px; color: #0f172a;">Nama: ......................................................</div>
                  <div style="font-size: 8px; color: #64748b;">Tarikh: ..............................</div>
                </td>
                <td class="sig-col">
                  <div style="font-weight: 700; color: #475569; font-size: 9px; text-transform: uppercase;">
                    Disahkan Oleh & Cop Rasmi Sekolah:
                  </div>
                  <div class="sig-line"></div>
                  <div style="font-weight: 800; font-size: 9px; color: #0f172a;">Guru Besar / Pengetua (SAS)</div>
                  <div style="font-size: 8px; color: #64748b;">Tarikh: ..............................</div>
                </td>
              </tr>
            </table>

            <div class="footer-text">
              Dokumen ini dijana secara rasmi melalui Sistem my_SAS_MATRIKS (SBPPA KPM) Sekolah Agama Suria, Tuaran (XCA4301).
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print error:', e);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 300);
  };

  const formatMyKid = (mykid: string) => {
    if (showFullMyKid || !maskPII) {
      return mykid;
    }
    if (mykid.length >= 4) {
      return `******-**-${mykid.slice(-4)}`;
    }
    return '******-**-****';
  };

  return (
    <>
      {/* Interactive Screen Modal (Hidden when printing) */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fadeIn no-print">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-amber-300/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Royal Maroon & Gold */}
        <div className="bg-gradient-to-r from-[#580B12] via-[#7D121D] to-[#9B1C2A] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-amber-400/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-black/30 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Kad Laporan Pentaksiran
                </span>
                <span className="text-xs text-amber-200/90 font-medium">
                  {activeCycle?.name || 'Sesi 2026/2027'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Profil & Rekod Pentaksiran Murid (SAS)
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
                Memuatkan profil dan rekod markah murid...
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
              {/* Student Identification Banner */}
              <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md shrink-0 ${
                    data.student.gender === 'L' ? 'bg-blue-600' : 'bg-pink-600'
                  }`}>
                    {data.student.fullName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {data.student.studentId}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        data.student.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {data.student.gender === 'L' ? 'Lelaki' : 'Perempuan'}
                      </span>
                      <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Enrolmen Aktif
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {data.student.fullName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-amber-700" />
                        Kelas: <strong className="text-slate-900">{data.student.class?.name || 'Tahun 4'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-mono">
                        No. MyKid: <strong>{formatMyKid(data.student.mykid)}</strong>
                        {maskPII && (
                          <button
                            type="button"
                            onClick={() => setShowFullMyKid(!showFullMyKid)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                            title={showFullMyKid ? 'Topeng MyKid' : 'Papar MyKid Penuh'}
                          >
                            {showFullMyKid ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    title="Cetak Kad Prestasi Murid"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Cetak Slip</span>
                  </button>
                </div>
              </div>

              {/* Performance Overview KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Purata Skor Keseluruhan
                  </div>
                  <div className="text-2xl font-black text-[#7D121D] mt-1">
                    {data.stats.averageScore !== null ? `${data.stats.averageScore}%` : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {data.stats.recordedSubjects} daripada {data.stats.totalSubjects} subjek dinilai
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Tahap Capaian
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.stats.averageScore !== null ? (
                      data.stats.averageScore >= 85 ? 'TP6' :
                      data.stats.averageScore >= 70 ? 'TP5' :
                      data.stats.averageScore >= 55 ? 'TP4' :
                      data.stats.averageScore >= 40 ? 'TP3' :
                      data.stats.averageScore >= 20 ? 'TP2' : 'TP1'
                    ) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Piawaian Skor Mentah KPM
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Pematuhan Minimum
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.stats.tpCounts.TP3 + data.stats.tpCounts.TP4 + data.stats.tpCounts.TP5 + data.stats.tpCounts.TP6} / {data.stats.recordedSubjects}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    Subjek melepasi TP3 (≥ 40)
                  </div>
                </div>

                <div className={`rounded-xl p-3 border ${
                  data.stats.needsIntervention 
                    ? 'bg-rose-50 border-rose-300' 
                    : 'bg-emerald-50 border-emerald-300'
                }`}>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    Status Intervensi
                  </div>
                  <div className={`text-sm sm:text-base font-black mt-1 flex items-center gap-1.5 ${
                    data.stats.needsIntervention ? 'text-rose-800' : 'text-emerald-800'
                  }`}>
                    {data.stats.needsIntervention ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Perlu Bimbingan</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Memuaskan</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {data.stats.needsIntervention ? 'Skor < 40 atau TP1/TP2' : 'Tiada intervensi kritikal'}
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#7D121D]" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Keputusan Markah Mentah & Tahap Penguasaan Mengikut Mata Pelajaran
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tahun 4 • Kitaran 1 SAS
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">KOD</th>
                        <th className="py-2.5 px-3">MATA PELAJARAN</th>
                        <th className="py-2.5 px-3 text-center w-28">SKOR MENTAH</th>
                        <th className="py-2.5 px-3 w-44">TAHAP PENGUASAAN</th>
                        <th className="py-2.5 px-3 w-36">STATUS ALIRAN</th>
                        <th className="py-2.5 px-3">STATUS MODERASI & CATATAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.subjectScores.map((sub) => {
                        const tpBadge = getTPBadge(sub.masteryLevel);
                        const statusBadge = getStatusBadge(sub.status);
                        return (
                          <tr key={sub.subjectId} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                              {sub.code}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-extrabold text-slate-900">{sub.name}</div>
                              {sub.submittedBy && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Guru: {sub.submittedBy}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub.rawScore !== null ? (
                                <div>
                                  <span className={`text-sm font-black ${
                                    sub.rawScore < 40 ? 'text-rose-600' : 'text-slate-900'
                                  }`}>
                                    {sub.rawScore}
                                  </span>
                                  <span className="text-[10px] text-slate-400"> / 100</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">— Belum Diisi —</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${tpBadge.bg}`}>
                                {tpBadge.label}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.color}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {sub.isSampled ? (
                                <div className="space-y-1">
                                  <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                                    Sampel Rawak KPMP
                                  </span>
                                  {sub.moderations && sub.moderations.length > 0 && (
                                    <div className="text-[11px] text-slate-600 bg-purple-50/40 p-1.5 rounded border border-purple-100">
                                      <div className="font-semibold text-purple-900 text-[10px]">
                                        Moderator: {sub.moderations[0].moderator?.name}
                                      </div>
                                      <div className="text-slate-700 italic">
                                        "{sub.moderations[0].comments || 'Skor mematuhi rubrik KPM.'}"
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  {sub.hasRecord ? 'Rekod biasa (Bukan sampel rawak)' : 'Tiada rekod skor'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rubric Guide Footer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Rujukan Tahap Penguasaan (TP) Rasmi KPM:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
                  <div className="bg-rose-50 border border-rose-200 rounded p-1">
                    <strong className="text-rose-900">TP1 (0 - 19)</strong>
                    <div className="text-slate-500">Bimbingan Rapi</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded p-1">
                    <strong className="text-orange-900">TP2 (20 - 39)</strong>
                    <div className="text-slate-500">Perlu Bimbingan</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-300 rounded p-1">
                    <strong className="text-amber-900">TP3 (40 - 54)</strong>
                    <div className="text-slate-500">*Tahap Min KPM</div>
                  </div>
                  <div className="bg-cyan-50 border border-cyan-200 rounded p-1">
                    <strong className="text-cyan-900">TP4 (55 - 69)</strong>
                    <div className="text-slate-500">Baik</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-1">
                    <strong className="text-blue-900">TP5 (70 - 84)</strong>
                    <div className="text-slate-500">Sangat Baik</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-1">
                    <strong className="text-emerald-900">TP6 (85 - 100)</strong>
                    <div className="text-slate-500">Cemerlang</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
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

    {/* Dedicated 1-Page Official Student Slip for Printing */}
    {data && (
      <div id="printable-student-slip" className="hidden print:block text-slate-900 bg-white font-sans p-2">
        {/* Official School Kop */}
        <div className="flex items-center justify-between border-b-2 border-[#7D121D] pb-2 mb-2">
          <div className="flex items-center gap-3">
            <img src="/SAS.jpg" alt="Logo SAS" className="w-14 h-14 object-contain shrink-0" />
            <div>
              <h1 className="text-sm font-black tracking-tight text-[#7D121D] uppercase leading-tight">
                Sekolah Agama Suria (SR SABK)
              </h1>
              <p className="text-[10px] font-bold text-slate-800">
                PPD TUARAN, SABAH • KOD SEKOLAH: XCA4301
              </p>
              <p className="text-[9px] text-slate-500">
                Alamat: Peti Surat 123, 89208 Tuaran, Sabah • E-mel: admin@sekolah.edu.my
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-amber-50 border border-amber-400 px-2 py-0.5 rounded text-[9px] font-black text-amber-950 uppercase tracking-wide">
              Slip Rasmi SBPPA KPM
            </div>
            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              Tarikh Cetak: {new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Slip Title */}
        <div className="text-center my-1.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Slip Keputusan Pentaksiran Matriks Pembelajaran Murid
          </h2>
          <p className="text-[10px] text-slate-600 font-semibold">
            {activeCycle?.name || 'Kitaran 1 - Pertengahan Sesi 2026/2027'} • Tahun {data.student.class?.gradeLevel || 4}
          </p>
        </div>

        {/* Student Profile Info Grid */}
        <div className="border border-slate-300 rounded p-2 mb-2 bg-slate-50/70 text-[10px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">Nama Penuh:</span>
              <span className="font-black text-slate-900 uppercase">{data.student.fullName}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">Kelas:</span>
              <span className="font-black text-slate-900">{data.student.class?.name || 'Tahun 4'}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">No. Pendaftaran:</span>
              <span className="font-mono font-bold text-slate-900">{data.student.studentId}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">Jantina:</span>
              <span className="font-bold text-slate-800">{data.student.gender === 'L' ? 'Lelaki' : 'Perempuan'}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">No. MyKid:</span>
              <span className="font-mono font-bold text-slate-900">{formatMyKid(data.student.mykid)}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-bold text-slate-600">Status Enrolmen:</span>
              <span className="font-bold text-emerald-800">Aktif Berdaftar</span>
            </div>
          </div>
        </div>

        {/* Subject Scores Table */}
        <div className="mb-2">
          <table className="w-full text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 py-1 px-1.5 text-center w-8">BIL</th>
                <th className="border border-slate-300 py-1 px-1.5 text-center w-12">KOD</th>
                <th className="border border-slate-300 py-1 px-2 text-left">MATA PELAJARAN</th>
                <th className="border border-slate-300 py-1 px-2 text-center w-24">SKOR MENTAH</th>
                <th className="border border-slate-300 py-1 px-2 text-center w-36">TAHAP PENGUASAAN</th>
                <th className="border border-slate-300 py-1 px-2 text-left">CATATAN / MODERASI</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectScores.map((sub, index) => {
                const tp = getTPBadge(sub.masteryLevel);
                return (
                  <tr key={sub.subjectId} className="border-b border-slate-200">
                    <td className="border border-slate-300 py-1 px-1.5 text-center font-mono text-[9px]">{index + 1}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center font-mono font-bold">{sub.code}</td>
                    <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">
                      {sub.name}
                      {sub.submittedBy && <span className="block text-[8px] font-normal text-slate-500">Guru: {sub.submittedBy}</span>}
                    </td>
                    <td className="border border-slate-300 py-1 px-2 text-center font-bold">
                      {sub.rawScore !== null ? (
                        <span className={sub.rawScore < 40 ? 'text-rose-600' : 'text-slate-900'}>
                          {sub.rawScore} / 100
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[9px]">Belum Diisi</span>
                      )}
                    </td>
                    <td className="border border-slate-300 py-1 px-2 text-center">
                      <span className="font-extrabold text-[9px] inline-block px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50">
                        {tp.label}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-1 px-2 text-[9px]">
                      {sub.isSampled ? 'Sampel Rawak KPMP Disahkan' : sub.hasRecord ? 'Rekod Lengkap Draf/Disemak' : 'Belum Ditaksir'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Performance Summary Cards (Compact 1-row) */}
        <div className="grid grid-cols-4 gap-1.5 mb-2 text-center text-[10px]">
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Purata Skor</div>
            <div className="text-xs font-black text-[#7D121D]">
              {data.stats.averageScore !== null ? `${data.stats.averageScore}%` : '—'}
            </div>
          </div>
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Tahap Capaian</div>
            <div className="text-xs font-black text-slate-900">
              {data.stats.averageScore !== null ? (
                data.stats.averageScore >= 85 ? 'TP6 (Cemerlang)' :
                data.stats.averageScore >= 70 ? 'TP5 (Sangat Baik)' :
                data.stats.averageScore >= 55 ? 'TP4 (Baik)' :
                data.stats.averageScore >= 40 ? 'TP3 (Memuaskan)' :
                data.stats.averageScore >= 20 ? 'TP2 (Bimbingan)' : 'TP1'
              ) : '—'}
            </div>
          </div>
          <div className="border border-slate-300 rounded p-1 bg-slate-50">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Tahap Min KPM</div>
            <div className="text-xs font-black text-slate-900">
              {data.stats.tpCounts.TP3 + data.stats.tpCounts.TP4 + data.stats.tpCounts.TP5 + data.stats.tpCounts.TP6} / {data.stats.recordedSubjects} Subjek
            </div>
          </div>
          <div className={`border rounded p-1 ${data.stats.needsIntervention ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-emerald-400 bg-emerald-50 text-emerald-800'}`}>
            <div className="text-[8px] font-bold uppercase">Status Intervensi</div>
            <div className="text-xs font-black">
              {data.stats.needsIntervention ? 'Perlu Bimbingan' : 'Memuaskan'}
            </div>
          </div>
        </div>

        {/* Scale Reference */}
        <div className="border border-slate-200 rounded p-1 mb-3 text-[8px] text-slate-600 bg-slate-50/50">
          <strong className="text-slate-800">Skala TP KPM: </strong>
          TP1 (0-19: Bimbingan Rapi) • TP2 (20-39: Perlu Bimbingan) • TP3 (40-54: Memuaskan - Tahap Min KPM) • TP4 (55-69: Baik) • TP5 (70-84: Sangat Baik) • TP6 (85-100: Cemerlang)
        </div>

        {/* Signatures Box */}
        <div className="grid grid-cols-2 gap-8 pt-2 mt-2 border-t border-slate-300 text-[10px]">
          <div className="text-center">
            <p className="font-bold text-slate-600 text-[9px] uppercase mb-10">
              Disediakan Oleh (Guru Kelas / Penyelaras Tahun 4):
            </p>
            <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
            <p className="font-bold text-slate-800 text-[9px]">Nama: ......................................................</p>
            <p className="text-[8px] text-slate-500">Tarikh: ..............................</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-600 text-[9px] uppercase mb-10">
              Disahkan Oleh & Cop Rasmi Sekolah:
            </p>
            <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
            <p className="font-bold text-slate-800 text-[9px]">Guru Besar / Pengetua (SAS)</p>
            <p className="text-[8px] text-slate-500">Tarikh: ..............................</p>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-[8px] text-slate-400 mt-3 border-t border-slate-100 pt-1">
          Dokumen ini dijana secara rasmi melalui Sistem my_SAS_MATRIKS (SBPPA KPM) Sekolah Agama Suria, Tuaran (XCA4301).
        </div>
      </div>
    )}
  </>
);
};
