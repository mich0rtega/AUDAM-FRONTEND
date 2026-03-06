import api from './api';
import { AuditLog } from '../types';

export const auditService = {
  list: async (params?: { page?: number; limit?: number }): Promise<AuditLog[]> => {
    const response = await api.get('/audit', { params });
    return response.data;
  },
};
