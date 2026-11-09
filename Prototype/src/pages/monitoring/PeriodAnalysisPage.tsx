import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Info, LineChart as LineChartIcon, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademic } from '../../context/AcademicContext';
import {
  calculateAttendanceRecap,
  compareStudentPeriods,
  getStudentPeriodAverage,
  round1,
} from '../../utils/academicRules';
import { EmptyState, PageHeader, TrendBadge } from '../../components/ui/CommonUI';
import type { TrendDirection } from '../../types/academic';

const NAV_ITEMS = [
  { to: '/analisis', label: 'Analisis Kelas & Mapel' },
  { to: '/monitoring', label: 'Monitoring Individu' },
  { to: '/perhatian', label: 'Siswa Perlu Perhatian' },
  { to: '/rekomendasi', label: 'Rekomendasi SMA/SMK' },
];

const LINE_COLORS = ['#2563EB', '#15803D', '#B45309', '#B91C1C', '#93C5FD'];

const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(1).replace('.', ','));

export const MonitoringNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Navigasi monitoring" className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 min-w-max py-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center min-h-[44px] px-4 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors ${
                active
                  ? 'bg-primary text-primary-ink border-primary'
                  : 'bg-surface text-ink border-border hover:bg-secondary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const selectClass =
  'w-full min-h-[44px] px-3 rounded-xl bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary';

