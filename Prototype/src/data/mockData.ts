import {
  AcademicPeriod,
  AttendanceSession,
  AttendanceStatus,
  DemoUserAccount,
  SchoolClass,
  Student,
  StudentGradeRecord,
  Subject,
  Teacher,
  TeacherAssignment,
} from '../types/academic';
import { calculateFinalScore } from '../utils/academicRules';

export const INITIAL_PERIODS: AcademicPeriod[] = [
  {
    id: 'sem-1',
    code: 'SEM-1',
    name: 'Semester 1 (Ganjil 2024/2025)',
    academicYear: '2024/2025',
    semesterType: 'Ganjil',
    order: 1,
    isActive: false,
    startDate: '2024-07-15',
    endDate: '2024-12-20',
  },
  {
    id: 'sem-2',
    code: 'SEM-2',
    name: 'Semester 2 (Genap 2024/2025)',
    academicYear: '2024/2025',
    semesterType: 'Genap',
    order: 2,
    isActive: false,
    startDate: '2025-01-06',
    endDate: '2025-06-20',
  },
  {
    id: 'sem-3',
    code: 'SEM-3',
    name: 'Semester 3 (Ganjil 2025/2026)',
    academicYear: '2025/2026',
    semesterType: 'Ganjil',
    order: 3,
    isActive: false,
    startDate: '2025-07-14',
    endDate: '2025-12-19',
  },
  {
    id: 'sem-4',
    code: 'SEM-4',
    name: 'Semester 4 (Genap 2025/2026)',
    academicYear: '2025/2026',
    semesterType: 'Genap',
    order: 4,
    isActive: true,
    startDate: '2026-01-05',
    endDate: '2026-06-19',
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-mtk',
    code: 'MTK',
    name: 'Matematika',
    cluster: 'sains_teknologi',
    monitoringThreshold: 72,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-bind',
    code: 'BIND',
    name: 'Bahasa Indonesia',
    cluster: 'bahasa_komunikasi',
    monitoringThreshold: 75,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-ipa',
    code: 'IPA',
    name: 'Ilmu Pengetahuan Alam (IPA)',
    cluster: 'sains_teknologi',
    monitoringThreshold: 72,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-bing',
    code: 'BING',
    name: 'Bahasa Inggris',
    cluster: 'bahasa_komunikasi',
    monitoringThreshold: 72,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-ips',
    code: 'IPS',
    name: 'Ilmu Pengetahuan Sosial (IPS)',
    cluster: 'sosial_humaniora',
    monitoringThreshold: 73,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-ppkn',
    code: 'PPKN',
    name: 'Pendidikan Pancasila (PPKn)',
    cluster: 'sosial_humaniora',
    monitoringThreshold: 75,
    defaultWeights: { tugas: 40, uts: 30, uas: 30 },
  },
  {
    id: 'sub-inf',
    code: 'INF',
    name: 'Informatika & Prakarya',
    cluster: 'terapan_prakarya',
    monitoringThreshold: 73,
    defaultWeights: { tugas: 45, uts: 25, uas: 30 },
  },
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    nip: '197804122005011004',
    name: 'Drs. H. Suparman, M.Pd.',
    email: 'suparman.admin@smpnsatap1bangodua.sch.id',
    phone: '0812-2301-4401',
    isHomeroom: false,
    subjectIds: ['sub-ppkn'],
    status: 'aktif',
  },
  {
    id: 'tch-2',
    nip: '198406182009022003',
    name: 'Siti Nurhaliza, S.Pd.',
    email: 'siti.nurhaliza@smpnsatap1bangodua.sch.id',
    phone: '0813-2409-1102',
    isHomeroom: true,
    homeroomClassId: 'cls-9a',
    subjectIds: ['sub-bind'],
    status: 'aktif',
  },
  {
    id: 'tch-3',
    nip: '198611032011011007',
    name: 'Ahmad Fauzi, S.Pd.',
    email: 'ahmad.fauzi@smpnsatap1bangodua.sch.id',
    phone: '0812-9845-3303',
    isHomeroom: false,
    subjectIds: ['sub-mtk', 'sub-ipa'],
    status: 'aktif',
  },
  {
    id: 'tch-4',
    nip: '198502252010012009',
    name: 'Ratna Wulandari, S.Pd.',
    email: 'ratna.wulandari@smpnsatap1bangodua.sch.id',
    phone: '0813-8821-5504',
    isHomeroom: true,
    homeroomClassId: 'cls-9b',
    subjectIds: ['sub-bing'],
    status: 'aktif',
  },
  {
    id: 'tch-5',
    nip: '198809142014021002',
    name: 'Dedi Hermawan, S.Pd.',
    email: 'dedi.hermawan@smpnsatap1bangodua.sch.id',
    phone: '0812-7734-6605',
    isHomeroom: true,
    homeroomClassId: 'cls-8a',
    subjectIds: ['sub-ips'],
    status: 'aktif',
  },
  {
    id: 'tch-6',
    nip: '199103092017012005',
    name: 'Lilis Suryani, S.Pd.',
    email: 'lilis.suryani@smpnsatap1bangodua.sch.id',
    phone: '0813-6612-7706',
    isHomeroom: false,
    subjectIds: ['sub-ipa'],
    status: 'aktif',
  },
  {
    id: 'tch-7',
    nip: '199307212019031008',
    name: 'Rudi Hartono, S.Kom.',
    email: 'rudi.hartono@smpnsatap1bangodua.sch.id',
    phone: '0812-5590-8807',
    isHomeroom: false,
    subjectIds: ['sub-inf'],
    status: 'aktif',
  },
  {
    id: 'tch-8',
    nip: '199012112015022001',
    name: 'Nurul Hidayah, S.Pd.',
    email: 'nurul.hidayah@smpnsatap1bangodua.sch.id',
    phone: '0813-4418-9908',
    isHomeroom: false,
    subjectIds: ['sub-ppkn', 'sub-bind'],
    status: 'aktif',
  },
];

