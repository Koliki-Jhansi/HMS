import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  FileText,
  Calendar,
  Pill,
  UserCheck,
  Stethoscope,
  Activity,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { Patient } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const MyPatients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchDoctorPatients();
  }, []);

  const fetchDoctorPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors/patients');
      if (res.data.success) {
        setPatients(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load doctor patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medicalRecordNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bloodGroup?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Assigned Patients Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review patient medical histories, contact details, and past prescriptions under your clinical supervision.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex items-center justify-between">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, MRN, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 hidden sm:block">
          Total Patients: {filtered.length}
        </span>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <LoadingSpinner text="Loading patient records..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="Patients who have consulted or scheduled visits with you will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <img
                    src={
                      patient.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        patient.user.name
                      )}&background=0f766e&color=fff&bold=true`
                    }
                    alt={patient.user.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/20 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{patient.user.name}</h3>
                    <p className="text-[11px] font-mono text-brand-700 font-semibold">
                      {patient.medicalRecordNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Blood: <strong className="text-slate-700">{patient.bloodGroup || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Gender: <strong className="text-slate-700">{patient.gender || 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{patient.user.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{patient.user.email}</span>
                  </div>
                  {patient.allergies && (
                    <p className="text-[11px] text-rose-600 font-semibold pt-1">
                      ⚠️ Allergies: {patient.allergies}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Patient Health Profile: ${selectedPatient.user.name}`}
          subtitle={`MRN: ${selectedPatient.medicalRecordNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Gender</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedPatient.gender || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedPatient.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Blood Group</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedPatient.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Contact</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedPatient.user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <p>
                <strong>Residential Address:</strong> {selectedPatient.address || 'N/A'}
              </p>
              <p>
                <strong>Emergency Contact:</strong> {selectedPatient.emergencyContactName || 'N/A'} ({selectedPatient.emergencyContactPhone || 'N/A'})
              </p>
              <p className="text-rose-700 font-semibold">
                <strong>Documented Allergies:</strong> {selectedPatient.allergies || 'None'}
              </p>
              <p className="text-amber-700 font-semibold">
                <strong>Chronic Conditions:</strong> {selectedPatient.chronicConditions || 'None'}
              </p>
            </div>

            {/* Prescriptions under this doctor */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Recent Issued Prescriptions
              </span>
              {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                <div className="space-y-2">
                  {selectedPatient.prescriptions.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{p.diagnosis}</span>
                        <span className="font-mono text-brand-600">{p.prescriptionNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Issued on: {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No past prescriptions on record.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