export const PeriodAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    teachers,
    students,
    grades,
    attendanceSessions,
  } = useAcademic();

  const [classFilter, setClassFilter] = useState<string>(() =>
    currentUser?.role === 'wali_kelas' && currentUser.classId ? currentUser.classId : 'ALL'
  );
  const [subjectFilter, setSubjectFilter] = useState<string>(() => {
    if (currentUser?.role === 'guru_mapel') {
      return teachers.find((t) => t.id === currentUser.teacherId)?.subjectIds[0] ?? 'ALL';
    }
    return 'ALL';
  });

  const subjectArg = subjectFilter === 'ALL' ? undefined : subjectFilter;
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods]);
  const filteredStudents = useMemo(
    () => students.filter((s) => classFilter === 'ALL' || s.classId === classFilter),
    [students, classFilter]
  );

  const groupAverage = (ids: string[], periodId: string): number | null => {
    const vals = ids
      .map((id) => getStudentPeriodAverage(id, periodId, grades, subjectArg).average)
      .filter((v): v is number => v !== null);
    return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const lineSeries = useMemo(() => {
    if (classFilter !== 'ALL') {
      const name = classes.find((c) => c.id === classFilter)?.name ?? 'Kelas';
      return [{ key: name, ids: filteredStudents.map((s) => s.id) }];
    }
    const perClass = classes
      .map((c) => ({ key: c.name, ids: students.filter((s) => s.classId === c.id).map((s) => s.id) }))
      .filter((g) => g.ids.length > 0);
    return [...perClass, { key: 'Sekolah', ids: students.map((s) => s.id) }];
  }, [classFilter, classes, students, filteredStudents]);

  const lineData = useMemo(
    () =>
      sortedPeriods.map((p) => {
        const row: Record<string, string | number | null> = { label: `Sem ${p.order}` };
        lineSeries.forEach((g) => {
          row[g.key] = groupAverage(g.ids, p.id);
        });
        return row;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedPeriods, lineSeries, grades, subjectArg]
  );

  const rows = useMemo(
    () =>
      filteredStudents.map((s) => ({
        student: s,
        className: classes.find((c) => c.id === s.classId)?.name ?? '-',
        scores: sortedPeriods.map((p) => ({
          order: p.order,
          avg: getStudentPeriodAverage(s.id, p.id, grades, subjectArg).average,
        })),
        comparison: compareStudentPeriods(s.id, selectedPeriodId, periods, grades, subjectArg),
        attendance: calculateAttendanceRecap(s.id, selectedPeriodId, attendanceSessions, subjectArg)
          .percentage,
      })),
    [filteredStudents, classes, sortedPeriods, grades, subjectArg, selectedPeriodId, periods, attendanceSessions]
  );

  const distribution = useMemo(() => {
    const counts: Record<TrendDirection, number> = {
      meningkat: 0,
      stabil: 0,
      menurun: 0,
      belum_cukup_data: 0,
    };
    rows.forEach((r) => (counts[r.comparison.status] += 1));
    return [
      { key: 'meningkat', name: 'Meningkat', value: counts.meningkat, color: '#15803D', tile: 'bg-success-bg text-success border-success-border' },
      { key: 'stabil', name: 'Stabil', value: counts.stabil, color: '#2563EB', tile: 'bg-secondary text-primary border-light-blue' },
      { key: 'menurun', name: 'Menurun', value: counts.menurun, color: '#B91C1C', tile: 'bg-danger-bg text-danger border-danger-border' },
      { key: 'belum', name: 'Data Belum Cukup', value: counts.belum_cukup_data, color: '#B45309', tile: 'bg-warning-bg text-warning border-warning-border' },
    ];
  }, [rows]);

  if (currentUser && (currentUser.role === 'siswa' || currentUser.role === 'wali_murid')) {
    return (
      <div className="space-y-4">
        <PageHeader title="Analisis Perkembangan Nilai Antarperiode" />
        <EmptyState
          title="Halaman khusus guru, wali kelas, dan admin"
          description="Analisis antarperiode tingkat kelas dan mata pelajaran hanya tersedia untuk guru, wali kelas, dan admin. Silakan lihat monitoring perkembangan pribadi."
          actionLabel="Buka Monitoring Pribadi"
          onAction={() => navigate(`/monitoring/${currentUser.studentId ?? ''}`)}
        />
      </div>
    );
  }

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analisis Perkembangan Nilai Antarperiode"
        subtitle="Perbandingan rata-rata nilai siswa yang sama dari semester ke semester."
      />
      <MonitoringNav />

      <section className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Periode
          <select className={selectClass} value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
            {sortedPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.academicYear})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Kelas
          <select className={selectClass} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Mata Pelajaran
          <select className={selectClass} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <LineChartIcon className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Rata-rata Nilai per Periode</h2>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              {lineSeries.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {lineSeries.map((g, i) => (
                <Line
                  key={g.key}
                  type="monotone"
                  dataKey={g.key}
                  stroke={g.key === 'Sekolah' ? '#64748B' : LINE_COLORS[i % LINE_COLORS.length]}
                  strokeDasharray={g.key === 'Sekolah' ? '5 4' : undefined}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">
            Distribusi Tren {selectedPeriod ? selectedPeriod.name : ''}
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {distribution.map((d) => (
            <div key={d.key} className={`rounded-xl border p-3 ${d.tile}`}>
              <p className="text-xs font-medium">{d.name}</p>
              <p className="text-2xl font-bold tabular-nums">{d.value}</p>
            </div>
          ))}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribution} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Jumlah siswa" radius={[6, 6, 0, 0]}>
                {distribution.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Daftar Siswa ({rows.length})</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Belum ada siswa pada filter ini.</p>
        ) : (
          <>
            <ul className="space-y-2 lg:hidden">
              {rows.map((r) => (
                <li key={r.student.id} className="bg-page rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{r.student.name}</p>
                      <p className="text-xs text-muted">Kelas {r.className}</p>
                    </div>
                    <TrendBadge status={r.comparison.status} delta={r.comparison.delta} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.scores.map((sc) => (
                      <span key={sc.order} className="px-2 py-0.5 rounded-lg bg-surface border border-border text-xs text-ink tabular-nums">
                        S{sc.order} {fmt(sc.avg)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">
                      Kehadiran:{' '}
                      <span className="text-ink font-medium">
                        {r.attendance !== null ? `${fmt(r.attendance)}%` : 'Data belum tersedia'}
                      </span>
                    </p>
                    <Link
                      to={`/monitoring/${r.student.id}`}
                      className="inline-flex items-center min-h-[44px] px-3 rounded-xl bg-secondary text-primary text-sm font-medium hover:bg-light-blue transition-colors"
                    >
                      Monitoring
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-border">
                    <th className="py-2 pr-3 font-medium">Nama</th>
                    <th className="py-2 pr-3 font-medium">Kelas</th>
                    {sortedPeriods.map((p) => (
                      <th key={p.id} className="py-2 pr-3 font-medium text-right">
                        Sem {p.order}
                      </th>
                    ))}
                    <th className="py-2 pr-3 font-medium">Tren</th>
                    <th className="py-2 pr-3 font-medium text-right">Kehadiran</th>
                    <th className="py-2 font-medium" aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.student.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 font-medium text-ink">{r.student.name}</td>
                      <td className="py-2 pr-3 text-muted">{r.className}</td>
                      {r.scores.map((sc) => (
                        <td key={sc.order} className="py-2 pr-3 text-right tabular-nums text-ink">
                          {fmt(sc.avg)}
                        </td>
                      ))}
                      <td className="py-2 pr-3">
                        <TrendBadge status={r.comparison.status} delta={r.comparison.delta} />
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-ink">
                        {r.attendance !== null ? `${fmt(r.attendance)}%` : 'Data belum tersedia'}
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          to={`/monitoring/${r.student.id}`}
                          className="inline-flex items-center min-h-[44px] px-3 rounded-xl bg-secondary text-primary text-sm font-medium hover:bg-light-blue transition-colors"
                        >
                          Monitoring
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2.5 rounded-xl bg-secondary border border-light-blue px-3.5 py-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Klasifikasi tren: selisih ≥ +1,5 poin = Meningkat, ≤ −1,5 poin = Menurun, selain itu Stabil (aturan
          demonstrasi). Perbandingan hanya dilakukan pada siswa yang sama antarperiode berurutan.
        </p>
      </div>
    </div>
  );
};

export default PeriodAnalysisPage;
