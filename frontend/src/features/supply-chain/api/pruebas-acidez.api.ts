/**
 * API Client para Pruebas de Acidez de Sebo
 * Backend: /api/supply-chain/pruebas-acidez/
 */
import { apiClient } from '@/lib/api-client';
import type {
  PruebaAcidez,
  CreatePruebaAcidezDTO,
  UpdatePruebaAcidezDTO,
  SimularPruebaAcidezDTO,
  SimularPruebaAcidezResponse,
  EstadisticasPruebasAcidez,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/supply-chain/pruebas-acidez';

// ==================== PRUEBAS DE ACIDEZ ====================

export const pruebaAcidezApi = {
  /**
   * Listar pruebas de acidez
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    proveedor?: number;
    tipo_materia_prima_original?: number;
    tipo_materia_prima_resultante?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    cumple_especificacion?: boolean;
    accion_tomada?: string;
    responsable_prueba?: number;
    is_active?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<PruebaAcidez>> => {
    const response = await apiClient.get<PaginatedResponse<PruebaAcidez>>(`${BASE_URL}/`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener prueba por ID
   */
  getById: async (id: number): Promise<PruebaAcidez> => {
    const response = await apiClient.get<PruebaAcidez>(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Crear prueba de acidez
   */
  create: async (data: CreatePruebaAcidezDTO): Promise<PruebaAcidez> => {
    const response = await apiClient.post<PruebaAcidez>(`${BASE_URL}/`, data);
    return response.data;
  },

  /**
   * Actualizar prueba
   */
  update: async (id: number, data: UpdatePruebaAcidezDTO): Promise<PruebaAcidez> => {
    const response = await apiClient.patch<PruebaAcidez>(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar prueba
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}/`);
  },

  /**
   * Simular clasificación por acidez (custom action)
   * Permite simular qué tipo de sebo resultaría según el valor de acidez
   */
  simular: async (data: SimularPruebaAcidezDTO): Promise<SimularPruebaAcidezResponse> => {
    const response = await apiClient.post<SimularPruebaAcidezResponse>(
      `${BASE_URL}/simular/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de pruebas de acidez
   */
  getEstadisticas: async (params?: {
    proveedor?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<EstadisticasPruebasAcidez> => {
    const response = await apiClient.get<EstadisticasPruebasAcidez>(`${BASE_URL}/estadisticas/`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener pruebas por proveedor
   */
  porProveedor: async (
    proveedorId: number,
    params?: { limit?: number; fecha_desde?: string; fecha_hasta?: string }
  ): Promise<PruebaAcidez[]> => {
    const response = await apiClient.get<PaginatedResponse<PruebaAcidez>>(`${BASE_URL}/`, {
      params: { proveedor: proveedorId, ordering: '-fecha_prueba', ...params },
    });
    return response.data.results;
  },

  /**
   * Obtener pruebas pendientes de acción
   */
  getPendientes: async (): Promise<PruebaAcidez[]> => {
    const response = await apiClient.get<PaginatedResponse<PruebaAcidez>>(`${BASE_URL}/`, {
      params: { accion_tomada: 'PENDIENTE', is_active: true, page_size: 1000 },
    });
    return response.data.results;
  },

  /**
   * Obtener pruebas que no cumplen especificación
   */
  getNoCumpleEspecificacion: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PruebaAcidez[]> => {
    const response = await apiClient.get<PaginatedResponse<PruebaAcidez>>(`${BASE_URL}/`, {
      params: { cumple_especificacion: false, ...params, page_size: 1000 },
    });
    return response.data.results;
  },

  /**
   * Exportar pruebas a Excel
   */
  exportExcel: async (params?: Record<string, any>): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export_excel/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Actualizar acción tomada en lote
   */
  actualizarAccionLote: async (
    ids: number[],
    accion_tomada: 'ACEPTADO' | 'RECHAZADO' | 'REPROCESO' | 'DEVOLUCION',
    motivo?: string
  ): Promise<{ updated: number }> => {
    const response = await apiClient.post<{ updated: number }>(
      `${BASE_URL}/actualizar_accion_lote/`,
      { ids, accion_tomada, motivo }
    );
    return response.data;
  },
};

// ==================== EXPORT DEFAULT ====================

export default pruebaAcidezApi;
