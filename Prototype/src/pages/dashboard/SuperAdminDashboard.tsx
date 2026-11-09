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
  Users,
  UserCheck,
  School,
  Award,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  calculateAttendanceRecap,
  compareStudentPeriods,
  evaluateStudentsNeedingAttention,
  getStudentPeriodAverage,
  round1,
} from '../../utils/academicRules';
import { AttentionBadge, TrendBadge } from '../../components/ui/CommonUI';

export const SuperAdminDashboard: React.FC = () => {
  const {
    students,
    teachers,
    classes,
    subjects,
    grades,
    attendanceSessions,
    periods,
    selectedPeriodId,
  } = useAcademic();

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

  // School-wide metrics for selectedPeriodId
  const schoolMetrics = useMemo(() => {
    const studentAvgs: number[] = [];
    let totalHadir = 0;
    let totalMeetings = 0;

    let countRising = 0;
    let countStable = 0;
    let countDeclining = 0;
    let countInsufficient = 0;

    let rangeExcellent = 0; // >= 85
    let rangeGood = 0; // 75 - 84.9
    let rangeThreshold = 0; // 72 - 74.9
    let rangeBelow = 0; // < 72

    for (const student of students) {
      const avgObj = getStudentPeriodAverage(
        student.id,
        selectedPeriodId,
        grades
      );
      if (avgObj.average !== null) {
        studentAvgs.push(avgObj.average);
        if (avgObj.average >= 85) rangeExcellent += 1;
        else if (avgObj.average >= 75) rangeGood += 1;
        else if (avgObj.average >= 72) rangeThreshold += 1;
        else rangeBelow += 1;
      }

      const att = calculateAttendanceRecap(
        student.id,
        selectedPeriodId,
        attendanceSessions
      );
      totalHadir += att.hadir;
      totalMeetings += att.totalMeetings;

      const comp = compareStudentPeriods(
        student.id,
        selectedPeriodId,
        periods,
        grades
      );
      if (comp.status === 'meningkat') countRising += 1;
      else if (comp.status === 'stabil') countStable += 1;
      else if (comp.status === 'menurun') countDeclining += 1;
      else countInsufficient += 1;
    }

    const schoolAverage =
      studentAvgs.length > 0
        ? round1(studentAvgs.reduce((a, b) => a + b, 0) / studentAvgs.length)
        : null;

    const schoolAttendance =
      totalMeetings > 0 ? round1((totalHadir / totalMeetings) * 100) : null;

    return {
      schoolAverage,
      schoolAttendance,
      trends: {
        meningkat: countRising,
        stabil: countStable,
        menurun: countDeclining,
        belumCukup: countInsufficient,
      },
      ranges: [
        {
          label: 'Sangat Baik (≥ 85)',
          count: rangeExcellent,
          barColor: 'bg-success',
          badgeClass: 'bg-success-bg text-success border-success-border',
        },
        {
          label: 'Baik (75 – 84,9)',
          count: rangeGood,
          barColor: 'bg-primary',
          badgeClass: 'bg-secondary text-primary border-light-blue',
        },
        {
          label: 'Batas Pemantauan (72 – 74,9)',
          count: rangeThreshold,
          barColor: 'bg-warning',
          badgeClass: 'bg-warning-bg text-warning border-warning-border',
        },
        {
          label: 'Di Bawah Ambang (< 72)',
          count: rangeBelow,
          barColor: 'bg-danger',
          badgeClass: 'bg-danger-bg text-danger border-danger-border',
        },
      ],
    };
  }, [students, selectedPeriodId, grades, attendanceSessions, periods]);

  // Multi-period chart data across Sem 1 - Sem 4
  const periodChartData = useMemo(() => {
    return sortedPeriods.map((period) => {
      const allAvgs: number[] = [];
      const classMap: Record<string, number | null> = {};

      for (const cls of classes) {
        const classStudents = students.filter((s) => s.classId === cls.id);
        const clsAvgs: number[] = [];
        for (const st of classStudents) {
          const avg = getStudentPeriodAverage(st.id, period.id, grades).average;
          if (avg !== null) {
            clsAvgs.push(avg);
            allAvgs.push(avg);
          }
        }
        classMap[cls.name] =
          clsAvgs.length > 0
            ? round1(clsAvgs.reduce((a, b) => a + b, 0) / clsAvgs.length)
            : null;
      }

      const schoolAvg =
        allAvgs.length > 0
          ? round1(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length)
          : null;

      return {
        periodCode: period.code,
        periodName: `Sem ${period.order}`,
        Sekolah: schoolAvg,
        ...classMap,
      };
    });
  }, [sortedPeriods, classes, students, grades]);

  // Class summaries for selectedPeriodId
  const classSummaries = useMemo(() => {
    return classes.map((cls) => {
      const homeroom = teachers.find((t) => t.id === cls.homeroomTeacherId);
      const clsStudents = students.filter((s) => s.classId === cls.id);
      const avgs: number[] = [];
      let hadir = 0;
      let meetings = 0;

      for (const st of clsStudents) {
        const avg = getStudentPeriodAverage(
          st.id,
          selectedPeriodId,
          grades
        ).average;
        if (avg !== null) avgs.push(avg);
        const att = calculateAttendanceRecap(
          st.id,
          selectedPeriodId,
          attendanceSessions
        );
        hadir += att.hadir;
        meetings += att.totalMeetings;
      }

      const avgScore =
        avgs.length > 0
          ? round1(avgs.reduce((a, b) => a + b, 0) / avgs.length)
          : null;
      const attendancePct =
        meetings > 0 ? round1((hadir / meetings) * 100) : null;

      return {
        cls,
        homeroomName: homeroom?.name || 'Belum ditentukan',
        studentCount: clsStudents.length,
        avgScore,
        attendancePct,
      };
    });
  }, [classes, teachers, students, selectedPeriodId, grades, attendanceSessions]);

  // Students needing attention across school
  const attentionList = useMemo(
    () =>
      evaluateStudentsNeedingAttention(
        students,
        classes,
        periods,
        subjects,
        grades,
        attendanceSessions,
        selectedPeriodId
      ),
    [
      students,
      classes,
      periods,
      subjects,
      grades,
      attendanceSessions,
      selectedPeriodId,
    ]
  );

  const masterLinks = [
    {
      label: 'Data Siswa',
      count: `${students.length} Siswa`,
      to: '/siswa',
      icon: Users,
    },
    {
      label: 'Data Guru',
      count: `${teachers.length} Guru`,
      to: '/admin/guru',
      icon: UserCheck,
    },
    {
      label: 'Data Kelas',
      count: `${classes.length} Kelas`,
      to: '/admin/kelas',
      icon: School,
    },
    {
      label: 'Mata Pelajaran',
      count: `${subjects.length} Mapel`,
      to: '/admin/mapel',
      icon: BookOpen,
    },
    {
      label: 'Periode Akademik',
      count: `${periods.length} Semester`,
      to: '/admin/periode',
      icon: Calendar,
    },
    {
      label: 'Penugasan Guru',
      count: 'Distribusi Ampu',
      to: '/admin/penugasan',
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner Identity */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
              Dashboard Pengelola Akademik Sekolah
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-ink mt-2">
              Ringkasan Akademik SMPN Satu Atap 1 Bangodua
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Periode pantauan aktif: {selectedPeriod?.name} — Tahun Ajaran{' '}
              {selectedPeriod?.academicYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/analisis"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Analisis Sekolah</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid - Mobile First 2-col, Desktop 5-col */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Total Siswa</span>
            <Users className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {students.length}
          </p>
          <p className="text-xs text-muted mt-1">
            Aktif di {classes.length} kelas
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Total Guru</span>
            <UserCheck className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {teachers.length}
          </p>
          <p className="text-xs text-muted mt-1">
            Pengajar & wali kelas
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Total Kelas</span>
            <School className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {classes.length}
          </p>
          <p className="text-xs text-muted mt-1">
            {classes.map((c) => c.name).join(', ')}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Rata-Rata Sekolah</span>
            <Award className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {schoolMetrics.schoolAverage !== null
              ? schoolMetrics.schoolAverage
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Skala 0–100 ({selectedPeriod?.code})
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kehadiran Sekolah</span>
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {schoolMetrics.schoolAttendance !== null
              ? `${schoolMetrics.schoolAttendance}%`
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Target kehadiran ≥ 85%
          </p>
        </div>
      </div>

      {/* Chart + Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Multi-period Academic Trend Chart */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <span>Perkembangan Rata-Rata Nilai Lintas Periode</span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Perbandingan capaian rata-rata sekolah dan per kelas dari Semester 1 hingga Semester 4
              </p>
            </div>
          </div>

          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={periodChartData}
                margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="periodName"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#CBD5E1"
                />
                <YAxis
                  domain={[65, 95]}
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
                  dataKey="Sekolah"
                  name="Rata-Rata Sekolah"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563EB' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="IX-A"
                  name="Kelas IX-A"
                  stroke="#15803D"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="IX-B"
                  name="Kelas IX-B"
                  stroke="#B45309"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="VIII-A"
                  name="Kelas VIII-A"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 mt-2 border-t border-border text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              Rata-Rata Sekolah
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              Kelas IX-A
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
              Kelas IX-B
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" />
              Kelas VIII-A
            </span>
          </div>
        </div>

        {/* Distribusi Capaian Akademik */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">
              Distribusi Capaian Akademik Siswa
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Sebaran rentang rata-rata nilai dan arah perkembangan siswa pada {selectedPeriod?.name}
            </p>

            <div className="space-y-3 mt-4">
              {schoolMetrics.ranges.map((item) => {
                const pct =
                  students.length > 0
                    ? Math.round((item.count / students.length) * 100)
                    : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{item.label}</span>
                      <span className="text-muted tabular-nums">
                        {item.count} siswa ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-page overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-semibold text-ink mb-2.5">
              Ringkasan Arah Perubahan Nilai Antarperiode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-page p-2.5 flex items-center justify-between">
                <TrendBadge status="meningkat" size="sm" />
                <span className="text-sm font-bold text-ink tabular-nums">
                  {schoolMetrics.trends.meningkat}
                </span>
              </div>
              <div className="rounded-xl bg-page p-2.5 flex items-center justify-between">
                <TrendBadge status="stabil" size="sm" />
                <span className="text-sm font-bold text-ink tabular-nums">
                  {schoolMetrics.trends.stabil}
                </span>
              </div>
              <div className="rounded-xl bg-page p-2.5 flex items-center justify-between">
                <TrendBadge status="menurun" size="sm" />
                <span className="text-sm font-bold text-ink tabular-nums">
                  {schoolMetrics.trends.menurun}
                </span>
              </div>
              <div className="rounded-xl bg-page p-2.5 flex items-center justify-between">
                <TrendBadge status="belum_cukup_data" size="sm" />
                <span className="text-sm font-bold text-ink tabular-nums">
                  {schoolMetrics.trends.belumCukup}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Kelas Section */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-ink">
              Rekapitulasi Capaian per Kelas ({selectedPeriod?.code})
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Ringkasan wali kelas, jumlah siswa, rata-rata nilai, dan tingkat kehadiran tiap rombongan belajar
            </p>
          </div>
          <Link
            to="/siswa"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-secondary text-primary text-xs font-medium hover:bg-light-blue transition-colors self-start sm:self-auto"
          >
            <span>Lihat Semua Siswa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {classSummaries.map((item) => (
            <div
              key={item.cls.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-page transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-bold">
                    Kelas {item.cls.name}
                  </span>
                  <span className="text-xs text-muted">
                    Ruang {item.cls.roomNumber} / Tingkat {item.cls.gradeLevel}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink">
                  Wali Kelas: {item.homeroomName}
                </p>
              </div>

              <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6">
                <div className="bg-page sm:bg-transparent rounded-xl p-2 sm:p-0">
                  <p className="text-xs text-muted">Siswa</p>
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {item.studentCount} Siswa
                  </p>
                </div>
                <div className="bg-page sm:bg-transparent rounded-xl p-2 sm:p-0">
                  <p className="text-xs text-muted">Rata-Rata Nilai</p>
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {item.avgScore !== null ? item.avgScore : '-'}
                  </p>
                </div>
                <div className="bg-page sm:bg-transparent rounded-xl p-2 sm:p-0">
                  <p className="text-xs text-muted">Kehadiran</p>
                  <p className="text-sm font-bold text-ink tabular-nums">
                    {item.attendancePct !== null
                      ? `${item.attendancePct}%`
                      : '-'}
                  </p>
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                  <Link
                    to={`/siswa?classId=${item.cls.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-page hover:bg-secondary text-primary text-xs font-medium transition-colors"
                  >
                    <span>Inspeksi Kelas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan Siswa Memerlukan Pemantauan */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <h3 className="text-base font-bold text-ink">
                Siswa yang Memerlukan Pemantauan ({attentionList.length} Siswa)
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Deteksi otomatis berdasarkan penurunan nilai, nilai di bawah ambang batas, kehadiran rendah, atau data belum lengkap
            </p>
          </div>
          <Link
            to="/perhatian"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <span>Buka Halaman Evaluasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border">
          {attentionList.slice(0, 5).map((item) => (
            <div
              key={item.student.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-ink">
                    {item.student.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-page text-muted text-xs font-medium">
                    Kelas {item.className}
                  </span>
                  <AttentionBadge label={item.primaryLabel} />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {item.triggers.map((t) => t.title).join(' — ')}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted">Rata-Rata / Kehadiran</p>
                  <p className="text-xs font-semibold text-ink tabular-nums">
                    Nilai {item.averageScore ?? '-'} / Hadir{' '}
                    {item.attendancePercentage !== null
                      ? `${item.attendancePercentage}%`
                      : '-'}
                  </p>
                </div>
                <Link
                  to={`/monitoring/${item.student.id}`}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-medium transition-colors"
                >
                  <span>Detail Monitoring</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Grid to Pengelolaan Data Master Sekolah */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            Pengelolaan Data Master Sekolah
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Akses cepat administrasi data pokok akademik SMPN Satu Atap 1 Bangodua
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {masterLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-3.5 flex flex-col justify-between min-h-[96px] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <p className="text-xs sm:text-sm font-bold text-ink leading-snug">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{item.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
