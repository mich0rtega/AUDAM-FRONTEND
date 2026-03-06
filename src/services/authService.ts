import api, { setCsrfToken, clearCsrfToken } from './api';
import { LoginRequest, User, UserEnvironment } from '../types';

export const authService = {

  // Paso 1: Login → guarda CSRF token
  login: async (credentials: LoginRequest): Promise<void> => {
    const loginRes = await api.post('/auth/login', credentials);
    const data = loginRes.data;
    if (data?.csrf?.token) {
      setCsrfToken(data.csrf.token, data.csrf.headerName);
    }
  },

  // Paso 2: Obtener usuario actual → { user: { userId, email } }
  getProfile: async (): Promise<{ userId: string; email: string }> => {
    const response = await api.get('/auth/me');
    // El backend devuelve { user: { userId, email } }
    return response.data.user ?? response.data;
  },

  // Paso 3: Obtener entornos disponibles → [{ id, name, role }]
  getEnvironments: async (): Promise<UserEnvironment[]> => {
    const response = await api.get('/auth/environments');
    // El backend devuelve [{ id, name, role }]
    return response.data.map((e: any) => ({
      environmentId: e.id,
      role: e.role || 'USUARIO',
      environment: { id: e.id, name: e.name },
    }));
  },

  // Paso 4: Seleccionar entorno
  selectEnvironment: async (environmentId: string): Promise<void> => {
    await api.post('/auth/select-environment', { environmentId });
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    if (response.data?.csrf?.token) {
      setCsrfToken(response.data.csrf.token, response.data.csrf.headerName);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearCsrfToken();
    }
  },
};
