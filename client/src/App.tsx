import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Patient Pages
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { BookAppointment } from './pages/patient/BookAppointment';
import { MyAppointments } from './pages/patient/MyAppointments';
import { MyPrescriptions } from './pages/patient/MyPrescriptions';
import { MyMedicalRecords } from './pages/patient/MyMedicalRecords';
import { BedAvailabilityView } from './pages/patient/BedAvailabilityView';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments';
import { ConsultationRoom } from './pages/doctor/ConsultationRoom';
import { MyPatients } from './pages/doctor/MyPatients';
import { DoctorSchedule } from './pages/doctor/DoctorSchedule';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BedManagement } from './pages/admin/BedManagement';
import { AdmissionsManagement } from './pages/admin/AdmissionsManagement';
import { DoctorManagement } from './pages/admin/DoctorManagement';
import { PatientManagement } from './pages/admin/PatientManagement';
import { DepartmentManagement } from './pages/admin/DepartmentManagement';
import { AllAppointments } from './pages/admin/AllAppointments';
import { UserManagement } from './pages/admin/UserManagement';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  return <Navigate to="/patient" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Patient Portal Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
              <Route element={<AppLayout />}>
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/patient/book" element={<BookAppointment />} />
                <Route path="/patient/appointments" element={<MyAppointments />} />
                <Route path="/patient/prescriptions" element={<MyPrescriptions />} />
                <Route path="/patient/medical-records" element={<MyMedicalRecords />} />
                <Route path="/patient/bed-admission" element={<BedAvailabilityView />} />
              </Route>
            </Route>

            {/* Doctor Portal Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
              <Route element={<AppLayout />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                <Route path="/doctor/consultation" element={<ConsultationRoom />} />
                <Route path="/doctor/patients" element={<MyPatients />} />
                <Route path="/doctor/schedule" element={<DoctorSchedule />} />
              </Route>
            </Route>

            {/* Admin Portal Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/beds" element={<BedManagement />} />
                <Route path="/admin/admissions" element={<AdmissionsManagement />} />
                <Route path="/admin/doctors" element={<DoctorManagement />} />
                <Route path="/admin/patients" element={<PatientManagement />} />
                <Route path="/admin/departments" element={<DepartmentManagement />} />
                <Route path="/admin/appointments" element={<AllAppointments />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
