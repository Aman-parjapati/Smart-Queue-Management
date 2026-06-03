import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { loginCustomer } = useAuth();
  const navigate          = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginCustomer(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
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
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-slate-400">Sign in to your SmartQueue account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input type="email" required className="input"
                value={form.email} placeholder="you@example.com"
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Password</label>
              <input type="password" required className="input"
                value={form.password} placeholder="••••••••"
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300">Register</Link>
          </p>

          <div className="border-t border-slate-700 mt-5 pt-4 text-center">
            <p className="text-slate-500 text-xs">
              Business admin or staff?{' '}
              <Link to="/login/admin" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">
                Staff & Admin login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
