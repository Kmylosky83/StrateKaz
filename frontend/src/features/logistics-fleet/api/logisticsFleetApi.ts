/**
 * API Client para Logistics Fleet Management
 * Sistema de Gestion de Flota y Transporte
 */
import axiosInstance from '@/api/axios-config';
import type {
  // Catalogos Flota
  TipoVehiculo,
  EstadoVehiculo,
  // Vehiculos
  Vehiculo,
  VehiculoList,
  CreateVehiculoDTO,
  UpdateVehiculoDTO,
  VehiculoFilters,
  PaginatedVehiculosResponse,
  // Documentos
  DocumentoVehiculo,
  // Hoja de Vida
  HojaVidaVehiculo,
  // Mantenimientos
  MantenimientoVehiculo,
  CreateMantenimientoDTO,
  MantenimientoFilters,
  PaginatedMantenimientosResponse,
  // Costos
  CostoOperacion,
  PaginatedCostosResponse,
  // Verificaciones PESV
  VerificacionTercero,
  PaginatedVerificacionesResponse,
  // Catalogos Transporte
  TipoRuta,
  EstadoDespacho,
  // Rutas
  Ruta,
  CreateRutaDTO,
  RutaFilters,
  PaginatedRutasResponse,
  // Conductores
  Conductor,
  CreateConductorDTO,
  ConductorFilters,
  PaginatedConductoresResponse,
  // Programaciones
  ProgramacionRuta,
  PaginatedProgramacionesResponse,
  // Despachos
  Despacho,
  CreateDespachoDTO,
  DespachoFilters,
  PaginatedDespachosResponse,
  DetalleDespacho,
  // Manifiestos
  Manifiesto,
  PaginatedManifiestosResponse,
} from '../types/logistics-fleet.types';

/**
 * Construye query string desde filtros
 */
function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

const BASE_URL_FLOTA = '/api/logistics-fleet/gestion-flota';
const BASE_URL_TRANSPORTE = '/api/logistics-fleet/gestion-transporte';

