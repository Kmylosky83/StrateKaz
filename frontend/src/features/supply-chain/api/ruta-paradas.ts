/**
 * API Client — Paradas de Ruta de Recolección.
 * Endpoint: /api/supply-chain/catalogos/rutas-paradas/
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  RutaParada,
  CreateRutaParadaDTO,
  UpdateRutaParadaDTO,
  RutaParadasFilterParams,
} from '../types/ruta-paradas.types';

const BASE = '/supply-chain/catalogos/rutas-paradas';

export const rutaParadasApi = {
  getAll: async (params?: RutaParadasFilterParams): Promise<PaginatedResponse<RutaParada>> => {
    const response = await apiClient.get(`${BASE}/`, { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<RutaParada> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: CreateRutaParadaDTO): Promise<RutaParada> => {
    const response = await apiClient.post(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRutaParadaDTO): Promise<RutaParada> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },

  /** Lista paradas de una ruta específica vía endpoint dedicado del Ruta. */
  byRuta: async (rutaId: number): Promise<RutaParada[]> => {
    const response = await apiClient.get(
      `/supply-chain/catalogos/rutas-recoleccion/${rutaId}/paradas/`
    );
    return response.data;
  },
};
