import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  BedDouble,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ================================
  // FETCH DOCTOR DASHBOARD
  // ================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await api.get('/stats/dashboard');

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // UPDATE APPOINTMENT STATUS
  // ================================

  const handleQuickStatus = async (
    appointmentId: string,
    status: string
  ) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, {
        status,
      });

      // Reload dashboard after status change
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  // ================================
  // LOADING
  // ================================

  if (loading) {
    return (
      <LoadingSpinner text="Loading your clinical schedule..." />
    );
  }

  // ================================
  // DASHBOARD DATA
  // ================================

  const {
    stats = {},
    todaySchedule = [],
    pendingAppointments = [],
  } = data || {};

  return (
    <div className="space-y-6">

      {/* ===================================== */}
      {/* WELCOME BANNER */}
      {/* ===================================== */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 via-brand-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/30 text-brand-200 text-xs font-semibold backdrop-blur-md mb-3 border border-brand-400/30">

              <Stethoscope className="w-3.5 h-3.5" />

              Clinical Consultation Portal

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">

              Welcome, {user?.name || 'Doctor'}

            </h1>

            <p className="mt-1 text-xs sm:text-sm text-brand-200">

              {user?.doctor?.specialization ||
                'Medical Professional'}

              {' • '}

              {user?.doctor?.roomNumber ||
                'Main Consultation Suite'}

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
            >

              <Calendar className="w-4 h-4" />

              Manage All Appointments
              {' '}
              ({pendingAppointments.length} Pending)

            </Link>

          </div>

        </div>

      </div>

      {/* ===================================== */}
      {/* STATISTICS */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments || 0}
          subtitle="Scheduled consultation slots"
          icon={Calendar}
          color="brand"
        />

        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests || 0}
          subtitle="Awaiting doctor confirmation"
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Consultations Completed"
          value={stats.completedTotal || 0}
          subtitle="Total lifetime consultations"
          icon={CheckCircle}
          color="emerald"
        />

        <StatCard
          title="Active Inpatients"
          value={stats.activeAdmittedPatients || 0}
          subtitle="Under your medical care"
          icon={BedDouble}
          color="purple"
        />

      </div>

      {/* ===================================== */}
      {/* MAIN GRID */}
      {/* ===================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================================= */}
        {/* TODAY'S SCHEDULE */}
        {/* ================================= */}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Today's Consultation Schedule
              </h3>

              <p className="text-xs text-slate-500">
                Live patient appointments for today
              </p>

            </div>

            <Link
              to="/doctor/appointments"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >

              View Full Queue

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

          <div className="mt-4 space-y-3">

            {todaySchedule.length === 0 ? (

              <EmptyState
                title="No appointments scheduled for today"
                description="Your upcoming patient appointments will appear here."
              />

            ) : (

              todaySchedule.map((apt: any) => {

                // ==================================
                // SAFE PATIENT DATA
                // Prevents:
                // Cannot read properties of undefined
                // ==================================

                const patientName =
                  apt?.patient?.user?.name ||
                  apt?.patient?.name ||
                  'Unknown Patient';

                const patientAvatar =
                  apt?.patient?.user?.avatar ||
                  apt?.patient?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    patientName
                  )}&background=0f766e&color=fff`;

                const appointmentId =
                  apt?.id || apt?._id;

                return (

                  <div
                    key={
                      appointmentId ||
                      `${patientName}-${apt?.timeSlot}`
                    }
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >

                    <div className="flex items-center gap-3">

                      <img
                        src={patientAvatar}
                        alt={patientName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        onError={(event) => {
                          event.currentTarget.src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              patientName
                            )}&background=0f766e&color=fff`;
                        }}
                      />

                      <div>

                        <h4 className="text-xs font-bold text-slate-900">

                          {patientName}

                        </h4>

                        <p className="text-[11px] text-slate-500">

                          {apt?.reason ||
                            'No reason provided'}

                        </p>

                        <span className="text-[10px] font-mono text-brand-700 font-semibold flex items-center gap-1 mt-0.5">

                          <Clock className="w-3 h-3" />

                          {apt?.timeSlot ||
                            'Time not available'}

                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">

                      <Badge
                        status={apt?.status || 'PENDING'}
                        size="sm"
                      />

                      {apt?.status === 'ACCEPTED' &&
                        appointmentId && (

                          <button
                            onClick={() =>
                              navigate(
                                `/doctor/consultation?aptId=${appointmentId}`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                          >

                            <PlayCircle className="w-3.5 h-3.5" />

                            Start Consult

                          </button>

                        )}

                      {apt?.status === 'IN_PROGRESS' &&
                        appointmentId && (

                          <button
                            onClick={() =>
                              navigate(
                                `/doctor/consultation?aptId=${appointmentId}`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors animate-pulse"
                          >

                            <Stethoscope className="w-3.5 h-3.5" />

                            Resume & Prescribe

                          </button>

                        )}

                    </div>

                  </div>

                );
              })

            )}

          </div>

        </div>

        {/* ================================= */}
        {/* PENDING APPOINTMENTS */}
        {/* ================================= */}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Pending Appointment Requests
              </h3>

              <p className="text-xs text-slate-500">
                Approve or reject booking inquiries
              </p>

            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">

              {pendingAppointments.length} pending

            </span>

          </div>

          <div className="mt-4 space-y-3">

            {pendingAppointments.length === 0 ? (

              <EmptyState
                title="No pending requests"
                description="You are all caught up! New patient appointment bookings will appear here."
              />

            ) : (

              pendingAppointments.map((apt: any) => {

                // ==================================
                // SAFE PATIENT DATA
                // ==================================

                const patientName =
                  apt?.patient?.user?.name ||
                  apt?.patient?.name ||
                  'Unknown Patient';

                const appointmentId =
                  apt?.id || apt?._id;

                return (

                  <div
                    key={
                      appointmentId ||
                      `${patientName}-${apt?.appointmentDate}-${apt?.timeSlot}`
                    }
                    className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
                  >

                    <div className="flex items-start justify-between gap-2">

                      <div>

                        <h4 className="text-xs font-bold text-slate-900">

                          {patientName}

                        </h4>

                        <p className="text-xs text-slate-600 mt-0.5">

                          Reason:{' '}

                          {apt?.reason ||
                            'No reason provided'}

                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">

                          <span className="flex items-center gap-1">

                            <Calendar className="w-3 h-3 text-slate-400" />

                            {apt?.appointmentDate ||
                              'Date not available'}

                          </span>

                          <span className="flex items-center gap-1">

                            <Clock className="w-3 h-3 text-slate-400" />

                            {apt?.timeSlot ||
                              'Time not available'}

                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-end gap-2">

                      <button
                        disabled={!appointmentId}
                        onClick={() => {
                          if (appointmentId) {
                            handleQuickStatus(
                              appointmentId,
                              'REJECTED'
                            );
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >

                        <XCircle className="w-3.5 h-3.5" />

                        Decline

                      </button>

                      <button
                        disabled={!appointmentId}
                        onClick={() => {
                          if (appointmentId) {
                            handleQuickStatus(
                              appointmentId,
                              'ACCEPTED'
                            );
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >

                        <CheckCircle className="w-3.5 h-3.5" />

                        Accept Booking

                      </button>

                    </div>

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