/**
 * API Client para Unidades de Negocio — Fundacion Tab 1
 * Backend: /api/fundacion/configuracion/unidades-negocio/
 */
import { apiClient } from '@/lib/api-client';
import type {
  UnidadNegocio,
  CreateUnidadNegocioDTO,
  UpdateUnidadNegocioDTO,
} from '../types/unidad-negocio.types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const BASE_URL = '/fundacion/configuracion';

export const unidadesNegocioApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    tipo_unidad?: string;
  }): Promise<PaginatedResponse<UnidadNegocio>> => {
    const response = await apiClient.get<PaginatedResponse<UnidadNegocio>>(
      `${BASE_URL}/unidades-negocio/`,
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<UnidadNegocio> => {
    const response = await apiClient.get<UnidadNegocio>(`${BASE_URL}/unidades-negocio/${id}/`);
    return response.data;
  },

  create: async (data: CreateUnidadNegocioDTO): Promise<UnidadNegocio> => {
    const response = await apiClient.post<UnidadNegocio>(`${BASE_URL}/unidades-negocio/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateUnidadNegocioDTO): Promise<UnidadNegocio> => {
    const response = await apiClient.patch<UnidadNegocio>(
      `${BASE_URL}/unidades-negocio/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/unidades-negocio/${id}/`);
  },

  restore: async (id: number): Promise<UnidadNegocio> => {
    const response = await apiClient.post<UnidadNegocio>(
      `${BASE_URL}/unidades-negocio/${id}/restore/`
    );
    return response.data;
  },
};
