import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AcademicPeriod,
  AttendanceSession,
  AttendanceStatus,
  DemoUserAccount,
  GradeWeightConfig,
  SchoolClass,
  Student,
  StudentGradeRecord,
  Subject,
  TaskScoreItem,
  Teacher,
  TeacherAssignment,
  UserRole,
} from '../types/academic';
import {
  DEMO_ACCOUNTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_CLASSES,
  INITIAL_GRADES,
  INITIAL_PERIODS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
} from '../data/mockData';
import { calculateFinalScore, validateWeights } from '../utils/academicRules';

const STORAGE_KEYS = {
  USER: 'monika_demo_user_v1',
  PERIODS: 'monika_demo_periods_v1',
  CLASSES: 'monika_demo_classes_v1',
  SUBJECTS: 'monika_demo_subjects_v1',
  TEACHERS: 'monika_demo_teachers_v1',
  ASSIGNMENTS: 'monika_demo_assignments_v1',
  STUDENTS: 'monika_demo_students_v1',
  GRADES: 'monika_demo_grades_v1',
  ATTENDANCE: 'monika_demo_attendance_v1',
  SELECTED_PERIOD: 'monika_demo_selected_period_v1',
};

export interface FeedbackBanner {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AcademicContextValue {
  currentUser: DemoUserAccount | null;
  demoAccounts: DemoUserAccount[];
  periods: AcademicPeriod[];
  activePeriod: AcademicPeriod;
  selectedPeriodId: string;
  setSelectedPeriodId: (periodId: string) => void;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  students: Student[];
  grades: StudentGradeRecord[];
  attendanceSessions: AttendanceSession[];
  feedback: FeedbackBanner | null;
  showFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearFeedback: () => void;

  // Auth & Demo Role Switch
  loginAsRole: (role: UserRole) => void;
  loginWithCredentials: (username: string) => DemoUserAccount;
  logout: () => void;
  switchStudentContext: (studentId: string) => void;
  switchHomeroomClassContext: (classId: string) => void;

  // Permission helper
  canEditSubjectGrade: (classId: string, subjectId: string, periodId?: string) => boolean;

  // Grade & Weight management
  getWeightsForClassSubject: (
    classId: string,
    subjectId: string,
    periodId: string
  ) => GradeWeightConfig;
  updateWeightsForClassSubject: (
    classId: string,
    subjectId: string,
    periodId: string,
    weights: GradeWeightConfig
  ) => { ok: boolean; message: string };
  upsertStudentGrade: (params: {
    studentId: string;
    classId: string;
    subjectId: string;
    periodId: string;
    tasks: TaskScoreItem[];
    uts: number | null;
    uas: number | null;
  }) => { ok: boolean; message: string; finalScore: number | null };

  // Attendance management
  upsertAttendanceSession: (session: {
    id?: string;
    date: string;
    classId: string;
    subjectId: string;
    periodId: string;
    teacherId: string;
    topic: string;
    records: { studentId: string; status: AttendanceStatus; note?: string }[];
  }) => { ok: boolean; message: string; sessionId: string };

  // Super Admin Master Data management
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (teacher: Teacher) => void;
  addClass: (cls: Omit<SchoolClass, 'id'>) => void;
  updateClass: (cls: SchoolClass) => void;
  addSubject: (sub: Omit<Subject, 'id'>) => void;
  updateSubject: (sub: Subject) => void;
  addPeriod: (period: Omit<AcademicPeriod, 'id' | 'order'>) => void;
  setActivePeriod: (periodId: string) => void;
  upsertAssignment: (
    classId: string,
    subjectId: string,
    periodId: string,
    teacherId: string
  ) => void;

