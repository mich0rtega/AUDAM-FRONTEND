import api from './api';

export const usersService = {
  // Todos los usuarios globales (con sus entornos)
  listAll: async () => {
    const response = await api.get('/users/all');
    return response.data;
  },
  // Usuarios del entorno activo
  list: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  // Ver un usuario por id
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  // Todos los entornos del sistema
  listEnvironments: async () => {
    const response = await api.get('/users/environments');
    return response.data;
  },
  // Crear usuario
  create: async (data: { email: string; password: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  // Editar usuario
  update: async (id: string, data: { email?: string; password?: string }) => {
    const response = await api.patch(`/users/${id}/update`, data);
    return response.data;
  },
  // Asignar rol en entorno
  assignRole: async (data: { userId: string; environmentId: string; role: string }) => {
    const response = await api.post('/users/assign-role', data);
    return response.data;
  },
  // Cambiar rol de un userEnvironment
  changeRole: async (data: { userEnvironmentId: string; role: string }) => {
    const response = await api.patch('/users/change-role', data);
    return response.data;
  },
  // Revocar entorno (por userEnvironment.id)
  revokeEnvironment: async (userEnvironmentId: string) => {
    const response = await api.patch(`/users/environment/${userEnvironmentId}/revoke`);
    return response.data;
  },
  // Restaurar entorno
  restoreEnvironment: async (userEnvironmentId: string) => {
    const response = await api.patch(`/users/environment/${userEnvironmentId}/restore`);
    return response.data;
  },
  // Deshabilitar usuario
  disable: async (userId: string) => {
    const response = await api.patch(`/users/${userId}/disable`);
    return response.data;
  },
  // Habilitar usuario
  enable: async (userId: string) => {
    const response = await api.patch(`/users/${userId}/enable`);
    return response.data;
  },
};
