import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, Info, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademic } from '../../context/AcademicContext';
import { calculateAttendanceRecap, DEMO_THRESHOLDS, round1 } from '../../utils/academicRules';
import { AttendanceSession, Student } from '../../types/academic';
import { EmptyState, PageHeader, SimulationDisclaimerBanner } from '../../components/ui/CommonUI';

const selectClass =
  'w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors';

const pctColor = (pct: number | null): string => {
  if (pct === null) return 'text-muted';
  if (pct >= DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT) return 'text-success';
  if (pct >= 75) return 'text-warning';
  return 'text-danger';
};

const pctBadge = (pct: number | null): string => {
  if (pct === null) return 'bg-page text-muted border-border';
  if (pct >= DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT)
    return 'bg-success-bg text-success border-success-border';
  if (pct >= 75) return 'bg-warning-bg text-warning border-warning-border';
  return 'bg-danger-bg text-danger border-danger-border';
};

const barFill = (pct: number): string => {
  if (pct >= DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT) return 'var(--color-success)';
  if (pct >= 75) return 'var(--color-warning)';
  return 'var(--color-danger)';
};

const formatPct = (pct: number | null) => (pct !== null ? `${pct}%` : 'Data belum tersedia');

const classAverage = (
  list: Student[],
  periodId: string,
  sessions: AttendanceSession[],
  subjectId: string
): number | null => {
  const values = list
    .map((s) => calculateAttendanceRecap(s.id, periodId, sessions, subjectId).percentage)
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
};

