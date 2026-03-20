/**
 * API Client para Caracterización de Procesos (SIPOC)
 * Módulo: C1 — Fundación / Organización
 */
import { createApiClient } from '@/lib/api-factory';
import { apiClient } from '@/lib/api-client';
import type {
  CaracterizacionProcesoList,
  CaracterizacionProceso,
  CreateCaracterizacionDTO,
  UpdateCaracterizacionDTO,
} from '../types/caracterizacion.types';

export const caracterizacionApi = {
  ...createApiClient<
    CaracterizacionProcesoList,
    CreateCaracterizacionDTO,
    UpdateCaracterizacionDTO
  >('/organizacion', 'caracterizaciones'),
  /** Obtener caracterización por área */
  getByArea: (areaId: number): Promise<CaracterizacionProceso> =>
    apiClient.get(`/organizacion/caracterizaciones/by-area/${areaId}/`).then((r) => r.data),

  /** Exportar Excel con caracterizaciones + SIPOC */
  exportExcel: async (params?: Record<string, unknown>): Promise<string> => {
    const { data } = await apiClient.get('/organizacion/caracterizaciones/export-excel/', {
      params,
      responseType: 'blob',
    });
    return URL.createObjectURL(data);
  },

  /** Descargar plantilla de importación */
  downloadTemplate: async (): Promise<string> => {
    const { data } = await apiClient.get('/organizacion/caracterizaciones/plantilla-importacion/', {
      responseType: 'blob',
    });
    return URL.createObjectURL(data);
  },

  /** Importar Excel con caracterizaciones + SIPOC */
  importExcel: async (
    file: File
  ): Promise<{
    message: string;
    created: number;
    updated: number;
    sipoc_created: number;
    errors?: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(
      '/organizacion/caracterizaciones/import-excel/',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
