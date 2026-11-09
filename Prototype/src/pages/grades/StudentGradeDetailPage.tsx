import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardEdit,
  Compass,
  GraduationCap,
  Lock,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  BottomSheet,
  PageHeader,
  SimulationDisclaimerBanner,
  TrendBadge,
} from '../../components/ui/CommonUI';
import {
  CLUSTER_LABELS,
  calculateFinalScore,
  calculateTaskAverage,
  compareStudentPeriods,
  getStudentPeriodAverage,
  getSubjectComparisonsForStudent,
  round1,
} from '../../utils/academicRules';
import { Subject, TaskScoreItem } from '../../types/academic';

export const StudentGradeDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    teachers,
    assignments,
    students,
    grades,
    canEditSubjectGrade,
    getWeightsForClassSubject,
    upsertStudentGrade,
  } = useAcademic();

  const resolvedStudentId = studentId || currentUser?.studentId || 'stu-1';
  const student = useMemo(
    () =>
      students.find((s) => s.id === resolvedStudentId) ||
      students.find((s) => s.id === currentUser?.studentId) ||
      students[0],
    [students, resolvedStudentId, currentUser?.studentId]
  );

  const studentClass = useMemo(
    () => classes.find((c) => c.id === student.classId) || classes[0],
    [classes, student.classId]
  );

  const homeroomTeacher = useMemo(
    () =>
      teachers.find((t) => t.id === studentClass?.homeroomTeacherId) || null,
    [teachers, studentClass]
  );

  const selectedPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      periods[periods.length - 1],
    [periods, selectedPeriodId]
  );

  // Overall semester grade statistics & comparison with previous semester
  const periodAverage = useMemo(
    () => getStudentPeriodAverage(student.id, selectedPeriodId, grades),
    [student.id, selectedPeriodId, grades]
  );

  const periodComparison = useMemo(
    () =>
      compareStudentPeriods(student.id, selectedPeriodId, periods, grades),
    [student.id, selectedPeriodId, periods, grades]
  );

  const subjectComparisons = useMemo(
    () =>
      getSubjectComparisonsForStudent(
        student.id,
        selectedPeriodId,
        periods,
        subjects,
        grades
      ),
    [student.id, selectedPeriodId, periods, subjects, grades]
  );

  // Full breakdown for all 7 subjects
  const subjectBreakdowns = useMemo(() => {
    return subjects.map((subject) => {
      const record = grades.find(
        (g) =>
          g.studentId === student.id &&
          g.subjectId === subject.id &&
          g.periodId === selectedPeriodId
      );
      const weights = getWeightsForClassSubject(
        student.classId,
        subject.id,
        selectedPeriodId
      );
      const tasks = record?.tasks || [];
      const taskStats = calculateTaskAverage(tasks);
      const comparison = subjectComparisons.find(
        (c) => c.subjectId === subject.id
      );
      const asg = assignments.find(
        (a) =>
          a.classId === student.classId &&
          a.subjectId === subject.id &&
          a.periodId === selectedPeriodId
      );
      const assignedTeacher = teachers.find((t) => t.id === asg?.teacherId);
      const canEdit = canEditSubjectGrade(
        student.classId,
        subject.id,
        selectedPeriodId
      );
      const isComplete = Boolean(
        record?.isComplete && record?.finalScore !== null
      );
      const meetsThreshold =
        isComplete &&
        record?.finalScore !== null &&
        (record?.finalScore ?? 0) >= subject.monitoringThreshold;

      return {
        subject,
        record,
        weights,
        tasks,
        taskAverage: taskStats.average,
        filledTaskCount: taskStats.filledCount,
        comparison,
        assignedTeacher,
        canEdit,
        isComplete,
        meetsThreshold,
        finalScore: record?.finalScore ?? null,
      };
    });
  }, [
    subjects,
    grades,
    student.id,
    student.classId,
    selectedPeriodId,
    getWeightsForClassSubject,
    subjectComparisons,
    assignments,
    teachers,
    canEditSubjectGrade,
  ]);

  const aboveThresholdCount = useMemo(
    () => subjectBreakdowns.filter((b) => b.meetsThreshold).length,
    [subjectBreakdowns]
  );

  // BottomSheet Editor State for Subject Grade on Detail Page
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [draftTasks, setDraftTasks] = useState<TaskScoreItem[]>([]);
  const [draftUts, setDraftUts] = useState<string>('');
  const [draftUas, setDraftUas] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOpenSubjectEditor = (subject: Subject) => {
    const existing = grades.find(
      (g) =>
        g.studentId === student.id &&
        g.subjectId === subject.id &&
        g.periodId === selectedPeriodId
    );
    setEditingSubject(subject);
    if (existing && existing.tasks.length > 0) {
      setDraftTasks(existing.tasks.map((t) => ({ ...t })));
    } else {
      setDraftTasks([
        { id: 't-1', label: 'Tugas 1', score: null },
        { id: 't-2', label: 'Tugas 2', score: null },
        { id: 't-3', label: 'Tugas 3', score: null },
      ]);
    }
    setDraftUts(
      existing?.uts !== null && existing?.uts !== undefined
        ? String(existing.uts)
        : ''
    );
    setDraftUas(
      existing?.uas !== null && existing?.uas !== undefined
        ? String(existing.uas)
        : ''
    );
    setValidationError(null);
  };

  const handleCloseSubjectEditor = () => {
    setEditingSubject(null);
    setValidationError(null);
  };

  const editingWeights = useMemo(() => {
    if (!editingSubject) return { tugas: 40, uts: 30, uas: 30 };
    return getWeightsForClassSubject(
      student.classId,
      editingSubject.id,
      selectedPeriodId
    );
  }, [editingSubject, getWeightsForClassSubject, student.classId, selectedPeriodId]);

  const parsedUts = useMemo(() => {
    if (draftUts.trim() === '') return null;
    const n = Number(draftUts);
    return Number.isNaN(n) ? null : n;
  }, [draftUts]);

  const parsedUas = useMemo(() => {
    if (draftUas.trim() === '') return null;
    const n = Number(draftUas);
    return Number.isNaN(n) ? null : n;
  }, [draftUas]);

  const livePreview = useMemo(() => {
    const taskStats = calculateTaskAverage(draftTasks);
    const calc = calculateFinalScore(
      draftTasks,
      parsedUts,
      parsedUas,
      editingWeights
    );
    return {
      taskAverage: taskStats.average,
      filledCount: taskStats.filledCount,
      finalScore: calc.finalScore,
      isComplete: calc.isComplete,
    };
  }, [draftTasks, parsedUts, parsedUas, editingWeights]);

  const handleTaskScoreChange = (idx: number, raw: string) => {
    setValidationError(null);
    const trimmed = raw.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    setDraftTasks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, score: parsed } : item))
    );
  };

  const handleTaskLabelChange = (idx: number, label: string) => {
    setDraftTasks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, label } : item))
    );
  };

  const handleAddTask = () => {
    const nextNum = draftTasks.length + 1;
    setDraftTasks((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}-${nextNum}`,
        label: `Tugas ${nextNum}`,
        score: null,
      },
    ]);
  };

  const handleRemoveTask = (idx: number) => {
    if (draftTasks.length <= 1) return;
    setDraftTasks((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((item, i) => ({
          ...item,
          label: item.label.startsWith('Tugas ')
            ? `Tugas ${i + 1}`
            : item.label,
        }))
    );
  };

  const handleSaveSubjectGrade = () => {
    if (!editingSubject) return;

    for (const t of draftTasks) {
      if (
        t.score !== null &&
        (Number.isNaN(t.score) || t.score < 0 || t.score > 100)
      ) {
        setValidationError(
          `Nilai pada ${t.label} harus berada pada rentang skala 0 hingga 100.`
        );
        return;
      }
    }
    if (parsedUts !== null && (parsedUts < 0 || parsedUts > 100)) {
      setValidationError(
        'Nilai UTS harus berada pada rentang skala 0 hingga 100.'
      );
      return;
    }
    if (parsedUas !== null && (parsedUas < 0 || parsedUas > 100)) {
      setValidationError(
        'Nilai UAS harus berada pada rentang skala 0 hingga 100.'
      );
      return;
    }

    const cleanedTasks = draftTasks.map((t, idx) => ({
      ...t,
      label: t.label.trim() || `Tugas ${idx + 1}`,
      score: t.score !== null ? round1(t.score) : null,
    }));

    const res = upsertStudentGrade({
      studentId: student.id,
      classId: student.classId,
      subjectId: editingSubject.id,
      periodId: selectedPeriodId,
      tasks: cleanedTasks,
      uts: parsedUts !== null ? round1(parsedUts) : null,
      uas: parsedUas !== null ? round1(parsedUas) : null,
    });

    if (res.ok) {
      handleCloseSubjectEditor();
    } else {
      setValidationError(res.message);
    }
  };

  const studentInitials = student.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const canSwitchStudent =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'wali_kelas' ||
    currentUser?.role === 'guru_mapel';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rincian Nilai Akademik Siswa"
        subtitle={`${student.name} (NIS: ${student.nis}) — Kelas ${studentClass.name} — ${selectedPeriod.name}`}
        showBack
        backTo="/nilai"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/monitoring/${student.id}`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-semibold transition-colors"
            >
              <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Monitoring Perkembangan</span>
            </Link>
            <Link
              to={`/rekomendasi/${student.id}`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold transition-colors"
            >
              <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Rekomendasi SMA/SMK</span>
            </Link>
          </div>
        }
      />

      <SimulationDisclaimerBanner
        compact
        text="Rincian Komponen Nilai Siswa: Menampilkan setiap nilai Tugas, rata-rata Tugas, UTS, UAS, bobot penilaian, serta perhitungan Nilai Akhir otomatis pada semester terpilih."
      />

      {/* Student Identity & Semester Selector Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-primary font-bold text-base flex items-center justify-center shrink-0">
              {studentInitials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ink">
                  {student.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-secondary text-primary text-xs font-semibold">
                  Kelas {studentClass.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                NIS: {student.nis} — NISN: {student.nisn} — Wali Kelas:{' '}
                {homeroomTeacher?.name || '-'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Orang Tua / Wali: {student.parentName} ({student.parentPhone})
              </p>
            </div>
          </div>

          <div className="bg-page rounded-xl px-3.5 py-2.5 text-xs text-muted shrink-0">
            <p className="font-semibold text-ink">Catatan Pola Data Simulasi:</p>
            <p className="mt-0.5">{student.demoPatternNote}</p>
          </div>
        </div>

        {/* Period & Student Selector Controls */}
        <div
          className={`pt-4 border-t border-border grid grid-cols-1 ${
            canSwitchStudent ? 'sm:grid-cols-2' : ''
          } gap-3.5`}
        >
          <div>
            <label
              htmlFor="detail-period-select"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Pilih Periode Akademik (Semester)
            </label>
            <select
              id="detail-period-select"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm font-medium focus:outline-none focus:border-primary"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? '(Periode Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {canSwitchStudent && (
            <div>
              <label
                htmlFor="detail-student-select"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Beralih Cepat ke Siswa Lain
              </label>
              <select
                id="detail-student-select"
                value={student.id}
                onChange={(e) => navigate(`/nilai/${e.target.value}`)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm font-medium focus:outline-none focus:border-primary"
              >
                {students.map((s) => {
                  const cls = classes.find((c) => c.id === s.classId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis} — Kelas {cls?.name || '-'})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Overall Semester Grade Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Rata-rata Nilai Akhir Semester
            </span>
            <Calculator
              className="w-4 h-4 text-primary shrink-0"
              aria-hidden="true"
            />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary tabular-nums mt-2">
            {periodAverage.average !== null
              ? periodAverage.average
              : 'Belum Lengkap'}
          </p>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Dihitung dari {periodAverage.completedCount} mata pelajaran yang
            telah memiliki nilai lengkap pada {selectedPeriod.name}.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Perbandingan Semester Sebelumnya
            </span>
            <TrendBadge
              status={periodComparison.status}
              delta={periodComparison.delta}
            />
          </div>
          <p className="text-lg sm:text-xl font-bold text-ink tabular-nums mt-2">
            {periodComparison.previousPeriodName
              ? `${periodComparison.previousScore ?? '-'} → ${
                  periodComparison.currentScore ?? '-'
                }`
              : 'Periode Awal'}
          </p>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            {periodComparison.ruleExplanation}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">
              Kelengkapan & Ambang Pemantauan
            </span>
            <GraduationCap
              className="w-4 h-4 text-primary shrink-0"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {periodAverage.completedCount} / {subjects.length}
            </span>
            <span className="text-xs font-semibold text-muted">
              Mapel Lengkap
            </span>
          </div>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            {aboveThresholdCount} dari {periodAverage.completedCount} mapel
            lengkap memenuhi ambang pemantauan akademik.
          </p>
        </div>
      </div>

      {/* All 7 Subjects Full Component Breakdown */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Rincian Komponen Nilai per Mata Pelajaran ({subjects.length} Mapel)
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Menampilkan seluruh nilai Tugas, rata-rata Tugas, UTS, UAS, bobot
              penilaian, dan Nilai Akhir pada {selectedPeriod.name}.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {subjectBreakdowns.map(
            ({
              subject,
              record,
              weights,
              tasks,
              taskAverage,
              filledTaskCount,
              comparison,
              assignedTeacher,
              canEdit,
              isComplete,
              meetsThreshold,
              finalScore,
            }) => {
              return (
                <div
                  key={subject.id}
                  className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  {/* Subject Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary text-xs font-bold">
                          {subject.code}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-ink">
                          {subject.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Rumpun: {CLUSTER_LABELS[subject.cluster]} — Guru
                        Pengampu: {assignedTeacher?.name || '-'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {comparison && (
                        <TrendBadge
                          status={comparison.status}
                          delta={comparison.delta}
                        />
                      )}

                      {isComplete ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            meetsThreshold
                              ? 'bg-success-bg text-success border-success-border'
                              : 'bg-warning-bg text-warning border-warning-border'
                          }`}
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {meetsThreshold
                              ? 'Lengkap — Memenuhi Ambang'
                              : `Di Bawah Ambang (${subject.monitoringThreshold})`}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning-bg text-warning border border-warning-border">
                          <AlertCircle
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Belum Lengkap</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Task Scores Section (bg-page well without border) */}
                  <div className="bg-page rounded-xl p-3.5 sm:p-4 space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-ink">
                          Rincian Komponen Penilaian Tugas ({filledTaskCount} dari{' '}
                          {tasks.length} Tugas Terisi)
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          Bobot Tugas: {weights.tugas}%
                        </span>
                      </div>

                      {tasks.length === 0 ? (
                        <p className="text-xs text-muted">
                          Belum ada komponen penilaian tugas yang tercatat.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {tasks.map((t) => (
                            <div
                              key={t.id}
                              className="bg-secondary rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-medium text-ink">
                                {t.label}
                              </span>
                              <span
                                className={`text-sm font-bold tabular-nums ${
                                  t.score !== null
                                    ? 'text-primary'
                                    : 'text-warning'
                                }`}
                              >
                                {t.score !== null ? t.score : 'Kosong'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary Row: Rata-rata Tugas, UTS, UAS, Bobot, Nilai Akhir */}
                    <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <p className="text-xs text-muted">
                          Rata-rata Tugas ({weights.tugas}%)
                        </p>
                        <p className="text-base font-bold text-ink tabular-nums mt-0.5">
                          {taskAverage !== null ? taskAverage : 'Belum Tersedia'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted">
                          Nilai UTS ({weights.uts}%)
                        </p>
                        <p className="text-base font-bold text-ink tabular-nums mt-0.5">
                          {record?.uts !== null && record?.uts !== undefined
                            ? record.uts
                            : 'Belum Diisi'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted">
                          Nilai UAS ({weights.uas}%)
                        </p>
                        <p className="text-base font-bold text-ink tabular-nums mt-0.5">
                          {record?.uas !== null && record?.uas !== undefined
                            ? record.uas
                            : 'Belum Diisi'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted">Semester Lalu</p>
                        <p className="text-base font-bold text-ink tabular-nums mt-0.5">
                          {comparison?.previousScore !== null &&
                          comparison?.previousScore !== undefined
                            ? comparison.previousScore
                            : '-'}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-muted">Nilai Akhir</p>
                        <p
                          className={`text-lg font-bold tabular-nums mt-0.5 ${
                            isComplete ? 'text-primary' : 'text-warning'
                          }`}
                        >
                          {isComplete && finalScore !== null
                            ? finalScore
                            : 'Belum Lengkap'}
                        </p>
                      </div>
                    </div>

                    {/* Transparent Formula Trace */}
                    <div className="pt-2.5 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted">
                      <span>
                        {isComplete &&
                        taskAverage !== null &&
                        record?.uts !== null &&
                        record?.uas !== null
                          ? `Perhitungan Otomatis: (${taskAverage} × ${weights.tugas}%) + (${record?.uts} × ${weights.uts}%) + (${record?.uas} × ${weights.uas}%) = ${finalScore}`
                          : `Formula Bobot: Tugas ${weights.tugas}% + UTS ${weights.uts}% + UAS ${weights.uas}% (Menunggu komponen lengkap)`}
                      </span>
                      <span>
                        Ambang Pemantauan: {subject.monitoringThreshold} —
                        Diperbarui: {record?.updatedAt || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Subject Card Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {canEdit ? (
                        <>
                          <BookOpen
                            className="w-4 h-4 text-primary shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            Anda memiliki hak akses sebagai pengampu untuk
                            mengubah nilai mata pelajaran ini.
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock
                            className="w-4 h-4 text-muted shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            Akses Baca Saja — Diampu oleh{' '}
                            {assignedTeacher?.name || 'Guru Mata Pelajaran'}
                          </span>
                        </>
                      )}
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenSubjectEditor(subject)}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold transition-colors shrink-0"
                      >
                        <ClipboardEdit
                          className="w-4 h-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Ubah Nilai {subject.code}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Bottom Navigation Cards to Monitoring & Recommendation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
              <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Monitoring Perkembangan Akademik</span>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Lihat grafik perkembangan nilai lintas semester, analisis
              perbandingan antarperiode, serta rekapitulasi kehadiran{' '}
              {student.name}.
            </p>
          </div>
          <Link
            to={`/monitoring/${student.id}`}
            className="inline-flex items-center justify-between min-h-[44px] px-4 py-2.5 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>Buka Monitoring Perkembangan Siswa</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Rekomendasi Pendidikan Lanjutan (SMA / SMK)</span>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Lihat analisis profil kekuatan mata pelajaran dan bahan
              pertimbangan pendukung keputusan studi lanjut menuju SMA atau SMK.
            </p>
          </div>
          <Link
            to={`/rekomendasi/${student.id}`}
            className="inline-flex items-center justify-between min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>Buka Rekomendasi Pendidikan Lanjutan</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* BottomSheet Grade Editor on Student Detail Page */}
      <BottomSheet
        isOpen={Boolean(editingSubject)}
        onClose={handleCloseSubjectEditor}
        title={
          editingSubject ? `Ubah Nilai ${editingSubject.name}` : 'Ubah Nilai'
        }
        subtitle={`${student.name} (NIS: ${student.nis}) — ${selectedPeriod.name}`}
        footer={
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCloseSubjectEditor}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveSubjectGrade}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
            >
              Simpan Perubahan Nilai
            </button>
          </div>
        }
      >
        {editingSubject && (
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-3.5 text-xs sm:text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">
                  {editingSubject.name} ({editingSubject.code})
                </span>
                <span className="text-primary font-semibold">
                  Kelas {studentClass.name}
                </span>
              </div>
              <p className="text-muted">
                Bobot Aktif: Tugas {editingWeights.tugas}% + UTS{' '}
                {editingWeights.uts}% + UAS {editingWeights.uas}%
              </p>
            </div>

            {validationError && (
              <div
                role="alert"
                className="rounded-xl bg-danger-bg border border-danger-border text-danger p-3 text-xs sm:text-sm font-medium flex items-start gap-2"
              >
                <AlertCircle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{validationError}</span>
              </div>
            )}

            {/* Dynamic Task Components */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Komponen Tugas ({draftTasks.length} Penilaian)
                  </h3>
                  <p className="text-xs text-muted">
                    Tambah atau sesuaikan komponen tugas siswa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-semibold transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tambah Tugas</span>
                </button>
              </div>

              <div className="space-y-2">
                {draftTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 bg-page rounded-xl p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`detail-task-label-${idx}`}
                        className="sr-only"
                      >
                        Nama Tugas {idx + 1}
                      </label>
                      <input
                        id={`detail-task-label-${idx}`}
                        type="text"
                        value={task.label}
                        onChange={(e) =>
                          handleTaskLabelChange(idx, e.target.value)
                        }
                        className="w-full min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-border text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="w-28 sm:w-32 shrink-0">
                      <label
                        htmlFor={`detail-task-score-${idx}`}
                        className="sr-only"
                      >
                        Nilai {task.label}
                      </label>
                      <input
                        id={`detail-task-score-${idx}`}
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        placeholder="Kosong"
                        value={task.score !== null ? task.score : ''}
                        onChange={(e) =>
                          handleTaskScoreChange(idx, e.target.value)
                        }
                        className="w-full min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-bold text-ink tabular-nums text-center focus:outline-none focus:border-primary"
                      />
                    </div>

                    {draftTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-danger hover:bg-danger-bg transition-colors shrink-0"
                        aria-label={`Hapus ${task.label}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* UTS & UAS Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label
                  htmlFor="detail-uts-input"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  Nilai UTS (Bobot {editingWeights.uts}%)
                </label>
                <input
                  id="detail-uts-input"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  placeholder="Belum diisi (0-100)"
                  value={draftUts}
                  onChange={(e) => {
                    setValidationError(null);
                    setDraftUts(e.target.value);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-bold text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="detail-uas-input"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  Nilai UAS (Bobot {editingWeights.uas}%)
                </label>
                <input
                  id="detail-uas-input"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  placeholder="Belum diisi (0-100)"
                  value={draftUas}
                  onChange={(e) => {
                    setValidationError(null);
                    setDraftUas(e.target.value);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-bold text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="bg-page rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted">
                  Rata-rata Tugas ({livePreview.filledCount}/
                  {draftTasks.length} tugas terisi)
                </span>
                <span className="text-sm font-bold text-ink tabular-nums">
                  {livePreview.taskAverage !== null
                    ? livePreview.taskAverage
                    : 'Belum Tersedia'}
                </span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Nilai Akhir Hasil Perhitungan Otomatis
                  </p>
                  <p className="text-xs text-muted">
                    {livePreview.isComplete &&
                    livePreview.taskAverage !== null &&
                    parsedUts !== null &&
                    parsedUas !== null
                      ? `(${livePreview.taskAverage} × ${editingWeights.tugas}%) + (${parsedUts} × ${editingWeights.uts}%) + (${parsedUas} × ${editingWeights.uas}%)`
                      : 'Menunggu seluruh komponen Tugas, UTS, dan UAS terisi lengkap'}
                  </p>
                </div>

                <span
                  className={`text-lg sm:text-xl font-bold tabular-nums shrink-0 ${
                    livePreview.isComplete ? 'text-primary' : 'text-warning'
                  }`}
                >
                  {livePreview.isComplete && livePreview.finalScore !== null
                    ? livePreview.finalScore
                    : 'Belum Lengkap'}
                </span>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default StudentGradeDetailPage;
