/**
 * API Client para Riesgos de Procesos - ISO 31000
 * Sistema de Gestión StrateKaz
 */
import { apiClient } from '@/lib/api-client';
import type {
  RiesgoProceso,
  ControlRiesgo,
  TratamientoRiesgo,
  Oportunidad,
  CreateRiesgoProcesoDTO,
  UpdateRiesgoProcesoDTO,
  CreateControlRiesgoDTO,
  UpdateControlRiesgoDTO,
  CreateTratamientoRiesgoDTO,
  UpdateTratamientoRiesgoDTO,
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  PaginatedResponse,
  RiesgoProcesoFilters,
  OportunidadFilters,
} from '../types';

const BASE_URL = '/riesgos/riesgos-procesos';

// ==================== RIESGOS ====================

export const riesgosApi = {
  // CRUD Riesgos
  getAll: async (filters?: RiesgoProcesoFilters): Promise<PaginatedResponse<RiesgoProceso>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`${BASE_URL}/riesgos/?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<RiesgoProceso> => {
    const response = await apiClient.get(`${BASE_URL}/riesgos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRiesgoProcesoDTO): Promise<RiesgoProceso> => {
    const response = await apiClient.post(`${BASE_URL}/riesgos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRiesgoProcesoDTO): Promise<RiesgoProceso> => {
    const response = await apiClient.patch(`${BASE_URL}/riesgos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/riesgos/${id}/`);
  },

  // Acciones especiales
  getResumen: async (
    empresaId?: number
  ): Promise<{
    total: number;
    por_estado: Array<{ estado: string; cantidad: number }>;
    por_tipo: Array<{ tipo: string; cantidad: number }>;
    criticos: number;
    en_tratamiento: number;
  }> => {
    const params = empresaId ? `?empresa=${empresaId}` : '';
    const response = await apiClient.get(`${BASE_URL}/riesgos/resumen/${params}`);
    return response.data;
  },

  getCriticos: async (empresaId?: number): Promise<RiesgoProceso[]> => {
    const params = empresaId ? `?empresa=${empresaId}` : '';
    const response = await apiClient.get(`${BASE_URL}/riesgos/criticos/${params}`);
    return response.data;
  },

  getMapaCalor: async (
    empresaId?: number
  ): Promise<
    Array<{
      probabilidad: number;
      impacto: number;
      cantidad: number;
      riesgos: Array<{ id: number; nombre: string }>;
    }>
  > => {
    const params = empresaId ? `?empresa=${empresaId}` : '';
    const response = await apiClient.get(`${BASE_URL}/riesgos/mapa-calor/${params}`);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<RiesgoProceso> => {
    const response = await apiClient.post(`${BASE_URL}/riesgos/${id}/cambiar_estado/`, { estado });
    return response.data;
  },
};

// ==================== CONTROLES ====================

export const controlesRiesgoApi = {
  getAll: async (riesgoId?: number): Promise<PaginatedResponse<ControlRiesgo>> => {
    const params = riesgoId ? `?riesgo=${riesgoId}` : '';
    const response = await apiClient.get(`${BASE_URL}/controles/${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<ControlRiesgo> => {
    const response = await apiClient.get(`${BASE_URL}/controles/${id}/`);
    return response.data;
  },

  create: async (data: CreateControlRiesgoDTO): Promise<ControlRiesgo> => {
    const response = await apiClient.post(`${BASE_URL}/controles/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateControlRiesgoDTO): Promise<ControlRiesgo> => {
    const response = await apiClient.patch(`${BASE_URL}/controles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles/${id}/`);
  },
};

// ==================== TRATAMIENTOS ====================

export const tratamientosApi = {
  getAll: async (riesgoId?: number): Promise<PaginatedResponse<TratamientoRiesgo>> => {
    const params = riesgoId ? `?riesgo=${riesgoId}` : '';
    const response = await apiClient.get(`${BASE_URL}/tratamientos/${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<TratamientoRiesgo> => {
    const response = await apiClient.get(`${BASE_URL}/tratamientos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTratamientoRiesgoDTO): Promise<TratamientoRiesgo> => {
    const response = await apiClient.post(`${BASE_URL}/tratamientos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTratamientoRiesgoDTO): Promise<TratamientoRiesgo> => {
    const response = await apiClient.patch(`${BASE_URL}/tratamientos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tratamientos/${id}/`);
  },

  actualizarAvance: async (id: number, porcentaje: number): Promise<TratamientoRiesgo> => {
    const response = await apiClient.post(`${BASE_URL}/tratamientos/${id}/actualizar_avance/`, {
      porcentaje_avance: porcentaje,
    });
    return response.data;
  },
};

// ==================== OPORTUNIDADES ====================

export const oportunidadesApi = {
  getAll: async (filters?: OportunidadFilters): Promise<PaginatedResponse<Oportunidad>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`${BASE_URL}/oportunidades/?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<Oportunidad> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/${id}/`);
    return response.data;
  },

  create: async (data: CreateOportunidadDTO): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateOportunidadDTO): Promise<Oportunidad> => {
    const response = await apiClient.patch(`${BASE_URL}/oportunidades/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/oportunidades/${id}/`);
  },

  cambiarEstado: async (id: number, estado: string): Promise<Oportunidad> => {
    const response = await apiClient.post(`${BASE_URL}/oportunidades/${id}/cambiar_estado/`, {
      estado,
    });
    return response.data;
  },
};
