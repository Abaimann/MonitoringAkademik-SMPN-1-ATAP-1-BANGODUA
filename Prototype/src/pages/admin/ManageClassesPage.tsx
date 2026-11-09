import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  DoorOpen,
  Edit3,
  GraduationCap,
  Link2,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { SchoolClass } from '../../types/academic';
import {
  BottomSheet,
  EmptyState,
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

export const ManageClassesPage: React.FC = () => {
  const location = useLocation();
  const {
    currentUser,
    loginAsRole,
    classes,
    teachers,
    students,
    addClass,
    updateClass,
  } = useAcademic();

  const [gradeFilter, setGradeFilter] = useState<'ALL' | 7 | 8 | 9>('ALL');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<7 | 8 | 9>(9);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [roomNumber, setRoomNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredClasses = useMemo(() => {
    if (gradeFilter === 'ALL') return classes;
    return classes.filter((c) => c.gradeLevel === gradeFilter);
  }, [classes, gradeFilter]);

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setGradeLevel(9);
    setHomeroomTeacherId(teachers[0]?.id || '');
    setAcademicYear('2025/2026');
    setRoomNumber('R-04');
    setFormError(null);
    setIsSheetOpen(true);
  };

  const openEditModal = (cls: SchoolClass) => {
    setEditingClass(cls);
    setName(cls.name);
    setGradeLevel(cls.gradeLevel);
    setHomeroomTeacherId(cls.homeroomTeacherId);
    setAcademicYear(cls.academicYear);
    setRoomNumber(cls.roomNumber);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomNumber.trim() || !academicYear.trim()) {
      setFormError('Nama kelas, nomor ruangan, dan tahun ajaran wajib diisi.');
      return;
    }

    const payload: Omit<SchoolClass, 'id'> = {
      name: name.trim(),
      gradeLevel,
      homeroomTeacherId: homeroomTeacherId || teachers[0]?.id || '',
      academicYear: academicYear.trim(),
      roomNumber: roomNumber.trim(),
    };

    if (editingClass) {
      updateClass({
        ...payload,
        id: editingClass.id,
      });
    } else {
      addClass(payload);
    }
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Kelola Data Kelas"
        subtitle="Pengaturan rombongan belajar, tingkat kelas, ruangan, serta penunjukan Wali Kelas"
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Kelas Baru</span>
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
              Anda sedang melihat halaman pengelolaan data kelas. Beralih ke peran{' '}
              <span className="font-bold">Super Admin</span> untuk mengelola kelas secara penuh.
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

      <SimulationDisclaimerBanner text="Perubahan Wali Kelas pada rombongan belajar akan memperbarui informasi perwalian pada dashboard dan rekapitulasi kelas." />

      {/* Ringkasan & Filter Tingkat Kelas */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Total Rombel</span>
            <span className="text-lg sm:text-2xl font-bold text-ink tabular-nums">
              {classes.length} Kelas
            </span>
          </div>
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Total Siswa Terdaftar</span>
            <span className="text-lg sm:text-2xl font-bold text-primary tabular-nums">
              {students.length} Siswa
            </span>
          </div>
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Tahun Ajaran Aktif</span>
            <span className="text-base sm:text-xl font-bold text-ink tabular-nums">
              {classes[0]?.academicYear || '2025/2026'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs font-medium text-muted mr-1">
            Filter Tingkat:
          </span>
          {(
            [
              { value: 'ALL', label: 'Semua Tingkat' },
              { value: 7, label: 'Tingkat 7' },
              { value: 8, label: 'Tingkat 8' },
              { value: 9, label: 'Tingkat 9' },
            ] as const
          ).map((item) => (
            <button
              key={String(item.value)}
              type="button"
              onClick={() => setGradeFilter(item.value)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors border ${
                gradeFilter === item.value
                  ? 'bg-secondary text-primary border-primary'
                  : 'bg-page text-ink border-border hover:bg-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Daftar Kelas */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          title="Data Kelas Belum Tersedia"
          description="Tidak ada rombongan belajar pada filter tingkat kelas yang dipilih."
          actionLabel="Tambah Kelas Baru"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const homeroomTeacher = teachers.find(
              (t) => t.id === cls.homeroomTeacherId
            );
            const studentCount = students.filter(
              (s) => s.classId === cls.id
            ).length;

            return (
              <div
                key={cls.id}
                className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {cls.name}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-ink">
                          Kelas {cls.name}
                        </h3>
                        <p className="text-xs text-muted">
                          Tahun Ajaran {cls.academicYear}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium shrink-0">
                      Tingkat {cls.gradeLevel}
                    </span>
                  </div>

                  <div className="rounded-xl bg-page p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Nomor Ruangan</span>
                      </span>
                      <span className="font-semibold text-ink">
                        {cls.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Jumlah Siswa</span>
                      </span>
                      <span className="font-semibold text-ink tabular-nums">
                        {studentCount} Siswa
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-secondary p-3 space-y-1">
                    <span className="text-xs text-muted block">
                      Wali Kelas Ditugaskan:
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-ink">
                      {homeroomTeacher ? homeroomTeacher.name : 'Belum Ditentukan'}
                    </p>
                    {homeroomTeacher && (
                      <p className="text-xs text-muted tabular-nums">
                        NIP: {homeroomTeacher.nip}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    to="/siswa"
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-page hover:bg-secondary text-xs font-medium text-ink transition-colors"
                  >
                    Lihat Siswa ({studentCount})
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(cls)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-medium transition-colors"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Edit Kelas</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BottomSheet Tambah / Edit Kelas */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingClass ? `Edit Kelas ${editingClass.name}` : 'Tambah Kelas Baru'}
        subtitle="Atur nama kelas, tingkat, ruangan, serta penunjukan guru Wali Kelas"
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
              form="class-form"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Simpan Data Kelas</span>
            </button>
          </div>
        }
      >
        <form id="class-form" onSubmit={handleSaveClass} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Nama Kelas / Rombel
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: IX-C atau VII-A"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Tingkat Kelas
              </label>
              <select
                value={gradeLevel}
                onChange={(e) =>
                  setGradeLevel(Number(e.target.value) as 7 | 8 | 9)
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              >
                <option value={7}>Tingkat 7 (Kelas VII)</option>
                <option value={8}>Tingkat 8 (Kelas VIII)</option>
                <option value={9}>Tingkat 9 (Kelas IX)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Nomor / Kode Ruangan
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Contoh: R-01"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Guru Wali Kelas
            </label>
            <select
              value={homeroomTeacherId}
              onChange={(e) => setHomeroomTeacherId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (NIP: {t.nip}) — {t.status === 'aktif' ? 'Aktif' : 'Cuti'}
                </option>
              ))}
            </select>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};

export default ManageClassesPage;
