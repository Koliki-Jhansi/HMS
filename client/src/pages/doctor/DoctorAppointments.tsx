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
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Appointment Consultation Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Review, accept, launch digital consultations, and document clinical outcomes.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, token, reason..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <LoadingSpinner text="Retrieving patient appointment slots..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No appointments matching your criteria"
          description="When patients book consultations in your clinical wing, they will appear here in real time."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-cyan-400/40 transition-all space-y-4 text-white"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      apt.patient.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        apt.patient.user.name
                      )}&background=0284c7&color=fff&bold=true`
                    }
                    alt={apt.patient.user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{apt.patient.user.name}</h3>
                      <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-md">
                        {apt.appointmentNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      MRN: {apt.patient.medicalRecordNumber} • Blood Group: {apt.patient.bloodGroup || 'Not set'} • Gender: {apt.patient.gender}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <Badge status={apt.status} size="md" />
                  <div className="text-xs font-mono text-cyan-300 flex items-center gap-2 font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {apt.appointmentDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {apt.timeSlot}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-2xl border border-white/10">
                <div>
                  <span className="font-bold text-cyan-300 block">Reason for Consultation:</span>
                  <p className="text-slate-200 mt-0.5">{apt.reason}</p>
                </div>
                {apt.symptoms && (
                  <div>
                    <span className="font-bold text-cyan-300 block">Reported Symptoms:</span>
                    <p className="text-slate-200 mt-0.5">{apt.symptoms}</p>
                  </div>
                )}
                {apt.rejectionReason && (
                  <div className="sm:col-span-2 text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                    <strong>Rejection Reason:</strong> {apt.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <span className="text-[11px] text-slate-400">
                  Phone: {apt.patient?.user?.phone || 'N/A'} • Emergency Contact: {apt.patient?.emergencyContactName || (apt.patient as any)?.emergencyContact || 'N/A'}
                </span>

                <div className="flex items-center gap-2">
                  {apt.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'ACCEPTED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept Slot
                      </button>
                      <button
                        onClick={() => setRejectApt(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-400/30 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {(apt.status === 'ACCEPTED' || apt.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 hover:scale-105 transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Launch Consultation Room
                    </button>
                  )}

                  {apt.status === 'COMPLETED' && (
                    <button
                      onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-cyan-300" />
                      View Completed EHR & Rx
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectApt && (
        <Modal
          isOpen={!!rejectApt}
          onClose={() => setRejectApt(null)}
          title="Decline Appointment Request"
          subtitle={`Rejecting slot for ${rejectApt.patient.user.name} on ${rejectApt.appointmentDate}`}
          maxWidth="md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule conflict, emergency surgery, refer to another specialist..."
                className="w-full p-3 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectApt(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md disabled:opacity-70"
              >
                {rejecting ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DoctorAppointments;
