import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  Edit3,
  Link2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Teacher } from '../../types/academic';
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

export const ManageTeachersPage: React.FC = () => {
  const location = useLocation();
  const {
    currentUser,
    loginAsRole,
    teachers,
    classes,
    subjects,
    addTeacher,
    updateTeacher,
    showFeedback,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'aktif' | 'cuti'>(
    'ALL'
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form states
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'aktif' | 'cuti'>('aktif');
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [homeroomClassId, setHomeroomClassId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.nip.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [teachers, statusFilter, searchQuery]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setNip('');
    setName('');
    setEmail('');
    setPhone('');
    setStatus('aktif');
    setIsHomeroom(false);
    setHomeroomClassId(classes[0]?.id || '');
    setSelectedSubjectIds(subjects[0] ? [subjects[0].id] : []);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setNip(teacher.nip);
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setStatus(teacher.status);
    setIsHomeroom(teacher.isHomeroom);
    setHomeroomClassId(teacher.homeroomClassId || classes[0]?.id || '');
    setSelectedSubjectIds([...teacher.subjectIds]);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim()) {
      setFormError('Nama lengkap guru dan NIP wajib diisi.');
      return;
    }
    if (selectedSubjectIds.length === 0) {
      setFormError('Pilih minimal satu mata pelajaran yang diampu.');
      return;
    }

    const payload: Omit<Teacher, 'id'> = {
      nip: nip.trim(),
      name: name.trim(),
      email: email.trim() || 'guru@smpn1bangodua.sch.id',
      phone: phone.trim() || '081200000000',
      status,
      isHomeroom,
      homeroomClassId: isHomeroom ? homeroomClassId : undefined,
      subjectIds: selectedSubjectIds,
    };

    if (editingTeacher) {
      updateTeacher({
        ...payload,
        id: editingTeacher.id,
      });
    } else {
      addTeacher(payload);
    }
    setIsSheetOpen(false);
  };

  const activeCount = teachers.filter((t) => t.status === 'aktif').length;
  const homeroomCount = teachers.filter((t) => t.isHomeroom).length;

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Kelola Data Guru"
        subtitle="Manajemen data master pendidik, status wali kelas, dan bidang mata pelajaran SMPN Satu Atap 1 Bangodua"
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Guru Baru</span>
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
              Anda sedang melihat halaman pengelolaan data master. Beralih ke peran{' '}
              <span className="font-bold">Super Admin</span> untuk pengalaman administrasi penuh.
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

      <SimulationDisclaimerBanner text="Perubahan data guru dan mata pelajaran yang diampu akan langsung terhubung dengan penugasan mengajar dan hak akses input nilai." />

      {/* Ringkasan Statistik Guru & Filter */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Total Pendidik</span>
            <span className="text-lg sm:text-2xl font-bold text-ink tabular-nums">
              {teachers.length} Guru
            </span>
          </div>
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Status Aktif</span>
            <span className="text-lg sm:text-2xl font-bold text-success tabular-nums">
              {activeCount} Guru
            </span>
          </div>
          <div className="rounded-xl bg-page p-3 sm:p-3.5">
            <span className="text-xs text-muted block">Wali Kelas</span>
            <span className="text-lg sm:text-2xl font-bold text-primary tabular-nums">
              {homeroomCount} Guru
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, NIP, atau alamat email..."
              aria-label="Cari data guru"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'aktif' | 'cuti')
              }
              aria-label="Filter status kepegawaian guru"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            >
              <option value="ALL">Semua Status ({teachers.length})</option>
              <option value="aktif">Status Aktif ({activeCount})</option>
              <option value="cuti">
                Status Cuti ({teachers.length - activeCount})
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* Daftar Guru */}
      {filteredTeachers.length === 0 ? (
        <EmptyState
          title="Data Guru Tidak Ditemukan"
          description="Tidak ada data guru yang sesuai dengan kata kunci pencarian atau filter status."
          actionLabel="Tambah Guru Baru"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map((teacher) => {
            const homeroomClass = classes.find(
              (c) =>
                c.id === teacher.homeroomClassId ||
                c.homeroomTeacherId === teacher.id
            );
            const taughtSubjects = subjects.filter((s) =>
              teacher.subjectIds.includes(s.id)
            );

            return (
              <div
                key={teacher.id}
                className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-ink leading-snug">
                        {teacher.name}
                      </h3>
                      <p className="text-xs text-muted tabular-nums mt-0.5">
                        NIP: {teacher.nip}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          teacher.status === 'aktif'
                            ? 'bg-success-bg text-success border-success-border'
                            : 'bg-warning-bg text-warning border-warning-border'
                        }`}
                      >
                        {teacher.status === 'aktif' ? 'Aktif' : 'Cuti'}
                      </span>
                      {teacher.isHomeroom && (
                        <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
                          Wali Kelas {homeroomClass?.name || ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Kontak */}
                  <div className="rounded-xl bg-page p-3 space-y-1.5 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="tabular-nums">{teacher.phone}</span>
                    </div>
                  </div>

                  {/* Mata Pelajaran yang Diampu */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted block">
                      Mata Pelajaran yang Diampu:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {taughtSubjects.length > 0 ? (
                        taughtSubjects.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2.5 py-1 rounded-lg bg-secondary text-ink text-xs font-medium"
                          >
                            {sub.name} ({sub.code})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted">
                          Belum ada mata pelajaran terhubung
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateTeacher({
                        ...teacher,
                        status: teacher.status === 'aktif' ? 'cuti' : 'aktif',
                      });
                      showFeedback(
                        `Status kepegawaian ${teacher.name} diubah menjadi ${
                          teacher.status === 'aktif' ? 'Cuti' : 'Aktif'
                        }.`,
                        'info'
                      );
                    }}
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-page hover:bg-secondary text-xs font-medium text-ink transition-colors"
                  >
                    Ubah ke {teacher.status === 'aktif' ? 'Cuti' : 'Aktif'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(teacher)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-medium transition-colors"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Edit Data Guru</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BottomSheet Tambah / Edit Guru */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingTeacher ? 'Perbarui Data Guru' : 'Tambah Data Guru Baru'}
        subtitle="Lengkapi identitas pendidik, status wali kelas, serta mata pelajaran yang diampu"
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
              form="teacher-form"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Simpan Data Guru</span>
            </button>
          </div>
        }
      >
        <form id="teacher-form" onSubmit={handleSaveTeacher} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Nomor Induk Pegawai (NIP)
              </label>
              <input
                type="text"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="198001012006041001"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Status Kepegawaian
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'aktif' | 'cuti')}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              >
                <option value="aktif">Aktif Mengajar</option>
                <option value="cuti">Sedang Cuti</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Email Sekolah
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smpn1bangodua.sch.id"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Penugasan Wali Kelas */}
          <div className="rounded-xl bg-page p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={isHomeroom}
                onChange={(e) => setIsHomeroom(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm font-medium text-ink">
                Bertugas sebagai Wali Kelas
              </span>
            </label>

            {isHomeroom && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Pilih Kelas Perwalian
                </label>
                <select
                  value={homeroomClassId}
                  onChange={(e) => setHomeroomClassId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink focus:outline-none focus:border-primary"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} — Tingkat {c.gradeLevel}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mata Pelajaran yang Diampu */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-ink">
              Mata Pelajaran yang Diampu (Pilih minimal 1)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjects.map((sub) => {
                const checked = selectedSubjectIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubjectSelection(sub.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between gap-2 border transition-colors ${
                      checked
                        ? 'bg-secondary text-primary border-primary'
                        : 'bg-page text-ink border-border hover:bg-secondary'
                    }`}
                  >
                    <span className="truncate">
                      {sub.name} ({sub.code})
                    </span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-xs shrink-0 ${
                        checked
                          ? 'bg-primary text-primary-ink'
                          : 'border border-border bg-surface'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};

export default ManageTeachersPage;
