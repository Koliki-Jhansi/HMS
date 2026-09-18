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

  const handleDeleteBed = async (bedId: string) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    try {
      await api.delete(`/beds/${bedId}`);
      fetchBedsAndWards();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete bed');
    }
  };

  const filteredBeds = beds.filter((b) => {
    const matchWard = selectedWard === 'ALL' || b.wardId === selectedWard;
    const matchStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchSearch =
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ward?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchWard && matchStatus && matchSearch;
  });

  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length;
  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
  const cleaningBeds = beds.filter((b) => b.status === 'CLEANING').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'MAINTENANCE').length;
  const reservedBeds = beds.filter((b) => b.status === 'RESERVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bed & Ward Visualizer Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time hospital bed grid, live status toggles, ward allocation, and occupancy metrics.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Add New Bed Unit
        </button>
      </div>

      {/* Bed Status Summary Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedStatus('ALL')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'ALL'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <span className="text-[10px] font-bold uppercase opacity-80">Total Beds</span>
          <p className="text-xl font-extrabold mt-0.5">{totalBeds}</p>
        </button>

        <button
          onClick={() => setSelectedStatus('AVAILABLE')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'AVAILABLE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase">Available</span>
          <p className="text-xl font-extrabold mt-0.5">{availableBeds}</p>
        </button>

        <button
          onClick={() => setSelectedStatus('OCCUPIED')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'OCCUPIED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase">Occupied</span>
          <p className="text-xl font-extrabold mt-0.5">{occupiedBeds}</p>
        </button>

        <button
          onClick={() => setSelectedStatus('RESERVED')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'RESERVED'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase">Reserved</span>
          <p className="text-xl font-extrabold mt-0.5">{reservedBeds}</p>
        </button>

        <button
          onClick={() => setSelectedStatus('CLEANING')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'CLEANING'
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
              : 'bg-cyan-50 border-cyan-200 text-cyan-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase">Cleaning</span>
          <p className="text-xl font-extrabold mt-0.5">{cleaningBeds}</p>
        </button>

        <button
          onClick={() => setSelectedStatus('MAINTENANCE')}
          className={`p-4 rounded-2xl border text-center transition-all ${
            selectedStatus === 'MAINTENANCE'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold uppercase">Maintenance</span>
          <p className="text-xl font-extrabold mt-0.5">{maintenanceBeds}</p>
        </button>
      </div>

      {/* Ward Filter Pills & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bed number, ward..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedWard('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedWard === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Wards
          </button>
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWard(w.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedWard === w.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Cards Matrix Grid */}
      {loading ? (
        <LoadingSpinner text="Rendering ward bed matrix..." />
      ) : filteredBeds.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No beds match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const activeAdm = bed.admissions && bed.admissions.length > 0 ? bed.admissions[0] : null;

            return (
              <div
                key={bed.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2.5 rounded-xl ${
                          bed.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-600'
                            : bed.status === 'OCCUPIED'
                            ? 'bg-rose-50 text-rose-600'
                            : bed.status === 'RESERVED'
                            ? 'bg-amber-50 text-amber-600'
                            : bed.status === 'CLEANING'
                            ? 'bg-cyan-50 text-cyan-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 font-mono">
                          {bed.bedNumber}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-semibold block truncate max-w-[120px]">
                          {bed.ward.name}
                        </span>
                      </div>
                    </div>

                    <Badge status={bed.status} size="sm" />
                  </div>

                  {/* If occupied, show patient info */}
                  {activeAdm ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-xs">
                      <p className="font-bold text-slate-900 truncate">
                        👤 {activeAdm.patient.user.name}
                      </p>
                      <p className="text-[11px] text-purple-700 font-medium truncate mt-0.5">
                        Dr. {activeAdm.doctor?.user?.name}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Adm: {new Date(activeAdm.admissionDate).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Ward Type:</span>
                        <span className="font-semibold text-slate-700">{bed.ward.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Rate:</span>
                        <span className="font-bold text-slate-900">${bed.dailyRate}/day</span>
                      </div>
                      {bed.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                          {bed.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedBedForStatus(bed);
                      setTargetStatus(bed.status);
                      setStatusNotes(bed.notes || '');
                      setError(null);
                    }}
                    className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors text-center"
                  >
                    Quick Status Change
                  </button>

                  {!activeAdm && (
                    <button
                      onClick={() => handleDeleteBed(bed.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete bed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bed Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Hospital Bed Unit"
          subtitle="Configure unit number, ward location, and billing rate"
          maxWidth="md"
        >
          <form onSubmit={handleCreateBed} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bed Number / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ICU-107, GEN-206, PRV-404"
                value={newBedNumber}
                onChange={(e) => setNewBedNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-purple-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Ward *
              </label>
              <select
                value={newWardId}
                onChange={(e) => setNewWardId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Floor {w.floor} - {w.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as BedStatus)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Daily Rate ($ USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={newDailyRate}
                  onChange={(e) => setNewDailyRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Equipment / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Ventilator ready, Cardiac telemetry"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs disabled:opacity-70"
              >
                {submitting ? 'Creating...' : 'Create Bed Unit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Change Modal */}
      {selectedBedForStatus && (
        <Modal
          isOpen={!!selectedBedForStatus}
          onClose={() => setSelectedBedForStatus(null)}
          title={`Update Bed Status: ${selectedBedForStatus.bedNumber}`}
          subtitle={`Ward: ${selectedBedForStatus.ward.name}`}
          maxWidth="sm"
        >
          <form onSubmit={handleUpdateBedStatus} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as BedStatus)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value="AVAILABLE">AVAILABLE (Vacant for intake)</option>
                <option value="RESERVED">RESERVED (Incoming patient)</option>
                <option value="CLEANING">CLEANING (Sanitization in progress)</option>
                <option value="MAINTENANCE">MAINTENANCE (Equipment repair)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Notes / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Disinfected at 09:30 AM"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBedForStatus(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs disabled:opacity-70"
              >
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
