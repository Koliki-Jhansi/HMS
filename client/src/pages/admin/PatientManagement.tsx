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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Patient Directory & Electronic Medical Profiles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search and review registered patient master files, medical record numbers (MRN), and inpatient admissions.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, MRN, email, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
            <button
              key={bg}
              onClick={() => setBloodFilter(bg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                bloodFilter === bg
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Table */}
      {loading ? (
        <LoadingSpinner text="Loading patient database..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No patients found"
          description="There are no patients registered matching your search."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">MRN #</th>
                  <th className="p-4">Gender & DOB</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Inpatient Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((patient) => {
                  const activeAdm =
                    patient.admissions && patient.admissions.length > 0 ? patient.admissions[0] : null;

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              patient.user.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                patient.user.name
                              )}&background=0f766e&color=fff&bold=true`
                            }
                            alt={patient.user.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/20"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{patient.user.name}</p>
                            <p className="text-[11px] text-slate-400">{patient.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-brand-700">
                        {patient.medicalRecordNumber}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{patient.gender || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400">{patient.dateOfBirth || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {patient.user.phone || 'No phone'}
                      </td>
                      <td className="p-4">
                        {activeAdm ? (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Admitted ({activeAdm.bed.ward.name} Bed {activeAdm.bed.bedNumber})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                            Outpatient
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 ml-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Patient Health Profile: ${selectedPatient.user.name}`}
          subtitle={`MRN: ${selectedPatient.medicalRecordNumber}`}
          maxWidth="lg"
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
                <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
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
                <strong>Known Allergies:</strong> {selectedPatient.allergies || 'None declared'}
              </p>
              <p className="text-amber-700 font-semibold">
                <strong>Chronic Conditions:</strong> {selectedPatient.chronicConditions || 'None'}
              </p>
              <p>
                <strong>Insurance Provider:</strong> {selectedPatient.insuranceProvider || 'Self-pay'} ({selectedPatient.insurancePolicyNumber || 'N/A'})
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
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
