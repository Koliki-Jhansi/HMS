import axios from 'axios';

/**
 * Dynamically resolves the API Base URL:
 * - Uses VITE_API_URL if defined in environment variables.
 * - In Production (or on Vercel deployment), points directly to Render backend: https://hms-khdj.onrender.com/api
 * - In Local Development, points to '/api' (proxied by Vite to http://localhost:5000)
 */
const getBaseURL = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    const raw = String(envUrl).replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  // If running on Vercel or any non-localhost host in production
  const isProd = Boolean((import.meta as any).env?.PROD);
  const isRemoteHost =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (isProd || isRemoteHost) {
    return 'https://hms-khdj.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle auth expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token only if on a protected call
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
