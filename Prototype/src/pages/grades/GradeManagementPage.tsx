import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardEdit,
  Eye,
  Filter,
  Lock,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  BottomSheet,
  EmptyState,
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
  validateWeights,
} from '../../utils/academicRules';
import { GradeWeightConfig, Student, TaskScoreItem } from '../../types/academic';

export const GradeManagementPage: React.FC = () => {
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
    updateWeightsForClassSubject,
    upsertStudentGrade,
  } = useAcademic();

  const isReadOnlyRole =
    currentUser?.role === 'siswa' || currentUser?.role === 'wali_murid';

  // Teacher / Admin filter state
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (currentUser?.classId) return currentUser.classId;
    if (currentUser?.teacherId) {
      const firstAssigned = assignments.find(
        (a) => a.teacherId === currentUser.teacherId
      );
      if (firstAssigned) return firstAssigned.classId;
    }
    return classes[0]?.id || 'cls-9a';
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (currentUser?.teacherId) {
      const teacher = teachers.find((t) => t.id === currentUser.teacherId);
      if (teacher && teacher.subjectIds.length > 0) {
        return teacher.subjectIds[0];
      }
    }
    return subjects[0]?.id || 'sub-mtk';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completenessFilter, setCompletenessFilter] = useState<
    'ALL' | 'COMPLETE' | 'INCOMPLETE'
  >('ALL');

  // Sync defaults when user switches demo account/role
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'wali_kelas' && currentUser.classId) {
      setSelectedClassId(currentUser.classId);
      const homeroomTeacher = teachers.find(
        (t) => t.id === currentUser.teacherId
      );
      if (homeroomTeacher && homeroomTeacher.subjectIds.length > 0) {
        setSelectedSubjectId(homeroomTeacher.subjectIds[0]);
      }
    } else if (currentUser.role === 'guru_mapel' && currentUser.teacherId) {
      const teacher = teachers.find((t) => t.id === currentUser.teacherId);
      if (teacher && teacher.subjectIds.length > 0) {
        setSelectedSubjectId(teacher.subjectIds[0]);
      }
      const firstAsg = assignments.find(
        (a) =>
          a.teacherId === currentUser.teacherId &&
          a.periodId === selectedPeriodId
      );
      if (firstAsg) {
        setSelectedClassId(firstAsg.classId);
      }
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.classId]);

  // Weight configuration BottomSheet state
  const [isWeightSheetOpen, setIsWeightSheetOpen] = useState<boolean>(false);
  const [draftWeights, setDraftWeights] = useState<GradeWeightConfig>({
    tugas: 40,
    uts: 30,
    uas: 30,
  });

  // Student grade editor BottomSheet state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [draftTasks, setDraftTasks] = useState<TaskScoreItem[]>([]);
  const [draftUts, setDraftUts] = useState<string>('');
  const [draftUas, setDraftUas] = useState<string>('');
  const [scoreValidationError, setScoreValidationError] = useState<
    string | null
  >(null);

  const selectedPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      periods[periods.length - 1],
    [periods, selectedPeriodId]
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || classes[0],
    [classes, selectedClassId]
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) || subjects[0],
    [subjects, selectedSubjectId]
  );

  const currentWeights = useMemo(
    () =>
      getWeightsForClassSubject(
        selectedClassId,
        selectedSubjectId,
        selectedPeriodId
      ),
    [
      getWeightsForClassSubject,
      selectedClassId,
      selectedSubjectId,
      selectedPeriodId,
    ]
  );

  const hasEditPermission = useMemo(
    () =>
      canEditSubjectGrade(selectedClassId, selectedSubjectId, selectedPeriodId),
    [canEditSubjectGrade, selectedClassId, selectedSubjectId, selectedPeriodId]
  );

  // Find assigned teacher for selected class + subject + period
  const assignedTeacherForSelection = useMemo(() => {
    const asg = assignments.find(
      (a) =>
        a.classId === selectedClassId &&
        a.subjectId === selectedSubjectId &&
        a.periodId === selectedPeriodId
    );
    if (!asg) return null;
    return teachers.find((t) => t.id === asg.teacherId) || null;
  }, [assignments, teachers, selectedClassId, selectedSubjectId, selectedPeriodId]);

  // Subjects taught by the currently logged in teacher
  const teacherAssignedSubjects = useMemo(() => {
    if (!currentUser?.teacherId) return [];
    const teacher = teachers.find((t) => t.id === currentUser.teacherId);
    if (!teacher) return [];
    return subjects.filter((sub) => teacher.subjectIds.includes(sub.id));
  }, [currentUser?.teacherId, teachers, subjects]);

  // Open Weight Config Sheet
  const handleOpenWeightSheet = () => {
    setDraftWeights({ ...currentWeights });
    setIsWeightSheetOpen(true);
  };

  const weightValidation = useMemo(
    () => validateWeights(draftWeights),
    [draftWeights]
  );

  const handleSaveWeights = () => {
    if (!weightValidation.isValid) return;
    const result = updateWeightsForClassSubject(
      selectedClassId,
      selectedSubjectId,
      selectedPeriodId,
      draftWeights
    );
    if (result.ok) {
      setIsWeightSheetOpen(false);
    }
  };

  // Open Student Grade Editor Sheet
  const handleOpenStudentEditor = (student: Student) => {
    const existing = grades.find(
      (g) =>
        g.studentId === student.id &&
        g.subjectId === selectedSubjectId &&
        g.periodId === selectedPeriodId
    );
    setEditingStudent(student);
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
    setScoreValidationError(null);
  };

  const handleCloseStudentEditor = () => {
    setEditingStudent(null);
    setScoreValidationError(null);
  };

  const handleTaskScoreChange = (index: number, rawValue: string) => {
    setScoreValidationError(null);
    const trimmed = rawValue.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    setDraftTasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, score: parsed } : item
      )
    );
  };

  const handleTaskLabelChange = (index: number, newLabel: string) => {
    setDraftTasks((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, label: newLabel } : item
      )
    );
  };

  const handleAddTaskComponent = () => {
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

  const handleRemoveTaskComponent = (index: number) => {
    if (draftTasks.length <= 1) return;
    setDraftTasks((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({
          ...item,
          label: item.label.startsWith('Tugas ')
            ? `Tugas ${idx + 1}`
            : item.label,
        }))
    );
  };

  // Live calculation inside BottomSheet editor
  const parsedDraftUts = useMemo(() => {
    if (draftUts.trim() === '') return null;
    const n = Number(draftUts);
    return Number.isNaN(n) ? null : n;
  }, [draftUts]);

  const parsedDraftUas = useMemo(() => {
    if (draftUas.trim() === '') return null;
    const n = Number(draftUas);
    return Number.isNaN(n) ? null : n;
  }, [draftUas]);

  const liveEditorStats = useMemo(() => {
    const taskStats = calculateTaskAverage(draftTasks);
    const calc = calculateFinalScore(
      draftTasks,
      parsedDraftUts,
      parsedDraftUas,
      currentWeights
    );
    return {
      taskAverage: taskStats.average,
      allTasksFilled: taskStats.allFilled,
      filledTaskCount: taskStats.filledCount,
      finalScore: calc.finalScore,
      isComplete: calc.isComplete,
    };
  }, [draftTasks, parsedDraftUts, parsedDraftUas, currentWeights]);

  const handleSaveStudentGrade = () => {
    if (!editingStudent) return;

    // Validate numbers 0..100
    for (const t of draftTasks) {
      if (t.score !== null && (Number.isNaN(t.score) || t.score < 0 || t.score > 100)) {
        setScoreValidationError(
          `Nilai pada ${t.label} tidak valid. Masukkan angka pada rentang 0 hingga 100.`
        );
        return;
      }
    }
    if (
      parsedDraftUts !== null &&
      (parsedDraftUts < 0 || parsedDraftUts > 100)
    ) {
      setScoreValidationError(
        'Nilai UTS harus berada pada rentang skala 0 hingga 100.'
      );
      return;
    }
    if (
      parsedDraftUas !== null &&
      (parsedDraftUas < 0 || parsedDraftUas > 100)
    ) {
      setScoreValidationError(
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
      studentId: editingStudent.id,
      classId: editingStudent.classId,
      subjectId: selectedSubjectId,
      periodId: selectedPeriodId,
      tasks: cleanedTasks,
      uts: parsedDraftUts !== null ? round1(parsedDraftUts) : null,
      uas: parsedDraftUas !== null ? round1(parsedDraftUas) : null,
    });

    if (res.ok) {
      handleCloseStudentEditor();
    } else {
      setScoreValidationError(res.message);
    }
  };

  // Students in selected class for Teacher / Admin view
  const classStudentsWithGrades = useMemo(() => {
    const classStudents = students.filter((s) => s.classId === selectedClassId);
    return classStudents.map((student) => {
      const record = grades.find(
        (g) =>
          g.studentId === student.id &&
          g.subjectId === selectedSubjectId &&
          g.periodId === selectedPeriodId
      );
      const tasks = record?.tasks || [];
      const taskStats = calculateTaskAverage(tasks);
      const isComplete = Boolean(record?.isComplete && record?.finalScore !== null);
      return {
        student,
        record,
        tasks,
        taskAverage: taskStats.average,
        filledTaskCount: taskStats.filledCount,
        isComplete,
        finalScore: record?.finalScore ?? null,
      };
    });
  }, [students, grades, selectedClassId, selectedSubjectId, selectedPeriodId]);

  const filteredClassStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classStudentsWithGrades.filter((item) => {
      const matchesSearch =
        !q ||
        item.student.name.toLowerCase().includes(q) ||
        item.student.nis.toLowerCase().includes(q) ||
        item.student.nisn.toLowerCase().includes(q);
      const matchesCompleteness =
        completenessFilter === 'ALL'
          ? true
          : completenessFilter === 'COMPLETE'
          ? item.isComplete
          : !item.isComplete;
      return matchesSearch && matchesCompleteness;
    });
  }, [classStudentsWithGrades, searchQuery, completenessFilter]);

  const classSummaryStats = useMemo(() => {
    const totalStudents = classStudentsWithGrades.length;
    const completedItems = classStudentsWithGrades.filter(
      (i) => i.isComplete && i.finalScore !== null
    );
    const completedCount = completedItems.length;
    const incompleteCount = totalStudents - completedCount;
    const classAverage =
      completedCount > 0
        ? round1(
            completedItems.reduce((acc, cur) => acc + (cur.finalScore ?? 0), 0) /
              completedCount
          )
        : null;
    const belowThresholdCount = completedItems.filter(
      (i) =>
        (i.finalScore ?? 0) < (selectedSubject?.monitoringThreshold ?? 72)
    ).length;

    return {
      totalStudents,
      completedCount,
      incompleteCount,
      classAverage,
      belowThresholdCount,
    };
  }, [classStudentsWithGrades, selectedSubject]);

  // ============================================================================
  // VIEW 1: SISWA & WALI MURID (READ-ONLY PERSONAL GRADE VIEW)
  // ============================================================================
  if (isReadOnlyRole) {
    const targetStudentId = currentUser?.studentId || 'stu-1';
    const student =
      students.find((s) => s.id === targetStudentId) || students[0];
    const studentClass = classes.find((c) => c.id === student.classId);

    const periodAverage = getStudentPeriodAverage(
      student.id,
      selectedPeriodId,
      grades
    );
    const periodComparison = compareStudentPeriods(
      student.id,
      selectedPeriodId,
      periods,
      grades
    );
    const subjectComparisons = getSubjectComparisonsForStudent(
      student.id,
      selectedPeriodId,
      periods,
      subjects,
      grades
    );

    const studentSubjectDetails = subjects.map((subject) => {
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
      const taskStats = calculateTaskAverage(record?.tasks || []);
      const compItem = subjectComparisons.find(
        (c) => c.subjectId === subject.id
      );
      const asg = assignments.find(
        (a) =>
          a.classId === student.classId &&
          a.subjectId === subject.id &&
          a.periodId === selectedPeriodId
      );
      const teacher = teachers.find((t) => t.id === asg?.teacherId);

      return {
        subject,
        record,
        weights,
        taskAverage: taskStats.average,
        filledTasks: taskStats.filledCount,
        totalTasks: record?.tasks.length || 0,
        compItem,
        teacherName: teacher?.name || 'Guru Mata Pelajaran',
      };
    });

    const highestSubject = [...studentSubjectDetails]
      .filter((d) => d.record?.isComplete && d.record?.finalScore !== null)
      .sort(
        (a, b) => (b.record?.finalScore ?? 0) - (a.record?.finalScore ?? 0)
      )[0];

    return (
      <div className="space-y-5">
        <PageHeader
          title="Capaian Nilai Akademik Siswa"
          subtitle={`${student.name} (NIS: ${student.nis}) — Kelas ${
            studentClass?.name || '-'
          } — ${selectedPeriod.name}`}
          actions={
            <Link
              to={`/nilai/${student.id}`}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
            >
              <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Lihat Rincian Komponen Lengkap</span>
            </Link>
          }
        />

        {/* Read-Only Access Notice */}
        <div className="flex items-start gap-3 rounded-2xl bg-secondary border border-light-blue p-4">
          <Lock
            className="w-5 h-5 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0 text-xs sm:text-sm">
            <p className="font-semibold text-ink">
              Mode Akses Baca Saja ({currentUser?.roleLabel})
            </p>
            <p className="text-muted mt-0.5 leading-relaxed">
              Siswa dan Wali Murid dapat memantau seluruh komponen nilai Tugas,
              UTS, UAS, bobot penilaian, serta Nilai Akhir pada setiap semester.
              Penginputan dan perubahan nilai hanya dapat dilakukan oleh Guru
              Mata Pelajaran pengampu.
            </p>
          </div>
        </div>

        {/* Period Filter & Quick Navigation Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label
                htmlFor="student-period-select"
                className="block text-xs sm:text-sm font-semibold text-ink mb-1.5"
              >
                Pilih Periode Akademik (Semester)
              </label>
              <select
                id="student-period-select"
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

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Link
                to={`/monitoring/${student.id}`}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary text-primary hover:bg-light-blue text-xs sm:text-sm font-semibold transition-colors"
              >
                <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Grafik Perkembangan</span>
              </Link>
              <Link
                to={`/rekomendasi/${student.id}`}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary text-primary hover:bg-light-blue text-xs sm:text-sm font-semibold transition-colors"
              >
                <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Rekomendasi SMA/SMK</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-medium text-muted">
              Rata-rata Nilai Akhir Semester
            </p>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
                {periodAverage.average !== null
                  ? periodAverage.average
                  : 'Belum Lengkap'}
              </span>
              <TrendBadge
                status={periodComparison.status}
                delta={periodComparison.delta}
              />
            </div>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {periodComparison.previousPeriodName
                ? `Dibandingkan ${periodComparison.previousPeriodName} (${
                    periodComparison.previousScore ?? '-'
                  })`
                : 'Periode awal pencatatan akademik'}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-medium text-muted">
              Capaian Mata Pelajaran Tertinggi
            </p>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                {highestSubject?.record?.finalScore ?? '-'}
              </span>
              <p className="text-sm font-semibold text-ink mt-1">
                {highestSubject
                  ? highestSubject.subject.name
                  : 'Data Belum Lengkap'}
              </p>
            </div>
            <p className="text-xs text-muted mt-1">
              {highestSubject
                ? CLUSTER_LABELS[highestSubject.subject.cluster]
                : 'Menunggu komponen nilai lengkap'}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-medium text-muted">
              Status Kelengkapan Komponen
            </p>
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
                {periodAverage.completedCount} / {subjects.length}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  periodAverage.completedCount === subjects.length
                    ? 'bg-success-bg text-success border-success-border'
                    : 'bg-warning-bg text-warning border-warning-border'
                }`}
              >
                {periodAverage.completedCount === subjects.length
                  ? 'Seluruh Mapel Lengkap'
                  : 'Sebagian Belum Lengkap'}
              </span>
            </div>
            <p className="text-xs text-muted mt-2">
              Nilai akhir dihitung otomatis saat Tugas, UTS, dan UAS lengkap.
            </p>
          </div>
        </div>

        {/* All 7 Subjects List */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Daftar Nilai Mata Pelajaran ({subjects.length} Mapel)
            </h2>
            <Link
              to={`/nilai/${student.id}`}
              className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Halaman Detail</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {studentSubjectDetails.map(
              ({
                subject,
                record,
                weights,
                taskAverage,
                filledTasks,
                totalTasks,
                compItem,
                teacherName,
              }) => {
                const isComplete = Boolean(
                  record?.isComplete && record?.finalScore !== null
                );
                return (
                  <div
                    key={subject.id}
                    className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-secondary text-primary text-xs font-semibold">
                            {subject.code}
                          </span>
                          <h3 className="text-base font-bold text-ink">
                            {subject.name}
                          </h3>
                        </div>
                        <p className="text-xs text-muted mt-1">
                          Pengampu: {teacherName} — Ambang Pemantauan:{' '}
                          {subject.monitoringThreshold}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {compItem && (
                          <TrendBadge
                            status={compItem.status}
                            delta={compItem.delta}
                          />
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            isComplete
                              ? 'bg-success-bg text-success border-success-border'
                              : 'bg-warning-bg text-warning border-warning-border'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <AlertCircle
                              className="w-3.5 h-3.5 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span>
                            {isComplete ? 'Lengkap' : 'Belum Lengkap'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Inner Component Breakdown Well (no nested border) */}
                    <div className="bg-page rounded-xl p-3.5 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted">
                            Rata-rata Tugas ({weights.tugas}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {taskAverage !== null ? taskAverage : '-'}
                          </p>
                          <p className="text-xs text-muted">
                            {filledTasks}/{totalTasks} tugas terisi
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">
                            Nilai UTS ({weights.uts}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {record?.uts !== null && record?.uts !== undefined
                              ? record.uts
                              : 'Belum Diisi'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">
                            Nilai UAS ({weights.uas}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {record?.uas !== null && record?.uas !== undefined
                              ? record.uas
                              : 'Belum Diisi'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">Nilai Akhir</p>
                          <p className="text-base sm:text-lg font-bold text-primary tabular-nums mt-0.5">
                            {isComplete && record && record.finalScore !== null
                              ? record.finalScore
                              : 'Belum Lengkap'}
                          </p>
                        </div>
                      </div>

                      {record?.tasks && record.tasks.length > 0 && (
                        <div className="pt-2.5 border-t border-border flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-muted">
                            Rincian Tugas:
                          </span>
                          {record.tasks.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-ink text-xs font-medium tabular-nums"
                            >
                              <span>{t.label}:</span>
                              <span className="font-bold">
                                {t.score !== null ? t.score : 'Kosong'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: GURU MAPEL, WALI KELAS & SUPER ADMIN (INTERACTIVE GRADE MANAGEMENT)
  // ============================================================================
  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengelolaan Nilai Akademik Siswa"
        subtitle={`Input komponen Tugas, UTS, UAS, dan pengaturan bobot penilaian otomatis — ${selectedPeriod.name}`}
        actions={
          <button
            type="button"
            onClick={handleOpenWeightSheet}
            disabled={!hasEditPermission}
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              hasEditPermission
                ? 'bg-primary hover:bg-primary-hover text-primary-ink'
                : 'bg-secondary text-muted cursor-not-allowed'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Atur Bobot ({currentWeights.tugas}/{currentWeights.uts}/
              {currentWeights.uas}%)
            </span>
          </button>
        }
      />

      <SimulationDisclaimerBanner
        compact
        text="Simulasi Pengelolaan Nilai: Perubahan bobot atau komponen nilai siswa (Tugas, UTS, UAS) akan langsung menghitung ulang Nilai Akhir dan memperbarui status pemantauan siswa."
      />

      {/* Quick Subject Switcher Pills for Teachers */}
      {teacherAssignedSubjects.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserCheck
              className="w-5 h-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-ink">
                Mata Pelajaran yang Diampu oleh {currentUser?.name}
              </p>
              <p className="text-xs text-muted">
                Klik tombol di samping untuk beralih cepat ke mata pelajaran
                yang Anda ampu.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {teacherAssignedSubjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-ink'
                      : 'bg-secondary text-primary hover:bg-light-blue'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {sub.name} ({sub.code})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-ink font-bold text-sm sm:text-base">
          <Filter className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>Filter Kelas, Mata Pelajaran & Periode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label
              htmlFor="grade-class-select"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Pilih Kelas
            </label>
            <select
              id="grade-class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm font-medium focus:outline-none focus:border-primary"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} — Ruang {cls.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="grade-subject-select"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Pilih Mata Pelajaran
            </label>
            <select
              id="grade-subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm font-medium focus:outline-none focus:border-primary"
            >
              {subjects.map((sub) => {
                const canEditThis = canEditSubjectGrade(
                  selectedClassId,
                  sub.id,
                  selectedPeriodId
                );
                return (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code}){' '}
                    {canEditThis ? '— Mapel Diampu (Dapat Diubah)' : '— Baca Saja'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="grade-period-select"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Pilih Semester
            </label>
            <select
              id="grade-period-select"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm font-medium focus:outline-none focus:border-primary"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Completeness Filter */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa atau nomor induk (NIS)..."
              aria-label="Cari nama siswa atau nomor induk"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg text-muted hover:text-ink"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'ALL', label: `Semua (${classSummaryStats.totalStudents})` },
                {
                  id: 'COMPLETE',
                  label: `Lengkap (${classSummaryStats.completedCount})`,
                },
                {
                  id: 'INCOMPLETE',
                  label: `Belum Lengkap (${classSummaryStats.incompleteCount})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCompletenessFilter(tab.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  completenessFilter === tab.id
                    ? 'bg-primary text-primary-ink'
                    : 'bg-page text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Banner (Section 5.3 Check) */}
      {!hasEditPermission ? (
        <div
          role="alert"
          className="bg-warning-bg border border-warning-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <Lock
              className="w-5 h-5 text-warning shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-warning">
                Mode Baca Saja — Mata Pelajaran Tidak Diampu
              </h2>
              <p className="text-xs sm:text-sm text-ink mt-1 leading-relaxed">
                Sesuai aturan hak akses sistem (Bagian 5.3), Guru tidak boleh
                mengubah nilai mata pelajaran yang tidak diampu. Mata pelajaran{' '}
                <span className="font-semibold">{selectedSubject.name}</span> di
                Kelas{' '}
                <span className="font-semibold">{selectedClass.name}</span>{' '}
                diampu oleh{' '}
                <span className="font-semibold">
                  {assignedTeacherForSelection?.name || 'Guru Mapel Lain'}
                </span>
                . Anda tetap dapat melihat nilai siswa untuk pemantauan kelas.
              </p>
            </div>
          </div>

          {teacherAssignedSubjects.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelectedSubjectId(teacherAssignedSubjects[0].id)
              }
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold transition-colors shrink-0"
            >
              <span>
                Beralih ke {teacherAssignedSubjects[0].name}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-secondary border border-light-blue rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Calculator
              className="w-5 h-5 text-primary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0 text-xs sm:text-sm">
              <p className="font-bold text-ink">
                Formula Bobot Aktif {selectedSubject.name} (Kelas{' '}
                {selectedClass.name}): Tugas {currentWeights.tugas}% + UTS{' '}
                {currentWeights.uts}% + UAS {currentWeights.uas}% = 100%
              </p>
              <p className="text-muted mt-0.5">
                Pengampu:{' '}
                {assignedTeacherForSelection?.name || currentUser?.name} — Nilai
                Akhir dihitung otomatis saat seluruh komponen Tugas, UTS, dan
                UAS terisi lengkap.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWeightSheet}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-border text-primary hover:bg-light-blue text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ubah Bobot (%)</span>
          </button>
        </div>
      )}

      {/* Class Subject Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs text-muted font-medium">Total Siswa Kelas</p>
          <p className="text-xl sm:text-2xl font-bold text-ink tabular-nums mt-1">
            {classSummaryStats.totalStudents} Siswa
          </p>
          <p className="text-xs text-muted mt-1">
            Kelas {selectedClass.name} ({selectedClass.roomNumber})
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs text-muted font-medium">
            Rata-rata Kelas ({selectedSubject.code})
          </p>
          <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums mt-1">
            {classSummaryStats.classAverage !== null
              ? classSummaryStats.classAverage
              : 'Belum Lengkap'}
          </p>
          <p className="text-xs text-muted mt-1">
            Ambang pemantauan: {selectedSubject.monitoringThreshold}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs text-muted font-medium">Kelengkapan Nilai</p>
          <p className="text-xl sm:text-2xl font-bold text-ink tabular-nums mt-1">
            {classSummaryStats.completedCount} /{' '}
            {classSummaryStats.totalStudents}
          </p>
          <p className="text-xs text-muted mt-1">
            {classSummaryStats.incompleteCount > 0
              ? `${classSummaryStats.incompleteCount} siswa belum lengkap`
              : 'Seluruh siswa telah lengkap'}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4">
          <p className="text-xs text-muted font-medium">Komposisi Bobot</p>
          <p className="text-lg sm:text-xl font-bold text-ink tabular-nums mt-1">
            {currentWeights.tugas}% / {currentWeights.uts}% /{' '}
            {currentWeights.uas}%
          </p>
          <p className="text-xs text-muted mt-1">Rata-rata Tugas / UTS / UAS</p>
        </div>
      </div>

      {/* Student Cards List (Mobile-First 390px Card UI) */}
      {filteredClassStudents.length === 0 ? (
        <EmptyState
          title="Data Siswa Tidak Ditemukan"
          description="Tidak ada siswa yang sesuai dengan kata kunci pencarian atau filter status kelengkapan yang dipilih."
          actionLabel="Reset Filter Pencarian"
          onAction={() => {
            setSearchQuery('');
            setCompletenessFilter('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClassStudents.map(
            ({
              student,
              record,
              tasks,
              taskAverage,
              filledTaskCount,
              isComplete,
              finalScore,
            }) => {
              const initials = student.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              const isBelowThreshold =
                isComplete &&
                finalScore !== null &&
                finalScore < selectedSubject.monitoringThreshold;

              return (
                <div
                  key={student.id}
                  className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Avatar + Identity + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-secondary text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/nilai/${student.id}`}
                            className="text-base font-bold text-ink hover:text-primary transition-colors block truncate"
                          >
                            {student.name}
                          </Link>
                          <p className="text-xs text-muted mt-0.5">
                            NIS: {student.nis} — Kelas {selectedClass.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isComplete && finalScore !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              isBelowThreshold
                                ? 'bg-warning-bg text-warning border-warning-border'
                                : 'bg-success-bg text-success border-success-border'
                            }`}
                          >
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span>
                              {isBelowThreshold
                                ? `Di Bawah Ambang (${selectedSubject.monitoringThreshold})`
                                : 'Nilai Lengkap'}
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

                    {/* Inner Score Breakdown Well (bg-page without nested border) */}
                    <div className="bg-page rounded-xl p-3.5 space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-center sm:text-left">
                        <div>
                          <p className="text-xs text-muted">
                            Tugas ({currentWeights.tugas}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {taskAverage !== null ? taskAverage : '-'}
                          </p>
                          <p className="text-[11px] text-muted">
                            {filledTaskCount}/{tasks.length} terisi
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">
                            UTS ({currentWeights.uts}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {record?.uts !== null && record?.uts !== undefined
                              ? record.uts
                              : '-'}
                          </p>
                          <p className="text-[11px] text-muted">Ujian Tengah</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">
                            UAS ({currentWeights.uas}%)
                          </p>
                          <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                            {record?.uas !== null && record?.uas !== undefined
                              ? record.uas
                              : '-'}
                          </p>
                          <p className="text-[11px] text-muted">Ujian Akhir</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted">Nilai Akhir</p>
                          <p
                            className={`text-sm sm:text-base font-bold tabular-nums mt-0.5 ${
                              isComplete ? 'text-primary' : 'text-warning'
                            }`}
                          >
                            {isComplete && finalScore !== null
                              ? finalScore
                              : 'Belum'}
                          </p>
                          <p className="text-[11px] text-muted">
                            {isComplete ? 'Otomatis' : 'Belum Lengkap'}
                          </p>
                        </div>
                      </div>

                      {/* Task Component Chips */}
                      {tasks.length > 0 && (
                        <div className="pt-2.5 border-t border-border flex flex-wrap items-center gap-1.5">
                          {tasks.map((t) => (
                            <span
                              key={t.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium tabular-nums ${
                                t.score !== null
                                  ? 'bg-secondary text-ink'
                                  : 'bg-warning-bg text-warning'
                              }`}
                            >
                              <span>{t.label}:</span>
                              <span className="font-bold">
                                {t.score !== null ? t.score : 'Kosong'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Buttons */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/nilai/${student.id}`)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-page hover:bg-secondary text-ink text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <Users className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>Detail 7 Mapel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenStudentEditor(student)}
                      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                        hasEditPermission
                          ? 'bg-primary hover:bg-primary-hover text-primary-ink'
                          : 'bg-secondary text-primary hover:bg-light-blue'
                      }`}
                    >
                      {hasEditPermission ? (
                        <>
                          <ClipboardEdit
                            className="w-4 h-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Input / Ubah Nilai</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Lihat Rincian</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* BOTTOM SHEET 1: PENGATURAN BOBOT KOMPONEN PENILAIAN                  */}
      {/* ==================================================================== */}
      <BottomSheet
        isOpen={isWeightSheetOpen}
        onClose={() => setIsWeightSheetOpen(false)}
        title="Pengaturan Bobot Komponen Penilaian"
        subtitle={`${selectedSubject.name} — Kelas ${selectedClass.name} (${selectedPeriod.name})`}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsWeightSheetOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveWeights}
              disabled={!weightValidation.isValid || !hasEditPermission}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                weightValidation.isValid && hasEditPermission
                  ? 'bg-primary hover:bg-primary-hover text-primary-ink'
                  : 'bg-secondary text-muted cursor-not-allowed'
              }`}
            >
              Simpan & Hitung Ulang Nilai
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-secondary rounded-xl p-3.5 text-xs sm:text-sm text-ink leading-relaxed">
            Atur persentase bobot untuk komponen{' '}
            <span className="font-semibold">Rata-rata Tugas</span>,{' '}
            <span className="font-semibold">UTS</span>, dan{' '}
            <span className="font-semibold">UAS</span>. Total bobot ketiga
            komponen wajib berjumlah tepat <span className="font-bold">100%</span>.
          </div>

          {/* Preset Quick Buttons */}
          <div>
            <p className="text-xs font-semibold text-muted mb-2">
              Pilihan Cepat Komposisi Bobot:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '40% / 30% / 30% (Standar)', tugas: 40, uts: 30, uas: 30 },
                { label: '45% / 25% / 30% (Praktik)', tugas: 45, uts: 25, uas: 30 },
                { label: '50% / 25% / 25% (Penugasan)', tugas: 50, uts: 25, uas: 25 },
                { label: '30% / 35% / 35% (Ujian)', tugas: 30, uts: 35, uas: 35 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setDraftWeights({
                      tugas: preset.tugas,
                      uts: preset.uts,
                      uas: preset.uas,
                    })
                  }
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-page hover:bg-secondary text-xs font-semibold text-primary transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Weight Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="weight-tugas-input"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Bobot Tugas (%)
              </label>
              <input
                id="weight-tugas-input"
                type="number"
                min={0}
                max={100}
                value={draftWeights.tugas}
                onChange={(e) =>
                  setDraftWeights((prev) => ({
                    ...prev,
                    tugas: Number(e.target.value || 0),
                  }))
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink font-bold tabular-nums text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="weight-uts-input"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Bobot UTS (%)
              </label>
              <input
                id="weight-uts-input"
                type="number"
                min={0}
                max={100}
                value={draftWeights.uts}
                onChange={(e) =>
                  setDraftWeights((prev) => ({
                    ...prev,
                    uts: Number(e.target.value || 0),
                  }))
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink font-bold tabular-nums text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="weight-uas-input"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Bobot UAS (%)
              </label>
              <input
                id="weight-uas-input"
                type="number"
                min={0}
                max={100}
                value={draftWeights.uas}
                onChange={(e) =>
                  setDraftWeights((prev) => ({
                    ...prev,
                    uas: Number(e.target.value || 0),
                  }))
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink font-bold tabular-nums text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Live Validation Banner */}
          <div
            role="status"
            className={`rounded-xl p-3.5 border flex items-start gap-2.5 text-xs sm:text-sm ${
              weightValidation.isValid
                ? 'bg-success-bg text-success border-success-border'
                : 'bg-danger-bg text-danger border-danger-border'
            }`}
          >
            {weightValidation.isValid ? (
              <CheckCircle2
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-bold">
                Total Bobot Saat Ini: {weightValidation.total}%
              </p>
              <p className="mt-0.5 leading-relaxed">
                {weightValidation.message}
              </p>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* ==================================================================== */}
      {/* BOTTOM SHEET 2: EDITOR NILAI SISWA (TUGAS DINAMIS, UTS, UAS)         */}
      {/* ==================================================================== */}
      <BottomSheet
        isOpen={Boolean(editingStudent)}
        onClose={handleCloseStudentEditor}
        title={
          hasEditPermission
            ? 'Input & Perbarui Nilai Siswa'
            : 'Rincian Komponen Nilai Siswa'
        }
        subtitle={
          editingStudent
            ? `${editingStudent.name} (NIS: ${editingStudent.nis}) — Kelas ${selectedClass.name}`
            : ''
        }
        footer={
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCloseStudentEditor}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Tutup
            </button>
            {hasEditPermission && (
              <button
                type="button"
                onClick={handleSaveStudentGrade}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
              >
                Simpan Nilai Siswa
              </button>
            )}
          </div>
        }
      >
        {editingStudent && (
          <div className="space-y-4">
            {/* Subject & Formula Context Banner */}
            <div className="bg-secondary rounded-xl p-3.5 space-y-1 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">
                  {selectedSubject.name} ({selectedSubject.code})
                </span>
                <span className="text-primary font-semibold">
                  {selectedPeriod.name}
                </span>
              </div>
              <p className="text-muted">
                Formula Bobot: Tugas {currentWeights.tugas}% + UTS{' '}
                {currentWeights.uts}% + UAS {currentWeights.uas}%
              </p>
            </div>

            {scoreValidationError && (
              <div
                role="alert"
                className="rounded-xl bg-danger-bg border border-danger-border text-danger p-3 text-xs sm:text-sm font-medium flex items-start gap-2"
              >
                <AlertCircle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{scoreValidationError}</span>
              </div>
            )}

            {/* Dynamic Task Components Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Komponen Nilai Tugas ({draftTasks.length} Penilaian)
                  </h3>
                  <p className="text-xs text-muted">
                    Jumlah penilaian tugas dapat bervariasi sesuai aktivitas
                    semester.
                  </p>
                </div>

                {hasEditPermission && (
                  <button
                    type="button"
                    onClick={handleAddTaskComponent}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-semibold transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Tambah Tugas</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {draftTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 bg-page rounded-xl p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`task-label-${idx}`}
                        className="sr-only"
                      >
                        Nama Komponen Tugas {idx + 1}
                      </label>
                      <input
                        id={`task-label-${idx}`}
                        type="text"
                        disabled={!hasEditPermission}
                        value={task.label}
                        onChange={(e) =>
                          handleTaskLabelChange(idx, e.target.value)
                        }
                        className="w-full min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-border text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="w-28 sm:w-32 shrink-0">
                      <label
                        htmlFor={`task-score-${idx}`}
                        className="sr-only"
                      >
                        Nilai {task.label}
                      </label>
                      <input
                        id={`task-score-${idx}`}
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        disabled={!hasEditPermission}
                        placeholder="Kosong"
                        value={task.score !== null ? task.score : ''}
                        onChange={(e) =>
                          handleTaskScoreChange(idx, e.target.value)
                        }
                        className="w-full min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-bold text-ink tabular-nums text-center focus:outline-none focus:border-primary"
                      />
                    </div>

                    {hasEditPermission && draftTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskComponent(idx)}
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
                  htmlFor="editor-uts-input"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  Nilai UTS (Bobot {currentWeights.uts}%)
                </label>
                <input
                  id="editor-uts-input"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  disabled={!hasEditPermission}
                  placeholder="Belum diisi (0-100)"
                  value={draftUts}
                  onChange={(e) => {
                    setScoreValidationError(null);
                    setDraftUts(e.target.value);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-bold text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="editor-uas-input"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  Nilai UAS (Bobot {currentWeights.uas}%)
                </label>
                <input
                  id="editor-uas-input"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  disabled={!hasEditPermission}
                  placeholder="Belum diisi (0-100)"
                  value={draftUas}
                  onChange={(e) => {
                    setScoreValidationError(null);
                    setDraftUas(e.target.value);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-bold text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Live Automatic Calculation Preview */}
            <div className="bg-page rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted">
                  Rata-rata Tugas ({liveEditorStats.filledTaskCount}/
                  {draftTasks.length} tugas terisi)
                </span>
                <span className="text-sm font-bold text-ink tabular-nums">
                  {liveEditorStats.taskAverage !== null
                    ? liveEditorStats.taskAverage
                    : 'Belum Tersedia'}
                </span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Nilai Akhir Hasil Perhitungan Otomatis
                  </p>
                  <p className="text-xs text-muted">
                    {liveEditorStats.isComplete &&
                    liveEditorStats.taskAverage !== null &&
                    parsedDraftUts !== null &&
                    parsedDraftUas !== null
                      ? `(${liveEditorStats.taskAverage} × ${currentWeights.tugas}%) + (${parsedDraftUts} × ${currentWeights.uts}%) + (${parsedDraftUas} × ${currentWeights.uas}%)`
                      : 'Menunggu seluruh komponen Tugas, UTS, dan UAS terisi lengkap'}
                  </p>
                </div>

                <span
                  className={`text-lg sm:text-xl font-bold tabular-nums shrink-0 ${
                    liveEditorStats.isComplete
                      ? 'text-primary'
                      : 'text-warning'
                  }`}
                >
                  {liveEditorStats.isComplete &&
                  liveEditorStats.finalScore !== null
                    ? liveEditorStats.finalScore
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

export default GradeManagementPage;
