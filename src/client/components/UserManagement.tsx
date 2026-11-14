import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  UserCheck,
  Building,
  Mail,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../../shared/types';
import { OfficerDetailModal } from './OfficerDetailModal';

export const UserManagement: React.FC = () => {
  const { currentUser, t } = useApp();

  const [users, setUsers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);

  // Modals
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [resetPwdModal, setResetPwdModal] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    subjectHeadOf: string;
    password: string;
  }>({
    name: '',
    email: '',
    role: 'TEACHER',
    subjectHeadOf: '',
    password: '',
  });

  const [newPassword, setNewPassword] = useState<string>('sas12345');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();

    fetch('/api/roster/subjects')
      .then(res => res.json())
      .then(data => setSubjects(data));
  }, []);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert(t('Sila isi nama dan emel pengguna.', 'Please fill in name and email.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          subjectHeadOf: formData.role === 'KPMP' ? formData.subjectHeadOf : null,
          password: formData.password || 'sas12345',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat mencipta pengguna.');
      } else {
        alert(t(`Pengguna ${data.user.name} berjaya didaftarkan!`, `User ${data.user.name} registered successfully!`));
        setCreateModal(false);
        setFormData({ name: '', email: '', role: 'TEACHER', subjectHeadOf: '', password: '' });
        fetchUsers();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/users/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editModal.name,
          email: editModal.email,
          role: editModal.role,
          subjectHeadOf: editModal.role === 'KPMP' ? editModal.subjectHeadOf : null,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat mengemas kini pengguna.');
      } else {
        alert(t('Maklumat pengguna berjaya dikemas kini!', 'User details updated successfully!'));
        setEditModal(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!resetPwdModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/users/${resetPwdModal.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ralat set semula kata laluan.');
      } else {
        alert(data.message);
        setResetPwdModal(null);
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: any) => {
    if (!confirm(t(
      `Adakah anda pasti untuk memadam akaun pengguna: ${user.name} (${user.email})? Tindakan ini tidak boleh diundur.`,
      `Are you sure you want to delete user account: ${user.name} (${user.email})? This action cannot be undone.`
    ))) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal memadam pengguna.');
      } else {
        alert(data.message);
        fetchUsers();
      }
    } catch (err: any) {
      alert('Ralat: ' + err.message);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMIN: 'bg-rose-100 text-[#7D121D] border-rose-300',
    COORDINATOR: 'bg-amber-100 text-amber-900 border-amber-300',
    TEACHER: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    KPMP: 'bg-orange-100 text-orange-900 border-orange-300',
    LEADER: 'bg-purple-100 text-purple-900 border-purple-300',
    DATA_OFFICER: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#7D121D]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('Pengurusan ID Pengguna & Kawalan Akses (RBAC)', 'User ID Management & Access Control (RBAC)')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                'Pentadbiran akaun ID pengguna, peranan pegawai, kata laluan, dan penugasan panitia Sekolah Agama Suria.',
                'Administration of user IDs, official roles, passwords, and subject panitia assignments for Sekolah Agama Suria.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModal(true)}
              className="bg-[#7D121D] hover:bg-[#580B12] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm border border-amber-400/30"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>{t('Daftar Pengguna Baharu', 'Register New User')}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">{t('Tapis Peranan:', 'Filter Role:')}</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-amber-50/60 border border-amber-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">{t('Semua Peranan', 'All Roles')}</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Pentadbir)</option>
              <option value="COORDINATOR">COORDINATOR (Penyelaras)</option>
              <option value="KPMP">KPMP (Ketua Panitia)</option>
              <option value="TEACHER">TEACHER (Guru)</option>
              <option value="LEADER">LEADER (Pihak Pengurusan)</option>
              <option value="DATA_OFFICER">DATA_OFFICER (Guru Data)</option>
            </select>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Cari nama, emel, atau ID...', 'Search name, email, ID...')}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7D121D]"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {t('Memuatkan senarai ID pengguna...', 'Loading user accounts...')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-amber-50/70 text-slate-700 font-bold border-b border-amber-200">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-36">ID Pengguna</th>
                  <th className="py-3 px-3 min-w-[200px]">{t('Nama Penuh Pegawai', 'Official Full Name')}</th>
                  <th className="py-3 px-3">{t('Alamat Emel Rasmi', 'Official Email')}</th>
                  <th className="py-3 px-3 text-center w-36">{t('Peranan Sistem', 'System Role')}</th>
                  <th className="py-3 px-3">{t('Panitia / Penugasan', 'Panitia / Assignment')}</th>
                  <th className="py-3 px-3 text-center w-32">{t('Tindakan', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredUsers.map((user, idx) => {
                  const isCurrentSuperAdmin = user.email === 'admin@sekolah.edu.my';

                  return (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-600 text-[11px]">
                        {user.id.slice(0, 14)}...
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedOfficerId(user.id)}
                          className="font-bold text-[#7D121D] hover:text-[#580B12] hover:underline transition cursor-pointer flex items-center gap-1.5 text-left group"
                          title={t('Klik untuk lihat maklumat peranan dan penugasan rasmi', 'Click to view official role and assignments')}
                        >
                          <span>{user.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0" />
                          {user.role === 'SUPER_ADMIN' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full">
                              Guru Besar
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${roleBadgeColor[user.role] || 'bg-slate-100 text-slate-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {user.role === 'KPMP' ? (
                          <span className="font-semibold text-orange-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[11px]">
                            Ketua Panitia ({user.subjectHeadOf || 'Umum'})
                          </span>
                        ) : user.teacherAssignments && user.teacherAssignments.length > 0 ? (
                          <div className="space-y-0.5">
                            {user.teacherAssignments.map((a: any, i: number) => (
                              <span key={i} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] mr-1">
                                {a.class?.name}: {a.subject?.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditModal({ ...user })}
                            title={t('Kemaskini Maklumat', 'Edit Details')}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#7D121D] hover:bg-amber-100/60 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setResetPwdModal(user);
                              setNewPassword('sas12345');
                            }}
                            title={t('Set Semula Kata Laluan', 'Reset Password')}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isCurrentSuperAdmin}
                            title={isCurrentSuperAdmin ? t('Akaun Guru Besar Utama tidak boleh dipadam', 'Primary Admin cannot be deleted') : t('Padam Pengguna', 'Delete User')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create User */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#7D121D]" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('Daftar ID Pengguna Baharu', 'Register New User ID')}
                </h3>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Nama Penuh Pegawai / Guru', 'Official Full Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ustazah Noraini Binti Zakaria"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Alamat Emel Pengguna', 'Email Address')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="noraini@sas.edu.my"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Peranan Sistem (RBAC)', 'System Role (RBAC)')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none font-semibold"
                >
                  <option value="TEACHER">TEACHER (Guru Mata Pelajaran)</option>
                  <option value="KPMP">KPMP (Ketua Panitia)</option>
                  <option value="COORDINATOR">COORDINATOR (Penyelaras MP)</option>
                  <option value="LEADER">LEADER (Pihak Pengurusan Sekolah)</option>
                  <option value="DATA_OFFICER">DATA_OFFICER (Guru Data)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Pentadbir Sekolah)</option>
                </select>
              </div>

              {formData.role === 'KPMP' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {t('Ketua Panitia Mata Pelajaran', 'Head of Subject')} *
                  </label>
                  <select
                    value={formData.subjectHeadOf}
                    onChange={(e) => setFormData({ ...formData, subjectHeadOf: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                  >
                    <option value="">{t('Pilih Mata Pelajaran...', 'Select Subject...')}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Kata Laluan Permulaan', 'Initial Password')}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Lalai: sas12345"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  {t('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7D121D] hover:bg-[#580B12] text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? t('Menyimpan...', 'Saving...') : t('Daftar Pengguna', 'Register User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#7D121D]" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('Kemaskini Maklumat ID Pengguna', 'Update User ID Details')}
                </h3>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Nama Penuh Pegawai', 'Full Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Emel Pengguna', 'Email Address')} *
                </label>
                <input
                  type="email"
                  required
                  value={editModal.email}
                  onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('Peranan Sistem', 'System Role')} *
                </label>
                <select
                  value={editModal.role}
                  onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none font-semibold"
                >
                  <option value="TEACHER">TEACHER (Guru Mata Pelajaran)</option>
                  <option value="KPMP">KPMP (Ketua Panitia)</option>
                  <option value="COORDINATOR">COORDINATOR (Penyelaras MP)</option>
                  <option value="LEADER">LEADER (Pihak Pengurusan Sekolah)</option>
                  <option value="DATA_OFFICER">DATA_OFFICER (Guru Data)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Pentadbir Utama)</option>
                </select>
              </div>

              {editModal.role === 'KPMP' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {t('Ketua Panitia Mata Pelajaran', 'Head of Subject')}
                  </label>
                  <select
                    value={editModal.subjectHeadOf || ''}
                    onChange={(e) => setEditModal({ ...editModal, subjectHeadOf: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
                  >
                    <option value="">{t('Pilih Mata Pelajaran...', 'Select Subject...')}</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  {t('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7D121D] hover:bg-[#580B12] text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? t('Menyimpan...', 'Saving...') : t('Kemas Kini', 'Update Details')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPwdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-amber-800">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {t('Set Semula Kata Laluan', 'Reset Password')}
              </h3>
            </div>

            <div className="text-xs space-y-1">
              <div><span className="text-slate-500">Nama:</span> <strong>{resetPwdModal.name}</strong></div>
              <div><span className="text-slate-500">Emel:</span> <span className="font-mono">{resetPwdModal.email}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Kata Laluan Baharu', 'New Password')}
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#7D121D] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('Pengguna boleh log masuk dengan kata laluan ini.', 'User can log in using this password.')}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetPwdModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm disabled:opacity-50"
              >
                {submitting ? t('Menyimpan...', 'Saving...') : t('Sahkan Set Semula', 'Confirm Reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Officer Profile & Assignment Detail Modal */}
      <OfficerDetailModal
        userId={selectedOfficerId}
        onClose={() => setSelectedOfficerId(null)}
      />
    </div>
  );
};
