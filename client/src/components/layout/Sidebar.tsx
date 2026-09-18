import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarPlus,
  FileText,
  ClipboardList,
  BedDouble,
  UserCheck,
  Users,
  Building2,
  Stethoscope,
  Clock,
  ShieldCheck,
  Hospital,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const patientNav = [
    { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
    { name: 'Find Doctors & Book', path: '/patient/book', icon: CalendarPlus },
    { name: 'My Appointments', path: '/patient/appointments', icon: CalendarCheck },
    { name: 'My Prescriptions', path: '/patient/prescriptions', icon: FileText },
    { name: 'Medical Records (EHR)', path: '/patient/medical-records', icon: ClipboardList },
    { name: 'Bed & Inpatient Status', path: '/patient/bed-admission', icon: BedDouble },
  ];

  const doctorNav = [
    { name: 'Doctor Dashboard', path: '/doctor', icon: LayoutDashboard },
    { name: 'Appointment Requests', path: '/doctor/appointments', icon: CalendarCheck },
    { name: 'My Assigned Patients', path: '/doctor/patients', icon: Users },
    { name: 'Consultation & Rx', path: '/doctor/consultation', icon: Stethoscope },
    { name: 'Working Hours & Slots', path: '/doctor/schedule', icon: Clock },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Bed & Ward Matrix', path: '/admin/beds', icon: BedDouble },
    { name: 'Admissions & Discharge', path: '/admin/admissions', icon: UserCheck },
    { name: 'Doctor Directory', path: '/admin/doctors', icon: Stethoscope },
    { name: 'Patient Directory', path: '/admin/patients', icon: Users },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Global Appointments', path: '/admin/appointments', icon: CalendarCheck },
    { name: 'User Management', path: '/admin/users', icon: ShieldCheck },
  ];

  const currentNav =
    role === 'ADMIN' ? adminNav : role === 'DOCTOR' ? doctorNav : patientNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 shrink-0 shadow-xs hidden md:flex">
      <div className="space-y-6">
        {/* Role Badge Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/50 border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-brand-600">
            {role === 'ADMIN' ? (
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            ) : role === 'DOCTOR' ? (
              <Stethoscope className="w-5 h-5 text-brand-600" />
            ) : (
              <HeartPulse className="w-5 h-5 text-teal-600" />
            )}
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Portal
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {role === 'ADMIN'
                ? 'Administration HQ'
                : role === 'DOCTOR'
                ? 'Physician Workspace'
                : 'Patient Health Desk'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Navigation
          </span>
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/patient' || item.path === '/doctor' || item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Hospital contact info card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <Hospital className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold">24/7 Helpline</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Emergency: +1 (800) 555-0199</p>
        <p className="text-[11px] text-slate-400">Main Line: +1 (555) 019-2831</p>
      </div>
    </aside>
  );
};
