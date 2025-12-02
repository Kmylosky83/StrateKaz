import axiosInstance from '@/api/axios-config';
import type {
  Ecoaliado,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  CambiarPrecioEcoaliadoDTO,
  EcoaliadoFilters,
  PaginatedResponse,
  HistorialPrecioEcoaliado,
  UnidadNegocio,
} from '../types/ecoaliado.types';

/**
 * API Client para gestión de Ecoaliados
 */
export const ecoaliadosAPI = {
  // ==================== ECOALIADOS CRUD ====================

  /**
   * Obtener lista de ecoaliados con paginación y filtros
   */
  getEcoaliados: async (filters?: EcoaliadoFilters): Promise<PaginatedResponse<Ecoaliado>> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.unidad_negocio) params.append('unidad_negocio', String(filters.unidad_negocio));
    if (filters?.ciudad) params.append('ciudad', filters.ciudad);
    if (filters?.departamento) params.append('departamento', filters.departamento);
    if (filters?.tiene_geolocalizacion !== undefined) {
      params.append('tiene_geolocalizacion', String(filters.tiene_geolocalizacion));
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active));
    }
    if (filters?.comercial_asignado) {
      params.append('comercial_asignado', String(filters.comercial_asignado));
    }
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString ? `/ecoaliados/ecoaliados/?${queryString}` : '/ecoaliados/ecoaliados/';

    const response = await axiosInstance.get<PaginatedResponse<Ecoaliado>>(url);
    return response.data;
  },

  /**
   * Obtener un ecoaliado por ID
   */
  getEcoaliado: async (id: number): Promise<Ecoaliado> => {
    const response = await axiosInstance.get<Ecoaliado>(`/ecoaliados/ecoaliados/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo ecoaliado
   */
  createEcoaliado: async (data: CreateEcoaliadoDTO): Promise<Ecoaliado> => {
    const response = await axiosInstance.post<Ecoaliado>('/ecoaliados/ecoaliados/', data);
    return response.data;
  },

  /**
   * Actualizar ecoaliado existente
   */
  updateEcoaliado: async (id: number, data: UpdateEcoaliadoDTO): Promise<Ecoaliado> => {
    const response = await axiosInstance.patch<Ecoaliado>(`/ecoaliados/ecoaliados/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar ecoaliado (soft delete)
   */
  deleteEcoaliado: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/ecoaliados/ecoaliados/${id}/`);
  },

  // ==================== GESTIÓN DE PRECIOS ====================

  /**
   * Cambiar precio de ecoaliado (Solo Líder Comercial+)
   */
  cambiarPrecio: async (
    id: number,
    data: CambiarPrecioEcoaliadoDTO
  ): Promise<{ message: string; ecoaliado: Ecoaliado }> => {
    const response = await axiosInstance.post<{ message: string; ecoaliado: Ecoaliado }>(
      `/ecoaliados/ecoaliados/${id}/cambiar-precio/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener historial de cambios de precio
   */
  getHistorialPrecios: async (id: number): Promise<{
    ecoaliado: string;
    ecoaliado_nombre: string;
    precio_actual: string;
    total_cambios: number;
    historial: HistorialPrecioEcoaliado[];
  }> => {
    const response = await axiosInstance.get<{
      ecoaliado: string;
      ecoaliado_nombre: string;
      precio_actual: string;
      total_cambios: number;
      historial: HistorialPrecioEcoaliado[];
    }>(`/ecoaliados/ecoaliados/${id}/historial-precios/`);
    return response.data;
  },

  // ==================== UNIDADES DE NEGOCIO ====================

  /**
   * Obtener lista de unidades de negocio (tipo UNIDAD_NEGOCIO)
   */
  getUnidadesNegocio: async (): Promise<PaginatedResponse<UnidadNegocio>> => {
    const response = await axiosInstance.get<PaginatedResponse<UnidadNegocio>>(
      '/ecoaliados/ecoaliados/unidades-negocio/'
    );
    return response.data;
  },

  /**
   * Activar/Desactivar ecoaliado
   */
  toggleEcoaliadoStatus: async (id: number, is_active: boolean): Promise<Ecoaliado> => {
    const response = await axiosInstance.patch<Ecoaliado>(`/ecoaliados/ecoaliados/${id}/`, {
      is_active,
    });
    return response.data;
  },
};
