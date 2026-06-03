import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import AdminLogin     from './pages/AdminLogin';
import BookSlot       from './pages/BookSlot';
import MyToken        from './pages/MyToken';
import AdminDashboard from './pages/AdminDashboard';
import QueueBoard     from './pages/QueueBoard';
import MyBookings     from './pages/MyBookings';
import Layout         from './components/Layout';

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
      </BrowserRouter>
    </AuthProvider>
  );
}