export const logisticsFleetAPI = {
  // ==================== CATALOGOS FLOTA ====================

  /**
   * Obtener tipos de vehiculos
   */
  getTiposVehiculo: async (): Promise<TipoVehiculo[]> => {
    const response = await axiosInstance.get<TipoVehiculo[]>(
      `${BASE_URL_FLOTA}/tipos-vehiculo/`
    );
    return response.data;
  },

  /**
   * Obtener estados de vehiculos
   */
  getEstadosVehiculo: async (): Promise<EstadoVehiculo[]> => {
    const response = await axiosInstance.get<EstadoVehiculo[]>(
      `${BASE_URL_FLOTA}/estados-vehiculo/`
    );
    return response.data;
  },

  // ==================== VEHICULOS ====================

  /**
   * Obtener lista de vehiculos con filtros
   */
  getVehiculos: async (filters?: VehiculoFilters): Promise<PaginatedVehiculosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_FLOTA}/vehiculos/?${queryString}`
      : `${BASE_URL_FLOTA}/vehiculos/`;
    const response = await axiosInstance.get<PaginatedVehiculosResponse>(url);
    return response.data;
  },

  /**
   * Obtener un vehiculo por ID
   */
  getVehiculo: async (id: number): Promise<Vehiculo> => {
    const response = await axiosInstance.get<Vehiculo>(
      `${BASE_URL_FLOTA}/vehiculos/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo vehiculo
   */
  createVehiculo: async (data: CreateVehiculoDTO): Promise<Vehiculo> => {
    const response = await axiosInstance.post<Vehiculo>(
      `${BASE_URL_FLOTA}/vehiculos/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar vehiculo existente
   */
  updateVehiculo: async (id: number, data: UpdateVehiculoDTO): Promise<Vehiculo> => {
    const response = await axiosInstance.patch<Vehiculo>(
      `${BASE_URL_FLOTA}/vehiculos/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar vehiculo (soft delete)
   */
  deleteVehiculo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL_FLOTA}/vehiculos/${id}/`);
  },

  /**
   * Obtener vehiculos con documentos vencidos
   */
  getVehiculosVencidos: async (): Promise<VehiculoList[]> => {
    const response = await axiosInstance.get<VehiculoList[]>(
      `${BASE_URL_FLOTA}/vehiculos/vencidos/`
    );
    return response.data;
  },

  /**
   * Obtener dashboard de flota
   */
  getDashboardFlota: async (): Promise<{
    total_vehiculos: number;
    vehiculos_disponibles: number;
    vehiculos_mantenimiento: number;
    documentos_por_vencer: number;
    documentos_vencidos: number;
    mantenimientos_pendientes: number;
  }> => {
    const response = await axiosInstance.get(
      `${BASE_URL_FLOTA}/vehiculos/dashboard/`
    );
    return response.data;
  },

  // ==================== DOCUMENTOS ====================

  /**
   * Obtener documentos de un vehiculo
   */
  getDocumentosVehiculo: async (vehiculoId: number): Promise<DocumentoVehiculo[]> => {
    const response = await axiosInstance.get<DocumentoVehiculo[]>(
      `${BASE_URL_FLOTA}/documentos/?vehiculo=${vehiculoId}`
    );
    return response.data;
  },

  /**
   * Crear documento de vehiculo
   */
  createDocumentoVehiculo: async (data: FormData): Promise<DocumentoVehiculo> => {
    const response = await axiosInstance.post<DocumentoVehiculo>(
      `${BASE_URL_FLOTA}/documentos/`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Eliminar documento
   */
  deleteDocumentoVehiculo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL_FLOTA}/documentos/${id}/`);
  },

  // ==================== HOJA DE VIDA ====================

  /**
   * Obtener hoja de vida de un vehiculo
   */
  getHojaVidaVehiculo: async (vehiculoId: number): Promise<HojaVidaVehiculo[]> => {
    const response = await axiosInstance.get<HojaVidaVehiculo[]>(
      `${BASE_URL_FLOTA}/hoja-vida/?vehiculo=${vehiculoId}`
    );
    return response.data;
  },

  /**
   * Crear registro en hoja de vida
   */
  createHojaVidaVehiculo: async (data: FormData): Promise<HojaVidaVehiculo> => {
    const response = await axiosInstance.post<HojaVidaVehiculo>(
      `${BASE_URL_FLOTA}/hoja-vida/`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // ==================== MANTENIMIENTOS ====================

  /**
   * Obtener lista de mantenimientos con filtros
   */
  getMantenimientos: async (
    filters?: MantenimientoFilters
  ): Promise<PaginatedMantenimientosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_FLOTA}/mantenimientos/?${queryString}`
      : `${BASE_URL_FLOTA}/mantenimientos/`;
    const response = await axiosInstance.get<PaginatedMantenimientosResponse>(url);
    return response.data;
  },

  /**
   * Obtener un mantenimiento por ID
   */
  getMantenimiento: async (id: number): Promise<MantenimientoVehiculo> => {
    const response = await axiosInstance.get<MantenimientoVehiculo>(
      `${BASE_URL_FLOTA}/mantenimientos/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo mantenimiento
   */
  createMantenimiento: async (
    data: CreateMantenimientoDTO
  ): Promise<MantenimientoVehiculo> => {
    const response = await axiosInstance.post<MantenimientoVehiculo>(
      `${BASE_URL_FLOTA}/mantenimientos/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar mantenimiento
   */
  updateMantenimiento: async (
    id: number,
    data: Partial<CreateMantenimientoDTO>
  ): Promise<MantenimientoVehiculo> => {
    const response = await axiosInstance.patch<MantenimientoVehiculo>(
      `${BASE_URL_FLOTA}/mantenimientos/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Completar mantenimiento
   */
  completarMantenimiento: async (
    id: number,
    data: {
      fecha_ejecucion: string;
      costo_mano_obra?: number;
      costo_repuestos?: number;
      proveedor_nombre?: string;
      factura_numero?: string;
    }
  ): Promise<MantenimientoVehiculo> => {
    const response = await axiosInstance.post<MantenimientoVehiculo>(
      `${BASE_URL_FLOTA}/mantenimientos/${id}/completar/`,
      data
    );
    return response.data;
  },

  // ==================== COSTOS OPERACION ====================

  /**
   * Obtener costos de operacion con filtros
   */
  getCostosOperacion: async (filters?: {
    vehiculo?: number;
    tipo_costo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedCostosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_FLOTA}/costos-operacion/?${queryString}`
      : `${BASE_URL_FLOTA}/costos-operacion/`;
    const response = await axiosInstance.get<PaginatedCostosResponse>(url);
    return response.data;
  },

  /**
   * Crear costo de operacion
   */
  createCostoOperacion: async (data: Partial<CostoOperacion>): Promise<CostoOperacion> => {
    const response = await axiosInstance.post<CostoOperacion>(
      `${BASE_URL_FLOTA}/costos-operacion/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener estadisticas de costos
   */
  getEstadisticasCostos: async (filters?: {
    vehiculo?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{
    total_costos: number;
    costo_promedio_km: number;
    consumo_promedio: number;
    costos_por_tipo: Array<{ tipo: string; total: number }>;
  }> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_FLOTA}/costos-operacion/estadisticas/?${queryString}`
      : `${BASE_URL_FLOTA}/costos-operacion/estadisticas/`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // ==================== VERIFICACIONES PESV ====================

  /**
   * Obtener verificaciones con filtros
   */
  getVerificaciones: async (filters?: {
    vehiculo?: number;
    tipo?: string;
    resultado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedVerificacionesResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_FLOTA}/verificaciones/?${queryString}`
      : `${BASE_URL_FLOTA}/verificaciones/`;
    const response = await axiosInstance.get<PaginatedVerificacionesResponse>(url);
    return response.data;
  },

  /**
   * Crear verificacion PESV
   */
  createVerificacion: async (
    data: Partial<VerificacionTercero>
  ): Promise<VerificacionTercero> => {
    const response = await axiosInstance.post<VerificacionTercero>(
      `${BASE_URL_FLOTA}/verificaciones/`,
      data
    );
    return response.data;
  },

  // ==================== CATALOGOS TRANSPORTE ====================

  /**
   * Obtener tipos de rutas
   */
  getTiposRuta: async (): Promise<TipoRuta[]> => {
    const response = await axiosInstance.get<TipoRuta[]>(
      `${BASE_URL_TRANSPORTE}/tipos-ruta/`
    );
    return response.data;
  },

  /**
   * Obtener estados de despacho
   */
  getEstadosDespacho: async (): Promise<EstadoDespacho[]> => {
    const response = await axiosInstance.get<EstadoDespacho[]>(
      `${BASE_URL_TRANSPORTE}/estados-despacho/`
    );
    return response.data;
  },

  // ==================== RUTAS ====================

  /**
   * Obtener lista de rutas con filtros
   */
  getRutas: async (filters?: RutaFilters): Promise<PaginatedRutasResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_TRANSPORTE}/rutas/?${queryString}`
      : `${BASE_URL_TRANSPORTE}/rutas/`;
    const response = await axiosInstance.get<PaginatedRutasResponse>(url);
    return response.data;
  },

  /**
   * Obtener una ruta por ID
   */
  getRuta: async (id: number): Promise<Ruta> => {
    const response = await axiosInstance.get<Ruta>(
      `${BASE_URL_TRANSPORTE}/rutas/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nueva ruta
   */
  createRuta: async (data: CreateRutaDTO): Promise<Ruta> => {
    const response = await axiosInstance.post<Ruta>(
      `${BASE_URL_TRANSPORTE}/rutas/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar ruta existente
   */
  updateRuta: async (id: number, data: Partial<CreateRutaDTO>): Promise<Ruta> => {
    const response = await axiosInstance.patch<Ruta>(
      `${BASE_URL_TRANSPORTE}/rutas/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar ruta (soft delete)
   */
  deleteRuta: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL_TRANSPORTE}/rutas/${id}/`);
  },

  // ==================== CONDUCTORES ====================

  /**
   * Obtener lista de conductores con filtros
   */
  getConductores: async (
    filters?: ConductorFilters
  ): Promise<PaginatedConductoresResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_TRANSPORTE}/conductores/?${queryString}`
      : `${BASE_URL_TRANSPORTE}/conductores/`;
    const response = await axiosInstance.get<PaginatedConductoresResponse>(url);
    return response.data;
  },

  /**
   * Obtener un conductor por ID
   */
  getConductor: async (id: number): Promise<Conductor> => {
    const response = await axiosInstance.get<Conductor>(
      `${BASE_URL_TRANSPORTE}/conductores/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo conductor
   */
  createConductor: async (data: CreateConductorDTO): Promise<Conductor> => {
    const response = await axiosInstance.post<Conductor>(
      `${BASE_URL_TRANSPORTE}/conductores/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar conductor existente
   */
  updateConductor: async (
    id: number,
    data: Partial<CreateConductorDTO>
  ): Promise<Conductor> => {
    const response = await axiosInstance.patch<Conductor>(
      `${BASE_URL_TRANSPORTE}/conductores/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar conductor (soft delete)
   */
  deleteConductor: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL_TRANSPORTE}/conductores/${id}/`);
  },

  /**
   * Obtener conductores con licencia vencida
   */
  getConductoresLicenciaVencida: async (): Promise<Conductor[]> => {
    const response = await axiosInstance.get<Conductor[]>(
      `${BASE_URL_TRANSPORTE}/conductores/licencia-vencida/`
    );
    return response.data;
  },

  // ==================== PROGRAMACIONES ====================

  /**
   * Obtener lista de programaciones con filtros
   */
  getProgramaciones: async (filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
    vehiculo?: number;
    conductor?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedProgramacionesResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_TRANSPORTE}/programaciones/?${queryString}`
      : `${BASE_URL_TRANSPORTE}/programaciones/`;
    const response = await axiosInstance.get<PaginatedProgramacionesResponse>(url);
    return response.data;
  },

  /**
   * Obtener una programacion por ID
   */
  getProgramacion: async (id: number): Promise<ProgramacionRuta> => {
    const response = await axiosInstance.get<ProgramacionRuta>(
      `${BASE_URL_TRANSPORTE}/programaciones/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nueva programacion
   */
  createProgramacion: async (
    data: Partial<ProgramacionRuta>
  ): Promise<ProgramacionRuta> => {
    const response = await axiosInstance.post<ProgramacionRuta>(
      `${BASE_URL_TRANSPORTE}/programaciones/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar programacion
   */
  updateProgramacion: async (
    id: number,
    data: Partial<ProgramacionRuta>
  ): Promise<ProgramacionRuta> => {
    const response = await axiosInstance.patch<ProgramacionRuta>(
      `${BASE_URL_TRANSPORTE}/programaciones/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Iniciar viaje
   */
  iniciarViaje: async (
    id: number,
    data: { km_inicial: number }
  ): Promise<ProgramacionRuta> => {
    const response = await axiosInstance.post<ProgramacionRuta>(
      `${BASE_URL_TRANSPORTE}/programaciones/${id}/iniciar/`,
      data
    );
    return response.data;
  },

  /**
   * Finalizar viaje
   */
  finalizarViaje: async (
    id: number,
    data: { km_final: number; observaciones?: string }
  ): Promise<ProgramacionRuta> => {
    const response = await axiosInstance.post<ProgramacionRuta>(
      `${BASE_URL_TRANSPORTE}/programaciones/${id}/finalizar/`,
      data
    );
    return response.data;
  },

  // ==================== DESPACHOS ====================

  /**
   * Obtener lista de despachos con filtros
   */
  getDespachos: async (filters?: DespachoFilters): Promise<PaginatedDespachosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_TRANSPORTE}/despachos/?${queryString}`
      : `${BASE_URL_TRANSPORTE}/despachos/`;
    const response = await axiosInstance.get<PaginatedDespachosResponse>(url);
    return response.data;
  },

  /**
   * Obtener un despacho por ID
   */
  getDespacho: async (id: number): Promise<Despacho> => {
    const response = await axiosInstance.get<Despacho>(
      `${BASE_URL_TRANSPORTE}/despachos/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo despacho
   */
  createDespacho: async (data: CreateDespachoDTO): Promise<Despacho> => {
    const response = await axiosInstance.post<Despacho>(
      `${BASE_URL_TRANSPORTE}/despachos/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar despacho
   */
  updateDespacho: async (id: number, data: Partial<CreateDespachoDTO>): Promise<Despacho> => {
    const response = await axiosInstance.patch<Despacho>(
      `${BASE_URL_TRANSPORTE}/despachos/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Obtener detalles de un despacho
   */
  getDetallesDespacho: async (despachoId: number): Promise<DetalleDespacho[]> => {
    const response = await axiosInstance.get<DetalleDespacho[]>(
      `${BASE_URL_TRANSPORTE}/detalles-despacho/?despacho=${despachoId}`
    );
    return response.data;
  },

  /**
   * Agregar detalle a despacho
   */
  addDetalleDespacho: async (
    data: Partial<DetalleDespacho>
  ): Promise<DetalleDespacho> => {
    const response = await axiosInstance.post<DetalleDespacho>(
      `${BASE_URL_TRANSPORTE}/detalles-despacho/`,
      data
    );
    return response.data;
  },

  // ==================== MANIFIESTOS ====================

  /**
   * Obtener lista de manifiestos con filtros
   */
  getManifiestos: async (filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedManifiestosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
      ? `${BASE_URL_TRANSPORTE}/manifiestos/?${queryString}`
      : `${BASE_URL_TRANSPORTE}/manifiestos/`;
    const response = await axiosInstance.get<PaginatedManifiestosResponse>(url);
    return response.data;
  },

  /**
   * Obtener un manifiesto por ID
   */
  getManifiesto: async (id: number): Promise<Manifiesto> => {
    const response = await axiosInstance.get<Manifiesto>(
      `${BASE_URL_TRANSPORTE}/manifiestos/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo manifiesto
   */
  createManifiesto: async (data: Partial<Manifiesto>): Promise<Manifiesto> => {
    const response = await axiosInstance.post<Manifiesto>(
      `${BASE_URL_TRANSPORTE}/manifiestos/`,
      data
    );
    return response.data;
  },

  /**
   * Generar PDF del manifiesto
   */
  generarPDFManifiesto: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(
      `${BASE_URL_TRANSPORTE}/manifiestos/${id}/generar-pdf/`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
