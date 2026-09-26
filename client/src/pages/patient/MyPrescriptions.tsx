import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Printer,
  Download,
  AlertCircle,
  Building2,
  Clock,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import { Prescription } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const MyPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prescriptions');
      if (res.data.success) {
        setPrescriptions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          My Prescriptions (Rx)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Review, track, and print official medication orders issued by your attending physicians.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your digital prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions on file"
          description="Your doctor will issue digital prescriptions after consultations and clinical evaluations."
        />
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 shadow-xl overflow-hidden transition-all text-white"
            >
              {/* Card Header */}
              <div className="bg-slate-950/60 p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-widest bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-lg border border-teal-400/30">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        Issued: {new Date(rx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">Diagnosis: {rx.diagnosis}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => setSelectedPrescription(rx)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 backdrop-blur-md transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Rx Slip
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Doctor & Appointment info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/40 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Attending Doctor</span>
                      <strong className="text-white">Dr. {rx.doctor.user.name}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                      <strong className="text-white">{rx.doctor.department?.name || 'General Practice'}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultation Slot</span>
                      <strong className="text-white">
                        {rx.appointment?.appointmentDate} ({rx.appointment?.timeSlot})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Medication Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2.5 flex items-center gap-2">
                    <Pill className="w-3.5 h-3.5" /> Prescribed Medications & Dosage
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-xs text-white">
                      <thead className="bg-slate-950/70 border-b border-white/10 text-teal-300 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Medicine Name</th>
                          <th className="py-3 px-4">Dosage</th>
                          <th className="py-3 px-4">Frequency</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-950/20">
                        {rx.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{item.medicineName}</td>
                            <td className="py-3 px-4 text-slate-300 font-mono">{item.dosage}</td>
                            <td className="py-3 px-4 text-slate-300">{item.frequency}</td>
                            <td className="py-3 px-4 text-teal-300 font-semibold">{item.duration}</td>
                            <td className="py-3 px-4 text-slate-300">{item.instructions || 'As directed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Doctor's Clinical Notes */}
                {rx.notes && (
                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
                    <strong className="block text-teal-300 mb-1">Doctor's Clinical Notes:</strong>
                    <p>{rx.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Prescription Slip Modal */}
      {selectedPrescription && (
        <Modal
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          title={`Digital Prescription #${selectedPrescription.prescriptionNumber}`}
          subtitle="Official HIRO Hospital Medical Record Slip"
          maxWidth="2xl"
        >
          <div className="space-y-6 text-white" id="printable-rx">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">HIRO HOSPITAL</h2>
                <p className="text-xs text-slate-400">Department of {selectedPrescription.doctor.department?.name || 'Medicine'}</p>
              </div>
              <div className="text-right text-xs">
                <span className="font-mono text-teal-300 font-bold block">{selectedPrescription.prescriptionNumber}</span>
                <span className="text-slate-400">Date: {new Date(selectedPrescription.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Patient & Doctor Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 p-4 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Information</span>
                <p className="font-bold text-white text-sm">{selectedPrescription.patient.user.name}</p>
                <p className="text-slate-300">MRN: {selectedPrescription.patient.medicalRecordNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Attending Specialist</span>
                <p className="font-bold text-white text-sm">Dr. {selectedPrescription.doctor.user.name}</p>
                <p className="text-slate-300">{selectedPrescription.doctor.specialization}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="text-xs">
              <span className="font-bold text-teal-300 uppercase block mb-1">Primary Clinical Diagnosis:</span>
              <p className="p-3 bg-slate-950/40 rounded-xl border border-white/10 font-bold text-white">
                {selectedPrescription.diagnosis}
              </p>
            </div>

            {/* Medicines */}
            <div>
              <span className="font-bold text-teal-300 uppercase text-xs block mb-2">Rx Medications:</span>
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-teal-300 font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950/20">
                    {selectedPrescription.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-white">{item.medicineName}</td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{item.dosage}</td>
                        <td className="py-2 px-3 text-slate-300">{item.frequency}</td>
                        <td className="py-2 px-3 text-teal-300">{item.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPrescriptions;
