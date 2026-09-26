import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Heart,
  BedDouble,
  FileText,
  Calendar,
  Eye,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { Patient } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { HospitalHeader3D } from '../../components/3d/HospitalHeader3D';

export const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState<string>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [bloodFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const url =
        bloodFilter === 'ALL' ? '/patients' : `/patients?bloodGroup=${encodeURIComponent(bloodFilter)}`;
      const res = await api.get(url);
      if (res.data.success) {
        setPatients(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.user.name.toLowerCase().includes(q) ||
      p.medicalRecordNumber.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      (p.user.phone && p.user.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* 3D Moving Hospital Ward Header */}
      <HospitalHeader3D
        type="ward"
        badge="Electronic Health Records (EHR)"
        title="Patient Directory & Profiles"
        subtitle="Search and review registered patient master files, medical record numbers (MRN), and inpatient admissions."
      />

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, MRN, email, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
            <button
              key={bg}
              onClick={() => setBloodFilter(bg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                bloodFilter === bg
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving patient records..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="No patients match your search query."
        />
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-slate-950/70 border-b border-white/10 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Patient Profile</th>
                  <th className="py-3.5 px-4">Medical Record #</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/20">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={
                          patient.user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            patient.user.name
                          )}&background=0284c7&color=fff&bold=true`
                        }
                        alt={patient.user.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-blue-500/30"
                      />
                      <div>
                        <strong className="text-white block">{patient.user.name}</strong>
                        <span className="text-[11px] text-slate-400 capitalize">{patient.gender ? patient.gender.toLowerCase() : 'Unspecified'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
                        {patient.medicalRecordNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-300">{patient.user.email}</p>
                      <p className="text-slate-400 text-[11px]">{patient.user.phone || 'Phone N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-400/30">
                        {patient.bloodGroup || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(patient.user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-400/30 flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Master EHR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Master EHR Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Master Patient File: ${selectedPatient.user.name}`}
          subtitle={`MRN #${selectedPatient.medicalRecordNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                <span className="font-bold text-white">{selectedPatient.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                <span className="font-bold text-rose-300">{selectedPatient.bloodGroup || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                <span className="font-bold text-white">{selectedPatient.emergencyContactName || (selectedPatient as any).emergencyContact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Consultations</span>
                <span className="font-bold text-white">{selectedPatient.appointments?.length || 0}</span>
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
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

export default PatientManagement;
