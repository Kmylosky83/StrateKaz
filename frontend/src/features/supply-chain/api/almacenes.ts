/**
 * API Client — Almacenes (catálogo CT Supply Chain)
 *
 * Endpoint: /api/supply-chain/catalogos/almacenes/
 *
 * Soporta filtro ?sede=<id> (H-SC-07) para listar almacenes físicamente
 * ubicados en una sede específica.
 */
import apiClient from '@/api/axios-config';
import type {
  Almacen,
  AlmacenList,
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  AlmacenesFilterParams,
  PaginatedResponse,
} from '../types';

const BASE = '/supply-chain/catalogos/almacenes';

export const almacenesApi = {
  getAll: async (params?: AlmacenesFilterParams): Promise<PaginatedResponse<AlmacenList>> => {
    const response = await apiClient.get(`${BASE}/`, { params });
    const data = response.data;
    // El ViewSet usa paginación por defecto, pero algunos casos retornan arreglo.
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<Almacen> => {
    const response = await apiClient.get<Almacen>(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: CreateAlmacenDTO): Promise<Almacen> => {
    const response = await apiClient.post<Almacen>(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAlmacenDTO): Promise<Almacen> => {
    const response = await apiClient.patch<Almacen>(`${BASE}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },
};

export default almacenesApi;
