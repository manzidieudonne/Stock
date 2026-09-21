import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  X,
  Mail,
  Calendar,
  Lock,
  ArrowRightLeft,
} from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface UsersViewProps {
  users: User[];
  onCreateUser: (user: { name: string; email: string; password: string; role: 'Admin' | 'User' }) => Promise<void>;
  onUpdateRole: (id: string, role: 'Admin' | 'User') => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onCreateUser,
  onUpdateRole,
  onDeleteUser,
}) => {
  const { user: currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'User'>('User');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onCreateUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('User');
    } catch (err: any) {
      setError(err.message || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = async (u: User) => {
    const newRole = u.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Change role of "${u.name}" from ${u.role} to ${newRole}?`)) return;
    try {
      await onUpdateRole(u.id, newRole);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${u.name}" (${u.email})?`)) return;
    try {
      await onDeleteUser(u.id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            User Management & RBAC Permissions
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin privilege: Configure user accounts, assign roles, and revoke system access.
          </p>
        </div>

        <button
          id="btn-add-user"
          onClick={() => {
            setError('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* RBAC Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            Administrator Role Capabilities
          </div>
          <p className="text-violet-700">
            Full system control: User provisioning & role management, Product creation/editing/deletion, Categories & Suppliers setup, Financial valuation telemetry, and Audit log inspection.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
            <UserIcon className="w-4 h-4 text-emerald-600" />
            Standard User (Staff / Warehouse) Role
          </div>
          <p className="text-emerald-700">
            Operational access: Real-time inventory browsing, recording Stock-In (restocks) & Stock-Out (sales dispatches), viewing low-stock alerts, generating inventory reports, and personal profile management.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isCurrent = u.id === currentUser?.id;
                const isAdminRole = u.role === 'Admin';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User name & avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdminRole
                              ? 'bg-violet-100 text-violet-700 border border-violet-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Registered Member
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleRoleToggle(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] transition-all ${
                          isAdminRole
                            ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="Click to toggle role"
                      >
                        {isAdminRole ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        <span>{u.role}</span>
                        <ArrowRightLeft className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </button>
                    </td>

                    {/* Account ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {u.id}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {!isCurrent ? (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Active Session</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Provision User Account
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@stockflow.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned RBAC Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('User')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'User'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Staff User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'Admin'
                        ? 'bg-violet-50 border-violet-500 text-violet-800 ring-2 ring-violet-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating User...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
