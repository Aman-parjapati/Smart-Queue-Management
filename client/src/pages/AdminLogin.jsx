import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { loginAdmin, loginStaff } = useAuth();
  const navigate = useNavigate();
  const [role, setRole]     = useState('admin');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const fn   = role === 'admin' ? loginAdmin : loginStaff;
      const user = await fn(email, password);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-900/40 border border-brand-700/40 mb-4">
            <span className="text-xl">🔐</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Staff Portal</h1>
          <p className="text-slate-400 text-sm">For business admins and staff only</p>
        </div>

        <div className="card">
          <div className="flex gap-1 bg-surface-900 rounded-xl p-1 mb-5">
            {['admin', 'staff'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all
                  ${role === r ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {r === 'admin' ? '🏢 Admin' : '👤 Staff'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                placeholder="email@example.com"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'Admin' : 'Staff'}`}
            </button>
          </form>

          <div className="border-t border-slate-700 mt-5 pt-4 text-center">
            <p className="text-slate-500 text-xs">
              Customer?{' '}
              <Link to="/login" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">
                Customer login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}