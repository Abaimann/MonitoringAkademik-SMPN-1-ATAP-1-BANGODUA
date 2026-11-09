import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarCheck,
  Compass,
  FileCheck2,
  GraduationCap,
  Info,
  Layers,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademic } from '../../context/AcademicContext';
import {
  CLUSTER_LABELS,
  buildContinuationProfile,
  calculateAttendanceRecap,
  compareStudentPeriods,
} from '../../utils/academicRules';
import {
  EmptyState,
  PageHeader,
  SimulationDisclaimerBanner,
  TrendBadge,
} from '../../components/ui/CommonUI';

export const ContinuationRecommendationPage: React.FC = () => {
  const { studentId: paramStudentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();

  const {
    currentUser,
    students,
    classes,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    subjects,
    grades,
    attendanceSessions,
  } = useAcademic();

  const [classFilter, setClassFilter] = useState<string>('ALL');

  const defaultStudentId = useMemo(() => {
    if (paramStudentId && students.some((s) => s.id === paramStudentId)) {
      return paramStudentId;
    }
    if (
      currentUser?.studentId &&
      students.some((s) => s.id === currentUser.studentId)
    ) {
      return currentUser.studentId;
    }
    if (currentUser?.classId) {
      const firstInClass = students.find(
        (s) => s.classId === currentUser.classId
      );
      if (firstInClass) return firstInClass.id;
    }
    return students[0]?.id || '';
  }, [paramStudentId, currentUser, students]);

  const [selectedStudentId, setSelectedStudentId] =
    useState<string>(defaultStudentId);

  useEffect(() => {
    if (paramStudentId && students.some((s) => s.id === paramStudentId)) {
      setSelectedStudentId(paramStudentId);
    } else if (
      currentUser?.studentId &&
      (currentUser.role === 'siswa' || currentUser.role === 'wali_murid')
    ) {
      setSelectedStudentId(currentUser.studentId);
    }
  }, [paramStudentId, currentUser, students]);

  const filteredStudents = useMemo(() => {
    if (classFilter === 'ALL') return students;
    return students.filter((s) => s.classId === classFilter);
  }, [students, classFilter]);

  const selectedStudent = useMemo(
    () =>
      students.find((s) => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0],
    [students, selectedStudentId, filteredStudents]
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedStudent?.classId),
    [classes, selectedStudent]
  );

  const currentPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      periods[periods.length - 1],
    [periods, selectedPeriodId]
  );

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.order - b.order),
    [periods]
  );

  const profile = useMemo(() => {
    if (!selectedStudent || !currentPeriod) return null;
    return buildContinuationProfile(
      selectedStudent.id,
      currentPeriod.id,
      periods,
      subjects,
      grades,
      attendanceSessions
    );
  }, [
    selectedStudent,
    currentPeriod,
    periods,
    subjects,
    grades,
    attendanceSessions,
  ]);

  const periodComparison = useMemo(() => {
    if (!selectedStudent || !currentPeriod) return null;
    return compareStudentPeriods(
      selectedStudent.id,
      currentPeriod.id,
      periods,
      grades
    );
  }, [selectedStudent, currentPeriod, periods, grades]);

  const attendanceRecap = useMemo(() => {
    if (!selectedStudent || !currentPeriod) return null;
    return calculateAttendanceRecap(
      selectedStudent.id,
      currentPeriod.id,
      attendanceSessions
    );
  }, [selectedStudent, currentPeriod, attendanceSessions]);

  const handleSelectStudent = (newStudentId: string) => {
    setSelectedStudentId(newStudentId);
    if (paramStudentId) {
      navigate(`/rekomendasi/${newStudentId}`, { replace: true });
    }
  };

  const handleClassFilterChange = (newClassId: string) => {
    setClassFilter(newClassId);
    const list =
      newClassId === 'ALL'
        ? students
        : students.filter((s) => s.classId === newClassId);
    if (list.length > 0 && !list.some((s) => s.id === selectedStudentId)) {
      handleSelectStudent(list[0].id);
    }
  };

  if (!selectedStudent || !profile || !periodComparison || !attendanceRecap) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Rekomendasi Pendidikan Lanjutan (SMA / SMK)"
          subtitle="Analisis pendukung keputusan studi lanjut berbasis profil akademik dan rumpun mata pelajaran"
        />
        <EmptyState
          title="Data Siswa Tidak Ditemukan"
          description="Silakan pilih siswa terlebih dahulu untuk menampilkan profil rekomendasi pendidikan lanjutan SMA dan SMK."
        />
      </div>
    );
  }

  const chartData = profile.clusterScores.map((item, index) => ({
    name: item.label,
    shortName:
      item.cluster === 'sains_teknologi'
        ? 'Sains & Logika'
        : item.cluster === 'sosial_humaniora'
        ? 'Sosial & IPS'
        : item.cluster === 'bahasa_komunikasi'
        ? 'Bahasa & Literasi'
        : 'Terapan & Prakarya',
    score: item.average ?? 0,
    isTop: index === 0,
    subjectsText: item.subjects.join(', '),
  }));

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Rekomendasi Pendidikan Lanjutan (SMA / SMK)"
        subtitle="Pemetaan berbasis aturan (rule-based) dari profil akademik lintas semester dan kelompok mata pelajaran"
        showBack={Boolean(paramStudentId)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/siswa/${selectedStudent.id}`}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-border text-ink hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
            >
              <UserCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Profil & Rapor Siswa</span>
            </Link>
            <Link
              to="/grafik"
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Grafik Antarperiode</span>
            </Link>
          </div>
        }
      />

      <SimulationDisclaimerBanner text="Mode Simulasi Skripsi: Pemetaan SMA dan SMK disajikan secara setara berdasarkan kecenderungan rumpun mata pelajaran terkuat tanpa mendikotomikan nilai tinggi ke SMA maupun nilai rendah ke SMK." />

      {/* Panel Pemilihan Siswa & Periode Evaluasi */}
      <section
        aria-label="Pemilihan Siswa dan Periode"
        className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Filter Siswa & Periode Evaluasi
              </h2>
              <p className="text-xs text-muted">
                Pilih siswa untuk menguji bagaimana pemetaan rumpun SMA dan SMK menyesuaikan kekuatan nilai mata pelajaran
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium self-start sm:self-auto">
            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
            <span>Metode: Rule-Based Pemetaan Rumpun</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="rekom-class-filter"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Filter Kelas
            </label>
            <select
              id="rekom-class-filter"
              value={classFilter}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} — Tingkat {cls.gradeLevel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rekom-student-select"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Pilih Siswa
            </label>
            <select
              id="rekom-student-select"
              value={selectedStudent.id}
              onChange={(e) => handleSelectStudent(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
            >
              {filteredStudents.map((stu) => {
                const cls = classes.find((c) => c.id === stu.classId);
                return (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} — Kelas {cls?.name || '-'} (NIS: {stu.nis})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="rekom-period-select"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Periode Akademik Acuan
            </label>
            <select
              id="rekom-period-select"
              value={currentPeriod.id}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            >
              {sortedPeriods.map((per) => (
                <option key={per.id} value={per.id}>
                  {per.name} ({per.academicYear} — {per.semesterType})
                  {per.isActive ? ' [Aktif]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ringkasan Identitas Siswa Terpilih */}
        <div className="rounded-xl bg-secondary p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-ink">
                {selectedStudent.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-light-blue text-primary text-xs font-medium">
                Kelas {selectedClass?.name || '-'}
              </span>
              <span className="text-xs text-muted tabular-nums">
                NIS: {selectedStudent.nis} / NISN: {selectedStudent.nisn}
              </span>
            </div>
            <p className="text-xs text-muted">
              Karakteristik Data Simulasi:{' '}
              <span className="font-medium text-ink">
                {selectedStudent.demoPatternNote}
              </span>
            </p>
          </div>
          <div className="text-xs text-muted sm:text-right">
            <span>Wali Murid: </span>
            <span className="font-medium text-ink">
              {selectedStudent.parentName}
            </span>
          </div>
        </div>
      </section>

      {/* BAGIAN A — PROFIL AKADEMIK */}
      <section
        aria-labelledby="section-a-heading"
        className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-start gap-3 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="section-a-heading"
              className="text-base sm:text-lg font-bold text-ink"
            >
              Bagian A — Profil Akademik Siswa
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Ringkasan capaian nilai periode aktif, perkembangan antarperiode, mata pelajaran terkuat, serta presensi pendukung
            </p>
          </div>
        </div>

        {/* 3 Indikator Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Rata-rata nilai periode aktif */}
          <div className="rounded-xl bg-page p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                Rata-Rata Nilai ({currentPeriod.name})
              </span>
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
                {profile.overallAverage !== null
                  ? profile.overallAverage
                  : 'Belum Lengkap'}
              </span>
              {profile.overallAverage !== null && (
                <span className="text-xs text-muted">skala 0–100</span>
              )}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {periodComparison.previousPeriodName
                ? `Periode sebelumnya (${periodComparison.previousPeriodName}): ${
                    periodComparison.previousScore !== null
                      ? periodComparison.previousScore
                      : 'Belum lengkap'
                  }`
                : 'Merupakan periode awal pemantauan akademik.'}
            </p>
          </div>

          {/* 2. Perkembangan akademik antarperiode */}
          <div className="rounded-xl bg-page p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                Perkembangan Antarperiode
              </span>
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="pt-0.5">
              <TrendBadge
                status={profile.trendStatus}
                delta={periodComparison.delta}
                size="md"
              />
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {periodComparison.ruleExplanation}
            </p>
          </div>

          {/* 3. Ringkasan presensi sebagai informasi pendukung */}
          <div className="rounded-xl bg-page p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                Ringkasan Presensi (Pendukung)
              </span>
              <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
                {attendanceRecap.percentage !== null
                  ? `${attendanceRecap.percentage}%`
                  : 'Data belum tersedia'}
              </span>
              {attendanceRecap.percentage !== null && (
                <span className="text-xs text-muted">kehadiran</span>
              )}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {attendanceRecap.totalMeetings > 0
                ? `Hadir ${attendanceRecap.hadir} dari ${attendanceRecap.totalMeetings} pertemuan (Sakit: ${attendanceRecap.sakit}, Izin: ${attendanceRecap.izin}, Alpa: ${attendanceRecap.alpa}).`
                : 'Belum ada pertemuan presensi tercatat pada periode ini.'}
            </p>
          </div>
        </div>

        {/* 4. Mata Pelajaran dengan Capaian Relatif Kuat */}
        <div className="pt-2 border-t border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h3 className="text-sm font-bold text-ink">
              Mata Pelajaran dengan Capaian Relatif Kuat (Lintas Periode)
            </h3>
            <span className="text-xs text-muted">
              3 mata pelajaran dengan rata-rata historis tertinggi sebagai dasar pemetaan rumpun
            </span>
          </div>

          {profile.strongSubjects.length === 0 ? (
            <div className="rounded-xl bg-warning-bg border border-warning-border p-3.5 text-xs text-warning">
              Data nilai akhir mata pelajaran pada siswa ini belum lengkap sehingga daftar mata pelajaran terkuat belum dapat ditampilkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile.strongSubjects.map((sub, idx) => (
                <div
                  key={sub.subjectId}
                  className="rounded-xl bg-secondary p-3.5 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-light-blue text-primary text-xs font-semibold">
                         Capaian #{idx + 1}
                      </span>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {sub.score}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-ink">
                      {sub.subjectName}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    Rumpun: {CLUSTER_LABELS[sub.cluster]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BAGIAN B — PERTIMBANGAN PENDIDIKAN LANJUTAN (DUA KARTU SETARA: SMA & SMK) */}
      <section
        aria-labelledby="section-b-heading"
        className="space-y-3.5"
      >
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="section-b-heading"
                  className="text-base sm:text-lg font-bold text-ink"
                >
                  Bagian B — Pertimbangan Pendidikan Lanjutan (SMA & SMK Setara)
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-0.5">
                  Kedua jalur pendidikan di bawah ini disajikan secara sejajar. Penentuan jalur tidak didasarkan pada peringkat nilai tinggi atau rendah, melainkan keselarasan rumpun keilmuan dengan tujuan studi siswa.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Kartu 1: SMA */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {profile.smaConsiderations.title}
                    </h3>
                    <span className="text-xs text-primary font-medium">
                      Opsi Pendidikan Menengah Umum (Setara)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium shrink-0">
                  Jalur Akademik
                </span>
              </div>

              <div className="rounded-xl bg-page p-3.5">
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  {profile.smaConsiderations.generalExplanation}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Fokus Rumpun Mata Pelajaran SMA yang Relevan:
                </h4>
                <ul className="space-y-2">
                  {profile.smaConsiderations.relevantClusters.map(
                    (clusterItem, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5 text-xs sm:text-sm text-ink"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-ink text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="font-medium leading-snug">
                          {clusterItem}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-muted">
                Dasar Pertimbangan Data Akademik Siswa:
              </h4>
              <ul className="space-y-1.5">
                {profile.smaConsiderations.academicBasis.map((basis, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">—</span>
                    <span>{basis}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kartu 2: SMK */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {profile.smkConsiderations.title}
                    </h3>
                    <span className="text-xs text-primary font-medium">
                      Opsi Pendidikan Menengah Kejuruan (Setara)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium shrink-0">
                  Jalur Vokasi
                </span>
              </div>

              <div className="rounded-xl bg-page p-3.5">
                <p className="text-xs sm:text-sm text-ink leading-relaxed">
                  {profile.smkConsiderations.generalExplanation}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-ink">
                  Bidang Keahlian SMK yang Relevan:
                </h4>
                <ul className="space-y-2">
                  {profile.smkConsiderations.relevantFields.map(
                    (fieldItem, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5 text-xs sm:text-sm text-ink"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-ink text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="font-medium leading-snug">
                          {fieldItem}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <h4 className="text-xs font-bold text-muted">
                Dasar Pertimbangan Data Akademik Siswa:
              </h4>
              <ul className="space-y-1.5">
                {profile.smkConsiderations.academicBasis.map((basis, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">—</span>
                    <span>{basis}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BAGIAN C — REKOMENDASI BERBASIS PROFIL AKADEMIK & PEMETAAN RUMPUN MATA PELAJARAN */}
      <section
        aria-labelledby="section-c-heading"
        className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-start gap-3 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="section-c-heading"
              className="text-base sm:text-lg font-bold text-ink"
            >
              Bagian C — Rekomendasi Berbasis Profil Akademik & Pemetaan Rumpun Mata Pelajaran
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Perbandingan rata-rata 4 rumpun mata pelajaran beserta penalaran transparan berbasis aturan (tanpa kecerdasan buatan / AI)
            </p>
          </div>
        </div>

        {/* Visualisasi Grafik Bar Horizontal Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-6 rounded-xl bg-page p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-ink">
                Grafik Perbandingan Rata-Rata Rumpun Akademik
              </h3>
              <span className="text-xs text-muted">Skala 0–100</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 38, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={112}
                    tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}`, 'Rata-Rata Rumpun']}
                    labelFormatter={(label) => `Rumpun: ${label}`}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={26}>
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.isTop ? '#2563EB' : '#60A5FA'}
                      />
                    ))}
                    <LabelList
                      dataKey="score"
                      position="right"
                      style={{
                        fill: '#1E293B',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail Rincian 4 Rumpun */}
          <div className="lg:col-span-6 space-y-2.5">
            {profile.clusterScores.map((item, idx) => (
              <div
                key={item.cluster}
                className={`rounded-xl p-3.5 space-y-1.5 ${
                  idx === 0 ? 'bg-secondary' : 'bg-page'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-primary text-primary-ink'
                          : 'bg-light-blue text-primary'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-ink truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-primary tabular-nums shrink-0">
                    {item.average !== null ? item.average : '-'}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Komponen Mata Pelajaran:{' '}
                  <span className="text-ink font-medium">
                    {item.subjects.length > 0
                      ? item.subjects.join(', ')
                      : 'Belum ada data nilai lengkap'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Penalaran Narasi Rule-Based */}
        <div className="rounded-xl bg-secondary p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-ink">
              Penjelasan Pemetaan Profil Akademik (Rule-Based Reasoning)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-ink leading-relaxed">
            {profile.narrativeReasoning}
          </p>
        </div>
      </section>

      {/* BAGIAN D — CATATAN PENTING (WAJIB DITAMPILKAN VERBATIM) */}
      <section
        aria-labelledby="section-d-heading"
        className="bg-warning-bg border border-warning-border rounded-2xl p-4 sm:p-5 space-y-2"
      >
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 text-warning shrink-0" />
          <h2
            id="section-d-heading"
            className="text-sm sm:text-base font-bold text-warning"
          >
            Bagian D — Catatan Penting
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed">
          Rekomendasi ini merupakan informasi pendukung berdasarkan hasil monitoring akademik. Pemilihan pendidikan lanjutan tetap perlu mempertimbangkan minat, bakat, tujuan pendidikan, dan diskusi dengan orang tua maupun pihak sekolah.
        </p>
      </section>
    </div>
  );
};

export default ContinuationRecommendationPage;
