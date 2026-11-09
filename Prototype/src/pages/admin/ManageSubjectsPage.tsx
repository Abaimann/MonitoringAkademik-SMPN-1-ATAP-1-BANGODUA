import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  Edit3,
  Layers,
  Link2,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Subject, SubjectCluster } from '../../types/academic';
import { CLUSTER_LABELS, validateWeights } from '../../utils/academicRules';
import {
  BottomSheet,
  EmptyState,
  PageHeader,
  SimulationDisclaimerBanner,
} from '../../components/ui/CommonUI';

const ADMIN_NAV_ITEMS = [
  { path: '/admin/guru', label: 'Data Guru', icon: Users },
  { path: '/admin/kelas', label: 'Data Kelas', icon: Building2 },
  { path: '/admin/mapel', label: 'Mata Pelajaran', icon: BookOpen },
  { path: '/admin/periode', label: 'Periode Akademik', icon: CalendarRange },
  { path: '/admin/penugasan', label: 'Penugasan Mengajar', icon: Link2 },
  { path: '/siswa', label: 'Data Siswa', icon: UserCheck },
];

const CLUSTER_OPTIONS: SubjectCluster[] = [
  'sains_teknologi',
  'sosial_humaniora',
  'bahasa_komunikasi',
  'terapan_prakarya',
];

