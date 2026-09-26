import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  BedDouble,
  Heart,
  Plus,
  ArrowRight,
  ClipboardCheck,
  Activity,
  Pill,
  Sparkles,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Connecting to Patient Healing & Care Wing..." />;
  }

  const {
    upcomingAppointments = [],
    activeAdmission,
    prescriptions = [],
    stats = {},
  } = data || {};

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const nextDoctorName =
    nextAppointment?.doctor?.user?.name ||
    nextAppointment?.doctor?.name ||
    'Assigned Specialist';

  const nextSpecialization = nextAppointment?.doctor?.specialization || 'General Medicine';

  const admissionWardName =
    activeAdmission?.bed?.ward?.name || activeAdmission?.ward?.name || 'Ward Not Assigned';
  const admissionBedNumber = activeAdmission?.bed?.bedNumber || 'N/A';
  const attendingDoctorName =
    activeAdmission?.doctor?.user?.name || activeAdmission?.doctor?.name || 'Physician';

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-8rem)] text-white space-y-8 select-none py-2 max-w-6xl">
      {/* =========================================================================
          1. HEADER DIRECTLY ON BACKGROUND (NO BIG CARD)
         ========================================================================= */}
      <div className="space-y-1 drop-shadow-md">
        <div className="flex items-center gap-2 text-teal-300 font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>HIRO HOSPITAL • Healing & Care Wing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          Good Morning, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-white bg-clip-text text-transparent">
            {user?.name || 'Patient'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl drop-shadow">
          Your Health Journey • MRN: {user?.patient?.medicalRecordNumber || 'MRN-Active'} • Blood Group: {user?.patient?.bloodGroup || 'O+'}
        </p>
      </div>

      {/* =========================================================================
          2. NEXT APPOINTMENT (DIRECT ON BACKGROUND WITH THIN ACCENTS)
         ========================================================================= */}
      {nextAppointment ? (
        <div className="py-4 border-y border-white/15 space-y-2 max-w-2xl drop-shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-widest">
              Next Consultation
            </span>
            <Badge status={nextAppointment.status || 'CONFIRMED'} size="sm" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow">
                Dr. {nextDoctorName}
              </h2>
              <p className="text-xs text-teal-200/90 font-medium">
                {nextSpecialization}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                {nextAppointment.appointmentDate || 'Today'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                {nextAppointment.timeSlot || 'Scheduled'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-white transition-colors"
            >
              View Full Appointment Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-3 border-y border-white/10 flex items-center justify-between max-w-xl text-xs text-slate-300 drop-shadow">
          <span className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-teal-400" />
            No consultations scheduled today.
          </span>
          <Link
            to="/patient/book"
            className="font-bold text-teal-300 hover:underline flex items-center gap-1"
          >
            Book Appointment <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* =========================================================================
          3. MY HEALTH DIRECT STATISTICS (TEXT DIRECTLY ON BACKGROUND, NO CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl py-2 drop-shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Appointments
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.upcomingCount || upcomingAppointments.length || 0}
          </span>
          <span className="text-[10px] text-teal-300 block font-medium">Scheduled</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Prescriptions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.prescriptionsCount || prescriptions.length || 0}
          </span>
          <span className="text-[10px] text-teal-300 block font-medium">Active Regimens</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Health Records
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.recordsCount || 0}
          </span>
          <span className="text-[10px] text-teal-300 block font-medium">Clinical Reports</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Hospital Status
          </span>
          <span className="text-lg sm:text-xl font-bold text-white truncate block">
            {activeAdmission ? 'Inpatient' : 'Outpatient'}
          </span>
          <span className="text-[10px] text-teal-300 block font-medium truncate">
            {activeAdmission ? `${admissionWardName} • Bed ${admissionBedNumber}` : 'Care Active'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          4. QUICK ACTION PILLS DIRECTLY ON BACKGROUND
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          to="/patient/book"
          className="px-4 py-2.5 rounded-full bg-teal-500/25 hover:bg-teal-500/40 text-white font-bold text-xs border border-teal-400/40 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          Book Appointment
        </Link>

        <Link
          to="/patient/prescriptions"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <Pill className="w-3.5 h-3.5 text-teal-300" />
          View Prescriptions
        </Link>

        <Link
          to="/patient/medical-records"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-teal-300" />
          Lab Results & EHR
        </Link>

        <Link
          to="/patient/bed-admission"
          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2"
        >
          <BedDouble className="w-3.5 h-3.5 text-teal-300" />
          Ward Bed Matrix
        </Link>
      </div>

      {/* =========================================================================
          5. MINIMAL RECENT ACTIVITY DIRECT ON BACKGROUND (NO BIG CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* UPCOMING APPOINTMENTS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Upcoming Schedule
            </h3>
            <Link
              to="/patient/appointments"
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              All Appointments <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No upcoming consultations.</p>
            ) : (
              upcomingAppointments.slice(0, 3).map((apt: any, idx: number) => {
                const docName = apt?.doctor?.user?.name || apt?.doctor?.name || 'Physician';
                return (
                  <div
                    key={apt.id || apt._id || idx}
                    className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-200"
                  >
                    <div>
                      <span className="font-bold text-white block">Dr. {docName}</span>
                      <span className="text-[11px] text-teal-300/90">
                        {apt?.doctor?.specialization || 'General Medicine'} • {apt.appointmentDate} at {apt.timeSlot}
                      </span>
                    </div>
                    <Badge status={apt.status || 'CONFIRMED'} size="sm" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECENT PRESCRIPTIONS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Active Prescriptions (Rx)
            </h3>
            <Link
              to="/patient/prescriptions"
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              All Prescriptions <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No active prescription records.</p>
            ) : (
              prescriptions.slice(0, 3).map((rx: any, idx: number) => {
                const docName = rx?.doctor?.user?.name || rx?.doctor?.name || 'Doctor';
                return (
                  <div
                    key={rx.id || rx._id || idx}
                    className="flex items-center justify-between py-2 border-b border-white/5 text-xs text-slate-200"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {rx.diagnosis || 'Medication Plan'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Prescribed by Dr. {docName} • {rx.items?.length || 1} Medications
                      </span>
                    </div>
                    <Link
                      to="/patient/prescriptions"
                      className="text-[11px] font-bold text-teal-300 hover:underline"
                    >
                      View Rx
                    </Link>
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

export default PatientDashboard;