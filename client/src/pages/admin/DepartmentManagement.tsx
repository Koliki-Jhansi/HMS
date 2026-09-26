import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  Brain,
  Baby,
  Activity,
} from 'lucide-react';
import api from '../../services/api';
import { Department } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, {
          name,
          code,
          description,
        });
      } else {
        await api.post('/departments', {
          name,
          code,
          description,
        });
      }

      setShowModal(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clinical department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            Clinical Units & Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configure hospital divisions, specialty codes, and physician allocations.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create Department
        </button>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving clinical department directory..." />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create your first hospital department to start assigning physicians."
          actionText="Create Department"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 p-5 shadow-xl hover:border-blue-400/40 transition-all flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{dept.name}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {dept.description || 'Specialized clinical healthcare division of HIRO Hospital.'}
                </p>

                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                    {dept.doctors?.length || 0} Physicians
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {dept.id.slice(-6)}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(dept)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-300" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-400/30 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Department Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingDept ? `Edit Department: ${editingDept.name}` : 'Create Clinical Department'}
          subtitle="Define hospital clinical division metadata"
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cardiology, Neurology, Pediatrics"
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Department Code / Abbreviation *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CARD, NEUR, PEDI"
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Clinical Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of medical practice, emergency duties..."
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentManagement;