export const INITIAL_CLASSES: SchoolClass[] = [
  {
    id: 'cls-9a',
    name: 'IX-A',
    gradeLevel: 9,
    homeroomTeacherId: 'tch-2',
    academicYear: '2025/2026',
    roomNumber: 'R-01',
  },
  {
    id: 'cls-9b',
    name: 'IX-B',
    gradeLevel: 9,
    homeroomTeacherId: 'tch-4',
    academicYear: '2025/2026',
    roomNumber: 'R-02',
  },
  {
    id: 'cls-8a',
    name: 'VIII-A',
    gradeLevel: 8,
    homeroomTeacherId: 'tch-5',
    academicYear: '2025/2026',
    roomNumber: 'R-03',
  },
];

export const INITIAL_ASSIGNMENTS: TeacherAssignment[] = [];

const subjectTeacherMap: Record<string, string> = {
  'sub-mtk': 'tch-3',
  'sub-bind': 'tch-2',
  'sub-ipa': 'tch-6',
  'sub-bing': 'tch-4',
  'sub-ips': 'tch-5',
  'sub-ppkn': 'tch-8',
  'sub-inf': 'tch-7',
};

for (const period of INITIAL_PERIODS) {
  for (const cls of INITIAL_CLASSES) {
    for (const sub of INITIAL_SUBJECTS) {
      // Allow Ahmad Fauzi (tch-3) to also teach IPA in cls-9a so Guru Mapel demo has 2 subjects & 3 classes
      const assignedTeacherId =
        sub.id === 'sub-ipa' && cls.id === 'cls-9a'
          ? 'tch-3'
          : subjectTeacherMap[sub.id];
      INITIAL_ASSIGNMENTS.push({
        id: `asg-${period.id}-${cls.id}-${sub.id}`,
        teacherId: assignedTeacherId,
        classId: cls.id,
        subjectId: sub.id,
        periodId: period.id,
        weights: { ...sub.defaultWeights },
      });
    }
  }
}

interface StudentSeed {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  pattern:
    | 'rising_stem'
    | 'declining_alert'
    | 'stable_lang'
    | 'rising_tech'
    | 'low_attendance'
    | 'declining_math'
    | 'stable_social'
    | 'low_attendance_drop'
    | 'incomplete_data'
    | 'rising_social'
    | 'below_threshold'
    | 'stable_balanced';
  demoPatternNote: string;
}

