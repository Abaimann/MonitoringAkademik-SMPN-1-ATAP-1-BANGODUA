import {
  AcademicPeriod,
  AttendanceRecap,
  AttendanceSession,
  AttentionTrigger,
  ContinuationProfileAnalysis,
  GradeWeightConfig,
  PeriodComparisonResult,
  SchoolClass,
  Student,
  StudentAttentionSummary,
  StudentGradeRecord,
  Subject,
  SubjectCluster,
  SubjectComparisonItem,
  TaskScoreItem,
  TrendDirection,
} from '../types/academic';

export const DEMO_THRESHOLDS = {
  SCORE_MONITORING_MIN: 72,
  ATTENDANCE_MIN_PERCENT: 85,
  TREND_DELTA_THRESHOLD: 1.5,
  SIGNIFICANT_DROP_DELTA: -2.0,
};

export const CLUSTER_LABELS: Record<SubjectCluster, string> = {
  sains_teknologi: 'Sains, Matematika & Logika Kuantitatif',
  sosial_humaniora: 'Sosial, Kemasyarakatan & Kewarganegaraan',
  bahasa_komunikasi: 'Bahasa, Literasi & Komunikasi',
  terapan_prakarya: 'Teknologi Terapan, Informatika & Prakarya',
};

export function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export function validateWeights(weights: GradeWeightConfig): {
  isValid: boolean;
  total: number;
  message: string;
} {
  const total = Math.round(weights.tugas + weights.uts + weights.uas);
  if (total !== 100) {
    return {
      isValid: false,
      total,
      message: `Total bobot saat ini ${total}%. Total bobot Tugas, UTS, dan UAS wajib berjumlah tepat 100%.`,
    };
  }
  if (weights.tugas < 0 || weights.uts < 0 || weights.uas < 0) {
    return {
      isValid: false,
      total,
      message: 'Bobot setiap komponen penilaian tidak boleh bernilai negatif.',
    };
  }
  return {
    isValid: true,
    total: 100,
    message: 'Komposisi bobot penilaian valid (100%).',
  };
}

export function calculateTaskAverage(tasks: TaskScoreItem[]): {
  average: number | null;
  allFilled: boolean;
  filledCount: number;
} {
  if (!tasks || tasks.length === 0) {
    return { average: null, allFilled: false, filledCount: 0 };
  }
  const validScores = tasks
    .map((t) => t.score)
    .filter((s): s is number => s !== null && s !== undefined && !Number.isNaN(s));

  if (validScores.length === 0) {
    return { average: null, allFilled: false, filledCount: 0 };
  }

  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return {
    average: round1(sum / validScores.length),
    allFilled: validScores.length === tasks.length,
    filledCount: validScores.length,
  };
}

export function calculateFinalScore(
  tasks: TaskScoreItem[],
  uts: number | null,
  uas: number | null,
  weights: GradeWeightConfig
): {
  finalScore: number | null;
  taskAverage: number | null;
  isComplete: boolean;
} {
  const { average: taskAverage, allFilled } = calculateTaskAverage(tasks);
  const hasTasks = taskAverage !== null && allFilled;
  const hasUts = uts !== null && uts !== undefined && !Number.isNaN(uts);
  const hasUas = uas !== null && uas !== undefined && !Number.isNaN(uas);

  const isComplete = hasTasks && hasUts && hasUas;

  if (!isComplete || taskAverage === null || uts === null || uas === null) {
    return {
      finalScore: null,
      taskAverage,
      isComplete: false,
    };
  }

  const raw =
    (taskAverage * weights.tugas + uts * weights.uts + uas * weights.uas) / 100;

  return {
    finalScore: round1(raw),
    taskAverage,
    isComplete: true,
  };
}

