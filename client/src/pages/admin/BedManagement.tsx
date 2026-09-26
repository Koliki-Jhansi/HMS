import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Wrench,
  Trash2,
  Edit,
  User,
} from 'lucide-react';
import api from '../../services/api';
import { Ward, Bed, BedStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { HospitalHeader3D } from '../../components/3d/HospitalHeader3D';

export const BedManagement: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Bed Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newWardId, setNewWardId] = useState('');
  const [newStatus, setNewStatus] = useState<BedStatus>('AVAILABLE');
  const [newDailyRate, setNewDailyRate] = useState<number>(100);
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Change Modal
  const [selectedBedForStatus, setSelectedBedForStatus] = useState<Bed | null>(null);
  const [targetStatus, setTargetStatus] = useState<BedStatus>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    fetchBedsAndWards();
  }, []);

  const fetchBedsAndWards = async () => {
    try {
      setLoading(true);
      const [wardRes, bedRes] = await Promise.all([
        api.get('/wards'),
        api.get('/beds'),
      ]);
      if (wardRes.data.success) {
        setWards(wardRes.data.data);
        if (wardRes.data.data.length > 0 && !newWardId) {
          setNewWardId(wardRes.data.data[0].id);
        }
      }
      if (bedRes.data.success) setBeds(bedRes.data.data);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/beds', {
        bedNumber: newBedNumber,
        wardId: newWardId,
        status: newStatus,
        dailyRate: newDailyRate,
        notes: newNotes,
      });
      if (res.data.success) {
        setShowAddModal(false);
        setNewBedNumber('');
        setNewNotes('');
        fetchBedsAndWards();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBedStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForStatus) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.patch(`/beds/${selectedBedForStatus.id}/status`, {
        status: targetStatus,
        notes: statusNotes || undefined,
      });
      if (res.data.success) {
        setSelectedBedForStatus(null);
        setStatusNotes('');
        fetchBedsAndWards();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBeds = beds.filter((bed) => {
    const matchesWard = selectedWard === 'ALL' || bed.wardId === selectedWard;
    const matchesStatus = selectedStatus === 'ALL' || bed.status === selectedStatus;
    const matchesSearch =
      bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.ward?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWard && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* 3D Hospital Header */}
      <HospitalHeader3D
        type="room"
        badge="Hospital Facilities Matrix"
        title="Bed & Ward Capacity Matrix"
        subtitle="Live telemetry for ICU, Critical Care, Emergency, Semi-Private, and General Ward beds."
        actions={
          <button
            onClick={() => {
              setShowAddModal(true);
              setError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Register New Bed
          </button>
        }
      />

      {/* Filter & Controls Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bed number or ward name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Status Filter */}
          {['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ward Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          onClick={() => setSelectedWard('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedWard === 'ALL'
              ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
              : 'bg-slate-900/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          All Units ({beds.length})
        </button>
        {wards.map((ward) => {
          const wardBeds = beds.filter((b) => b.wardId === ward.id);
          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWard(ward.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedWard === ward.id
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-900/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {ward.name} ({wardBeds.length})
            </button>
          );
        })}
      </div>

      {/* Bed Matrix Grid */}
      {loading ? (
        <LoadingSpinner text="Scanning live hospital beds..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredBeds.map((bed) => {
            const isAvail = bed.status === 'AVAILABLE';
            const isOcc = bed.status === 'OCCUPIED';
            const isClean = bed.status === 'CLEANING';
            const isMaint = bed.status === 'MAINTENANCE';

            return (
              <div
                key={bed.id}
                onClick={() => {
                  setSelectedBedForStatus(bed);
                  setTargetStatus(bed.status);
                }}
                className={`p-4 rounded-2xl border backdrop-blur-xl transition-all shadow-md flex flex-col justify-between cursor-pointer hover:scale-102 ${
                  isAvail
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100 hover:border-emerald-400/60'
                    : isOcc
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-100 hover:border-rose-400/60'
                    : isClean
                    ? 'bg-sky-950/30 border-sky-500/30 text-sky-100 hover:border-sky-400/60'
                    : 'bg-slate-950/30 border-slate-700/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase truncate">
                    {bed.ward?.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvail
                        ? 'bg-emerald-400 animate-pulse'
                        : isOcc
                        ? 'bg-rose-400'
                        : isClean
                        ? 'bg-sky-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>

                <div className="my-1.5">
                  <BedDouble className="w-5 h-5 mb-1 opacity-80" />
                  <span className="text-lg font-extrabold font-mono block">Bed {bed.bedNumber}</span>
                  <span className="text-[10px] opacity-75">${bed.dailyRate}/day</span>
                </div>

                <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold">
                  <span className="uppercase">{bed.status}</span>
                  <span className="text-blue-300">Update →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register Bed Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register New Hospital Bed"
          subtitle="Add an inpatient bed unit to a hospital ward"
          maxWidth="md"
        >
          <form onSubmit={handleCreateBed} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Ward
              </label>
              <select
                required
                value={newWardId}
                onChange={(e) => setNewWardId(e.target.value)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Bed Identifier / Number
                </label>
                <input
                  type="text"
                  required
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  placeholder="e.g. ICU-05, G-12"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Daily Rate (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newDailyRate}
                  onChange={(e) => setNewDailyRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BedStatus)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              >
                <option value="AVAILABLE" className="bg-slate-900 text-white">AVAILABLE</option>
                <option value="CLEANING" className="bg-slate-900 text-white">CLEANING</option>
                <option value="MAINTENANCE" className="bg-slate-900 text-white">MAINTENANCE</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Registering...' : 'Register Bed'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bed Status Override Modal */}
      {selectedBedForStatus && (
        <Modal
          isOpen={!!selectedBedForStatus}
          onClose={() => setSelectedBedForStatus(null)}
          title={`Update Bed #${selectedBedForStatus.bedNumber}`}
          subtitle={`Ward: ${selectedBedForStatus.ward?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateBedStatus} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Operational Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as BedStatus)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              >
                <option value="AVAILABLE" className="bg-slate-900 text-white">AVAILABLE</option>
                <option value="OCCUPIED" className="bg-slate-900 text-white">OCCUPIED</option>
                <option value="CLEANING" className="bg-slate-900 text-white">CLEANING / SANITIZING</option>
                <option value="MAINTENANCE" className="bg-slate-900 text-white">MAINTENANCE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Maintenance / Status Notes
              </label>
              <textarea
                rows={2}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="e.g. Sanitized after discharge, oxygen valve check..."
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBedForStatus(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Updating...' : 'Save Bed Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BedManagement;
