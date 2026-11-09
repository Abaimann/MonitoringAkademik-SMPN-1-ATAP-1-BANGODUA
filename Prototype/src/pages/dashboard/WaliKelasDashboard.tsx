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
  Award,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  GraduationCap,
  LineChart as LineChartIcon,
  ClipboardCheck,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  DEMO_THRESHOLDS,
  calculateAttendanceRecap,
  compareStudentPeriods,
  evaluateStudentsNeedingAttention,
  getStudentPeriodAverage,
  round1,
} from '../../utils/academicRules';
import { TrendBadge } from '../../components/ui/CommonUI';

export const WaliKelasDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    students,
    periods,
    subjects,
    grades,
    attendanceSessions,
    selectedPeriodId,
    switchHomeroomClassContext,
  } = useAcademic();

  const activeClass = useMemo(
    () =>
      classes.find((c) => c.id === currentUser?.classId) ||
      classes[0],
    [classes, currentUser?.classId]
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

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === activeClass.id),
    [students, activeClass.id]
  );

  // Class KPIs & Student Lists
  const classAnalytics = useMemo(() => {
    const scoreAvgs: number[] = [];
    let totalHadir = 0;
    let totalMeetings = 0;

    const decliningStudents: {
      studentId: string;
      name: string;
      nis: string;
      previousScore: number | null;
      currentScore: number | null;
      delta: number | null;
    }[] = [];

    const lowAttendanceStudents: {
      studentId: string;
      name: string;
      nis: string;
      percentage: number;
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
      totalMeetings: number;
    }[] = [];

    for (const student of classStudents) {
      const avgRes = getStudentPeriodAverage(
        student.id,
        selectedPeriodId,
        grades
      );
      if (avgRes.average !== null) {
        scoreAvgs.push(avgRes.average);
      }

      const att = calculateAttendanceRecap(
        student.id,
        selectedPeriodId,
        attendanceSessions
      );
      totalHadir += att.hadir;
      totalMeetings += att.totalMeetings;

      if (
        att.percentage !== null &&
        att.percentage < DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT
      ) {
        lowAttendanceStudents.push({
          studentId: student.id,
          name: student.name,
          nis: student.nis,
          percentage: att.percentage,
          hadir: att.hadir,
          sakit: att.sakit,
          izin: att.izin,
          alpa: att.alpa,
          totalMeetings: att.totalMeetings,
        });
      }

      const comp = compareStudentPeriods(
        student.id,
        selectedPeriodId,
        periods,
        grades
      );

      // Include students whose overall average dropped or status is menurun
      if (
        comp.status === 'menurun' ||
        (comp.delta !== null && comp.delta < 0)
      ) {
        decliningStudents.push({
          studentId: student.id,
          name: student.name,
          nis: student.nis,
          previousScore: comp.previousScore,
          currentScore: comp.currentScore,
          delta: comp.delta,
        });
      }
    }

    decliningStudents.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    const classAverage =
      scoreAvgs.length > 0
        ? round1(scoreAvgs.reduce((a, b) => a + b, 0) / scoreAvgs.length)
        : null;

    const classAttendance =
      totalMeetings > 0 ? round1((totalHadir / totalMeetings) * 100) : null;

    const attentionItems = evaluateStudentsNeedingAttention(
      students,
      classes,
      periods,
      subjects,
      grades,
      attendanceSessions,
      selectedPeriodId,
      { classId: activeClass.id }
    );

    return {
      classAverage,
      classAttendance,
      decliningStudents,
      lowAttendanceStudents,
      attentionCount: attentionItems.length,
    };
  }, [
    classStudents,
    selectedPeriodId,
    grades,
    attendanceSessions,
    periods,
    students,
    classes,
    subjects,
    activeClass.id,
  ]);

  // Multi-semester class trend data (Sem 1 - Sem 4)
  const classTrendData = useMemo(() => {
    return sortedPeriods.map((period) => {
      const avgs: number[] = [];
      for (const st of classStudents) {
        const avg = getStudentPeriodAverage(st.id, period.id, grades).average;
        if (avg !== null) avgs.push(avg);
      }
      const avgScore =
        avgs.length > 0
          ? round1(avgs.reduce((a, b) => a + b, 0) / avgs.length)
          : null;
      return {
        periodCode: period.code,
        periodLabel: `Sem ${period.order}`,
        RataRataKelas: avgScore,
        AmbangPantau: DEMO_THRESHOLDS.SCORE_MONITORING_MIN,
      };
    });
  }, [sortedPeriods, classStudents, grades]);

  const shortcutCards = [
    {
      title: 'Daftar Siswa Kelas',
      description: `Lihat profil lengkap ${classStudents.length} siswa Kelas ${activeClass.name}`,
      to: '/siswa',
      icon: Users,
    },
    {
      title: 'Monitoring Perkembangan',
      description: 'Analisis perbandingan nilai antarperiode setiap siswa',
      to: '/monitoring',
      icon: LineChartIcon,
    },
    {
      title: 'Siswa Perlu Perhatian',
      description: `${classAnalytics.attentionCount} siswa memerlukan evaluasi wali kelas`,
      to: '/perhatian',
      icon: AlertTriangle,
    },
    {
      title: 'Rekomendasi SMA/SMK',
      description: 'Bahan pertimbangan studi lanjutan berbasis kekuatan nilai',
      to: '/rekomendasi',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting & Homeroom Identity Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
              Dashboard Wali Kelas — Kelas {activeClass.name}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-ink mt-2">
              Selamat bertugas, {currentUser?.name}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Wali Kelas {activeClass.name} (Ruang {activeClass.roomNumber}) —{' '}
              {selectedPeriod?.name}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label htmlFor="homeroom-class-select" className="sr-only">
              Pilih Kelas Pantauan
            </label>
            <select
              id="homeroom-class-select"
              value={activeClass.id}
              onChange={(e) => switchHomeroomClassContext(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-xs sm:text-sm font-medium text-ink focus:outline-none focus:border-primary"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Simulasi Kelas: {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2-Column Mobile Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Jumlah Siswa</span>
            <Users className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {classStudents.length}
          </p>
          <p className="text-xs text-muted mt-1">
            Siswa aktif Kelas {activeClass.name}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Rata-Rata Kelas</span>
            <Award className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {classAnalytics.classAverage !== null
              ? classAnalytics.classAverage
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Periode {selectedPeriod?.code}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kehadiran Kelas</span>
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {classAnalytics.classAttendance !== null
              ? `${classAnalytics.classAttendance}%`
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Ambang pantau 85%
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Perlu Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {classAnalytics.attentionCount}
          </p>
          <p className="text-xs text-muted mt-1">
            Siswa perlu evaluasi
          </p>
        </div>
      </div>

      {/* Grafik Perkembangan Akademik Kelas Sem 1 - Sem 4 */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span>Grafik Perkembangan Akademik Kelas {activeClass.name}</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Tren rata-rata nilai kelas dari Semester 1 hingga Semester 4 dibandingkan ambang batas pemantauan (72)
            </p>
          </div>
          <Link
            to="/monitoring"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-secondary text-primary text-xs font-medium hover:bg-light-blue transition-colors self-start sm:self-auto"
          >
            <span>Monitoring Kelas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={classTrendData}
              margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="periodLabel"
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
                dataKey="RataRataKelas"
                name={`Rata-Rata Kelas ${activeClass.name}`}
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

      {/* Two Actionable Lists: Declining Scores & Low Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daftar Siswa dengan Perubahan Nilai Menurun */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-danger shrink-0" />
                  <span>Siswa dengan Perubahan Nilai Menurun</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Perbandingan rata-rata nilai terhadap semester sebelumnya
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-danger-bg text-danger border border-danger-border text-xs font-bold tabular-nums">
                {classAnalytics.decliningStudents.length} Siswa
              </span>
            </div>

            {classAnalytics.decliningStudents.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-ink">
                  Tidak ada penurunan nilai rata-rata pada periode ini
                </p>
                <p className="text-xs text-muted mt-1">
                  Seluruh siswa di Kelas {activeClass.name} mempertahankan atau meningkatkan rata-rata nilai.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {classAnalytics.decliningStudents.map((item) => (
                  <div
                    key={item.studentId}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5 tabular-nums">
                        NIS {item.nis} — Nilai {item.previousScore ?? '-'} ke{' '}
                        {item.currentScore ?? '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TrendBadge status="menurun" delta={item.delta} />
                      <Link
                        to={`/monitoring/${item.studentId}`}
                        className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-medium transition-colors"
                      >
                        <span>Pantau</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 sm:px-5 bg-page border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              Evaluasi rincian per mata pelajaran
            </span>
            <Link
              to="/perhatian"
              className="inline-flex items-center gap-1 min-h-[44px] px-2 text-xs font-semibold text-primary hover:underline"
            >
              <span>Lihat Semua Evaluasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Daftar Siswa dengan Tingkat Kehadiran Memerlukan Perhatian */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-warning shrink-0" />
                  <span>Kehadiran Memerlukan Perhatian (&lt; 85%)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Siswa dengan persentase hadir di bawah batas pantauan 85%
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-warning-bg text-warning border border-warning-border text-xs font-bold tabular-nums">
                {classAnalytics.lowAttendanceStudents.length} Siswa
              </span>
            </div>

            {classAnalytics.lowAttendanceStudents.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-ink">
                  Kehadiran seluruh siswa di atas 85%
                </p>
                <p className="text-xs text-muted mt-1">
                  Tidak ada siswa di Kelas {activeClass.name} dengan tingkat kehadiran rendah pada periode ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {classAnalytics.lowAttendanceStudents.map((item) => (
                  <div
                    key={item.studentId}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted mt-0.5 tabular-nums">
                        Hadir {item.hadir}/{item.totalMeetings} (Sakit{' '}
                        {item.sakit}, Izin {item.izin}, Alpa {item.alpa})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                          item.percentage < 75
                            ? 'bg-danger-bg text-danger border-danger-border'
                            : 'bg-warning-bg text-warning border-warning-border'
                        }`}
                      >
                        {item.percentage}%
                      </span>
                      <Link
                        to={`/monitoring/${item.studentId}`}
                        className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-medium transition-colors"
                      >
                        <span>Detail</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 sm:px-5 bg-page border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              Rekapitulasi presensi pertemuan kelas
            </span>
            <Link
              to="/presensi/rekap"
              className="inline-flex items-center gap-1 min-h-[44px] px-2 text-xs font-semibold text-primary hover:underline"
            >
              <span>Buka Rekap Presensi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Shortcut Cards */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-ink">
            Pintasan Menu Wali Kelas
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Navigasi cepat pemantauan akademik dan pendidikan lanjutan siswa Kelas {activeClass.name}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shortcutCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="bg-surface border border-border hover:border-light-blue hover:bg-secondary/50 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-ink">{card.title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
