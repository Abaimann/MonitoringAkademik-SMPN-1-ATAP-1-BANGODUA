import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAcademic } from './context/AcademicContext';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { StudentListPage } from './pages/students/StudentListPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { GradeManagementPage } from './pages/grades/GradeManagementPage';
import { StudentGradeDetailPage } from './pages/grades/StudentGradeDetailPage';
import { AttendanceManagementPage } from './pages/attendance/AttendanceManagementPage';
import { AttendanceRecapPage } from './pages/attendance/AttendanceRecapPage';
import { StudentMonitoringPage } from './pages/monitoring/StudentMonitoringPage';
import { PeriodAnalysisPage } from './pages/monitoring/PeriodAnalysisPage';
import { AttentionStudentsPage } from './pages/monitoring/AttentionStudentsPage';
import { ContinuationRecommendationPage } from './pages/recommendation/ContinuationRecommendationPage';
import { ManageTeachersPage } from './pages/admin/ManageTeachersPage';
import { ManageClassesPage } from './pages/admin/ManageClassesPage';
import { ManageSubjectsPage } from './pages/admin/ManageSubjectsPage';
import { ManagePeriodsPage } from './pages/admin/ManagePeriodsPage';
import { ManageAssignmentsPage } from './pages/admin/ManageAssignmentsPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAcademic();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
};

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/siswa"
          element={
            <ProtectedRoute>
              <StudentListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/siswa/:studentId"
          element={
            <ProtectedRoute>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nilai"
          element={
            <ProtectedRoute>
              <GradeManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nilai/:studentId"
          element={
            <ProtectedRoute>
              <StudentGradeDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/presensi"
          element={
            <ProtectedRoute>
              <AttendanceManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/presensi/rekap"
          element={
            <ProtectedRoute>
              <AttendanceRecapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <StudentMonitoringPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring/:studentId"
          element={
            <ProtectedRoute>
              <StudentMonitoringPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analisis"
          element={
            <ProtectedRoute>
              <PeriodAnalysisPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perhatian"
          element={
            <ProtectedRoute>
              <AttentionStudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rekomendasi"
          element={
            <ProtectedRoute>
              <ContinuationRecommendationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rekomendasi/:studentId"
          element={
            <ProtectedRoute>
              <ContinuationRecommendationPage />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Master Data Routes */}
        <Route
          path="/admin/guru"
          element={
            <ProtectedRoute>
              <ManageTeachersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/kelas"
          element={
            <ProtectedRoute>
              <ManageClassesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/mapel"
          element={
            <ProtectedRoute>
              <ManageSubjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/periode"
          element={
            <ProtectedRoute>
              <ManagePeriodsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/penugasan"
          element={
            <ProtectedRoute>
              <ManageAssignmentsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