const STUDENT_SEEDS: StudentSeed[] = [
  // KELAS IX-A (12 Siswa)
  {
    id: 'stu-1',
    nis: '2409001',
    nisn: '0094120001',
    name: 'Dimas Pratama',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-03-14',
    parentName: 'Hendra Pratama',
    parentPhone: '0812-3001-1001',
    pattern: 'rising_stem',
    demoPatternNote: 'Pola nilai meningkat konsisten, kuat di Matematika & IPA',
  },
  {
    id: 'stu-2',
    nis: '2409002',
    nisn: '0094120002',
    name: 'Fajar Nugraha',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-05-22',
    parentName: 'Slamet Nugraha',
    parentPhone: '0812-3001-1002',
    pattern: 'declining_alert',
    demoPatternNote: 'Pola nilai menurun pada Semester 4 (Memerlukan Perhatian)',
  },
  {
    id: 'stu-3',
    nis: '2409003',
    nisn: '0094120003',
    name: 'Siti Rahmawati',
    gender: 'P',
    classId: 'cls-9a',
    birthDate: '2011-01-19',
    parentName: 'Mulyono',
    parentPhone: '0812-3001-1003',
    pattern: 'stable_lang',
    demoPatternNote: 'Pola nilai stabil tinggi, unggul di Bahasa & Literasi',
  },
  {
    id: 'stu-4',
    nis: '2409004',
    nisn: '0094120004',
    name: 'Nabila Putri Kinanti',
    gender: 'P',
    classId: 'cls-9a',
    birthDate: '2011-07-08',
    parentName: 'Agus Salim',
    parentPhone: '0812-3001-1004',
    pattern: 'rising_tech',
    demoPatternNote: 'Pola nilai meningkat, unggul di Informatika & Prakarya',
  },
  {
    id: 'stu-5',
    nis: '2409005',
    nisn: '0094120005',
    name: 'Hendri Saputra',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2010-11-30',
    parentName: 'Wawan Saputra',
    parentPhone: '0812-3001-1005',
    pattern: 'low_attendance',
    demoPatternNote: 'Persentase kehadiran rendah (< 85%), nilai stabil menengah',
  },
  {
    id: 'stu-6',
    nis: '2409006',
    nisn: '0094120006',
    name: 'Galih Permana',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-02-11',
    parentName: 'Bambang Permana',
    parentPhone: '0812-3001-1006',
    pattern: 'declining_math',
    demoPatternNote: 'Penurunan pada Matematika & IPA di Semester 4 (Perlu Evaluasi)',
  },
  {
    id: 'stu-7',
    nis: '2409007',
    nisn: '0094120007',
    name: 'Rina Kartika Sari',
    gender: 'P',
    classId: 'cls-9a',
    birthDate: '2011-09-04',
    parentName: 'Tono Suryono',
    parentPhone: '0812-3001-1007',
    pattern: 'stable_social',
    demoPatternNote: 'Pola nilai stabil, kuat di IPS & PPKn',
  },
  {
    id: 'stu-8',
    nis: '2409008',
    nisn: '0094120008',
    name: 'Aldi Firmansyah',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-04-17',
    parentName: 'Yudi Firmansyah',
    parentPhone: '0812-3001-1008',
    pattern: 'low_attendance_drop',
    demoPatternNote: 'Kehadiran rendah disertai capaian di bawah ambang pemantauan',
  },
  {
    id: 'stu-9',
    nis: '2409009',
    nisn: '0094120009',
    name: 'Citra Lestari',
    gender: 'P',
    classId: 'cls-9a',
    birthDate: '2011-08-25',
    parentName: 'Kurniawan',
    parentPhone: '0812-3001-1009',
    pattern: 'incomplete_data',
    demoPatternNote: 'Data nilai UAS Matematika & IPA Semester 4 belum lengkap',
  },
  {
    id: 'stu-10',
    nis: '2409010',
    nisn: '0094120010',
    name: 'Bagas Adi Wijaya',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-06-12',
    parentName: 'Adi Wijaya',
    parentPhone: '0812-3001-1010',
    pattern: 'rising_social',
    demoPatternNote: 'Pola nilai meningkat konsisten, unggul di rumpun Sosial & Bahasa',
  },
  {
    id: 'stu-11',
    nis: '2409011',
    nisn: '0094120011',
    name: 'Putri Ayu Wandira',
    gender: 'P',
    classId: 'cls-9a',
    birthDate: '2011-10-03',
    parentName: 'Suharto',
    parentPhone: '0812-3001-1011',
    pattern: 'below_threshold',
    demoPatternNote: 'Beberapa mata pelajaran berada sedikit di bawah ambang pemantauan',
  },
  {
    id: 'stu-12',
    nis: '2409012',
    nisn: '0094120012',
    name: 'Muhammad Farhan',
    gender: 'L',
    classId: 'cls-9a',
    birthDate: '2011-12-01',
    parentName: 'Ridwan',
    parentPhone: '0812-3001-1012',
    pattern: 'stable_balanced',
    demoPatternNote: 'Pola nilai stabil merata di seluruh mata pelajaran',
  },

  // KELAS IX-B (12 Siswa)
  {
    id: 'stu-13',
    nis: '2409013',
    nisn: '0094120013',
    name: 'Rizky Ramadhan',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2011-08-15',
    parentName: 'Syamsul Bahri',
    parentPhone: '0812-3001-1013',
    pattern: 'rising_stem',
    demoPatternNote: 'Pola nilai meningkat signifikan, kuat di Sains & Teknologi',
  },
  {
    id: 'stu-14',
    nis: '2409014',
    nisn: '0094120014',
    name: 'Dewi Anggraini',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-02-28',
    parentName: 'Sutrisno',
    parentPhone: '0812-3001-1014',
    pattern: 'stable_lang',
    demoPatternNote: 'Pola nilai stabil tinggi, unggul di Bahasa Inggris & Indonesia',
  },
  {
    id: 'stu-15',
    nis: '2409015',
    nisn: '0094120015',
    name: 'Bayu Setiawan',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2011-05-09',
    parentName: 'Joko Setiawan',
    parentPhone: '0812-3001-1015',
    pattern: 'declining_alert',
    demoPatternNote: 'Rata-rata nilai menurun di Semester 4 (Memerlukan Perhatian)',
  },
  {
    id: 'stu-16',
    nis: '2409016',
    nisn: '0094120016',
    name: 'Eko Prasetyo',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2010-12-19',
    parentName: 'Sugeng Prasetyo',
    parentPhone: '0812-3001-1016',
    pattern: 'low_attendance',
    demoPatternNote: 'Tingkat kehadiran perlu perhatian (< 85%)',
  },
  {
    id: 'stu-17',
    nis: '2409017',
    nisn: '0094120017',
    name: 'Intan Permatasari',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-04-03',
    parentName: 'Heru Santoso',
    parentPhone: '0812-3001-1017',
    pattern: 'rising_tech',
    demoPatternNote: 'Pola nilai meningkat, kuat di Informatika & Matematika',
  },
  {
    id: 'stu-18',
    nis: '2409018',
    nisn: '0094120018',
    name: 'Maya Sari Dewi',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-07-21',
    parentName: 'Lukman Hakim',
    parentPhone: '0812-3001-1018',
    pattern: 'incomplete_data',
    demoPatternNote: 'Komponen nilai UAS Bahasa Inggris Semester 4 belum terisi',
  },
  {
    id: 'stu-19',
    nis: '2409019',
    nisn: '0094120019',
    name: 'Arif Budiman',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2011-01-25',
    parentName: 'Hasanudin',
    parentPhone: '0812-3001-1019',
    pattern: 'stable_social',
    demoPatternNote: 'Pola nilai stabil, kuat di IPS & Pendidikan Pancasila',
  },
  {
    id: 'stu-20',
    nis: '2409020',
    nisn: '0094120020',
    name: 'Lestari Handayani',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-09-14',
    parentName: 'Wahyu Hidayat',
    parentPhone: '0812-3001-1020',
    pattern: 'rising_social',
    demoPatternNote: 'Pola nilai meningkat konsisten di semua mata pelajaran',
  },
  {
    id: 'stu-21',
    nis: '2409021',
    nisn: '0094120021',
    name: 'Dian Kusuma Wardani',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-03-30',
    parentName: 'Taufik Hidayat',
    parentPhone: '0812-3001-1021',
    pattern: 'stable_balanced',
    demoPatternNote: 'Pola nilai stabil dan kehadiran sangat baik',
  },
  {
    id: 'stu-22',
    nis: '2409022',
    nisn: '0094120022',
    name: 'Reza Pahlevi',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2011-06-05',
    parentName: 'Anwar Sadat',
    parentPhone: '0812-3001-1022',
    pattern: 'declining_math',
    demoPatternNote: 'Penurunan nilai Matematika pada Semester 4 (Perlu Evaluasi)',
  },
  {
    id: 'stu-23',
    nis: '2409023',
    nisn: '0094120023',
    name: 'Amelia Zahra',
    gender: 'P',
    classId: 'cls-9b',
    birthDate: '2011-11-11',
    parentName: 'Zainal Abidin',
    parentPhone: '0812-3001-1023',
    pattern: 'rising_stem',
    demoPatternNote: 'Peningkatan bertahap pada mata pelajaran IPA dan Matematika',
  },
  {
    id: 'stu-24',
    nis: '2409024',
    nisn: '0094120024',
    name: 'Gilang Ramadhan',
    gender: 'L',
    classId: 'cls-9b',
    birthDate: '2011-08-29',
    parentName: 'Maman Abdurrahman',
    parentPhone: '0812-3001-1024',
    pattern: 'below_threshold',
    demoPatternNote: 'Capaian Matematika & Bahasa Inggris memerlukan penguatan',
  },

  // KELAS VIII-A (12 Siswa)
  {
    id: 'stu-25',
    nis: '2508001',
    nisn: '0104120001',
    name: 'Zahra Aulia Rahma',
    gender: 'P',
    classId: 'cls-8a',
    birthDate: '2012-02-14',
    parentName: 'Rahmat Hidayat',
    parentPhone: '0812-3001-1025',
    pattern: 'rising_stem',
    demoPatternNote: 'Pola nilai meningkat konsisten, unggul di Matematika & IPA',
  },
  {
    id: 'stu-26',
    nis: '2508002',
    nisn: '0104120002',
    name: 'Kevin Pratama Putra',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-04-20',
    parentName: 'Budi Pratama',
    parentPhone: '0812-3001-1026',
    pattern: 'rising_tech',
    demoPatternNote: 'Pola nilai meningkat, sangat menonjol di Informatika & Prakarya',
  },
  {
    id: 'stu-27',
    nis: '2508003',
    nisn: '0104120003',
    name: 'Toni Kurniawan',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-01-08',
    parentName: 'Iwan Kurniawan',
    parentPhone: '0812-3001-1027',
    pattern: 'declining_alert',
    demoPatternNote: 'Penurunan nilai di Semester 4 (Memerlukan Perhatian)',
  },
  {
    id: 'stu-28',
    nis: '2508004',
    nisn: '0104120004',
    name: 'Dedi Kusuma',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-06-17',
    parentName: 'Kusuma Jaya',
    parentPhone: '0812-3001-1028',
    pattern: 'low_attendance_drop',
    demoPatternNote: 'Kehadiran rendah (< 80%) dan nilai perlu evaluasi',
  },
  {
    id: 'stu-29',
    nis: '2508005',
    nisn: '0104120005',
    name: 'Syifa Nuraini',
    gender: 'P',
    classId: 'cls-8a',
    birthDate: '2012-09-23',
    parentName: 'Ahmad Nuraini',
    parentPhone: '0812-3001-1029',
    pattern: 'stable_lang',
    demoPatternNote: 'Capaian stabil tinggi pada Bahasa Indonesia & Bahasa Inggris',
  },
  {
    id: 'stu-30',
    nis: '2508006',
    nisn: '0104120006',
    name: 'Ilham Maulana',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-11-05',
    parentName: 'Maulana Yusuf',
    parentPhone: '0812-3001-1030',
    pattern: 'incomplete_data',
    demoPatternNote: 'Komponen nilai UAS IPS Semester 4 belum lengkap',
  },
  {
    id: 'stu-31',
    nis: '2508007',
    nisn: '0104120007',
    name: 'Nadia Safitri',
    gender: 'P',
    classId: 'cls-8a',
    birthDate: '2012-03-12',
    parentName: 'Saiful Anwar',
    parentPhone: '0812-3001-1031',
    pattern: 'rising_social',
    demoPatternNote: 'Peningkatan konsisten pada IPS, PPKn, dan Bahasa Indonesia',
  },
  {
    id: 'stu-32',
    nis: '2508008',
    nisn: '0104120008',
    name: 'Wahyu Saputra',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-07-19',
    parentName: 'Darmawan',
    parentPhone: '0812-3001-1032',
    pattern: 'stable_balanced',
    demoPatternNote: 'Capaian akademik stabil di seluruh mata pelajaran',
  },
  {
    id: 'stu-33',
    nis: '2508009',
    nisn: '0104120009',
    name: 'Aulia Fitriani',
    gender: 'P',
    classId: 'cls-8a',
    birthDate: '2012-10-28',
    parentName: 'Firdaus',
    parentPhone: '0812-3001-1033',
    pattern: 'stable_social',
    demoPatternNote: 'Unggul di mata pelajaran sosial dan kewarganegaraan',
  },
  {
    id: 'stu-34',
    nis: '2508010',
    nisn: '0104120010',
    name: 'Rangga Aditya',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-05-15',
    parentName: 'Aditya Nugroho',
    parentPhone: '0812-3001-1034',
    pattern: 'declining_math',
    demoPatternNote: 'Nilai Matematika menurun pada Semester 4 (Perlu Evaluasi)',
  },
  {
    id: 'stu-35',
    nis: '2508011',
    nisn: '0104120011',
    name: 'Salma Khairunnisa',
    gender: 'P',
    classId: 'cls-8a',
    birthDate: '2012-08-02',
    parentName: 'Khairul Saleh',
    parentPhone: '0812-3001-1035',
    pattern: 'rising_stem',
    demoPatternNote: 'Pola nilai meningkat, kuat pada IPA dan Informatika',
  },
  {
    id: 'stu-36',
    nis: '2508012',
    nisn: '0104120012',
    name: 'Danang Pradana',
    gender: 'L',
    classId: 'cls-8a',
    birthDate: '2012-12-10',
    parentName: 'Pradana Putra',
    parentPhone: '0812-3001-1036',
    pattern: 'below_threshold',
    demoPatternNote: 'Capaian IPA dan Matematika memerlukan pendampingan belajar',
  },
];

