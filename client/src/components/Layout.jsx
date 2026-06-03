import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    </div>
  );
}
