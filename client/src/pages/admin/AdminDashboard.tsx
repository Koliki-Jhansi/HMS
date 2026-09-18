import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  BedDouble,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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
    return (
      <LoadingSpinner text="Loading hospital command center metrics..." />
    );
  }

  const {
    overview = {},
    wardStats = [],
    recentAppointments = [],
    recentAdmissions = [],
  } = data || {};

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold backdrop-blur-md mb-3 border border-purple-400/30">

              <ShieldCheck className="w-3.5 h-3.5" />

              Hospital Administration Command Center

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Operations Overview
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-purple-200">
              Live capacity monitoring, inpatient admissions,
              physician roster, and appointment workflows.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/admin/admissions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
            >

              <UserCheck className="w-4 h-4" />

              New Patient Admission

            </Link>

            <Link
              to="/admin/beds"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold backdrop-blur-md transition-all"
            >

              <BedDouble className="w-4 h-4" />

              Bed Matrix

            </Link>

          </div>

        </div>

      </div>

      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Active Bed Occupancy"
          value={`${overview?.bedOccupancyRate || 0}%`}
          subtitle={`${overview?.occupiedBeds || 0} of ${overview?.totalBeds || 0
            } Beds Occupied`}
          icon={BedDouble}
          color="purple"
        />

        <StatCard
          title="Active Inpatients"
          value={overview?.activeAdmissions || 0}
          subtitle="Currently admitted in wards"
          icon={UserCheck}
          color="brand"
        />

        <StatCard
          title="Registered Patients"
          value={overview?.totalPatients || 0}
          subtitle="Total electronic health records"
          icon={Users}
          color="teal"
        />

        <StatCard
          title="Physicians & Staff"
          value={overview?.totalDoctors || 0}
          subtitle={`Across ${overview?.totalDepartments || 0
            } Clinical Departments`}
          icon={Stethoscope}
          color="emerald"
        />

      </div>

      {/* ================= WARD OCCUPANCY ================= */}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">

          <div>

            <h3 className="text-sm font-bold text-slate-900">
              Ward Occupancy & Capacity Status
            </h3>

            <p className="text-xs text-slate-500">
              Live bed distribution across specialized hospital units
            </p>

          </div>

          <Link
            to="/admin/beds"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >

            Manage Bed Matrix

            <ArrowRight className="w-3.5 h-3.5" />

          </Link>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {wardStats.map((ward: any, index: number) => {

            const totalBeds = Number(ward?.totalBeds || 0);
            const occupiedBeds = Number(ward?.occupied || 0);

            const occupancy =
              totalBeds > 0
                ? Math.round(
                  (occupiedBeds / totalBeds) * 100
                )
                : 0;

            return (

              <div
                key={ward?.id || ward?._id || index}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">

                      Floor {ward?.floor || 'N/A'} •{' '}
                      {ward?.code || 'N/A'}

                    </span>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">

                      {ward?.name || 'Unknown Ward'}

                    </h4>

                  </div>

                  <span className="text-xs font-extrabold text-slate-800 font-mono">

                    {occupancy}% Occupied

                  </span>

                </div>

                {/* Progress Bar */}

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full transition-all ${occupancy > 80
                        ? 'bg-rose-500'
                        : occupancy > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    style={{
                      width: `${Math.min(
                        occupancy,
                        100
                      )}%`,
                    }}
                  />

                </div>

                <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">

                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">

                    <span>{ward?.available || 0}</span>

                    <p className="text-[9px] font-medium text-emerald-600">
                      Avail
                    </p>

                  </div>

                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-100">

                    <span>{ward?.occupied || 0}</span>

                    <p className="text-[9px] font-medium text-rose-600">
                      Occupied
                    </p>

                  </div>

                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-100">

                    <span>{ward?.reserved || 0}</span>

                    <p className="text-[9px] font-medium text-amber-600">
                      Rsrvd
                    </p>

                  </div>

                  <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold border border-cyan-100">

                    <span>{ward?.cleaning || 0}</span>

                    <p className="text-[9px] font-medium text-cyan-600">
                      Clean
                    </p>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      </div>

      {/* ================= RECENT DATA ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================= RECENT ADMISSIONS ================= */}

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Recent Inpatient Admissions
              </h3>

              <p className="text-xs text-slate-500">
                Latest patients admitted to hospital wards
              </p>

            </div>

            <Link
              to="/admin/admissions"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >

              All Admissions

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

          <div className="space-y-3">

            {recentAdmissions.length === 0 ? (

              <p className="text-xs text-slate-500 text-center py-5">
                No recent admissions available.
              </p>

            ) : (

              recentAdmissions.map(
                (adm: any, index: number) => {

                  // SAFE PATIENT NAME

                  const patientName =
                    adm?.patient?.user?.name ||
                    adm?.patient?.name ||
                    'Unknown Patient';

                  // SAFE DOCTOR NAME

                  const doctorName =
                    adm?.doctor?.user?.name ||
                    adm?.doctor?.name ||
                    'Unknown Doctor';

                  // SAFE WARD NAME

                  const wardName =
                    adm?.bed?.ward?.name ||
                    adm?.ward?.name ||
                    'Ward not assigned';

                  // SAFE BED NUMBER

                  const bedNumber =
                    adm?.bed?.bedNumber ||
                    'N/A';

                  return (

                    <div
                      key={
                        adm?.id ||
                        adm?._id ||
                        index
                      }
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >

                      <div>

                        <div className="flex items-center gap-2">

                          <span className="font-bold text-slate-900">

                            {patientName}

                          </span>

                          <span className="font-mono text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded border border-brand-100">

                            {adm?.admissionNumber ||
                              'N/A'}

                          </span>

                        </div>

                        <p className="text-slate-500 mt-0.5">

                          {wardName}

                          {' • '}

                          Bed #{bedNumber}

                          {' • '}

                          Dr. {doctorName}

                        </p>

                      </div>

                      <div className="text-right">

                        <Badge
                          status={
                            adm?.status ||
                            'UNKNOWN'
                          }
                          size="sm"
                        />

                        <span className="text-[10px] text-slate-400 block mt-1">

                          {adm?.admissionDate
                            ? new Date(
                              adm.admissionDate
                            ).toLocaleDateString()
                            : 'Date N/A'}

                        </span>

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        </div>

        {/* ================= RECENT APPOINTMENTS ================= */}

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Recent Appointments
              </h3>

              <p className="text-xs text-slate-500">
                Live consultation queue status across OPD
              </p>

            </div>

            <Link
              to="/admin/appointments"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >

              All Appointments

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

          <div className="space-y-3">

            {recentAppointments.length === 0 ? (

              <p className="text-xs text-slate-500 text-center py-5">
                No recent appointments available.
              </p>

            ) : (

              recentAppointments.map(
                (apt: any, index: number) => {

                  // SAFE PATIENT

                  const patientName =
                    apt?.patient?.user?.name ||
                    apt?.patient?.name ||
                    'Unknown Patient';

                  // SAFE DOCTOR

                  const doctorName =
                    apt?.doctor?.user?.name ||
                    apt?.doctor?.name ||
                    'Unknown Doctor';

                  // SAFE DEPARTMENT

                  const departmentName =
                    apt?.doctor?.department?.name ||
                    apt?.department?.name ||
                    'OPD';

                  return (

                    <div
                      key={
                        apt?.id ||
                        apt?._id ||
                        index
                      }
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >

                      <div>

                        <div className="flex items-center gap-2">

                          <span className="font-bold text-slate-900">

                            {patientName}

                          </span>

                          <span className="text-slate-400 font-normal">
                            →
                          </span>

                          <span className="text-brand-700 font-bold">

                            {doctorName}

                          </span>

                        </div>

                        <p className="text-slate-500 mt-0.5">

                          {apt?.appointmentDate ||
                            'Date N/A'}

                          {' at '}

                          {apt?.timeSlot ||
                            'Time N/A'}

                          {' • '}

                          {departmentName}

                        </p>

                      </div>

                      <div className="text-right">

                        <Badge
                          status={
                            apt?.status ||
                            'UNKNOWN'
                          }
                          size="sm"
                        />

                        <span className="text-[10px] font-mono text-slate-400 block mt-1">

                          {apt?.appointmentNumber ||
                            'N/A'}

                        </span>

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        </div>

      </div>

    </div>
  );
};