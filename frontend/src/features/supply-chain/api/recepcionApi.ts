/**
 * API client para Recepcion (S3) — VoucherRecepcion + RecepcionCalidad
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  CreateRecepcionCalidadDTO,
  CreateVoucherRecepcionDTO,
  RecepcionCalidad,
  RegistrarQCDTO,
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
  // H-SC-03: transiciones de estado + QC
  aprobar: (id: number) => apiClient.post<VoucherRecepcion>(`${BASE}/vouchers/${id}/aprobar/`),
  rechazar: (id: number, motivo?: string) =>
    apiClient.post<VoucherRecepcion>(`${BASE}/vouchers/${id}/rechazar/`, { motivo }),
  registrarQC: (id: number, data: RegistrarQCDTO) =>
    apiClient.post<RecepcionCalidad>(`${BASE}/vouchers/${id}/registrar-qc/`, data),
  /**
   * H-SC-RUTA-02 (2026-04-26): VoucherRecepcion pasó de 58mm a 80mm para
   * mejor legibilidad. Mismo contenido. El voucher de RECOLECCIÓN (en
   * ruta) sí se mantiene en 58mm (endpoint propio).
   */
  getPrint80mm: (id: number) =>
    apiClient.get<string>(`${BASE}/vouchers/${id}/print-80mm/`, { responseType: 'text' }),
  /** @deprecated Usar getPrint80mm. Alias de retro-compat (apunta al mismo). */
  getPrint58mm: (id: number) =>
    apiClient.get<string>(`${BASE}/vouchers/${id}/print-80mm/`, { responseType: 'text' }),
  /**
   * H-SC-RUTA-02 D-1: asocia / desasocia un VoucherRecoleccion con esta
   * recepción. Pasa null para desvincular.
   */
  asociarRecoleccion: (id: number, voucherRecoleccionId: number | null) =>
    apiClient.post<VoucherRecepcion>(`${BASE}/vouchers/${id}/asociar-recoleccion/`, {
      voucher_recoleccion: voucherRecoleccionId,
    }),
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
