import api from './api';

export const catalogoService = {
  // Tipos de producto
  listProductTypes: async () => {
    const response = await api.get('/catalog/product-types');
    return response.data;
  },
  createProductType: async (data: any) => {
    const response = await api.post('/catalog/product-types', data);
    return response.data;
  },
  toggleProductType: async (id: string) => {
    const response = await api.patch(`/catalog/product-types/${id}/toggle`);
    return response.data;
  },

  // Status de producto
  listProductStatuses: async () => {
    const response = await api.get('/catalog/product-status');
    return response.data;
  },
  createProductStatus: async (data: any) => {
    const response = await api.post('/catalog/product-status', data);
    return response.data;
  },
  toggleProductStatus: async (id: string) => {
    const response = await api.patch(`/catalog/product-status/${id}/toggle`);
    return response.data;
  },

  // Tipos de movimiento
  listMovementTypes: async () => {
    const response = await api.get('/catalog/movement-types');
    return response.data;
  },
  createMovementType: async (data: any) => {
    const response = await api.post('/catalog/movement-types', data);
    return response.data;
  },

  // Categorías de activos
  listAssetCategories: async () => {
    const response = await api.get('/catalog/asset-categories');
    return response.data;
  },
  createAssetCategory: async (data: any) => {
    const response = await api.post('/catalog/asset-categories', data);
    return response.data;
  },

  // Status de requisición
  listRequisitionStatuses: async () => {
    const response = await api.get('/catalog/requisition-status');
    return response.data;
  },
  createRequisitionStatus: async (data: any) => {
    const response = await api.post('/catalog/requisition-status', data);
    return response.data;
  },

  // Centros de costo
  listCostCenters: async () => {
    const response = await api.get('/cost-centers');
    return response.data;
  },
};
