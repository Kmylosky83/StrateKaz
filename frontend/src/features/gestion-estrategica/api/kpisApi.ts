/**
 * API Client para el módulo de KPIs y Seguimiento
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import axiosInstance from '@/api/axios-config';
import type { PaginatedResponse } from '@/types';
import type {
  KPIObjetivo,
  MedicionKPI,
  CreateKPIObjetivoDTO,
  UpdateKPIObjetivoDTO,
  CreateMedicionKPIDTO,
  UpdateMedicionKPIDTO,
  KPIFilters,
} from '../types/kpi.types';

const BASE_URL = '/planeacion/kpis';

export const kpisApi = {
  // ==================== KPIs ====================

  /**
   * Obtiene la lista de KPIs con filtros opcionales
   */
  list: async (
    filters?: KPIFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<KPIObjetivo>> => {
    const response = await axiosInstance.get(BASE_URL, {
      params: {
        ...filters,
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  },

  /**
   * Obtiene un KPI por ID
   */
  get: async (id: number): Promise<KPIObjetivo> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo KPI
   */
  create: async (data: CreateKPIObjetivoDTO): Promise<KPIObjetivo> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualiza un KPI existente
   */
  update: async (id: number, data: UpdateKPIObjetivoDTO): Promise<KPIObjetivo> => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina un KPI
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}/`);
  },

  // ==================== MEDICIONES ====================

  /**
   * Obtiene las mediciones de un KPI específico
   */
  getMeasurements: async (
    kpiId: number,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<MedicionKPI>> => {
    const response = await axiosInstance.get(`${BASE_URL}/${kpiId}/measurements/`, {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  },

  /**
   * Crea una nueva medición para un KPI
   */
  createMeasurement: async (data: CreateMedicionKPIDTO): Promise<MedicionKPI> => {
    const { kpi, evidence_file, ...rest } = data;

    // Si hay archivo de evidencia, usar FormData
    if (evidence_file) {
      const formData = new FormData();
      formData.append('period', rest.period);
      formData.append('value', rest.value.toString());
      if (rest.notes) {
        formData.append('notes', rest.notes);
      }
      formData.append('evidence_file', evidence_file);

      const response = await axiosInstance.post(`${BASE_URL}/${kpi}/measurements/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Sin archivo, enviar JSON normal
    const response = await axiosInstance.post(`${BASE_URL}/${kpi}/measurements/`, rest);
    return response.data;
  },

  /**
   * Actualiza una medición existente
   */
  updateMeasurement: async (id: number, data: UpdateMedicionKPIDTO): Promise<MedicionKPI> => {
    const response = await axiosInstance.patch(`${BASE_URL}/measurements/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina una medición
   */
  deleteMeasurement: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/measurements/${id}/`);
  },

  // ==================== HELPERS ====================

  /**
   * Obtiene las opciones para los selects (frecuencias, tipos de tendencia, etc.)
   */
  getChoices: async (): Promise<{
    frequencies: Array<{ value: string; label: string }>;
    trend_types: Array<{ value: string; label: string }>;
    units: Array<{ value: string; label: string }>;
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/choices/`);
    return response.data;
  },
};
