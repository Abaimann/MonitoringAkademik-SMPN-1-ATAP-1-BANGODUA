import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Compass,
  Filter,
  GraduationCap,
  Plus,
  RotateCcw,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import {
  calculateAttendanceRecap,
  compareStudentPeriods,
  getStudentPeriodAverage,
} from '../../utils/academicRules';
import {
  BottomSheet,
  EmptyState,
  PageHeader,
  TrendBadge,
} from '../../components/ui/CommonUI';
import { TrendDirection } from '../../types/academic';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export const StudentListPage: React.FC = () => {
  const {
    currentUser,
    students,
    classes,
    periods,
    selectedPeriodId,
    grades,
    attendanceSessions,
    addStudent,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (currentUser?.role === 'wali_kelas' && currentUser.classId) {
      return currentUser.classId;
    }
    return 'ALL';
  });
  const [selectedTrend, setSelectedTrend] = useState<'ALL' | TrendDirection>('ALL');

  // Add Student BottomSheet State (for Super Admin)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [newClassId, setNewClassId] = useState<string>(classes[0]?.id || 'cls-9a');
  const [newBirthDate, setNewBirthDate] = useState('2010-05-14');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('0812-3456-7890');
  const [newDemoNote, setNewDemoNote] = useState('Data Siswa Tambahan Simulasi');

  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) || periods[periods.length - 1];

  // Enrich students with computed academic summary for selectedPeriodId
  const enrichedStudents = useMemo(() => {
    return students.map((student) => {
      const cls = classes.find((c) => c.id === student.classId);
      const periodAvg = getStudentPeriodAverage(
        student.id,
        selectedPeriod.id,
        grades
      );
      const comparison = compareStudentPeriods(
        student.id,
        selectedPeriod.id,
        periods,
        grades
      );
      const attendance = calculateAttendanceRecap(
        student.id,
        selectedPeriod.id,
        attendanceSessions
      );

      return {
        student,
        className: cls?.name || '-',
        averageScore: periodAvg.average,
        completedCount: periodAvg.completedCount,
        totalCount: periodAvg.totalCount,
        trendStatus: comparison.status,
        trendDelta: comparison.delta,
        attendancePercentage: attendance.percentage,
        totalMeetings: attendance.totalMeetings,
      };
    });
  }, [students, classes, selectedPeriod.id, grades, periods, attendanceSessions]);

  // If currentUser is Siswa or Wali Murid, show personal card view
  if (currentUser?.role === 'siswa' || currentUser?.role === 'wali_murid') {
    const myStudentItem =
      enrichedStudents.find((item) => item.student.id === currentUser.studentId) ||
      enrichedStudents[0];

    if (!myStudentItem) {
      return (
        <div className="space-y-5">
          <PageHeader
            title="Profil Akademik Siswa"
            subtitle="Informasi data akademik siswa terdaftar"
          />
          <EmptyState
            title="Data Siswa Tidak Ditemukan"
            description="Silakan pilih siswa simulasi melalui halaman Profil."
          />
        </div>
      );
    }

    const { student, className, averageScore, trendStatus, trendDelta, attendancePercentage } =
      myStudentItem;

    return (
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Profil Akademik Siswa"
          subtitle={`Ringkasan data akademik ${student.name} pada ${selectedPeriod.name} (${selectedPeriod.academicYear})`}
        />

        <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-ink flex items-center justify-center font-bold text-base shrink-0">
                {getInitials(student.name)}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-secondary text-primary text-xs font-semibold">
                  Kelas {className}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-ink mt-1 truncate">
                  {student.name}
                </h2>
                <p className="text-xs text-muted">
                  NIS: {student.nis} / NISN: {student.nisn}
                </p>
              </div>
            </div>
            <TrendBadge status={trendStatus} delta={trendDelta} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-page p-3.5">
              <p className="text-xs text-muted">Rata-rata Nilai</p>
              <p className="text-lg font-bold text-ink tabular-nums mt-0.5">
                {averageScore !== null ? averageScore : 'Belum Lengkap'}
              </p>
            </div>
            <div className="rounded-xl bg-page p-3.5">
              <p className="text-xs text-muted">Persentase Kehadiran</p>
              <p className="text-lg font-bold text-ink tabular-nums mt-0.5">
                {attendancePercentage !== null ? `${attendancePercentage}%` : 'Belum Tersedia'}
              </p>
            </div>
            <div className="rounded-xl bg-page p-3.5 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted">Wali Murid</p>
              <p className="text-sm font-semibold text-ink mt-1 truncate">
                {student.parentName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border">
            <Link
              to={`/siswa/${student.id}`}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Detail Siswa</span>
            </Link>
            <Link
              to={`/monitoring/${student.id}`}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Monitoring</span>
            </Link>
            <Link
              to={`/rekomendasi/${student.id}`}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-page hover:bg-secondary text-ink text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>Rekomendasi</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter logic for Super Admin, Wali Kelas, Guru Mapel
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedStudents.filter((item) => {
      if (selectedClassId !== 'ALL' && item.student.classId !== selectedClassId) {
        return false;
      }
      if (selectedTrend !== 'ALL' && item.trendStatus !== selectedTrend) {
        return false;
      }
      if (q) {
        const matchName = item.student.name.toLowerCase().includes(q);
        const matchNis = item.student.nis.toLowerCase().includes(q);
        const matchNisn = item.student.nisn.toLowerCase().includes(q);
        return matchName || matchNis || matchNisn;
      }
      return true;
    });
  }, [enrichedStudents, searchQuery, selectedClassId, selectedTrend]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedClassId('ALL');
    setSelectedTrend('ALL');
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNis.trim()) return;

    addStudent({
      name: newName.trim(),
      nis: newNis.trim(),
      nisn: newNisn.trim() || `009${Date.now().toString().slice(-7)}`,
      gender: newGender,
      classId: newClassId,
      birthDate: newBirthDate,
      parentName: newParentName.trim() || `Orang Tua ${newName.trim()}`,
      parentPhone: newParentPhone.trim() || '0812-0000-0000',
      enrollmentYear: '2024',
      demoPatternNote: newDemoNote.trim() || 'Data Siswa Tambahan Simulasi',
    });

    setNewName('');
    setNewNis('');
    setNewNisn('');
    setNewParentName('');
    setIsAddSheetOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Direktori Data Siswa"
        subtitle={`Daftar siswa SMPN Satu Atap 1 Bangodua beserta ringkasan capaian ${selectedPeriod.name} (${selectedPeriod.academicYear})`}
        actions={
          currentUser?.role === 'super_admin' ? (
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Tambah Siswa Demo</span>
            </button>
          ) : undefined
        }
      />

      {/* Search & Filter Panel */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-2 lg:col-span-5">
            <label
              htmlFor="student-search-input"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Cari Nama Siswa / NIS / NISN
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="student-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama siswa, NIS, atau NISN..."
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Class filter */}
          <div className="lg:col-span-3">
            <label
              htmlFor="student-class-filter"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Filter Rombongan Kelas
            </label>
            <select
              id="student-class-filter"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trend filter */}
          <div className="lg:col-span-4">
            <label
              htmlFor="student-trend-filter"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Filter Status Perkembangan
            </label>
            <div className="flex items-center gap-2">
              <select
                id="student-trend-filter"
                value={selectedTrend}
                onChange={(e) =>
                  setSelectedTrend(e.target.value as 'ALL' | TrendDirection)
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm font-medium text-ink focus:outline-none focus:border-primary transition-colors"
              >
                <option value="ALL">Semua Status Perkembangan</option>
                <option value="meningkat">Meningkat</option>
                <option value="stabil">Stabil</option>
                <option value="menurun">Menurun</option>
                <option value="belum_cukup_data">Data Belum Cukup</option>
              </select>

              {(searchQuery ||
                selectedClassId !== 'ALL' ||
                selectedTrend !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-page hover:bg-secondary text-muted hover:text-ink inline-flex items-center justify-center transition-colors shrink-0"
                  title="Atur ulang filter pencarian"
                  aria-label="Atur ulang filter pencarian"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>
              Menampilkan <strong className="text-ink">{filteredItems.length}</strong> dari{' '}
              <strong className="text-ink">{students.length}</strong> siswa terdaftar
            </span>
          </span>
          <span>
            Periode Pemantauan: <strong className="text-ink">{selectedPeriod.name}</strong>
          </span>
        </div>
      </div>

      {/* Empty State if no matching students */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="Siswa Tidak Ditemukan"
          description="Tidak ada data siswa yang sesuai dengan kata kunci pencarian atau filter kelas dan tren yang dipilih."
          actionLabel="Tampilkan Semua Siswa"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          {/* Mobile & Tablet Card List View (visible below lg:) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
            {filteredItems.map((item) => {
              const {
                student,
                className,
                averageScore,
                trendStatus,
                trendDelta,
                attendancePercentage,
              } = item;

              return (
                <div
                  key={student.id}
                  className="bg-surface border border-border rounded-2xl p-4 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar, Name, Class Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-secondary text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/siswa/${student.id}`}
                            className="text-sm sm:text-base font-bold text-ink hover:text-primary transition-colors block truncate"
                          >
                            {student.name}
                          </Link>
                          <p className="text-xs text-muted mt-0.5">
                            NIS: {student.nis} / NISN: {student.nisn}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-secondary text-primary text-xs font-semibold shrink-0">
                        Kelas {className}
                      </span>
                    </div>

                    {/* Metrics Row inside bg-page well */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl bg-page p-2.5">
                        <p className="text-xs text-muted">Rata-rata Nilai</p>
                        <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                          {averageScore !== null ? averageScore : 'Belum Lengkap'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-page p-2.5">
                        <p className="text-xs text-muted">Kehadiran</p>
                        <p className="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">
                          {attendancePercentage !== null
                            ? `${attendancePercentage}%`
                            : 'Belum Tersedia'}
                        </p>
                      </div>
                    </div>

                    {/* Trend Badge & Demo Pattern Note */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <TrendBadge status={trendStatus} delta={trendDelta} size="sm" />
                      <span className="text-xs text-muted truncate max-w-[180px]">
                        {student.demoPatternNote}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border grid grid-cols-3 gap-2">
                    <Link
                      to={`/siswa/${student.id}`}
                      className="min-h-[44px] px-2.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Detail Siswa</span>
                    </Link>
                    <Link
                      to={`/monitoring/${student.id}`}
                      className="min-h-[44px] px-2.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <BarChart3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Monitoring</span>
                    </Link>
                    <Link
                      to={`/rekomendasi/${student.id}`}
                      className="min-h-[44px] px-2.5 py-2 rounded-xl bg-page hover:bg-secondary text-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Compass className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                      <span>Rekomendasi</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Responsive Table View (lg: and up) */}
          <div className="hidden lg:block bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-page border-b border-border text-xs font-semibold text-muted">
                    <th className="py-3.5 px-4">Nama Siswa & Identitas</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Rata-rata Nilai</th>
                    <th className="py-3.5 px-4">Tren Perkembangan</th>
                    <th className="py-3.5 px-4">Persentase Kehadiran</th>
                    <th className="py-3.5 px-4 text-right">Tindakan Akademik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredItems.map((item) => {
                    const {
                      student,
                      className,
                      averageScore,
                      completedCount,
                      totalCount,
                      trendStatus,
                      trendDelta,
                      attendancePercentage,
                      totalMeetings,
                    } = item;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-page/70 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/siswa/${student.id}`}
                                className="font-bold text-ink hover:text-primary transition-colors block"
                              >
                                {student.name}
                              </Link>
                              <p className="text-xs text-muted mt-0.5">
                                NIS: {student.nis} — NISN: {student.nisn}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary text-primary text-xs font-semibold">
                            Kelas {className}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 tabular-nums">
                          {averageScore !== null ? (
                            <div>
                              <span className="font-bold text-ink text-base">
                                {averageScore}
                              </span>
                              <span className="block text-xs text-muted">
                                {completedCount}/{totalCount} mapel lengkap
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-warning">
                              Data Belum Lengkap ({completedCount}/{totalCount})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <TrendBadge status={trendStatus} delta={trendDelta} />
                        </td>
                        <td className="py-3.5 px-4 tabular-nums">
                          {attendancePercentage !== null ? (
                            <div>
                              <span className="font-semibold text-ink">
                                {attendancePercentage}%
                              </span>
                              <span className="block text-xs text-muted">
                                {totalMeetings} pertemuan
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">
                              Belum Tersedia
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/siswa/${student.id}`}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Detail Siswa</span>
                            </Link>
                            <Link
                              to={`/monitoring/${student.id}`}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <BarChart3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Monitoring</span>
                            </Link>
                            <Link
                              to={`/rekomendasi/${student.id}`}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-page hover:bg-secondary text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <Compass className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                              <span>Rekomendasi</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BottomSheet: Tambah Siswa Demo (Super Admin) */}
      <BottomSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        title="Tambah Siswa Demo"
        subtitle="Tambahkan data siswa baru ke dalam simulasi direktori akademik"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddSheetOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-ink hover:bg-secondary transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="add-student-form"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-sm font-semibold transition-colors"
            >
              Simpan Data Siswa
            </button>
          </div>
        }
      >
        <form
          id="add-student-form"
          onSubmit={handleAddStudentSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="add-stu-name"
              className="block text-xs font-semibold text-ink mb-1"
            >
              Nama Lengkap Siswa
            </label>
            <input
              id="add-stu-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Muhammad Rizky Pratama"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-stu-nis"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nomor Induk Siswa (NIS)
              </label>
              <input
                id="add-stu-nis"
                type="text"
                required
                value={newNis}
                onChange={(e) => setNewNis(e.target.value)}
                placeholder="Contoh: 2409037"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="add-stu-nisn"
                className="block text-xs font-semibold text-ink mb-1"
              >
                NISN
              </label>
              <input
                id="add-stu-nisn"
                type="text"
                value={newNisn}
                onChange={(e) => setNewNisn(e.target.value)}
                placeholder="Contoh: 0098123499"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-stu-gender"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Jenis Kelamin
              </label>
              <select
                id="add-stu-gender"
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="add-stu-class"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Rombongan Kelas
              </label>
              <select
                id="add-stu-class"
                value={newClassId}
                onChange={(e) => setNewClassId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-stu-birthdate"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Tanggal Lahir
              </label>
              <input
                id="add-stu-birthdate"
                type="date"
                value={newBirthDate}
                onChange={(e) => setNewBirthDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="add-stu-parent"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nama Orang Tua / Wali
              </label>
              <input
                id="add-stu-parent"
                type="text"
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
                placeholder="Contoh: Bapak Ahmad"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="add-stu-phone"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Nomor Telepon Wali Murid
              </label>
              <input
                id="add-stu-phone"
                type="text"
                value={newParentPhone}
                onChange={(e) => setNewParentPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="add-stu-note"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Catatan Pola Simulasi
              </label>
              <input
                id="add-stu-note"
                type="text"
                value={newDemoNote}
                onChange={(e) => setNewDemoNote(e.target.value)}
                placeholder="Catatan transparansi demo"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};
export default StudentListPage;
