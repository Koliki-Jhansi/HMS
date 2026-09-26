import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  BedDouble,
  ArrowRight,
  Stethoscope,
  Users,
  FileText,
  Activity,
  ClipboardList,
  Pill,
  ChevronRight,
} from 'lucide-react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleQuickStatus = async (appointmentId: string, status: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status });
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to Clinical Command Wing..." />;
  }

  const {
    stats = {},
    todaySchedule = [],
    pendingAppointments = [],
  } = data || {};

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-8rem)] text-white space-y-8 select-none py-2 max-w-6xl">
      {/* =========================================================================
          1. CLINICAL HEADER DIRECTLY ON BACKGROUND (NO BIG CARD)
         ========================================================================= */}
      <div className="space-y-1 drop-shadow-md">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs tracking-wider uppercase">
          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
          <span>HIRO HOSPITAL • Clinical Wing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          Welcome, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
            Dr. {user?.name || 'Physician'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl drop-shadow">
          {user?.doctor?.specialization || 'Clinical Specialist'} • Suite: {user?.doctor?.roomNumber || 'Room 102'} • Duty Status: Active
        </p>
      </div>

      {/* =========================================================================
          2. CLINICAL COUNTERS (DIRECT ON BACKGROUND, NO CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl py-2 drop-shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today's Patients
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.todayAppointments || todaySchedule.length || 0}
          </span>
          <span className="text-[10px] text-cyan-300 block font-medium">Scheduled Slots</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Pending Requests
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.pendingRequests || pendingAppointments.length || 0}
          </span>
          <span className="text-[10px] text-cyan-300 block font-medium">Awaiting Confirmation</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Consultations
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.completedTotal || 0}
          </span>
          <span className="text-[10px] text-cyan-300 block font-medium">Completed Total</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Inpatients
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.activeAdmittedPatients || 0}
          </span>
          <span className="text-[10px] text-cyan-300 block font-medium">Under Medical Care</span>
        </div>
      </div>

      {/* =========================================================================
          3. CLINICAL ACTION PILLS DIRECTLY ON BACKGROUND
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          to="/doctor/patients"
          className="px-4 py-2.5 rounded-full bg-cyan-500/25 hover:bg-cyan-500/40 text-white font-bold text-xs border border-cyan-400/40 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 shadow-sm"
        >
          <Users className="w-3.5 h-3.5" />
          View Assigned Patients
        </Link>

        <Link
          to="/doctor/schedule"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-300" />
          Open Schedule
        </Link>

        <Link
          to="/doctor/appointments"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <ClipboardList className="w-3.5 h-3.5 text-cyan-300" />
          Medical Records
        </Link>

        <Link
          to="/doctor/appointments"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Pill className="w-3.5 h-3.5 text-cyan-300" />
          Write Prescription
        </Link>
      </div>

      {/* =========================================================================
          4. TODAY'S SCHEDULE (TIMED APPOINTMENTS LIST DIRECTLY ON SCENE)
         ========================================================================= */}
      <div className="space-y-4 pt-4 max-w-4xl">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-cyan-300">
              Today's Schedule & Queue
            </h2>
          </div>
          <Link
            to="/doctor/appointments"
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
          >
            All Appointments <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {todaySchedule.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No consultations scheduled for today.</p>
          ) : (
            todaySchedule.map((apt: any, idx: number) => {
              const patientName = apt?.patient?.user?.name || apt?.patient?.name || 'Patient';
              return (
                <div
                  key={apt.id || apt._id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/10 gap-3 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-400/30">
                      {apt.timeSlot || '09:00 AM'}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm block">{patientName}</span>
                      <span className="text-[11px] text-slate-300">
                        {apt.reason || 'General Consultation'} • #{apt.appointmentNumber || 'APT'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge status={apt.status || 'SCHEDULED'} size="sm" />
                    {apt.status === 'CONFIRMED' || apt.status === 'PENDING' ? (
                      <button
                        onClick={() => navigate(`/doctor/consultation/${apt.id || apt._id}`)}
                        className="px-3.5 py-1.5 rounded-full bg-cyan-500/30 hover:bg-cyan-500/50 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Start Consultation
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          5. PENDING REQUESTS REQUIRING CONFIRMATION
         ========================================================================= */}
      {pendingAppointments.length > 0 && (
        <div className="space-y-3 pt-2 max-w-4xl">
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Pending Patient Requests ({pendingAppointments.length})
            </h3>
            <Link
              to="/doctor/appointments"
              className="text-xs text-amber-300/80 hover:text-amber-200"
            >
              Review All
            </Link>
          </div>

          <div className="space-y-2">
            {pendingAppointments.slice(0, 3).map((apt: any, idx: number) => {
              const pName = apt?.patient?.user?.name || apt?.patient?.name || 'Patient';
              return (
                <div
                  key={apt.id || apt._id || idx}
                  className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-200"
                >
                  <div>
                    <span className="font-bold text-white block">{pName}</span>
                    <span className="text-[11px] text-slate-400">
                      {apt.appointmentDate} at {apt.timeSlot} • {apt.reason || 'Consultation request'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickStatus(apt.id || apt._id, 'CONFIRMED')}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleQuickStatus(apt.id || apt._id, 'CANCELLED')}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;