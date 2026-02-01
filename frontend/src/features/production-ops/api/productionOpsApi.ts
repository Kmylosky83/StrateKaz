/**
 * API Client para Production Ops
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Recepción de Materia Prima
 * - Procesamiento y Lotes
 * - Mantenimiento de Equipos
 * - Producto Terminado
 */
import { apiClient } from '@/lib/api-client';
import type {
  // Recepción - Types
  TipoRecepcion,
  EstadoRecepcion,
  PuntoRecepcion,
  Recepcion,
  RecepcionList,
  DetalleRecepcion,
  ControlCalidadRecepcion,
  CreateRecepcionDTO,
  UpdateRecepcionDTO,
  CreateDetalleRecepcionDTO,
  CreateControlCalidadRecepcionDTO,

  // Procesamiento - Types
  TipoProceso,
  EstadoProceso,
  LineaProduccion,
  OrdenProduccion,
  OrdenProduccionList,
  LoteProduccion,
  LoteProduccionList,
  ConsumoMateriaPrima,
  ControlCalidadProceso,
  CreateOrdenProduccionDTO,
  UpdateOrdenProduccionDTO,
  CreateLoteProduccionDTO,
  CreateConsumoMateriaPrimaDTO,
  CreateControlCalidadProcesoDTO,
  IniciarOrdenProduccionDTO,
  FinalizarOrdenProduccionDTO,

  // Mantenimiento - Types
  TipoActivo,
  TipoMantenimiento,
  ActivoProduccion,
  ActivoProduccionList,
  EquipoMedicion,
  EquipoMedicionList,
  PlanMantenimiento,
  PlanMantenimientoList,
  OrdenTrabajo,
  OrdenTrabajoList,
  Calibracion,
  CalibracionList,
  Parada,
  ParadaList,
  CreateActivoProduccionDTO,
  UpdateActivoProduccionDTO,
  CreateEquipoMedicionDTO,
  CreatePlanMantenimientoDTO,
  CreateOrdenTrabajoDTO,
  UpdateOrdenTrabajoDTO,
  IniciarOrdenTrabajoDTO,
  CompletarOrdenTrabajoDTO,
  CreateCalibracionDTO,
  CreateParadaDTO,
  UpdateParadaDTO,
  CerrarParadaDTO,

  // Producto Terminado - Types
  TipoProducto,
  EstadoLote,
  ProductoTerminado,
  ProductoTerminadoList,
  StockProducto,
  StockProductoList,
  Liberacion,
  LiberacionList,
  CertificadoCalidad,
  CertificadoCalidadList,
  CreateProductoTerminadoDTO,
  CreateStockProductoDTO,
  UpdateStockProductoDTO,
  CreateLiberacionDTO,
  UpdateLiberacionDTO,
  AprobarLiberacionDTO,
  RechazarLiberacionDTO,
  CreateCertificadoCalidadDTO,
  ReservarCantidadDTO,
  LiberarReservaDTO,
  ConsumirCantidadDTO,

  // Common
  PaginatedResponse,
} from '../types/production-ops.types';

const BASE_URL = '/api/production-ops';

// ==================== RECEPCIÓN - CATÁLOGOS ====================

export const tipoRecepcionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TipoRecepcion>> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/tipos-recepcion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoRecepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/tipos-recepcion/${id}/`);
    return response.data;
  },

  create: async (data: Partial<TipoRecepcion>): Promise<TipoRecepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/tipos-recepcion/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<TipoRecepcion>): Promise<TipoRecepcion> => {
    const response = await apiClient.patch(`${BASE_URL}/recepcion/tipos-recepcion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recepcion/tipos-recepcion/${id}/`);
  },

  getActivos: async (): Promise<TipoRecepcion[]> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/tipos-recepcion/activos/`);
    return response.data;
  },
};

