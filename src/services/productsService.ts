import api from './api';
import { Product } from '../types';

export const productsService = {
  list: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // POST /products — el backend solo guarda: typeId, statusId, proveedorId, marca, modelo, especificacion, precioUnitario
  // SKU, unit y stockActual NO los guarda el ProductsService.create actual del backend
  create: async (data: any): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // PATCH /products/:id — solo: marca, modelo, especificacion, statusId, proveedorId
  update: async (id: string, data: any): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  disable: async (id: string): Promise<Product> => {
    const response = await api.patch(`/products/${id}/disable`);
    return response.data;
  },

  enable: async (id: string): Promise<Product> => {
    const response = await api.patch(`/products/${id}/enable`);
    return response.data;
  },

  // PATCH /products/:id/price
  changePrice: async (id: string, precioUnitario: number) => {
    const response = await api.patch(`/products/${id}/price`, { precioUnitario });
    return response.data;
  },

  // POST /products/:id/movements
  // Backend espera: { typeId, quantity, unitPrice, costCenterId, direction, observations }
  createMovement: async (productId: string, data: {
    typeId: string;
    quantity: number;
    unitPrice: number;
    direction: 'IN' | 'OUT';
    costCenterId?: string;
    observations?: string;
  }) => {
    const response = await api.post(`/products/${productId}/movements`, data);
    return response.data;
  },

  listMovements: async (productId: string) => {
    const response = await api.get(`/products/${productId}/movements`);
    return response.data;
  },

  adjustStock: async (id: string, data: any) => {
    const response = await api.post(`/products/${id}/adjust-stock`, data);
    return response.data;
  },
};
