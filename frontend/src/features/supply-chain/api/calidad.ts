/**
 * API client — Control de Calidad (QC) Supply Chain.
 *
 * Endpoints (Fase 1 QC — agent A):
 *   /supply-chain/parametros-calidad/        (CRUD ParametroCalidad)
 *   /supply-chain/rangos-calidad/            (CRUD RangoCalidad)
 *   /supply-chain/mediciones-calidad/        (read-only list)
 *   /supply-chain/voucher-lines/<id>/measurements/bulk/  (POST array de mediciones)
 */
import apiClient from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  BulkMedicionesDTO,
  CreateParametroCalidadDTO,
  CreateRangoCalidadDTO,
  MedicionCalidad,
  ParametroCalidad,
  RangoCalidad,
  UpdateParametroCalidadDTO,
  UpdateRangoCalidadDTO,
} from '../types/calidad.types';

const BASE_PARAM = '/supply-chain/parametros-calidad';
const BASE_RANGO = '/supply-chain/rangos-calidad';
const BASE_MEDICION = '/supply-chain/mediciones-calidad';

function unwrap<T>(data: T[] | PaginatedResponse<T> | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const parametrosCalidadApi = {
  getAll: async (params?: Record<string, unknown>): Promise<ParametroCalidad[]> => {
    const resp = await apiClient.get<ParametroCalidad[] | PaginatedResponse<ParametroCalidad>>(
      `${BASE_PARAM}/`,
      { params }
    );
    return unwrap(resp.data);
  },
  getById: (id: number) => apiClient.get<ParametroCalidad>(`${BASE_PARAM}/${id}/`),
  create: (data: CreateParametroCalidadDTO) =>
    apiClient.post<ParametroCalidad>(`${BASE_PARAM}/`, data),
  update: (id: number, data: UpdateParametroCalidadDTO) =>
    apiClient.patch<ParametroCalidad>(`${BASE_PARAM}/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_PARAM}/${id}/`),
};

export const rangosCalidadApi = {
  getAll: async (params?: Record<string, unknown>): Promise<RangoCalidad[]> => {
    const resp = await apiClient.get<RangoCalidad[] | PaginatedResponse<RangoCalidad>>(
      `${BASE_RANGO}/`,
      { params }
    );
    return unwrap(resp.data);
  },
  getByParametro: async (parametroId: number): Promise<RangoCalidad[]> => {
    const resp = await apiClient.get<RangoCalidad[] | PaginatedResponse<RangoCalidad>>(
      `${BASE_RANGO}/`,
      { params: { parametro: parametroId } }
    );
    return unwrap(resp.data);
  },
  create: (data: CreateRangoCalidadDTO) => apiClient.post<RangoCalidad>(`${BASE_RANGO}/`, data),
  update: (id: number, data: UpdateRangoCalidadDTO) =>
    apiClient.patch<RangoCalidad>(`${BASE_RANGO}/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE_RANGO}/${id}/`),
};

export const medicionesCalidadApi = {
  getAll: async (params?: Record<string, unknown>): Promise<MedicionCalidad[]> => {
    const resp = await apiClient.get<MedicionCalidad[] | PaginatedResponse<MedicionCalidad>>(
      `${BASE_MEDICION}/`,
      { params }
    );
    return unwrap(resp.data);
  },
  /**
   * Bulk de mediciones por línea de voucher. El backend crea N MedicionCalidad
   * y devuelve el array creado.
   */
  bulkPorLinea: (voucherLineId: number, data: BulkMedicionesDTO) =>
    apiClient.post<MedicionCalidad[]>(
      `/supply-chain/voucher-lines/${voucherLineId}/measurements/bulk/`,
      data
    ),
};

export default {
  parametros: parametrosCalidadApi,
  rangos: rangosCalidadApi,
  mediciones: medicionesCalidadApi,
};
