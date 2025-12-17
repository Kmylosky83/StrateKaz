/**
 * API Client para el modulo de Recepciones
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import axiosInstance from '@/api/axios-config';
import type {
  Recepcion,
  RecepcionDetallada,
  RecepcionFilters,
  RecepcionEstadisticas,
  PaginatedRecepciones,
  RecoleccionesPendientesResponse,
  IniciarRecepcionDTO,
  IniciarRecepcionResponse,
  RegistrarPesajeDTO,
  RegistrarPesajeResponse,
  ConfirmarRecepcionDTO,
  ConfirmarRecepcionResponse,
  CancelarRecepcionDTO,
  CancelarRecepcionResponse,
  RecepccionesPorRecolectorResponse,
} from '../types/recepcion.types';

/**
 * API Client para gestion de Recepciones de Materia Prima
 */
export const recepcionesAPI = {
  // ==================== RECEPCIONES CRUD ====================

  /**
   * Obtener lista de recepciones con paginacion y filtros
   */
  getRecepciones: async (filters?: RecepcionFilters): Promise<PaginatedRecepciones> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.recolector) params.append('recolector', filters.recolector.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const url = queryString ? `/recepciones/?${queryString}` : '/recepciones/';

    const response = await axiosInstance.get<PaginatedRecepciones>(url);
    return response.data;
  },

  /**
   * Obtener detalle de una recepcion
   */
  getRecepcion: async (id: number): Promise<RecepcionDetallada> => {
    const response = await axiosInstance.get<RecepcionDetallada>(`/recepciones/${id}/`);
    return response.data;
  },

  // ==================== INICIAR RECEPCION ====================

  /**
   * Iniciar una nueva recepcion de materia prima
   * Agrupa varias recolecciones de un recolector en una sola recepcion
   */
  iniciarRecepcion: async (data: IniciarRecepcionDTO): Promise<IniciarRecepcionResponse> => {
    const response = await axiosInstance.post<IniciarRecepcionResponse>(
      '/recepciones/iniciar/',
      data
    );
    return response.data;
  },

  // ==================== REGISTRAR PESAJE ====================

  /**
   * Registrar peso en bascula para una recepcion INICIADA
   * Calcula la merma automaticamente
   */
  registrarPesaje: async (
    id: number,
    data: RegistrarPesajeDTO
  ): Promise<RegistrarPesajeResponse> => {
    const response = await axiosInstance.post<RegistrarPesajeResponse>(
      `/recepciones/${id}/registrar-pesaje/`,
      data
    );
    return response.data;
  },

  // ==================== CONFIRMAR RECEPCION ====================

  /**
   * Confirmar recepcion y aplicar prorrateo de merma
   * Actualiza las recolecciones con los pesos reales
   */
  confirmarRecepcion: async (
    id: number,
    data?: ConfirmarRecepcionDTO
  ): Promise<ConfirmarRecepcionResponse> => {
    const response = await axiosInstance.post<ConfirmarRecepcionResponse>(
      `/recepciones/${id}/confirmar/`,
      data || {}
    );
    return response.data;
  },

  // ==================== CANCELAR RECEPCION ====================

  /**
   * Cancelar una recepcion en estado INICIADA o PESADA
   */
  cancelarRecepcion: async (
    id: number,
    data: CancelarRecepcionDTO
  ): Promise<CancelarRecepcionResponse> => {
    const response = await axiosInstance.post<CancelarRecepcionResponse>(
      `/recepciones/${id}/cancelar/`,
      data
    );
    return response.data;
  },

  // ==================== RECOLECCIONES PENDIENTES ====================

  /**
   * Obtener recolecciones completadas sin recepcion
   * Disponibles para ser incluidas en una recepcion
   */
  getRecoleccionesPendientes: async (
    recolectorId?: number,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<RecoleccionesPendientesResponse> => {
    const params = new URLSearchParams();
    if (recolectorId) params.append('recolector', recolectorId.toString());
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const queryString = params.toString();
    const url = queryString
      ? `/recepciones/pendientes/?${queryString}`
      : '/recepciones/pendientes/';

    const response = await axiosInstance.get<RecoleccionesPendientesResponse>(url);
    return response.data;
  },

  // ==================== ESTADISTICAS ====================

  /**
   * Obtener estadisticas de recepciones
   */
  getEstadisticas: async (
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<RecepcionEstadisticas> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const queryString = params.toString();
    const url = queryString
      ? `/recepciones/estadisticas/?${queryString}`
      : '/recepciones/estadisticas/';

    const response = await axiosInstance.get<RecepcionEstadisticas>(url);
    return response.data;
  },

  // ==================== POR RECOLECTOR ====================

  /**
   * Obtener recepciones de un recolector especifico
   */
  getRecepcionesPorRecolector: async (
    recolectorId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<RecepccionesPorRecolectorResponse> => {
    const response = await axiosInstance.get<RecepccionesPorRecolectorResponse>(
      `/recepciones/por-recolector/${recolectorId}/?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  // ==================== ELIMINAR ====================

  /**
   * Eliminar (soft delete) una recepcion
   * Solo recepciones en estado INICIADA o CANCELADA
   */
  deleteRecepcion: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/recepciones/${id}/`);
  },
};
