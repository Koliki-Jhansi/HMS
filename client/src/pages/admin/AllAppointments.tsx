import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { Appointment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { HospitalHeader3D } from '../../components/3d/HospitalHeader3D';

export const AllAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Change Modal
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('COMPLETED');
  const [statusNotes, setStatusNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.patch(`/appointments/${selectedApt.id}/status`, {
        status: targetStatus,
        notes: statusNotes || undefined,
      });

      if (res.data.success) {
        setSelectedApt(null);
        setStatusNotes('');
        fetchAppointments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = appointments.filter((apt) => {
    const q = searchQuery.toLowerCase();
    return (
      apt.patient?.user?.name.toLowerCase().includes(q) ||
      apt.doctor?.user?.name.toLowerCase().includes(q) ||
      apt.appointmentNumber.toLowerCase().includes(q) ||
      apt.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* 3D Hospital Reception Header */}
      <HospitalHeader3D
        type="lobby"
        badge="Hospital Reception & Appointments"
        title="Master Appointments Ledger"
        subtitle="Monitor all scheduled consultations, patient queues, doctor allocations, and appointment completion rates."
      />

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient, doctor, token..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Ledger Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving appointment ledger..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="No appointments match your current search and filter settings."
        />
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-slate-950/70 border-b border-white/10 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Token & Reason</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor & Unit</th>
                  <th className="py-3.5 px-4">Scheduled Slot</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/20">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-300 block">{apt.appointmentNumber}</span>
                      <span className="text-[11px] text-slate-300 line-clamp-1">{apt.reason}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-white block">{apt.patient?.user?.name}</strong>
                      <span className="text-[11px] text-slate-400">MRN: {apt.patient?.medicalRecordNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-white block">Dr. {apt.doctor?.user?.name}</strong>
                      <span className="text-[11px] text-slate-400">{apt.doctor?.specialization}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{apt.appointmentDate}</span>
                      <span className="text-[11px] font-mono text-blue-300">{apt.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={apt.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApt(apt);
                          setTargetStatus(apt.status);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-400/30 transition-colors"
                      >
                        Override Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Status Override Modal */}
      {selectedApt && (
        <Modal
          isOpen={!!selectedApt}
          onClose={() => setSelectedApt(null)}
          title={`Override Appointment #${selectedApt.appointmentNumber}`}
          subtitle={`Patient: ${selectedApt.patient?.user?.name} • Doctor: Dr. ${selectedApt.doctor?.user?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Select New Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              >
                {['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {st.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Administrative Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Reason for administrative override..."
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Updating...' : 'Save Override'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AllAppointments;
