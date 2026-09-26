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
    <aside className="w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 shrink-0 hidden md:flex z-20 select-none">
      <div className="space-y-6">
        {/* Minimal Role Indicator */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            {role === 'ADMIN' ? (
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            ) : role === 'DOCTOR' ? (
              <Stethoscope className="w-4 h-4 text-cyan-400" />
            ) : (
              <HeartPulse className="w-4 h-4 text-teal-400" />
            )}
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Portal
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {role === 'ADMIN'
                ? 'Operations HQ'
                : role === 'DOCTOR'
                ? 'Clinical Suite'
                : 'Patient Care'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
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
                      ? 'bg-sky-500/25 border border-sky-400/40 text-white shadow-md shadow-sky-500/20 backdrop-blur-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-sky-400" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Hospital contact info pill */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <Hospital className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-[11px]">HIRO Medical Hub</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">24/7 Helpline: +1 (800) 555-0199</p>
      </div>
    </aside>
  );
};

export default Sidebar;
