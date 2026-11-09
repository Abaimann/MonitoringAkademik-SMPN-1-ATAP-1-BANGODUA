import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  User,
  Award,
  CalendarCheck,
  TrendingUp,
  Star,
  BookOpen,
  GraduationCap,
  LineChart as LineChartIcon,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  CLUSTER_LABELS,
  DEMO_THRESHOLDS,
  calculateAttendanceRecap,
  compareStudentPeriods,
  generateDynamicMonitoringSummary,
  getStudentPeriodAverage,
  getSubjectComparisonsForStudent,
} from '../../utils/academicRules';
import { TrendBadge } from '../../components/ui/CommonUI';

export const SiswaWaliDashboard: React.FC = () => {
  const {
    currentUser,
    students,
    classes,
    periods,
    subjects,
    grades,
    attendanceSessions,
    selectedPeriodId,
    switchStudentContext,
  } = useAcademic();

  const isParent = currentUser?.role === 'wali_murid';

  const activeStudent = useMemo(
    () =>
      students.find((s) => s.id === currentUser?.studentId) ||
      students[0],
    [students, currentUser?.studentId]
  );

  const studentClass = useMemo(
    () => classes.find((c) => c.id === activeStudent.classId),
    [classes, activeStudent.classId]
  );

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.order - b.order),
    [periods]
  );

  const selectedPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      sortedPeriods[sortedPeriods.length - 1],
    [periods, selectedPeriodId, sortedPeriods]
  );

  // Period comparison for active student
  const periodComparison = useMemo(
    () =>
      compareStudentPeriods(
        activeStudent.id,
        selectedPeriodId,
        periods,
        grades
      ),
    [activeStudent.id, selectedPeriodId, periods, grades]
  );

  // Attendance recap for active student
  const attendanceRecap = useMemo(
    () =>
      calculateAttendanceRecap(
        activeStudent.id,
        selectedPeriodId,
        attendanceSessions
      ),
    [activeStudent.id, selectedPeriodId, attendanceSessions]
  );

  // Subject comparisons & Top 3 subjects in current semester
  const subjectComparisons = useMemo(
    () =>
      getSubjectComparisonsForStudent(
        activeStudent.id,
        selectedPeriodId,
        periods,
        subjects,
        grades
      ),
    [activeStudent.id, selectedPeriodId, periods, subjects, grades]
  );

  const topSubjects = useMemo(() => {
    return [...subjectComparisons]
      .filter((s) => s.currentScore !== null)
      .sort((a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0))
      .slice(0, 3);
  }, [subjectComparisons]);

  // Multi-semester chart data (Sem 1 - Sem 4)
  const semesterChartData = useMemo(() => {
    return sortedPeriods.map((period) => {
      const avgObj = getStudentPeriodAverage(
        activeStudent.id,
        period.id,
        grades
      );
      return {
        periodCode: period.code,
        periodLabel: `Sem ${period.order}`,
        NilaiRataRata: avgObj.average,
        AmbangPantau: DEMO_THRESHOLDS.SCORE_MONITORING_MIN,
      };
    });
  }, [sortedPeriods, activeStudent.id, grades]);

  // Dynamic Monitoring Summary narrative
  const monitoringSummary = useMemo(
    () =>
      generateDynamicMonitoringSummary(
        activeStudent.id,
        selectedPeriodId,
        periods,
        subjects,
        grades,
        attendanceSessions
      ),
    [
      activeStudent.id,
      selectedPeriodId,
      periods,
      subjects,
      grades,
      attendanceSessions,
    ]
  );

  return (
    <div className="space-y-5">
      {/* Greeting & Student Identity Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
                {isParent
                  ? 'Pantauan Akademik Putra/Putri Anda'
                  : 'Dashboard Capaian Akademik Siswa'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-page text-muted text-xs font-medium">
                Kelas {studentClass?.name || '-'} — {selectedPeriod?.code}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-ink">
              {isParent
                ? `Selamat datang, Bapak/Ibu ${activeStudent.parentName}`
                : `Halo, ${activeStudent.name}`}
            </h2>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {isParent ? (
                <>
                  Menampilkan perkembangan akademik siswa:{' '}
                  <strong className="text-ink font-semibold">
                    {activeStudent.name}
                  </strong>{' '}
                  (NIS: {activeStudent.nis} / NISN: {activeStudent.nisn})
                </>
              ) : (
                <>
                  NIS: {activeStudent.nis} / NISN: {activeStudent.nisn} — Tahun
                  Ajaran {selectedPeriod?.academicYear}
                </>
              )}
            </p>
          </div>

          {/* Demo Student Selector for Examiner Testing */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor="demo-student-selector"
              className="text-xs font-medium text-muted"
            >
              Simulasi Profil Siswa:
            </label>
            <select
              id="demo-student-selector"
              value={activeStudent.id}
              onChange={(e) => switchStudentContext(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-primary"
            >
              {students.map((st) => {
                const cls = classes.find((c) => c.id === st.classId);
                return (
                  <option key={st.id} value={st.id}>
                    {st.name} (Kelas {cls?.name}) — {st.demoPatternNote}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid for Student/Parent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Rata-Rata Nilai</span>
            <Award className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {periodComparison.currentScore !== null
              ? periodComparison.currentScore
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            {periodComparison.previousScore !== null
              ? `Sebelumnya: ${periodComparison.previousScore}`
              : 'Periode awal'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Perubahan Nilai</span>
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
          </div>
          <div className="mt-2">
            <TrendBadge
              status={periodComparison.status}
              delta={periodComparison.delta}
            />
          </div>
          <p className="text-xs text-muted mt-1.5">
            Dibanding semester lalu
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kehadiran</span>
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {attendanceRecap.percentage !== null
              ? `${attendanceRecap.percentage}%`
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1 tabular-nums">
            Hadir {attendanceRecap.hadir}/{attendanceRecap.totalMeetings} pertemuan
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kelas & Semester</span>
            <User className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2">
            {studentClass?.name || '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            {selectedPeriod?.name}
          </p>
        </div>
      </div>

      {/* Ringkasan Kondisi Akademik Dinamis */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-ink">
              Ringkasan Kondisi Akademik ({selectedPeriod?.code})
            </h3>
            <p className="text-xs sm:text-sm text-ink mt-1.5 leading-relaxed">
              {monitoringSummary.summaryText}
            </p>
            {monitoringSummary.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-border">
                {monitoringSummary.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-page px-3 py-2 text-xs font-medium text-ink"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart + Top 3 Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LineChart Perkembangan Nilai Sem 1 - Sem 4 */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <span>Grafik Perkembangan Nilai Rata-Rata</span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Perjalanan nilai rata-rata {activeStudent.name} dari Semester 1 hingga Semester 4
              </p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={semesterChartData}
                margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#CBD5E1"
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#CBD5E1"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="NilaiRataRata"
                  name="Rata-Rata Siswa"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563EB' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="AmbangPantau"
                  name="Ambang Pemantauan (72)"
                  stroke="#B91C1C"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Subjects in Current Semester */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Star className="w-4 h-4 text-primary shrink-0" />
              <span>Mata Pelajaran Capaian Terbaik</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              3 mata pelajaran dengan nilai tertinggi pada {selectedPeriod?.name}
            </p>

            {topSubjects.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-ink">
                  Data nilai lengkap belum tersedia
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {topSubjects.map((sub, index) => (
                  <div
                    key={sub.subjectId}
                    className="rounded-xl bg-page p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-secondary text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">
                          {sub.subjectName}
                        </p>
                        <p className="text-xs text-muted truncate mt-0.5">
                          {CLUSTER_LABELS[sub.cluster]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-primary tabular-nums">
                        {sub.currentScore}
                      </p>
                      {sub.delta !== null && (
                        <p className="text-xs text-muted tabular-nums">
                          {sub.delta >= 0 ? `+${sub.delta}` : sub.delta} poin
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              Lihat seluruh {subjects.length} mata pelajaran
            </span>
            <Link
              to="/nilai"
              className="inline-flex items-center gap-1 min-h-[44px] px-2 text-xs font-semibold text-primary hover:underline"
            >
              <span>Buka Rincian Nilai</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Prominent Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Link
          to={`/monitoring/${activeStudent.id}`}
          className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-ink flex items-center justify-center shrink-0">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-ink">
                Lihat Detail Perkembangan Akademik
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Analisis selisih nilai per mata pelajaran, grafik lintas periode, dan status perkembangan
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
        </Link>

        <Link
          to={`/rekomendasi/${activeStudent.id}`}
          className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-secondary text-primary border border-light-blue flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-ink">
                Informasi Rekomendasi Pendidikan Lanjutan SMA/SMK
              </h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Gambaran kekuatan rumpun mata pelajaran sebagai bahan pertimbangan studi lanjutan
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
        </Link>

        <Link
          to="/nilai"
          className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-4 flex items-center justify-between gap-3 min-h-[68px] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">
                Lihat Rincian Nilai Semester
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Komponen nilai Tugas, UTS, UAS, dan Nilai Akhir
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted shrink-0" />
        </Link>

        <Link
          to="/presensi"
          className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-4 flex items-center justify-between gap-3 min-h-[68px] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">
                Riwayat Kehadiran Siswa
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Rekapitulasi Hadir, Sakit, Izin, dan Alpa per pertemuan
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted shrink-0" />
        </Link>
      </div>
    </div>
  );
};