export const estadoRecepcionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<EstadoRecepcion>> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/estados-recepcion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EstadoRecepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/estados-recepcion/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<EstadoRecepcion[]> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/estados-recepcion/activos/`);
    return response.data;
  },
};

export const puntoRecepcionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<PuntoRecepcion>> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/puntos-recepcion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PuntoRecepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/puntos-recepcion/${id}/`);
    return response.data;
  },

  create: async (data: Partial<PuntoRecepcion>): Promise<PuntoRecepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/puntos-recepcion/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<PuntoRecepcion>): Promise<PuntoRecepcion> => {
    const response = await apiClient.patch(`${BASE_URL}/recepcion/puntos-recepcion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recepcion/puntos-recepcion/${id}/`);
  },
};

// ==================== RECEPCIÓN - PRINCIPALES ====================

export const recepcionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    proveedor?: number;
    tipo_recepcion?: number;
    estado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<RecepcionList>> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/recepciones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Recepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/recepciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateRecepcionDTO): Promise<Recepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/recepciones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRecepcionDTO): Promise<Recepcion> => {
    const response = await apiClient.patch(`${BASE_URL}/recepcion/recepciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recepcion/recepciones/${id}/`);
  },

  cambiarEstado: async (id: number, nuevoEstadoId: number): Promise<Recepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/recepciones/${id}/cambiar_estado/`, {
      nuevo_estado: nuevoEstadoId,
    });
    return response.data;
  },
};

export const detalleRecepcionApi = {
  getAll: async (params?: {
    recepcion?: number;
    tipo_materia_prima?: number;
  }): Promise<DetalleRecepcion[]> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/detalles/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<DetalleRecepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/detalles/${id}/`);
    return response.data;
  },

  create: async (data: CreateDetalleRecepcionDTO): Promise<DetalleRecepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/detalles/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateDetalleRecepcionDTO>): Promise<DetalleRecepcion> => {
    const response = await apiClient.patch(`${BASE_URL}/recepcion/detalles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recepcion/detalles/${id}/`);
  },
};

export const controlCalidadRecepcionApi = {
  getAll: async (params?: {
    recepcion?: number;
    cumple?: boolean;
  }): Promise<ControlCalidadRecepcion[]> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/controles-calidad/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ControlCalidadRecepcion> => {
    const response = await apiClient.get(`${BASE_URL}/recepcion/controles-calidad/${id}/`);
    return response.data;
  },

  create: async (data: CreateControlCalidadRecepcionDTO): Promise<ControlCalidadRecepcion> => {
    const response = await apiClient.post(`${BASE_URL}/recepcion/controles-calidad/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateControlCalidadRecepcionDTO>): Promise<ControlCalidadRecepcion> => {
    const response = await apiClient.patch(`${BASE_URL}/recepcion/controles-calidad/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recepcion/controles-calidad/${id}/`);
  },
};

// ==================== PROCESAMIENTO - CATÁLOGOS ====================

export const tipoProcesoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoProceso>> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/tipos-proceso/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoProceso> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/tipos-proceso/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<TipoProceso[]> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/tipos-proceso/activos/`);
    return response.data;
  },
};

export const estadoProcesoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    activo?: boolean;
  }): Promise<PaginatedResponse<EstadoProceso>> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/estados-proceso/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EstadoProceso> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/estados-proceso/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<EstadoProceso[]> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/estados-proceso/activos/`);
    return response.data;
  },
};

export const lineaProduccionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    empresa_id?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<LineaProduccion>> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/lineas-produccion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<LineaProduccion> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/lineas-produccion/${id}/`);
    return response.data;
  },

  create: async (data: Partial<LineaProduccion>): Promise<LineaProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/lineas-produccion/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<LineaProduccion>): Promise<LineaProduccion> => {
    const response = await apiClient.patch(`${BASE_URL}/procesamiento/lineas-produccion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procesamiento/lineas-produccion/${id}/`);
  },
};

// ==================== PROCESAMIENTO - PRINCIPALES ====================

