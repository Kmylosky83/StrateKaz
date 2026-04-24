/**
 * API client para Liquidaciones y PagoLiquidacion (H-SC-12)
 *
 * Endpoints:
 *   /api/supply-chain/liquidaciones/ — CRUD header
 *   /api/supply-chain/liquidaciones/<id>/lineas/<linea_id>/ajuste/ — PATCH ajuste
 *   /api/supply-chain/liquidaciones/<id>/aprobar/ — POST aprobar
 *   /api/supply-chain/liquidaciones/<id>/anular/ — POST anular
 *   /api/supply-chain/pagos-liquidacion/ — CRUD pagos
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  AjustarLineaDTO,
  CreateLiquidacionDTO,
  CreatePagoLiquidacionDTO,
  Liquidacion,
  LiquidacionLinea,
  PagoLiquidacion,
  UpdateLiquidacionDTO,
} from '../types/liquidaciones.types';

const BASE = '/supply-chain';

export const liquidacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Liquidacion>>(`${BASE}/liquidaciones/`, { params }),
  getById: (id: number) => apiClient.get<Liquidacion>(`${BASE}/liquidaciones/${id}/`),
  create: (data: CreateLiquidacionDTO) =>
    apiClient.post<Liquidacion>(`${BASE}/liquidaciones/`, data),
  update: (id: number, data: UpdateLiquidacionDTO) =>
    apiClient.patch<Liquidacion>(`${BASE}/liquidaciones/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE}/liquidaciones/${id}/`),
  aprobar: (id: number) => apiClient.post<Liquidacion>(`${BASE}/liquidaciones/${id}/aprobar/`),
  anular: (id: number, observaciones?: string) =>
    apiClient.post<Liquidacion>(`${BASE}/liquidaciones/${id}/anular/`, { observaciones }),
  ajustarLinea: (id: number, lineaId: number, data: AjustarLineaDTO) =>
    apiClient.patch<LiquidacionLinea>(
      `${BASE}/liquidaciones/${id}/lineas/${lineaId}/ajuste/`,
      data
    ),
};

export const pagoLiquidacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<PagoLiquidacion>>(`${BASE}/pagos-liquidacion/`, { params }),
  getById: (id: number) => apiClient.get<PagoLiquidacion>(`${BASE}/pagos-liquidacion/${id}/`),
  create: (data: CreatePagoLiquidacionDTO) =>
    apiClient.post<PagoLiquidacion>(`${BASE}/pagos-liquidacion/`, data),
  delete: (id: number) => apiClient.delete(`${BASE}/pagos-liquidacion/${id}/`),
};

export default liquidacionApi;
