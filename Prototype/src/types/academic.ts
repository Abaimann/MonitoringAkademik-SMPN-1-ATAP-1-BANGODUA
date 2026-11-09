export type UserRole =
  | 'super_admin'
  | 'wali_kelas'
  | 'guru_mapel'
  | 'siswa'
  | 'wali_murid';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export type TrendDirection = 'meningkat' | 'menurun' | 'stabil' | 'belum_cukup_data';

export type SubjectCluster =
  | 'sains_teknologi'
  | 'sosial_humaniora'
  | 'bahasa_komunikasi'
  | 'terapan_prakarya';

export interface AcademicPeriod {
  id: string;
  code: string; // e.g., "SEM-1", "SEM-2", "SEM-3", "SEM-4"
  name: string; // e.g., "Semester 1"
  academicYear: string; // e.g., "2024/2025"
  semesterType: 'Ganjil' | 'Genap';
  order: number; // 1, 2, 3, 4
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "IX-A", "IX-B", "VIII-A"
  gradeLevel: 7 | 8 | 9;
  homeroomTeacherId: string; // Teacher ID of Wali Kelas
  academicYear: string;
  roomNumber: string;
}

export interface Subject {
  id: string;
  code: string; // e.g., "MTK", "BIND", "IPA"
  name: string;
  cluster: SubjectCluster;
  monitoringThreshold: number; // Ambang pemantauan demonstrasi (e.g., 72)
  defaultWeights: GradeWeightConfig;
}

export interface GradeWeightConfig {
  tugas: number; // percentage e.g. 40
  uts: number; // percentage e.g. 30
  uas: number; // percentage e.g. 30
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  isHomeroom: boolean;
  homeroomClassId?: string;
  subjectIds: string[];
  status: 'aktif' | 'cuti';
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  periodId: string;
  weights: GradeWeightConfig;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  enrollmentYear: string;
  demoPatternNote: string; // Transparent note for thesis demo (e.g., "Pola Nilai Meningkat Konsisten")
}

export interface TaskScoreItem {
  id: string;
  label: string; // e.g. "Tugas 1", "Tugas 2", "Tugas 3"
  score: number | null; // null if not yet graded
}

export interface StudentGradeRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  periodId: string;
  tasks: TaskScoreItem[];
  uts: number | null;
  uas: number | null;
  finalScore: number | null; // Computed automatically using weights when complete or partial
  isComplete: boolean;
  updatedAt: string;
  updatedByTeacherId?: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  subjectId: string; // or 'HARIAN' for homeroom daily check, or specific subjectId
  periodId: string;
  teacherId: string;
  topic: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    note?: string;
  }[];
}

export interface DemoUserAccount {
  id: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  username: string;
  subtitle: string;
  avatarInitials: string;
  teacherId?: string;
  classId?: string;
  studentId?: string;
  description: string;
}

export interface AttendanceRecap {
  studentId: string;
  periodId: string;
  totalMeetings: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number | null; // null when totalMeetings === 0 ("Data belum tersedia")
}

export interface PeriodComparisonResult {
  previousPeriodId: string | null;
  previousPeriodName: string | null;
  currentPeriodId: string;
  currentPeriodName: string;
  previousScore: number | null;
  currentScore: number | null;
  delta: number | null;
  percentageChange: number | null;
  status: TrendDirection;
  ruleExplanation: string;
}

export interface SubjectComparisonItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  cluster: SubjectCluster;
  previousScore: number | null;
  currentScore: number | null;
  delta: number | null;
  percentageChange: number | null;
  status: TrendDirection;
  isComplete: boolean;
  threshold: number;
}

export interface AttentionTrigger {
  type: 'penurunan_nilai' | 'bawah_ambang' | 'kehadiran_rendah' | 'data_belum_lengkap';
  label: 'Memerlukan Perhatian' | 'Perlu Evaluasi';
  title: string;
  detail: string;
  metricValue: string;
  subjectId?: string;
  subjectName?: string;
}

export interface StudentAttentionSummary {
  student: Student;
  className: string;
  periodId: string;
  averageScore: number | null;
  previousAverageScore: number | null;
  scoreDelta: number | null;
  attendancePercentage: number | null;
  incompleteSubjectsCount: number;
  triggers: AttentionTrigger[];
  primaryLabel: 'Memerlukan Perhatian' | 'Perlu Evaluasi';
}

export interface ContinuationProfileAnalysis {
  studentId: string;
  periodId: string;
  overallAverage: number | null;
  trendStatus: TrendDirection;
  attendancePercentage: number | null;
  strongSubjects: {
    subjectId: string;
    subjectName: string;
    score: number;
    cluster: SubjectCluster;
  }[];
  clusterScores: {
    cluster: SubjectCluster;
    label: string;
    average: number | null;
    subjects: string[];
  }[];
  smaConsiderations: {
    title: string;
    generalExplanation: string;
    relevantClusters: string[];
    academicBasis: string[];
  };
  smkConsiderations: {
    title: string;
    generalExplanation: string;
    relevantFields: string[];
    academicBasis: string[];
  };
  narrativeReasoning: string;
  disclaimerText: string;
}