export const AttendanceRecapPage: React.FC = () => {
  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    students,
    attendanceSessions,
  } = useAcademic();

  const isPersonal = currentUser?.role === 'siswa' || currentUser?.role === 'wali_murid';
  const ownStudent = isPersonal
    ? students.find((s) => s.id === currentUser?.studentId)
    : undefined;

  const [classFilter, setClassFilter] = useState<string>(
    () => currentUser?.classId || classes[0]?.id || ''
  );
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const classId = isPersonal ? ownStudent?.classId || currentUser?.classId || '' : classFilter;
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods]);
  const selectedClass = classes.find((c) => c.id === classId);

  const classSessions = useMemo(
    () => attendanceSessions.filter((s) => s.classId === classId),
    [attendanceSessions, classId]
  );

  const sessionCount = classSessions.filter(
    (s) =>
      s.periodId === selectedPeriodId &&
      (subjectFilter === 'ALL' || s.subjectId === subjectFilter)
  ).length;

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name)),
    [students, classId]
  );

  const visibleStudents = isPersonal ? (ownStudent ? [ownStudent] : []) : classStudents;

  const rows = useMemo(
    () =>
      visibleStudents.map((student) => ({
        student,
        recap: calculateAttendanceRecap(student.id, selectedPeriodId, classSessions, subjectFilter),
      })),
    [visibleStudents, selectedPeriodId, classSessions, subjectFilter]
  );

  const classRecaps = useMemo(
    () =>
      classStudents.map(
        (s) => calculateAttendanceRecap(s.id, selectedPeriodId, classSessions, subjectFilter).percentage
      ),
    [classStudents, selectedPeriodId, classSessions, subjectFilter]
  );
  const validPcts = classRecaps.filter((v): v is number => v !== null);
  const avgPct =
    validPcts.length > 0 ? round1(validPcts.reduce((a, b) => a + b, 0) / validPcts.length) : null;
  const aboveCount = validPcts.filter((v) => v >= DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT).length;
  const belowCount = validPcts.length - aboveCount;

  const chartData = useMemo(
    () =>
      sortedPeriods
        .map((p) => ({
          label: `Sem ${p.order}`,
          name: p.name,
          value: classAverage(classStudents, p.id, classSessions, subjectFilter),
        }))
        .filter((d): d is { label: string; name: string; value: number } => d.value !== null),
    [sortedPeriods, classStudents, classSessions, subjectFilter]
  );

  const subjectLabel =
    subjectFilter === 'ALL'
      ? 'Semua Mata Pelajaran'
      : subjects.find((s) => s.id === subjectFilter)?.name || '-';

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Rekapitulasi Presensi"
        subtitle={`Kelas ${selectedClass?.name || '-'} pada ${subjectLabel}`}
        showBack
      />

      <SimulationDisclaimerBanner compact />

      {/* Filter */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3">
        <div className={`grid grid-cols-1 gap-3 ${isPersonal ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          <div>
            <label htmlFor="recap-period" className="block text-xs font-medium text-muted mb-1">
              Periode
            </label>
            <select
              id="recap-period"
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
          {!isPersonal && (
            <div>
              <label htmlFor="recap-class" className="block text-xs font-medium text-muted mb-1">
                Kelas
              </label>
              <select
                id="recap-class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className={selectClass}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="recap-subject" className="block text-xs font-medium text-muted mb-1">
              Mata Pelajaran
            </label>
            <select
              id="recap-subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-page p-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-muted leading-relaxed">
            Persentase kehadiran dihitung dari (Jumlah Hadir ÷ Jumlah Pertemuan Tercatat) × 100%.
            Apabila belum terdapat pertemuan yang tercatat, sistem menampilkan status 'Data belum
            tersedia'.
          </p>
        </div>
      </section>

      {/* Ringkasan */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <CalendarCheck className="w-5 h-5 text-primary mb-2" aria-hidden="true" />
          <span className="text-xs text-muted block">Total Pertemuan Tercatat</span>
          <span className="text-xl font-bold text-ink tabular-nums">{sessionCount}</span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <TrendingUp className="w-5 h-5 text-primary mb-2" aria-hidden="true" />
          <span className="text-xs text-muted block">Rata-rata Kehadiran Kelas</span>
          <span
            className={`font-bold tabular-nums ${avgPct !== null ? 'text-xl' : 'text-sm'} ${pctColor(avgPct)}`}
          >
            {formatPct(avgPct)}
          </span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <UserCheck className="w-5 h-5 text-success mb-2" aria-hidden="true" />
          <span className="text-xs text-muted block">Siswa ≥ 85%</span>
          <span className="text-xl font-bold text-success tabular-nums">{aboveCount} Siswa</span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-danger mb-2" aria-hidden="true" />
          <span className="text-xs text-muted block">Siswa &lt; 85% (Perlu Perhatian)</span>
          <span className="text-xl font-bold text-danger tabular-nums">{belowCount} Siswa</span>
        </div>
      </section>

      {/* Grafik antarperiode */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-base font-bold text-ink">Perbandingan Kehadiran Antarperiode</h2>
          <p className="text-xs text-muted mt-0.5">
            Rata-rata kehadiran Kelas {selectedClass?.name || '-'} pada {subjectLabel}
          </p>
        </div>
        {chartData.length === 0 ? (
          <p className="rounded-xl bg-page p-3 text-sm text-muted">Data belum tersedia</p>
        ) : (
          <div style={{ height: Math.max(chartData.length * 40 + 40, 120) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={52}
                  tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Rata-rata Kehadiran']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {chartData.map((d) => (
                    <Cell key={d.label} fill={barFill(d.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Daftar siswa */}
      {sessionCount === 0 ? (
        <EmptyState
          title="Belum Ada Pertemuan Tercatat"
          description="Belum terdapat sesi presensi untuk kombinasi periode, kelas, dan mata pelajaran yang dipilih. Data belum tersedia."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Data Siswa Tidak Ditemukan"
          description="Tidak ada data siswa pada kelas yang dipilih."
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink">Rekap Kehadiran per Siswa</h2>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {rows.map(({ student, recap }) => (
              <Link
                key={student.id}
                to={`/monitoring/${student.id}`}
                className="bg-surface border border-border rounded-2xl p-4 space-y-3 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink truncate">{student.name}</h3>
                    <p className="text-xs text-muted tabular-nums">NIS {student.nis}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium tabular-nums whitespace-nowrap ${pctBadge(recap.percentage)}`}
                  >
                    {formatPct(recap.percentage)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-page p-2.5 text-center">
                  {[
                    ['H', recap.hadir],
                    ['S', recap.sakit],
                    ['I', recap.izin],
                    ['A', recap.alpa],
                    ['Total', recap.totalMeetings],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-xs text-muted block">{label}</span>
                      <span className="text-sm font-bold text-ink tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Lihat pemantauan siswa
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-page text-xs text-muted">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nama Siswa</th>
                  <th className="text-left font-medium px-4 py-3">NIS</th>
                  <th className="text-center font-medium px-3 py-3">H</th>
                  <th className="text-center font-medium px-3 py-3">S</th>
                  <th className="text-center font-medium px-3 py-3">I</th>
                  <th className="text-center font-medium px-3 py-3">A</th>
                  <th className="text-center font-medium px-3 py-3">Total</th>
                  <th className="text-right font-medium px-4 py-3">Persentase</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, recap }) => (
                  <tr key={student.id} className="border-t border-border hover:bg-page transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">{student.name}</td>
                    <td className="px-4 py-3 text-muted tabular-nums">{student.nis}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{recap.hadir}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{recap.sakit}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{recap.izin}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{recap.alpa}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{recap.totalMeetings}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${pctColor(recap.percentage)}`}>
                      {formatPct(recap.percentage)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/monitoring/${student.id}`}
                        className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl text-xs font-medium text-primary hover:bg-secondary transition-colors"
                      >
                        Detail
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AttendanceRecapPage;
