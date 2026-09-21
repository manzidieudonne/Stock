import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'User'>('User');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Name is required');
        await register(name.trim(), email.trim(), password, role);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (type: 'admin' | 'staff') => {
    setIsRegister(false);
    setError('');
    if (type === 'admin') {
      setEmail('admin@stockflow.com');
      setPassword('admin123');
    } else {
      setEmail('staff@stockflow.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 text-white mb-4">
          <Boxes className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          StockFlow MERN
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Production-Ready Enterprise Stock & Inventory Management
        </p>

        {/* Demo One-Click Fill Cards */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Account Sign-In:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-autofill-admin"
              onClick={() => autofillDemo('admin')}
              className="p-2 rounded-xl bg-violet-950/70 border border-violet-700/50 hover:border-violet-500 text-left transition-all"
            >
              <div className="flex items-center gap-1 text-xs font-bold text-violet-300">
                <ShieldCheck className="w-3 h-3" /> Admin
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">admin@stockflow.com</div>
              <div className="text-[10px] text-violet-400 font-mono">pw: admin123</div>
            </button>

            <button
              type="button"
              id="btn-autofill-staff"
              onClick={() => autofillDemo('staff')}
              className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-700/50 hover:border-emerald-500 text-left transition-all"
            >
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                <UserIcon className="w-3 h-3" /> Staff User
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">staff@stockflow.com</div>
              <div className="text-[10px] text-emerald-400 font-mono">pw: staff123</div>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-base font-bold text-white">
              {isRegister ? 'Register StockFlow Account' : 'Sign In with Credentials'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              {isRegister ? 'Have an account? Sign in' : 'Create new account'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  id="input-auth-email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  id="input-auth-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('User')}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'User'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Staff / User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      role === 'Admin'
                        ? 'bg-violet-950/80 border-violet-500 text-violet-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>{isRegister ? 'Complete Registration' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
