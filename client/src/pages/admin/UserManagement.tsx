import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Mail,
  Phone,
  Lock,
  Stethoscope,
  User,
  HeartPulse,
} from 'lucide-react';
import api from '../../services/api';
import { User as UserType, Role } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ADMIN',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [targetRole, setTargetRole] = useState<Role>('ADMIN');
  const [targetStatus, setTargetStatus] = useState<string>('ACTIVE');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = roleFilter === 'ALL' ? '/users' : `/users?role=${roleFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/users', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'ADMIN',
        });
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.patch(`/users/${editingUser.id}/status`, {
        role: targetRole,
        status: targetStatus,
      });

      if (res.data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-white select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
            Staff & User Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage hospital accounts, security roles, access permissions, and authentication credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create Staff Account
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'ADMIN', 'DOCTOR', 'PATIENT'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                roleFilter === r
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-md backdrop-blur-md'
                  : 'bg-slate-950/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving registered system users..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No user accounts match your search and filter criteria."
        />
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/15 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-slate-950/70 border-b border-white/10 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            u.name
                          )}&background=0284c7&color=fff&bold=true`
                        }
                        alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-blue-500/30"
                      />
                      <div>
                        <strong className="text-white block">{u.name}</strong>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={u.role} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {u.phone || 'Phone not set'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setTargetRole(u.role);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-400/30 flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create Staff User"
          subtitle="Provision administrative or clinical portal credentials"
          maxWidth="md"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
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
                placeholder="staff@hospital.com"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Access Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
                >
                  <option value="ADMIN" className="bg-slate-900 text-white">ADMIN</option>
                  <option value="DOCTOR" className="bg-slate-900 text-white">DOCTOR</option>
                  <option value="PATIENT" className="bg-slate-900 text-white">PATIENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555)..."
                  className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
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
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
          subtitle={`Account Email: ${editingUser.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Assigned Security Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as Role)}
                className="w-full p-2.5 bg-slate-950/60 border border-white/20 rounded-xl text-xs text-white focus:border-blue-400"
              >
                <option value="ADMIN" className="bg-slate-900 text-white">ADMIN (Operations & Admin)</option>
                <option value="DOCTOR" className="bg-slate-900 text-white">DOCTOR (Clinical Suite)</option>
                <option value="PATIENT" className="bg-slate-900 text-white">PATIENT (Health Portal)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
              >
                {submitting ? 'Updating...' : 'Save Permissions'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
