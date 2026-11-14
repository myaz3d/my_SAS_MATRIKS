import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  SlidersHorizontal, 
  Printer, 
  FileText,
  Layers,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SBPPA_MAPPING, SBPPAColumnMapping } from '../../shared/types';

interface SBPPAExportPackageProps {
  onNavigate?: (tab: string) => void;
}

export const SBPPAExportPackage: React.FC<SBPPAExportPackageProps> = ({ onNavigate }) => {
  const { currentUser, activeCycle, t } = useApp();

  const [checklistData, setChecklistData] = useState<any | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState<boolean>(true);

  // Column mapping modal & state
  const [columnMapping, setColumnMapping] = useState<SBPPAColumnMapping>(DEFAULT_SBPPA_MAPPING);
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);

  // Live report preview modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    type: 'VALIDATION' | 'RECONCILIATION' | 'MODERATION' | 'INTERVENTION';
    data: any;
  } | null>(null);

  const getActionTarget = (itemId: string): { tab: string; label: string; hint: string } => {
    switch (itemId) {
      case 'CH01':
        return { 
          tab: 'scores', 
          label: t('Lengkapkan Markah', 'Complete Scores'),
          hint: t('Bawa ke modul Kemasukan Markah untuk mengisi skor murid yang belum diisi.', 'Go to score entry grid to fill missing scores.') 
        };
      case 'CH02':
        return { 
          tab: 'scores', 
          label: t('Betulkan Skor', 'Correct Scores'),
          hint: t('Bawa ke modul Kemasukan Markah untuk membetulkan markah di luar julat sah (0-100).', 'Go to score entry grid to correct invalid scores.') 
        };
      case 'CH03':
        return { 
          tab: 'moderation', 
          label: t('Pusat Moderasi KPMP', 'KPMP Moderation'),
          hint: t('Bawa ke Pusat Moderasi KPMP untuk menjana sampel rawak minimum 10% dan membuat moderasi.', 'Go to KPMP Moderation center to sample and moderate.') 
        };
      case 'CH04':
        return { 
          tab: 'moderation', 
          label: t('Selesaikan Teguran', 'Resolve Remarks'),
          hint: t('Bawa ke Semakan & Moderasi untuk menyelesaikan maklum balas dan ulasan pembetulan.', 'Go to Moderation to review correction feedback.') 
        };
      case 'CH05':
        return { 
          tab: 'moderation', 
          label: t('Kelulusan Rasmi Pentadbir', 'Official Approval'),
          hint: t('Bawa ke Semakan & Moderasi untuk kelulusan rasmi Guru Besar / Penyelaras.', 'Go to Moderation to review and give official approval.') 
        };
      case 'CH06':
        return { 
          tab: 'integration', 
          label: t('Perakuan Integriti', 'Integrity Sign-off'),
          hint: t('Semak tetapan dan perakuan integriti manual berkanun SBPPA.', 'Check SBPPA statutory manual upload integrity.') 
        };
      default:
        return { 
          tab: 'dashboard', 
          label: t('Papan Pemuka', 'Dashboard'),
          hint: t('Buka Papan Pemuka.', 'Open Dashboard.') 
        };
    }
  };

  const fetchChecklist = () => {
    if (!activeCycle) return;
    setLoadingChecklist(true);
    fetch(`/api/deliverables/readiness-checklist?cycleId=${activeCycle.id}`)
      .then(res => res.json())
      .then(data => {
        setChecklistData(data);
        setLoadingChecklist(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingChecklist(false);
      });
  };

  useEffect(() => {
    fetchChecklist();
  }, [activeCycle]);

  // Export SBPPA Preparation Package (CSV or XLSX)
  const handleDownloadSBPPA = async (format: 'xlsx' | 'csv') => {
    if (!activeCycle) return;

    if (!checklistData?.isAllReady) {
      if (!confirm(t(
        'AMARAN: Kriteria Kritis Senarai Semak Ketersediaan belum lengkap sepenuhnya. Adakah anda ingin meneruskan muat turun sebagai DRAF AWAL?',
        'WARNING: Critical export readiness criteria are not fully met. Proceed to download as an EARLY DRAFT?'
      ))) {
        return;
      }
    }

    try {
      const res = await fetch('/api/deliverables/sbppa-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle.id,
          format,
          columnMapping,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      if (!res.ok) {
        alert('Gagal menjana fail SBPPA.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pakej_Penyediaan_SBPPA_${activeCycle.academicYear.replace('/', '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    }
  };

  // Open Live Preview for other reports
  const handleOpenPreview = async (type: 'VALIDATION' | 'RECONCILIATION' | 'MODERATION' | 'INTERVENTION') => {
    if (!activeCycle) return;

    let url = '';
    let title = '';

    if (type === 'VALIDATION') {
      url = `/api/deliverables/validation-report?cycleId=${activeCycle.id}`;
      title = t('Laporan Validasi Integriti Data Pentaksiran', 'Data Integrity Validation Report');
    } else if (type === 'RECONCILIATION') {
      url = `/api/deliverables/reconciliation-report?cycleId=${activeCycle.id}`;
      title = t('Laporan Penyesuaian Rekod (Reconciliation)', 'Record Reconciliation Report');
    } else if (type === 'MODERATION') {
      url = `/api/deliverables/moderation-report?cycleId=${activeCycle.id}`;
      title = t('Laporan Moderasi Sampel Rawak KPMP', 'KPMP Random Sample Moderation Report');
    } else if (type === 'INTERVENTION') {
      url = `/api/deliverables/intervention-report?cycleId=${activeCycle.id}`;
      title = t('Laporan Intervensi Murid Memerlukan Bimbingan', 'Student Intervention Report');
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setPreviewModal({
        isOpen: true,
        title,
        type,
        data,
      });
    } catch (err: any) {
      alert('Gagal memuatkan laporan: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-900" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('Pakej Penyediaan & Pelaporan SBPPA KPM', 'MOE SBPPA Preparation & Reporting Package')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                'Penjanaan fail import dan dokumentasi sokongan bagi muat naik/kemasukan manual rasmi ke SBPPA mengikut Pekeliling KPM.',
                'Generation of import files and supporting reports for authorized manual upload/entry into SBPPA.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMappingModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>{t('Konfigurasi Lajur SBPPA', 'Configure SBPPA Columns')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Readiness Checklist (Gatekeeper) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-900" />
              {t('Senarai Semak Ketersediaan Eksport (Export Readiness Checklist)', 'Export Readiness Checklist')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('Semua kriteria kritis mesti lulus sebelum pakej akhir SBPPA disahkan bersedia.', 'All critical criteria must pass before final SBPPA package release.')}
            </p>
          </div>

          <div>
            {checklistData?.isAllReady ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('SEMUA KRITERIA LULUS - SEDIA DIJANAKAN', 'ALL CRITERIA PASSED - READY')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const firstFail = checklistData?.checklist?.find((c: any) => !c.passed);
                  if (firstFail && onNavigate) {
                    const act = getActionTarget(firstFail.id);
                    onNavigate(act.tab);
                  }
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xs group"
                title={t('Klik untuk terus menyelesaikan tindakan tertangguh pertama', 'Click to resolve pending actions')}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>{t('TINDAKAN TERTANGGUH DIKESAN (KLIK UNTUK SELESAIKAN)', 'PENDING ACTIONS (CLICK TO RESOLVE)')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-800 group-hover:translate-x-0.5 transition" />
              </button>
            )}
          </div>
        </div>

        {loadingChecklist ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('Menyemak kelayakan data...', 'Verifying data readiness...')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {checklistData?.checklist.map((item: any) => {
              const action = !item.passed ? getActionTarget(item.id) : null;
              const isClickable = !item.passed && !!action && !!onNavigate;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isClickable && action && onNavigate) {
                      onNavigate(action.tab);
                    }
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                    item.passed 
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950' 
                      : item.severity === 'CRITICAL'
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400 hover:shadow-md hover:scale-[1.01] cursor-pointer ring-1 ring-rose-400/30'
                      : 'bg-amber-50/70 border-amber-300 text-amber-950 hover:bg-amber-100 hover:border-amber-400 hover:shadow-md hover:scale-[1.01] cursor-pointer ring-1 ring-amber-400/30'
                  }`}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  title={isClickable && action ? `${action.hint} — ${t('Klik untuk buka modul', 'Click to open module')} ${action.label}` : undefined}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-2xs">
                        {item.id}
                      </span>
                      {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase bg-rose-600 text-white px-1.5 py-0.2 rounded-full">
                            Perlu Tindakan
                          </span>
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-xs">{item.title}</h4>
                    <p className="text-[11px] opacity-80 mt-1 leading-snug">{item.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 text-[11px] font-semibold flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-slate-800 font-mono text-[11px]">{item.currentValue}</span>
                    {isClickable && action && (
                      <span className="text-[10px] font-extrabold bg-[#7D121D] hover:bg-[#580B12] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition">
                        <span>{action.label}</span>
                        <ArrowRight className="w-3 h-3 text-amber-300" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deliverables Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official SBPPA Import File */}
        <div className="bg-gradient-to-br from-[#580B12] via-[#7D121D] to-[#9B1C2A] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between border border-amber-400/20">
          <div>
            <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>{t('Pakej Fail Import SBPPA', 'SBPPA Import Data File')}</span>
            </div>
            <h3 className="text-lg font-bold">
              {t('Jana Pakej Penyediaan SBPPA (CSV / XLSX)', 'Generate SBPPA Preparation Package (CSV / XLSX)')}
            </h3>
            <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
              {t(
                'Mengandungi senarai skor mentah murid Sekolah Agama Suria, Tahap Penguasaan (TP), kod sekolah XCA4301, dan metadata pengesahan mengikut format lajur yang telah diselaraskan untuk muat naik manual ke SBPPA.',
                'Contains student raw scores for Sekolah Agama Suria, mastery levels, school code XCA4301, and verification metadata.'
              )}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-black/25 border border-amber-300/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-amber-200">{t('Format Eksport:', 'Export Format:')}</span>
                <span className="font-mono font-bold text-white">Excel (.xlsx) / CSV (UTF-8)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200">{t('Status Integriti:', 'Integrity Status:')}</span>
                <span className="font-bold text-emerald-300">{t('Disahkan Peringkat Sekolah (SAS)', 'School Verified (SAS)')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => handleDownloadSBPPA('xlsx')}
              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t('Muat Turun Fail Excel (.xlsx)', 'Download Excel (.xlsx)')}</span>
            </button>
            <button
              onClick={() => handleDownloadSBPPA('csv')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 border border-white/20"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Card 2: Official Reports & Validation Summaries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-blue-900" />
              <span>{t('Dokumentasi & Laporan Pengesahan', 'Documentation & Validation Reports')}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {t('Dokumen Sokongan Pengurusan & Audit Sekolah', 'School Governance & Audit Supporting Reports')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                'Laporan terperinci bagi simpanan fail panitia, pelaporan mesyuarat kurikulum, dan audit JPN/PPD.',
                'Detailed reports for panitia filing, curriculum committee reporting, and JPN/PPD audit.'
              )}
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleOpenPreview('VALIDATION')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs"
              >
                <div className="font-semibold text-slate-800">
                  📋 {t('Laporan Validasi Integriti Data', 'Data Integrity Validation Report')}
                </div>
                <span className="text-blue-700 font-bold">{t('Papar Laporan', 'View')} →</span>
              </button>

              <button
                onClick={() => handleOpenPreview('RECONCILIATION')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs"
              >
                <div className="font-semibold text-slate-800">
                  ⚖️ {t('Laporan Penyesuaian Rekod (Reconciliation)', 'Reconciliation Report')}
                </div>
                <span className="text-blue-700 font-bold">{t('Papar Laporan', 'View')} →</span>
              </button>

              <button
                onClick={() => handleOpenPreview('MODERATION')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs"
              >
                <div className="font-semibold text-slate-800">
                  🔍 {t('Laporan Moderasi Sampel KPMP (≥ 10%)', 'KPMP Moderation Report (≥ 10%)')}
                </div>
                <span className="text-blue-700 font-bold">{t('Papar Laporan', 'View')} →</span>
              </button>

              <button
                onClick={() => handleOpenPreview('INTERVENTION')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs"
              >
                <div className="font-semibold text-slate-800">
                  🎯 {t('Laporan Intervensi Murid (Skor < 40 / TP1-TP2)', 'Student Intervention Report')}
                </div>
                <span className="text-blue-700 font-bold">{t('Papar Laporan', 'View')} →</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('Semua laporan boleh dicetak atau disimpan sebagai PDF.', 'All reports can be printed or saved to PDF.')}</span>
          </div>
        </div>
      </div>

      {/* Configurable Column Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('Konfigurasi Pemetaan Lajur SBPPA', 'SBPPA Column Mapping Configuration')}
                </h3>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {t(
                'Sesuaikan nama pengepala lajur dalam fail eksport mengikut format templat kemasukan SBPPA semasa yang dibekalkan oleh KPM.',
                'Customize export column headers to match the active MOE SBPPA import template specification.'
              )}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {Object.entries(columnMapping).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [key]: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => setColumnMapping(DEFAULT_SBPPA_MAPPING)}
                className="text-xs text-blue-700 hover:underline font-semibold"
              >
                {t('Set Semula ke Asal', 'Reset to Default')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMappingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  {t('Tutup', 'Close')}
                </button>
                <button
                  onClick={() => {
                    alert(t('Tetapan pemetaan lajur telah disimpan!', 'Column mapping settings saved!'));
                    setShowMappingModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-sm"
                >
                  {t('Simpan Konfigurasi', 'Save Configuration')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Report Preview Modal with Print Button */}
      {previewModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{previewModal.title}</h3>
                <p className="text-xs text-slate-500">
                  Sekolah Agama Suria (XCA4301) • PPD Tuaran, Sabah • {activeCycle?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('Cetak / PDF', 'Print / PDF')}</span>
                </button>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="my-4 overflow-y-auto flex-1 text-xs space-y-4 pr-1">
              {/* Validation Report Body */}
              {previewModal.type === 'VALIDATION' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-center">
                    <div>Jumlah Rekod: <span className="text-blue-900">{previewModal.data.totalRecords}</span></div>
                    <div>Sah: <span className="text-emerald-700">{previewModal.data.validCount}</span></div>
                    <div>Kadar Integriti: <span className="text-emerald-700">{previewModal.data.integrityRate}%</span></div>
                  </div>

                  {previewModal.data.errors.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-bold text-rose-700">Senarai Ralat Kritikal:</h4>
                      <table className="w-full text-left border">
                        <thead className="bg-rose-50 text-rose-900">
                          <tr>
                            <th className="p-2">Nama</th>
                            <th className="p-2">Kelas</th>
                            <th className="p-2">Mata Pelajaran</th>
                            <th className="p-2">Ralat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewModal.data.errors.map((e: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 font-medium">{e.studentName}</td>
                              <td className="p-2">{e.className}</td>
                              <td className="p-2">{e.subjectName}</td>
                              <td className="p-2 text-rose-600 font-semibold">{e.errorList.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium">
                      ✓ Tiada ralat integriti ditemui. Semua rekod berada dalam julat dan format sah.
                    </div>
                  )}
                </div>
              )}

              {/* Reconciliation Report Body */}
              {previewModal.type === 'RECONCILIATION' && (
                <div className="space-y-4">
                  <table className="w-full text-left border">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">Kelas</th>
                        <th className="p-2 text-center">Bil. Murid</th>
                        <th className="p-2 text-center">Jangkaan Rekod</th>
                        <th className="p-2 text-center">Diisi</th>
                        <th className="p-2 text-center">Dihantar</th>
                        <th className="p-2 text-center">Diluluskan</th>
                        <th className="p-2 text-center">Tertangguh</th>
                        <th className="p-2 text-right">Kadar Siap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewModal.data.reconciliationRows.map((r: any) => (
                        <tr key={r.classId}>
                          <td className="p-2 font-bold text-slate-900">{r.className}</td>
                          <td className="p-2 text-center">{r.studentCount}</td>
                          <td className="p-2 text-center">{r.expectedRecords}</td>
                          <td className="p-2 text-center">{r.enteredCount}</td>
                          <td className="p-2 text-center">{r.submittedCount}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{r.approvedCount}</td>
                          <td className="p-2 text-center text-amber-700">{r.pendingCount}</td>
                          <td className="p-2 text-right font-bold">{r.completionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Moderation Report Body */}
              {previewModal.type === 'MODERATION' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-semibold">
                    <span>Sampel Dimoderasi: {previewModal.data.sampledCount} rekod</span>
                    <span>Kadar Sampel: {previewModal.data.sampleRate}% (Piawaian KPM ≥ 10%)</span>
                    <span>Status Kuorum: {previewModal.data.meets10PercentRequirement ? '✓ DIPATUHI' : '⚠️ BELUM CUKUP'}</span>
                  </div>

                  <table className="w-full text-left border">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Nama Murid</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2 text-center">Skor Guru</th>
                        <th className="p-2 text-center">Skor KPMP</th>
                        <th className="p-2 text-center">Keputusan</th>
                        <th className="p-2">Moderator</th>
                        <th className="p-2">Ulasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewModal.data.records.map((m: any) => (
                        <tr key={m.id}>
                          <td className="p-2 font-semibold">{m.studentName}</td>
                          <td className="p-2">{m.className}</td>
                          <td className="p-2">{m.subjectName}</td>
                          <td className="p-2 text-center">{m.originalScore}</td>
                          <td className="p-2 text-center font-bold">{m.moderatedScore}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{m.decision}</td>
                          <td className="p-2">{m.moderatorName}</td>
                          <td className="p-2 text-slate-600 italic">{m.comments || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Intervention Report Body */}
              {previewModal.type === 'INTERVENTION' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl font-bold flex justify-between">
                    <span>Jumlah Murid Memerlukan Intervensi: {previewModal.data.interventionCount}</span>
                    <span>Kadar Murid Berisiko: {previewModal.data.interventionRate}%</span>
                  </div>

                  <table className="w-full text-left border">
                    <thead className="bg-rose-100/60 font-bold text-rose-950">
                      <tr>
                        <th className="p-2">Nama Murid</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2 text-center">Skor</th>
                        <th className="p-2 text-center">Tahap TP</th>
                        <th className="p-2">Cadangan Intervensi Berfokus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewModal.data.students.map((st: any, i: number) => (
                        <tr key={i} className="hover:bg-rose-50/20">
                          <td className="p-2 font-semibold text-slate-900">{st.studentName}</td>
                          <td className="p-2">{st.className}</td>
                          <td className="p-2 font-medium">{st.subjectName}</td>
                          <td className="p-2 text-center font-bold text-rose-600">{st.rawScore}</td>
                          <td className="p-2 text-center font-bold">{st.masteryLabel}</td>
                          <td className="p-2 text-slate-700">{st.suggestedIntervention}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-xl"
              >
                {t('Tutup', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
