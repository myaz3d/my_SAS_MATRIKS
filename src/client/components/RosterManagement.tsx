import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UploadCloud, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet,
  Building,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';

export const RosterManagement: React.FC = () => {
  const { currentUser, t, maskPII } = useApp();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Import modal state
  const [importModal, setImportModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const fetchStudents = () => {
    setLoading(true);
    const q = selectedClassId === 'ALL' ? '' : `?classId=${selectedClassId}`;
    fetch(`/api/roster/students${q}`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/roster/classes')
      .then(res => res.json())
      .then(data => setClasses(data));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportPreview(data);

        // Run dry-run validation immediately
        fetch('/api/roster/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: data,
            dryRun: true,
            fileName: file.name,
          }),
        })
          .then(res => res.json())
          .then(resData => setImportResult(resData));
      } catch (err: any) {
        alert('Ralat membaca fail: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Perform actual import
  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/roster/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: importPreview,
          dryRun: false,
          fileName: importFile?.name || 'import.csv',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat semasa import.');
      } else {
        alert(t(
          `Import selesai! ${data.insertedCount} rekod murid berjaya ditambah ke dalam sistem.`,
          `Import complete! ${data.insertedCount} student records successfully added.`
        ));
        setImportModal(false);
        setImportFile(null);
        setImportPreview([]);
        setImportResult(null);
        fetchStudents();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Filter students by search
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.mykid.includes(searchQuery) ||
                          s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const maskMyKid = (mykid: string) => {
    if (!maskPII) return mykid;
    const parts = mykid.split('-');
    if (parts.length === 3) return `${parts[0]}-**-**${parts[2].slice(-2)}`;
    return mykid.slice(0, 6) + '******' + mykid.slice(-2);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {t('Pengurusan Enrolmen & Roster Murid (SAS)', 'Student Enrolment & Roster Management (SAS)')}
            </h2>
            <p className="text-xs text-slate-500">
              {t(
                'Pangkalan data murid Tahun 4 Sekolah Agama Suria, Tuaran (XCA4301) bagi instrumen Matriks Pembelajaran.',
                'Year 4 student enrolment database for Sekolah Agama Suria, Tuaran (XCA4301).'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/roster/template?format=xlsx"
              download
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{t('Templat Import (XLSX)', 'Import Template (XLSX)')}</span>
            </a>

            {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'COORDINATOR' || currentUser.role === 'DATA_OFFICER') && (
              <button
                onClick={() => setImportModal(true)}
                className="bg-[#7D121D] hover:bg-[#580B12] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-amber-400/30"
              >
                <UploadCloud className="w-4 h-4 text-amber-300" />
                <span>{t('Import Roster Murid', 'Import Student Roster')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{t('Tapis Kelas:', 'Filter Class:')}</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">{t('Semua Kelas (90 Murid)', 'All Classes (90 Students)')}</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c._count?.students || 0})</option>
              ))}
            </select>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari nama atau No. MyKid...', 'Search name or MyKid...')}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {t('Memuatkan senarai murid...', 'Loading student roster...')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-32">{t('No. Pendaftaran', 'Student ID')}</th>
                  <th className="py-3 px-3 w-36">{t('No. MyKid', 'MyKid No.')}</th>
                  <th className="py-3 px-3">{t('Nama Penuh Murid', 'Full Name')}</th>
                  <th className="py-3 px-3 text-center w-20">{t('Jantina', 'Gender')}</th>
                  <th className="py-3 px-3">{t('Kelas', 'Class')}</th>
                  <th className="py-3 px-3 text-center">{t('Status Enrolmen', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{i + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{st.studentId}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{maskMyKid(st.mykid)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{st.fullName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {st.gender === 'L' ? t('Lelaki', 'Male') : t('Perempuan', 'Female')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{st.class?.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t('Aktif', 'Active')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roster Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('Muat Naik & Validasi Fail Roster Murid', 'Upload & Validate Student Roster')}
                </h3>
              </div>
              <button
                onClick={() => setImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:border-blue-700 transition">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-600">
                <label className="font-semibold text-blue-900 hover:underline cursor-pointer">
                  <span>{t('Pilih fail CSV atau XLSX', 'Select CSV or XLSX file')}</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('Format wajib: NO_PENDAFTARAN, NO_MYKID, NAMA_PENUH, JANTINA, NAMA_KELAS', 'Required headers: NO_PENDAFTARAN, NO_MYKID, NAMA_PENUH, JANTINA, NAMA_KELAS')}
                </p>
              </div>
            </div>

            {/* Dry Run Validation Results */}
            {importResult && (
              <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                importResult.errorCount > 0 
                  ? 'bg-rose-50 border-rose-300 text-rose-900' 
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>
                    {importResult.errorCount > 0 
                      ? `⚠️ ${importResult.errorCount} Ralat Integriti Dikesan` 
                      : `✓ Lulus Validasi: ${importResult.validCount} rekod sah sedia diimport`}
                  </span>
                  <span className="text-[11px] font-normal">{importResult.totalSubmitted} baris disemak</span>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1 mt-2 pr-1">
                    {importResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-[11px] bg-rose-100/80 p-1.5 rounded text-rose-950">
                        Baris {err.row} [{err.field}]: {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importResult || importResult.errorCount > 0 || isImporting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white disabled:opacity-50 transition shadow-sm"
              >
                {isImporting ? t('Mengimport...', 'Importing...') : t('Sahkan & Masukkan Data', 'Confirm & Import Data')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
