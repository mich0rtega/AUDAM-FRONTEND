import api from './api';

export const dashboardService = {
  getOverview: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};
