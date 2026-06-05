import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUserLocalState } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Sync form states with user data when modal opens
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isCustomer = user.role === 'customer';

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {};
    if (isCustomer) {
      payload.name = name;
      payload.email = email;
      payload.phone = phone;
    } else {
      payload.phone = phone;
      if (password.trim()) {
        payload.password = password;
      }
    }

    try {
      const { data } = await api.put('/auth/profile', payload);
      updateUserLocalState(data.user);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-surface-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-slide-up origin-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 select-none">
          <h3 className="font-display font-bold text-xl text-white">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isCustomer ? (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Name</label>
                <input
                  type="text"
                  required
                  className="input text-sm py-2.5"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  className="input text-sm py-2.5"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mobile Number</label>
                <input
                  type="tel"
                  className="input text-sm py-2.5"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 90000 00000"
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 select-none mb-2">
                <p className="text-xs text-slate-400">Account Role</p>
                <p className="text-sm font-semibold text-slate-200 capitalize mt-0.5">{user.role}</p>
                <p className="text-xs text-slate-500 mt-1">Email (cannot be changed): {user.email}</p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mobile Number</label>
                <input
                  type="tel"
                  className="input text-sm py-2.5"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 90000 00000"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">New Password</label>
                <input
                  type="password"
                  className="input text-sm py-2.5"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 select-none">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary text-sm py-2 flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary text-sm py-2 flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