  // Reset Demo Data
  resetDemoData: () => void;
}

const AcademicContext = createContext<AcademicContextValue | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(() =>
    loadFromStorage<DemoUserAccount | null>(STORAGE_KEYS.USER, DEMO_ACCOUNTS[0])
  );
  const [periods, setPeriods] = useState<AcademicPeriod[]>(() =>
    loadFromStorage(STORAGE_KEYS.PERIODS, INITIAL_PERIODS)
  );
  const [classes, setClasses] = useState<SchoolClass[]>(() =>
    loadFromStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES)
  );
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS)
  );
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    loadFromStorage(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS)
  );
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(() =>
    loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS)
  );
  const [students, setStudents] = useState<Student[]>(() =>
    loadFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS)
  );
  const [grades, setGrades] = useState<StudentGradeRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.GRADES, INITIAL_GRADES)
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(
    () => loadFromStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_SESSIONS)
  );

  const activePeriod = useMemo(
    () => periods.find((p) => p.isActive) || periods[periods.length - 1],
    [periods]
  );

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() =>
    loadFromStorage(STORAGE_KEYS.SELECTED_PERIOD, 'sem-4')
  );

  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);

  const showFeedback = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setFeedback({
      id: String(Date.now()),
      type,
      message,
    });
  };

  const clearFeedback = () => setFeedback(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch {
      // ignore storage errors
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
    } catch {}
  }, [periods]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch {}
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch {}
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    } catch {}
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    } catch {}
  }, [assignments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
    } catch {}
  }, [grades]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.ATTENDANCE,
        JSON.stringify(attendanceSessions)
      );
    } catch {}
  }, [attendanceSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_PERIOD,
        JSON.stringify(selectedPeriodId)
      );
    } catch {}
  }, [selectedPeriodId]);

  const loginAsRole = (role: UserRole) => {
    const account =
      DEMO_ACCOUNTS.find((a) => a.role === role) || DEMO_ACCOUNTS[0];
    setCurrentUser(account);
    showFeedback(
      `Berhasil masuk ke mode simulasi sebagai ${account.roleLabel} (${account.name}).`,
      'info'
    );
  };

  const loginWithCredentials = (username: string): DemoUserAccount => {
    const clean = username.trim().toLowerCase();
    let matched = DEMO_ACCOUNTS.find(
      (a) =>
        a.username.toLowerCase() === clean ||
        a.roleLabel.toLowerCase() === clean
    );
    if (!matched) {
      if (clean.includes('wali') && clean.includes('murid')) {
        matched = DEMO_ACCOUNTS.find((a) => a.role === 'wali_murid');
      } else if (clean.includes('ortu')) {
        matched = DEMO_ACCOUNTS.find((a) => a.role === 'wali_murid');
      } else if (clean.includes('wali')) {
        matched = DEMO_ACCOUNTS.find((a) => a.role === 'wali_kelas');
      } else if (clean.includes('guru')) {
        matched = DEMO_ACCOUNTS.find((a) => a.role === 'guru_mapel');
      } else if (clean.includes('siswa') || clean.startsWith('240')) {
        matched = DEMO_ACCOUNTS.find((a) => a.role === 'siswa');
      } else {
        matched = DEMO_ACCOUNTS[0];
      }
    }
    const finalAcc = matched || DEMO_ACCOUNTS[0];
    setCurrentUser(finalAcc);
    showFeedback(
      `Selamat datang, ${finalAcc.name} (${finalAcc.roleLabel}).`,
      'info'
    );
    return finalAcc;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchStudentContext = (studentId: string) => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent || !currentUser) return;
    const cls = classes.find((c) => c.id === targetStudent.classId);
    const initials = targetStudent.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    if (currentUser.role === 'siswa') {
      setCurrentUser({
        ...currentUser,
        name: targetStudent.name,
        username: targetStudent.nis,
        subtitle: `Siswa Kelas ${cls?.name || '-'} (NIS: ${targetStudent.nis})`,
        avatarInitials: initials,
        studentId: targetStudent.id,
        classId: targetStudent.classId,
      });
      showFeedback(
        `Beralih tampilan simulasi Siswa ke ${targetStudent.name} (Kelas ${cls?.name}).`,
        'info'
      );
    } else if (currentUser.role === 'wali_murid') {
      setCurrentUser({
        ...currentUser,
        name: targetStudent.parentName,
        subtitle: `Wali dari ${targetStudent.name} (Kelas ${cls?.name || '-'})`,
        studentId: targetStudent.id,
        classId: targetStudent.classId,
      });
      showFeedback(
        `Beralih tampilan simulasi Wali Murid ke orang tua dari ${targetStudent.name}.`,
        'info'
      );
    }
  };

  const switchHomeroomClassContext = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls || !currentUser) return;
    const homeroomTeacher = teachers.find((t) => t.id === cls.homeroomTeacherId);
    setCurrentUser({
      ...currentUser,
      classId: cls.id,
      teacherId: homeroomTeacher?.id || currentUser.teacherId,
      name: homeroomTeacher?.name || currentUser.name,
      subtitle: `Wali Kelas ${cls.name}`,
    });
    showFeedback(`Beralih pemantauan Wali Kelas ke Kelas ${cls.name}.`, 'info');
  };

  const canEditSubjectGrade = (
    classId: string,
    subjectId: string,
    periodId = selectedPeriodId
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'siswa' || currentUser.role === 'wali_murid') {
      return false;
    }
    if (currentUser.role === 'guru_mapel' || currentUser.role === 'wali_kelas') {
      const teacherId = currentUser.teacherId;
      if (!teacherId) return false;
      const assigned = assignments.some(
        (a) =>
          a.teacherId === teacherId &&
          a.classId === classId &&
          a.subjectId === subjectId &&
          a.periodId === periodId
      );
      if (assigned) return true;
      const teacher = teachers.find((t) => t.id === teacherId);
      return Boolean(teacher?.subjectIds.includes(subjectId));
    }
    return false;
  };

  const getWeightsForClassSubject = (
    classId: string,
    subjectId: string,
    periodId: string
  ): GradeWeightConfig => {
    const found = assignments.find(
      (a) =>
        a.classId === classId &&
        a.subjectId === subjectId &&
        a.periodId === periodId
    );
    if (found) return found.weights;
    const sub = subjects.find((s) => s.id === subjectId);
    return sub?.defaultWeights || { tugas: 40, uts: 30, uas: 30 };
  };

  const updateWeightsForClassSubject = (
    classId: string,
    subjectId: string,
    periodId: string,
    weights: GradeWeightConfig
  ): { ok: boolean; message: string } => {
    const check = validateWeights(weights);
    if (!check.isValid) {
      showFeedback(check.message, 'error');
      return { ok: false, message: check.message };
    }

    setAssignments((prev) => {
      const exists = prev.some(
        (a) =>
          a.classId === classId &&
          a.subjectId === subjectId &&
          a.periodId === periodId
      );
      if (exists) {
        return prev.map((a) =>
          a.classId === classId &&
          a.subjectId === subjectId &&
          a.periodId === periodId
            ? { ...a, weights: { ...weights } }
            : a
        );
      }
      return [
        ...prev,
        {
          id: `asg-${periodId}-${classId}-${subjectId}`,
          teacherId: currentUser?.teacherId || 'tch-3',
          classId,
          subjectId,
          periodId,
          weights: { ...weights },
        },
      ];
    });

    // Recalculate all student grades in that class, subject, and period
    setGrades((prev) =>
      prev.map((g) => {
        if (
          g.classId === classId &&
          g.subjectId === subjectId &&
          g.periodId === periodId
        ) {
          const calc = calculateFinalScore(g.tasks, g.uts, g.uas, weights);
          return {
            ...g,
            finalScore: calc.finalScore,
            isComplete: calc.isComplete,
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
        return g;
      })
    );

    const msg = `Bobot penilaian berhasil diperbarui (Tugas ${weights.tugas}%, UTS ${weights.uts}%, UAS ${weights.uas}%) dan seluruh nilai akhir siswa telah dihitung ulang.`;
    showFeedback(msg, 'success');
    return { ok: true, message: msg };
  };

  const upsertStudentGrade = (params: {
    studentId: string;
    classId: string;
    subjectId: string;
    periodId: string;
    tasks: TaskScoreItem[];
    uts: number | null;
    uas: number | null;
  }): { ok: boolean; message: string; finalScore: number | null } => {
    if (
      !canEditSubjectGrade(params.classId, params.subjectId, params.periodId)
    ) {
      const errMsg =
        'Anda tidak memiliki hak akses untuk mengubah nilai pada mata pelajaran yang tidak diampu.';
      showFeedback(errMsg, 'error');
      return { ok: false, message: errMsg, finalScore: null };
    }

    // Validate score range 0..100
    const allScores = [
      ...params.tasks.map((t) => t.score),
      params.uts,
      params.uas,
    ].filter((s): s is number => s !== null && s !== undefined);

    if (allScores.some((s) => s < 0 || s > 100 || Number.isNaN(s))) {
      const errMsg = 'Nilai setiap komponen harus berada pada rentang skala 0 hingga 100.';
      showFeedback(errMsg, 'error');
      return { ok: false, message: errMsg, finalScore: null };
    }

    const weights = getWeightsForClassSubject(
      params.classId,
      params.subjectId,
      params.periodId
    );
    const calc = calculateFinalScore(
      params.tasks,
      params.uts,
      params.uas,
      weights
    );
    const today = new Date().toISOString().slice(0, 10);

    setGrades((prev) => {
      const idx = prev.findIndex(
        (g) =>
          g.studentId === params.studentId &&
          g.subjectId === params.subjectId &&
          g.periodId === params.periodId
      );
      const updatedRecord: StudentGradeRecord = {
        id:
          idx >= 0
            ? prev[idx].id
            : `grd-${params.periodId}-${params.studentId}-${params.subjectId}`,
        studentId: params.studentId,
        classId: params.classId,
        subjectId: params.subjectId,
        periodId: params.periodId,
        tasks: params.tasks,
        uts: params.uts,
        uas: params.uas,
        finalScore: calc.finalScore,
        isComplete: calc.isComplete,
        updatedAt: today,
        updatedByTeacherId: currentUser?.teacherId,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [...prev, updatedRecord];
    });

    const student = students.find((s) => s.id === params.studentId);
    const subject = subjects.find((s) => s.id === params.subjectId);
    const msg = calc.isComplete
      ? `Nilai ${subject?.name || ''} untuk ${student?.name || 'siswa'} berhasil disimpan. Nilai Akhir: ${calc.finalScore}.`
      : `Data komponen nilai ${subject?.name || ''} untuk ${student?.name || 'siswa'} disimpan sebagian (belum lengkap).`;
    showFeedback(msg, 'success');
    return { ok: true, message: msg, finalScore: calc.finalScore };
  };

  const upsertAttendanceSession = (session: {
    id?: string;
    date: string;
    classId: string;
    subjectId: string;
    periodId: string;
    teacherId: string;
    topic: string;
    records: { studentId: string; status: AttendanceStatus; note?: string }[];
  }): { ok: boolean; message: string; sessionId: string } => {
    const existing = attendanceSessions.find(
      (s) =>
        (session.id && s.id === session.id) ||
        (s.date === session.date &&
          s.classId === session.classId &&
          s.subjectId === session.subjectId &&
          s.periodId === session.periodId)
    );

    const sessionId =
      existing?.id ||
      session.id ||
      `att-${session.periodId}-${session.classId}-${Date.now()}`;

    const newSession: AttendanceSession = {
      id: sessionId,
      date: session.date,
      classId: session.classId,
      subjectId: session.subjectId,
      periodId: session.periodId,
      teacherId: session.teacherId,
      topic: session.topic.trim() || 'Pertemuan Pembelajaran',
      records: session.records,
    };

    setAttendanceSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newSession;
        return next;
      }
      return [newSession, ...prev];
    });

    const cls = classes.find((c) => c.id === session.classId);
    const msg = `Presensi kelas ${cls?.name || ''} tanggal ${session.date} berhasil disimpan dan rekapitulasi kehadiran telah diperbarui.`;
    showFeedback(msg, 'success');
    return { ok: true, message: msg, sessionId };
  };

  // Super Admin Master Data handlers
  const addStudent = (student: Omit<Student, 'id'>) => {
    const newId = `stu-${Date.now()}`;
    const newStudent: Student = { ...student, id: newId };
    setStudents((prev) => [...prev, newStudent]);
    showFeedback(`Data siswa ${student.name} berhasil ditambahkan.`, 'success');
  };

  const updateStudent = (student: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? student : s))
    );
    showFeedback(`Data siswa ${student.name} berhasil diperbarui.`, 'success');
  };

  const deleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setGrades((prev) => prev.filter((g) => g.studentId !== studentId));
    showFeedback(
      `Data siswa ${target?.name || ''} telah dihapus dari daftar simulasi.`,
      'info'
    );
  };

  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = { ...teacher, id: `tch-${Date.now()}` };
    setTeachers((prev) => [...prev, newTeacher]);
    showFeedback(`Data guru ${teacher.name} berhasil ditambahkan.`, 'success');
  };

  const updateTeacher = (teacher: Teacher) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacher.id ? teacher : t))
    );
    showFeedback(`Data guru ${teacher.name} berhasil diperbarui.`, 'success');
  };

  const addClass = (cls: Omit<SchoolClass, 'id'>) => {
    const newClass: SchoolClass = { ...cls, id: `cls-${Date.now()}` };
    setClasses((prev) => [...prev, newClass]);
    showFeedback(`Kelas ${cls.name} berhasil ditambahkan.`, 'success');
  };

  const updateClass = (cls: SchoolClass) => {
    setClasses((prev) => prev.map((c) => (c.id === cls.id ? cls : c)));
    showFeedback(`Data kelas ${cls.name} berhasil diperbarui.`, 'success');
  };

  const addSubject = (sub: Omit<Subject, 'id'>) => {
    const newSub: Subject = { ...sub, id: `sub-${Date.now()}` };
    setSubjects((prev) => [...prev, newSub]);
    showFeedback(
      `Mata pelajaran ${sub.name} berhasil ditambahkan.`,
      'success'
    );
  };

  const updateSubject = (sub: Subject) => {
    setSubjects((prev) => prev.map((s) => (s.id === sub.id ? sub : s)));
    showFeedback(`Mata pelajaran ${sub.name} berhasil diperbarui.`, 'success');
  };

  const addPeriod = (period: Omit<AcademicPeriod, 'id' | 'order'>) => {
    const nextOrder =
      periods.reduce((max, p) => Math.max(max, p.order), 0) + 1;
    const newPeriod: AcademicPeriod = {
      ...period,
      id: `sem-${nextOrder}-${Date.now()}`,
      order: nextOrder,
    };
    setPeriods((prev) => {
      const base = period.isActive
        ? prev.map((p) => ({ ...p, isActive: false }))
        : prev;
      return [...base, newPeriod];
    });
    if (period.isActive) {
      setSelectedPeriodId(newPeriod.id);
    }
    showFeedback(`Periode akademik ${period.name} berhasil ditambahkan.`, 'success');
  };

  const setActivePeriod = (periodId: string) => {
    setPeriods((prev) =>
      prev.map((p) => ({ ...p, isActive: p.id === periodId }))
    );
    setSelectedPeriodId(periodId);
    const target = periods.find((p) => p.id === periodId);
    showFeedback(
      `Periode aktif berhasil diubah ke ${target?.name || periodId}.`,
      'success'
    );
  };

  const upsertAssignment = (
    classId: string,
    subjectId: string,
    periodId: string,
    teacherId: string
  ) => {
    const sub = subjects.find((s) => s.id === subjectId);
    setAssignments((prev) => {
      const exists = prev.some(
        (a) =>
          a.classId === classId &&
          a.subjectId === subjectId &&
          a.periodId === periodId
      );
      if (exists) {
        return prev.map((a) =>
          a.classId === classId &&
          a.subjectId === subjectId &&
          a.periodId === periodId
            ? { ...a, teacherId }
            : a
        );
      }
      return [
        ...prev,
        {
          id: `asg-${periodId}-${classId}-${subjectId}`,
          teacherId,
          classId,
          subjectId,
          periodId,
          weights: sub?.defaultWeights || { tugas: 40, uts: 30, uas: 30 },
        },
      ];
    });
    showFeedback(
      'Penugasan guru mata pelajaran dan kelas berhasil diperbarui.',
      'success'
    );
  };

  const resetDemoData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    setPeriods(INITIAL_PERIODS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setTeachers(INITIAL_TEACHERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setStudents(INITIAL_STUDENTS);
    setGrades(INITIAL_GRADES);
    setAttendanceSessions(INITIAL_ATTENDANCE_SESSIONS);
    setSelectedPeriodId('sem-4');
    showFeedback(
      'Seluruh data simulasi MONIKA berhasil dikembalikan ke kondisi awal.',
      'info'
    );
  };

  return (
    <AcademicContext.Provider
      value={{
        currentUser,
        demoAccounts: DEMO_ACCOUNTS,
        periods,
        activePeriod,
        selectedPeriodId,
        setSelectedPeriodId,
        classes,
        subjects,
        teachers,
        assignments,
        students,
        grades,
        attendanceSessions,
        feedback,
        showFeedback,
        clearFeedback,
        loginAsRole,
        loginWithCredentials,
        logout,
        switchStudentContext,
        switchHomeroomClassContext,
        canEditSubjectGrade,
        getWeightsForClassSubject,
        updateWeightsForClassSubject,
        upsertStudentGrade,
        upsertAttendanceSession,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        addClass,
        updateClass,
        addSubject,
        updateSubject,
        addPeriod,
        setActivePeriod,
        upsertAssignment,
        resetDemoData,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export function useAcademic(): AcademicContextValue {
  const ctx = useContext(AcademicContext);
  if (!ctx) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return ctx;
}
