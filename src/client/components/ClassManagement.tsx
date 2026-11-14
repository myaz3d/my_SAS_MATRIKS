import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCheck, 
  BookOpen, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight,
  Sparkles,
  School,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ClassAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  year: string;
  roomLocation: string;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  totalScores: number;
  assignments: ClassAssignment[];
  createdAt: string;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ClassManagement: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { t } = useApp();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: 4,
    year: '2026/2027',
    roomLocation: '',
  });

  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    subjectId: '',
  });

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, subjectsRes, usersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/roster/subjects'),
        fetch('/api/auth/users'),
      ]);

      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();
      const usersData = await usersRes.json();

      if (Array.isArray(classesData)) setClasses(classesData);
      if (Array.isArray(subjectsData)) setSubjects(subjectsData);
      if (usersData && Array.isArray(usersData.users)) {
        const teachersList = usersData.users.filter((u: any) => 
          ['TEACHER', 'KPMP', 'COORDINATOR'].includes(u.role)
        );
        setTeachers(teachersList);
      }
    } catch (err) {
      console.error('Error loading class data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencipta kelas');

      setFeedbackMessage({ type: 'success', text: data.message });
      setIsAddModalOpen(false);
      setFormData({ name: '', gradeLevel: 4, year: '2026/2027', roomLocation: '' });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengemaskini kelas');

      setFeedbackMessage({ type: 'success', text: data.message });
      setIsEditModalOpen(false);
      setSelectedClass(null);
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (!confirm(`Adakah anda pasti ingin memadam kelas ${cls.name}?`)) return;

    try {
      const res = await fetch(`/api/classes/${cls.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memadam kelas');

      setFeedbackMessage({ type: 'success', text: data.message });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignForm.teacherId,
          subjectId: assignForm.subjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menetapkan penugasan guru');

      setFeedbackMessage({ type: 'success', text: data.message });
      setIsAssignModalOpen(false);
      setSelectedClass(null);
      setAssignForm({ teacherId: '', subjectId: '' });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.roomLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAllStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMale = classes.reduce((sum, c) => sum + c.maleStudents, 0);
  const totalFemale = classes.reduce((sum, c) => sum + c.femaleStudents, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#580B12] via-[#7D121D] to-[#9B1C2A] rounded-2xl p-6 text-white shadow-md border border-amber-400/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-black/30 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Sekolah Agama Suria (XCA4301) • PPD Tuaran
              </span>
              <span className="text-xs font-semibold text-amber-300">
                Sesi 2026/2027 • Tahun 4
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white flex items-center gap-2">
              <School className="w-7 h-7 text-amber-400" />
              {t('Pengurusan Kelas & Penugasan Guru', 'Class & Teacher Assignment Management')}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
              {t(
                'Pentadbiran bilik darjah Tahun 4 Sekolah Agama Suria, enrolmen murid mengikut jantina, lokasi fizikal kelas, serta pemetaan guru mata pelajaran Matriks Pembelajaran.',
                'Administration of SAS Year 4 classrooms, student gender enrollments, physical locations, and Matriks Pembelajaran subject teacher mappings.'
              )}
            </p>
          </div>

          <button
            onClick={() => {
              setFormData({ name: '', gradeLevel: 4, year: '2026/2027', roomLocation: '' });
              setIsAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-md hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Tambah Kelas Baharu', 'Add New Class')}</span>
          </button>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Jumlah Kelas Berdaftar</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
              {classes.length} <span className="text-xs font-normal text-amber-200">Kelas</span>
            </div>
            <div className="text-[11px] text-amber-200/80 mt-1">Tahun 4 Aktif</div>
          </div>

          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Jumlah Enrolmen Murid</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
              {totalAllStudents} <span className="text-xs font-normal text-amber-200">Murid</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              Purata {(totalAllStudents / (classes.length || 1)).toFixed(0)} murid/kelas
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Pecahan Jantina Murid</span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-1 text-amber-300">
              {totalMale} L <span className="text-slate-300 font-normal">/</span> {totalFemale} P
            </div>
            <div className="text-[11px] text-amber-200/80 mt-1">Seimbang mengikut kelas</div>
          </div>

          <div className="bg-black/25 backdrop-blur-xs rounded-xl p-3 sm:p-4 border border-amber-300/20">
            <div className="flex items-center gap-2 text-amber-200 text-xs font-medium">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Status Penugasan Guru</span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-1 text-cyan-300">
              Lengkap
            </div>
            <div className="text-[11px] text-cyan-200/80 mt-1">6 Mata Pelajaran Utama</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold border transition ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#7D121D] text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Senarai Bilik Darjah ({filteredClasses.length})
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama kelas atau lokasi..."
            className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs w-60 sm:w-72 focus:ring-2 focus:ring-[#7D121D] outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-[#7D121D] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Memuatkan senarai kelas...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => (
            <div 
              key={cls.id} 
              className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full inline-block">
                      Tahun {cls.gradeLevel} • {cls.year}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {cls.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{cls.roomLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedClass(cls);
                        setFormData({
                          name: cls.name,
                          gradeLevel: cls.gradeLevel,
                          year: cls.year,
                          roomLocation: cls.roomLocation,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-[#7D121D] hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      title="Edit Maklumat Kelas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Padam Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Enrollment Metrics */}
                <div className="my-4 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Enrolmen Murid:</span>
                    <span className="text-base font-black text-[#7D121D]">
                      {cls.totalStudents} <span className="text-xs font-normal text-slate-500">Murid</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-blue-500 h-2" 
                      style={{ width: `${(cls.maleStudents / (cls.totalStudents || 1)) * 100}%` }}
                      title={`Lelaki: ${cls.maleStudents}`}
                    ></div>
                    <div 
                      className="bg-rose-500 h-2" 
                      style={{ width: `${(cls.femaleStudents / (cls.totalStudents || 1)) * 100}%` }}
                      title={`Perempuan: ${cls.femaleStudents}`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Lelaki: <strong>{cls.maleStudents}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Perempuan: <strong>{cls.femaleStudents}</strong>
                    </span>
                    <span className="text-slate-400">
                      Skor: <strong>{cls.totalScores}</strong>
                    </span>
                  </div>
                </div>

                {/* Teacher & Subject Assignments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#7D121D]" />
                      Penugasan Guru Mata Pelajaran:
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                      {cls.assignments.length} Subjek
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cls.assignments.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg">
                        Belum ada guru mata pelajaran ditugaskan.
                      </div>
                    ) : (
                      cls.assignments.map((asg) => (
                        <div 
                          key={asg.id} 
                          className="flex items-center justify-between text-xs p-2 bg-slate-50 hover:bg-amber-50/50 rounded-lg border border-slate-200/70 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-[#7D121D] text-white px-1.5 py-0.5 rounded">
                              {asg.subjectCode}
                            </span>
                            <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                              {asg.subjectName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]" title={asg.teacherName}>
                            {asg.teacherName}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedClass(cls);
                    setIsAssignModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#7D121D] hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Tugaskan Guru</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('roster')}
                  className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 px-3 py-1.5 rounded-lg border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Senarai Murid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: TAMBAH KELAS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-amber-300 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#580B12] to-[#7D121D] text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Tambah Kelas Baharu (SAS)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 4 Bitara / 4 Arif"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun / Darjah *</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={e => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                      <option key={lvl} value={lvl}>Tahun {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sesi Persekolahan *</label>
                  <input
                    type="text"
                    required
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Fizikal / Bilik Darjah</label>
                <input
                  type="text"
                  placeholder="Contoh: Blok Al-Ghazali, Aras 2"
                  value={formData.roomLocation}
                  onChange={e => setFormData({ ...formData, roomLocation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7D121D] hover:bg-[#580B12] text-white rounded-xl font-black shadow-xs cursor-pointer"
                >
                  Cipta Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KELAS */}
      {isEditModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-amber-300 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#580B12] to-[#7D121D] text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Kemaskini Kelas: {selectedClass.name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun / Darjah</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={e => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(lvl => (
                      <option key={lvl} value={lvl}>Tahun {lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sesi Persekolahan</label>
                  <input
                    type="text"
                    required
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7D121D] hover:bg-[#580B12] text-white rounded-xl font-black shadow-xs cursor-pointer"
                >
                  Simpan Kemaskini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TUGASKAN GURU & SUBJEK */}
      {isAssignModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-300 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#580B12] to-[#7D121D] text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Penugasan Guru: {selectedClass.name}
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Mata Pelajaran *</label>
                <select
                  required
                  value={assignForm.subjectId}
                  onChange={e => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Guru Bertanggungjawab *</label>
                <select
                  required
                  value={assignForm.teacherId}
                  onChange={e => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] outline-none font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 text-[11px] leading-relaxed">
                💡 Guru yang ditugaskan akan mempunyai akses untuk memasukkan skor mentah bagi kelas <strong>{selectedClass.name}</strong> untuk mata pelajaran yang dipilih.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7D121D] hover:bg-[#580B12] text-white rounded-xl font-black shadow-xs cursor-pointer"
                >
                  Sahkan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
