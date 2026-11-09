import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  DEMO_THRESHOLDS,
  calculateAttendanceRecap,
  compareStudentPeriods,
  generateDynamicMonitoringSummary,
  getStudentPeriodAverage,
  getSubjectComparisonsForStudent,
  round1,
} from '../../utils/academicRules';
import {
  EmptyState,
  PageHeader,
  SimulationDisclaimerBanner,
  TrendBadge,
} from '../../components/ui/CommonUI';
import { AttendanceStatus } from '../../types/academic';

/* Chart palette mirrors the design tokens in index.css (Recharts needs literal values). */
const CHART = {
  primary: '#2563EB',
  accent: '#93C5FD',
  grid: '#E2E8F0',
  axis: '#64748B',
  danger: '#B91C1C',
  success: '#15803D',
  warning: '#B45309',
};

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  H: { label: 'Hadir', className: 'bg-success-bg text-success border-success-border' },
  S: { label: 'Sakit', className: 'bg-secondary text-primary border-light-blue' },
  I: { label: 'Izin', className: 'bg-warning-bg text-warning border-warning-border' },
  A: { label: 'Alpa', className: 'bg-danger-bg text-danger border-danger-border' },
};

const fmt = (v: number | null | undefined, suffix = '') =>
  v === null || v === undefined ? '—' : `${v}${suffix}`;

const SectionTitle: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-2.5 mb-3">
    <div className="w-8 h-8 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <h2 className="text-base font-bold text-ink leading-snug">{title}</h2>
      {subtitle && <p className="text-xs text-muted mt-0.5 leading-relaxed">{subtitle}</p>}
    </div>
  </div>
);