export function classifyTrend(
  previousScore: number | null,
  currentScore: number | null,
  threshold = DEMO_THRESHOLDS.TREND_DELTA_THRESHOLD
): {
  delta: number | null;
  percentageChange: number | null;
  status: TrendDirection;
  ruleExplanation: string;
} {
  if (previousScore === null || currentScore === null) {
    return {
      delta: null,
      percentageChange: null,
      status: 'belum_cukup_data',
      ruleExplanation:
        'Data nilai pada salah satu periode belum lengkap sehingga selisih antarperiode belum dapat dihitung.',
    };
  }

  const delta = round1(currentScore - previousScore);
  const percentageChange =
    previousScore > 0 ? round1((delta / previousScore) * 100) : null;

  if (delta >= threshold) {
    return {
      delta,
      percentageChange,
      status: 'meningkat',
      ruleExplanation: `Selisih +${delta} poin (≥ +${threshold} poin pada aturan demonstrasi diklasifikasikan Meningkat).`,
    };
  }
  if (delta <= -threshold) {
    return {
      delta,
      percentageChange,
      status: 'menurun',
      ruleExplanation: `Selisih ${delta} poin (≤ -${threshold} poin pada aturan demonstrasi diklasifikasikan Menurun).`,
    };
  }
  return {
    delta,
    percentageChange,
    status: 'stabil',
    ruleExplanation: `Selisih ${delta >= 0 ? `+${delta}` : delta} poin (berada dalam rentang ±${threshold} poin sehingga diklasifikasikan Stabil).`,
  };
}

export function getStudentPeriodAverage(
  studentId: string,
  periodId: string,
  grades: StudentGradeRecord[],
  subjectIdFilter?: string
): {
  average: number | null;
  completedCount: number;
  totalCount: number;
  hasIncomplete: boolean;
} {
  const relevant = grades.filter(
    (g) =>
      g.studentId === studentId &&
      g.periodId === periodId &&
      (!subjectIdFilter || g.subjectId === subjectIdFilter)
  );

  if (relevant.length === 0) {
    return {
      average: null,
      completedCount: 0,
      totalCount: 0,
      hasIncomplete: false,
    };
  }

  const completed = relevant.filter(
    (g) => g.isComplete && g.finalScore !== null
  );

  const hasIncomplete = completed.length < relevant.length;

  if (completed.length === 0) {
    return {
      average: null,
      completedCount: 0,
      totalCount: relevant.length,
      hasIncomplete: true,
    };
  }

  const sum = completed.reduce((acc, g) => acc + (g.finalScore ?? 0), 0);
  return {
    average: round1(sum / completed.length),
    completedCount: completed.length,
    totalCount: relevant.length,
    hasIncomplete,
  };
}

export function calculateAttendanceRecap(
  studentId: string,
  periodId: string,
  sessions: AttendanceSession[],
  subjectIdFilter?: string
): AttendanceRecap {
  const filteredSessions = sessions.filter(
    (s) =>
      s.periodId === periodId &&
      (!subjectIdFilter ||
        subjectIdFilter === 'ALL' ||
        s.subjectId === subjectIdFilter)
  );

  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  for (const session of filteredSessions) {
    const rec = session.records.find((r) => r.studentId === studentId);
    if (!rec) continue;
    if (rec.status === 'H') hadir += 1;
    else if (rec.status === 'S') sakit += 1;
    else if (rec.status === 'I') izin += 1;
    else if (rec.status === 'A') alpa += 1;
  }

  const totalMeetings = hadir + sakit + izin + alpa;
  const percentage =
    totalMeetings > 0 ? round1((hadir / totalMeetings) * 100) : null;

  return {
    studentId,
    periodId,
    totalMeetings,
    hadir,
    sakit,
    izin,
    alpa,
    percentage,
  };
}

export function compareStudentPeriods(
  studentId: string,
  currentPeriodId: string,
  periods: AcademicPeriod[],
  grades: StudentGradeRecord[],
  subjectIdFilter?: string
): PeriodComparisonResult {
  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);
  const currentIndex = sortedPeriods.findIndex((p) => p.id === currentPeriodId);
  const currentPeriod =
    currentIndex >= 0 ? sortedPeriods[currentIndex] : sortedPeriods[sortedPeriods.length - 1];
  const previousPeriod =
    currentIndex > 0 ? sortedPeriods[currentIndex - 1] : null;

  const currentStats = getStudentPeriodAverage(
    studentId,
    currentPeriod.id,
    grades,
    subjectIdFilter
  );

  if (!previousPeriod) {
    return {
      previousPeriodId: null,
      previousPeriodName: null,
      currentPeriodId: currentPeriod.id,
      currentPeriodName: currentPeriod.name,
      previousScore: null,
      currentScore: currentStats.average,
      delta: null,
      percentageChange: null,
      status: 'belum_cukup_data',
      ruleExplanation:
        'Periode ini merupakan periode awal yang tercatat sehingga belum memiliki periode pembanding sebelumnya.',
    };
  }

  const prevStats = getStudentPeriodAverage(
    studentId,
    previousPeriod.id,
    grades,
    subjectIdFilter
  );

  const trend = classifyTrend(prevStats.average, currentStats.average);

  return {
    previousPeriodId: previousPeriod.id,
    previousPeriodName: previousPeriod.name,
    currentPeriodId: currentPeriod.id,
    currentPeriodName: currentPeriod.name,
    previousScore: prevStats.average,
    currentScore: currentStats.average,
    delta: trend.delta,
    percentageChange: trend.percentageChange,
    status: trend.status,
    ruleExplanation: trend.ruleExplanation,
  };
}