export const ordenProduccionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_proceso?: number;
    linea_produccion?: number;
    estado?: number;
    prioridad?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<OrdenProduccionList>> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/ordenes-produccion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<OrdenProduccion> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/ordenes-produccion/${id}/`);
    return response.data;
  },

  create: async (data: CreateOrdenProduccionDTO): Promise<OrdenProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/ordenes-produccion/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateOrdenProduccionDTO): Promise<OrdenProduccion> => {
    const response = await apiClient.patch(`${BASE_URL}/procesamiento/ordenes-produccion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procesamiento/ordenes-produccion/${id}/`);
  },

  iniciar: async (id: number, data?: IniciarOrdenProduccionDTO): Promise<OrdenProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/ordenes-produccion/${id}/iniciar/`, data);
    return response.data;
  },

  finalizar: async (id: number, data?: FinalizarOrdenProduccionDTO): Promise<OrdenProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/ordenes-produccion/${id}/finalizar/`, data);
    return response.data;
  },
};

export const loteProduccionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    orden_produccion?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<PaginatedResponse<LoteProduccionList>> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/lotes/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<LoteProduccion> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/lotes/${id}/`);
    return response.data;
  },

  create: async (data: CreateLoteProduccionDTO): Promise<LoteProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/lotes/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateLoteProduccionDTO>): Promise<LoteProduccion> => {
    const response = await apiClient.patch(`${BASE_URL}/procesamiento/lotes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procesamiento/lotes/${id}/`);
  },
};

export const consumoMateriaPrimaApi = {
  getAll: async (params?: {
    lote_produccion?: number;
    tipo_materia_prima?: number;
  }): Promise<ConsumoMateriaPrima[]> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/consumos/`, { params });
    return response.data;
  },

  create: async (data: CreateConsumoMateriaPrimaDTO): Promise<ConsumoMateriaPrima> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/consumos/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procesamiento/consumos/${id}/`);
  },
};

export const controlCalidadProcesoApi = {
  getAll: async (params?: {
    lote_produccion?: number;
    cumple?: boolean;
  }): Promise<ControlCalidadProceso[]> => {
    const response = await apiClient.get(`${BASE_URL}/procesamiento/controles-calidad/`, { params });
    return response.data;
  },

  create: async (data: CreateControlCalidadProcesoDTO): Promise<ControlCalidadProceso> => {
    const response = await apiClient.post(`${BASE_URL}/procesamiento/controles-calidad/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procesamiento/controles-calidad/${id}/`);
  },
};

// ==================== MANTENIMIENTO - CATÁLOGOS ====================

export const tipoActivoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoActivo>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-activo/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoActivo> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-activo/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<TipoActivo[]> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-activo/activos/`);
    return response.data;
  },
};

export const tipoMantenimientoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    es_preventivo?: boolean;
    es_correctivo?: boolean;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoMantenimiento>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-mantenimiento/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoMantenimiento> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-mantenimiento/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<TipoMantenimiento[]> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/tipos-mantenimiento/activos/`);
    return response.data;
  },
};

// ==================== MANTENIMIENTO - PRINCIPALES ====================

export const activoProduccionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_activo?: number;
    estado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ActivoProduccionList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/activos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ActivoProduccion> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/activos/${id}/`);
    return response.data;
  },

  create: async (data: CreateActivoProduccionDTO): Promise<ActivoProduccion> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/activos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateActivoProduccionDTO): Promise<ActivoProduccion> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/activos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/activos/${id}/`);
  },
};

export const equipoMedicionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<EquipoMedicionList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/equipos-medicion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EquipoMedicion> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/equipos-medicion/${id}/`);
    return response.data;
  },

  create: async (data: CreateEquipoMedicionDTO): Promise<EquipoMedicion> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/equipos-medicion/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateEquipoMedicionDTO>): Promise<EquipoMedicion> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/equipos-medicion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/equipos-medicion/${id}/`);
  },
};

