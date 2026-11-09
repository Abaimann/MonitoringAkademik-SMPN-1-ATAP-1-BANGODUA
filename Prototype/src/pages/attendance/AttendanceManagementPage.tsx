import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  History,
  Info,
  PlusCircle,
  Save,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { AttendanceStatus } from '../../types/academic';
import {
  calculateAttendanceRecap,
  DEMO_THRESHOLDS,
  round1,
} from '../../utils/academicRules';
import {
  EmptyState,
  PageHeader,
  SimulationDisclaimerBanner,
} from '../../components/ui/CommonUI';

const STATUS_OPTIONS: {
  code: AttendanceStatus;
  shortLabel: string;
  fullLabel: string;
  activeClass: string;
  badgeClass: string;
}[] = [
  {
    code: 'H',
    shortLabel: 'H',
    fullLabel: 'Hadir',
    activeClass: 'bg-success-bg text-success border-success-border font-bold',
    badgeClass: 'bg-success-bg text-success border-success-border',
  },
  {
    code: 'S',
    shortLabel: 'S',
    fullLabel: 'Sakit',
    activeClass: 'bg-secondary text-primary border-primary font-bold',
    badgeClass: 'bg-secondary text-primary border-light-blue',
  },
  {
    code: 'I',
    shortLabel: 'I',
    fullLabel: 'Izin',
    activeClass: 'bg-warning-bg text-warning border-warning-border font-bold',
    badgeClass: 'bg-warning-bg text-warning border-warning-border',
  },
  {
    code: 'A',
    shortLabel: 'A',
    fullLabel: 'Alpa',
    activeClass: 'bg-danger-bg text-danger border-danger-border font-bold',
    badgeClass: 'bg-danger-bg text-danger border-danger-border',
  },
];

function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = months[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
}