export function getSubjectComparisonsForStudent(
  studentId: string,
  currentPeriodId: string,
  periods: AcademicPeriod[],
  subjects: Subject[],
  grades: StudentGradeRecord[]
): SubjectComparisonItem[] {
  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);
  const currentIndex = sortedPeriods.findIndex((p) => p.id === currentPeriodId);
  const previousPeriod =
    currentIndex > 0 ? sortedPeriods[currentIndex - 1] : null;

  return subjects.map((subject) => {
    const currRec = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.periodId === currentPeriodId &&
        g.subjectId === subject.id
    );
    const prevRec = previousPeriod
      ? grades.find(
          (g) =>
            g.studentId === studentId &&
            g.periodId === previousPeriod.id &&
            g.subjectId === subject.id
        )
      : undefined;

    const currentScore =
      currRec && currRec.isComplete ? currRec.finalScore : null;
    const previousScore =
      prevRec && prevRec.isComplete ? prevRec.finalScore : null;

    const trend = classifyTrend(previousScore, currentScore);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      cluster: subject.cluster,
      previousScore,
      currentScore,
      delta: trend.delta,
      percentageChange: trend.percentageChange,
      status: trend.status,
      isComplete: Boolean(currRec?.isComplete),
      threshold: subject.monitoringThreshold,
    };
  });
}

