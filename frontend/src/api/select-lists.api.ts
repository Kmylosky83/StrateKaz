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
  extra?: Record<string, string | number>;
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

  getDepartamentos: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/departamentos/`);
    return response.data;
  },

  getCiudades: async (departamentoId?: number): Promise<SelectListItem[]> => {
    const params = departamentoId ? { departamento_id: departamentoId } : undefined;
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/ciudades/`, { params });
    return response.data;
  },

  getTiposDocumento: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/tipos-documento/`);
    return response.data;
  },

  getTiposMateriaPrima: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/tipos-materia-prima/`);
    return response.data;
  },

  getTiposEPP: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/tipos-epp/`);
    return response.data;
  },

  getUnidadesNegocio: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/unidades-negocio/`);
    return response.data;
  },

  getIndicadores: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/indicadores/`);
    return response.data;
  },

  /** Partes Interesadas (lista ligera para vincular — no requiere permiso granular). */
  getPartesInteresadas: async (): Promise<SelectListItem[]> => {
    const response = await apiClient.get<SelectListItem[]>(`${BASE}/partes-interesadas/`);
    return response.data;
  },
};
