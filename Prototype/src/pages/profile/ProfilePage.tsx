import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  GraduationCap,
  Info,
  Layers,
  LogOut,
  RotateCcw,
  School,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { BottomSheet, PageHeader, SimulationDisclaimerBanner } from '../../components/ui/CommonUI';
import { UserRole } from '../../types/academic';

const ROLE_ICON_MAP: Record<UserRole, React.ReactNode> = {
  super_admin: <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  wali_kelas: <Users className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  guru_mapel: <BookOpen className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  siswa: <GraduationCap className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
  wali_murid: <UserCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    demoAccounts,
    activePeriod,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    students,
    classes,
    subjects,
    teachers,
    loginAsRole,
    switchStudentContext,
    switchHomeroomClassContext,
    resetDemoData,
    logout,
  } = useAcademic();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) || activePeriod;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setIsResetConfirmOpen(false);
  };

  const masterDataLinks = [
    {
      to: '/siswa',
      title: 'Direktori Data Siswa',
      subtitle: `${students.length} siswa terdaftar`,
      icon: <GraduationCap className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
    {
      to: '/admin/guru',
      title: 'Data Guru & Wali Kelas',
      subtitle: `${teachers.length} tenaga pendidik`,
      icon: <Users className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
    {
      to: '/admin/kelas',
      title: 'Data Rombongan Kelas',
      subtitle: `${classes.length} kelas aktif`,
      icon: <Building2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
    {
      to: '/admin/mapel',
      title: 'Mata Pelajaran & Ambang',
      subtitle: `${subjects.length} mata pelajaran`,
      icon: <BookOpen className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
    {
      to: '/admin/periode',
      title: 'Periode Akademik Semester',
      subtitle: `${periods.length} periode tercatat`,
      icon: <Calendar className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
    {
      to: '/admin/penugasan',
      title: 'Penugasan Guru & Bobot',
      subtitle: 'Pengaturan pengampu & bobot nilai',
      icon: <ClipboardList className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Profil & Pengaturan Simulasi"
        subtitle="Kelola identitas peran pengguna demo, konteks siswa/kelas, dan data master penelitian."
      />

      <SimulationDisclaimerBanner text="Halaman ini menyediakan kendali langsung bagi penguji skripsi untuk berpindah peran pengguna (Super Admin, Wali Kelas, Guru Mapel, Siswa, dan Wali Murid) serta memilih konteks siswa atau kelas tanpa perlu keluar-masuk berulang kali." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Current User Identity & Context Switchers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active User Profile Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-ink flex items-center justify-center text-lg font-bold shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary text-xs font-semibold">
                  {currentUser.roleLabel}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-ink mt-1.5 leading-snug">
                  {currentUser.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-0.5">
                  {currentUser.subtitle}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-muted flex items-center gap-2">
                  <School className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Institusi Sekolah</span>
                </span>
                <span className="font-semibold text-ink text-right">
                  SMPN Satu Atap 1 Bangodua
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-muted flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Periode Aktif Sistem</span>
                </span>
                <span className="font-semibold text-ink text-right">
                  {activePeriod.name} ({activePeriod.academicYear})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-muted flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span>Nama Pengguna</span>
                </span>
                <span className="font-mono font-semibold text-ink">
                  {currentUser.username}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-page p-3.5 text-xs text-muted leading-relaxed">
              {currentUser.description}
            </div>

            {/* Period view switcher */}
            <div className="pt-3 border-t border-border">
              <label
                htmlFor="profile-period-select"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Periode Akademik yang Sedang Ditampilkan
              </label>
              <select
                id="profile-period-select"
                value={selectedPeriod.id}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Tahun Ajaran {p.academicYear} ({p.semesterType})
                    {p.isActive ? ' [Periode Aktif]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Context Switcher for Siswa / Wali Murid */}
          {(currentUser.role === 'siswa' || currentUser.role === 'wali_murid') && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  Pilih Siswa Simulasi ({students.length} Siswa Demo)
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Sebagai {currentUser.roleLabel}, Anda dapat memilih siswa mana pun untuk menguji tampilan nilai, presensi, grafik perkembangan, dan pertimbangan studi lanjut SMA/SMK.
              </p>
              <div>
                <label htmlFor="student-context-select" className="sr-only">
                  Pilih Siswa Simulasi
                </label>
                <select
                  id="student-context-select"
                  value={currentUser.studentId || students[0]?.id || ''}
                  onChange={(e) => switchStudentContext(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
                >
                  {students.map((stu) => {
                    const cls = classes.find((c) => c.id === stu.classId);
                    return (
                      <option key={stu.id} value={stu.id}>
                        {stu.name} — Kelas {cls?.name || '-'} ({stu.demoPatternNote})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Conditional Context Switcher for Wali Kelas */}
          {currentUser.role === 'wali_kelas' && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  Pilih Kelas Perwalian Simulasi
                </h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Pilih rombongan belajar yang ingin dipantau sebagai Wali Kelas pada simulasi ini:
              </p>
              <div>
                <label htmlFor="homeroom-class-select" className="sr-only">
                  Pilih Kelas Perwalian
                </label>
                <select
                  id="homeroom-class-select"
                  value={currentUser.classId || classes[0]?.id || ''}
                  onChange={(e) => switchHomeroomClassContext(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name} — Tahun Ajaran {cls.academicYear} ({cls.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Session & Reset Controls */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-ink">
              Kendali Data & Sesi Simulasi
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Seluruh perubahan nilai, bobot, presensi, atau data master disimpan di penyimpanan lokal peramban. Anda dapat mengembalikannya ke data awal kapan saja.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-warning-bg text-warning border border-warning-border text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Reset Data Demo</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-danger-bg text-danger border border-danger-border text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Keluar ke Halaman Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Role Switcher, Super Admin Master Menu & Thesis Information */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ganti Peran Pengguna Demo */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Ganti Peran Pengguna Demo
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Klik salah satu peran di bawah untuk langsung beralih hak akses dan tampilan antarmuka:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const isActive = currentUser.role === acc.role;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => loginAsRole(acc.role)}
                    className={`w-full min-h-[44px] text-left rounded-xl p-3.5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-secondary text-ink'
                        : 'bg-page hover:bg-secondary text-ink'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? 'bg-primary text-primary-ink' : 'bg-secondary text-primary'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                      ) : (
                        ROLE_ICON_MAP[acc.role]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-ink">
                          {acc.roleLabel}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-ink text-xs font-medium">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-ink mt-0.5 truncate">
                        {acc.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5 leading-snug">
                        {acc.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Super Admin Master Data Management Menu */}
          {currentUser.role === 'super_admin' && (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    Menu Pengelolaan Data Master Sekolah
                  </h3>
                  <p className="text-xs sm:text-sm text-muted">
                    Akses cepat bagi Super Admin untuk mengelola data referensi akademik di perangkat mobile maupun desktop.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {masterDataLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="min-h-[44px] rounded-xl bg-page hover:bg-secondary p-3.5 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 text-muted group-hover:text-primary shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tentang Penelitian Skripsi */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Tentang Penelitian Skripsi
              </h3>
            </div>

            <div className="rounded-xl bg-page p-4 space-y-3 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-muted">Judul Skripsi</p>
                <p className="font-bold text-ink mt-0.5 leading-relaxed">
                  Rancang Bangun Sistem Monitoring Perkembangan Siswa Berbasis Data Akademik
                </p>
              </div>
              <div className="pt-2.5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted">Objek Studi Kasus</p>
                  <p className="font-semibold text-ink mt-0.5">
                    SMPN Satu Atap 1 Bangodua
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Nama Aplikasi</p>
                  <p className="font-semibold text-ink mt-0.5">
                    MONIKA — Monitoring Akademik Siswa
                  </p>
                </div>
              </div>
              <div className="pt-2.5 border-t border-border">
                <p className="text-xs text-muted">Catatan Arsitektur Implementasi</p>
                <p className="text-ink mt-0.5 leading-relaxed">
                  Prototype interaktif ini memodelkan antarmuka pengguna (UI), aturan perhitungan nilai akhir berbobot, deteksi tren perkembangan antarperiode, rekapitulasi presensi, serta profil pertimbangan studi lanjut SMA/SMK sebagai acuan perancangan sistem berbasis Laravel, PHP, MySQL, dan Blade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation BottomSheet for Reset Demo Data */}
      <BottomSheet
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Konfirmasi Reset Data Demo"
        subtitle="Kembalikan seluruh data simulasi ke kondisi awal"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-ink hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
            >
              Ya, Reset Seluruh Data
            </button>
          </div>
        }
      >
        <p className="text-sm text-ink leading-relaxed">
          Apakah Anda yakin ingin mengatur ulang seluruh data nilai, bobot penilaian, sesi presensi, dan data master kembali ke pengaturan awal simulasi skripsi?
        </p>
      </BottomSheet>
    </div>
  );
};
export default ProfilePage;
