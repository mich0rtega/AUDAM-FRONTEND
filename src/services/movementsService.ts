import api from './api';

export const movementsService = {
  // Listar todos los movimientos del entorno
  list: async () => {
    const response = await api.get('/movements');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/movements/${id}`);
    return response.data;
  },

  // Crear movimiento con múltiples productos
  // Body: { typeId, costCenterId?, observations?, details: [{ productId, quantity, unitPrice }] }
  create: async (data: {
    typeId: string;
    costCenterId?: string;
    observations?: string;
    details: { productId: string; quantity: number; unitPrice: number; observations?: string }[];
  }) => {
    const response = await api.post('/movements', data);
    return response.data;
  },
};
