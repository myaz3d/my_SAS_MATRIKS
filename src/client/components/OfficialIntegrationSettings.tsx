import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  FileCheck, 
  KeyRound, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OfficialIntegrationSettings: React.FC = () => {
  const { currentUser, t } = useApp();

  // 4 Strict Criteria Checkboxes
  const [hasWrittenAuth, setHasWrittenAuth] = useState<boolean>(false);
  const [hasApiDoc, setHasApiDoc] = useState<boolean>(false);
  const [hasSandboxKeys, setHasSandboxKeys] = useState<boolean>(false);
  const [hasAdminApproval, setHasAdminApproval] = useState<boolean>(false);

  const [endpointUrl, setEndpointUrl] = useState<string>('https://sbppa-api.moe.gov.my/v1/mock-disabled');
  const [apiToken, setApiToken] = useState<string>('sbppa_sec_token_••••••••••••••••');
  const [saving, setSaving] = useState<boolean>(false);
  const [integrationStatus, setIntegrationStatus] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/system/settings')
      .then(res => res.json())
      .then(data => {
        setIntegrationStatus(data.SBPPA_OFFICIAL_INTEGRATION_ENABLED === 'true');
        if (data.SBPPA_ENDPOINT_URL) setEndpointUrl(data.SBPPA_ENDPOINT_URL);
      });
  }, []);

  const handleSaveIntegration = async () => {
    if (currentUser.role !== 'SUPER_ADMIN') {
      alert(t('Hanya Guru Besar / Pentadbir Sekolah dibenarkan mengkonfigurasi integrasi rasmi SBPPA.', 'Only the School Administrator can configure official SBPPA integration.'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/system/settings/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasWrittenAuthorization: hasWrittenAuth,
          hasApprovedApiDoc: hasApiDoc,
          hasSandboxCredentials: hasSandboxKeys,
          hasAdminApproval: hasAdminApproval,
          endpointUrl,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      setIntegrationStatus(data.enabled);
      alert(data.message);
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Prominent Safety & Statutory Warning Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-amber-950">
              {t('DASAR KESELAMATAN & INTEGRITI INTEGRASI RASMI SBPPA KPM (SAS)', 'MOE SBPPA INTEGRATION SECURITY & POLICY (SAS)')}
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed">
              {t(
                'Aplikasi my_SAS_MATRIKS adalah alat sokongan pengurusan pentaksiran dalaman Sekolah Agama Suria (XCA4301). Penghantaran data secara terus melalui API ke sistem KPM/JPN/PPD adalah DINYAHAKTIFKAN secara lalai dan dilarang sama sekali kecuali dengan kebenaran bertulis rasmi, spesifikasi teknikal diluluskan, dan pengesahan sah Guru Besar. Buat masa ini, semua pelaporan rasmi mesti dilakukan melalui muat naik atau kemasukan manual ke portal rasmi SBPPA mengikut Pekeliling Ikhtisas KPM.',
                'my_SAS_MATRIKS is an internal school assessment tool for Sekolah Agama Suria (XCA4301). Direct API transmission to MOE/JPN/PPD is DISABLED by default.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Integration Control Center */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {t('Tetapan Sambungan Terus SBPPA (API)', 'SBPPA Direct API Connection Settings')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('Modul ini dikunci sehingga semua pra-syarat keselamatan dipenuhi.', 'This module remains locked until all safety prerequisites are fulfilled.')}
            </p>
          </div>

          <div>
            {integrationStatus ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('INTEGRASI DIAKTIFKAN', 'INTEGRATION ACTIVE')}
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                {t('DINYAHAKTIFKAN (LALAI SELAMAT)', 'DISABLED (SECURE DEFAULT)')}
              </span>
            )}
          </div>
        </div>

        {/* 4 Strict Verification Criteria */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('4 Pra-Syarat Wajib Pengaktifan Integrasi Berkanun:', '4 Mandatory Statutory Activation Prerequisites:')}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
              hasWrittenAuth ? 'bg-blue-50/50 border-blue-400 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={hasWrittenAuth}
                onChange={(e) => setHasWrittenAuth(e.target.checked)}
                className="mt-0.5 rounded text-blue-900"
              />
              <span className="font-medium">
                <strong>1. Surat Kuasa Bertulis Rasmi:</strong> Sekolah mempunyai surat kebenaran rasmi integrasi sistem daripada KPM/JPN/PPD.
              </span>
            </label>

            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
              hasApiDoc ? 'bg-blue-50/50 border-blue-400 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={hasApiDoc}
                onChange={(e) => setHasApiDoc(e.target.checked)}
                className="mt-0.5 rounded text-blue-900"
              />
              <span className="font-medium">
                <strong>2. Dokumentasi API Rasmi SBPPA:</strong> Spesifikasi teknikal rasmi dan piawaian pemindahan fail selamat yang disahkan BPM KPM.
              </span>
            </label>

            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
              hasSandboxKeys ? 'bg-blue-50/50 border-blue-400 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={hasSandboxKeys}
                onChange={(e) => setHasSandboxKeys(e.target.checked)}
                className="mt-0.5 rounded text-blue-900"
              />
              <span className="font-medium">
                <strong>3. Kredensial Ujian Sandbox:</strong> Kunci pengesahan ujian berasingan yang telah diuji dalam persekitaran simulasi KPM.
              </span>
            </label>

            <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
              hasAdminApproval ? 'bg-blue-50/50 border-blue-400 text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <input
                type="checkbox"
                checked={hasAdminApproval}
                onChange={(e) => setHasAdminApproval(e.target.checked)}
                className="mt-0.5 rounded text-blue-900"
              />
              <span className="font-medium">
                <strong>4. Perakuan Sah Guru Besar:</strong> Kelulusan bertulis pentadbir tertinggi sekolah direkodkan secara rasmi.
              </span>
            </label>
          </div>
        </div>

        {/* Mock API Credentials (Secure Masking) */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                SBPPA API Endpoint URL
              </label>
              <input
                type="text"
                disabled={!hasWrittenAuth || !hasAdminApproval}
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Token Kredensial Selamat (Encrypted / Tokenized)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  disabled={!hasWrittenAuth || !hasAdminApproval}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('Kredensial disulitkan dan tidak disimpan dalam bentuk teks biasa.', 'Credentials are encrypted and never stored in plaintext.')}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {t('Perubahan status integrasi dicatat secara kekal dalam Log Audit.', 'Integration status changes are permanently logged.')}
          </span>
          <button
            onClick={handleSaveIntegration}
            disabled={saving}
            className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {saving ? t('Menyimpan...', 'Saving...') : t('Kemas Kini Konfigurasi Integrasi', 'Update Integration Settings')}
          </button>
        </div>
      </div>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-900" />
          <h3 className="font-bold text-slate-900 text-base">
            {t('Sandaran & Pemulihan Pangkalan Data (Backup & Restore)', 'Database Backup & Disaster Recovery')}
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t(
            'Bagi memastikan pematuhan integriti rekod sekolah dan kesinambungan pentaksiran, salinan sandaran lengkap pangkalan data mengandungi rekod murid, skor mentah, sejarah moderasi, dan log audit boleh dimuat turun sebagai arkib JSON yang disahkan.',
            'To ensure school record integrity and assessment continuity, complete database backups containing student rosters, raw scores, moderation histories, and audit logs can be exported as authenticated JSON archives.'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="/api/system/backup"
            download
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{t('Muat Turun Sandaran Penuh (.json)', 'Download Full System Backup (.json)')}</span>
          </a>

          <span className="text-xs text-slate-400">
            {t('Arkib sandaran mengandungi tandatangan masa dan integriti data sekolah.', 'Backup archive includes timestamp and integrity signatures.')}
          </span>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800">
          {t('Notis Privasi & Pematuhan Akta Perlindungan Data Peribadi (PDPA)', 'Privacy Notice & PDPA Assessment Compliance')}
        </h4>
        <p className="leading-relaxed">
          {t(
            'Data peribadi murid dan skor pentaksiran yang diproses dalam aplikasi ini digunakan secara eksklusif bagi tujuan pentadbiran pentaksiran bilik darjah dan penyediaan laporan rasmi SBPPA mengikut Akta Pendidikan 1996 dan garis panduan KPM. Akses data dihadkan mengikut peranan pengguna yang dilantik secara rasmi oleh pihak sekolah.',
            'Student personal data and assessment scores processed in this application are used exclusively for school assessment administration and SBPPA official reporting under the Education Act 1996 and MOE guidelines. Access is strictly role-restricted to officially authorized school personnel.'
          )}
        </p>
      </div>
    </div>
  );
};
