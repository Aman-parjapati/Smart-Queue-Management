import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import ProfileModal from './ProfileModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sq_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sq_theme', 'light');
    }
  }, [darkMode]);

  const handleThemeToggle = useCallback((e) => {
    // Get click position for the radial flash origin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

    // Create flash overlay
    const overlay = document.createElement('div');
    const goingDark = !darkMode;
    overlay.className = `theme-flash-overlay ${goingDark ? 'theme-flash-overlay--to-dark' : 'theme-flash-overlay--to-light'}`;
    overlay.style.setProperty('--flash-x', `${x}%`);
    overlay.style.setProperty('--flash-y', `${y}%`);
    document.body.appendChild(overlay);

    // Spin the icon
    setSpinning(true);

    // Apply theme change slightly after flash starts
    setTimeout(() => {
      setDarkMode(goingDark);
    }, 70);

    // Clean up overlay + spin
    setTimeout(() => {
      overlay.remove();
      setSpinning(false);
    }, 500);
  }, [darkMode]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const themeToggle = (
    <button
      onClick={handleThemeToggle}
      className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      type="button"
    >
      <span className={`inline-flex ${spinning ? 'theme-toggle-spin' : ''}`}>
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </span>
    </button>
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-surface-200 dark:border-surface-700/80 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md relative">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-surface-900 font-bold text-sm">SQ</div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">SmartQueue</span>
          </Link>

          {/* Nav links in center for marketing feel */}
          {!user && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/" className="nav-pill-item">Home</Link>
              <a href="#features" className="nav-pill-item">Features</a>
              <a href="#how-it-works" className="nav-pill-item">Solutions</a>
              <a href="#pricing" className="nav-pill-item">Pricing</a>
              <a href="#faq" className="nav-pill-item">FAQ</a>
            </div>
          )}

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                {/* Home Icon */}
                <Link to="/" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Home">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>

                {themeToggle}

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
                  className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Profile"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                <span className="text-sm text-slate-650 dark:text-slate-300 hidden sm:block font-medium">{user.name}</span>
                <button onClick={handleLogout} className="btn-secondary text-xs py-1.5 px-3">Logout</button>
              </>
            ) : (
              <>
                {themeToggle}
                <Link to="/login/admin" className="text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors hidden sm:block font-medium">Staff</Link>
                <Link to="/login" className="text-sm text-slate-650 hover:text-brand-600 dark:text-slate-350 dark:hover:text-brand-400 transition-colors font-semibold px-2">Login</Link>
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

      <footer className="relative z-10 border-t border-surface-200 dark:border-surface-700/80 bg-surface-50 dark:bg-surface-950 py-6 text-center text-surface-400 dark:text-surface-400 text-sm">
        SmartQueue © {new Date().getFullYear()} — Skip the wait.
      </footer>

      {/* Profile dialogue box */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
