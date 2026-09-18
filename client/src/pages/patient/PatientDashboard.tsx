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
  ShieldCheck,
  Stethoscope,
  ClipboardCheck,
} from 'lucide-react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

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
        console.error(
          'Failed to load patient dashboard:',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <LoadingSpinner text="Loading your patient health overview..." />
    );
  }

  const {
    upcomingAppointments = [],
    activeAdmission,
    prescriptions = [],
    stats = {},
  } = data || {};

  // =========================================
  // SAFE ACTIVE ADMISSION DATA
  // =========================================

  const admissionWardName =
    activeAdmission?.bed?.ward?.name ||
    activeAdmission?.ward?.name ||
    'Ward not assigned';

  const admissionBedNumber =
    activeAdmission?.bed?.bedNumber ||
    'N/A';

  const attendingDoctorName =
    activeAdmission?.doctor?.user?.name ||
    activeAdmission?.doctor?.name ||
    'Doctor not assigned';

  return (
    <div className="space-y-6">

      {/* ================================= */}
      {/* WELCOME BANNER */}
      {/* ================================= */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-800 to-teal-800 p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10">

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-3">

              <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />

              Patient Health Portal

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">

              Welcome back, {user?.name || 'Patient'}

            </h1>

            <p className="mt-1 text-xs sm:text-sm text-brand-100 max-w-xl">

              Medical Record Number:{' '}

              <span className="font-mono font-bold">
                {user?.patient?.medicalRecordNumber ||
                  'MRN-Pending'}
              </span>

              {' | '}

              Blood Group:{' '}

              <span className="font-bold">
                {user?.patient?.bloodGroup ||
                  'Not specified'}
              </span>

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/patient/book"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
            >

              <Plus className="w-4 h-4 stroke-[3]" />

              Book New Appointment

            </Link>

            <Link
              to="/patient/bed-admission"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold backdrop-blur-md transition-all"
            >

              <BedDouble className="w-4 h-4" />

              Ward Beds

            </Link>

          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* METRIC CARDS */}
      {/* ================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Upcoming Appointments"
          value={stats?.upcomingCount || 0}
          subtitle="Scheduled doctor consultations"
          icon={Calendar}
          color="brand"
        />

        <StatCard
          title="Active Prescriptions"
          value={stats?.prescriptionsCount || 0}
          subtitle="Medications on record"
          icon={FileText}
          color="teal"
        />

        <StatCard
          title="Health Records (EHR)"
          value={stats?.recordsCount || 0}
          subtitle="Clinical reports & summaries"
          icon={ClipboardCheck}
          color="emerald"
        />

        <StatCard
          title="Inpatient Status"
          value={
            activeAdmission
              ? 'Admitted'
              : 'Outpatient'
          }
          subtitle={
            activeAdmission
              ? `${admissionWardName} Bed ${admissionBedNumber}`
              : 'No active hospital stay'
          }
          icon={BedDouble}
          color={
            activeAdmission
              ? 'purple'
              : 'amber'
          }
        />

      </div>

      {/* ================================= */}
      {/* ACTIVE ADMISSION */}
      {/* ================================= */}

      {activeAdmission && (

        <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">

          <div className="flex items-center gap-4">

            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-500/20">

              <BedDouble className="w-6 h-6" />

            </div>

            <div>

              <div className="flex items-center gap-2">

                <h3 className="text-sm font-bold text-slate-900">
                  Current Inpatient Admission
                </h3>

                <Badge
                  status={
                    activeAdmission?.status ||
                    'ACTIVE'
                  }
                  size="sm"
                />

              </div>

              <p className="text-xs text-slate-600 mt-1">

                Ward:{' '}

                <strong className="text-purple-900">
                  {admissionWardName}
                </strong>

                {' | '}

                Bed:{' '}

                <strong className="text-purple-900">
                  {admissionBedNumber}
                </strong>

                {' | '}

                Attending:{' '}

                <strong className="text-slate-800">
                  Dr. {attendingDoctorName}
                </strong>

              </p>

            </div>

          </div>

          <Link
            to="/patient/bed-admission"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
          >

            View Admission Details

          </Link>

        </div>

      )}

      {/* ================================= */}
      {/* MAIN GRID */}
      {/* ================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================================= */}
        {/* UPCOMING APPOINTMENTS */}
        {/* ================================= */}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Upcoming Appointments
              </h3>

              <p className="text-xs text-slate-500">
                Your scheduled doctor visits
              </p>

            </div>

            <Link
              to="/patient/appointments"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >

              View All

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

          <div className="mt-4 space-y-3">

            {upcomingAppointments.length === 0 ? (

              <EmptyState
                title="No upcoming visits"
                description="Book your next consultation with one of our specialized doctors."
                actionText="Book an Appointment"
                onAction={() =>
                (window.location.href =
                  '/patient/book')
                }
              />

            ) : (

              upcomingAppointments.map(
                (apt: any, index: number) => {

                  // =================================
                  // SAFE DOCTOR DATA
                  // =================================

                  const doctorName =
                    apt?.doctor?.user?.name ||
                    apt?.doctor?.name ||
                    'Unknown Doctor';

                  const doctorAvatar =
                    apt?.doctor?.user?.avatar ||
                    apt?.doctor?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      doctorName
                    )}&background=0284c7&color=fff`;

                  const specialization =
                    apt?.doctor?.specialization ||
                    'General Medicine';

                  const appointmentId =
                    apt?.id ||
                    apt?._id ||
                    index;

                  return (

                    <div
                      key={appointmentId}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                    >

                      <div className="flex items-center gap-3.5">

                        <img
                          src={doctorAvatar}
                          alt={doctorName}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                          onError={(event) => {
                            event.currentTarget.src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                doctorName
                              )}&background=0284c7&color=fff`;
                          }}
                        />

                        <div>

                          <h4 className="text-xs font-bold text-slate-900">

                            {doctorName}

                          </h4>

                          <p className="text-[11px] text-brand-600 font-medium">

                            {specialization}

                          </p>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">

                            <span className="flex items-center gap-1">

                              <Calendar className="w-3 h-3" />

                              {apt?.appointmentDate ||
                                'Date N/A'}

                            </span>

                            <span className="flex items-center gap-1">

                              <Clock className="w-3 h-3" />

                              {apt?.timeSlot ||
                                'Time N/A'}

                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">

                        <Badge
                          status={
                            apt?.status ||
                            'PENDING'
                          }
                          size="sm"
                        />

                        <span className="text-[10px] font-mono text-slate-400">

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

        {/* ================================= */}
        {/* RECENT PRESCRIPTIONS */}
        {/* ================================= */}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>

              <h3 className="text-sm font-bold text-slate-900">
                Recent Prescriptions (Rx)
              </h3>

              <p className="text-xs text-slate-500">
                Current prescribed medication regimens
              </p>

            </div>

            <Link
              to="/patient/prescriptions"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >

              View All

              <ArrowRight className="w-3.5 h-3.5" />

            </Link>

          </div>

          <div className="mt-4 space-y-3">

            {prescriptions.length === 0 ? (

              <EmptyState
                title="No active prescriptions"
                description="Your prescribed medications from doctors will appear here."
              />

            ) : (

              prescriptions.map(
                (p: any, index: number) => {

                  // =================================
                  // SAFE PRESCRIPTION DOCTOR
                  // =================================

                  const prescriptionDoctorName =
                    p?.doctor?.user?.name ||
                    p?.doctor?.name ||
                    'Unknown Doctor';

                  const departmentName =
                    p?.doctor?.department?.name ||
                    p?.department?.name ||
                    'General';

                  const prescriptionItems =
                    Array.isArray(p?.items)
                      ? p.items
                      : [];

                  return (

                    <div
                      key={
                        p?.id ||
                        p?._id ||
                        index
                      }
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >

                      <div className="flex items-start justify-between gap-2">

                        <div>

                          <div className="flex items-center gap-2">

                            <span className="text-xs font-bold text-slate-900">

                              {p?.diagnosis ||
                                'Diagnosis not specified'}

                            </span>

                            <span className="text-[10px] font-mono font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">

                              {p?.prescriptionNumber ||
                                'N/A'}

                            </span>

                          </div>

                          <p className="text-[11px] text-slate-500 mt-0.5">

                            Prescribed by Dr.{' '}

                            {prescriptionDoctorName}

                            {' ('}

                            {departmentName}

                            {')'}

                          </p>

                        </div>

                        <span className="text-[10px] text-slate-400">

                          {p?.createdAt
                            ? new Date(
                              p.createdAt
                            ).toLocaleDateString()
                            : 'Date N/A'}

                        </span>

                      </div>

                      {prescriptionItems.length > 0 && (

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">

                          {prescriptionItems.map(
                            (
                              item: any,
                              itemIndex: number
                            ) => (

                              <span
                                key={
                                  item?.id ||
                                  item?._id ||
                                  itemIndex
                                }
                                className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                              >

                                💊{' '}

                                {item?.medicineName ||
                                  'Medicine'}

                                {' ('}

                                {item?.dosage ||
                                  'N/A'}

                                {') - '}

                                {item?.frequency ||
                                  'N/A'}

                              </span>

                            )
                          )}

                        </div>

                      )}

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