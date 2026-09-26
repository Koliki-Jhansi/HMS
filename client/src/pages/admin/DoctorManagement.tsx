import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Edit,
  Trash2,
  DollarSign,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { Doctor, Department } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { HospitalHeader3D } from '../../components/3d/HospitalHeader3D';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Add Doctor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    qualification: 'MBBS, MD',
    experienceYears: 5,
    consultationFee: 80,
    departmentId: '',
    roomNumber: 'Suite 101',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorsAndDepartments();
  }, []);

  const fetchDoctorsAndDepartments = async () => {
    try {
      setLoading(true);
      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/departments'),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.data);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: deptRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/users', {
        ...formData,
        role: 'DOCTOR',
      });
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          specialization: '',
          licenseNumber: '',
          qualification: 'MBBS, MD',
          experienceYears: 5,
          consultationFee: 80,
          departmentId: departments[0]?.id || '',
          roomNumber: 'Suite 101',
        });
        fetchDoctorsAndDepartments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register physician');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const matchesDept = selectedDept === 'ALL' || doc.departmentId === selectedDept;
    const matchesSearch =
      doc.user.name.toLowerCase().includes(q) ||
      doc.specialization.toLowerCase().includes(q) ||
      doc.licenseNumber.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* 3D Hospital Corridor Header */}
      <HospitalHeader3D
        type="corridor"
        badge="Physicians & Medical Staff"
        title="Physicians & Specialists Directory"
        subtitle="Manage hospital medical staff, credentials, consultation fees, and clinical department assignments."
        actions={
          <button
            onClick={() => {
              setShowAddModal(true);
              setError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Register Doctor
          </button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by physician name or license..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDept === 'ALL'
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            All Units ({doctors.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSpinner text="Querying physician registry..." />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="Click 'Register Doctor' to onboard a new physician."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-blue-400/40 transition-all flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={
                      doc.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        doc.user.name
                      )}&background=0284c7&color=fff&bold=true`
                    }
                    alt={doc.user.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/30">
                      {doc.department?.name || 'General Practice'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Dr. {doc.user.name}</h3>
                    <p className="text-xs text-slate-300">{doc.qualification}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{doc.experienceYears} Years Exp.</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-blue-300 font-bold">${doc.consultationFee} Fee</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{doc.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{doc.user.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Location: {doc.roomNumber || 'Consultation Suite'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">Lic: {doc.licenseNumber}</span>
                <span className="text-emerald-400 font-bold">● Active Roster</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Doctor Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register Medical Specialist"
          subtitle="Add a licensed physician to hospital roster"
          maxWidth="lg"
        >
          <form onSubmit={handleAddDoctor} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@hospital.com"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Clinical Department *
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Specialization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Interventional Cardiology"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. MED-LIC-2026-99"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Consultation Fee (USD) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Consultation Suite Location
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. Suite 204"
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Registering...' : 'Register Physician'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DoctorManagement;
