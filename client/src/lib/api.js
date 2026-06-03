import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url && (err.config.url.includes('/auth/login') || err.config.url.includes('/auth/register'));
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('sq_token');
      localStorage.removeItem('sq_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;