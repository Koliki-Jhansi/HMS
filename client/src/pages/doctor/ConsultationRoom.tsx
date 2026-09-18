import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { Appointment, PrescriptionItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const ConsultationRoom: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const aptId = searchParams.get('aptId');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState<
    Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      route: string;
      instructions: string;
    }>
  >([
    {
      medicineName: '',
      dosage: '500mg',
      frequency: 'Twice daily (1-0-1)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'Take after meals',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      if (res.data.success) {
        const list: Appointment[] = res.data.data;
        setAppointments(list);

        if (aptId) {
          const match = list.find((a) => a.id === aptId);
          if (match) selectAppointmentForConsult(match);
        } else if (list.length > 0) {
          const activeOrPending =
            list.find((a) => a.status === 'IN_PROGRESS' || a.status === 'ACCEPTED') || list[0];
          selectAppointmentForConsult(activeOrPending);
        }
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectAppointmentForConsult = async (apt: Appointment) => {
    setSelectedAppointment(apt);
    setSuccessMessage(null);
    setError(null);

    // If accepted, auto-transition to IN_PROGRESS
    if (apt.status === 'ACCEPTED') {
      try {
        await api.patch(`/appointments/${apt.id}/status`, { status: 'IN_PROGRESS' });
        apt.status = 'IN_PROGRESS';
      } catch (err) {
        console.error(err);
      }
    }

    // If already has prescription
    if (apt.prescription) {
      setDiagnosis(apt.prescription.diagnosis || '');
      setClinicalNotes(apt.prescription.notes || '');
      setFollowUpDate(apt.prescription.followUpDate || '');
      if (apt.prescription.items && apt.prescription.items.length > 0) {
        setPrescriptionItems(
          apt.prescription.items.map((i) => ({
            medicineName: i.medicineName,
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
            route: i.route,
            instructions: i.instructions || '',
          }))
        );
      }
    } else {
      setDiagnosis('');
      setClinicalNotes(apt.notes || '');
      setFollowUpDate('');
      setPrescriptionItems([
        {
          medicineName: '',
          dosage: '500mg',
          frequency: 'Twice daily (1-0-1)',
          duration: '5 days',
          route: 'Oral',
          instructions: 'Take after food',
        },
      ]);
    }
  };

  const handleAddMedicineRow = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: '',
        dosage: '10mg',
        frequency: 'Once daily (1-0-0)',
        duration: '7 days',
        route: 'Oral',
        instructions: 'Take in morning',
      },
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (prescriptionItems.length === 1) return;
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const updated = [...prescriptionItems];
    (updated[index] as any)[field] = value;
    setPrescriptionItems(updated);
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    // Validate
    if (!diagnosis.trim()) {
      setError('Please provide a clinical diagnosis');
      return;
    }

    const validItems = prescriptionItems.filter((item) => item.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      setError('Please specify at least one valid medication name in the prescription');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await api.post('/prescriptions', {
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        diagnosis,
        notes: clinicalNotes,
        followUpDate: followUpDate || undefined,
        items: validItems,
      });

      if (res.data.success) {
        setSuccessMessage('Prescription issued and consultation marked completed!');
        setTimeout(() => {
          navigate('/doctor/appointments');
        }, 1800);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Setting up consultation workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-brand-600" />
            Clinical Consultation & Rx Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Conduct patient evaluations, document clinical diagnoses, and generate multi-drug prescriptions.
          </p>
        </div>
      </div>

      {/* Patient Selector Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider whitespace-nowrap">
            Select Patient:
          </span>
          <select
            value={selectedAppointment?.id || ''}
            onChange={(e) => {
              const match = appointments.find((a) => a.id === e.target.value);
              if (match) selectAppointmentForConsult(match);
            }}
            className="w-full md:w-80 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.patient?.user?.name} ({a.appointmentDate} - {a.timeSlot}) [{a.status}]
              </option>
            ))}
          </select>
        </div>

        {selectedAppointment && (
          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="text-xs font-semibold text-slate-500">
              Appointment #{selectedAppointment.appointmentNumber}
            </span>
            <Badge status={selectedAppointment.status} size="sm" />
          </div>
        )}
      </div>

      {selectedAppointment ? (
        <form onSubmit={handleSubmitConsultation} className="space-y-6">
          {/* Patient Quick Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedAppointment.patient?.user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedAppointment.patient?.user?.name
                  )}&background=0f766e&color=fff&bold=true`
                }
                alt={selectedAppointment.patient?.user?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-400"
              />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedAppointment.patient?.user?.name}
                </h3>
                <p className="text-xs text-brand-200 mt-0.5">
                  MRN: <span className="font-mono font-bold text-white">{selectedAppointment.patient?.medicalRecordNumber}</span> • Gender: {selectedAppointment.patient?.gender || 'N/A'} • Blood Group: <span className="text-teal-300 font-bold">{selectedAppointment.patient?.bloodGroup || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Reason for visit: <strong className="text-white">{selectedAppointment.reason}</strong>
                </p>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-xs space-y-1 backdrop-blur-md">
              <p className="text-brand-200">
                Known Allergies:{' '}
                <strong className="text-rose-300">{selectedAppointment.patient?.allergies || 'None declared'}</strong>
              </p>
              <p className="text-brand-200">
                Chronic Conditions:{' '}
                <strong className="text-amber-300">{selectedAppointment.patient?.chronicConditions || 'None'}</strong>
              </p>
              <p className="text-slate-300">
                Emergency: {selectedAppointment.patient?.emergencyContactName || 'N/A'} ({selectedAppointment.patient?.emergencyContactPhone || 'N/A'})
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Diagnosis & Clinical Observations Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-brand-600" />
              1. Clinical Diagnosis & Findings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis, Essential Hypertension Stage 1, Lumbar Disc Herniation"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recommended Follow-Up Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Examination Notes & Lifestyle Advice
              </label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Document patient vitals, examination findings, dietary precautions, and test orders..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Prescription Medications Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-brand-600" />
                2. Medication Prescription Orders (Rx)
              </h3>

              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Medication Row
              </button>
            </div>

            <div className="space-y-3">
              {prescriptionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end transition-all"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Drug / Medicine Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin Clavulanate"
                      value={item.medicineName}
                      onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 625mg"
                      value={item.dosage}
                      onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Frequency
                    </label>
                    <select
                      value={item.frequency}
                      onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Once daily (1-0-0)">Once daily (Morning)</option>
                      <option value="Once daily at night (0-0-1)">Once daily (Night)</option>
                      <option value="Twice daily (1-0-1)">Twice daily (1-0-1)</option>
                      <option value="Thrice daily (1-1-1)">Thrice daily (1-1-1)</option>
                      <option value="Four times a day (1-1-1-1)">Four times a day</option>
                      <option value="As needed (PRN)">As needed (PRN)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 days, 1 month"
                      value={item.duration}
                      onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="After food, with water"
                      value={item.instructions}
                      onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(idx)}
                      disabled={prescriptionItems.length === 1}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl disabled:opacity-30 transition-colors"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
            <span className="text-xs text-slate-500">
              Submitting will generate an official digital prescription and advance appointment to <strong>COMPLETED</strong>.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Back to Queue
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Generating Prescription...' : 'Issue Prescription & Complete Consult'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <EmptyState
          title="No patient selected"
          description="Select an appointment from your queue to open the consultation workspace."
        />
      )}
    </div>
  );
};
