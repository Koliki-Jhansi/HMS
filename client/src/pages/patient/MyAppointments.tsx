import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  XCircle,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
} from 'lucide-react';
import api from '../../services/api';
import { Appointment, AppointmentStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel modal
  const [selectedCancelApt, setSelectedCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/appointments' : `/appointments?status=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCancelApt) return;

    try {
      setCancelling(true);
      setError(null);
      const res = await api.patch(`/appointments/${selectedCancelApt.id}/status`, {
        status: 'CANCELLED',
        cancellationReason: cancelReason || 'Cancelled by patient',
      });
      if (res.data.success) {
        setSelectedCancelApt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const getStepStatus = (currentStatus: AppointmentStatus) => {
    const steps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    const idx = steps.indexOf(currentStatus);
    return { steps, activeIndex: idx };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track appointment progress, doctor responses, and clinical consultation status.
          </p>
        </div>

        <Link
          to="/patient/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner text="Fetching your appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="You don't have any appointments in this status filter."
          actionText="Book New Consultation"
          onAction={() => (window.location.href = '/patient/book')}
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const { steps, activeIndex } = getStepStatus(apt.status);
            const isTerminal = apt.status === 'CANCELLED' || apt.status === 'REJECTED';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-4"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        apt.doctor.user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          apt.doctor.user.name
                        )}&background=0284c7&color=fff`
                      }
                      alt={apt.doctor.user.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{apt.doctor.user.name}</h3>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {apt.appointmentNumber}
                        </span>
                      </div>
                      <p className="text-xs text-brand-600 font-semibold">{apt.doctor.specialization}</p>
                      <p className="text-[11px] text-slate-400">
                        {apt.doctor.department?.name || 'Department'} • {apt.doctor.roomNumber || 'Room 101'}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <Badge status={apt.status} size="md" />
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {apt.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason & Symptoms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-700 block">Reason for Visit:</span>
                    <p className="text-slate-600 mt-0.5">{apt.reason}</p>
                  </div>
                  {apt.symptoms && (
                    <div>
                      <span className="font-bold text-slate-700 block">Reported Symptoms:</span>
                      <p className="text-slate-600 mt-0.5">{apt.symptoms}</p>
                    </div>
                  )}
                  {apt.rejectionReason && (
                    <div className="md:col-span-2 text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <strong>Doctor's Rejection Note:</strong> {apt.rejectionReason}
                    </div>
                  )}
                  {apt.cancellationReason && (
                    <div className="md:col-span-2 text-slate-600 bg-slate-100 p-2.5 rounded-lg">
                      <strong>Cancellation Note:</strong> {apt.cancellationReason}
                    </div>
                  )}
                </div>

                {/* Status Progress Stepper (if not cancelled/rejected) */}
                {!isTerminal && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Live Consultation Progress
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {steps.map((step, idx) => {
                        const isDone = activeIndex >= idx;
                        const isCurrent = activeIndex === idx;

                        return (
                          <div key={step} className="flex flex-col items-center text-center">
                            <div
                              className={`w-full h-2 rounded-full mb-2 transition-all ${
                                isDone
                                  ? 'bg-gradient-to-r from-brand-500 to-teal-500'
                                  : 'bg-slate-200'
                              } ${isCurrent ? 'ring-2 ring-brand-500/30 ring-offset-1' : ''}`}
                            />
                            <span
                              className={`text-[10px] font-bold uppercase ${
                                isCurrent
                                  ? 'text-brand-700'
                                  : isDone
                                  ? 'text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Created: {new Date(apt.createdAt).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {apt.prescription && (
                      <Link
                        to="/patient/prescriptions"
                        className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Prescription
                      </Link>
                    )}

                    {(apt.status === 'PENDING' || apt.status === 'ACCEPTED') && (
                      <button
                        onClick={() => setSelectedCancelApt(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {selectedCancelApt && (
        <Modal
          isOpen={!!selectedCancelApt}
          onClose={() => setSelectedCancelApt(null)}
          title="Cancel Appointment"
          subtitle={`Appointment #${selectedCancelApt.appointmentNumber} with Dr. ${selectedCancelApt.doctor.user.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your scheduled appointment on{' '}
              <strong>{selectedCancelApt.appointmentDate}</strong> at{' '}
              <strong>{selectedCancelApt.timeSlot}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Conflict in schedule, feeling better, rescheduling..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCancelApt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Keep Appointment
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-70"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
