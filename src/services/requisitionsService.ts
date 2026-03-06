import api from './api';
import { Requisition } from '../types';

export const requisitionsService = {
  list: async (): Promise<Requisition[]> => {
    const response = await api.get('/requisitions');
    return response.data;
  },
  getById: async (id: string): Promise<Requisition> => {
    const response = await api.get(`/requisitions/${id}`);
    return response.data;
  },
  getNextFolio: async (): Promise<{ folio: string }> => {
    const response = await api.get('/requisitions/next-folio');
    return response.data;
  },
  create: async (data: any): Promise<Requisition> => {
    const response = await api.post('/requisitions', data);
    return response.data;
  },
  // ── CORREGIDO: el endpoint es POST (no PATCH) ──────────────────────────────
  authorize: async (id: string, data: { approved: boolean; observations?: string }): Promise<Requisition> => {
    const response = await api.post(`/requisitions/${id}/authorize`, data);
    return response.data;
  },
};
