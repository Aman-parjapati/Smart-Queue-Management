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
    <div className="relative min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md relative">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SQ</div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900">SmartQueue</span>
          </Link>

          {/* Nav links in center for marketing feel */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link to="/" className="nav-pill-item">Home</Link>
            <a href="#features" className="nav-pill-item">Features</a>
            <a href="#how-it-works" className="nav-pill-item">Solutions</a>
            <a href="#pricing" className="nav-pill-item">Pricing</a>
            <a href="#faq" className="nav-pill-item">FAQ</a>
          </div>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                {/* Home Icon */}
                <Link to="/" className="text-slate-500 hover:text-brand-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100" title="Home">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>

                {(user.role === 'admin' || user.role === 'staff') && (
                  <Link to="/admin" className="nav-pill-item text-sm">
                    Dashboard
                  </Link>
                )}
                {user.role === 'customer' && (
                  <Link to="/bookings" className="nav-pill-item text-sm">
                    My Bookings
                  </Link>
                )}

                {/* Profile Icon */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-slate-500 hover:text-brand-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                  title="Profile"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                <span className="text-sm text-slate-600 hidden sm:block font-medium">{user.name}</span>
                <span className={`badge hidden sm:inline-flex ${user.role === 'admin' ? 'bg-brand-50 text-brand-700' : user.role === 'staff' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {user.role}
                </span>
                <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login/admin" className="text-sm text-slate-500 hover:text-brand-600 transition-colors hidden sm:block font-medium">Staff</Link>
                <Link to="/login" className="text-sm text-slate-650 hover:text-brand-600 transition-colors font-semibold px-2">Login</Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4 shadow-sm">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-slate-100 bg-white py-6 text-center text-slate-500 text-sm">
        SmartQueue © {new Date().getFullYear()} — Skip the wait.
      </footer>

      {/* Profile dialogue box */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
