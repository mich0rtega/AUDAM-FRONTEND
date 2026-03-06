import api from './api';
import { Asset } from '../types';

export const assetsService = {
  list: async (): Promise<Asset[]> => {
    const response = await api.get('/assets');
    return response.data;
  },

  getById: async (id: string): Promise<Asset> => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Asset> => {
    const response = await api.post('/assets', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Asset> => {
    const response = await api.patch(`/assets/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: string, statusId: string): Promise<Asset> => {
    const response = await api.patch(`/assets/${id}/status`, { statusId });
    return response.data;
  },

  transfer: async (id: string, data: any): Promise<Asset> => {
    const response = await api.post(`/assets/${id}/transfer`, data);
    return response.data;
  },

  history: async (id: string) => {
    const response = await api.get(`/assets/${id}/history`);
    return response.data;
  },

  // Movimientos de stock (entradas / salidas)
  createMovement: async (id: string, data: {
    direction: 'IN' | 'OUT';
    quantity: number;
    observations?: string;
  }) => {
    const response = await api.post(`/assets/${id}/movements`, data);
    return response.data;
  },

  listMovements: async (id: string) => {
    const response = await api.get(`/assets/${id}/movements`);
    return response.data;
  },
};
