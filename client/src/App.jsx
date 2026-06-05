import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout         from './components/Layout';

const Home           = lazy(() => import('./pages/Home'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const AdminLogin     = lazy(() => import('./pages/AdminLogin'));
const BookSlot       = lazy(() => import('./pages/BookSlot'));
const MyToken        = lazy(() => import('./pages/MyToken'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const QueueBoard     = lazy(() => import('./pages/QueueBoard'));
const MyBookings     = lazy(() => import('./pages/MyBookings'));

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-400 select-none">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen flex items-center justify-center text-slate-400 animate-pulse">
      Loading…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/"                  element={<Home />} />
              <Route path="/login"             element={<Login />} />
              <Route path="/register"          element={<Register />} />
              <Route path="/login/admin"       element={<AdminLogin />} />
              <Route path="/board/:businessId" element={<QueueBoard />} />

              <Route path="/book/:businessId"  element={
                <RequireAuth><BookSlot /></RequireAuth>
              } />
              <Route path="/token/:bookingId"  element={
                <RequireAuth><MyToken /></RequireAuth>
              } />
              <Route path="/bookings"          element={
                <RequireAuth><MyBookings /></RequireAuth>
              } />
              <Route path="/admin"             element={
                <RequireAuth roles={['admin', 'staff']}><AdminDashboard /></RequireAuth>
              } />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
