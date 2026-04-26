/**
 * API Client — Precios de Ruta Semi-Autónoma.
 * Endpoint: /api/supply-chain/catalogos/precios-ruta-semi/
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  PrecioRutaSemi,
  CreatePrecioRutaSemiDTO,
  UpdatePrecioRutaSemiDTO,
  PrecioRutaSemiFilterParams,
} from '../types/precio-ruta-semi.types';

const BASE = '/supply-chain/catalogos/precios-ruta-semi';

export const precioRutaSemiApi = {
  getAll: async (
    params?: PrecioRutaSemiFilterParams
  ): Promise<PaginatedResponse<PrecioRutaSemi>> => {
    const response = await apiClient.get(`${BASE}/`, { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<PrecioRutaSemi> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: CreatePrecioRutaSemiDTO): Promise<PrecioRutaSemi> => {
    const response = await apiClient.post(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePrecioRutaSemiDTO): Promise<PrecioRutaSemi> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },
};
