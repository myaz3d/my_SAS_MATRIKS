import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Send, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  HelpCircle,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScoreItem } from '../../shared/types';
import { validateScore, calculateMasteryLevel, getMasteryLabel } from '../../shared/validation';

export const ScoreEntryGrid: React.FC = () => {
  const { currentUser, activeCycle, t, maskPII, triggerReloadStats } = useApp();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [items, setItems] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('idle'); // idle, saving, saved, error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History modal state
  const [historyItem, setHistoryItem] = useState<ScoreItem | null>(null);

  // Correction justification modal
  const [justificationModal, setJustificationModal] = useState<{
    isOpen: boolean;
    reason: string;
    targetItems?: any[];
  }>({ isOpen: false, reason: '' });

  // Refs for keyboard navigation
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load classes & subjects
  useEffect(() => {
    fetch('/api/roster/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          setSelectedClassId(data[0].id);
        }
      });

    fetch('/api/roster/subjects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSubjects(data);
          setSelectedSubjectId(data[0].id);
        }
      });
  }, []);

  // Fetch scores when class/subject/cycle changes
  const fetchScores = () => {
    if (!activeCycle || !selectedClassId || !selectedSubjectId) return;
    setLoading(true);
    setErrorMessage(null);

    const query = new URLSearchParams({
      cycleId: activeCycle.id,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      teacherId: currentUser.id,
      userRole: currentUser.role,
    });

    fetch(`/api/scores?${query.toString()}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'Gagal memuatkan rekod skor.');
          setItems([]);
        } else {
          setItems(data.items || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading scores:', err);
        setErrorMessage('Ralat rangkaian semasa memuatkan skor.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScores();
  }, [activeCycle, selectedClassId, selectedSubjectId, currentUser]);

  // Handle score change in input
  const handleScoreChange = (index: number, val: string) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (val === '') {
      item.rawScore = null;
      item.masteryLevel = null;
      item.validationErrors = [];
      item.validationWarnings = ['Skor mentah belum diisi'];
    } else {
      const num = Number(val);
      item.rawScore = isNaN(num) ? null : num;
      const validation = validateScore(num);
      item.masteryLevel = validation.computedTP;
      item.validationErrors = validation.errors;
      item.validationWarnings = validation.warnings;
    }

    updated[index] = item;
    setItems(updated);
    setSaveStatus('unsaved');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (index < items.length - 1) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
    }
  };

  // Save scores batch
  const handleSaveDraft = async (reasonOverride?: string) => {
    if (!activeCycle || !selectedClassId || !selectedSubjectId) return;
    setSaveStatus('saving');
    setErrorMessage(null);

    // Check if any record is already submitted or approved
    const isSubmittedOrApproved = items.some(i => ['SUBMITTED', 'VALIDATED', 'MODERATED', 'APPROVED', 'EXPORT_READY'].includes(i.status));
    if (isSubmittedOrApproved && !reasonOverride) {
      setJustificationModal({
        isOpen: true,
        reason: '',
        targetItems: items,
      });
      setSaveStatus('idle');
      return;
    }

    try {
      const payload = {
        cycleId: activeCycle.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        correctionReason: reasonOverride || null,
        items: items.map(i => ({
          studentId: i.studentId,
          rawScore: i.rawScore,
        })),
      };

      const res = await fetch('/api/scores/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresReason) {
          setJustificationModal({
            isOpen: true,
            reason: '',
            targetItems: items,
          });
        } else {
          setErrorMessage(data.error);
        }
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        triggerReloadStats();
        fetchScores();
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ralat menyimpan skor.');
      setSaveStatus('error');
    }
  };

  // Submit batch to coordinator
  const handleSubmitBatch = async () => {
    if (!activeCycle || !selectedClassId || !selectedSubjectId) return;

    // Check for empty scores
    const emptyCount = items.filter(i => i.rawScore === null).length;
    if (emptyCount > 0) {
      alert(`Terdapat ${emptyCount} murid yang belum mempunyai skor mentah. Sila isi semua markah sebelum membuat penyerahan.`);
      return;
    }

    // Check for invalid values
    const invalidCount = items.filter(i => i.validationErrors && i.validationErrors.length > 0).length;
    if (invalidCount > 0) {
      alert(`Terdapat ${invalidCount} skor di luar julat sah (0 - 100). Sila betulkan sebelum menghantar.`);
      return;
    }

    if (!confirm(t(
      'Adakah anda pasti untuk menghantar markah kelas ini kepada Penyelaras MP? Selepas penghantaran, sebarang pembetulan memerlukan justifikasi rasmi.',
      'Are you sure you want to submit this batch to the MP Coordinator? Subsequent edits will require formal justification.'
    ))) {
      return;
    }

    try {
      const res = await fetch('/api/scores/workflow-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: activeCycle.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          targetStatus: 'SUBMITTED',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          comments: 'Penyerahan markah mentah lengkap oleh guru mata pelajaran.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghantar markah.');
      } else {
        alert(t('Markah berjaya dihantar untuk semakan Penyelaras MP!', 'Scores submitted successfully for Coordinator verification!'));
        triggerReloadStats();
        fetchScores();
      }
    } catch (err: any) {
      alert('Ralat rangkaian: ' + err.message);
    }
  };

  // Masking helper
  const maskMyKid = (mykid: string) => {
    if (!maskPII) return mykid;
    // 160105-14-1001 -> 160105-**-**01
    const parts = mykid.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-**-**${parts[2].slice(-2)}`;
    }
    return mykid.slice(0, 6) + '******' + mykid.slice(-2);
  };

  const currentBatchStatus = items.length > 0 ? items[0].status : 'DRAFT';
  const isLocked = currentBatchStatus === 'LOCKED';
  const isApproved = ['APPROVED', 'EXPORT_READY'].includes(currentBatchStatus);

  return (
    <div className="space-y-5">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Pilih Kelas', 'Select Class')}
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-800 focus:outline-none cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c._count?.students || 0} {t('Murid', 'Students')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Pilih Mata Pelajaran', 'Select Subject')}
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-800 focus:outline-none cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Batch Status Badge */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('Status Aliran Kerja', 'Workflow Status')}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isLocked ? 'bg-purple-100 text-purple-900 border-purple-200' :
                isApproved ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
                currentBatchStatus === 'SUBMITTED' ? 'bg-sky-100 text-sky-900 border-sky-200' :
                currentBatchStatus === 'VALIDATED' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                currentBatchStatus === 'MODERATED' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {isLocked && <Lock className="w-3.5 h-3.5" />}
                {isApproved && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                {currentBatchStatus}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md font-medium">
                {t('Perubahan belum disimpan', 'Unsaved changes')}
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md font-medium animate-pulse">
                {t('Menyimpan...', 'Saving...')}
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-medium">
                {t('✓ Disimpan dalam draf', '✓ Saved')}
              </span>
            )}

            <button
              onClick={() => handleSaveDraft()}
              disabled={isLocked}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{t('Simpan Draf', 'Save Draft')}</span>
            </button>

            {currentBatchStatus === 'DRAFT' && (
              <button
                onClick={handleSubmitBatch}
                className="bg-[#7D121D] hover:bg-[#580B12] text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-amber-400/40"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>{t('Hantar Markah', 'Submit Scores')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error / Role Warning Banner */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800">
              {t('Grid Hamparan Skor Mentah (Kemasukan Pantas)', 'Raw Score Spreadsheet Grid')}
            </span>
            <span className="text-slate-400">•</span>
            <span>{items.length} {t('murid disenaraikan', 'students listed')}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="hidden sm:inline">💡 {t('Gunakan anak panah Atas/Bawah atau Enter untuk navigasi pantas.', 'Use Up/Down arrows or Enter for fast navigation.')}</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">TP6: 85-100</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">TP4: 55-69</span>
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-medium">Intervensi: &lt;40</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            {t('Memuatkan senarai murid dan markah...', 'Loading student roster and scores...')}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {t('Tiada rekod murid dijumpai untuk kelas ini.', 'No students found for this class.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 w-32">{t('No. Pendaftaran', 'Student ID')}</th>
                  <th className="py-3 px-3 w-36">{t('No. MyKid', 'MyKid No.')}</th>
                  <th className="py-3 px-3 min-w-[200px]">{t('Nama Penuh Murid', 'Full Name')}</th>
                  <th className="py-3 px-3 text-center w-16">{t('Jantina', 'Gender')}</th>
                  <th className="py-3 px-3 text-center w-36">{t('Skor Mentah (0-100)', 'Raw Score (0-100)')}</th>
                  <th className="py-3 px-3 text-center w-28">{t('Tahap Penguasaan', 'Mastery Level')}</th>
                  <th className="py-3 px-3 text-center w-28">{t('Status Rekod', 'Status')}</th>
                  <th className="py-3 px-3 text-center w-24">{t('Sampel KPMP', 'KPMP Sample')}</th>
                  <th className="py-3 px-3 text-center w-20">{t('Audit', 'Audit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-normal">
                {items.map((item, idx) => {
                  const hasError = item.validationErrors && item.validationErrors.length > 0;
                  const needsIntervention = item.rawScore !== null && (item.rawScore < 40 || (item.masteryLevel !== null && item.masteryLevel < 3));

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 transition ${
                        item.isSampled ? 'bg-amber-50/30' : ''
                      } ${needsIntervention ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                        {item.studentRegNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {maskMyKid(item.studentMykid)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.studentName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {item.gender}
                        </span>
                      </td>

                      {/* Raw Score Input Cell */}
                      <td className="py-2 px-3 text-center">
                        <div className="relative inline-block w-28">
                          <input
                            ref={el => { inputRefs.current[idx] = el; }}
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            disabled={isLocked}
                            value={item.rawScore !== null && item.rawScore !== undefined ? item.rawScore : ''}
                            onChange={(e) => handleScoreChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className={`w-full text-center font-bold text-sm py-1.5 px-2 rounded-lg border focus:ring-2 focus:outline-none transition ${
                              hasError 
                                ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-400' 
                                : needsIntervention
                                ? 'border-amber-400 bg-amber-50 text-amber-950 focus:ring-amber-400'
                                : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-800'
                            }`}
                            placeholder="0 - 100"
                          />
                          {hasError && (
                            <span 
                              title={item.validationErrors?.join(', ')}
                              className="absolute right-1.5 top-2 text-rose-600 cursor-pointer"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Computed TP */}
                      <td className="py-2.5 px-3 text-center">
                        {item.masteryLevel ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.masteryLevel >= 5 ? 'bg-emerald-100 text-emerald-800' :
                            item.masteryLevel >= 4 ? 'bg-blue-100 text-blue-800' :
                            item.masteryLevel >= 3 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            TP{item.masteryLevel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {item.status}
                        </span>
                      </td>

                      {/* KPMP Sample Indicator */}
                      <td className="py-2.5 px-3 text-center">
                        {item.isSampled ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            ★ {t('Sampel', 'Sample')}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Audit / History */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setHistoryItem(item)}
                          title={t('Lihat Log Perubahan Skor', 'View Score Change History')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition"
                        >
                          <History className="w-4 h-4" />
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

      {/* History Version Control Modal */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('Jejak Audit & Sejarah Skor', 'Score Audit Trail & History')}
                </h3>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-xs space-y-1">
              <div><span className="text-slate-500">{t('Nama Murid:', 'Student Name:')}</span> <strong className="text-slate-900">{historyItem.studentName}</strong></div>
              <div><span className="text-slate-500">{t('No. MyKid:', 'MyKid:')}</span> <strong className="font-mono text-slate-900">{maskMyKid(historyItem.studentMykid)}</strong></div>
              <div><span className="text-slate-500">{t('Skor Semasa:', 'Current Score:')}</span> <strong className="text-blue-900">{historyItem.rawScore ?? 'Tiada'}</strong> ({historyItem.masteryLevel ? `TP${historyItem.masteryLevel}` : 'Tiada TP'})</div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {historyItem.history && historyItem.history.length > 0 ? (
                historyItem.history.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-500 text-[10px]">
                      <span>{new Date(h.changedAt).toLocaleString()}</span>
                      <span className="font-bold text-slate-800">{h.changedBy}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      Skor: {h.oldRawScore ?? 'Draf'} → <span className="text-blue-900 font-bold">{h.newRawScore}</span>
                    </div>
                    {h.reason && (
                      <div className="text-[11px] text-slate-600 italic">
                        "{h.reason}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">{t('Tiada rekod pindaan lampau.', 'No previous change records.')}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setHistoryItem(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                {t('Tutup', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Justification Modal for edits after submission */}
      {justificationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-amber-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('Justifikasi Pembetulan Markah Diperlukan', 'Score Correction Justification Required')}
              </h3>
            </div>

            <p className="text-xs text-slate-600 my-3">
              {t(
                'Rekod skor ini telah melalui proses semakan/penyerahan. Mengikut Panduan Pengurusan Matriks Pembelajaran KPM, sebarang pindaan selepas penyerahan wajib disertakan justifikasi rasmi untuk jejak audit.',
                'This score batch has already been submitted or validated. In compliance with MOE MP guidelines, post-submission alterations require formal justification for the audit trail.'
              )}
            </p>

            <textarea
              rows={3}
              value={justificationModal.reason}
              onChange={(e) => setJustificationModal({ ...justificationModal, reason: e.target.value })}
              placeholder={t('Contoh: Pembetulan kesilapan transkripsi kertas soalan bahagian B.', 'e.g., Transcription error correction for question paper part B.')}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setJustificationModal({ isOpen: false, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  if (!justificationModal.reason.trim()) {
                    alert(t('Sila nyatakan justifikasi pembetulan.', 'Please specify the correction reason.'));
                    return;
                  }
                  const r = justificationModal.reason;
                  setJustificationModal({ isOpen: false, reason: '' });
                  handleSaveDraft(r);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7D121D] hover:bg-[#580B12] text-white transition shadow-sm"
              >
                {t('Sahkan & Simpan Pindaan', 'Confirm & Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
