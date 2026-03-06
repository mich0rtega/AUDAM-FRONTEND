import api from './api';
import { Provider } from '../types';

export const providersService = {
  list: async (): Promise<Provider[]> => {
    const response = await api.get('/providers');
    return response.data;
  },
  getById: async (id: string): Promise<Provider> => {
    const response = await api.get(`/providers/${id}`);
    return response.data;
  },
  create: async (data: any): Promise<Provider> => {
    const response = await api.post('/providers', data);
    return response.data;
  },
  update: async (id: string, data: any): Promise<Provider> => {
    // Backend uses PUT /:id (not PATCH)
    const response = await api.put(`/providers/${id}`, data);
    return response.data;
  },
  toggle: async (id: string): Promise<Provider> => {
    const response = await api.patch(`/providers/${id}/toggle`);
    return response.data;
  },
};
