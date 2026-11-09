import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  Compass,
  Database,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  Users,
  UserSquare2,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { UserRole } from '../../types/academic';
import { BottomSheet, FeedbackToast } from '../ui/CommonUI';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    currentUser,
    demoAccounts,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    students,
    classes,
    loginAsRole,
    switchStudentContext,
    switchHomeroomClassContext,
    resetDemoData,
    logout,
    feedback,
    clearFeedback,
  } = useAcademic();

  const navigate = useNavigate();
  const location = useLocation();
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!currentUser) {
    return <>{children}</>;
  }

  const isStudentOrParent =
    currentUser.role === 'siswa' || currentUser.role === 'wali_murid';

  // Mobile 5-item bottom navigation strictly following Section 4.3:
  // Guru & Wali Kelas (& Super Admin): 1. Beranda 2. Nilai 3. Presensi 4. Analisis 5. Profil
  // Siswa & Wali Murid: 1. Beranda 2. Nilai 3. Presensi 4. Perkembangan 5. Profil
  const mobileBottomNav: NavItem[] = isStudentOrParent
    ? [
        { label: 'Beranda', to: '/', icon: Home },
        { label: 'Nilai', to: '/nilai', icon: BookOpen },
        { label: 'Presensi', to: '/presensi', icon: CalendarCheck },
        {
          label: 'Perkembangan',
          to: `/monitoring/${currentUser.studentId || 'stu-1'}`,
          icon: TrendingUp,
          matchPaths: ['/monitoring', '/rekomendasi'],
        },
        { label: 'Profil', to: '/profil', icon: UserSquare2 },
      ]
    : [
        { label: 'Beranda', to: '/', icon: Home },
        { label: 'Nilai', to: '/nilai', icon: BookOpen },
        { label: 'Presensi', to: '/presensi', icon: CalendarCheck },
        {
          label: 'Analisis',
          to: '/analisis',
          icon: BarChart3,
          matchPaths: ['/analisis', '/monitoring', '/perhatian', '/rekomendasi'],
        },
        { label: 'Profil', to: '/profil', icon: UserSquare2 },
      ];

  // Desktop sidebar navigation tailored by role
  const desktopNavGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Menu Utama',
      items: isStudentOrParent
        ? [
            { label: 'Beranda Akademik', to: '/', icon: Home },
            { label: 'Capaian Nilai', to: '/nilai', icon: BookOpen },
            { label: 'Riwayat Presensi', to: '/presensi', icon: CalendarCheck },
            {
              label: 'Rekapitulasi Kehadiran',
              to: '/presensi/rekap',
              icon: Calendar,
            },
            {
              label: 'Monitoring Perkembangan',
              to: `/monitoring/${currentUser.studentId || 'stu-1'}`,
              icon: TrendingUp,
              matchPaths: ['/monitoring'],
            },
            {
              label: 'Rekomendasi SMA/SMK',
              to: `/rekomendasi/${currentUser.studentId || 'stu-1'}`,
              icon: Compass,
              matchPaths: ['/rekomendasi'],
            },
            { label: 'Profil Pengguna', to: '/profil', icon: UserSquare2 },
          ]
        : [
            { label: 'Beranda Dashboard', to: '/', icon: Home },
            { label: 'Daftar Siswa', to: '/siswa', icon: Users },
            { label: 'Pengelolaan Nilai', to: '/nilai', icon: BookOpen },
            {
              label: 'Pengelolaan Presensi',
              to: '/presensi',
              icon: CalendarCheck,
            },
            {
              label: 'Rekapitulasi Presensi',
              to: '/presensi/rekap',
              icon: Calendar,
            },
          ],
    },
  ];

  if (!isStudentOrParent) {
    desktopNavGroups.push({
      title: 'Monitoring & Analisis',
      items: [
        {
          label: 'Monitoring Perkembangan',
          to: '/monitoring',
          icon: TrendingUp,
          matchPaths: ['/monitoring'],
        },
        {
          label: 'Analisis Antarperiode',
          to: '/analisis',
          icon: BarChart3,
        },
        {
          label: 'Siswa Perlu Perhatian',
          to: '/perhatian',
          icon: AlertTriangle,
        },
        {
          label: 'Rekomendasi SMA/SMK',
          to: '/rekomendasi',
          icon: Compass,
          matchPaths: ['/rekomendasi'],
        },
      ],
    });
  }

  if (currentUser.role === 'super_admin') {
    desktopNavGroups.push({
      title: 'Data Master Sekolah',
      items: [
        { label: 'Data Guru', to: '/admin/guru', icon: UserCheck },
        { label: 'Data Kelas', to: '/admin/kelas', icon: Layers },
        { label: 'Mata Pelajaran', to: '/admin/mapel', icon: BookOpen },
        {
          label: 'Tahun Ajaran & Semester',
          to: '/admin/periode',
          icon: Calendar,
        },
        {
          label: 'Penugasan Guru & Kelas',
          to: '/admin/penugasan',
          icon: SlidersHorizontal,
        },
      ],
    });
  }

  const handleSelectRole = (role: UserRole) => {
    loginAsRole(role);
    setIsRoleSheetOpen(false);
    navigate('/');
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setIsResetConfirmOpen(false);
  };

  const isNavItemActive = (item: NavItem) => {
    if (item.to === '/') {
      return location.pathname === '/';
    }
    if (item.matchPaths) {
      return item.matchPaths.some((p) => location.pathname.startsWith(p));
    }
    return (
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`)
    );
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-page text-ink">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface border-r border-border z-30">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-ink flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base text-ink leading-tight">
              MONIKA
            </div>
            <div className="text-xs text-muted truncate">
              SMPN Satu Atap 1 Bangodua
            </div>
          </div>
        </div>

        {/* Active Role Card in Sidebar */}
        <div className="p-4 border-b border-border bg-secondary/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-light-blue text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-primary">
                {currentUser.roleLabel}
              </div>
              <div className="text-sm font-bold text-ink truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-muted truncate">
                {currentUser.subtitle}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRoleSheetOpen(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-surface hover:bg-light-blue/50 text-primary border border-light-blue text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ganti Peran Demo</span>
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
          aria-label="Navigasi Utama Desktop"
        >
          {desktopNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-xs font-semibold text-muted">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-primary text-primary-ink'
                        : 'text-ink hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border space-y-1.5">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-ink hover:bg-secondary transition-colors whitespace-nowrap"
          >
            <Database className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Reset Data Demo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger-bg transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Keluar ke Halaman Login</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Sticky Mobile & Desktop Top Bar */}
        <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-xs border-b border-border px-4 sm:px-6 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            {/* Brand & School Identity on Mobile */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/"
                className="lg:hidden w-9 h-9 rounded-xl bg-primary text-primary-ink flex items-center justify-center shrink-0"
                aria-label="Beranda MONIKA"
              >
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-ink truncate">
                    MONIKA
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary border border-light-blue text-primary text-xs font-semibold whitespace-nowrap">
                    {currentUser.roleLabel}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">
                  SMPN Satu Atap 1 Bangodua
                </p>
              </div>
            </div>

            {/* Period selector & Quick Demo Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5">
                <label
                  htmlFor="global-period-select"
                  className="text-xs text-muted font-medium whitespace-nowrap"
                >
                  Periode:
                </label>
                <select
                  id="global-period-select"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="min-h-[38px] px-2.5 py-1 rounded-xl bg-page border border-border text-xs font-semibold text-ink"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} ({p.academicYear} {p.semesterType})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsRoleSheetOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-secondary hover:bg-light-blue text-primary border border-light-blue text-xs font-semibold transition-colors whitespace-nowrap"
                aria-label="Ganti Akun atau Peran Demo"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Peran Demo</span>
              </button>
            </div>
          </div>

          {/* Mobile compact period & sub-navigation bar */}
          <div className="sm:hidden mt-2 pt-2 border-t border-border flex items-center justify-between gap-2">
            <div className="text-xs text-muted truncate">
              Akun: <strong className="text-ink">{currentUser.name}</strong>
            </div>
            <select
              aria-label="Pilih Periode Semester"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="min-h-[34px] px-2 py-1 rounded-lg bg-page border border-border text-xs font-semibold text-primary"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main Page Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-28 lg:pb-10 space-y-4">
          {feedback && (
            <FeedbackToast
              type={feedback.type}
              message={feedback.message}
              onClose={clearFeedback}
            />
          )}
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation (5 items based on role) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border safe-bottom"
      >
        <div className="grid grid-cols-5 max-w-md mx-auto px-1">
          {mobileBottomNav.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 px-1 rounded-xl transition-colors ${
                  active
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-ink font-medium'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-9 h-7 rounded-lg ${
                    active ? 'bg-secondary text-primary' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom Sheet: Quick Demo Role & Context Switcher */}
      <BottomSheet
        isOpen={isRoleSheetOpen}
        onClose={() => setIsRoleSheetOpen(false)}
        title="Simulasi Peran Pengguna (Demo Skripsi)"
        subtitle="Pilih salah satu dari 5 peran pengguna untuk menguji tampilan dan hak akses MONIKA secara langsung."
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRoleSheetOpen(false);
                setIsResetConfirmOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-ink hover:bg-secondary transition-colors whitespace-nowrap"
            >
              <Database className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Reset Data Demo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRoleSheetOpen(false);
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-danger-bg border border-danger-border text-xs font-semibold text-danger transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Halaman Login</span>
            </button>
          </div>
        }
      >
        <div className="space-y-2.5">
          {demoAccounts.map((acc) => {
            const isSelected = currentUser.role === acc.role;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectRole(acc.role)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                  isSelected
                    ? 'bg-secondary border-primary'
                    : 'bg-surface border-border hover:bg-page'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-ink'
                      : 'bg-light-blue text-primary'
                  }`}
                >
                  {acc.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-ink">
                      {acc.roleLabel}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-primary text-primary-ink text-[11px] font-semibold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-primary mt-0.5">
                    {acc.name} — {acc.subtitle}
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {acc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Context Switcher for Siswa / Wali Murid to inspect any of the 36 demo students */}
        {isStudentOrParent && (
          <div className="pt-3 border-t border-border space-y-2">
            <label
              htmlFor="switch-student-demo"
              className="block text-xs font-semibold text-ink"
            >
              Simulasi Profil Siswa (Uji Pola Perkembangan Berbeda):
            </label>
            <select
              id="switch-student-demo"
              value={currentUser.studentId || 'stu-1'}
              onChange={(e) => {
                switchStudentContext(e.target.value);
                setIsRoleSheetOpen(false);
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-sm text-ink"
            >
              {students.map((stu) => {
                const cls = classes.find((c) => c.id === stu.classId);
                return (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({cls?.name}) — {stu.demoPatternNote}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Context Switcher for Wali Kelas to inspect any of the 3 classes */}
        {currentUser.role === 'wali_kelas' && (
          <div className="pt-3 border-t border-border space-y-2">
            <label
              htmlFor="switch-class-demo"
              className="block text-xs font-semibold text-ink"
            >
              Simulasi Kelas Ampuan Wali Kelas:
            </label>
            <select
              id="switch-class-demo"
              value={currentUser.classId || 'cls-9a'}
              onChange={(e) => {
                switchHomeroomClassContext(e.target.value);
                setIsRoleSheetOpen(false);
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-sm text-ink"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name} (Tahun Ajaran {c.academicYear})
                </option>
              ))}
            </select>
          </div>
        )}
      </BottomSheet>

      {/* Bottom Sheet: Reset Demo Data Confirmation */}
      <BottomSheet
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset Data Simulasi Demo?"
        subtitle="Tindakan ini akan mengembalikan seluruh perubahan nilai, bobot, presensi, dan data master ke kondisi awal penelitian."
        footer={
          <div className="flex items-center justify-end gap-2">
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
              Ya, Reset ke Data Awal
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted leading-relaxed">
          Data penyimpanan lokal browser (<code className="text-ink">localStorage</code>) untuk
          aplikasi <strong>MONIKA — SMPN Satu Atap 1 Bangodua</strong> akan
          diatur ulang ke 36 siswa, 3 kelas, 7 mata pelajaran, dan 4 periode
          semester awal.
        </p>
      </BottomSheet>
    </div>
  );
};
