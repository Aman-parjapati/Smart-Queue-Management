import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400">Join SmartQueue — it's free</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name',    key: 'name',     type: 'text',     placeholder: 'Ravi Kumar',          required: true  },
              { label: 'Email',        key: 'email',    type: 'email',    placeholder: 'ravi@example.com',    required: true  },
              { label: 'Phone',        key: 'phone',    type: 'tel',      placeholder: '+91 98765 43210',     required: false },
              { label: 'Password',     key: 'password', type: 'password', placeholder: '8+ characters',       required: true  },
            ].map(({ label, key, type, placeholder, required }) => (
              <div key={key}>
                <label className="block text-sm text-slate-700 dark:text-slate-350 mb-1.5 font-medium">{label}</label>
                <input
                  type={type} required={required} className="input"
                  value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold">Sign in</Link>
          </p>

          {/* Soft link for admins/staff */}
          <div className="border-t border-slate-100 dark:border-slate-800 mt-5 pt-4 text-center">
            <p className="text-slate-500 text-xs font-medium">
              Business admin or staff?{' '}
              <Link to="/login/admin" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline underline-offset-2 font-semibold">
                Staff & Admin login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
