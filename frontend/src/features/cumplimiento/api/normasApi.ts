/**
 * API Cliente para Normas Legales
 * Conecta con backend/apps/motor_cumplimiento/matriz_legal/
 */
import apiClient from '@/api/axios-config';
import type {
  NormaLegal,
  NormaLegalList,
  NormaLegalCreateUpdate,
  TipoNorma,
  TipoNormaCreate,
} from '../types/matrizLegal';

const BASE_URL = '/cumplimiento/matriz-legal/normas';
const TIPOS_URL = '/cumplimiento/matriz-legal/tipos-norma';

// ============================================================================
// NORMAS LEGALES
// ============================================================================

export interface NormasListParams {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_norma?: number | string;
  vigente?: boolean;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  anio?: number;
  ordering?: string;
}

// PaginatedResponse: importar desde '@/types'
import type { PaginatedResponse } from '@/types';

export const normasApi = {
  /**
   * Listar normas legales con paginación y filtros
   */
  list: async (params?: NormasListParams): Promise<PaginatedResponse<NormaLegalList>> => {
    const response = await apiClient.get<PaginatedResponse<NormaLegalList>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener detalle de norma legal
   */
  get: async (id: number): Promise<NormaLegal> => {
    const response = await apiClient.get<NormaLegal>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Crear norma legal
   */
  create: async (data: NormaLegalCreateUpdate): Promise<NormaLegal> => {
    const response = await apiClient.post<NormaLegal>(`${BASE_URL}/`, data);
    return response.data;
  },

  /**
   * Actualizar norma legal
   */
  update: async (id: number, data: Partial<NormaLegalCreateUpdate>): Promise<NormaLegal> => {
    const response = await apiClient.patch<NormaLegal>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar norma legal (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  /**
   * Exportar normas a Excel
   */
  exportExcel: async (params?: NormasListParams): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export-excel/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Buscar norma por scraping (Función del Congreso, etc)
   */
  scrapeNorma: async (tipo: string, numero: string, anio: number): Promise<NormaLegal> => {
    const response = await apiClient.post<NormaLegal>(`${BASE_URL}/scrape/`, {
      tipo,
      numero,
      anio,
    });
    return response.data;
  },
};

// ============================================================================
// TIPOS DE NORMA
// ============================================================================

export const tiposNormaApi = {
  /**
   * Listar tipos de norma
   */
  list: async (): Promise<TipoNorma[]> => {
    const response = await apiClient.get<TipoNorma[]>(TIPOS_URL);
    return response.data;
  },

  /**
   * Crear tipo de norma
   */
  create: async (data: TipoNormaCreate): Promise<TipoNorma> => {
    const response = await apiClient.post<TipoNorma>(`${TIPOS_URL}/`, data);
    return response.data;
  },
};
