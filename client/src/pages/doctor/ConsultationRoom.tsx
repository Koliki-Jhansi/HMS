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
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2.5">
          <Stethoscope className="w-7 h-7 text-cyan-400" />
          Clinical Consultation & Rx Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Conduct patient evaluations, document clinical diagnoses, and generate multi-drug prescriptions.
        </p>
      </div>

      {/* Patient Selector Switcher Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white">
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
            className="w-full md:w-80 px-3.5 py-2 bg-slate-950/60 border border-white/20 rounded-xl text-xs font-bold text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                {a.patient?.user?.name} ({a.appointmentDate} - {a.timeSlot}) [{a.status}]
              </option>
            ))}
          </select>
        </div>

        {selectedAppointment && (
          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="text-xs font-semibold text-slate-300">
              Appointment #{selectedAppointment.appointmentNumber}
            </span>
            <Badge status={selectedAppointment.status} size="sm" />
          </div>
        )}
      </div>

      {selectedAppointment ? (
        <form onSubmit={handleSubmitConsultation} className="space-y-6">
          {/* Patient Quick Summary Banner */}
          <div className="bg-slate-900/45 backdrop-blur-xl rounded-3xl border border-white/15 p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedAppointment.patient?.user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedAppointment.patient?.user?.name
                  )}&background=0f766e&color=fff&bold=true`
                }
                alt={selectedAppointment.patient?.user?.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-400/40"
              />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedAppointment.patient?.user?.name}
                </h3>
                <p className="text-xs text-cyan-200 mt-0.5">
                  MRN: <span className="font-mono font-bold text-white">{selectedAppointment.patient?.medicalRecordNumber}</span> • Gender: {selectedAppointment.patient?.gender || 'N/A'} • Blood Group: <span className="text-cyan-300 font-bold">{selectedAppointment.patient?.bloodGroup || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Reason for visit: <strong className="text-white">{selectedAppointment.reason}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/10 text-xs space-y-1 backdrop-blur-md">
              <p className="text-slate-300">
                Known Allergies:{' '}
                <strong className="text-rose-300">{selectedAppointment.patient?.allergies || 'None declared'}</strong>
              </p>
              <p className="text-slate-300">
                Chronic Conditions:{' '}
                <strong className="text-amber-300">{selectedAppointment.patient?.chronicConditions || 'None'}</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Clinical Diagnosis & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-3">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                Primary Clinical Diagnosis *
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension Stage 1..."
                className="w-full p-3 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />

              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block pt-2">
                Follow-up Date (Optional)
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2.5 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-3">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                Doctor's Clinical Notes & Advice
              </label>
              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Document patient examination observations, dietary recommendations, lifestyle adjustments..."
                className="w-full p-3 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 leading-relaxed"
              />
            </div>
          </div>

          {/* Prescription Medicine Items Table */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300">
                <Pill className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Prescribed Medication Regimens (Rx)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {prescriptionItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 bg-slate-950/40 border border-white/10 rounded-2xl items-center"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Drug / Medicine Name
                    </label>
                    <input
                      type="text"
                      required
                      value={item.medicineName}
                      onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                      placeholder="e.g. Amoxicillin, Paracetamol"
                      className="w-full p-2 bg-slate-900/80 border border-white/15 rounded-lg text-xs text-white focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full p-2 bg-slate-900/80 border border-white/15 rounded-lg text-xs text-white focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                      placeholder="e.g. 1-0-1"
                      className="w-full p-2 bg-slate-900/80 border border-white/15 rounded-lg text-xs text-white focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Duration</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      placeholder="e.g. 5 days"
                      className="w-full p-2 bg-slate-900/80 border border-white/15 rounded-lg text-xs text-white focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                      placeholder="e.g. After meal"
                      className="w-full p-2 bg-slate-900/80 border border-white/15 rounded-lg text-xs text-white focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicineRow(index)}
                      disabled={prescriptionItems.length === 1}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-70 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              {submitting ? 'Finalizing Consultation...' : 'Complete Consultation & Issue Rx'}
            </button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="No Active Consultation Selected"
          description="Select an appointment from your queue to begin documenting clinical diagnosis and prescriptions."
        />
      )}
    </div>
  );
};

export default ConsultationRoom;
