import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Edit3,
  FileSpreadsheet,
  Info,
  Phone,
  School,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  CLUSTER_LABELS,
  calculateAttendanceRecap,
  compareStudentPeriods,
  getStudentPeriodAverage,
  getSubjectComparisonsForStudent,
} from '../../utils/academicRules';
import {
  BottomSheet,
  EmptyState,
  PageHeader,
  TrendBadge,
} from '../../components/ui/CommonUI';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const {
    currentUser,
    students,
    classes,
    teachers,
    subjects,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    grades,
    attendanceSessions,
    updateStudent,
  } = useAcademic();

  const resolvedId = studentId || currentUser?.studentId || 'stu-1';
  const student =
    students.find((s) => s.id === resolvedId) || students[0];

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNis, setEditNis] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editGender, setEditGender] = useState<'L' | 'P'>('L');
  const [editClassId, setEditClassId] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editDemoNote, setEditDemoNote] = useState('');

  useEffect(() => {
    if (student) {
      setEditName(student.name);
      setEditNis(student.nis);
      setEditNisn(student.nisn);
      setEditGender(student.gender);
      setEditClassId(student.classId);
      setEditBirthDate(student.birthDate);
      setEditParentName(student.parentName);
      setEditParentPhone(student.parentPhone);
      setEditDemoNote(student.demoPatternNote);
    }
  }, [student]);

  if (!student) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Detail Profil Siswa"
          subtitle="Data siswa tidak ditemukan"
          showBack
          backTo="/siswa"
        />
        <EmptyState
          title="Siswa Tidak Ditemukan"
          description="Data siswa yang Anda cari tidak tersedia pada direktori simulasi."
        />
      </div>
    );
  }

  const schoolClass = classes.find((c) => c.id === student.classId);
  const homeroomTeacher = teachers.find(
    (t) => t.id === schoolClass?.homeroomTeacherId
  );
  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];

  const periodAvg = getStudentPeriodAverage(
    student.id,
    selectedPeriod.id,
    grades
  );
  const periodComparison = compareStudentPeriods(
    student.id,
    selectedPeriod.id,
    periods,
    grades
  );
  const attendanceRecap = calculateAttendanceRecap(
    student.id,
    selectedPeriod.id,
    attendanceSessions
  );
  const subjectItems = getSubjectComparisonsForStudent(
    student.id,
    selectedPeriod.id,
    periods,
    subjects,
    grades
  );

  const completedSubjectCount = subjectItems.filter((s) => s.isComplete).length;
  const totalSubjectCount = subjects.length;

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editNis.trim()) return;

    updateStudent({
      ...student,
      name: editName.trim(),
      nis: editNis.trim(),
      nisn: editNisn.trim(),
      gender: editGender,
      classId: editClassId,
      birthDate: editBirthDate,
      parentName: editParentName.trim(),
      parentPhone: editParentPhone.trim(),
      demoPatternNote: editDemoNote.trim(),
    });
    setIsEditSheetOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Profil & Ringkasan Akademik Siswa"
        subtitle={`Identitas lengkap dan capaian ${student.name} pada ${selectedPeriod.name} (${selectedPeriod.academicYear})`}
        showBack
        backTo="/siswa"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Pilih periode akademik"
              value={selectedPeriod.id}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-border text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-primary transition-colors"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.academicYear})
                </option>
              ))}
            </select>

            {currentUser?.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => setIsEditSheetOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ubah Biodata</span>
              </button>
            )}
          </div>
        }
      />

      {/* Prominent Navigation Cards to Academic Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Link
          to={`/nilai/${student.id}`}
          className="min-h-[44px] bg-surface border border-border hover:border-primary rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Rincian Komponen Nilai
              </p>
              <p className="text-xs text-muted mt-0.5">
                Nilai Tugas, UTS, UAS & bobot 100%
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-muted group-hover:text-primary shrink-0 transition-colors"
            aria-hidden="true"
          />
        </Link>

        <Link
          to={`/monitoring/${student.id}`}
          className="min-h-[44px] bg-surface border border-border hover:border-primary rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Monitoring Perkembangan Akademik
              </p>
              <p className="text-xs text-muted mt-0.5">
                Grafik tren antarperiode & evaluasi
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-muted group-hover:text-primary shrink-0 transition-colors"
            aria-hidden="true"
          />
        </Link>

        <Link
          to={`/rekomendasi/${student.id}`}
          className="min-h-[44px] bg-surface border border-border hover:border-primary rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Rekomendasi Pendidikan Lanjutan SMA/SMK
              </p>
              <p className="text-xs text-muted mt-0.5">
                Analisis rumpun mapel & arah studi
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-5 h-5 text-muted group-hover:text-primary shrink-0 transition-colors"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Summary Metrics for Selected Period */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Ringkasan Capaian Akademik ({selectedPeriod.name})
            </h2>
            <p className="text-xs text-muted">
               Tahun Ajaran {selectedPeriod.academicYear} — Semester {selectedPeriod.semesterType}
            </p>
          </div>
          <TrendBadge
            status={periodComparison.status}
            delta={periodComparison.delta}
            size="md"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <p className="text-xs text-muted">Rata-rata Nilai</p>
            <p className="text-lg sm:text-xl font-bold text-ink tabular-nums">
              {periodAvg.average !== null ? periodAvg.average : 'Belum Lengkap'}
            </p>
            <p className="text-xs text-muted">
              {periodComparison.previousScore !== null
                ? `Periode lalu: ${periodComparison.previousScore}`
                : 'Belum ada pembanding'}
            </p>
          </div>

          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <p className="text-xs text-muted">Status Perkembangan</p>
            <p className="text-sm sm:text-base font-bold text-ink">
              {periodComparison.status === 'meningkat'
                ? 'Meningkat'
                : periodComparison.status === 'menurun'
                ? 'Menurun'
                : periodComparison.status === 'stabil'
                ? 'Stabil'
                : 'Data Belum Cukup'}
            </p>
            <p className="text-xs text-muted tabular-nums">
              {periodComparison.delta !== null
                ? `Selisih ${periodComparison.delta >= 0 ? `+${periodComparison.delta}` : periodComparison.delta} poin`
                : 'Menunggu kelengkapan nilai'}
            </p>
          </div>

          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <p className="text-xs text-muted">Persentase Kehadiran</p>
            <p className="text-lg sm:text-xl font-bold text-ink tabular-nums">
              {attendanceRecap.percentage !== null
                ? `${attendanceRecap.percentage}%`
                : 'Data belum tersedia'}
            </p>
            <p className="text-xs text-muted tabular-nums">
              {attendanceRecap.totalMeetings > 0
                ? `${attendanceRecap.hadir} hadir dari ${attendanceRecap.totalMeetings} pertemuan`
                : 'Belum ada sesi tercatat'}
            </p>
          </div>

          <div className="rounded-xl bg-page p-3.5 space-y-1">
            <p className="text-xs text-muted">Kelengkapan Data Mapel</p>
            <p className="text-lg sm:text-xl font-bold text-ink tabular-nums">
              {completedSubjectCount}/{totalSubjectCount} Mapel
            </p>
            <p className="text-xs text-muted">
              {completedSubjectCount === totalSubjectCount
                ? 'Seluruh komponen lengkap'
                : `${totalSubjectCount - completedSubjectCount} mapel belum lengkap`}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-secondary p-3.5 flex items-start gap-2.5 text-xs sm:text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-ink leading-relaxed">
            <span className="font-semibold">Keterangan Aturan Evaluasi: </span>
            {periodComparison.ruleExplanation}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Student Biodata & 7 Subjects Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complete Student Profile */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-ink flex items-center justify-center font-bold text-lg shrink-0">
              {getInitials(student.name)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-secondary text-primary text-xs font-semibold">
                Kelas {schoolClass?.name || '-'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-ink mt-1 leading-snug">
                {student.name}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Tahun Masuk: {student.enrollmentYear}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Nomor Induk Siswa (NIS)</span>
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {student.nis}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Nomor Induk Siswa Nasional (NISN)</span>
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {student.nisn}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Jenis Kelamin</span>
              </span>
              <span className="font-semibold text-ink">
                {student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Tanggal Lahir</span>
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {student.birthDate}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <School className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Rombongan Kelas</span>
              </span>
              <span className="font-semibold text-ink">
                Kelas {schoolClass?.name || '-'} ({schoolClass?.roomNumber || '-'})
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Wali Kelas</span>
              </span>
              <span className="font-semibold text-ink text-right">
                {homeroomTeacher?.name || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Nama Orang Tua / Wali</span>
              </span>
              <span className="font-semibold text-ink text-right">
                {student.parentName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Kontak Wali Murid</span>
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {student.parentPhone}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="rounded-xl bg-page p-3.5 space-y-1">
              <p className="text-xs font-semibold text-primary">
                Catatan Karakteristik Data Demo Skripsi
              </p>
              <p className="text-xs sm:text-sm font-medium text-ink">
                {student.demoPatternNote}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quick List of All 7 Subjects */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Daftar Capaian 7 Mata Pelajaran
              </h3>
              <p className="text-xs text-muted">
                Perbandingan nilai akhir {selectedPeriod.name} terhadap periode sebelumnya
              </p>
            </div>
            <Link
              to={`/nilai/${student.id}`}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Buka Rincian Nilai</span>
            </Link>
          </div>

          <div className="divide-y divide-border">
            {subjectItems.map((sub) => (
              <div
                key={sub.subjectId}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-primary text-xs font-semibold">
                      {sub.subjectCode}
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {sub.subjectName}
                    </span>
                    {!sub.isComplete && (
                      <span className="px-2 py-0.5 rounded-md bg-warning-bg text-warning text-xs font-medium">
                        Belum Lengkap
                      </span>
                    )}
                    {sub.isComplete && (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Lengkap</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    Rumpun: {CLUSTER_LABELS[sub.cluster]} — Ambang pemantauan: {sub.threshold}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-left sm:text-right tabular-nums">
                    <div className="text-sm font-bold text-ink">
                      Nilai Kini:{' '}
                      <span className="text-base">
                        {sub.currentScore !== null ? sub.currentScore : '-'}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      Periode Lalu:{' '}
                      {sub.previousScore !== null ? sub.previousScore : '-'}
                    </div>
                  </div>
                  <TrendBadge status={sub.status} delta={sub.delta} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BottomSheet: Edit Student Biodata (Super Admin) */}
      <BottomSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        title="Ubah Biodata Siswa"
        subtitle={`Perbarui informasi identitas ${student.name}`}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditSheetOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-ink hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="edit-student-form"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        }
      >
        <form
          id="edit-student-form"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="edit-stu-name"
              className="block text-xs font-semibold text-ink mb-1"
            >
              Nama Lengkap Siswa
            </label>
            <input
              id="edit-stu-name"
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-stu-nis"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nomor Induk Siswa (NIS)
              </label>
              <input
                id="edit-stu-nis"
                type="text"
                required
                value={editNis}
                onChange={(e) => setEditNis(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="edit-stu-nisn"
                className="block text-xs font-semibold text-ink mb-1"
              >
                NISN
              </label>
              <input
                id="edit-stu-nisn"
                type="text"
                required
                value={editNisn}
                onChange={(e) => setEditNisn(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-stu-gender"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Jenis Kelamin
              </label>
              <select
                id="edit-stu-gender"
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'L' | 'P')}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-stu-class"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Rombongan Kelas
              </label>
              <select
                id="edit-stu-class"
                value={editClassId}
                onChange={(e) => setEditClassId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-stu-birthdate"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Tanggal Lahir
              </label>
              <input
                id="edit-stu-birthdate"
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="edit-stu-parent"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nama Orang Tua / Wali
              </label>
              <input
                id="edit-stu-parent"
                type="text"
                value={editParentName}
                onChange={(e) => setEditParentName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-stu-phone"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nomor Telepon Wali Murid
              </label>
              <input
                id="edit-stu-phone"
                type="text"
                value={editParentPhone}
                onChange={(e) => setEditParentPhone(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="edit-stu-note"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Catatan Pola Simulasi
              </label>
              <input
                id="edit-stu-note"
                type="text"
                value={editDemoNote}
                onChange={(e) => setEditDemoNote(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
export default StudentDetailPage;
