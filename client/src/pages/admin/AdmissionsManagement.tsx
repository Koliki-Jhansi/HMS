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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Admissions & Discharge Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage inpatient registrations, automated bed allocations, ward transfers, and clinical discharge summaries.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAdmitModal(true);
            fetchMetadata();
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          Admit Patient
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, admission #, bed..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ACTIVE', 'DISCHARGED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ACTIVE' ? 'Active Inpatients' : st === 'DISCHARGED' ? 'Discharged History' : 'All Admissions'}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      {loading ? (
        <LoadingSpinner text="Fetching admissions registry..." />
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState
          title="No admissions found"
          description="There are currently no patients matching your filter in the admissions ledger."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Admission #</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Ward & Bed Unit</th>
                  <th className="p-4">Attending Doctor</th>
                  <th className="p-4">Admission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-brand-700">
                      {adm.admissionNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            adm.patient.user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              adm.patient.user.name
                            )}&background=0f766e&color=fff`
                          }
                          alt={adm.patient.user.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{adm.patient.user.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {adm.patient.medicalRecordNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{adm.bed.ward.name}</p>
                      <p className="text-[11px] font-mono text-purple-700 font-bold">
                        Bed #{adm.bed.bedNumber} ({adm.bed.ward.type})
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">Dr. {adm.doctor.user.name}</p>
                      <p className="text-[11px] text-slate-500">{adm.doctor.department?.name || 'General'}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge status={adm.status} size="sm" />
                    </td>
                    <td className="p-4 text-right">
                      {adm.status === 'ACTIVE' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTransferTarget(adm);
                              setError(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Transfer Bed"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Transfer
                          </button>
                          <button
                            onClick={() => openDischargeModal(adm)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Discharge
                          </button>
                        </div>
                      )}
                      {adm.status === 'DISCHARGED' && (
                        <span className="text-[11px] text-slate-400 italic">
                          Discharged {adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : ''}
                        </span>
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
          title="Direct Inpatient Admission"
          subtitle="Assign patient to an available ward bed with auto-status update"
          maxWidth="lg"
        >
          <form onSubmit={handleAdmitSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Patient */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Patient *
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} ({p.medicalRecordNumber}) - Blood: {p.bloodGroup || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Available Bed */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Available Bed Unit *
              </label>
              {availableBeds.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
                  ⚠️ No beds currently marked as AVAILABLE. Please create or clean a bed first.
                </div>
              ) : (
                <select
                  required
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-purple-800"
                >
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.ward.name} - {b.ward.type}) • ${b.dailyRate}/day
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Select Doctor */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Attending Admitting Physician *
              </label>
              <select
                required
                value={admittingDoctorId}
                onChange={(e) => setAdmittingDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.user.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Admission *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute chest pain, Post-operative joint recovery, Acute appendicitis"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Initial Diagnosis */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Clinical Diagnosis (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Clinical observations, vital parameters, triage notes..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdmitModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || availableBeds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                {submitting ? 'Admitting...' : 'Confirm Patient Admission'}
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
          title={`Discharge Patient: ${dischargeTarget.patient?.user?.name}`}
          subtitle={`Admission #${dischargeTarget.admissionNumber} • Bed ${dischargeTarget.bed?.bedNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleDischargeSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Estimated Bill</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">${calculatedBill}.00 USD</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Admitted</p>
                <p className="font-bold text-slate-700 mt-0.5">{new Date(dischargeTarget.admissionDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Discharge Clinical Summary *
              </label>
              <textarea
                rows={3}
                required
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Post-Discharge Bed Status Auto-Set
              </label>
              <select
                value={postBedStatus}
                onChange={(e) => setPostBedStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
              >
                <option value="CLEANING">CLEANING (Recommended for sanitation)</option>
                <option value="AVAILABLE">AVAILABLE (Immediate intake)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20 disabled:opacity-70"
              >
                {submitting ? 'Processing Discharge...' : 'Confirm Patient Discharge'}
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
          title={`Transfer Bed for ${transferTarget.patient?.user?.name}`}
          subtitle={`Current: ${transferTarget.bed?.ward?.name} Bed ${transferTarget.bed?.bedNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Destination Available Bed *
              </label>
              <select
                required
                value={transferBedId}
                onChange={(e) => setTransferBedId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-xs"
              >
                <option value="">-- Choose Target Bed --</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bedNumber} ({b.ward.name} - {b.ward.type}) • ${b.dailyRate}/day
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !transferBedId}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Transferring...' : 'Execute Bed Transfer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