export const AttendanceManagementPage: React.FC = () => {
  const {
    currentUser,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    classes,
    subjects,
    teachers,
    students,
    attendanceSessions,
    upsertAttendanceSession,
  } = useAcademic();

  const isStudentOrParent =
    currentUser?.role === 'siswa' || currentUser?.role === 'wali_murid';

  const selectedPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      periods[periods.length - 1],
    [periods, selectedPeriodId]
  );

  // Teacher / Admin state
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => currentUser?.classId || classes[0]?.id || 'cls-9a'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (currentUser?.role === 'guru_mapel' && currentUser.teacherId) {
      const t = teachers.find((item) => item.id === currentUser.teacherId);
      if (t && t.subjectIds.length > 0) return t.subjectIds[0];
    }
    return subjects[0]?.id || 'sub-mtk';
  });

  // Sync class when user switches role
  useEffect(() => {
    if (currentUser?.classId) {
      setSelectedClassId(currentUser.classId);
    }
  }, [currentUser?.classId]);

  // Sessions recorded for the selected class & period
  const classPeriodSessions = useMemo(() => {
    return attendanceSessions
      .filter(
        (s) =>
          s.classId === selectedClassId && s.periodId === selectedPeriodId
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceSessions, selectedClassId, selectedPeriodId]);

  const [meetingDate, setMeetingDate] = useState<string>(() => {
    const existing = attendanceSessions
      .filter(
        (s) =>
          s.classId === (currentUser?.classId || 'cls-9a') &&
          s.periodId === selectedPeriodId
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    return existing[0]?.date || selectedPeriod?.endDate || '2026-06-08';
  });

  const [topic, setTopic] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [historySubjectFilter, setHistorySubjectFilter] =
    useState<string>('ALL');

  // Map of studentId -> { status, note }
  const [draftRecords, setDraftRecords] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId]
  );

  // Check if there is an existing session matching (selectedPeriodId, selectedClassId, selectedSubjectId, meetingDate)
  const matchedExistingSession = useMemo(() => {
    return attendanceSessions.find(
      (s) =>
        s.periodId === selectedPeriodId &&
        s.classId === selectedClassId &&
        s.subjectId === selectedSubjectId &&
        s.date === meetingDate
    );
  }, [
    attendanceSessions,
    selectedPeriodId,
    selectedClassId,
    selectedSubjectId,
    meetingDate,
  ]);

  // Populate form whenever matchedExistingSession or classStudents changes
  useEffect(() => {
    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
    if (matchedExistingSession) {
      setTopic(matchedExistingSession.topic);
      const map: Record<string, { status: AttendanceStatus; note: string }> =
        {};
      classStudents.forEach((stu) => {
        const found = matchedExistingSession.records.find(
          (r) => r.studentId === stu.id
        );
        map[stu.id] = {
          status: found?.status || 'H',
          note: found?.note || '',
        };
      });
      setDraftRecords(map);
    } else {
      setTopic(
        selectedSubject
          ? `Pertemuan Pembelajaran ${selectedSubject.name}`
          : 'Pertemuan Pembelajaran Harian'
      );
      const map: Record<string, { status: AttendanceStatus; note: string }> =
        {};
      classStudents.forEach((stu) => {
        map[stu.id] = { status: 'H', note: '' };
      });
      setDraftRecords(map);
    }
  }, [matchedExistingSession, classStudents, selectedSubjectId, subjects]);

  const handleSelectExistingSession = (session: {
    date: string;
    subjectId: string;
    classId: string;
    periodId: string;
  }) => {
    setSelectedPeriodId(session.periodId);
    setSelectedClassId(session.classId);
    setSelectedSubjectId(session.subjectId);
    setMeetingDate(session.date);
    setActiveTab('input');
  };

  const handleCreateNewMeetingDate = () => {
    // Pick a date one week after the latest session in this period, or today's date
    const latestDate = classPeriodSessions[0]?.date;
    if (latestDate) {
      const dt = new Date(`${latestDate}T00:00:00`);
      dt.setDate(dt.getDate() + 7);
      const nextDateStr = dt.toISOString().slice(0, 10);
      setMeetingDate(nextDateStr);
    } else {
      setMeetingDate(new Date().toISOString().slice(0, 10));
    }
    setActiveTab('input');
  };

  const handleSetStudentStatus = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setDraftRecords((prev) => ({
      ...prev,
      [studentId]: {
        status,
        note: prev[studentId]?.note || '',
      },
    }));
  };

  const handleSetStudentNote = (studentId: string, note: string) => {
    setDraftRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'H',
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((stu) => {
      next[stu.id] = {
        status: 'H',
        note: '',
      };
    });
    setDraftRecords(next);
  };

  const liveCounts = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    classStudents.forEach((stu) => {
      const st = draftRecords[stu.id]?.status || 'H';
      if (st === 'H') hadir += 1;
      else if (st === 'S') sakit += 1;
      else if (st === 'I') izin += 1;
      else if (st === 'A') alpa += 1;
    });
    const total = classStudents.length;
    const percentage = total > 0 ? round1((hadir / total) * 100) : null;
    return { hadir, sakit, izin, alpa, total, percentage };
  }, [classStudents, draftRecords]);

  const filteredClassStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return classStudents;
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDate) return;

    const recordsPayload = classStudents.map((stu) => ({
      studentId: stu.id,
      status: draftRecords[stu.id]?.status || 'H',
      note: draftRecords[stu.id]?.note?.trim() || undefined,
    }));

    upsertAttendanceSession({
      id: matchedExistingSession?.id,
      date: meetingDate,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      periodId: selectedPeriodId,
      teacherId: currentUser?.teacherId || 'tch-3',
      topic: topic.trim() || 'Pertemuan Pembelajaran',
      records: recordsPayload,
    });
  };

  // Filtered history list
  const filteredHistorySessions = useMemo(() => {
    return classPeriodSessions.filter(
      (s) =>
        historySubjectFilter === 'ALL' || s.subjectId === historySubjectFilter
    );
  }, [classPeriodSessions, historySubjectFilter]);

  // Student / Parent personal view state
  const [personalSubjectFilter, setPersonalSubjectFilter] =
    useState<string>('ALL');

  const activeStudent = useMemo(() => {
    if (currentUser?.studentId) {
      const found = students.find((s) => s.id === currentUser.studentId);
      if (found) return found;
    }
    return students[0];
  }, [currentUser?.studentId, students]);

  const personalRecap = useMemo(() => {
    if (!activeStudent) return null;
    return calculateAttendanceRecap(
      activeStudent.id,
      selectedPeriodId,
      attendanceSessions,
      personalSubjectFilter
    );
  }, [
    activeStudent,
    selectedPeriodId,
    attendanceSessions,
    personalSubjectFilter,
  ]);

  const personalSessions = useMemo(() => {
    if (!activeStudent) return [];
    return attendanceSessions
      .filter(
        (s) =>
          s.periodId === selectedPeriodId &&
          s.classId === activeStudent.classId &&
          (personalSubjectFilter === 'ALL' ||
            s.subjectId === personalSubjectFilter)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    activeStudent,
    selectedPeriodId,
    attendanceSessions,
    personalSubjectFilter,
  ]);

  // ============================================================================
  // RENDER: SISWA / WALI MURID PERSONAL VIEW
  // ============================================================================
  if (isStudentOrParent && activeStudent && personalRecap) {
    const studentClass = classes.find((c) => c.id === activeStudent.classId);

    return (
      <div className="space-y-5 pb-8">
        <PageHeader
          title="Riwayat & Rekap Presensi Pribadi"
          subtitle={`${activeStudent.name} (NIS: ${activeStudent.nis}) — Kelas ${
            studentClass?.name || '-'
          } pada ${selectedPeriod?.name || ''}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/presensi/rekap"
                className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface border border-border text-ink hover:bg-secondary text-sm font-medium transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Rekapitulasi Presensi</span>
              </Link>
              <Link
                to={`/monitoring/${activeStudent.id}`}
                className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span>Profil Monitoring Siswa</span>
              </Link>
            </div>
          }
        />

        <SimulationDisclaimerBanner text="Data kehadiran dihitung secara otomatis dari seluruh sesi pertemuan yang dicatat oleh Guru Mata Pelajaran maupun Wali Kelas pada periode terpilih." />

        {/* Filter Periode & Mata Pelajaran */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="student-period-select"
                className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
              >
                Periode Akademik
              </label>
              <select
                id="student-period-select"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isActive ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="student-subject-filter"
                className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
              >
                Filter Mata Pelajaran
              </label>
              <select
                id="student-subject-filter"
                value={personalSubjectFilter}
                onChange={(e) => setPersonalSubjectFilter(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary KPI Wells */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-border">
            <div className="rounded-xl bg-secondary p-3.5">
              <p className="text-xs text-muted">Persentase Kehadiran</p>
              <p className="text-lg sm:text-xl font-bold text-primary mt-1 tabular-nums">
                {personalRecap.percentage !== null
                  ? `${personalRecap.percentage}%`
                  : 'Data belum tersedia'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Ambang baik: ≥ {DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT}%
              </p>
            </div>

            <div className="rounded-xl bg-page p-3.5">
              <p className="text-xs text-muted">Total Pertemuan</p>
              <p className="text-lg sm:text-xl font-bold text-ink mt-1 tabular-nums">
                {personalRecap.totalMeetings}
              </p>
              <p className="text-xs text-muted mt-0.5">Sesi tercatat</p>
            </div>

            <div className="rounded-xl bg-success-bg p-3.5">
              <p className="text-xs text-success font-medium">Hadir (H)</p>
              <p className="text-lg sm:text-xl font-bold text-success mt-1 tabular-nums">
                {personalRecap.hadir}
              </p>
              <p className="text-xs text-success/80 mt-0.5">Pertemuan</p>
            </div>

            <div className="rounded-xl bg-secondary p-3.5">
              <p className="text-xs text-primary font-medium">Sakit (S)</p>
              <p className="text-lg sm:text-xl font-bold text-primary mt-1 tabular-nums">
                {personalRecap.sakit}
              </p>
              <p className="text-xs text-muted mt-0.5">Pertemuan</p>
            </div>

            <div className="rounded-xl bg-warning-bg p-3.5">
              <p className="text-xs text-warning font-medium">Izin (I)</p>
              <p className="text-lg sm:text-xl font-bold text-warning mt-1 tabular-nums">
                {personalRecap.izin}
              </p>
              <p className="text-xs text-warning/80 mt-0.5">Pertemuan</p>
            </div>

            <div className="rounded-xl bg-danger-bg p-3.5">
              <p className="text-xs text-danger font-medium">Alpa (A)</p>
              <p className="text-lg sm:text-xl font-bold text-danger mt-1 tabular-nums">
                {personalRecap.alpa}
              </p>
              <p className="text-xs text-danger/80 mt-0.5">Pertemuan</p>
            </div>
          </div>

          <div className="rounded-xl bg-page px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-muted">
            <Info
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>
              Rumus perhitungan: Persentase Kehadiran = (Jumlah Hadir ÷ Jumlah
              Pertemuan Tercatat) × 100%. Apabila belum terdapat pertemuan yang
              tercatat, status ditampilkan sebagai &quot;Data belum
              tersedia&quot;.
            </span>
          </div>
        </div>

        {/* Daftar Riwayat Pertemuan */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">
                Daftar Sesi Pertemuan Tercatat ({personalSessions.length} Sesi)
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Rincian kehadiran {activeStudent.name} pada setiap pertemuan di{' '}
                {selectedPeriod?.name}
              </p>
            </div>
          </div>

          {personalSessions.length === 0 ? (
            <EmptyState
              title="Data pertemuan belum tersedia"
              description="Belum terdapat sesi presensi yang tercatat pada periode dan filter mata pelajaran ini."
            />
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {personalSessions.map((session) => {
                const sub = subjects.find((s) => s.id === session.subjectId);
                const rec = session.records.find(
                  (r) => r.studentId === activeStudent.id
                );
                const statusCode: AttendanceStatus = rec?.status || 'H';
                const statusMeta =
                  STATUS_OPTIONS.find((o) => o.code === statusCode) ||
                  STATUS_OPTIONS[0];

                return (
                  <div
                    key={session.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-secondary px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{formatIndonesianDate(session.date)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink bg-page px-2.5 py-1 rounded-lg">
                          <BookOpen className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                          <span>
                            {sub ? `${sub.name} (${sub.code})` : 'Presensi Harian'}
                          </span>
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        {session.topic}
                      </p>
                      {rec?.note && (
                        <p className="text-xs text-muted">
                          Catatan: {rec.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusMeta.badgeClass}`}
                      >
                        <span>
                          {statusMeta.code} — {statusMeta.fullLabel}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: GURU MAPEL / WALI KELAS / SUPER ADMIN VIEW
  // ============================================================================
  const currentClassObj = classes.find((c) => c.id === selectedClassId);
  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-5 pb-24 sm:pb-10">
      <PageHeader
        title="Pengelolaan Presensi Siswa"
        subtitle="Input kehadiran per pertemuan dengan kartu ramah layar sentuh (390px) dan sinkronisasi otomatis ke rekapitulasi semester"
        actions={
          <Link
            to="/presensi/rekap"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-secondary border border-light-blue text-primary hover:bg-light-blue text-sm font-semibold transition-colors"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>Rekapitulasi Per Periode</span>
          </Link>
        }
      />

      <SimulationDisclaimerBanner text="Perubahan status kehadiran (Hadir, Sakit, Izin, Alpa) yang Anda simpan pada halaman ini langsung memperbarui persentase kehadiran siswa di Dashboard, Detail Monitoring, dan Rekapitulasi." />

      {/* Tab Mode Switch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-surface border border-border rounded-2xl p-2">
        <button
          type="button"
          onClick={() => setActiveTab('input')}
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'input'
              ? 'bg-primary text-primary-ink'
              : 'bg-page text-ink hover:bg-secondary'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>1. Input / Edit Presensi Pertemuan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-primary-ink'
              : 'bg-page text-ink hover:bg-secondary'
          }`}
        >
          <History className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            2. Riwayat Sesi Presensi ({classPeriodSessions.length} Pertemuan)
          </span>
        </button>
      </div>

      {activeTab === 'input' ? (
        <form onSubmit={handleSaveSession} className="space-y-5">
          {/* Control Panel Card */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h2 className="text-base font-bold text-ink">
                  Parameter Sesi Pertemuan
                </h2>
              </div>
              <div>
                {matchedExistingSession ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-medium">
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mengedit Pertemuan Tercatat ({matchedExistingSession.date})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-success-bg text-success border border-success-border text-xs font-medium">
                    <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mencatat Pertemuan Baru ({meetingDate})</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Pilih Periode */}
              <div>
                <label
                  htmlFor="att-period-select"
                  className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                >
                  Periode Semester
                </label>
                <select
                  id="att-period-select"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Kelas */}
              <div>
                <label
                  htmlFor="att-class-select"
                  className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                >
                  Pilih Kelas
                </label>
                <select
                  id="att-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name} ({cls.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Mata Pelajaran */}
              <div>
                <label
                  htmlFor="att-subject-select"
                  className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                >
                  Pilih Mata Pelajaran
                </label>
                <select
                  id="att-subject-select"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Tanggal */}
              <div>
                <label
                  htmlFor="att-date-input"
                  className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
                >
                  Tanggal Pertemuan
                </label>
                <input
                  id="att-date-input"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Quick Pills to Pick Existing Recorded Sessions or New Date */}
            <div className="rounded-xl bg-page p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted">
                  Pintasan Pilih Sesi Pertemuan Kelas {currentClassObj?.name} ({selectedPeriod?.code}):
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewMeetingDate}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-secondary text-primary hover:bg-light-blue text-xs font-semibold transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Buat Tanggal Pertemuan Baru</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {classPeriodSessions.slice(0, 8).map((sess) => {
                  const sub = subjects.find((s) => s.id === sess.subjectId);
                  const isSelected =
                    sess.date === meetingDate &&
                    sess.subjectId === selectedSubjectId;
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => handleSelectExistingSession(sess)}
                      className={`inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                        isSelected
                          ? 'bg-primary text-primary-ink border-primary'
                          : 'bg-surface text-ink border-border hover:bg-secondary'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {sess.date} — {sub?.code || 'HARIAN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topik Pertemuan */}
            <div>
              <label
                htmlFor="att-topic-input"
                className="block text-xs sm:text-sm font-medium text-ink mb-1.5"
              >
                Topik / Materi Pertemuan
              </label>
              <input
                id="att-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Persamaan Linear & Latihan Pemecahan Masalah"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Live Counter Bar & Quick Action */}
            <div className="pt-3 border-t border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1">
                <div className="rounded-xl bg-success-bg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-success">Hadir (H)</span>
                  <span className="text-base font-bold text-success tabular-nums">
                    {liveCounts.hadir}
                  </span>
                </div>
                <div className="rounded-xl bg-secondary px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">Sakit (S)</span>
                  <span className="text-base font-bold text-primary tabular-nums">
                    {liveCounts.sakit}
                  </span>
                </div>
                <div className="rounded-xl bg-warning-bg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-warning">Izin (I)</span>
                  <span className="text-base font-bold text-warning tabular-nums">
                    {liveCounts.izin}
                  </span>
                </div>
                <div className="rounded-xl bg-danger-bg px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-danger">Alpa (A)</span>
                  <span className="text-base font-bold text-danger tabular-nums">
                    {liveCounts.alpa}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl bg-page px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Kehadiran</span>
                  <span className="text-base font-bold text-ink tabular-nums">
                    {liveCounts.percentage !== null
                      ? `${liveCounts.percentage}%`
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-secondary border border-light-blue text-primary hover:bg-light-blue text-sm font-semibold transition-colors w-full sm:w-auto"
                >
                  <CheckCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tandai Semua Hadir (H)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Student Count Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-bold text-ink">
                Daftar Siswa Kelas {currentClassObj?.name} ({filteredClassStudents.length} dari {classStudents.length} Siswa)
              </h3>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari nama atau NIS siswa..."
                aria-label="Cari nama atau NIS siswa"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-surface border border-border text-ink text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Mobile-First Student Attendance Cards */}
          {filteredClassStudents.length === 0 ? (
            <EmptyState
              title="Siswa tidak ditemukan"
              description="Tidak ada siswa pada kelas ini yang cocok dengan kata kunci pencarian Anda."
              actionLabel="Reset Pencarian"
              onAction={() => setStudentSearch('')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClassStudents.map((student, idx) => {
                const currentStatus =
                  draftRecords[student.id]?.status || 'H';
                const currentNote = draftRecords[student.id]?.note || '';
                const studentPeriodRecap = calculateAttendanceRecap(
                  student.id,
                  selectedPeriodId,
                  attendanceSessions
                );

                return (
                  <div
                    key={student.id}
                    className="bg-surface border border-border rounded-2xl p-4 space-y-3.5"
                  >
                    {/* Top Row: Avatar, Name, NIS & Period Recap Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted tabular-nums">
                              #{idx + 1}
                            </span>
                            <Link
                              to={`/monitoring/${student.id}`}
                              className="text-sm sm:text-base font-bold text-ink hover:text-primary truncate transition-colors"
                            >
                              {student.name}
                            </Link>
                          </div>
                          <p className="text-xs text-muted mt-0.5 tabular-nums">
                            NIS: {student.nis} — Jenis Kelamin: {student.gender}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium tabular-nums ${
                            studentPeriodRecap.percentage === null
                              ? 'bg-page text-muted'
                              : studentPeriodRecap.percentage <
                                DEMO_THRESHOLDS.ATTENDANCE_MIN_PERCENT
                              ? 'bg-warning-bg text-warning'
                              : 'bg-success-bg text-success'
                          }`}
                        >
                          Rekap Sem:{" "}
                          {studentPeriodRecap.percentage !== null
                            ? `${studentPeriodRecap.percentage}%`
                            : 'Data belum tersedia'}
                        </span>
                      </div>
                    </div>

                    {/* Four Touch-Friendly Status Buttons (H, S, I, A) */}
                    <div
                      className="grid grid-cols-4 gap-2"
                      role="group"
                      aria-label={`Status kehadiran ${student.name}`}
                    >
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = currentStatus === opt.code;
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() =>
                              handleSetStudentStatus(student.id, opt.code)
                            }
                            aria-pressed={isActive}
                            className={`min-h-[44px] min-w-[44px] px-2 py-2 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-colors ${
                              isActive
                                ? opt.activeClass
                                : 'bg-page text-muted border-border hover:bg-secondary hover:text-ink font-medium'
                            }`}
                          >
                            <span className="text-sm font-bold">
                              {opt.shortLabel}
                            </span>
                            <span className="text-[11px] sm:text-xs">
                              {opt.fullLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional Note input shown when S / I / A or when note is non-empty */}
                    {(currentStatus !== 'H' || currentNote.length > 0) && (
                      <div className="pt-1">
                        <label
                          htmlFor={`note-${student.id}`}
                          className="sr-only"
                        >
                          Catatan kehadiran {student.name}
                        </label>
                        <input
                          id={`note-${student.id}`}
                          type="text"
                          value={currentNote}
                          onChange={(e) =>
                            handleSetStudentNote(student.id, e.target.value)
                          }
                          placeholder={`Keterangan ${
                            currentStatus === 'S'
                              ? 'Sakit (contoh: Surat dokter / demam)'
                              : currentStatus === 'I'
                              ? 'Izin (contoh: Keperluan keluarga)'
                              : 'Alpa / catatan tambahan'
                          }...`}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-page border border-border text-ink text-xs sm:text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky / Prominent Bottom Save Bar */}
          <div className="sticky bottom-3 z-20 bg-surface border border-border rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-ink">
                Kelas {currentClassObj?.name} — {currentSubjectObj?.name}
              </span>
              <span className="text-muted">
                ({formatIndonesianDate(meetingDate)})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-primary font-semibold tabular-nums">
                H: {liveCounts.hadir} / S: {liveCounts.sakit} / I: {liveCounts.izin} / A: {liveCounts.alpa}
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors w-full sm:w-auto"
            >
              <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Simpan Presensi Pertemuan</span>
            </button>
          </div>
        </form>
      ) : (
        /* TAB 2: RIWAYAT SESI PRESENSI */
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink">
                Riwayat Sesi Presensi Kelas {currentClassObj?.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Daftar pertemuan yang telah tercatat pada {selectedPeriod?.name}. Klik &quot;Edit Presensi&quot; untuk memperbarui data kehadiran.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateNewMeetingDate}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Catat Pertemuan Baru</span>
            </button>
          </div>

          {/* Filter Kelas, Periode, Mapel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="hist-period"
                className="block text-xs font-medium text-ink mb-1"
              >
                Periode Semester
              </label>
              <select
                id="hist-period"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="hist-class"
                className="block text-xs font-medium text-ink mb-1"
              >
                Pilih Kelas
              </label>
              <select
                id="hist-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="hist-subject"
                className="block text-xs font-medium text-ink mb-1"
              >
                Filter Mata Pelajaran
              </label>
              <select
                id="hist-subject"
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-ink text-sm"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredHistorySessions.length === 0 ? (
            <EmptyState
              title="Belum ada sesi presensi tercatat"
              description="Belum terdapat pertemuan yang tercatat untuk filter kelas dan mata pelajaran ini."
              actionLabel="Input Pertemuan Baru"
              onAction={() => setActiveTab('input')}
            />
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {filteredHistorySessions.map((session) => {
                const sub = subjects.find((s) => s.id === session.subjectId);
                const teacher = teachers.find((t) => t.id === session.teacherId);
                const hCount = session.records.filter(
                  (r) => r.status === 'H'
                ).length;
                const sCount = session.records.filter(
                  (r) => r.status === 'S'
                ).length;
                const iCount = session.records.filter(
                  (r) => r.status === 'I'
                ).length;
                const aCount = session.records.filter(
                  (r) => r.status === 'A'
                ).length;
                const total = session.records.length;
                const pct = total > 0 ? round1((hCount / total) * 100) : null;

                return (
                  <div
                    key={session.id}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-primary text-xs font-semibold tabular-nums">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{formatIndonesianDate(session.date)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-page text-ink text-xs font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                          <span>
                            {sub ? `${sub.name} (${sub.code})` : 'Presensi Harian'}
                          </span>
                        </span>
                        {pct !== null && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-bg text-success text-xs font-semibold tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{pct}% Hadir</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm sm:text-base font-bold text-ink">
                        {session.topic}
                      </p>

                      <p className="text-xs text-muted">
                        Dicatat oleh: {teacher?.name || 'Guru Pengampu'} — Total{' '}
                        {total} siswa
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                        <span className="px-2.5 py-1 rounded-lg bg-success-bg text-success">
                          H: {hCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary">
                          S: {sCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-warning-bg text-warning">
                          I: {iCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-danger-bg text-danger">
                          A: {aCount}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectExistingSession(session)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-page hover:bg-secondary text-primary border border-border text-xs sm:text-sm font-semibold transition-colors"
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                        <span>Edit Presensi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementPage;
