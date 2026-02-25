/**
 * Select Lists API — Dropdowns compartidos entre módulos
 *
 * Capa 0 (Plataforma): Estos endpoints proveen datos que múltiples
 * módulos necesitan para dropdowns/selects, sin crear dependencias
 * cruzadas entre módulos de Capa 2.
 *
 * Backend: GET /api/core/select-lists/{entidad}/
 * Respuesta: [{ id, label, extra }]
 */
import apiClient from './axios-config';

export interface SelectListItem {
  id: number;
  label: string;
  extra?: Record<string, string>;
}

const BASE = '/core/select-lists';

export const selectListsAPI = {
  getAreas: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/areas/`);
    return response.data;
  },

  getCargos: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/cargos/`);
    return response.data;
  },

  getColaboradores: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/colaboradores/`);
    return response.data;
  },

  getUsers: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/users/`);
    return response.data;
  },

  getProveedores: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/proveedores/`);
    return response.data;
  },

  getClientes: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/clientes/`);
    return response.data;
  },

  getRoles: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/roles/`);
    return response.data;
  },
};
