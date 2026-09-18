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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Prescriptions (Rx)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access, review, and print official medication orders issued by your attending physicians.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your digital prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions on file"
          description="Your doctor will issue digital prescriptions after consultations and evaluations."
        />
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden transition-all hover:shadow-card-hover"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 to-brand-950 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-widest bg-brand-500/30 text-brand-200 px-2.5 py-0.5 rounded-lg border border-brand-400/30">
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

              {/* Physician & Notes Sub-bar */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block">
                    Prescribing Physician
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5 text-sm">
                    {rx.doctor.user.name} ({rx.doctor.department?.name || 'Department'})
                  </p>
                  <p className="text-slate-500">{rx.doctor.qualification}</p>
                </div>

                {rx.followUpDate && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block">
                      Recommended Follow-Up Date
                    </span>
                    <p className="font-bold text-brand-700 mt-0.5 text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {rx.followUpDate}
                    </p>
                  </div>
                )}

                {rx.notes && (
                  <div className="md:max-w-md">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block">
                      Doctor Clinical Notes & Diet
                    </span>
                    <p className="text-slate-700 mt-0.5 italic">{rx.notes}</p>
                  </div>
                )}
              </div>

              {/* Prescribed Items Table */}
              <div className="p-5 sm:p-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">#</th>
                      <th className="pb-3">Medication Name</th>
                      <th className="pb-3">Dosage</th>
                      <th className="pb-3">Frequency & Schedule</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {rx.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 font-bold text-slate-900">{item.medicineName}</td>
                        <td className="py-3 font-mono text-brand-700">{item.dosage}</td>
                        <td className="py-3">{item.frequency}</td>
                        <td className="py-3">{item.duration}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {item.route}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 italic">
                          {item.instructions || 'Take as directed'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Prescription Modal */}
      {selectedPrescription && (
        <Modal
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          title="Digital Prescription Slip"
          maxWidth="2xl"
        >
          <div className="space-y-6 print:p-0">
            {/* Header */}
            <div className="border-b-2 border-brand-600 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                    MedPulse Hospital & Medical Center
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    742 Evergreen Healthcare Ave • Tel: +1 (800) 555-0199
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-brand-700 block">
                  {selectedPrescription.prescriptionNumber}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Patient & Doctor metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Patient Information</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedPrescription.patient?.user?.name}</p>
                <p className="text-slate-600">MRN: {selectedPrescription.patient?.medicalRecordNumber}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[10px]">Attending Physician</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedPrescription.doctor?.user?.name}</p>
                <p className="text-slate-600">{selectedPrescription.doctor?.specialization}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Clinical Diagnosis:
              </span>
              <p className="font-bold text-sm text-slate-900 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200">
                {selectedPrescription.diagnosis}
              </p>
            </div>

            {/* Medications Table */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Rx Prescribed Medications
              </span>
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Medication</th>
                    <th className="p-2.5">Dosage</th>
                    <th className="p-2.5">Schedule</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPrescription.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-bold text-slate-900">{item.medicineName}</td>
                      <td className="p-2.5 font-mono">{item.dosage}</td>
                      <td className="p-2.5">{item.frequency}</td>
                      <td className="p-2.5">{item.duration}</td>
                      <td className="p-2.5 text-slate-500 italic">{item.instructions || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Doctor signature line */}
            <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Generated securely via MedPulse HMS System</p>
                {selectedPrescription.followUpDate && (
                  <p className="font-bold text-slate-700 mt-1">Next Follow-Up: {selectedPrescription.followUpDate}</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-800">{selectedPrescription.doctor?.user?.name}</p>
                <p className="text-[10px] text-slate-400">Authorized Medical Signature</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
