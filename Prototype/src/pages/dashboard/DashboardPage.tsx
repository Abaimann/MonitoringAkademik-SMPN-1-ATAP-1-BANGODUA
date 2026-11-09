import React from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { UserRole } from '../../types/academic';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { WaliKelasDashboard } from './WaliKelasDashboard';
import { GuruMapelDashboard } from './GuruMapelDashboard';
import { SiswaWaliDashboard } from './SiswaWaliDashboard';
import { SimulationDisclaimerBanner } from '../../components/ui/CommonUI';

const ROLE_SWITCH_OPTIONS: {
  role: UserRole;
  label: string;
  shortDesc: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    shortDesc: 'Sekolah & Master Data',
    icon: ShieldCheck,
  },
  {
    role: 'wali_kelas',
    label: 'Wali Kelas',
    shortDesc: 'Rekap Kelas IX-A',
    icon: Users,
  },
  {
    role: 'guru_mapel',
    label: 'Guru Mapel',
    shortDesc: 'Matematika & IPA',
    icon: BookOpen,
  },
  {
    role: 'siswa',
    label: 'Siswa',
    shortDesc: 'Capaian Pribadi',
    icon: GraduationCap,
  },
  {
    role: 'wali_murid',
    label: 'Wali Murid',
    shortDesc: 'Pantauan Orang Tua',
    icon: HeartHandshake,
  },
];

export const DashboardPage: React.FC = () => {
  const { currentUser, loginAsRole } = useAcademic();

  const activeRole: UserRole = currentUser?.role || 'super_admin';

  const renderRoleDashboard = () => {
    switch (activeRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'wali_kelas':
        return <WaliKelasDashboard />;
      case 'guru_mapel':
        return <GuruMapelDashboard />;
      case 'siswa':
      case 'wali_murid':
        return <SiswaWaliDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact 1-Tap Role Switcher Bar for Live Thesis Demonstration */}
      <div className="bg-surface border border-border rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-ink">
                Simulasi Peran Pengguna (1-Tap Demo Sidang)
              </h2>
            </div>
          </div>
          <span className="text-xs text-muted">
            Aktif: <strong className="text-ink">{currentUser?.roleLabel}</strong> ({currentUser?.name})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ROLE_SWITCH_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => loginAsRole(item.role)}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-ink border-primary shadow-sm'
                    : 'bg-page hover:bg-secondary text-ink border-border'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-primary-ink' : 'text-primary'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{item.label}</p>
                  <p
                    className={`text-xs truncate ${
                      isActive ? 'text-primary-ink/85' : 'text-muted'
                    }`}
                  >
                    {item.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role-Specific Dashboard Content */}
      {renderRoleDashboard()}

      {/* Compact Simulation Disclaimer */}
      <SimulationDisclaimerBanner compact />
    </div>
  );
};

export default DashboardPage;
