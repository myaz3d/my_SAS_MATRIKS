import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  ShieldCheck, 
  FileText,
  User,
  Clock,
  Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuditLogView: React.FC = () => {
  const { t } = useApp();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    const q = actionFilter === 'ALL' ? '' : `?action=${actionFilter}`;
    fetch(`/api/audit-logs${q}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const actionLabels: Record<string, string> = {
    SCORE_BATCH_SAVE: 'Kemaskini Skor Draf',
    SCORE_SUBMIT: 'Penyerahan Skor Guru',
    SCORE_MODERATE: 'Moderasi Sampel KPMP',
    SCORE_SAMPLE_GENERATED: 'Janaan Sampel Rawak 10%',
    SCORE_UNLOCK_APPROVED: 'Kelulusan Buka Kunci',
    ROSTER_IMPORT: 'Import Roster Murid',
    EXPORT_SBPPA_PACKAGE: 'Eksport Pakej SBPPA',
    USER_LOGIN: 'Log Masuk Pengguna',
    SYSTEM_INIT: 'Konfigurasi Sistem',
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('Jejak Audit Kekal & Pematuhan Integriti', 'Immutable Audit Trail & Integrity Compliance')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                'Rekod tidak boleh dipadam bagi setiap tindakan memasukkan markah, semakan, moderasi, dan eksport.',
                'Tamper-evident logs of every mark entry, verification, moderation, and export action.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/audit-logs/export"
              download
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t('Eksport Log Audit (CSV)', 'Export Audit Log (CSV)')}</span>
            </a>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{t('Tapis Tindakan:', 'Filter Action:')}</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">{t('Semua Tindakan', 'All Actions')}</option>
            <option value="SCORE_BATCH_SAVE">Kemasukan Skor Draf</option>
            <option value="SCORE_SUBMIT">Penyerahan Skor</option>
            <option value="SCORE_MODERATE">Moderasi KPMP</option>
            <option value="ROSTER_IMPORT">Import Roster</option>
            <option value="EXPORT_SBPPA_PACKAGE">Eksport Pakej SBPPA</option>
            <option value="SCORE_UNLOCK_APPROVED">Buka Kunci Rekod</option>
            <option value="USER_LOGIN">Log Masuk</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {t('Memuatkan log audit...', 'Loading audit records...')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-40">{t('Tarikh & Masa', 'Timestamp')}</th>
                  <th className="py-3 px-3 w-48">{t('Pengguna & Peranan', 'User & Role')}</th>
                  <th className="py-3 px-3 w-44">{t('Tindakan', 'Action')}</th>
                  <th className="py-3 px-3 w-28">{t('Entiti', 'Entity')}</th>
                  <th className="py-3 px-3">{t('Butiran Perubahan', 'Details')}</th>
                  <th className="py-3 px-3 w-28 text-center">{t('Alamat IP', 'IP Address')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-blue-900">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-md">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-left hover:text-blue-900 font-mono text-[11px] truncate block max-w-xs sm:max-w-md hover:underline"
                      >
                        {log.details}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">{t('Butiran Penuh Log Audit', 'Full Audit Log Details')}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div><span className="text-slate-500">ID Log:</span> <span className="font-mono">{selectedLog.id}</span></div>
              <div><span className="text-slate-500">Masa:</span> <strong>{new Date(selectedLog.createdAt).toUTCString()}</strong></div>
              <div><span className="text-slate-500">Pengguna:</span> <strong>{selectedLog.userName} ({selectedLog.userRole})</strong></div>
              <div><span className="text-slate-500">Tindakan:</span> <strong className="text-blue-900">{selectedLog.action}</strong></div>

              <div className="mt-3">
                <span className="text-slate-500 block mb-1">Payload JSON:</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                  {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold"
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
