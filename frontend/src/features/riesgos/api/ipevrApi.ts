/**
 * API Client para IPEVR - Matriz GTC-45
 */
import { apiClient } from '@/lib/api-client';
import type {
  ClasificacionPeligro,
  PeligroGTC45,
  MatrizIPEVR,
  ControlSST,
  CreateMatrizIPEVRDTO,
  UpdateMatrizIPEVRDTO,
  CreateControlSSTDTO,
  UpdateControlSSTDTO,
  PaginatedResponse,
  ResumenIPEVR,
  MatrizIPEVRFilters,
  ControlSSTFilters,
} from '../types';

const BASE_URL = '/riesgos/ipevr';

// ==================== CLASIFICACION DE PELIGROS ====================

export const clasificacionPeligroApi = {
  getAll: async (params?: { categoria?: string; is_active?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<ClasificacionPeligro>>(
      `${BASE_URL}/clasificaciones/`,
      { params }
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ClasificacionPeligro>(
      `${BASE_URL}/clasificaciones/${id}/`
    );
    return response.data;
  },

  porCategoria: async () => {
    const response = await apiClient.get<
      Record<string, { nombre: string; items: ClasificacionPeligro[] }>
    >(`${BASE_URL}/clasificaciones/por_categoria/`);
    return response.data;
  },
};

// ==================== PELIGROS GTC-45 ====================

export const peligroGTC45Api = {
  getAll: async (params?: { clasificacion?: number; is_active?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<PeligroGTC45>>(`${BASE_URL}/peligros/`, {
      params,
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<PeligroGTC45>(`${BASE_URL}/peligros/${id}/`);
    return response.data;
  },

  porClasificacion: async (clasificacionId?: number) => {
    const params = clasificacionId ? { clasificacion_id: clasificacionId } : {};
    const response = await apiClient.get<
      Record<string, { nombre: string; categoria: string; color: string; peligros: PeligroGTC45[] }>
    >(`${BASE_URL}/peligros/por_clasificacion/`, { params });
    return response.data;
  },
};

// ==================== MATRIZ IPEVR ====================

export const matrizIPEVRApi = {
  getAll: async (params?: MatrizIPEVRFilters & { page?: number; page_size?: number }) => {
    const response = await apiClient.get<PaginatedResponse<MatrizIPEVR>>(`${BASE_URL}/matrices/`, {
      params,
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<MatrizIPEVR>(`${BASE_URL}/matrices/${id}/`);
    return response.data;
  },

  create: async (data: CreateMatrizIPEVRDTO) => {
    const response = await apiClient.post<MatrizIPEVR>(`${BASE_URL}/matrices/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateMatrizIPEVRDTO) => {
    const response = await apiClient.patch<MatrizIPEVR>(`${BASE_URL}/matrices/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`${BASE_URL}/matrices/${id}/`);
  },

  // Acciones especiales
  resumen: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<ResumenIPEVR>(`${BASE_URL}/matrices/resumen/`, { params });
    return response.data;
  },

  criticos: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<MatrizIPEVR[]>(`${BASE_URL}/matrices/criticos/`, {
      params,
    });
    return response.data;
  },

  porArea: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<Array<{ area: string; total: number }>>(
      `${BASE_URL}/matrices/por_area/`,
      { params }
    );
    return response.data;
  },

  porCargo: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<Array<{ cargo: string; total: number }>>(
      `${BASE_URL}/matrices/por_cargo/`,
      { params }
    );
    return response.data;
  },

  porPeligro: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<
      Array<{
        peligro__clasificacion__categoria: string;
        peligro__clasificacion__nombre: string;
        total: number;
      }>
    >(`${BASE_URL}/matrices/por_peligro/`, { params });
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string) => {
    const response = await apiClient.post<MatrizIPEVR>(
      `${BASE_URL}/matrices/${id}/cambiar_estado/`,
      { estado }
    );
    return response.data;
  },
};

// ==================== CONTROLES SST ====================

export const controlSSTApi = {
  getAll: async (params?: ControlSSTFilters & { page?: number; page_size?: number }) => {
    const response = await apiClient.get<PaginatedResponse<ControlSST>>(`${BASE_URL}/controles/`, {
      params,
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ControlSST>(`${BASE_URL}/controles/${id}/`);
    return response.data;
  },

  create: async (data: CreateControlSSTDTO) => {
    const response = await apiClient.post<ControlSST>(`${BASE_URL}/controles/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateControlSSTDTO) => {
    const response = await apiClient.patch<ControlSST>(`${BASE_URL}/controles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`${BASE_URL}/controles/${id}/`);
  },

  // Acciones especiales
  pendientes: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<ControlSST[]>(`${BASE_URL}/controles/pendientes/`, {
      params,
    });
    return response.data;
  },

  porTipo: async (empresaId?: number) => {
    const params = empresaId ? { empresa: empresaId } : {};
    const response = await apiClient.get<
      Array<{ tipo_control: string; total: number; implementados: number; verificados: number }>
    >(`${BASE_URL}/controles/por_tipo/`, { params });
    return response.data;
  },
};

// Export todo junto
export const ipevrApi = {
  clasificaciones: clasificacionPeligroApi,
  peligros: peligroGTC45Api,
  matrices: matrizIPEVRApi,
  controles: controlSSTApi,
};