export const StudentMonitoringPage: React.FC = () => {
  const { studentId: paramId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    students,
    grades,
    attendanceSessions,
  } = useAcademic();

  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const isPersonal =
    currentUser?.role === 'siswa' || currentUser?.role === 'wali_murid';

  // Students the current role may pick from
  const selectableStudents = useMemo(() => {
    if (isPersonal) return students.filter((s) => s.id === currentUser?.studentId);
    if (currentUser?.role === 'wali_kelas' && currentUser.classId) {
      return students.filter((s) => s.classId === currentUser.classId);
    }
    return students;
  }, [students, currentUser, isPersonal]);

  const targetId = isPersonal
    ? currentUser?.studentId
    : paramId && selectableStudents.some((s) => s.id === paramId)
    ? paramId
    : selectableStudents[0]?.id;

  const student = students.find((s) => s.id === targetId);
  const schoolClass = classes.find((c) => c.id === student?.classId);
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.order - b.order),
    [periods]
  );
  const currentPeriod =
    sortedPeriods.find((p) => p.id === selectedPeriodId) ??
    sortedPeriods[sortedPeriods.length - 1];
  const currentIdx = sortedPeriods.findIndex((p) => p.id === currentPeriod?.id);
  const previousPeriod = currentIdx > 0 ? sortedPeriods[currentIdx - 1] : null;
  const subjectArg = subjectFilter === 'ALL' ? undefined : subjectFilter;
  const filteredSubject = subjects.find((s) => s.id === subjectFilter);

  const analysis = useMemo(() => {
    if (!student || !currentPeriod) return null;
    const stats = getStudentPeriodAverage(student.id, currentPeriod.id, grades);
    const comparison = compareStudentPeriods(
      student.id,
      currentPeriod.id,
      periods,
      grades,
      subjectArg
    );
    const overallComparison = compareStudentPeriods(
      student.id,
      currentPeriod.id,
      periods,
      grades
    );
    const attendance = calculateAttendanceRecap(
      student.id,
      currentPeriod.id,
      attendanceSessions
    );
    const prevAttendance = previousPeriod
      ? calculateAttendanceRecap(student.id, previousPeriod.id, attendanceSessions)
      : null;
    const summary = generateDynamicMonitoringSummary(
      student.id,
      currentPeriod.id,
      periods,
      subjects,
      grades,
      attendanceSessions
    );
    const subjectItems = getSubjectComparisonsForStudent(
      student.id,
      currentPeriod.id,
      periods,
      subjects,
      grades
    );

    const lineData = sortedPeriods.map((p) => ({
      name: `Sem ${p.order}`,
      nilai: getStudentPeriodAverage(student.id, p.id, grades, subjectArg).average,
    }));

    const scored = subjectItems
      .filter((s) => s.currentScore !== null)
      .sort((a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0));
    const barData = scored.map((s) => ({
      name: s.subjectCode,
      full: s.subjectName,
      nilai: s.currentScore as number,
      below: (s.currentScore as number) < s.threshold,
    }));

    const high = scored.slice(0, 2);
    const low = scored.length > 2 ? scored.slice(-2).reverse() : [];
    const rising = subjectItems
      .filter((s) => s.status === 'meningkat')
      .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
    const falling = subjectItems
      .filter((s) => s.status === 'menurun')
      .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));

    const history = attendanceSessions
      .filter((s) => s.periodId === currentPeriod.id && s.classId === student.classId)
      .map((s) => ({
        session: s,
        record: s.records.find((r) => r.studentId === student.id),
      }))
      .filter((x) => x.record)
      .sort((a, b) => b.session.date.localeCompare(a.session.date))
      .slice(0, 6);

    const attendanceDelta =
      attendance.percentage !== null && prevAttendance?.percentage != null
        ? round1(attendance.percentage - prevAttendance.percentage)
        : null;

    return {
      stats,
      comparison,
      overallComparison,
      attendance,
      prevAttendance,
      attendanceDelta,
      summary,
      subjectItems,
      lineData,
      barData,
      high,
      low,
      rising,
      falling,
      history,
    };
  }, [
    student,
    currentPeriod,
    previousPeriod,
    periods,
    sortedPeriods,
    subjects,
    grades,
    attendanceSessions,
    subjectArg,
  ]);

  if (!student || !analysis || !currentPeriod) {
    return (
      <div className="space-y-4">
        <PageHeader title="Monitoring Perkembangan Akademik" showBack backTo="/" />
        <EmptyState
          title="Data siswa tidak ditemukan"
          description="Siswa yang dipilih tidak tersedia pada data simulasi atau tidak termasuk dalam cakupan akses Anda."
          actionLabel="Kembali ke Beranda"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const {
    stats,
    comparison,
    overallComparison,
    attendance,
    prevAttendance,
    attendanceDelta,
    summary,
    subjectItems,
    lineData,
    barData,
    high,
    low,
    rising,
    falling,
    history,
  } = analysis;

  const completeCount = subjectItems.filter((s) => s.isComplete).length;
  const hasLineData = lineData.some((d) => d.nilai !== null);
  const initials = student.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const attendanceTone =
    attendance.percentage === null
      ? 'text-muted'
      : attendance.percentage >= DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT
      ? 'text-success'
      : attendance.percentage >= 75
      ? 'text-warning'
      : 'text-danger';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Monitoring Perkembangan Akademik"
        subtitle="Analisis perkembangan individual siswa berdasarkan data nilai dan presensi lintas periode."
        showBack
      />

      {/* Selector bar */}
      <div className="bg-surface border border-border rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {!isPersonal && (
          <div>
            <label htmlFor="mon-student" className="block text-xs font-medium text-muted mb-1">
              Siswa
            </label>
            <select
              id="mon-student"
              value={student.id}
              onChange={(e) => navigate(`/monitoring/${e.target.value}`)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-page border border-border text-sm text-ink"
            >
              {selectableStudents.map((s) => {
                const c = classes.find((x) => x.id === s.classId);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({c?.name})
                  </option>
                );
              })}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="mon-period" className="block text-xs font-medium text-muted mb-1">
            Periode evaluasi
          </label>
          <select
            id="mon-period"
            value={currentPeriod.id}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-page border border-border text-sm text-ink"
          >
            {sortedPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mon-subject" className="block text-xs font-medium text-muted mb-1">
            Mata pelajaran (grafik & perbandingan)
          </label>
          <select
            id="mon-subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-page border border-border text-sm text-ink"
          >
            <option value="ALL">Rata-rata seluruh mata pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 10.1 Profil monitoring */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-light-blue text-primary font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-ink leading-snug">{student.name}</h2>
            <p className="text-xs text-muted mt-0.5">
              Kelas {schoolClass?.name ?? '-'} / NIS {student.nis} / NISN {student.nisn}
            </p>
            <p className="text-xs text-muted">{currentPeriod.name}</p>
          </div>
          <TrendBadge status={overallComparison.status} delta={overallComparison.delta} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">Rata-rata nilai</div>
            <div className="text-xl font-bold text-ink tabular-nums mt-0.5">{fmt(stats.average)}</div>
            <div className="text-[11px] text-muted mt-0.5">
              Sebelumnya {fmt(overallComparison.previousScore)}
            </div>
          </div>
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">Tingkat kehadiran</div>
            <div className={`text-xl font-bold tabular-nums mt-0.5 ${attendanceTone}`}>
              {attendance.percentage !== null ? `${attendance.percentage}%` : '—'}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              {attendance.totalMeetings > 0
                ? `${attendance.hadir} dari ${attendance.totalMeetings} pertemuan`
                : 'Data belum tersedia'}
            </div>
          </div>
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">Mata pelajaran</div>
            <div className="text-xl font-bold text-ink tabular-nums mt-0.5">
              {completeCount}/{subjectItems.length}
            </div>
            <div className="text-[11px] text-muted mt-0.5">Nilai lengkap</div>
          </div>
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">Selisih antarperiode</div>
            <div
              className={`text-xl font-bold tabular-nums mt-0.5 ${
                overallComparison.delta === null
                  ? 'text-muted'
                  : overallComparison.status === 'meningkat'
                  ? 'text-success'
                  : overallComparison.status === 'menurun'
                  ? 'text-danger'
                  : 'text-primary'
              }`}
            >
              {overallComparison.delta === null
                ? '—'
                : overallComparison.delta > 0
                ? `+${overallComparison.delta}`
                : overallComparison.delta}
            </div>
            <div className="text-[11px] text-muted mt-0.5">poin rata-rata</div>
          </div>
        </div>
      </section>

      {/* 10.6 Ringkasan */}
      <section
        className={`rounded-2xl p-4 border ${
          summary.hasEnoughData ? 'bg-secondary border-light-blue' : 'bg-warning-bg border-warning-border'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles
            className={`w-4 h-4 ${summary.hasEnoughData ? 'text-primary' : 'text-warning'}`}
            aria-hidden="true"
          />
          <h2 className="text-base font-bold text-ink">Ringkasan Perkembangan Akademik</h2>
        </div>
        <p className="text-sm text-ink leading-relaxed">{summary.summaryText}</p>
        {summary.highlights.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {summary.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-xs text-muted">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted mt-3">
          Ringkasan disusun otomatis dengan aturan berbasis data simulasi, tanpa kecerdasan buatan.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 10.2 Line chart */}
        <section className="bg-surface border border-border rounded-2xl p-4 min-w-0">
          <SectionTitle
            icon={TrendingUp}
            title="Grafik Perkembangan Nilai"
            subtitle={filteredSubject ? filteredSubject.name : 'Rata-rata seluruh mata pelajaran'}
          />
          {hasLineData ? (
            <div className="h-56 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART.axis }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fontSize: 12, fill: CHART.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v) => [v ?? 'Belum lengkap', 'Nilai']}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
                  />
                  {filteredSubject && (
                    <ReferenceLine
                      y={filteredSubject.monitoringThreshold}
                      stroke={CHART.warning}
                      strokeDasharray="4 4"
                      label={{ value: 'Ambang', fontSize: 11, fill: CHART.warning, position: 'insideBottomRight' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="nilai"
                    stroke={CHART.primary}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: CHART.primary }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted py-8 text-center">Belum ada nilai lengkap untuk ditampilkan.</p>
          )}
          <p className="text-[11px] text-muted mt-2 leading-relaxed">
            Grafik membandingkan data historis dari siswa yang sama ({student.name}) pada mata pelajaran yang sama
            lintas periode semester.
          </p>
        </section>

        {/* 10.3 Perbandingan antarperiode */}
        <section className="bg-surface border border-border rounded-2xl p-4 min-w-0">
          <SectionTitle
            icon={ClipboardList}
            title="Perbandingan Nilai Antarperiode"
            subtitle={
              comparison.previousPeriodName
                ? `${comparison.previousPeriodName} ke ${comparison.currentPeriodName}`
                : comparison.currentPeriodName
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-page rounded-xl p-3 text-center">
              <div className="text-[11px] text-muted">Sebelumnya</div>
              <div className="text-lg font-bold text-ink tabular-nums">{fmt(comparison.previousScore)}</div>
            </div>
            <div className="bg-page rounded-xl p-3 text-center">
              <div className="text-[11px] text-muted">Sekarang</div>
              <div className="text-lg font-bold text-ink tabular-nums">{fmt(comparison.currentScore)}</div>
            </div>
            <div className="bg-page rounded-xl p-3 text-center">
              <div className="text-[11px] text-muted">Selisih</div>
              <div className="text-lg font-bold text-ink tabular-nums">
                {comparison.delta === null ? '—' : comparison.delta > 0 ? `+${comparison.delta}` : comparison.delta}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <TrendBadge status={comparison.status} size="md" />
            {comparison.percentageChange !== null && (
              <span className="text-xs text-muted tabular-nums">
                Perubahan {comparison.percentageChange > 0 ? '+' : ''}
                {comparison.percentageChange}%
              </span>
            )}
          </div>
          <div className="flex items-start gap-2 mt-3 text-xs text-muted bg-page rounded-xl p-3">
            <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
            <span className="leading-relaxed">
              {comparison.ruleExplanation} Aturan demonstrasi: selisih ≥ +{DEMO_THRESHOLDS.TREND_DELTA_THRESHOLD} poin
              Meningkat, ≤ −{DEMO_THRESHOLDS.TREND_DELTA_THRESHOLD} poin Menurun, selain itu Stabil.
            </span>
          </div>
        </section>
      </div>

      {/* Per subject comparison */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <SectionTitle
          icon={BookOpen}
          title="Rincian Perbandingan per Mata Pelajaran"
          subtitle={
            previousPeriod
              ? `Sem ${previousPeriod.order} dibandingkan Sem ${currentPeriod.order}`
              : 'Periode awal, belum ada periode pembanding'
          }
        />
        <ul className="divide-y divide-border">
          {subjectItems.map((s) => (
            <li key={s.subjectId} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{s.subjectName}</div>
                <div className="text-xs text-muted tabular-nums mt-0.5">
                  {fmt(s.previousScore)} ke {fmt(s.currentScore)}
                  {s.percentageChange !== null &&
                    ` (${s.percentageChange > 0 ? '+' : ''}${s.percentageChange}%)`}
                  {!s.isComplete && ' / nilai belum lengkap'}
                </div>
              </div>
              <TrendBadge status={s.status} delta={s.delta} />
            </li>
          ))}
        </ul>
      </section>

      {/* 10.4 Analisis mata pelajaran */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <SectionTitle
          icon={BookOpen}
          title="Analisis Mata Pelajaran"
          subtitle={`Nilai akhir per mata pelajaran pada ${currentPeriod.name}`}
        />
        {barData.length > 0 ? (
          <div className="-ml-2" style={{ height: Math.max(180, barData.length * 38) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={48}
                  tick={{ fontSize: 12, fill: CHART.axis }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [v, 'Nilai akhir']}
                  labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string })?.full ?? ''}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
                />
                <Bar dataKey="nilai" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false}>
                  {barData.map((d) => (
                    <Cell key={d.name} fill={d.below ? CHART.danger : CHART.primary} />
                  ))}
                  <LabelList dataKey="nilai" position="right" style={{ fontSize: 12, fill: CHART.axis }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted py-6 text-center">Belum ada nilai akhir lengkap pada periode ini.</p>
        )}
        <p className="text-[11px] text-muted mt-1">
          Batang merah menandakan nilai di bawah ambang pemantauan demonstrasi mata pelajaran tersebut.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
          {[
            { title: 'Nilai relatif tinggi', icon: ArrowUpRight, tone: 'text-primary', items: high.map((s) => `${s.subjectName} (${s.currentScore})`) },
            { title: 'Nilai relatif rendah', icon: ArrowDownRight, tone: 'text-warning', items: low.map((s) => `${s.subjectName} (${s.currentScore})`) },
            { title: 'Mengalami peningkatan', icon: TrendingUp, tone: 'text-success', items: rising.map((s) => `${s.subjectName} (+${s.delta})`) },
            { title: 'Mengalami penurunan', icon: TrendingDown, tone: 'text-danger', items: falling.map((s) => `${s.subjectName} (${s.delta})`) },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="bg-page rounded-xl p-3">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${cat.tone}`}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {cat.title}
                </div>
                {cat.items.length > 0 ? (
                  <ul className="mt-1.5 space-y-0.5">
                    {cat.items.map((i) => (
                      <li key={i} className="text-sm text-ink tabular-nums">
                        {i}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted mt-1.5">Tidak ada pada periode ini.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10.5 Analisis presensi */}
      <section className="bg-surface border border-border rounded-2xl p-4">
        <SectionTitle
          icon={CalendarCheck}
          title="Analisis Presensi"
          subtitle="Indikator pendukung pemantauan akademik"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">Kehadiran {`Sem ${currentPeriod.order}`}</div>
            <div className={`text-xl font-bold tabular-nums mt-0.5 ${attendanceTone}`}>
              {attendance.percentage !== null ? `${attendance.percentage}%` : 'Data belum tersedia'}
            </div>
          </div>
          <div className="bg-page rounded-xl p-3">
            <div className="text-xs text-muted">
              Perubahan dari {previousPeriod ? `Sem ${previousPeriod.order}` : 'periode sebelumnya'}
            </div>
            <div className="text-xl font-bold tabular-nums mt-0.5 text-ink">
              {attendanceDelta === null ? '—' : `${attendanceDelta > 0 ? '+' : ''}${attendanceDelta}%`}
            </div>
            {prevAttendance?.percentage != null && (
              <div className="text-[11px] text-muted">Sebelumnya {prevAttendance.percentage}%</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2.5">
          {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((k) => {
            const count =
              k === 'H' ? attendance.hadir : k === 'S' ? attendance.sakit : k === 'I' ? attendance.izin : attendance.alpa;
            return (
              <div key={k} className={`rounded-xl border p-2 text-center ${STATUS_META[k].className}`}>
                <div className="text-lg font-bold tabular-nums">{count}</div>
                <div className="text-[11px] font-medium">{STATUS_META[k].label}</div>
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-semibold text-ink mt-4 mb-2">Riwayat pertemuan terbaru</h3>
        {history.length > 0 ? (
          <ul className="divide-y divide-border">
            {history.map(({ session, record }) => {
              const sub = subjects.find((s) => s.id === session.subjectId);
              const meta = STATUS_META[record!.status];
              return (
                <li key={session.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{sub?.name ?? session.subjectId}</div>
                    <div className="text-xs text-muted tabular-nums">{session.date}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.className}`}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">Data pertemuan presensi pada periode ini belum tersedia.</p>
        )}

        <div className="flex items-start gap-2 mt-3 text-xs text-muted bg-page rounded-xl p-3">
          <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">
            Catatan Analisis: Informasi presensi ditampilkan sebagai indikator pendukung pemantauan akademik dan tidak
            mengklaim hubungan kausal otomatis terhadap naik atau turunnya nilai siswa.
          </span>
        </div>
      </section>

      {/* Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to={`/rekomendasi/${student.id}`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-primary hover:bg-primary-hover text-primary-ink transition-colors min-h-[44px]"
        >
          <Compass className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold flex-1">Rekomendasi Pendidikan Lanjutan SMA/SMK</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link
          to={`/nilai/${student.id}`}
          className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border hover:bg-secondary text-ink transition-colors min-h-[44px]"
        >
          <FileText className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold flex-1">Rincian komponen nilai</span>
          <ChevronRight className="w-4 h-4 text-muted" aria-hidden="true" />
        </Link>
        <Link
          to="/presensi/rekap"
          className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border hover:bg-secondary text-ink transition-colors min-h-[44px]"
        >
          <CalendarCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold flex-1">Rekapitulasi presensi</span>
          <ChevronRight className="w-4 h-4 text-muted" aria-hidden="true" />
        </Link>
      </div>

      <SimulationDisclaimerBanner compact />
    </div>
  );
};

export default StudentMonitoringPage;