export function generateDynamicMonitoringSummary(
  studentId: string,
  currentPeriodId: string,
  periods: AcademicPeriod[],
  subjects: Subject[],
  grades: StudentGradeRecord[],
  sessions: AttendanceSession[]
): {
  hasEnoughData: boolean;
  summaryText: string;
  highlights: string[];
} {
  const subjectItems = getSubjectComparisonsForStudent(
    studentId,
    currentPeriodId,
    periods,
    subjects,
    grades
  );

  const completedCurrent = subjectItems.filter((s) => s.currentScore !== null);
  const comparableItems = subjectItems.filter(
    (s) => s.currentScore !== null && s.previousScore !== null
  );

  if (completedCurrent.length === 0 || comparableItems.length === 0) {
    return {
      hasEnoughData: false,
      summaryText:
        'Data akademik belum mencukupi untuk menampilkan analisis perkembangan antarperiode.',
      highlights: [
        'Pastikan nilai komponen Tugas, UTS, dan UAS pada periode berjalan serta periode pembanding telah terisi lengkap.',
      ],
    };
  }

  const rising = [...comparableItems]
    .filter((s) => s.status === 'meningkat')
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
  const declining = [...comparableItems]
    .filter((s) => s.status === 'menurun')
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
  const stable = comparableItems.filter((s) => s.status === 'stabil');

  const parts: string[] = [];

  if (rising.length > 0 && stable.length > 0 && declining.length === 0) {
    const topRising = rising
      .slice(0, 2)
      .map((s) => `${s.subjectName} (+${s.delta})`)
      .join(' dan ');
    const sampleStable = stable[0].subjectName;
    parts.push(
      `Nilai ${topRising} mengalami peningkatan dibandingkan semester sebelumnya, sedangkan nilai ${sampleStable} relatif stabil.`
    );
  } else if (rising.length > 0 && declining.length > 0) {
    parts.push(
      `Nilai ${rising[0].subjectName} mengalami peningkatan (+${rising[0].delta} poin) dibandingkan semester sebelumnya, namun nilai ${declining[0].subjectName} mengalami penurunan (${declining[0].delta} poin) dan memerlukan evaluasi lebih lanjut.`
    );
  } else if (declining.length > 0) {
    const topDecline = declining
      .slice(0, 2)
      .map((s) => `${s.subjectName} (${s.delta})`)
      .join(' dan ');
    const extra =
      stable.length > 0
        ? `, sementara nilai ${stable[0].subjectName} relatif stabil.`
        : ' dibandingkan semester sebelumnya.';
    parts.push(`Nilai ${topDecline} mengalami penurunan${extra}`);
  } else if (rising.length > 0) {
    const topRising = rising
      .slice(0, 2)
      .map((s) => `${s.subjectName} (+${s.delta})`)
      .join(' dan ');
    parts.push(
      `Capaian akademik menunjukkan tren positif terutama pada mata pelajaran ${topRising} dibandingkan periode sebelumnya.`
    );
  } else {
    parts.push(
      `Capaian nilai siswa pada mayoritas mata pelajaran seperti ${stable
        .slice(0, 2)
        .map((s) => s.subjectName)
        .join(' dan ')} berada pada kategori relatif stabil dibandingkan semester sebelumnya.`
    );
  }

  const attendance = calculateAttendanceRecap(
    studentId,
    currentPeriodId,
    sessions
  );

  if (attendance.percentage !== null) {
    parts.push(
      `Tingkat kehadiran siswa berada pada ${attendance.percentage}% dari ${attendance.totalMeetings} pertemuan yang tercatat.`
    );
  } else {
    parts.push('Data pertemuan presensi pada periode ini belum tersedia.');
  }

  const incompleteCount = subjectItems.filter((s) => !s.isComplete).length;
  if (incompleteCount > 0) {
    parts.push(
      `Terdapat ${incompleteCount} mata pelajaran dengan komponen nilai yang belum lengkap pada periode ini.`
    );
  }

  const highest = [...completedCurrent].sort(
    (a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0)
  )[0];
  const lowest = [...completedCurrent].sort(
    (a, b) => (a.currentScore ?? 0) - (b.currentScore ?? 0)
  )[0];

  const highlights: string[] = [];
  if (highest) {
    highlights.push(
      `Capaian tertinggi: ${highest.subjectName} (${highest.currentScore})`
    );
  }
  if (lowest && lowest.subjectId !== highest?.subjectId) {
    highlights.push(
      `Perlu penguatan: ${lowest.subjectName} (${lowest.currentScore})`
    );
  }
  if (attendance.percentage !== null) {
    highlights.push(
      `Kehadiran pendukung: ${attendance.hadir}/${attendance.totalMeetings} pertemuan (${attendance.percentage}%)`
    );
  }

  return {
    hasEnoughData: true,
    summaryText: parts.join(' '),
    highlights,
  };
}

