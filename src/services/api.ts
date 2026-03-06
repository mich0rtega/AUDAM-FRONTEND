import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Lee el CSRF de la cookie que pone el backend (csrf_token, NO es httpOnly)
// Esto sobrevive recargas de página sin necesidad de guardar en memoria
function getCsrfFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

let manualCsrfToken: string | null = null;
export const setCsrfToken = (token: string) => { manualCsrfToken = token; };
export const clearCsrfToken = () => { manualCsrfToken = null; };

// Inyecta CSRF en cada request mutante
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase() || '';
  if (!['get', 'head', 'options'].includes(method)) {
    const token = manualCsrfToken || getCsrfFromCookie();
    if (token) config.headers['x-csrf-token'] = token;
  }
  return config;
});

// Refresh automático en 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve());
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (orig?.url?.includes('/auth/refresh')) {
      clearCsrfToken();
      if (window.location.pathname !== '/login') window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => api(orig)).catch(e => Promise.reject(e));
      }
      orig._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.csrf?.token) setCsrfToken(res.data.csrf.token);
        processQueue(null);
        return api(orig);
      } catch (e) {
        clearCsrfToken();
        processQueue(e);
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
