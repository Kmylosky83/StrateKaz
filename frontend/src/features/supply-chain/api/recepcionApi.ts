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
   * H-SC-RUTA-02 + Refactor 2026-04-27: ahora devuelve PDF (no HTML).
   * Se centraliza el render via VoucherPDFService — el browser usa su
   * pipeline nativo de impresión PDF. El frontend abre el blob PDF en
   * un popup que dispara print() automáticamente.
   */
  getPrint80mm: (id: number) =>
    apiClient.get<Blob>(`${BASE}/vouchers/${id}/print-80mm/`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    }),
  /**
   * PDF carta del voucher (Letter, formal). Usado para descarga manual
   * y también consumido internamente por H-SC-GD-ARCHIVE.
   */
  getPdfCarta: (id: number) =>
    apiClient.get<Blob>(`${BASE}/vouchers/${id}/pdf-carta/`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    }),
  /** @deprecated Usar getPrint80mm. Alias de retro-compat (apunta al mismo). */
  getPrint58mm: (id: number) =>
    apiClient.get<Blob>(`${BASE}/vouchers/${id}/print-80mm/`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    }),
  /**
   * H-SC-RUTA-02 (refactor 2): asocia/desasocia N VoucherRecoleccion (M2M).
   * Pasa lista vacía para desasociar todos.
   */
  asociarRecolecciones: (id: number, vouchersRecoleccionIds: number[]) =>
    apiClient.post<VoucherRecepcion>(`${BASE}/vouchers/${id}/asociar-recolecciones/`, {
      vouchers_recoleccion: vouchersRecoleccionIds,
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
