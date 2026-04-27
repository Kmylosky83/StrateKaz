/**
 * API Client — VoucherRecoleccion (1 voucher = 1 parada).
 * H-SC-RUTA-02 refactor 2.
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  VoucherRecoleccion,
  CreateVoucherRecoleccionDTO,
  UpdateVoucherRecoleccionDTO,
  VoucherRecoleccionFilterParams,
} from '../types/voucher-recoleccion.types';

const BASE = '/supply-chain/recoleccion/vouchers';

export const voucherRecoleccionApi = {
  getAll: async (
    params?: VoucherRecoleccionFilterParams
  ): Promise<PaginatedResponse<VoucherRecoleccion>> => {
    const response = await apiClient.get(`${BASE}/`, { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<VoucherRecoleccion> => {
    const response = await apiClient.get(`${BASE}/${id}/`);
    return response.data;
  },

  create: async (data: CreateVoucherRecoleccionDTO): Promise<VoucherRecoleccion> => {
    const response = await apiClient.post(`${BASE}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateVoucherRecoleccionDTO): Promise<VoucherRecoleccion> => {
    const response = await apiClient.patch(`${BASE}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}/`);
  },

  /** Marca como COMPLETADO (cierra captura). */
  completar: async (id: number): Promise<VoucherRecoleccion> => {
    const response = await apiClient.post(`${BASE}/${id}/completar/`);
    return response.data;
  },

  /** HTML 58mm (entregar al productor). */
  getPrint58mm: async (id: number): Promise<string> => {
    const response = await apiClient.get(`${BASE}/${id}/print-58mm/`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    });
    return response.data as string;
  },
};
