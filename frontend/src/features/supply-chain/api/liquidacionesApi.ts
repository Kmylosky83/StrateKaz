/**
 * API client para Liquidaciones (S3) — Liquidacion
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  CreateLiquidacionDTO,
  Liquidacion,
  UpdateLiquidacionDTO,
} from '../types/liquidaciones.types';

const BASE = '/supply-chain/liquidaciones';

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
};

export default liquidacionApi;