export const INITIAL_STUDENTS: Student[] = STUDENT_SEEDS.map((s) => ({
  id: s.id,
  nis: s.nis,
  nisn: s.nisn,
  name: s.name,
  gender: s.gender,
  classId: s.classId,
  birthDate: s.birthDate,
  parentName: s.parentName,
  parentPhone: s.parentPhone,
  enrollmentYear: s.classId === 'cls-8a' ? '2024' : '2023',
  demoPatternNote: s.demoPatternNote,
}));

// Helper to deterministically generate realistic component scores for a given target base score
function buildGradeComponents(
  baseScore: number,
  studentIndex: number,
  subjectIndex: number,
  periodOrder: number,
  weights: { tugas: number; uts: number; uas: number },
  makeIncomplete = false
): {
  tasks: { id: string; label: string; score: number | null }[];
  uts: number | null;
  uas: number | null;
  finalScore: number | null;
  isComplete: boolean;
} {
  const clamp = (n: number) => Math.max(52, Math.min(98, Math.round(n)));
  const offset = ((studentIndex + subjectIndex + periodOrder) % 5) - 2;

  const t1 = clamp(baseScore + 2 + offset);
  const t2 = clamp(baseScore - 1 - offset);
  const t3 = clamp(baseScore + 1);
  const uts = clamp(baseScore - 2 + offset);
  const uas = makeIncomplete ? null : clamp(baseScore + 1 - offset);

  const tasks = [
    { id: 't1', label: 'Tugas 1', score: t1 },
    { id: 't2', label: 'Tugas 2', score: t2 },
    { id: 't3', label: 'Tugas 3', score: t3 },
  ];

  const calc = calculateFinalScore(tasks, uts, uas, weights);
  return {
    tasks,
    uts,
    uas,
    finalScore: calc.finalScore,
    isComplete: calc.isComplete,
  };
}

