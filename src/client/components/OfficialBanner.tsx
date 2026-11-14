import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X, FileText, CheckCircle, Info, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfficialBanner: React.FC = () => {
  const { t } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      {/* Top Bar with Clickable Button */}
      <div className="bg-amber-500/10 border-b border-amber-300/80 text-amber-950 px-4 py-1.5 text-xs transition">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Main Action Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 font-bold hover:text-[#7D121D] transition cursor-pointer group text-left"
            title={t('Klik untuk buka Peringatan Integriti & Pematuhan SBPPA KPM', 'Click to view KPM SBPPA Integrity & Compliance Notice')}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-200 group-hover:bg-amber-300 text-amber-900 shrink-0 transition">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
            </span>
            <span className="font-extrabold text-amber-950 group-hover:text-[#7D121D] tracking-wide uppercase transition text-[11px] sm:text-xs">
              {t('PERINGATAN INTEGRITI & PEMATUHAN SBPPA KPM', 'KPM SBPPA INTEGRITY & COMPLIANCE NOTICE')}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-200/70 group-hover:bg-amber-300/80 px-2 py-0.5 rounded-full border border-amber-300 transition">
              <Info className="w-3 h-3 text-amber-700" />
              {t('Klik untuk baca peringatan', 'Click to read notice')}
            </span>
          </button>

          {/* Right Status Badge (also clickable) */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 text-[11px] bg-amber-200/80 hover:bg-amber-300 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md font-bold shrink-0 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden md:inline">{t('Penyediaan Manual Berkanun', 'Statutory Manual Prep')}</span>
            <span className="md:hidden">Pematuhan</span>
          </button>
        </div>
      </div>

      {/* Pop-up Modal (Dialog Peringatan Rasmi) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl max-w-xl w-full border border-amber-300 shadow-2xl overflow-hidden relative"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#580B12] via-[#7D121D] to-[#9B1C2A] text-white p-5 flex items-start justify-between gap-3 border-b border-amber-400/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <AlertTriangle className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/30 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Garis Panduan Pentaksiran KPM
                  </span>
                  <h3 className="text-base sm:text-lg font-black mt-1 tracking-tight text-white leading-snug">
                    PERINGATAN INTEGRITI &amp; PEMATUHAN SBPPA KPM
                  </h3>
                  <p className="text-xs text-amber-100/90 mt-0.5">
                    Sekolah Agama Suria, Tuaran (XCA4301) • PPD Tuaran, Sabah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg p-1.5 transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Highlighted Official Statement Box */}
              <div className="p-4 bg-amber-50 rounded-xl border-l-4 border-l-amber-500 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-amber-700" />
                  Kenyataan Pematuhan Rasmi:
                </div>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  &ldquo;{t(
                    'Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM. Sistem ini merupakan alat sokongan pengurusan dalaman sekolah dan TIDAK menggantikan SBPPA atau menghantar markah secara terus ke KPM/JPN/PPD tanpa integrasi berkanun.',
                    'Official Matriks Pembelajaran records must be updated and verified through SBPPA in accordance with official MOE procedures. This internal school application does NOT replace SBPPA or submit marks directly to MOE/JPN/PPD without statutory integration.'
                  )}&rdquo;
                </p>
              </div>

              {/* Principle Checklist */}
              <div className="space-y-2.5 pt-1">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Prinsip Operasi &amp; Kawalan Integriti Sekolah:
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">1. Alat Sokongan Pengurusan Dalaman Sekolah</strong>
                      <span className="text-slate-600">
                        Aplikasi ini direka khusus untuk mengurus rekod markah mentah, semakan format oleh Penyelaras, dan kuorum moderasi 10% Ketua Panitia (KPMP) sebelum data dimuktamadkan.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">2. Tiada Integrasi Terus Tanpa Kelulusan Berkanun</strong>
                      <span className="text-slate-600">
                        Sistem tidak pernah memintas kawalan keselamatan, mereka-reka endpoint API, atau menghantar markah secara terus ke pangkalan data KPM tanpa surat kuasa rasmi dan spesifikasi API berkanun.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-[#7D121D] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">3. Status Pakej SBPPA: Penyediaan Manual Berkanun</strong>
                      <span className="text-slate-600">
                        Fail XLSX/CSV yang dijana ditandakan sebagai &ldquo;Pakej Penyediaan SBPPA &mdash; untuk kemasukan/muat naik manual yang diberi kuasa&rdquo;, lengkap dengan laporan penyesuaian dan senarai semak integriti.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sekolah Agama Suria • XCA4301
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-[#7D121D] hover:bg-[#580B12] text-white font-extrabold text-xs sm:text-sm px-5 py-2 rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <span>{t('Saya Faham & Tutup', 'I Understand & Close')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
