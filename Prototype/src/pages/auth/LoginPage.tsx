import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  KeyRound,
  Lock,
  School,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { UserRole } from '../../types/academic';

const ROLE_ICON_MAP: Record<UserRole, React.ReactNode> = {
  super_admin: <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  wali_kelas: <Users className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  guru_mapel: <BookOpen className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  siswa: <GraduationCap className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  wali_murid: <UserCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    demoAccounts,
    loginAsRole,
    loginWithCredentials,
    students,
    subjects,
    periods,
    activePeriod,
  } = useAcademic();

  const [username, setUsername] = useState('wali.9a');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithCredentials(username || 'superadmin');
    navigate('/');
  };

  const handleQuickRoleLogin = (role: UserRole) => {
    loginAsRole(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto my-auto space-y-6">
        {/* Top Simulation Disclaimer Banner */}
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl bg-secondary border border-light-blue px-4 py-3 text-xs sm:text-sm"
        >
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-ink leading-relaxed">
            Autentikasi pada halaman ini merupakan simulasi untuk keperluan demonstrasi prototype penelitian skripsi, bukan sistem keamanan produksi.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Academic Identity & Live Metric Preview Card */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-ink flex items-center justify-center shrink-0">
                <School className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-secondary text-primary">
                  MONIKA — Monitoring Akademik Siswa
                </span>
                <h2 className="text-base sm:text-lg font-bold text-ink mt-1 leading-snug">
                  SMPN Satu Atap 1 Bangodua
                </h2>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-medium text-primary">
                Judul Penelitian Skripsi
              </p>
              <p className="text-sm sm:text-base font-semibold text-ink leading-relaxed">
                &ldquo;Rancang Bangun Sistem Monitoring Perkembangan Siswa Berbasis Data Akademik&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Sistem informasi terpadu untuk memantau komponen nilai Tugas, UTS, UAS, rekapitulasi presensi kehadiran, tren antarperiode, serta pertimbangan studi lanjut SMA/SMK.
              </p>
            </div>

            {/* Lightweight Abstract Educational Visual & Live Academic Metric Preview */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-semibold text-ink">
                    Ringkasan Data Simulasi Aktif
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-success-bg text-success text-xs font-medium">
                  {activePeriod.name} ({activePeriod.academicYear})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-page p-3">
                  <p className="text-xs text-muted">Data Siswa</p>
                  <p className="text-base sm:text-lg font-bold text-ink tabular-nums mt-0.5">
                    {students.length} Siswa
                  </p>
                </div>
                <div className="rounded-xl bg-page p-3">
                  <p className="text-xs text-muted">Mata Pelajaran</p>
                  <p className="text-base sm:text-lg font-bold text-ink tabular-nums mt-0.5">
                    {subjects.length} Mapel
                  </p>
                </div>
                <div className="rounded-xl bg-page p-3">
                  <p className="text-xs text-muted">Histori Periode</p>
                  <p className="text-base sm:text-lg font-bold text-ink tabular-nums mt-0.5">
                    {periods.length} Semester
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-secondary p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>Rumus Perhitungan Transparan</span>
                  </span>
                  <span className="text-primary font-semibold tabular-nums">
                    Total Bobot 100%
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Nilai Akhir dihitung otomatis dari rata-rata Tugas, UTS, dan UAS sesuai bobot mata pelajaran serta dibandingkan antarsemester untuk mendeteksi perkembangan siswa.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Form & Instant Demo Role Cards */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink">
                Selamat Datang
              </h1>
              <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                Masuk menggunakan akun pengguna atau pilih salah satu peran pengguna demo di bawah untuk menguji alur sistem.
              </p>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                  >
                    Nama Pengguna / NIS / Email
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: wali.9a atau superadmin"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                  >
                    Kata Sandi Simulasi
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full min-h-[44px] pl-10 pr-11 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-muted hover:text-ink transition-colors"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
              >
                <span>Masuk ke Sistem MONIKA</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            {/* Masuk sebagai pengguna demo */}
            <div className="pt-5 border-t border-border space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-ink">
                    Masuk sebagai pengguna demo
                  </h2>
                  <p className="text-xs text-muted">
                    Klik salah satu dari 5 peran pengguna untuk langsung membuka dashboard sesuai hak akses:
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>5 Peran Tersedia</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickRoleLogin(acc.role)}
                    className="w-full min-h-[44px] text-left rounded-xl bg-page hover:bg-secondary p-3.5 flex items-start gap-3 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary group-hover:bg-light-blue flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      {ROLE_ICON_MAP[acc.role]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                          {acc.roleLabel}
                        </span>
                        <ArrowRight
                          className="w-4 h-4 text-muted group-hover:text-primary shrink-0 transition-colors"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="text-xs font-medium text-ink mt-0.5 truncate">
                        {acc.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5 leading-snug">
                        {acc.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center text-xs text-muted">
        Prototype Penelitian Skripsi — MONIKA (Monitoring Akademik Siswa) SMPN Satu Atap 1 Bangodua
      </footer>
    </div>
  );
};
export default LoginPage;
