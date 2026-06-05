import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('sq_user');
    const token  = localStorage.getItem('sq_token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  // Customer self-registration
  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    _persist(data);
    return data.user;
  }

  // Customer login
  async function loginCustomer(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    _persist(data);
    return data.user;
  }

  // Admin login
  async function loginAdmin(email, password) {
    const { data } = await api.post('/auth/login/admin', { email, password });
    _persist(data);
    return data.user;
  }

  // Staff login
  async function loginStaff(email, password) {
    const { data } = await api.post('/auth/login/staff', { email, password });
    _persist(data);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('sq_token');
    localStorage.removeItem('sq_user');
    setUser(null);
  }

  function updateUserLocalState(updatedFields) {
    setUser(prev => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('sq_user', JSON.stringify(merged));
      return merged;
    });
  }

  function _persist({ user, token }) {
    localStorage.setItem('sq_token', token);
    localStorage.setItem('sq_user', JSON.stringify(user));
    setUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, register, loginCustomer, loginAdmin, loginStaff, logout, updateUserLocalState, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
