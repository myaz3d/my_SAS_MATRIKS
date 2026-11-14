import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shuffle, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Unlock,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ModerationView: React.FC = () => {
  const { currentUser, activeCycle, t, triggerReloadStats } = useApp();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sampleRate, setSampleRate] = useState<number>(10);
  const [unlockModal, setUnlockModal] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>('');

  // Moderation action modal
  const [moderationAction, setModerationAction] = useState<{
    isOpen: boolean;
    record: any;
    decision: 'APPROVED' | 'NEEDS_CORRECTION' | 'REJECTED';
    comments: string;
    moderatedScore: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/roster/classes')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setClasses(data);
          setSelectedClassId(data[0].id);
        }
      });

    fetch('/api/roster/subjects')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setSubjects(data);
          setSelectedSubjectId(data[0].id);
        }
      });
  }, []);

  const fetchRecords = () => {
    if (!activeCycle || !selectedClassId || !selectedSubjectId) return;
    setLoading(true);

    fetch(`/api/scores?cycleId=${activeCycle.id}&classId=${selectedClassId}&subjectId=${selectedSubjectId}`)
      .then(res => res.json())
      .then(data => {
        setRecords(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching records:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecords();
  }, [activeCycle, selectedClassId, selectedSubjectId]);

  // Generate random sample >= 10%
  const handleGenerateSample = async () => {
    if (!activeCycle || !selectedClassId || !selectedSubjectId) return;

    try {
      const res = await fetch('/api/scores/sample-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          samplePercentage: Math.max(10, sampleRate),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat menjana sampel.');
      } else {
        alert(t(
          `Sampel rawak berjaya dijana: ${data.sampledCount} daripada ${data.totalRecords} murid (${data.sampledPercentage}%) dipilih untuk moderasi KPMP.`,
          `Random sample generated: ${data.sampledCount} of ${data.totalRecords} students (${data.sampledPercentage}%) selected for KPMP moderation.`
        ));
        triggerReloadStats();
        fetchRecords();
      }
    } catch (err: any) {
      alert('Ralat rangkaian: ' + err.message);
    }
  };

  // Submit moderation decision
  const handleSubmitModeration = async () => {
    if (!moderationAction) return;

    if (
      (moderationAction.decision === 'NEEDS_CORRECTION' || moderationAction.decision === 'REJECTED') &&
      !moderationAction.comments.trim()
    ) {
      alert(t('Ulasan wajib diisi bagi rekod yang memerlukan pembetulan atau ditolak.', 'Remarks are mandatory for records needing correction or rejection.'));
      return;
    }

    try {
      const res = await fetch('/api/scores/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreRecordId: moderationAction.record.id,
          decision: moderationAction.decision,
          comments: moderationAction.comments,
          moderatedScore: moderationAction.moderatedScore,
          moderatorId: currentUser.id,
          moderatorName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat menyimpan moderasi.');
      } else {
        setModerationAction(null);
        triggerReloadStats();
        fetchRecords();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    }
  };

  // Unlock records
  const handleUnlockBatch = async () => {
    if (!unlockReason.trim()) {
      alert('Sila nyatakan justifikasi buka kunci.');
      return;
    }

    try {
      const res = await fetch('/api/scores/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle?.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          reason: unlockReason,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal buka kunci.');
      } else {
        alert('Rekod berjaya dibuka kunci dan dikembalikan ke status Draf.');
        setUnlockModal(false);
        setUnlockReason('');
        triggerReloadStats();
        fetchRecords();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    }
  };

  // Approve all moderated records (Coordinator / Admin / Leader)
  const handleApproveBatch = async () => {
    if (!confirm(t(
      'Adakah anda pasti untuk meluluskan semua rekod skor bagi kelas dan mata pelajaran ini?',
      'Are you sure you want to approve all score records for this class and subject?'
    ))) return;

    try {
      const res = await fetch('/api/scores/workflow-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle?.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          targetStatus: 'APPROVED',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          comments: 'Kelulusan rasmi pentadbir sekolah selepas semakan moderasi KPMP.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal meluluskan rekod.');
      } else {
        alert(t('Semua rekod berjaya diluluskan!', 'All records approved successfully!'));
        triggerReloadStats();
        fetchRecords();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    }
  };

  const sampledRecords = records.filter(r => r.isSampled);
  const samplePercentage = records.length > 0 ? ((sampledRecords.length / records.length) * 100).toFixed(1) : '0.0';
  const isQuorumMet = Number(samplePercentage) >= 10.0;
  const isLocked = records.length > 0 && records[0].status === 'LOCKED';
  const isApproved = records.length > 0 && records[0].status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Panitia / Mata Pelajaran', 'Panitia / Subject')}
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-800 focus:outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Pilih Kelas', 'Select Class')}
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-800 focus:outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quorum Pill */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Kuorum Moderasi KPMP (≥ 10%)', 'KPMP Quorum (≥ 10%)')}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isQuorumMet ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {isQuorumMet ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                <span>{samplePercentage}% ({sampledRecords.length} / {records.length} {t('Murid', 'Students')})</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSample}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-amber-600/20"
            >
              <Shuffle className="w-4 h-4" />
              <span>{t('Jana Sampel Rawak (≥10%)', 'Generate Random Sample')}</span>
            </button>

            {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'COORDINATOR' || currentUser.role === 'LEADER') && (
              <button
                onClick={handleApproveBatch}
                className="bg-[#7D121D] hover:bg-[#580B12] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-amber-400/30"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{t('Luluskan Semua Rekod', 'Approve All Records')}</span>
              </button>
            )}

            {isLocked && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'COORDINATOR') && (
              <button
                onClick={() => setUnlockModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>{t('Buka Kunci Rekod', 'Unlock Records')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Sample List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-900" />
            <h3 className="font-bold text-slate-900 text-sm">
              {t('Senarai Sampel Moderasi Ketua Panitia', 'Subject Head Moderation Sample List')}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {t(
              'Ketua Panitia menyemak ketepatan instrumen, evidens, dan konsistensi penskoran.',
              'Subject Head verifies instrument accuracy, evidence, and scoring consistency.'
            )}
          </span>
        </div>

        {sampledRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm space-y-3">
            <p>{t('Tiada sampel rawak dipilih lagi untuk kelas dan mata pelajaran ini.', 'No random sample selected yet for this class and subject.')}</p>
            <button
              onClick={handleGenerateSample}
              className="bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs px-4 py-2 rounded-xl transition inline-flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>{t('Jana Sampel Rawak 10% Sekarang', 'Generate 10% Random Sample Now')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3">{t('Nama Murid', 'Student Name')}</th>
                  <th className="py-3 px-3">{t('No. MyKid', 'MyKid No.')}</th>
                  <th className="py-3 px-3 text-center">{t('Skor Guru Asal', 'Original Score')}</th>
                  <th className="py-3 px-3 text-center">{t('Skor Moderasi', 'Moderated Score')}</th>
                  <th className="py-3 px-3 text-center">{t('Tahap TP', 'TP Level')}</th>
                  <th className="py-3 px-3 text-center">{t('Keputusan Moderasi', 'Decision')}</th>
                  <th className="py-3 px-3">{t('Ulasan / Maklum Balas KPMP', 'KPMP Remarks / Feedback')}</th>
                  <th className="py-3 px-3 text-center">{t('Tindakan', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {sampledRecords.map((item, idx) => {
                  const mod = item.moderation;

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.studentName}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.studentMykid}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{item.rawScore ?? '-'}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-900">
                        {item.rawScore ?? '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                          {item.masteryLevel ? `TP${item.masteryLevel}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {mod?.decision === 'APPROVED' ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ✓ {t('Diluluskan', 'Approved')}
                          </span>
                        ) : mod?.decision === 'NEEDS_CORRECTION' ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ⚠ {t('Perlu Pembetulan', 'Needs Correction')}
                          </span>
                        ) : mod?.decision === 'REJECTED' ? (
                          <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ✕ {t('Ditolak', 'Rejected')}
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {t('Belum Dimoderasi', 'Pending')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 italic max-w-xs truncate">
                        {mod?.comments || item.correctionReason || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setModerationAction({
                            isOpen: true,
                            record: item,
                            decision: mod?.decision || 'APPROVED',
                            comments: mod?.comments || '',
                            moderatedScore: item.rawScore ?? 0,
                          })}
                          className="text-xs bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-semibold px-2.5 py-1 rounded-lg transition"
                        >
                          {t('Semak', 'Review')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Moderation Review Action Modal */}
      {moderationAction?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('Semakan Moderasi Sampel KPMP', 'KPMP Moderation Review')}
              </h3>
            </div>

            <div className="my-4 text-xs space-y-1">
              <div><span className="text-slate-500">{t('Nama Murid:', 'Student Name:')}</span> <strong className="text-slate-900">{moderationAction.record.studentName}</strong></div>
              <div><span className="text-slate-500">{t('Skor Asal Guru:', 'Original Score:')}</span> <strong className="text-blue-900">{moderationAction.record.rawScore}</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Keputusan Moderasi', 'Moderation Decision')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModerationAction({ ...moderationAction, decision: 'APPROVED' })}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                      moderationAction.decision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    ✓ {t('Diluluskan', 'Approved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModerationAction({ ...moderationAction, decision: 'NEEDS_CORRECTION' })}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                      moderationAction.decision === 'NEEDS_CORRECTION'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    ⚠ {t('Pembetulan', 'Correction')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModerationAction({ ...moderationAction, decision: 'REJECTED' })}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                      moderationAction.decision === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    ✕ {t('Tolak', 'Reject')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Skor Diselaraskan (Jika ada pindaan)', 'Adjusted Score (If applicable)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={moderationAction.moderatedScore}
                  onChange={(e) => setModerationAction({ ...moderationAction, moderatedScore: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Ulasan / Sebab Penolakan (Wajib jika bukan Lulus)', 'Comments / Reason (Mandatory if not Approved)')}
                </label>
                <textarea
                  rows={3}
                  value={moderationAction.comments}
                  onChange={(e) => setModerationAction({ ...moderationAction, comments: e.target.value })}
                  placeholder={t('Contoh: Evidens instrumen bagi konstruk membaca telah disahkan lengkap.', 'e.g., Reading construct evidence verified.')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModerationAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={handleSubmitModeration}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white transition shadow-sm"
              >
                {t('Simpan Keputusan Moderasi', 'Save Moderation Decision')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Request Modal */}
      {unlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-purple-900">
              <Unlock className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('Permohonan Buka Kunci Rekod Pentaksiran', 'Assessment Record Unlock Request')}
              </h3>
            </div>

            <p className="text-xs text-slate-600 my-3">
              {t(
                'Rekod telah dikunci secara rasmi. Membuka kunci rekod memerlukan justifikasi bertulis dan akan dicatat secara kekal dalam Log Audit.',
                'Records are officially locked. Unlocking requires written justification and will be permanently logged in the Audit Trail.'
              )}
            </p>

            <textarea
              rows={3}
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder={t('Contoh: Rayuan semakan semula skor murid oleh guru mata pelajaran berserta bukti evidens tambahan.', 'e.g. Teacher score review appeal with supplemental evidence.')}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-900 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setUnlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={handleUnlockBatch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm"
              >
                {t('Luluskan Buka Kunci', 'Approve Unlock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