export function evaluateStudentsNeedingAttention(
  students: Student[],
  classes: SchoolClass[],
  periods: AcademicPeriod[],
  subjects: Subject[],
  grades: StudentGradeRecord[],
  sessions: AttendanceSession[],
  currentPeriodId: string,
  options?: {
    classId?: string;
    subjectId?: string;
  }
): StudentAttentionSummary[] {
  const filteredStudents = students.filter((s) =>
    options?.classId ? s.classId === options.classId : true
  );

  const results: StudentAttentionSummary[] = [];

  for (const student of filteredStudents) {
    const schoolClass = classes.find((c) => c.id === student.classId);
    const className = schoolClass?.name ?? '-';
    const triggers: AttentionTrigger[] = [];

    const periodComparison = compareStudentPeriods(
      student.id,
      currentPeriodId,
      periods,
      grades,
      options?.subjectId
    );

    const subjectItems = getSubjectComparisonsForStudent(
      student.id,
      currentPeriodId,
      periods,
      options?.subjectId
        ? subjects.filter((sub) => sub.id === options.subjectId)
        : subjects,
      grades
    );

    const attendance = calculateAttendanceRecap(
      student.id,
      currentPeriodId,
      sessions,
      options?.subjectId
    );

    // 1. Check declining average or declining specific subjects
    if (
      periodComparison.delta !== null &&
      periodComparison.delta <= DEMO_THRESHOLDS.SIGNIFICANT_DROP_DELTA
    ) {
      triggers.push({
        type: 'penurunan_nilai',
        label: 'Memerlukan Perhatian',
        title: 'Penurunan Rata-Rata Nilai Antarperiode',
        detail: `Rata-rata nilai turun ${Math.abs(periodComparison.delta)} poin dari ${periodComparison.previousScore} menjadi ${periodComparison.currentScore}.`,
        metricValue: `${periodComparison.delta} poin`,
      });
    } else {
      const decliningSubjects = subjectItems.filter(
        (s) =>
          s.delta !== null && s.delta <= DEMO_THRESHOLDS.SIGNIFICANT_DROP_DELTA
      );
      if (decliningSubjects.length > 0) {
        const worst = decliningSubjects.sort(
          (a, b) => (a.delta ?? 0) - (b.delta ?? 0)
        )[0];
        triggers.push({
          type: 'penurunan_nilai',
          label: 'Perlu Evaluasi',
          title: `Penurunan Nilai ${worst.subjectName}`,
          detail: `Nilai ${worst.subjectName} turun dari ${worst.previousScore} menjadi ${worst.currentScore} (${worst.delta} poin).`,
          metricValue: `${worst.delta} (${worst.subjectCode})`,
          subjectId: worst.subjectId,
          subjectName: worst.subjectName,
        });
      }
    }

    // 2. Check score below monitoring threshold
    const belowThresholdSubjects = subjectItems.filter(
      (s) => s.currentScore !== null && s.currentScore < s.threshold
    );
    if (belowThresholdSubjects.length > 0) {
      const lowest = [...belowThresholdSubjects].sort(
        (a, b) => (a.currentScore ?? 0) - (b.currentScore ?? 0)
      )[0];
      triggers.push({
        type: 'bawah_ambang',
        label:
          belowThresholdSubjects.length >= 2
            ? 'Memerlukan Perhatian'
            : 'Perlu Evaluasi',
        title:
          belowThresholdSubjects.length === 1
            ? `Capaian ${lowest.subjectName} di Bawah Ambang Pemantauan`
            : `${belowThresholdSubjects.length} Mata Pelajaran di Bawah Ambang Pemantauan`,
        detail: `Nilai ${lowest.subjectName} tercatat ${lowest.currentScore} (ambang pemantauan simulasi: ${lowest.threshold}).`,
        metricValue: `${lowest.currentScore} / ${lowest.threshold}`,
        subjectId: lowest.subjectId,
        subjectName: lowest.subjectName,
      });
    }

    // 3. Check low attendance
    if (
      attendance.percentage !== null &&
      attendance.percentage < DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT
    ) {
      triggers.push({
        type: 'kehadiran_rendah',
        label:
          attendance.percentage < 75 ? 'Memerlukan Perhatian' : 'Perlu Evaluasi',
        title: 'Tingkat Kehadiran Memerlukan Perhatian',
        detail: `Persentase kehadiran tercatat ${attendance.percentage}% (${attendance.hadir} hadir, ${attendance.sakit} sakit, ${attendance.izin} izin, ${attendance.alpa} alpa dari ${attendance.totalMeetings} pertemuan).`,
        metricValue: `${attendance.percentage}% Hadir`,
      });
    }

    // 4. Check incomplete academic data
    const incompleteSubjects = subjectItems.filter((s) => !s.isComplete);
    if (incompleteSubjects.length > 0) {
      triggers.push({
        type: 'data_belum_lengkap',
        label: 'Perlu Evaluasi',
        title: 'Data Komponen Nilai Belum Lengkap',
        detail: `Komponen penilaian pada ${incompleteSubjects
          .map((s) => s.subjectName)
          .join(', ')} belum terisi lengkap.`,
        metricValue: `${incompleteSubjects.length} Mapel Belum Lengkap`,
        subjectId: incompleteSubjects[0].subjectId,
        subjectName: incompleteSubjects[0].subjectName,
      });
    }

    if (triggers.length > 0) {
      const hasHighPriority = triggers.some(
        (t) => t.label === 'Memerlukan Perhatian'
      );
      results.push({
        student,
        className,
        periodId: currentPeriodId,
        averageScore: periodComparison.currentScore,
        previousAverageScore: periodComparison.previousScore,
        scoreDelta: periodComparison.delta,
        attendancePercentage: attendance.percentage,
        incompleteSubjectsCount: incompleteSubjects.length,
        triggers,
        primaryLabel: hasHighPriority
          ? 'Memerlukan Perhatian'
          : 'Perlu Evaluasi',
      });
    }
  }

  return results.sort((a, b) => b.triggers.length - a.triggers.length);
}