export const planMantenimientoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: number;
    tipo_mantenimiento?: number;
    activo_plan?: boolean;
    empresa_id?: number;
  }): Promise<PaginatedResponse<PlanMantenimientoList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/planes/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PlanMantenimiento> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/planes/${id}/`);
    return response.data;
  },

  create: async (data: CreatePlanMantenimientoDTO): Promise<PlanMantenimiento> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/planes/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreatePlanMantenimientoDTO>): Promise<PlanMantenimiento> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/planes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/planes/${id}/`);
  },
};

export const ordenTrabajoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: number;
    tipo_mantenimiento?: number;
    estado?: string;
    prioridad?: number;
    empresa_id?: number;
  }): Promise<PaginatedResponse<OrdenTrabajoList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/ordenes-trabajo/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<OrdenTrabajo> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/ordenes-trabajo/${id}/`);
    return response.data;
  },

  create: async (data: CreateOrdenTrabajoDTO): Promise<OrdenTrabajo> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/ordenes-trabajo/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateOrdenTrabajoDTO): Promise<OrdenTrabajo> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/ordenes-trabajo/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/ordenes-trabajo/${id}/`);
  },

  iniciar: async (id: number, data?: IniciarOrdenTrabajoDTO): Promise<OrdenTrabajo> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/ordenes-trabajo/${id}/iniciar/`, data);
    return response.data;
  },

  completar: async (id: number, data: CompletarOrdenTrabajoDTO): Promise<OrdenTrabajo> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/ordenes-trabajo/${id}/completar/`, data);
    return response.data;
  },
};

export const calibracionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    equipo?: number;
    resultado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<CalibracionList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/calibraciones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Calibracion> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/calibraciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateCalibracionDTO): Promise<Calibracion> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/calibraciones/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateCalibracionDTO>): Promise<Calibracion> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/calibraciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/calibraciones/${id}/`);
  },
};

export const paradaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: number;
    tipo?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ParadaList>> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/paradas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Parada> => {
    const response = await apiClient.get(`${BASE_URL}/mantenimiento/paradas/${id}/`);
    return response.data;
  },

  create: async (data: CreateParadaDTO): Promise<Parada> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/paradas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateParadaDTO): Promise<Parada> => {
    const response = await apiClient.patch(`${BASE_URL}/mantenimiento/paradas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mantenimiento/paradas/${id}/`);
  },

  cerrar: async (id: number, data?: CerrarParadaDTO): Promise<Parada> => {
    const response = await apiClient.post(`${BASE_URL}/mantenimiento/paradas/${id}/cerrar/`, data);
    return response.data;
  },
};

// ==================== PRODUCTO TERMINADO - CATÁLOGOS ====================

export const tipoProductoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    activo?: boolean;
  }): Promise<PaginatedResponse<TipoProducto>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/tipos-producto/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoProducto> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/tipos-producto/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<TipoProducto[]> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/tipos-producto/activos/`);
    return response.data;
  },
};

export const estadoLoteApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    activo?: boolean;
  }): Promise<PaginatedResponse<EstadoLote>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/estados-lote/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EstadoLote> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/estados-lote/${id}/`);
    return response.data;
  },

  getActivos: async (): Promise<EstadoLote[]> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/estados-lote/activos/`);
    return response.data;
  },
};

// ==================== PRODUCTO TERMINADO - PRINCIPALES ====================