export const ManageSubjectsPage: React.FC = () => {
  const location = useLocation();
  const {
    currentUser,
    loginAsRole,
    subjects,
    addSubject,
    updateSubject,
  } = useAcademic();

  const [searchQuery, setSearchQuery] = useState('');
  const [clusterFilter, setClusterFilter] = useState<'ALL' | SubjectCluster>(
    'ALL'
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [cluster, setCluster] = useState<SubjectCluster>('sains_teknologi');
  const [monitoringThreshold, setMonitoringThreshold] = useState<number>(72);
  const [weightTugas, setWeightTugas] = useState<number>(40);
  const [weightUts, setWeightUts] = useState<number>(30);
  const [weightUas, setWeightUas] = useState<number>(30);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const matchesCluster =
        clusterFilter === 'ALL' ? true : sub.cluster === clusterFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        sub.name.toLowerCase().includes(q) ||
        sub.code.toLowerCase().includes(q) ||
        CLUSTER_LABELS[sub.cluster].toLowerCase().includes(q);
      return matchesCluster && matchesQuery;
    });
  }, [subjects, clusterFilter, searchQuery]);

  const weightValidation = useMemo(
    () =>
      validateWeights({
        tugas: Number(weightTugas) || 0,
        uts: Number(weightUts) || 0,
        uas: Number(weightUas) || 0,
      }),
    [weightTugas, weightUts, weightUas]
  );

  const openAddModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setCluster('sains_teknologi');
    setMonitoringThreshold(72);
    setWeightTugas(40);
    setWeightUts(30);
    setWeightUas(30);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setCluster(sub.cluster);
    setMonitoringThreshold(sub.monitoringThreshold);
    setWeightTugas(sub.defaultWeights.tugas);
    setWeightUts(sub.defaultWeights.uts);
    setWeightUas(sub.defaultWeights.uas);
    setFormError(null);
    setIsSheetOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError('Kode dan nama mata pelajaran wajib diisi.');
      return;
    }
    if (monitoringThreshold < 0 || monitoringThreshold > 100) {
      setFormError(
        'Ambang pemantauan demonstrasi harus berada pada skala 0 hingga 100.'
      );
      return;
    }
    if (!weightValidation.isValid) {
      setFormError(weightValidation.message);
      return;
    }

    const payload: Omit<Subject, 'id'> = {
      code: code.trim(),
      name: name.trim(),
      cluster,
      monitoringThreshold: Number(monitoringThreshold),
      defaultWeights: {
        tugas: Number(weightTugas),
        uts: Number(weightUts),
        uas: Number(weightUas),
      },
    };

    if (editingSubject) {
      updateSubject({
        ...payload,
        id: editingSubject.id,
      });
    } else {
      addSubject(payload);
    }
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Kelola Mata Pelajaran"
        subtitle="Pengaturan kode mata pelajaran, pemetaan rumpun akademik SMA/SMK, ambang pemantauan, serta bobot default"
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Mata Pelajaran</span>
          </button>
        }
      />

      {/* Navigasi Master Data Super Admin */}
      <nav
        aria-label="Navigasi Data Master Super Admin"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-ink border-primary'
                  : 'bg-surface text-ink border-border hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {currentUser?.role !== 'super_admin' && (
        <div className="rounded-2xl bg-secondary border border-light-blue p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-ink leading-relaxed">
              Anda sedang melihat halaman pengelolaan mata pelajaran. Beralih ke peran{' '}
              <span className="font-bold">Super Admin</span> untuk mengatur mata pelajaran dan rumpun.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loginAsRole('super_admin')}
            className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs font-medium transition-colors shrink-0"
          >
            Aktifkan Mode Super Admin
          </button>
        </div>
      )}

      <SimulationDisclaimerBanner text="Pemetaan rumpun akademik pada setiap mata pelajaran digunakan secara langsung oleh modul Rekomendasi Pendidikan Lanjutan SMA/SMK." />

      {/* Ringkasan & Pencarian */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {CLUSTER_OPTIONS.map((cl) => {
            const count = subjects.filter((s) => s.cluster === cl).length;
            return (
              <div key={cl} className="rounded-xl bg-page p-3 space-y-1">
                <span className="text-xs text-muted line-clamp-1">
                  {CLUSTER_LABELS[cl]}
                </span>
                <span className="text-lg font-bold text-primary tabular-nums block">
                  {count} Mapel
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode, nama mata pelajaran, atau rumpun..."
              aria-label="Cari mata pelajaran"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <select
              value={clusterFilter}
              onChange={(e) =>
                setClusterFilter(e.target.value as 'ALL' | SubjectCluster)
              }
              aria-label="Filter rumpun akademik"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary transition-colors"
            >
              <option value="ALL">Semua Rumpun ({subjects.length})</option>
              {CLUSTER_OPTIONS.map((cl) => (
                <option key={cl} value={cl}>
                  {CLUSTER_LABELS[cl]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Daftar Mata Pelajaran */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          title="Mata Pelajaran Tidak Ditemukan"
          description="Tidak ada mata pelajaran yang cocok dengan kata kunci atau filter rumpun yang dipilih."
          actionLabel="Tambah Mata Pelajaran"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-secondary text-primary border border-light-blue text-xs font-bold">
                        {sub.code}
                      </span>
                      <h3 className="text-base font-bold text-ink">
                        {sub.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Rumpun Akademik */}
                <div className="rounded-xl bg-secondary p-3 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="text-muted block">Rumpun Akademik:</span>
                    <span className="font-semibold text-ink">
                      {CLUSTER_LABELS[sub.cluster]}
                    </span>
                  </div>
                </div>

                {/* Ambang & Bobot Default */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-page p-3 space-y-1">
                    <span className="text-muted flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Ambang Pemantauan</span>
                    </span>
                    <span className="text-sm font-bold text-ink tabular-nums block">
                      Nilai Minimal {sub.monitoringThreshold}
                    </span>
                  </div>

                  <div className="rounded-xl bg-page p-3 space-y-1">
                    <span className="text-muted flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Bobot Default</span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-ink tabular-nums block">
                      Tugas {sub.defaultWeights.tugas}% / UTS {sub.defaultWeights.uts}% / UAS {sub.defaultWeights.uas}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => openEditModal(sub)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-secondary hover:bg-light-blue text-primary text-xs sm:text-sm font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4 shrink-0" />
                  <span>Edit Mata Pelajaran</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BottomSheet Tambah / Edit Mata Pelajaran */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={
          editingSubject
            ? `Edit Mata Pelajaran ${editingSubject.name}`
            : 'Tambah Mata Pelajaran Baru'
        }
        subtitle="Atur rumpun akademik, ambang pemantauan demonstrasi, dan komposisi bobot penilaian default (100%)"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-ink hover:bg-secondary text-xs sm:text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="subject-form"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-ink text-xs sm:text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Simpan Mata Pelajaran</span>
            </button>
          </div>
        }
      >
        <form id="subject-form" onSubmit={handleSaveSubject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Kode Mapel
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: MTK"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink mb-1">
                Nama Mata Pelajaran
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Matematika"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Rumpun Akademik (Pemetaan Studi Lanjut SMA/SMK)
            </label>
            <select
              value={cluster}
              onChange={(e) => setCluster(e.target.value as SubjectCluster)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink focus:outline-none focus:border-primary"
            >
              {CLUSTER_OPTIONS.map((cl) => (
                <option key={cl} value={cl}>
                  {CLUSTER_LABELS[cl]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">
              Ambang Pemantauan Demonstrasi (Skala 0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={monitoringThreshold}
              onChange={(e) => setMonitoringThreshold(Number(e.target.value))}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-page border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted mt-1">
              Nilai di bawah ambang ini akan diberi penanda evaluasi pada dashboard pemantauan.
            </p>
          </div>

          <div className="rounded-xl bg-page p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink">
                Bobot Default Komponen Penilaian (%)
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                  weightValidation.isValid
                    ? 'bg-success-bg text-success'
                    : 'bg-danger-bg text-danger'
                }`}
              >
                Total: {weightValidation.total}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs text-muted mb-1">
                  Bobot Tugas (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightTugas}
                  onChange={(e) => setWeightTugas(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">
                  Bobot UTS (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightUts}
                  onChange={(e) => setWeightUts(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">
                  Bobot UAS (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weightUas}
                  onChange={(e) => setWeightUas(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink tabular-nums focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <p
              className={`text-xs ${
                weightValidation.isValid ? 'text-muted' : 'text-danger font-medium'
              }`}
            >
              {weightValidation.message}
            </p>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};

export default ManageSubjectsPage;
