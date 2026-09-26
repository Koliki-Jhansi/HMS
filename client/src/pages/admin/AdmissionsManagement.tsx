import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  BedDouble,
  Search,
  Plus,
  Calendar,
  User,
  Stethoscope,
  LogOut,
  ArrowRightLeft,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import { Admission, Patient, Bed, Doctor } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const AdmissionsManagement: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Admit Modal
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [bedId, setBedId] = useState('');
  const [admittingDoctorId, setAdmittingDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discharge Modal
  const [dischargeTarget, setDischargeTarget] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [postBedStatus, setPostBedStatus] = useState<string>('CLEANING');
  const [calculatedBill, setCalculatedBill] = useState<number>(0);

  // Transfer Bed Modal
  const [transferTarget, setTransferTarget] = useState<Admission | null>(null);
  const [transferBedId, setTransferBedId] = useState('');

  useEffect(() => {
    fetchAdmissions();
    fetchMetadata();
  }, [statusFilter]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === 'ALL'
          ? '/admissions'
          : `/admissions?status=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setAdmissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [patRes, bedRes, docRes] = await Promise.all([
        api.get('/patients'),
        api.get('/beds?status=AVAILABLE'),
        api.get('/doctors'),
      ]);
      if (patRes.data.success) {
        setPatients(patRes.data.data);
        if (patRes.data.data.length > 0 && !patientId) {
          setPatientId(patRes.data.data[0].id);
        }
      }
      if (bedRes.data.success) {
        setAvailableBeds(bedRes.data.data);
        if (bedRes.data.data.length > 0 && !bedId) {
          setBedId(bedRes.data.data[0].id);
        }
      }
      if (docRes.data.success) {
        setDoctors(docRes.data.data);
        if (docRes.data.data.length > 0 && !admittingDoctorId) {
          setAdmittingDoctorId(docRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !bedId || !admittingDoctorId || !reason) {
      setError('Please fill in all required admission fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/admissions', {
        patientId,
        bedId,
        admittingDoctorId,
        reason,
        diagnosis,
      });

      if (res.data.success) {
        setShowAdmitModal(false);
        setReason('');
        setDiagnosis('');
        fetchAdmissions();
        fetchMetadata();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setSubmitting(false);
    }
  };

  const openDischargeModal = (adm: Admission) => {
    setDischargeTarget(adm);
    const admissionDate = new Date(adm.admissionDate);
    const now = new Date();
    const days = Math.max(
      1,
      Math.ceil((now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    setCalculatedBill(days * (adm.bed?.dailyRate || 100));
    setDischargeSummary('Patient recovered and cleared for safe discharge by attending team.');
    setPostBedStatus('CLEANING');
    setError(null);
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTarget) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post(`/admissions/${dischargeTarget.id}/discharge`, {
        dischargeSummary,
        postDischargeBedStatus: postBedStatus,
        totalBill: calculatedBill,
      });

      if (res.data.success) {
        setDischargeTarget(null);
        fetchAdmissions();
        fetchMetadata();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !transferBedId) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post(`/admissions/${transferTarget.id}/transfer`, {
        newBedId: transferBedId,
      });

      if (res.data.success) {
        setTransferTarget(null);
        fetchAdmissions();
        fetchMetadata();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to transfer bed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmissions = admissions.filter((adm) => {
    const q = searchQuery.toLowerCase();
    return (
      adm.patient?.user?.name.toLowerCase().includes(q) ||
      adm.admissionNumber.toLowerCase().includes(q) ||
      adm.bed?.bedNumber.toLowerCase().includes(q) ||
      adm.bed?.ward?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            Patient Admissions & Discharge Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage inpatient registrations, automated bed allocations, ward transfers, and clinical discharge summaries.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAdmitModal(true);
            fetchMetadata();
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Admit Patient
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, admission #, bed..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ACTIVE', 'DISCHARGED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table in Glass */}
      {loading ? (
        <LoadingSpinner text="Querying active inpatient admissions..." />
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState
          title="No admissions found"
          description="Click 'Admit Patient' to assign a registered patient to an available ward bed."
        />
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-slate-950/70 border-b border-white/10 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Admission Details</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Ward & Bed</th>
                  <th className="py-3.5 px-4">Attending Doctor</th>
                  <th className="py-3.5 px-4">Admitted At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/20">
                {filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-300 block">{adm.admissionNumber}</span>
                      <span className="text-[11px] text-slate-300 line-clamp-1">{adm.reason}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-white block">{adm.patient.user.name}</strong>
                      <span className="text-[11px] text-slate-400">MRN: {adm.patient.medicalRecordNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{adm.bed?.ward?.name}</span>
                      <span className="text-[11px] text-blue-300 font-mono">Bed #{adm.bed?.bedNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      Dr. {adm.doctor?.user?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={adm.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {adm.status === 'ACTIVE' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTransferTarget(adm);
                              fetchMetadata();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-[11px] border border-blue-400/30 flex items-center gap-1"
                            title="Transfer Bed"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Transfer
                          </button>
                          <button
                            onClick={() => openDischargeModal(adm)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] border border-rose-400/30 flex items-center gap-1"
                            title="Discharge Patient"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Discharge
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <Modal
          isOpen={showAdmitModal}
          onClose={() => setShowAdmitModal(false)}
          title="New Inpatient Admission"
          subtitle="Assign an admitted patient to an available ward bed."
          maxWidth="lg"
        >
          <form onSubmit={handleAdmitSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Select Registered Patient
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.user.name} (MRN: {p.medicalRecordNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Available Ward Bed
                </label>
                <select
                  required
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                >
                  {availableBeds.length === 0 ? (
                    <option value="" disabled className="bg-slate-900 text-white">No available beds</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.ward?.name} - Bed #{b.bedNumber} (${b.dailyRate}/day)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Attending Physician
                </label>
                <select
                  required
                  value={admittingDoctorId}
                  onChange={(e) => setAdmittingDoctorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      Dr. {d.user.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admission Reason / Primary Complaint *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Post-operative recovery, severe dehydration, respiratory distress..."
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Preliminary Diagnosis (Optional)
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Initial clinical observations..."
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdmitModal(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || availableBeds.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {submitting ? 'Admitting...' : 'Confirm Admission'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Discharge Modal */}
      {dischargeTarget && (
        <Modal
          isOpen={!!dischargeTarget}
          onClose={() => setDischargeTarget(null)}
          title={`Discharge Patient: ${dischargeTarget.patient.user.name}`}
          subtitle={`Admission #${dischargeTarget.admissionNumber} • Ward ${dischargeTarget.bed?.ward?.name} Bed #${dischargeTarget.bed?.bedNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleDischargeSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Discharge Clinical Summary
              </label>
              <textarea
                rows={3}
                required
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Bed Post-Status
                </label>
                <select
                  value={postBedStatus}
                  onChange={(e) => setPostBedStatus(e.target.value)}
                  className="w-full p-2 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white"
                >
                  <option value="CLEANING" className="bg-slate-900 text-white">Cleaning / Sanitizing</option>
                  <option value="AVAILABLE" className="bg-slate-900 text-white">Immediate Available</option>
                  <option value="MAINTENANCE" className="bg-slate-900 text-white">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Total Bill (USD)
                </label>
                <input
                  type="number"
                  value={calculatedBill}
                  onChange={(e) => setCalculatedBill(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Discharging...' : 'Confirm Discharge'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Bed Modal */}
      {transferTarget && (
        <Modal
          isOpen={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          title={`Transfer Bed: ${transferTarget.patient.user.name}`}
          subtitle={`Currently in ${transferTarget.bed?.ward?.name} Bed #${transferTarget.bed?.bedNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Select Destination Bed
              </label>
              <select
                required
                value={transferBedId}
                onChange={(e) => setTransferBedId(e.target.value)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              >
                <option value="" className="bg-slate-900 text-white">-- Select Available Bed --</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.ward?.name} - Bed #{b.bedNumber} ({(b as any).type || (b as any).category || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !transferBedId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdmissionsManagement;
