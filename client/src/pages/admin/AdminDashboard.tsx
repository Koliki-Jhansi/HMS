import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  BedDouble,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Activity,
  UserPlus,
  Layers,
  ChevronRight,
} from 'lucide-react';

import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to Hospital Operations Command Center..." />;
  }

  const {
    overview = {},
    wardStats = [],
    recentAppointments = [],
    recentAdmissions = [],
  } = data || {};

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-8rem)] text-white space-y-8 select-none py-2 max-w-6xl">
      {/* =========================================================================
          1. OPERATIONS HEADER DIRECTLY ON BACKGROUND (NO BIG CARD)
         ========================================================================= */}
      <div className="space-y-1 drop-shadow-md">
        <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>HIRO HOSPITAL • Operations Command Center</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          Hospital Operations <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">
            Overview & Telemetry
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl drop-shadow">
          Live inpatient admissions, bed allocation telemetry, clinical roster, and workflow queues.
        </p>
      </div>

      {/* =========================================================================
          2. EXECUTIVE STATISTICS (DIRECT ON BACKGROUND, NO CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl py-2 drop-shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Patients
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {overview?.totalPatients || 0}
          </span>
          <span className="text-[10px] text-sky-300 block font-medium">Electronic Health Records</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Doctors On Duty
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {overview?.totalDoctors || 0}
          </span>
          <span className="text-[10px] text-sky-300 block font-medium">
            Across {overview?.totalDepartments || 0} Clinical Units
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Bed Occupancy
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {overview?.bedOccupancyRate || 0}%
          </span>
          <span className="text-[10px] text-sky-300 block font-medium">
            {overview?.occupiedBeds || 0} of {overview?.totalBeds || 0} Beds In Use
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Admissions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {overview?.activeAdmissions || 0}
          </span>
          <span className="text-[10px] text-sky-300 block font-medium">Currently in Wards</span>
        </div>
      </div>

      {/* =========================================================================
          3. ADMINISTRATIVE ACTION PILLS DIRECTLY ON BACKGROUND
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          to="/admin/admissions"
          className="px-4 py-2.5 rounded-full bg-sky-500/25 hover:bg-sky-500/40 text-white font-bold text-xs border border-sky-400/40 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 shadow-sm"
        >
          <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          New Admission
        </Link>

        <Link
          to="/admin/beds"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <BedDouble className="w-3.5 h-3.5 text-sky-300" />
          Bed & Ward Matrix
        </Link>

        <Link
          to="/admin/doctors"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Stethoscope className="w-3.5 h-3.5 text-sky-300" />
          Doctor Directory
        </Link>

        <Link
          to="/admin/patients"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Users className="w-3.5 h-3.5 text-sky-300" />
          Patient Records
        </Link>

        <Link
          to="/admin/departments"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-300" />
          Departments
        </Link>

        <Link
          to="/admin/appointments"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-300" />
          Appointments Flow
        </Link>
      </div>

      {/* =========================================================================
          4. WARD OCCUPANCY & CAPACITY TELEMETRY (SLIM INLINE PROGRESS METERS)
         ========================================================================= */}
      <div className="space-y-4 pt-4 max-w-4xl">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-sky-300">
              Ward Capacity & Live Occupancy
            </h2>
          </div>
          <Link
            to="/admin/beds"
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
          >
            Manage Bed Matrix <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wardStats.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-full py-2">No ward capacity data available.</p>
          ) : (
            wardStats.map((ward: any) => {
              const occRate = Math.min(100, Math.round(ward.occupancyRate || 0));
              const isHigh = occRate >= 80;
              return (
                <div key={ward.id} className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ward.name}</span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isHigh ? 'text-rose-400' : 'text-sky-300'
                      }`}
                    >
                      {occRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isHigh ? 'bg-rose-500' : 'bg-sky-400'}`}
                      style={{ width: `${occRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>In Use: {ward.occupiedBeds}</span>
                    <span>Free: {ward.availableBeds}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          5. RECENT ACTIVITY DIRECTLY ON BACKGROUND (NO BIG CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* RECENT ADMISSIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Recent Inpatient Admissions
            </h3>
            <Link
              to="/admin/admissions"
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              All Admissions <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentAdmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No recent inpatient admissions.</p>
            ) : (
              recentAdmissions.slice(0, 4).map((adm: any, idx: number) => {
                const patientName = adm?.patient?.user?.name || adm?.patient?.name || 'Inpatient';
                const wardName = adm?.bed?.ward?.name || adm?.ward?.name || 'General Ward';
                const bedNum = adm?.bed?.bedNumber || 'N/A';

                return (
                  <div
                    key={adm.id || adm._id || idx}
                    className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-200"
                  >
                    <div>
                      <span className="font-bold text-white block">{patientName}</span>
                      <span className="text-[11px] text-slate-400">
                        {wardName} • Bed {bedNum}
                      </span>
                    </div>
                    <Badge status={adm.status || 'ACTIVE'} size="sm" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECENT APPOINTMENTS FLOW */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Live Appointments Flow
            </h3>
            <Link
              to="/admin/appointments"
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              All Appointments <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No recent appointments recorded.</p>
            ) : (
              recentAppointments.slice(0, 4).map((apt: any, idx: number) => {
                const patientName = apt?.patient?.user?.name || apt?.patient?.name || 'Patient';
                const docName = apt?.doctor?.user?.name || apt?.doctor?.name || 'Physician';

                return (
                  <div
                    key={apt.id || apt._id || idx}
                    className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-200"
                  >
                    <div>
                      <span className="font-bold text-white block">{patientName}</span>
                      <span className="text-[11px] text-slate-400">
                        Dr. {docName} • {apt.appointmentDate}
                      </span>
                    </div>
                    <Badge status={apt.status || 'CONFIRMED'} size="sm" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;