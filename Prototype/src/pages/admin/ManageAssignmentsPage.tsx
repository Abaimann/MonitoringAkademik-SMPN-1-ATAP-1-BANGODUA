import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  Info,
  Link2,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Subject } from '../../types/academic';
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

const selectClass =
  'w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors';

export const ManageAssignmentsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    teachers,
    assignments,
    upsertAssignment,
    getWeightsForClassSubject,
  } = useAcademic();

  const [classId, setClassId] = useState<string>(() => classes[0]?.id || '');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [teacherChoice, setTeacherChoice] = useState('');

  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods]);
  const selectedClass = classes.find((c) => c.id === classId);
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const findAssignment = (subjectId: string) =>
    assignments.find(
      (a) => a.classId === classId && a.subjectId === subjectId && a.periodId === selectedPeriodId
    );

  const assignedCount = subjects.filter((s) => findAssignment(s.id)).length;

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="space-y-5 pb-8">
        <EmptyState
          title="Halaman khusus Super Admin"
          description="Pengaturan penugasan guru, kelas, dan mata pelajaran hanya dapat diakses oleh Super Admin."
          actionLabel="Kembali ke Beranda"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const openEditor = (subject: Subject) => {
    const current = findAssignment(subject.id);
    const fallback = teachers.find((t) => t.subjectIds.includes(subject.id));
    setTeacherChoice(current?.teacherId || fallback?.id || teachers[0]?.id || '');
    setEditingSubject(subject);
  };

  const handleSave = () => {
    if (!editingSubject || !teacherChoice || !classId) return;
    upsertAssignment(classId, editingSubject.id, selectedPeriodId, teacherChoice);
    setEditingSubject(null);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Penugasan Guru, Kelas & Mata Pelajaran"
        subtitle="Tentukan guru pengampu setiap mata pelajaran pada kelas dan periode akademik"
      />

      <nav aria-label="Navigasi Data Master Super Admin" className="flex items-center gap-2 overflow-x-auto pb-1">
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

      <SimulationDisclaimerBanner text="Penugasan menentukan guru yang berhak mengubah nilai pada halaman Input Nilai (/nilai) untuk kelas, mata pelajaran, dan periode terkait." />

      {/* Filter */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="asg-period" className="block text-xs font-medium text-muted mb-1">
              Periode
            </label>
            <select
              id="asg-period"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className={selectClass}
            >
              {sortedPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.academicYear})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="asg-class" className="block text-xs font-medium text-muted mb-1">
              Kelas
            </label>
            <select
              id="asg-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className={selectClass}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="rounded-xl bg-page p-3">
            <span className="text-xs text-muted block">Mapel Sudah Ditugaskan</span>
            <span className="text-lg font-bold text-success tabular-nums">
              {assignedCount} / {subjects.length}
            </span>
          </div>
          <div className="rounded-xl bg-page p-3">
            <span className="text-xs text-muted block">Belum Ditugaskan</span>
            <span className="text-lg font-bold text-warning tabular-nums">
              {subjects.length - assignedCount} Mapel
            </span>
          </div>
        </div>
      </section>

      {/* Daftar mata pelajaran */}
      {!selectedClass || subjects.length === 0 ? (
        <EmptyState
          title="Data Belum Tersedia"
          description="Tambahkan data kelas dan mata pelajaran terlebih dahulu untuk mengatur penugasan."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const assignment = findAssignment(subject.id);
            const teacher = teachers.find((t) => t.id === assignment?.teacherId);
            const weights = getWeightsForClassSubject(classId, subject.id, selectedPeriodId);
            return (
              <div
                key={subject.id}
                className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-ink leading-snug">{subject.name}</h3>
                      <p className="text-xs text-muted mt-0.5">Kode {subject.code}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap ${
                        teacher
                          ? 'bg-success-bg text-success border-success-border'
                          : 'bg-warning-bg text-warning border-warning-border'
                      }`}
                    >
                      {teacher ? 'Sudah Ditugaskan' : 'Belum Ditugaskan'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-page p-3 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted">Guru Pengampu</span>
                      <span className="font-medium text-ink text-right">
                        {teacher?.name || 'Belum ada guru'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted">Bobot Penilaian</span>
                      <span className="font-medium text-ink tabular-nums text-right">
                        Tugas {weights.tugas}% / UTS {weights.uts}% / UAS {weights.uas}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={() => openEditor(subject)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-medium transition-colors"
                  >
                    <UserCog className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Ubah Guru</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl bg-secondary border border-light-blue p-3.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-ink leading-relaxed">
          Guru yang ditugaskan pada kombinasi kelas, mata pelajaran, dan periode ini akan memperoleh
          hak akses untuk menginput dan mengubah nilai pada halaman{' '}
          <Link to="/nilai" className="font-medium text-primary underline underline-offset-2">
            Input Nilai
          </Link>
          .
        </p>
      </div>

      <BottomSheet
        isOpen={editingSubject !== null}
        onClose={() => setEditingSubject(null)}
        title="Ubah Guru Pengampu"
        subtitle={`${editingSubject?.name || ''} pada Kelas ${selectedClass?.name || '-'}, ${selectedPeriod?.name || ''}`}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingSubject(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!teacherChoice}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Simpan</span>
            </button>
          </div>
        }
      >
        <div>
          <label htmlFor="asg-teacher" className="block text-xs font-medium text-ink mb-1">
            Pilih Guru
          </label>
          <select
            id="asg-teacher"
            value={teacherChoice}
            onChange={(e) => setTeacherChoice(e.target.value)}
            className={selectClass}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {`${t.name}${
                  editingSubject && t.subjectIds.includes(editingSubject.id) ? ' (sesuai mapel)' : ''
                }${t.status === 'cuti' ? ' (Cuti)' : ''}`}
              </option>
            ))}
          </select>
        </div>
        <p className="rounded-xl bg-page p-3 text-xs text-muted leading-relaxed">
          Guru bertanda "(sesuai mapel)" tercatat mengampu mata pelajaran ini pada data master guru.
          Bobot penilaian yang sudah diatur tetap dipertahankan saat guru pengampu diubah.
        </p>
      </BottomSheet>
    </div>
  );
};

export default ManageAssignmentsPage;