export function buildContinuationProfile(
  studentId: string,
  currentPeriodId: string,
  periods: AcademicPeriod[],
  subjects: Subject[],
  grades: StudentGradeRecord[],
  sessions: AttendanceSession[]
): ContinuationProfileAnalysis {
  const periodComparison = compareStudentPeriods(
    studentId,
    currentPeriodId,
    periods,
    grades
  );
  const attendance = calculateAttendanceRecap(
    studentId,
    currentPeriodId,
    sessions
  );

  // Compute multi-period average per subject for this student so recommendations reflect longitudinal academic profile
  const studentCompletedGrades = grades.filter(
    (g) => g.studentId === studentId && g.isComplete && g.finalScore !== null
  );

  const subjectAverages = subjects
    .map((sub) => {
      const recs = studentCompletedGrades.filter((g) => g.subjectId === sub.id);
      if (recs.length === 0) return null;
      const avg = round1(
        recs.reduce((acc, r) => acc + (r.finalScore ?? 0), 0) / recs.length
      );
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        score: avg,
        cluster: sub.cluster,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score);

  const strongSubjects = subjectAverages.slice(0, 3);

  const clusters: SubjectCluster[] = [
    'sains_teknologi',
    'sosial_humaniora',
    'bahasa_komunikasi',
    'terapan_prakarya',
  ];

  const clusterScores = clusters
    .map((cluster) => {
      const matching = subjectAverages.filter((s) => s.cluster === cluster);
      const average =
        matching.length > 0
          ? round1(
              matching.reduce((acc, m) => acc + m.score, 0) / matching.length
            )
          : null;
      return {
        cluster,
        label: CLUSTER_LABELS[cluster],
        average,
        subjects: matching.map((m) => `${m.subjectName} (${m.score})`),
      };
    })
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

  const topCluster = clusterScores[0];
  const secondCluster = clusterScores[1];

  const smaRelevantClusters: string[] = [];
  const smaBasis: string[] = [];
  const smkRelevantFields: string[] = [];
  const smkBasis: string[] = [];

  if (topCluster?.cluster === 'sains_teknologi') {
    smaRelevantClusters.push(
      'Peminatan Mata Pelajaran Rumpun MIPA (Matematika, Fisika, Kimia, Biologi)',
      'Persiapan Studi Lanjut Sains, Kesehatan, atau Teknik di Perguruan Tinggi'
    );
    smaBasis.push(
      `Capaian rata-rata rumpun ${topCluster.label} menonjol pada nilai ${topCluster.average} (${topCluster.subjects.join(', ')}).`
    );

    smkRelevantFields.push(
      'Bidang Keahlian Teknologi Informasi & Jaringan Komputer',
      'Bidang Keahlian Teknologi Manufaktur, Elektronika, atau Analisis Laboratorium'
    );
    smkBasis.push(
      `Kekuatan logika kuantitatif pada ${topCluster.subjects.join(' dan ')} mendukung penguasaan kompetensi teknis terapan di SMK.`
    );
  } else if (topCluster?.cluster === 'sosial_humaniora') {
    smaRelevantClusters.push(
      'Peminatan Mata Pelajaran Rumpun IPS & Humaniora (Ekonomi, Sosiologi, Geografi, Sejarah)',
      'Persiapan Studi Lanjut Hukum, Manajemen, Pendidikan, atau Ilmu Sosial'
    );
    smaBasis.push(
      `Capaian rata-rata rumpun ${topCluster.label} unggul pada nilai ${topCluster.average} (${topCluster.subjects.join(', ')}).`
    );

    smkRelevantFields.push(
      'Bidang Keahlian Bisnis, Manajemen Perkantoran & Layanan Bisnis',
      'Bidang Keahlian Akuntansi, Keuangan Lembaga, atau Pemasaran'
    );
    smkBasis.push(
      `Pemahaman konsep sosial dan kemasyarakatan (${topCluster.subjects.join(', ')}) relevan untuk praktik bisnis dan administrasi kejuruan.`
    );
  } else if (topCluster?.cluster === 'bahasa_komunikasi') {
    smaRelevantClusters.push(
      'Peminatan Rumpun Bahasa, Sastra, dan Komunikasi Lintas Budaya',
      'Peminatan Ilmu Sosial & Komunikasi untuk Persiapan Akademik Lanjutan'
    );
    smaBasis.push(
      `Capaian literasi dan bahasa pada ${topCluster.subjects.join(', ')} mencapai rata-rata ${topCluster.average}.`
    );

    smkRelevantFields.push(
      'Bidang Keahlian Pariwisata, Perhotelan, atau Layanan Komunikasi',
      'Bidang Keahlian Desain Komunikasi Visual & Produksi Media Kreatif'
    );
    smkBasis.push(
      `Kemampuan bahasa dan komunikasi yang kuat mendukung bidang layanan industri kreatif, media, serta kepariwisataan.`
    );
  } else {
    smaRelevantClusters.push(
      'Peminatan Akademik Terpadu (Sains Terapan & Informatika)',
      'Pengembangan Akademik Lintas Disiplin'
    );
    smaBasis.push(
      `Capaian tinggi pada ${topCluster?.subjects.join(', ') ?? 'mata pelajaran terapan'} menunjukkan kesiapan belajar konseptual maupun kolaboratif.`
    );

    smkRelevantFields.push(
      'Bidang Keahlian Pengembangan Perangkat Lunak & Gim (Rekayasa Perangkat Lunak)',
      'Bidang Keahlian Desain, Kriya, atau Teknik Terapan'
    );
    smkBasis.push(
      `Keunggulan pada ${topCluster?.subjects.join(', ') ?? 'Informatika & Prakarya'} selaras dengan pembelajaran berbasis proyek dan praktik kejuruan.`
    );
  }

  if (secondCluster && secondCluster.average !== null) {
    smaBasis.push(
      `Didukung oleh capaian sekunder pada rumpun ${secondCluster.label} (rata-rata ${secondCluster.average}).`
    );
    smkBasis.push(
      `Kombinasi kemampuan dengan rumpun ${secondCluster.label} memperluas opsi program keahlian yang dapat didiskusikan.`
    );
  }

  const narrativeReasoning =
    strongSubjects.length > 0
      ? `Berdasarkan data historis lintas periode, siswa memiliki kecenderungan kekuatan akademik pada mata pelajaran ${strongSubjects
          .map((s) => `${s.subjectName} (rata-rata ${s.score})`)
          .join(', ')}. Profil ini tidak menentukan pilihan tunggal secara kaku: apabila siswa berencana memperkuat fondasi teoretis menuju perguruan tinggi, jalur SMA dengan fokus rumpun ${topCluster.label} dapat dipertimbangkan; sedangkan apabila siswa berminat pada penguasaan keterampilan terapan dan kesiapan kerja sejak pendidikan menengah, jalur SMK pada bidang yang selaras dengan kekuatan ${strongSubjects[0].subjectName} juga merupakan pilihan yang setara.`
      : 'Data nilai mata pelajaran belum mencukupi untuk menyusun pemetaan kekuatan rumpun akademik secara spesifik.';

  return {
    studentId,
    periodId: currentPeriodId,
    overallAverage: periodComparison.currentScore,
    trendStatus: periodComparison.status,
    attendancePercentage: attendance.percentage,
    strongSubjects,
    clusterScores,
    smaConsiderations: {
      title: 'Sekolah Menengah Atas (SMA)',
      generalExplanation:
        'Jalur pendidikan menengah umum yang dapat dipertimbangkan oleh siswa yang ingin memperdalam penguasaan konsep keilmuan lintas disiplin serta mempersiapkan diri melanjutkan pendidikan ke jenjang perguruan tinggi sesuai tujuan akademiknya.',
      relevantClusters: smaRelevantClusters,
      academicBasis: smaBasis,
    },
    smkConsiderations: {
      title: 'Sekolah Menengah Kejuruan (SMK)',
      generalExplanation:
        'Jalur pendidikan menengah kejuruan yang dapat dipertimbangkan oleh siswa yang ingin mempelajari kompetensi keahlian atau bidang vokasi spesifik, mengembangkan keterampilan terapan, maupun melanjutkan ke pendidikan vokasi/perguruan tinggi sesuai minat dan tujuan pendidikannya.',
      relevantFields: smkRelevantFields,
      academicBasis: smkBasis,
    },
    narrativeReasoning,
    disclaimerText:
      'Rekomendasi ini merupakan informasi pendukung berdasarkan hasil monitoring akademik. Pemilihan pendidikan lanjutan tetap perlu mempertimbangkan minat, bakat, tujuan pendidikan, dan diskusi dengan orang tua maupun pihak sekolah.',
  };
}
