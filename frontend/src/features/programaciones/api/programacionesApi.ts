import axiosInstance from '@/api/axios-config';
import { CargoCodes } from '@/constants/permissions';
import type {
  Programacion,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  AsignarRecolectorDTO,
  CambiarEstadoDTO,
  ReprogramarDTO,
  ProgramacionFilters,
  PaginatedResponse,
  EstadisticasProgramaciones,
  HistorialProgramacion,
  Recolector,
  ProveedorSimple,
  UnidadNegocio,
} from '../types/programacion.types';

/**
 * API Client para gestión de Programaciones de Recolección
 */
export const programacionesAPI = {
  // ==================== PROGRAMACIONES CRUD ====================

  /**
   * Obtener lista de programaciones con paginación y filtros
   */
  getProgramaciones: async (
    filters?: ProgramacionFilters
  ): Promise<PaginatedResponse<Programacion>> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ecoaliado) params.append('ecoaliado', String(filters.ecoaliado));
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipo_programacion) params.append('tipo_programacion', filters.tipo_programacion);
    if (filters?.recolector_asignado) {
      params.append('recolector_asignado', String(filters.recolector_asignado));
    }
    if (filters?.programado_por) {
      params.append('programado_por', String(filters.programado_por));
    }
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.tiene_recolector !== undefined) {
      params.append('tiene_recolector', String(filters.tiene_recolector));
    }
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString
      ? `/programaciones/programaciones/?${queryString}`
      : '/programaciones/programaciones/';

    const response = await axiosInstance.get<PaginatedResponse<Programacion>>(url);
    return response.data;
  },

  /**
   * Obtener una programación por ID
   */
  getProgramacion: async (id: number): Promise<Programacion> => {
    const response = await axiosInstance.get<Programacion>(
      `/programaciones/programaciones/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nueva programación
   */
  createProgramacion: async (data: CreateProgramacionDTO): Promise<Programacion> => {
    const response = await axiosInstance.post<Programacion>(
      '/programaciones/programaciones/',
      data
    );
    return response.data;
  },

  /**
   * Actualizar programación existente
   */
  updateProgramacion: async (id: number, data: UpdateProgramacionDTO): Promise<Programacion> => {
    const response = await axiosInstance.patch<Programacion>(
      `/programaciones/programaciones/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar programación (soft delete)
   */
  deleteProgramacion: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/programaciones/programaciones/${id}/`);
  },

  // ==================== ACCIONES DE PROGRAMACIÓN ====================

  /**
   * Asignar recolector a una programación
   */
  asignarRecolector: async (
    id: number,
    data: AsignarRecolectorDTO
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/asignar-recolector/`, data);
    return response.data;
  },

  /**
   * Cambiar estado de una programación
   */
  cambiarEstado: async (
    id: number,
    data: CambiarEstadoDTO
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/cambiar-estado/`, data);
    return response.data;
  },

  /**
   * Reprogramar una recolección
   */
  reprogramar: async (
    id: number,
    data: ReprogramarDTO
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/reprogramar/`, data);
    return response.data;
  },

  /**
   * Cancelar programación
   */
  cancelarProgramacion: async (
    id: number,
    motivo: string
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/cancelar/`, { motivo_cancelacion: motivo });
    return response.data;
  },

  /**
   * Iniciar ruta (cambiar estado a EN_RUTA)
   */
  iniciarRuta: async (
    id: number
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/iniciar-ruta/`);
    return response.data;
  },

  /**
   * Completar recolección
   */
  completarRecoleccion: async (
    id: number,
    cantidadKg: number,
    observaciones?: string
  ): Promise<{ message: string; programacion: Programacion }> => {
    const response = await axiosInstance.post<{
      message: string;
      programacion: Programacion;
    }>(`/programaciones/programaciones/${id}/completar/`, {
      cantidad_recolectada_kg: cantidadKg,
      observaciones,
    });
    return response.data;
  },

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas de programaciones
   */
  getEstadisticas: async (
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<EstadisticasProgramaciones> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    const queryString = params.toString();
    const url = queryString
      ? `/programaciones/programaciones/estadisticas/?${queryString}`
      : '/programaciones/programaciones/estadisticas/';

    const response = await axiosInstance.get<EstadisticasProgramaciones>(url);
    return response.data;
  },

  // ==================== HISTORIAL ====================

  /**
   * Obtener historial de cambios de una programación
   */
  getHistorial: async (id: number): Promise<HistorialProgramacion[]> => {
    const response = await axiosInstance.get<HistorialProgramacion[]>(
      `/programaciones/programaciones/${id}/historial/`
    );
    return response.data;
  },

  // ==================== RECOLECTORES ====================

  /**
   * Obtener lista de recolectores activos
   */
  getRecolectores: async (): Promise<PaginatedResponse<Recolector>> => {
    // Obtener usuarios con cargo de recolector
    const response = await axiosInstance.get<PaginatedResponse<Recolector>>(
      `/core/users/?cargo__code=${CargoCodes.RECOLECTOR_ECONORTE}&is_active=true&page_size=100`
    );
    return response.data;
  },

  /**
   * Obtener recolectores disponibles para una fecha
   */
  getRecolectoresDisponibles: async (
    fecha: string
  ): Promise<PaginatedResponse<Recolector>> => {
    const response = await axiosInstance.get<PaginatedResponse<Recolector>>(
      `/programaciones/recolectores/disponibles/?fecha=${fecha}`
    );
    return response.data;
  },

  // ==================== ECOALIADOS Y UNIDADES ====================

  /**
   * Obtener lista de ecoaliados activos (filtrados por rol en backend)
   */
  getEcoaliados: async (unidadNegocio?: number): Promise<PaginatedResponse<ProveedorSimple>> => {
    const params = new URLSearchParams();
    params.append('is_active', 'true');
    params.append('page_size', '1000');
    if (unidadNegocio) {
      params.append('unidad_negocio', String(unidadNegocio));
    }

    const response = await axiosInstance.get<PaginatedResponse<ProveedorSimple>>(
      `/ecoaliados/ecoaliados/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener lista de unidades de negocio
   */
  getUnidadesNegocio: async (): Promise<PaginatedResponse<UnidadNegocio>> => {
    const response = await axiosInstance.get<PaginatedResponse<UnidadNegocio>>(
      '/ecoaliados/ecoaliados/unidades-negocio/'
    );
    return response.data;
  },

  // ==================== CALENDARIO ====================

  /**
   * Obtener programaciones para vista de calendario
   */
  getProgramacionesCalendario: async (
    fechaInicio: string,
    fechaFin: string,
    filtros?: Pick<ProgramacionFilters, 'estado' | 'recolector_asignado' | 'tipo_programacion'>
  ): Promise<Programacion[]> => {
    const params = new URLSearchParams();
    params.append('fecha_desde', fechaInicio);
    params.append('fecha_hasta', fechaFin);
    params.append('page_size', '1000'); // Sin paginación para calendario

    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.recolector_asignado) {
      params.append('recolector_asignado', String(filtros.recolector_asignado));
    }
    if (filtros?.tipo_programacion) params.append('tipo_programacion', filtros.tipo_programacion);

    const response = await axiosInstance.get<PaginatedResponse<Programacion>>(
      `/programaciones/programaciones/?${params.toString()}`
    );
    return response.data.results;
  },
};
