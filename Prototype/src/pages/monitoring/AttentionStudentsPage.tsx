import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Search } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { evaluateStudentsNeedingAttention } from '../../utils/academicRules';
import { AttentionBadge, EmptyState, PageHeader } from '../../components/ui/CommonUI';
import type { AttentionTrigger } from '../../types/academic';
import { MonitoringNav } from './PeriodAnalysisPage';

type IndicatorFilter = 'ALL' | AttentionTrigger['type'];

const INDICATORS: { value: AttentionTrigger['type']; label: string }[] = [
  { value: 'penurunan_nilai', label: 'Penurunan Nilai' },
  { value: 'bawah_ambang', label: 'Di Bawah Ambang Pemantauan' },
  { value: 'kehadiran_rendah', label: 'Kehadiran Rendah' },
  { value: 'data_belum_lengkap', label: 'Data Belum Lengkap' },
];

const selectClass =
  'w-full min-h-[44px] px-3 rounded-xl bg-surface border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary';

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const AttentionStudentsPage: React.FC = () => {
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
  const [indicator, setIndicator] = useState<IndicatorFilter>('ALL');
  const [query, setQuery] = useState('');

  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.order - b.order), [periods]);

  const evaluated = useMemo(
    () =>
      evaluateStudentsNeedingAttention(
        students,
        classes,
        periods,
        subjects,
        grades,
        attendanceSessions,
        selectedPeriodId,
        {
          classId: classFilter === 'ALL' ? undefined : classFilter,
          subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter,
        }
      ),
    [students, classes, periods, subjects, grades, attendanceSessions, selectedPeriodId, classFilter, subjectFilter]
  );

  const byIndicator = useMemo(
    () => (indicator === 'ALL' ? evaluated : evaluated.filter((e) => e.triggers.some((t) => t.type === indicator))),
    [evaluated, indicator]
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byIndicator;
    return byIndicator.filter(
      (e) => e.student.name.toLowerCase().includes(q) || e.student.nis.toLowerCase().includes(q)
    );
  }, [byIndicator, query]);

  const summary = useMemo(() => {
    const perIndicator = INDICATORS.map((ind) => ({
      ...ind,
      count: list.filter((e) => e.triggers.some((t) => t.type === ind.value)).length,
    }));
    return {
      total: list.length,
      high: list.filter((e) => e.primaryLabel === 'Memerlukan Perhatian').length,
      evaluasi: list.filter((e) => e.primaryLabel === 'Perlu Evaluasi').length,
      perIndicator,
    };
  }, [list]);

  if (currentUser && (currentUser.role === 'siswa' || currentUser.role === 'wali_murid')) {
    return (
      <div className="space-y-4">
        <PageHeader title="Siswa yang Memerlukan Perhatian" />
        <EmptyState
          title="Halaman khusus guru, wali kelas, dan admin"
          description="Daftar pemantauan siswa hanya tersedia untuk guru, wali kelas, dan admin. Silakan lihat monitoring perkembangan pribadi."
          actionLabel="Buka Monitoring Pribadi"
          onAction={() => navigate(`/monitoring/${currentUser.studentId ?? ''}`)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Siswa yang Memerlukan Perhatian"
        subtitle="Membantu guru dan wali kelas melakukan evaluasi akademik lebih awal."
      />
      <MonitoringNav />

      <div
        role="note"
        className="flex items-start gap-2.5 rounded-xl bg-warning-bg border border-warning-border px-3.5 py-2.5"
      >
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-ink leading-relaxed">
          <span className="font-semibold">Aturan Simulasi Demonstrasi:</span> Daftar ini menggunakan ambang batas
          prototipe (penurunan nilai ≥ 2,0 poin, nilai di bawah ambang pemantauan 72–75, kehadiran &lt; 85%, atau
          komponen nilai belum lengkap) untuk membantu guru dan wali kelas melakukan evaluasi lebih awal, bukan
          standar pelabelan resmi sekolah.
        </p>
      </div>

      <section className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Jenis Indikator
          <select
            className={selectClass}
            value={indicator}
            onChange={(e) => setIndicator(e.target.value as IndicatorFilter)}
          >
            <option value="ALL">Semua</option>
            {INDICATORS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Cari Siswa
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nama atau NIS"
              className={`${selectClass} pl-9`}
            />
          </div>
        </label>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border rounded-2xl p-3">
          <p className="text-xs text-muted">Total Siswa</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{summary.total}</p>
        </div>
        <div className="bg-danger-bg border border-danger-border rounded-2xl p-3">
          <p className="text-xs text-danger">Memerlukan Perhatian</p>
          <p className="text-2xl font-bold text-danger tabular-nums">{summary.high}</p>
        </div>
        <div className="bg-warning-bg border border-warning-border rounded-2xl p-3">
          <p className="text-xs text-warning">Perlu Evaluasi</p>
          <p className="text-2xl font-bold text-warning tabular-nums">{summary.evaluasi}</p>
        </div>
      </section>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {summary.perIndicator.map((ind) => (
          <div key={ind.value} className="bg-surface border border-border rounded-2xl p-3">
            <p className="text-xs text-muted leading-snug">{ind.label}</p>
            <p className="text-xl font-bold text-ink tabular-nums">{ind.count}</p>
          </div>
        ))}
      </section>

      {list.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          description="Tidak ada siswa yang memenuhi indikator perhatian pada filter ini."
        />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {list.map((item) => {
            const triggers =
              indicator === 'ALL' ? item.triggers : item.triggers.filter((t) => t.type === indicator);
            return (
              <li key={item.student.id} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center text-sm font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {initials(item.student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{item.student.name}</p>
                    <p className="text-xs text-muted">
                      NIS {item.student.nis}, Kelas {item.className}
                    </p>
                  </div>
                  <AttentionBadge label={item.primaryLabel} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-page rounded-xl p-2.5">
                    <p className="text-xs text-muted">Rata-rata</p>
                    <p className="text-base font-semibold text-ink tabular-nums">
                      {item.averageScore !== null ? String(item.averageScore).replace('.', ',') : '—'}
                    </p>
                  </div>
                  <div className="bg-page rounded-xl p-2.5">
                    <p className="text-xs text-muted">Kehadiran</p>
                    <p className="text-base font-semibold text-ink tabular-nums">
                      {item.attendancePercentage !== null
                        ? `${String(item.attendancePercentage).replace('.', ',')}%`
                        : 'Data belum tersedia'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {triggers.map((t, idx) => (
                    <li key={`${t.type}-${idx}`} className="bg-page rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink leading-snug">{t.title}</p>
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-xs font-medium whitespace-nowrap tabular-nums ${
                            t.label === 'Memerlukan Perhatian'
                              ? 'bg-danger-bg text-danger border-danger-border'
                              : 'bg-warning-bg text-warning border-warning-border'
                          }`}
                        >
                          {t.metricValue}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{t.detail}</p>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/monitoring/${item.student.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-medium transition-colors"
                  >
                    Lihat Detail Monitoring
                  </Link>
                  <Link
                    to={`/nilai/${item.student.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-secondary text-primary border border-light-blue hover:bg-light-blue text-sm font-medium transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                    Periksa Nilai
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AttentionStudentsPage;
