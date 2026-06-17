import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUserLocalState, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

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
      setConfirmDelete(false);
      setDeleteLoading(false);
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

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/profile');
      toast.success('Account deleted successfully');
      logout();
      onClose();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white dark:bg-surface-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-slide-up origin-center">
        {confirmDelete ? (
          <div className="text-center py-4 select-none">
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">Delete Account</h3>
            <p className="text-sm text-slate-400 mb-6 px-2">
              Are you sure you want to permanently delete your account? This will also cancel all your bookings and queues. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-secondary text-sm py-2 flex-1"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="btn-primary bg-red-600 hover:bg-red-500 border-none text-sm py-2 flex-1 font-semibold"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 select-none">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Edit Profile</h3>
                <span className={`badge uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  user.role === 'admin' 
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300' 
                    : user.role === 'staff' 
                      ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300' 
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
                }`}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
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

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs text-red-500 hover:text-red-400 hover:underline transition-all font-medium"
                    >
                      Permanently delete my account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 select-none mb-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Account Role</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">{user.role}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Name (cannot be changed): {user.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Email (cannot be changed): {user.email}</p>
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
          </>
        )}
      </div>
    </div>
  );
}
