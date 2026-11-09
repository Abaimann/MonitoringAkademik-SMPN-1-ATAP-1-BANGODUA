import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Link2,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  BottomSheet,
  PageHeader,
  SimulationDisclaimerBanner,
} from '../../components/ui/CommonUI';

const ADMIN_NAV_ITEMS = [
  { path: '/admin/guru', label: 'Data Guru', icon: Users },
  { path: '/admin/kelas', label: 'Data Kelas', icon: Building2 },
  { path: '/admin/mapel', label: 'Mata Pelajaran', icon: BookOpen },
  { path: '/admin/periode', label: 'Periode Akademik', icon: CalendarRange },
  { path: '/admin/penugasan', label: 'Penugasan Mengajar', icon: Link2 },
  { path: '/siswa', label: 'Data Siswa', icon: UserCheck },
];

export const ManagePeriodsPage: React.FC = () => {
  const location = useLocation();
  const {
    currentUser,
    loginAsRole,
    periods,
    activePeriod,
    selectedPeriodId,
    setSelectedPeriodId,
    addPeriod,
    setActivePeriod,
  } = useAcademic();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [code, setCode] = useState('SEM-5');
  const [name, setName] = useState('Semester 5');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [semesterType, setSemesterType] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [startDate, setStartDate] = useState('2026-07-15');
  const [endDate, setEndDate] = useState('2026-12-20');
  const [makeActive, setMakeActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.order - b.order),
    [periods]
  );

  const openAddModal = () => {
    const nextOrder =
      periods.reduce((max, p) => Math.max(max, p.order), 0) + 1;
    setCode(`SEM-${nextOrder}`);
    setName(`Semester ${nextOrder}`);
    setAcademicYear('2026/2027');
    setSemesterType(nextOrder % 2 === 1 ? 'Ganjil' : 'Genap');
    setStartDate('2026-07-15');
    setEndDate('2026-12-20');
    setMakeActive(false);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !academicYear.trim()) {
      setFormError('Kode, nama periode, dan tahun ajaran wajib diisi.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Tanggal mulai dan tanggal selesai periode wajib diisi.');
      return;
    }

    addPeriod({
      code: code.trim(),
      name: name.trim(),
      academicYear: academicYear.trim(),
      semesterType,
      isActive: makeActive,
      startDate,
      endDate,
    });
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Kelola Periode Akademik"
        subtitle="Pengaturan urutan semester evaluasi longitudinal (Semester 1 s.d. Semester 4+) dan penetapan periode berjalan"
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Periode Baru</span>
          </button>
        }
      />

      {/* Navigasi Master Data Super Admin */}
      <nav
        aria-label="Navigasi Data Master Super Admin"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-ink border-primary'
                  : 'bg-surface text-ink border-border hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {currentUser?.role !== 'super_admin' && (
        <div className="rounded-2xl bg-secondary border border-light-blue p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-ink leading-relaxed">
              Anda sedang melihat halaman pengelolaan periode akademik. Beralih ke peran{' '}
              <span className="font-bold">Super Admin</span> untuk mengatur periode aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loginAsRole('super_admin')}
            className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-medium transition-colors shrink-0"
          >
            Aktifkan Mode Super Admin
          </button>
        </div>
      )}

      <SimulationDisclaimerBanner text="Mengubah Periode Aktif akan langsung mengubah acuan semester berjalan pada Dashboard, Input Nilai, Presensi, dan Rekomendasi." />

      {/* Ringkasan Periode */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <span className="text-xs text-muted block">
              Total Periode Tercatat
            </span>
            <span className="text-lg sm:text-2xl font-bold text-ink tabular-nums">
              {periods.length} Semester
            </span>
          </div>

          <div className="rounded-xl bg-secondary p-3.5 space-y-1">
            <span className="text-xs text-muted block">
              Periode Aktif Sekolah
            </span>
            <span className="text-base sm:text-xl font-bold text-primary">
              {activePeriod.name} ({activePeriod.academicYear})
            </span>
          </div>

          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <span className="text-xs text-muted block">
              Periode yang Sedang Ditinjau
            </span>
            <span className="text-base sm:text-xl font-bold text-ink">
              {periods.find((p) => p.id === selectedPeriodId)?.name ||
                activePeriod.name}
            </span>
          </div>
        </div>
      </section>

      {/* Daftar Periode Akademik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPeriods.map((period) => {
          const isCurrentActive = period.isActive;
          const isSelectedView = period.id === selectedPeriodId;

          return (
            <div
              key={period.id}
              className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-bold">
                        {period.code}
                      </span>
                      <h3 className="text-base font-bold text-ink">
                        {period.name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Urutan Longitudinal: Semester ke-{period.order}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {isCurrentActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-bg text-success border border-success-border text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Periode Aktif</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-page text-muted border border-border text-xs font-medium">
                        Arsip Riwayat
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-page p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Tahun Ajaran</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {period.academicYear}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Jenis Semester</span>
                    <span className="font-semibold text-ink">
                      Semester {period.semesterType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Rentang Tanggal</span>
                    </span>
                    <span className="font-semibold text-ink tabular-nums">
                      {period.startDate} — {period.endDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodId(period.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelectedView
                      ? 'bg-secondary text-primary font-semibold'
                      : 'bg-page hover:bg-secondary text-ink'
                  }`}
                >
                  {isSelectedView
                    ? 'Sedang Ditampilkan di Filter'
                    : 'Tampilkan Data Periode Ini'}
                </button>

                {isCurrentActive ? (
                  <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-success-bg text-success text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Aktif Saat Ini</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActivePeriod(period.id)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Jadikan Periode Aktif</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BottomSheet Tambah Periode Baru */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Tambah Periode Akademik Baru"
        subtitle="Tambahkan periode semester baru untuk perluasan pemantauan akademik"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="period-form"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Simpan Periode</span>
            </button>
          </div>
        }
      >
        <form id="period-form" onSubmit={handleAddPeriod} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Kode Periode
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: SEM-5"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Nama Periode
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Semester 5"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026/2027"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Jenis Semester
              </label>
              <select
                value={semesterType}
                onChange={(e) =>
                  setSemesterType(e.target.value as 'Ganjil' | 'Genap')
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-xl bg-page p-3.5">
            <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm font-medium text-ink">
                Langsung tetapkan sebagai Periode Aktif berjalan
              </span>
            </label>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};

export default ManagePeriodsPage;
