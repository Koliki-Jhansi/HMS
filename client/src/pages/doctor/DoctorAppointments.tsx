import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Stethoscope,
  Search,
  Filter,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { Appointment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const DoctorAppointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject modal
  const [rejectApt, setRejectApt] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === 'ALL'
          ? '/appointments'
          : `/appointments?status=${statusFilter}`;
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectApt) return;

    try {
      setRejecting(true);
      setError(null);
      await api.patch(`/appointments/${rejectApt.id}/status`, {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Doctor unavailable at the requested time slot',
      });
      setRejectApt(null);
      setRejectionReason('');
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject appointment.');
    } finally {
      setRejecting(false);
    }
  };

  const filtered = appointments.filter(
    (apt) =>
      apt.patient?.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Appointment Consultation Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review consultation requests, manage appointment lifecycles, and launch live consultation notes.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, MRN, appointment #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Queue List */}
      {loading ? (
        <LoadingSpinner text="Fetching doctor appointments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No appointments in queue"
          description="There are no appointments matching the selected status filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      apt.patient.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        apt.patient.user.name
                      )}&background=0f766e&color=fff&bold=true`
                    }
                    alt={apt.patient.user.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/20"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{apt.patient.user.name}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                        {apt.appointmentNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      MRN: <span className="font-mono font-bold text-slate-700">{apt.patient.medicalRecordNumber}</span> • Gender: {apt.patient.gender || 'N/A'} • Blood: {apt.patient.bloodGroup || 'N/A'}
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

              {/* Consultation details */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block">
                    Chief Complaint / Reason
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">{apt.reason}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block">
                    Reported Symptoms & Notes
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">{apt.symptoms || 'None specified'}</p>
                </div>
                {apt.rejectionReason && (
                  <div className="md:col-span-2 text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <strong>Rejection Reason:</strong> {apt.rejectionReason}
                  </div>
                )}
                {apt.cancellationReason && (
                  <div className="md:col-span-2 text-slate-600 bg-slate-100 p-2.5 rounded-lg">
                    <strong>Patient Cancellation:</strong> {apt.cancellationReason}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 text-[11px]">
                  Phone: {apt.patient.user.phone || 'N/A'} | Email: {apt.patient.user.email}
                </span>

                <div className="flex items-center gap-2">
                  {apt.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setRejectApt(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Request
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'ACCEPTED')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept Appointment
                      </button>
                    </>
                  )}

                  {apt.status === 'ACCEPTED' && (
                    <button
                      onClick={() => navigate(`/doctor/consultation?aptId=${apt.id}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Start Consultation Room
                    </button>
                  )}

                  {apt.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => navigate(`/doctor/consultation?aptId=${apt.id}`)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all animate-pulse"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Resume & Prescribe Rx
                    </button>
                  )}

                  {apt.status === 'COMPLETED' && (
                    <button
                      onClick={() => navigate(`/doctor/consultation?aptId=${apt.id}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Consultation Summary
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectApt && (
        <Modal
          isOpen={!!rejectApt}
          onClose={() => setRejectApt(null)}
          title="Decline Appointment Request"
          subtitle={`Patient: ${rejectApt.patient.user.name} • ${rejectApt.appointmentDate}`}
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}
            <p className="text-slate-600">
              Provide a brief explanation for declining this appointment request. The patient will be notified automatically.
            </p>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule emergency conflict, please select an afternoon slot tomorrow..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectApt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs disabled:opacity-70"
              >
                {rejecting ? 'Declining...' : 'Decline Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
