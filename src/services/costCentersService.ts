import api from './api';
import { CostCenter } from '../types';

export const costCentersService = {
  list: async (): Promise<CostCenter[]> => {
    const response = await api.get('/cost-centers');
    return response.data;
  },

  create: async (data: any): Promise<CostCenter> => {
    const response = await api.post('/cost-centers', data);
    return response.data;
  },

  toggle: async (id: string): Promise<CostCenter> => {
    const response = await api.patch(`/cost-centers/${id}/toggle`);
    return response.data;
  },
};