export const productoTerminadoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_producto?: number;
    empresa_id?: number;
  }): Promise<PaginatedResponse<ProductoTerminadoList>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/productos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ProductoTerminado> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/productos/${id}/`);
    return response.data;
  },

  create: async (data: CreateProductoTerminadoDTO): Promise<ProductoTerminado> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/productos/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateProductoTerminadoDTO>): Promise<ProductoTerminado> => {
    const response = await apiClient.patch(`${BASE_URL}/producto-terminado/productos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/producto-terminado/productos/${id}/`);
  },
};

export const stockProductoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    producto?: number;
    estado_lote?: number;
    empresa_id?: number;
  }): Promise<PaginatedResponse<StockProductoList>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/stocks/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<StockProducto> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/stocks/${id}/`);
    return response.data;
  },

  create: async (data: CreateStockProductoDTO): Promise<StockProducto> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/stocks/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateStockProductoDTO): Promise<StockProducto> => {
    const response = await apiClient.patch(`${BASE_URL}/producto-terminado/stocks/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/producto-terminado/stocks/${id}/`);
  },

  reservar: async (id: number, data: ReservarCantidadDTO): Promise<StockProducto> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/stocks/${id}/reservar/`, data);
    return response.data;
  },

  liberarReserva: async (id: number, data: LiberarReservaDTO): Promise<StockProducto> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/stocks/${id}/liberar_reserva/`, data);
    return response.data;
  },

  consumir: async (id: number, data: ConsumirCantidadDTO): Promise<StockProducto> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/stocks/${id}/consumir/`, data);
    return response.data;
  },
};

export const liberacionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    resultado?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<LiberacionList>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/liberaciones/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Liberacion> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/liberaciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateLiberacionDTO): Promise<Liberacion> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/liberaciones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateLiberacionDTO): Promise<Liberacion> => {
    const response = await apiClient.patch(`${BASE_URL}/producto-terminado/liberaciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/producto-terminado/liberaciones/${id}/`);
  },

  aprobar: async (id: number, data: AprobarLiberacionDTO): Promise<Liberacion> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/liberaciones/${id}/aprobar/`, data);
    return response.data;
  },

  rechazar: async (id: number, data: RechazarLiberacionDTO): Promise<Liberacion> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/liberaciones/${id}/rechazar/`, data);
    return response.data;
  },

  aprobarConObservaciones: async (id: number, data: AprobarLiberacionDTO): Promise<Liberacion> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/liberaciones/${id}/aprobar_con_observaciones/`, data);
    return response.data;
  },
};

export const certificadoCalidadApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    cliente_nombre?: string;
    empresa_id?: number;
  }): Promise<PaginatedResponse<CertificadoCalidadList>> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/certificados/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CertificadoCalidad> => {
    const response = await apiClient.get(`${BASE_URL}/producto-terminado/certificados/${id}/`);
    return response.data;
  },

  create: async (data: CreateCertificadoCalidadDTO): Promise<CertificadoCalidad> => {
    const response = await apiClient.post(`${BASE_URL}/producto-terminado/certificados/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/producto-terminado/certificados/${id}/`);
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  // Recepción
  tipoRecepcion: tipoRecepcionApi,
  estadoRecepcion: estadoRecepcionApi,
  puntoRecepcion: puntoRecepcionApi,
  recepcion: recepcionApi,
  detalleRecepcion: detalleRecepcionApi,
  controlCalidadRecepcion: controlCalidadRecepcionApi,

  // Procesamiento
  tipoProceso: tipoProcesoApi,
  estadoProceso: estadoProcesoApi,
  lineaProduccion: lineaProduccionApi,
  ordenProduccion: ordenProduccionApi,
  loteProduccion: loteProduccionApi,
  consumoMateriaPrima: consumoMateriaPrimaApi,
  controlCalidadProceso: controlCalidadProcesoApi,

  // Mantenimiento
  tipoActivo: tipoActivoApi,
  tipoMantenimiento: tipoMantenimientoApi,
  activoProduccion: activoProduccionApi,
  equipoMedicion: equipoMedicionApi,
  planMantenimiento: planMantenimientoApi,
  ordenTrabajo: ordenTrabajoApi,
  calibracion: calibracionApi,
  parada: paradaApi,

  // Producto Terminado
  tipoProducto: tipoProductoApi,
  estadoLote: estadoLoteApi,
  productoTerminado: productoTerminadoApi,
  stockProducto: stockProductoApi,
  liberacion: liberacionApi,
  certificadoCalidad: certificadoCalidadApi,
};
