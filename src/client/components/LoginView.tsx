import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  MapPin, 
  KeyRound,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login, t, language, setLanguage } = useApp();

  const [email, setEmail] = useState<string>('admin@sekolah.edu.my');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Gagal log masuk. Sila semak emel dan kata laluan.');
    }
  };

  const demoAccounts = [
    {
      role: 'SUPER_ADMIN',
      title: 'Pentadbir Utama Sistem (Super Admin)',
      name: 'Puan Maimunah Binti Tajuddin',
      email: 'admin@sekolah.edu.my',
      password: 'admin123',
      badgeColor: 'bg-rose-100 text-[#7D121D] border-rose-300',
      desc: 'Kuasa penuh: konfigurasi, pengurusan ID pengguna, kelulusan akhir & sandaran.',
    },
    {
      role: 'COORDINATOR',
      title: 'Penyelaras Matriks Pembelajaran',
      name: 'Ustaz Ahmad Fauzi Bin Hassan',
      email: 'penyelaras@sekolah.edu.my',
      password: 'penyelaras123',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Bina kitaran, pantau pengisian guru, semak kelengkapan skor.',
    },
    {
      role: 'KPMP',
      title: 'Ketua Panitia Bahasa Melayu',
      name: 'Cikgu Siti Nurhaliza Binti Daud',
      email: 'kpmp.bm@sekolah.edu.my',
      password: 'kpmp123',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      desc: 'Jana sampel rawak 10%, semak evidens rubrik, lulus atau tolak rekod.',
    },
    {
      role: 'TEACHER',
      title: 'Guru BM (4 Cemerlang & 4 Terbilang)',
      name: 'Cikgu Aminah Binti Yusof',
      email: 'guru.bm1@sekolah.edu.my',
      password: 'guru123',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Kemasukan skor murid kelas ditugaskan sahaja (Akses terhad).',
    },
    {
      role: 'DATA_OFFICER',
      title: 'Pegawai Data Sekolah',
      name: 'En. Faizal Bin Othman',
      email: 'data@sekolah.edu.my',
      password: 'data123',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      desc: 'Import enrolmen murid dan jana pakej penyediaan SBPPA rasmi.',
    },
    {
      role: 'LEADER',
      title: 'Pihak Pengurusan / PKP',
      name: 'Puan Zuraida Binti Ibrahim',
      email: 'pkp@sekolah.edu.my',
      password: 'leader123',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Pantau papan pemuka sekolah dan semak murid perlu intervensi.',
    },
  ];

  const fillCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7D121D]/5 via-amber-50/40 to-slate-100 flex flex-col justify-between py-6 px-4">
      {/* Top Header / Statutory Banner */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <div className="bg-amber-50 border-l-4 border-amber-600 p-3 rounded-r-xl shadow-xs text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wide text-amber-900">
              Peringatan Integriti & Pematuhan SBPPA KPM:
            </span>{' '}
            Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM. 
            Sistem ini adalah alat sokongan pengurusan dalaman sekolah dan TIDAK menghantar markah secara terus ke KPM/JPN/PPD tanpa integrasi berkanun.
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-amber-200/80 overflow-hidden">
        {/* Card Header with School Logo & Theme */}
        <div className="bg-gradient-to-r from-[#7D121D] via-[#9B1C2A] to-[#580B12] px-6 py-8 text-white relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'ms' ? 'en' : 'ms')}
              className="text-[11px] font-bold uppercase bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full border border-white/20 transition"
            >
              {language === 'ms' ? 'Bahasa Malaysia' : 'English'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <img 
              src="/SAS.jpg" 
              alt="Logo Sekolah Agama Suria" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-white p-1 border-2 border-amber-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  my_SAS_MATRIKS
                </h1>
                <span className="text-[10px] font-bold uppercase bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  SR SABK
                </span>
              </div>
              <p className="text-amber-200 text-xs sm:text-sm font-medium mt-1">
                Sistem Pengurusan Operasi Matriks Pembelajaran
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-100/90 mt-2 font-semibold">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  Sekolah Agama Suria (XCA4301)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  PPD Tuaran, Sabah
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body / Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">
              {t('Log Masuk ID Pengguna', 'User ID Sign In')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                'Sila masukkan emel rasmi dan kata laluan yang ditetapkan oleh Pentadbir Sekolah (SUPER_ADMIN).',
                'Please enter your official school email and password assigned by the Super Admin.'
              )}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded-r-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t('Ralat Log Masuk:', 'Login Error:')}</span> {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7D121D]" />
                {t('Alamat Emel Rasmi Pengguna', 'Official Email Address')}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.edu.my"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] focus:border-[#7D121D] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7D121D]" />
                {t('Kata Laluan', 'Password')}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#7D121D] focus:border-[#7D121D] outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#7D121D] to-[#9B1C2A] hover:from-[#580B12] hover:to-[#7D121D] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{t('Mengesahkan...', 'Authenticating...')}</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>{t('Log Masuk Sistem', 'Sign In to System')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role Switching & Demo Credential Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                {t('Pilihan Peranan Ujian (Klik untuk Isi Pantas):', 'Quick Demo Roles (Click to fill):')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Mod Simulasi KPM</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc.email, acc.password)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition hover:shadow-xs flex flex-col justify-between ${
                    email === acc.email
                      ? 'border-[#7D121D] bg-rose-50/50 ring-1 ring-[#7D121D]'
                      : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-slate-900 truncate">{acc.title}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${acc.badgeColor}`}>
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 truncate">{acc.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Sekolah Agama Suria, Tuaran (XCA4301)</span>
          <span className="font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px]">
            v1.0.0-PROD
          </span>
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 mt-6">
        <div>
          my_SAS_MATRIKS • Sistem Pentaksiran Matriks Pembelajaran Sekolah Rendah (SR SABK)
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Pematuhan Akta Perlindungan Data Peribadi (PDPA) & Pekeliling Pengurusan Pentaksiran Bilik Darjah KPM.
        </div>
      </div>
    </div>
  );
};