function getBaseScoreForPattern(
  pattern: StudentSeed['pattern'],
  subjectId: string,
  periodOrder: number, // 1, 2, 3, 4
  studentIdx: number
): { base: number; incomplete?: boolean } {
  const nudge = (studentIdx % 3) - 1; // -1, 0, or +1 so students don't have identical numbers

  switch (pattern) {
    case 'rising_stem': {
      // Strong in MTK & IPA, steadily rising across Sem 1 -> 4
      const growth = (periodOrder - 1) * 3.2;
      if (subjectId === 'sub-mtk' || subjectId === 'sub-ipa') {
        return { base: 79 + growth + nudge };
      }
      if (subjectId === 'sub-inf') {
        return { base: 78 + growth * 0.8 + nudge };
      }
      if (subjectId === 'sub-bind') {
        // Keep Bahasa Indonesia relatively stable on Sem 3 -> Sem 4 to match Section 10.6 example!
        const bindScores = [80, 81, 83, 83];
        return { base: bindScores[periodOrder - 1] + nudge };
      }
      return { base: 76 + growth * 0.6 + nudge };
    }

    case 'declining_alert': {
      // Was good in Sem 1-2, slipped slightly in Sem 3, dropped significantly in Sem 4
      const trajectory = [82, 81, 78, 70];
      const base = trajectory[periodOrder - 1] + nudge;
      if (subjectId === 'sub-mtk' || subjectId === 'sub-ipa') {
        return { base: base - 3 };
      }
      return { base };
    }

    case 'stable_lang': {
      // Strong in BIND & BING, very stable across semesters
      const trajectory = [79, 80, 80, 81];
      const base = trajectory[periodOrder - 1] + nudge;
      if (subjectId === 'sub-bind' || subjectId === 'sub-bing') {
        return { base: base + 9 };
      }
      return { base };
    }

    case 'rising_tech': {
      const growth = (periodOrder - 1) * 2.8;
      if (subjectId === 'sub-inf') {
        return { base: 82 + growth + nudge };
      }
      if (subjectId === 'sub-mtk' || subjectId === 'sub-ipa') {
        return { base: 77 + growth * 0.9 + nudge };
      }
      return { base: 76 + growth * 0.5 + nudge };
    }

    case 'low_attendance': {
      const trajectory = [77, 77, 76, 75];
      return { base: trajectory[periodOrder - 1] + nudge };
    }

    case 'declining_math': {
      if (subjectId === 'sub-mtk' || subjectId === 'sub-ipa') {
        const mathTraj = [80, 79, 78, 69];
        return { base: mathTraj[periodOrder - 1] + nudge };
      }
      const otherTraj = [78, 79, 79, 79];
      return { base: otherTraj[periodOrder - 1] + nudge };
    }

    case 'stable_social': {
      const trajectory = [78, 79, 79, 80];
      const base = trajectory[periodOrder - 1] + nudge;
      if (subjectId === 'sub-ips' || subjectId === 'sub-ppkn') {
        return { base: base + 8 };
      }
      return { base };
    }

    case 'low_attendance_drop': {
      const trajectory = [76, 74, 71, 67];
      return { base: trajectory[periodOrder - 1] + nudge };
    }

    case 'incomplete_data': {
      const trajectory = [78, 79, 80, 81];
      const isTargetIncomplete =
        periodOrder === 4 &&
        ((studentIdx < 12 && (subjectId === 'sub-mtk' || subjectId === 'sub-ipa')) ||
          (studentIdx >= 12 && studentIdx < 24 && subjectId === 'sub-bing') ||
          (studentIdx >= 24 && subjectId === 'sub-ips'));
      return {
        base: trajectory[periodOrder - 1] + nudge,
        incomplete: isTargetIncomplete,
      };
    }

    case 'rising_social': {
      const growth = (periodOrder - 1) * 2.6;
      if (subjectId === 'sub-ips' || subjectId === 'sub-ppkn' || subjectId === 'sub-bind') {
        return { base: 80 + growth + nudge };
      }
      return { base: 75 + growth * 0.7 + nudge };
    }

    case 'below_threshold': {
      if (subjectId === 'sub-mtk' || subjectId === 'sub-ipa' || subjectId === 'sub-bing') {
        const lowTraj = [72, 71, 70, 68];
        return { base: lowTraj[periodOrder - 1] + nudge };
      }
      return { base: 76 + nudge };
    }

    case 'stable_balanced':
    default: {
      const trajectory = [81, 81, 82, 82];
      return { base: trajectory[periodOrder - 1] + nudge };
    }
  }
}

