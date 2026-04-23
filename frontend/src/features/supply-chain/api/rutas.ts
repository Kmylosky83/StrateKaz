/**
 * API Client — Rutas de Recolección (catálogo CT Supply Chain)
 *
 * Endpoint: /api/supply-chain/catalogos/rutas-recoleccion/
 *
 * H-SC-10: reemplaza el uso de SedeEmpresa como "UNeg transportista" en
 * VoucherRecepcion. Cuando `es_proveedor_interno=True`, la ruta se espeja
 * como Proveedor en el catálogo de Proveedores.
 */
import apiClient from '@/api/axios-config';
import type {
  RutaRecoleccion,
  RutaRecoleccionList,
  CreateRutaDTO,
  UpdateRutaDTO,
  RutasFilterParams,
} from '../types/rutas.types';
import type { PaginatedResponse } from '@/types';

const BASE = '/supply-chain/catalogos/rutas-recoleccion';

export const rutasApi = {
  getAll: async (params?: RutasFilterParams): Promise<PaginatedResponse<RutaRecoleccionList>> => {
    const response = await apiClient.get(`${BASE}/`, { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<RutaRecoleccion> => {
    const response = await apiClient.get<RutaRecoleccion>(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: CreateRutaDTO): Promise<RutaRecoleccion> => {
    const response = await apiClient.post<RutaRecoleccion>(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRutaDTO): Promise<RutaRecoleccion> => {
    const response = await apiClient.patch<RutaRecoleccion>(`${BASE}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },
};

export default rutasApi;
