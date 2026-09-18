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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Master Appointments Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor all scheduled consultations, patient queues, doctor allocations, and appointment completion rates.
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
            placeholder="Search patient, doctor, appointment #..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Master Table */}
      {loading ? (
        <LoadingSpinner text="Loading appointments ledger..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="There are no appointments matching your filter query."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Apt #</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor & Department</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Reason for Visit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-700">
                      {apt.appointmentNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            apt.patient.user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              apt.patient.user.name
                            )}&background=0f766e&color=fff`
                          }
                          alt={apt.patient.user.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{apt.patient.user.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {apt.patient.medicalRecordNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">Dr. {apt.doctor.user.name}</p>
                      <p className="text-[11px] text-slate-500">{apt.doctor.department?.name || 'General'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{apt.appointmentDate}</p>
                      <p className="text-[11px] font-mono text-brand-600 font-semibold">{apt.timeSlot}</p>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-slate-600">
                      {apt.reason}
                    </td>
                    <td className="p-4">
                      <Badge status={apt.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApt(apt);
                          setTargetStatus(apt.status);
                          setStatusNotes(apt.notes || '');
                          setError(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
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

      {/* Override Status Modal */}
      {selectedApt && (
        <Modal
          isOpen={!!selectedApt}
          onClose={() => setSelectedApt(null)}
          title={`Update Appointment Status: ${selectedApt.appointmentNumber}`}
          subtitle={`Patient: ${selectedApt.patient?.user?.name} • Doctor: Dr. ${selectedApt.doctor?.user?.name}`}
          maxWidth="sm"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select New Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Notes / Reason
              </label>
              <textarea
                rows={3}
                placeholder="Administrative override explanation..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs disabled:opacity-70"
              >
                {submitting ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