export const INITIAL_GRADES: StudentGradeRecord[] = [];

STUDENT_SEEDS.forEach((seed, sIdx) => {
  INITIAL_PERIODS.forEach((period) => {
    INITIAL_SUBJECTS.forEach((subject, subIdx) => {
      const { base, incomplete } = getBaseScoreForPattern(
        seed.pattern,
        subject.id,
        period.order,
        sIdx
      );
      const comp = buildGradeComponents(
        base,
        sIdx,
        subIdx,
        period.order,
        subject.defaultWeights,
        Boolean(incomplete)
      );
      const teacherId =
        subject.id === 'sub-ipa' && seed.classId === 'cls-9a'
          ? 'tch-3'
          : subjectTeacherMap[subject.id];

      INITIAL_GRADES.push({
        id: `grd-${period.id}-${seed.id}-${subject.id}`,
        studentId: seed.id,
        classId: seed.classId,
        subjectId: subject.id,
        periodId: period.id,
        tasks: comp.tasks,
        uts: comp.uts,
        uas: comp.uas,
        finalScore: comp.finalScore,
        isComplete: comp.isComplete,
        updatedAt: period.endDate,
        updatedByTeacherId: teacherId,
      });
    });
  });
});

// Generate realistic attendance sessions across all 4 periods for each class
// 14 meetings per period so percentages are realistic (e.g., 13/14 = 92.9%)
const PERIOD_MEETING_DATES: Record<string, string[]> = {
  'sem-1': [
    '2024-08-05',
    '2024-08-12',
    '2024-08-19',
    '2024-09-02',
    '2024-09-09',
    '2024-09-16',
    '2024-10-07',
    '2024-10-14',
    '2024-10-21',
    '2024-11-04',
    '2024-11-11',
    '2024-11-18',
    '2024-12-02',
    '2024-12-09',
  ],
  'sem-2': [
    '2025-01-13',
    '2025-01-20',
    '2025-02-03',
    '2025-02-10',
    '2025-02-17',
    '2025-03-03',
    '2025-03-10',
    '2025-03-17',
    '2025-04-07',
    '2025-04-14',
    '2025-05-05',
    '2025-05-12',
    '2025-05-19',
    '2025-06-02',
  ],
  'sem-3': [
    '2025-08-04',
    '2025-08-11',
    '2025-08-18',
    '2025-09-01',
    '2025-09-08',
    '2025-09-15',
    '2025-10-06',
    '2025-10-13',
    '2025-10-20',
    '2025-11-03',
    '2025-11-10',
    '2025-11-17',
    '2025-12-01',
    '2025-12-08',
  ],
  'sem-4': [
    '2026-01-12',
    '2026-01-19',
    '2026-02-02',
    '2026-02-09',
    '2026-02-16',
    '2026-03-02',
    '2026-03-09',
    '2026-03-16',
    '2026-04-06',
    '2026-04-13',
    '2026-05-04',
    '2026-05-11',
    '2026-05-18',
    '2026-06-01',
  ],
};

