import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import ProfileModal from './ProfileModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-surface-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SQ</div>
            <span className="font-display font-bold text-lg tracking-tight">SmartQueue</span>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                {/* Home Icon */}
                <Link to="/" className="text-slate-450 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/60" title="Home">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>

                {(user.role === 'admin' || user.role === 'staff') && (
                  <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
                    Dashboard
                  </Link>
                )}
                {user.role === 'customer' && (
                  <Link to="/bookings" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
                    My Bookings
                  </Link>
                )}

                {/* Profile Icon */}
                <button 
                  onClick={() => setShowProfileModal(true)} 
                  className="text-slate-455 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/60" 
                  title="Profile"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                <span className="text-sm text-slate-400 hidden sm:block">{user.name}</span>
                <span className={`badge hidden sm:inline-flex ${user.role === 'admin' ? 'bg-brand-900/40 text-brand-400' : user.role === 'staff' ? 'bg-amber-900/40 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  {user.role}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login/admin" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Staff</Link>
                <Link to="/login"       className="text-sm text-slate-300 hover:text-white transition-colors">Login</Link>
                <Link to="/register"    className="btn-primary text-sm py-2 px-4">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        SmartQueue © {new Date().getFullYear()} — Skip the wait.
      </footer>

      {/* Profile dialogue box */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
