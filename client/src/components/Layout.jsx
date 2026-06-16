import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import ProfileModal from './ProfileModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const directoryLink = (
    <Link
      to="/directory"
      className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      title="Businesses Directory"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </Link>
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-surface-200 dark:border-surface-700/80 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md relative">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">SQ</div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white hidden sm:block">SmartQueue</span>
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

          <nav className="hidden sm:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  {/* Home Icon */}
                  <Link to="/" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Home">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </Link>

                  {directoryLink}
                  {themeToggle}
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/80" />

                {user.role === 'customer' && (
                  <Link to="/bookings" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5" title="My Bookings">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="text-sm font-medium">My Bookings</span>
                  </Link>
                )}

                {(user.role === 'admin' || user.role === 'staff') && (
                  <Link to="/admin" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5" title="Dashboard">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                    </svg>
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                )}

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/80" />

                {/* Profile Icon and name grouped */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  title="Profile"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium">{user.name}</span>
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/80" />

                <button
                  onClick={handleLogout}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {directoryLink}
                {themeToggle}
                <Link to="/login/admin" className="text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors hidden sm:block font-medium">Staff</Link>
                <Link to="/login" className="text-sm text-slate-650 hover:text-brand-600 dark:text-slate-350 dark:hover:text-brand-400 transition-colors font-semibold px-2">Login</Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4 shadow-sm">Sign up</Link>
              </>
            )}
          </nav>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
            type="button"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 animate-fade-in" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 animate-fade-in" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`sm:hidden fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Mobile Menu Side Drawer */}
      <div className={`sm:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-surface-950 z-[100] p-6 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}>
        {/* Top content */}
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center text-surface-900 font-bold text-sm">SQ</div>
              <span className="font-display font-bold text-base text-slate-900 dark:text-white">SmartQueue</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Close Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {user ? (
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                Home
              </Link>
              <Link
                to="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                Businesses Directory
              </Link>
              {user.role === 'customer' && (
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
                >
                  My Bookings
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'staff') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-3 py-2 w-full text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                Profile
              </button>
              
              <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
                <span className="text-slate-750 dark:text-slate-250 text-sm font-semibold flex items-center">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
                {themeToggle}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                Businesses Directory
              </Link>
              
              <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
                <span className="text-slate-750 dark:text-slate-250 text-sm font-semibold flex items-center">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
                {themeToggle}
              </div>

              <Link
                to="/login/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all"
              >
                Staff Portal
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Actions Container */}
        <div>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-3 py-2 w-full text-left rounded-xl hover:bg-red-50 dark:hover:bg-red-950/25 text-red-650 dark:text-red-400 text-sm font-bold transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <div className="flex gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary text-sm py-2 px-4 flex-1 text-center font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-sm py-2 px-4 flex-1 text-center font-bold"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <main key={location.pathname} className="flex-1 relative z-10 animate-fade-in">
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
