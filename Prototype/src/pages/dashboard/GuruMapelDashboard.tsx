import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  BookOpen,
  Award,
  CheckCircle2,
  CalendarCheck,
  FileEdit,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  calculateAttendanceRecap,
  evaluateStudentsNeedingAttention,
  getStudentPeriodAverage,
  round1,
} from '../../utils/academicRules';
import { AttentionBadge } from '../../components/ui/CommonUI';

export const GuruMapelDashboard: React.FC = () => {
  const {
    currentUser,
    teachers,
    subjects,
    classes,
    assignments,
    students,
    grades,
    attendanceSessions,
    periods,
    selectedPeriodId,
  } = useAcademic();

  const activeTeacher = useMemo(
    () =>
      teachers.find((t) => t.id === currentUser?.teacherId) ||
      teachers.find((t) => t.id === 'tch-3') ||
      teachers[0],
    [teachers, currentUser?.teacherId]
  );

  const taughtSubjects = useMemo(() => {
    const assignedIds = new Set<string>(activeTeacher?.subjectIds || []);
    assignments
      .filter(
        (a) =>
          a.teacherId === activeTeacher?.id && a.periodId === selectedPeriodId
      )
      .forEach((a) => assignedIds.add(a.subjectId));

    const matched = subjects.filter((s) => assignedIds.has(s.id));
    return matched.length > 0 ? matched : [subjects[0]];
  }, [activeTeacher, assignments, selectedPeriodId, subjects]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => taughtSubjects[0]?.id || 'sub-mtk'
  );

  const activeSubject = useMemo(
    () =>
      taughtSubjects.find((s) => s.id === selectedSubjectId) ||
      taughtSubjects[0] ||
      subjects[0],
    [taughtSubjects, selectedSubjectId, subjects]
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

  // Classes taught by this teacher for the active subject (fallback to all classes if none explicitly matched)
  const taughtClasses = useMemo(() => {
    const classIds = new Set(
      assignments
        .filter(
          (a) =>
            a.teacherId === activeTeacher?.id &&
            a.subjectId === activeSubject.id &&
            a.periodId === selectedPeriodId
        )
        .map((a) => a.classId)
    );
    const matched = classes.filter((c) => classIds.has(c.id));
    return matched.length > 0 ? matched : classes;
  }, [assignments, activeTeacher?.id, activeSubject.id, selectedPeriodId, classes]);

  const taughtClassIds = useMemo(
    () => new Set(taughtClasses.map((c) => c.id)),
    [taughtClasses]
  );

  const relevantStudents = useMemo(
    () => students.filter((s) => taughtClassIds.has(s.classId)),
    [students, taughtClassIds]
  );

  // Subject Assessment & Attendance Metrics for selectedPeriodId
  const subjectMetrics = useMemo(() => {
    const completedScores: number[] = [];
    let completeCount = 0;
    let incompleteCount = 0;
    let totalHadir = 0;
    let totalMeetings = 0;

    for (const student of relevantStudents) {
      const rec = grades.find(
        (g) =>
          g.studentId === student.id &&
          g.subjectId === activeSubject.id &&
          g.periodId === selectedPeriodId
      );

      if (rec && rec.isComplete && rec.finalScore !== null) {
        completeCount += 1;
        completedScores.push(rec.finalScore);
      } else {
        incompleteCount += 1;
      }

      const att = calculateAttendanceRecap(
        student.id,
        selectedPeriodId,
        attendanceSessions,
        activeSubject.id
      );
      totalHadir += att.hadir;
      totalMeetings += att.totalMeetings;
    }

    const averageScore =
      completedScores.length > 0
        ? round1(
            completedScores.reduce((a, b) => a + b, 0) / completedScores.length
          )
        : null;

    const attendancePct =
      totalMeetings > 0 ? round1((totalHadir / totalMeetings) * 100) : null;

    return {
      averageScore,
      completeCount,
      incompleteCount,
      totalStudents: relevantStudents.length,
      attendancePct,
    };
  }, [relevantStudents, grades, activeSubject.id, selectedPeriodId, attendanceSessions]);

  // Chart 1: Average Score per Class for Active Subject
  const classBarData = useMemo(() => {
    return taughtClasses.map((cls) => {
      const clsStudents = students.filter((s) => s.classId === cls.id);
      const scores: number[] = [];
      let complete = 0;

      for (const st of clsStudents) {
        const avgObj = getStudentPeriodAverage(
          st.id,
          selectedPeriodId,
          grades,
          activeSubject.id
        );
        if (avgObj.average !== null) {
          scores.push(avgObj.average);
          complete += 1;
        }
      }

      const avg =
        scores.length > 0
          ? round1(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      return {
        className: `Kelas ${cls.name}`,
        shortName: cls.name,
        RataRata: avg,
        Ambang: activeSubject.monitoringThreshold,
        lengkap: `${complete}/${clsStudents.length}`,
      };
    });
  }, [taughtClasses, students, selectedPeriodId, grades, activeSubject]);

  // Chart 2: Multi-period Subject Trend across Sem 1 - Sem 4
  const periodTrendData = useMemo(() => {
    return sortedPeriods.map((period) => {
      const scores: number[] = [];
      for (const st of relevantStudents) {
        const avg = getStudentPeriodAverage(
          st.id,
          period.id,
          grades,
          activeSubject.id
        ).average;
        if (avg !== null) scores.push(avg);
      }
      return {
        periodLabel: `Sem ${period.order}`,
        NilaiMapel:
          scores.length > 0
            ? round1(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null,
        Ambang: activeSubject.monitoringThreshold,
      };
    });
  }, [sortedPeriods, relevantStudents, grades, activeSubject]);

  // Students needing evaluation in this subject
  const subjectAttentionList = useMemo(() => {
    const allForSubject = evaluateStudentsNeedingAttention(
      relevantStudents,
      classes,
      periods,
      subjects,
      grades,
      attendanceSessions,
      selectedPeriodId,
      { subjectId: activeSubject.id }
    );
    return allForSubject;
  }, [
    relevantStudents,
    classes,
    periods,
    subjects,
    grades,
    attendanceSessions,
    selectedPeriodId,
    activeSubject.id,
  ]);

  return (
    <div className="space-y-5">
      {/* Teacher Identity & Subject Selector Header */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
                Dashboard Guru Mata Pelajaran
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-page text-muted text-xs font-medium">
                NIP: {activeTeacher?.nip}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-ink">
              {currentUser?.name || activeTeacher?.name}
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Mengampu: {taughtSubjects.map((s) => s.name).join(' & ')} — Kelas{' '}
              {taughtClasses.map((c) => c.name).join(', ')} ({selectedPeriod?.code})
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-muted">
              Mata Pelajaran Aktif:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {taughtSubjects.map((sub) => {
                const isSelected = sub.id === activeSubject.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-ink border-primary'
                        : 'bg-page text-ink border-border hover:bg-secondary'
                    }`}
                  >
                    {sub.name} ({sub.code})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Prominent Mobile-First Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-4 border-t border-border">
          <Link
            to="/nilai"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
          >
            <FileEdit className="w-4 h-4 shrink-0" />
            <span>Input & Kelola Nilai ({activeSubject.code})</span>
          </Link>
          <Link
            to="/presensi"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-secondary hover:bg-light-blue text-primary border border-light-blue text-sm font-semibold transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Input Presensi Kelas</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Rata-Rata Mapel</span>
            <Award className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {subjectMetrics.averageScore !== null
              ? subjectMetrics.averageScore
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Ambang pantau: {activeSubject.monitoringThreshold}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Nilai Lengkap</span>
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {subjectMetrics.completeCount}/{subjectMetrics.totalStudents}
          </p>
          <p className="text-xs text-muted mt-1">
            {subjectMetrics.incompleteCount > 0
              ? `${subjectMetrics.incompleteCount} siswa belum lengkap`
              : 'Seluruh nilai lengkap'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kehadiran Mapel</span>
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {subjectMetrics.attendancePct !== null
              ? `${subjectMetrics.attendancePct}%`
              : '-'}
          </p>
          <p className="text-xs text-muted mt-1">
            Rata-rata hadir pertemuan
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">Kelas Diajar</span>
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink mt-2 tabular-nums">
            {taughtClasses.length} Kelas
          </p>
          <p className="text-xs text-muted mt-1">
            {taughtClasses.map((c) => c.name).join(', ')}
          </p>
        </div>
      </div>

      {/* Charts Row: Average per Class & Multi-Period Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BarChart: Rata-rata Nilai per Kelas */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              <span>Rata-Rata Nilai {activeSubject.name} per Kelas</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Perbandingan capaian kelas yang diajar pada {selectedPeriod?.name}
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classBarData}
                margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="className"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#CBD5E1"
                />
                <YAxis
                  domain={[0, 100]}
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
                <Bar
                  dataKey="RataRata"
                  name={`Rata-Rata ${activeSubject.code}`}
                  fill="#2563EB"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-border">
            {classBarData.map((d) => (
              <div key={d.shortName} className="rounded-xl bg-page p-2.5">
                <p className="text-xs text-muted">{d.className}</p>
                <p className="text-sm font-bold text-ink tabular-nums mt-0.5">
                  {d.RataRata || '-'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Lengkap {d.lengkap}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* LineChart: Perkembangan Nilai Lintas Periode */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span>Tren Nilai {activeSubject.name} Lintas Semester</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Perkembangan rata-rata nilai dari Semester 1 hingga Semester 4
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={periodTrendData}
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
                  dataKey="NilaiMapel"
                  name={`Rata-Rata ${activeSubject.name}`}
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563EB' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Ambang"
                  name={`Ambang Pantau (${activeSubject.monitoringThreshold})`}
                  stroke="#B91C1C"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 mt-2 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Bobot Standar: Tugas {activeSubject.defaultWeights.tugas}% / UTS{' '}
              {activeSubject.defaultWeights.uts}% / UAS{' '}
              {activeSubject.defaultWeights.uas}%
            </span>
            <Link
              to="/nilai/bobot"
              className="text-primary font-semibold hover:underline"
            >
              Atur Bobot Penilaian
            </Link>
          </div>
        </div>
      </div>

      {/* Daftar Siswa yang Perlu Evaluasi pada Mata Pelajaran Ini */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <h3 className="text-base font-bold text-ink">
                Siswa Perlu Evaluasi — {activeSubject.name} (
                {subjectAttentionList.length} Siswa)
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Siswa dengan penurunan nilai, capaian di bawah ambang ({activeSubject.monitoringThreshold}), kehadiran rendah, atau komponen nilai belum lengkap
            </p>
          </div>
          <Link
            to="/perhatian"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-medium transition-colors self-start sm:self-auto"
          >
            <span>Lihat Halaman Evaluasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {subjectAttentionList.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-ink">
              Tidak ada siswa yang memerlukan evaluasi khusus pada {activeSubject.name}
            </p>
            <p className="text-xs text-muted mt-1">
              Seluruh nilai telah melampaui ambang batas pemantauan dan komponen penilaian telah lengkap.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {subjectAttentionList.map((item) => (
              <div
                key={item.student.id}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
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
                    {item.triggers.map((t) => t.detail).join(' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/nilai/${item.student.id}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-medium transition-colors"
                  >
                    <span>Input/Edit Nilai</span>
                  </Link>
                  <Link
                    to={`/monitoring/${item.student.id}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-medium transition-colors"
                  >
                    <span>Monitoring</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
