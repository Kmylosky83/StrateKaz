/**
 * API Client para Evaluación de Proveedores
 * Backend: /api/supply-chain/evaluaciones-proveedor/
 */
import { apiClient } from '@/lib/api-client';
import type {
  CriterioEvaluacion,
  CreateCriterioEvaluacionDTO,
  UpdateCriterioEvaluacionDTO,
  EvaluacionProveedor,
  CreateEvaluacionProveedorDTO,
  UpdateEvaluacionProveedorDTO,
  AprobarEvaluacionDTO,
  DetalleEvaluacion,
  EstadisticasEvaluacion,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/supply-chain';

// ==================== CRITERIOS DE EVALUACIÓN ====================

export const criterioEvaluacionApi = {
  /**
   * Listar criterios de evaluación
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<CriterioEvaluacion>> => {
    const response = await apiClient.get<PaginatedResponse<CriterioEvaluacion>>(
      `${BASE_URL}/criterios-evaluacion/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener criterio por ID
   */
  getById: async (id: number): Promise<CriterioEvaluacion> => {
    const response = await apiClient.get<CriterioEvaluacion>(
      `${BASE_URL}/criterios-evaluacion/${id}/`
    );
    return response.data;
  },

  /**
   * Crear criterio de evaluación
   */
  create: async (data: CreateCriterioEvaluacionDTO): Promise<CriterioEvaluacion> => {
    const response = await apiClient.post<CriterioEvaluacion>(
      `${BASE_URL}/criterios-evaluacion/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar criterio
   */
  update: async (id: number, data: UpdateCriterioEvaluacionDTO): Promise<CriterioEvaluacion> => {
    const response = await apiClient.patch<CriterioEvaluacion>(
      `${BASE_URL}/criterios-evaluacion/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar criterio
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/criterios-evaluacion/${id}/`);
  },

  /**
   * Obtener criterios activos
   */
  getActivos: async (): Promise<CriterioEvaluacion[]> => {
    const response = await apiClient.get<PaginatedResponse<CriterioEvaluacion>>(
      `${BASE_URL}/criterios-evaluacion/`,
      { params: { is_active: true, page_size: 1000, ordering: 'orden' } }
    );
    return response.data.results;
  },

  /**
   * Obtener criterios por tipo de proveedor
   * Backend url_path: 'por-tipo-proveedor'
   */
  porTipoProveedor: async (
    tipoId: number
  ): Promise<{
    tipo_proveedor: string;
    tipo_proveedor_id: number;
    criterios: CriterioEvaluacion[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/criterios-evaluacion/por-tipo-proveedor/`, {
      params: { tipo_id: tipoId },
    });
    return response.data;
  },
};

// ==================== EVALUACIONES DE PROVEEDOR ====================

export const evaluacionProveedorApi = {
  /**
   * Listar evaluaciones
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    proveedor?: number;
    periodo?: string;
    estado?: string;
    evaluado_por?: number;
    ordering?: string;
  }): Promise<PaginatedResponse<EvaluacionProveedor>> => {
    const response = await apiClient.get<PaginatedResponse<EvaluacionProveedor>>(
      `${BASE_URL}/evaluaciones-proveedor/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener evaluación por ID (con detalles)
   */
  getById: async (id: number): Promise<EvaluacionProveedor> => {
    const response = await apiClient.get<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/${id}/`
    );
    return response.data;
  },

  /**
   * Crear evaluación
   */
  create: async (data: CreateEvaluacionProveedorDTO): Promise<EvaluacionProveedor> => {
    const response = await apiClient.post<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar evaluación
   */
  update: async (id: number, data: UpdateEvaluacionProveedorDTO): Promise<EvaluacionProveedor> => {
    const response = await apiClient.patch<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar evaluación
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/evaluaciones-proveedor/${id}/`);
  },

  /**
   * Aprobar evaluación (custom action)
   */
  aprobar: async (id: number, data?: AprobarEvaluacionDTO): Promise<EvaluacionProveedor> => {
    const response = await apiClient.post<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/${id}/aprobar/`,
      data || {}
    );
    return response.data;
  },

  /**
   * Rechazar evaluación (custom action)
   */
  rechazar: async (id: number, motivo: string): Promise<EvaluacionProveedor> => {
    const response = await apiClient.post<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/${id}/rechazar/`,
      { motivo }
    );
    return response.data;
  },

  /**
   * Calcular puntaje de evaluación (custom action)
   */
  calcularPuntaje: async (id: number): Promise<EvaluacionProveedor> => {
    const response = await apiClient.post<EvaluacionProveedor>(
      `${BASE_URL}/evaluaciones-proveedor/${id}/calcular/`
    );
    return response.data;
  },

  /**
   * Obtener evaluaciones por proveedor
   */
  porProveedor: async (
    proveedorId: number,
    params?: { limit?: number }
  ): Promise<EvaluacionProveedor[]> => {
    const response = await apiClient.get<PaginatedResponse<EvaluacionProveedor>>(
      `${BASE_URL}/evaluaciones-proveedor/`,
      { params: { proveedor: proveedorId, ordering: '-fecha_evaluacion', ...params } }
    );
    return response.data.results;
  },

  /**
   * Obtener estadísticas de evaluaciones
   */
  getEstadisticas: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor?: number;
  }): Promise<EstadisticasEvaluacion> => {
    const response = await apiClient.get<EstadisticasEvaluacion>(
      `${BASE_URL}/evaluaciones-proveedor/estadisticas/`,
      { params }
    );
    return response.data;
  },

  /**
   * Exportar evaluaciones a Excel
   */
  exportExcel: async (params?: Record<string, unknown>): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-proveedor/export-excel/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==================== DETALLES DE EVALUACIÓN ====================

export const detalleEvaluacionApi = {
  /**
   * Listar detalles de evaluación
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    evaluacion?: number;
    criterio?: number;
  }): Promise<PaginatedResponse<DetalleEvaluacion>> => {
    const response = await apiClient.get<PaginatedResponse<DetalleEvaluacion>>(
      `${BASE_URL}/detalles-evaluacion/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener detalle por ID
   */
  getById: async (id: number): Promise<DetalleEvaluacion> => {
    const response = await apiClient.get<DetalleEvaluacion>(
      `${BASE_URL}/detalles-evaluacion/${id}/`
    );
    return response.data;
  },

  /**
   * Actualizar detalle de evaluación
   */
  update: async (
    id: number,
    data: { calificacion: number; observaciones?: string }
  ): Promise<DetalleEvaluacion> => {
    const response = await apiClient.patch<DetalleEvaluacion>(
      `${BASE_URL}/detalles-evaluacion/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener detalles por evaluación
   */
  porEvaluacion: async (evaluacionId: number): Promise<DetalleEvaluacion[]> => {
    const response = await apiClient.get<PaginatedResponse<DetalleEvaluacion>>(
      `${BASE_URL}/detalles-evaluacion/`,
      { params: { evaluacion: evaluacionId, page_size: 1000 } }
    );
    return response.data.results;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  criterioEvaluacion: criterioEvaluacionApi,
  evaluacionProveedor: evaluacionProveedorApi,
  detalleEvaluacion: detalleEvaluacionApi,
};
