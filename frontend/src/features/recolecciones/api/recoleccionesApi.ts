/**
 * API Client para el modulo de Recolecciones
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import axiosInstance from '@/api/axios-config';
import type {
  Recoleccion,
  RecoleccionDetalle,
  RecoleccionFilters,
  RecoleccionEstadisticas,
  PaginatedRecolecciones,
  PaginatedProgramacionesEnRuta,
  RegistrarRecoleccionDTO,
  RegistrarRecoleccionResponse,
  VoucherData,
} from '../types/recoleccion.types';

/**
 * API Client para gestion de Recolecciones
 */
export const recoleccionesAPI = {
  // ==================== RECOLECCIONES CRUD ====================

  /**
   * Obtener lista de recolecciones con paginacion y filtros
   */
  getRecolecciones: async (filters?: RecoleccionFilters): Promise<PaginatedRecolecciones> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ecoaliado) params.append('ecoaliado', filters.ecoaliado.toString());
    if (filters?.recolector) params.append('recolector', filters.recolector.toString());
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const url = queryString ? `/recolecciones/?${queryString}` : '/recolecciones/';

    const response = await axiosInstance.get<PaginatedRecolecciones>(url);
    return response.data;
  },

  /**
   * Obtener detalle de una recoleccion
   */
  getRecoleccion: async (id: number): Promise<RecoleccionDetalle> => {
    const response = await axiosInstance.get<RecoleccionDetalle>(`/recolecciones/${id}/`);
    return response.data;
  },

  /**
   * Registrar una nueva recoleccion desde una programacion EN_RUTA
   */
  registrarRecoleccion: async (data: RegistrarRecoleccionDTO): Promise<RegistrarRecoleccionResponse> => {
    const response = await axiosInstance.post<RegistrarRecoleccionResponse>(
      '/recolecciones/registrar/',
      data
    );
    return response.data;
  },

  // ==================== VOUCHER ====================

  /**
   * Obtener datos del voucher de una recoleccion
   */
  getVoucher: async (id: number): Promise<VoucherData> => {
    const response = await axiosInstance.get<VoucherData>(`/recolecciones/${id}/voucher/`);
    return response.data;
  },

  // ==================== ESTADISTICAS ====================

  /**
   * Obtener estadisticas de recolecciones
   */
  getEstadisticas: async (
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<RecoleccionEstadisticas> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const queryString = params.toString();
    const url = queryString
      ? `/recolecciones/estadisticas/?${queryString}`
      : '/recolecciones/estadisticas/';

    const response = await axiosInstance.get<RecoleccionEstadisticas>(url);
    return response.data;
  },

  // ==================== PROGRAMACIONES EN RUTA ====================

  /**
   * Obtener programaciones EN_RUTA disponibles para registrar recoleccion
   */
  getProgramacionesEnRuta: async (): Promise<PaginatedProgramacionesEnRuta> => {
    const response = await axiosInstance.get<PaginatedProgramacionesEnRuta>(
      '/recolecciones/programaciones-en-ruta/'
    );
    return response.data;
  },

  // ==================== MIS RECOLECCIONES ====================

  /**
   * Obtener recolecciones del recolector actual
   */
  getMisRecolecciones: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedRecolecciones> => {
    const response = await axiosInstance.get<PaginatedRecolecciones>(
      `/recolecciones/mis-recolecciones/?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  // ==================== POR ECOALIADO ====================

  /**
   * Obtener recolecciones de un ecoaliado especifico
   */
  getRecoleccionesPorEcoaliado: async (
    ecoaliadoId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedRecolecciones> => {
    const response = await axiosInstance.get<PaginatedRecolecciones>(
      `/recolecciones/por-ecoaliado/${ecoaliadoId}/?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },
};