const SUBJECT_ROTATION = [
  'sub-mtk',
  'sub-bind',
  'sub-ipa',
  'sub-bing',
  'sub-ips',
  'sub-ppkn',
  'sub-inf',
];

function getStudentAttendanceStatusForMeeting(
  seed: StudentSeed,
  periodOrder: number,
  meetingIndex: number, // 0..13
  studentIndex: number
): AttendanceStatus {
  if (seed.pattern === 'low_attendance') {
    // Around 78.6% attendance (11/14 Hadir) in Sem 4, 85.7% in earlier semesters
    if (periodOrder === 4) {
      if (meetingIndex === 2) return 'S';
      if (meetingIndex === 6) return 'I';
      if (meetingIndex === 11) return 'A';
    } else {
      if (meetingIndex === 4) return 'S';
      if (meetingIndex === 10) return 'I';
    }
    return 'H';
  }

  if (seed.pattern === 'low_attendance_drop') {
    // Around 71.4% attendance (10/14 Hadir) in Sem 4
    if (periodOrder === 4) {
      if (meetingIndex === 1 || meetingIndex === 8) return 'A';
      if (meetingIndex === 5) return 'S';
      if (meetingIndex === 12) return 'I';
    } else if (periodOrder === 3) {
      if (meetingIndex === 3) return 'A';
      if (meetingIndex === 9) return 'S';
    } else {
      if (meetingIndex === 7) return 'S';
    }
    return 'H';
  }

  if (seed.pattern === 'declining_alert') {
    if (periodOrder === 4 && (meetingIndex === 4 || meetingIndex === 10)) {
      return meetingIndex === 4 ? 'S' : 'I';
    }
    if (periodOrder === 3 && meetingIndex === 6) {
      return 'I';
    }
    return 'H';
  }

  // Default high attendance (92.9% to 100%)
  if (seed.id === 'stu-1') {
    // Dimas Pratama: 13/14 = 92.9% in Sem 4, 13/14 in Sem 3, 14/14 in Sem 2, 13/14 in Sem 1
    if (periodOrder !== 2 && meetingIndex === 5) return 'S';
    return 'H';
  }

  if ((studentIndex + periodOrder) % 4 === 0 && meetingIndex === 9) {
    return 'S';
  }
  if ((studentIndex + periodOrder) % 7 === 0 && meetingIndex === 3) {
    return 'I';
  }

  return 'H';
}

