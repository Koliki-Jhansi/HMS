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
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Assigned Patients Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Review patient electronic health records, contact details, and clinical histories.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex items-center justify-between text-white">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, MRN, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-500"
          />
        </div>
        <span className="text-xs font-bold text-cyan-300 hidden sm:block">
          Total Assigned: {filtered.length} Patients
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
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-cyan-400/40 transition-all flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <img
                    src={
                      patient.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        patient.user.name
                      )}&background=0284c7&color=fff&bold=true`
                    }
                    alt={patient.user.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/30 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-md">
                      {patient.medicalRecordNumber}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{patient.user.name}</h3>
                    <p className="text-xs text-slate-300">
                      Blood Group: <strong className="text-cyan-300">{patient.bloodGroup || 'Not recorded'}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{patient.user.phone || 'Phone not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{patient.user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-400/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Patient File
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient EHR Summary Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Electronic Health Record: ${selectedPatient.user.name}`}
          subtitle={`MRN #${selectedPatient.medicalRecordNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                <span className="font-bold text-white">{selectedPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                <span className="font-bold text-cyan-300">{selectedPatient.bloodGroup || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                <span className="font-bold text-white">{selectedPatient.emergencyContactName || (selectedPatient as any).emergencyContact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total History Records</span>
                <span className="font-bold text-white">{selectedPatient.medicalRecords?.length || 0}</span>
              </div>
            </div>

            {selectedPatient.address && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 text-xs">
                <span className="font-bold text-slate-400 block text-[10px] uppercase">Registered Address</span>
                <p className="text-slate-200 mt-0.5">{selectedPatient.address}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
              >
                Close Patient File
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPatients;
