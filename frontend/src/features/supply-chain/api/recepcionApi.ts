/**
 * API client para Recepcion (S3) — VoucherRecepcion + RecepcionCalidad
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  CreateRecepcionCalidadDTO,
  CreateVoucherRecepcionDTO,
  RecepcionCalidad,
  UpdateVoucherRecepcionDTO,
  VoucherRecepcion,
  VoucherRecepcionList,
} from '../types/recepcion.types';

const BASE = '/supply-chain/recepcion';

export const voucherRecepcionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<VoucherRecepcionList>>(`${BASE}/vouchers/`, { params }),
  getById: (id: number) => apiClient.get<VoucherRecepcion>(`${BASE}/vouchers/${id}/`),
  create: (data: CreateVoucherRecepcionDTO) =>
    apiClient.post<VoucherRecepcion>(`${BASE}/vouchers/`, data),
  update: (id: number, data: UpdateVoucherRecepcionDTO) =>
    apiClient.patch<VoucherRecepcion>(`${BASE}/vouchers/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE}/vouchers/${id}/`),
};

export const recepcionCalidadApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<RecepcionCalidad>>(`${BASE}/calidad/`, { params }),
  getById: (id: number) => apiClient.get<RecepcionCalidad>(`${BASE}/calidad/${id}/`),
  create: (data: CreateRecepcionCalidadDTO) =>
    apiClient.post<RecepcionCalidad>(`${BASE}/calidad/`, data),
  update: (id: number, data: Partial<CreateRecepcionCalidadDTO>) =>
    apiClient.patch<RecepcionCalidad>(`${BASE}/calidad/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE}/calidad/${id}/`),
};

export default {
  voucher: voucherRecepcionApi,
  calidad: recepcionCalidadApi,
};