export const INITIAL_ATTENDANCE_SESSIONS: AttendanceSession[] = [];

INITIAL_PERIODS.forEach((period) => {
  const dates = PERIOD_MEETING_DATES[period.id] || [];
  INITIAL_CLASSES.forEach((cls) => {
    const classSeeds = STUDENT_SEEDS.filter((s) => s.classId === cls.id);
    dates.forEach((date, mIdx) => {
      const subjectId = SUBJECT_ROTATION[mIdx % SUBJECT_ROTATION.length];
      const subject = INITIAL_SUBJECTS.find((s) => s.id === subjectId)!;
      const teacherId =
        subjectId === 'sub-ipa' && cls.id === 'cls-9a'
          ? 'tch-3'
          : subjectTeacherMap[subjectId];

      INITIAL_ATTENDANCE_SESSIONS.push({
        id: `att-${period.id}-${cls.id}-${mIdx + 1}`,
        date,
        classId: cls.id,
        subjectId,
        periodId: period.id,
        teacherId,
        topic: `Pertemuan Ke-${(mIdx % 7) + 1} ${subject.name}`,
        records: classSeeds.map((seed, sIdx) => ({
          studentId: seed.id,
          status: getStudentAttendanceStatusForMeeting(
            seed,
            period.order,
            mIdx,
            sIdx
          ),
        })),
      });
    });
  });
});

export const DEMO_ACCOUNTS: DemoUserAccount[] = [
  {
    id: 'acc-super-admin',
    role: 'super_admin',
    roleLabel: 'Super Admin',
    name: 'Drs. H. Suparman, M.Pd.',
    username: 'admin.bangodua',
    subtitle: 'Pengelola Akademik Sekolah',
    avatarInitials: 'SP',
    teacherId: 'tch-1',
    description:
      'Akses penuh ke ringkasan akademik sekolah, data master (siswa, guru, kelas, mapel, periode, penugasan), dan hasil monitoring sekolah.',
  },
  {
    id: 'acc-wali-kelas',
    role: 'wali_kelas',
    roleLabel: 'Wali Kelas',
    name: 'Siti Nurhaliza, S.Pd.',
    username: 'wali.9a',
    subtitle: 'Wali Kelas IX-A',
    avatarInitials: 'SN',
    teacherId: 'tch-2',
    classId: 'cls-9a',
    description:
      'Memantau rekap nilai lintas mata pelajaran, presensi kelas IX-A, daftar siswa yang memerlukan perhatian, serta rekomendasi pendidikan lanjutan.',
  },
  {
    id: 'acc-guru-mapel',
    role: 'guru_mapel',
    roleLabel: 'Guru Mata Pelajaran',
    name: 'Ahmad Fauzi, S.Pd.',
    username: 'guru.matematika',
    subtitle: 'Guru Matematika & IPA',
    avatarInitials: 'AF',
    teacherId: 'tch-3',
    classId: 'cls-9a',
    description:
      'Mengelola bobot penilaian, input nilai (Tugas, UTS, UAS), input presensi, serta memantau perkembangan nilai pada mata pelajaran yang diampu.',
  },
  {
    id: 'acc-siswa',
    role: 'siswa',
    roleLabel: 'Siswa',
    name: 'Dimas Pratama',
    username: '2409001',
    subtitle: 'Siswa Kelas IX-A (NIS: 2409001)',
    avatarInitials: 'DP',
    studentId: 'stu-1',
    classId: 'cls-9a',
    description:
      'Melihat capaian nilai pribadi, rekap kehadiran, grafik perkembangan nilai antarsemester, kekuatan akademik, dan informasi pendidikan lanjutan.',
  },
  {
    id: 'acc-wali-murid',
    role: 'wali_murid',
    roleLabel: 'Wali Murid',
    name: 'Hendra Pratama',
    username: 'ortu.dimas',
    subtitle: 'Wali dari Dimas Pratama (Kelas IX-A)',
    avatarInitials: 'HP',
    studentId: 'stu-1',
    classId: 'cls-9a',
    description:
      'Memantau perkembangan akademik anak, rincian nilai dan kehadiran per periode, serta bahan diskusi rekomendasi pendidikan lanjutan SMA/SMK.',
  },
];
