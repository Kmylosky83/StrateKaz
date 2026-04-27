/**
 * API Client — VoucherRecoleccion + Líneas.
 * Endpoints: /api/supply-chain/recoleccion/{vouchers,lineas}/
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  VoucherRecoleccion,
  LineaVoucherRecoleccion,
  CreateVoucherRecoleccionDTO,
  UpdateVoucherRecoleccionDTO,
  CreateLineaVoucherRecoleccionDTO,
  UpdateLineaVoucherRecoleccionDTO,
  VoucherRecoleccionFilterParams,
} from '../types/voucher-recoleccion.types';

const BASE_VOUCHERS = '/supply-chain/recoleccion/vouchers';
const BASE_LINEAS = '/supply-chain/recoleccion/lineas';

export const voucherRecoleccionApi = {
  getAll: async (
    params?: VoucherRecoleccionFilterParams
  ): Promise<PaginatedResponse<VoucherRecoleccion>> => {
    const response = await apiClient.get(`${BASE_VOUCHERS}/`, { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data;
  },

  getById: async (id: number): Promise<VoucherRecoleccion> => {
    const response = await apiClient.get(`${BASE_VOUCHERS}/${id}/`);
    return response.data;
  },

  create: async (data: CreateVoucherRecoleccionDTO): Promise<VoucherRecoleccion> => {
    const response = await apiClient.post(`${BASE_VOUCHERS}/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateVoucherRecoleccionDTO): Promise<VoucherRecoleccion> => {
    const response = await apiClient.patch(`${BASE_VOUCHERS}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_VOUCHERS}/${id}/`);
  },

  /** Marca como COMPLETADO (cierra captura). */
  completar: async (id: number): Promise<VoucherRecoleccion> => {
    const response = await apiClient.post(`${BASE_VOUCHERS}/${id}/completar/`);
    return response.data;
  },

  /** HTML del voucher 58mm (entregar al productor en ruta). Sin precios. */
  getPrint58mm: async (id: number): Promise<string> => {
    const response = await apiClient.get(`${BASE_VOUCHERS}/${id}/print-58mm/`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    });
    return response.data as string;
  },
};

export const lineaVoucherRecoleccionApi = {
  create: async (data: CreateLineaVoucherRecoleccionDTO): Promise<LineaVoucherRecoleccion> => {
    const response = await apiClient.post(`${BASE_LINEAS}/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateLineaVoucherRecoleccionDTO
  ): Promise<LineaVoucherRecoleccion> => {
    const response = await apiClient.patch(`${BASE_LINEAS}/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_LINEAS}/${id}/`);
  },
};
