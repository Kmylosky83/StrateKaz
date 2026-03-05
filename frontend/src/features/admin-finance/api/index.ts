/**
 * API Clients para Admin Finance - Alineados con backend real
 * Endpoints: /api/admin-finance/{app}/{resource}/
 */
import { apiClient } from '@/lib/api-client';
import type {
  Banco,
  BancoList,
  BancoSaldos,
  CuentaPorPagar,
  CuentaPorPagarList,
  CuentaPorPagarEstadisticas,
  CuentaPorCobrar,
  CuentaPorCobrarList,
  CuentaPorCobrarEstadisticas,
  FlujoCaja,
  FlujoCajaList,
  FlujoCajaResumen,
  Pago,
  PagoList,
  Recaudo,
  RecaudoList,
  CentroCosto,
  CentroCostoList,
  Rubro,
  RubroList,
  PresupuestoPorArea,
  PresupuestoPorAreaList,
  Aprobacion,
  AprobacionList,
  Ejecucion,
  EjecucionList,
  ResumenEjecucion,
  CategoriaActivo,
  CategoriaActivoList,
  ActivoFijo,
  ActivoFijoList,
  ActivosFijosEstadisticas,
  HojaVidaActivo,
  HojaVidaActivoList,
  ProgramaMantenimiento,
  ProgramaMantenimientoList,
  Depreciacion,
  DepreciacionList,
  BajaActivo,
  BajaActivoList,
  MantenimientoLocativo,
  MantenimientoLocativoList,
  ServicioPublico,
  ServicioPublicoList,
  ContratoServicio,
  ContratoServicioList,
  PaginatedResponse,
} from '../types';

const API_BASE = '/admin-finance';

// ==================== TESORERIA API ====================

export const bancosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<BancoList>>(`${API_BASE}/tesoreria/bancos/`, { params }),
  getById: (id: number) => apiClient.get<Banco>(`${API_BASE}/tesoreria/bancos/${id}/`),
  create: (data: Partial<Banco>) => apiClient.post<Banco>(`${API_BASE}/tesoreria/bancos/`, data),
  update: (id: number, data: Partial<Banco>) =>
    apiClient.patch<Banco>(`${API_BASE}/tesoreria/bancos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/bancos/${id}/`),
  getSaldos: () => apiClient.get<BancoSaldos>(`${API_BASE}/tesoreria/bancos/saldos/`),
};

export const cuentasPorPagarApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(
      `${API_BASE}/tesoreria/cuentas-por-pagar/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<CuentaPorPagar>(`${API_BASE}/tesoreria/cuentas-por-pagar/${id}/`),
  create: (data: Partial<CuentaPorPagar>) =>
    apiClient.post<CuentaPorPagar>(`${API_BASE}/tesoreria/cuentas-por-pagar/`, data),
  update: (id: number, data: Partial<CuentaPorPagar>) =>
    apiClient.patch<CuentaPorPagar>(`${API_BASE}/tesoreria/cuentas-por-pagar/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/cuentas-por-pagar/${id}/`),
  getVencidas: () =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(
      `${API_BASE}/tesoreria/cuentas-por-pagar/vencidas/`
    ),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<CuentaPorPagarList>>(
      `${API_BASE}/tesoreria/cuentas-por-pagar/por-vencer/`
    ),
  getEstadisticas: () =>
    apiClient.get<CuentaPorPagarEstadisticas>(
      `${API_BASE}/tesoreria/cuentas-por-pagar/estadisticas/`
    ),
};

export const cuentasPorCobrarApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(
      `${API_BASE}/tesoreria/cuentas-por-cobrar/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<CuentaPorCobrar>(`${API_BASE}/tesoreria/cuentas-por-cobrar/${id}/`),
  create: (data: Partial<CuentaPorCobrar>) =>
    apiClient.post<CuentaPorCobrar>(`${API_BASE}/tesoreria/cuentas-por-cobrar/`, data),
  update: (id: number, data: Partial<CuentaPorCobrar>) =>
    apiClient.patch<CuentaPorCobrar>(`${API_BASE}/tesoreria/cuentas-por-cobrar/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/cuentas-por-cobrar/${id}/`),
  getVencidas: () =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(
      `${API_BASE}/tesoreria/cuentas-por-cobrar/vencidas/`
    ),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<CuentaPorCobrarList>>(
      `${API_BASE}/tesoreria/cuentas-por-cobrar/por-vencer/`
    ),
  getEstadisticas: () =>
    apiClient.get<CuentaPorCobrarEstadisticas>(
      `${API_BASE}/tesoreria/cuentas-por-cobrar/estadisticas/`
    ),
};

export const flujoCajaApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<FlujoCajaList>>(`${API_BASE}/tesoreria/flujo-caja/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<FlujoCaja>(`${API_BASE}/tesoreria/flujo-caja/${id}/`),
  create: (data: Partial<FlujoCaja>) =>
    apiClient.post<FlujoCaja>(`${API_BASE}/tesoreria/flujo-caja/`, data),
  update: (id: number, data: Partial<FlujoCaja>) =>
    apiClient.patch<FlujoCaja>(`${API_BASE}/tesoreria/flujo-caja/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/flujo-caja/${id}/`),
  getResumenPeriodo: (params: { fecha_inicio: string; fecha_fin: string }) =>
    apiClient.get<FlujoCajaResumen>(`${API_BASE}/tesoreria/flujo-caja/resumen-periodo/`, {
      params,
    }),
};

export const pagosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<PagoList>>(`${API_BASE}/tesoreria/pagos/`, { params }),
  getById: (id: number) => apiClient.get<Pago>(`${API_BASE}/tesoreria/pagos/${id}/`),
  create: (data: Partial<Pago>) => apiClient.post<Pago>(`${API_BASE}/tesoreria/pagos/`, data),
  update: (id: number, data: Partial<Pago>) =>
    apiClient.patch<Pago>(`${API_BASE}/tesoreria/pagos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/pagos/${id}/`),
};

export const recaudosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<RecaudoList>>(`${API_BASE}/tesoreria/recaudos/`, { params }),
  getById: (id: number) => apiClient.get<Recaudo>(`${API_BASE}/tesoreria/recaudos/${id}/`),
  create: (data: Partial<Recaudo>) =>
    apiClient.post<Recaudo>(`${API_BASE}/tesoreria/recaudos/`, data),
  update: (id: number, data: Partial<Recaudo>) =>
    apiClient.patch<Recaudo>(`${API_BASE}/tesoreria/recaudos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/recaudos/${id}/`),
};

// ==================== PRESUPUESTO API ====================

export const centrosCostoApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CentroCostoList>>(`${API_BASE}/presupuesto/centros-costo/`, {
      params,
    }),
  getById: (id: number) =>
    apiClient.get<CentroCosto>(`${API_BASE}/presupuesto/centros-costo/${id}/`),
  create: (data: Partial<CentroCosto>) =>
    apiClient.post<CentroCosto>(`${API_BASE}/presupuesto/centros-costo/`, data),
  update: (id: number, data: Partial<CentroCosto>) =>
    apiClient.patch<CentroCosto>(`${API_BASE}/presupuesto/centros-costo/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/presupuesto/centros-costo/${id}/`),
};

export const rubrosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<RubroList>>(`${API_BASE}/presupuesto/rubros/`, { params }),
  getById: (id: number) => apiClient.get<Rubro>(`${API_BASE}/presupuesto/rubros/${id}/`),
  create: (data: Partial<Rubro>) => apiClient.post<Rubro>(`${API_BASE}/presupuesto/rubros/`, data),
  update: (id: number, data: Partial<Rubro>) =>
    apiClient.patch<Rubro>(`${API_BASE}/presupuesto/rubros/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/presupuesto/rubros/${id}/`),
};

export const presupuestosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<PresupuestoPorAreaList>>(
      `${API_BASE}/presupuesto/presupuestos/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<PresupuestoPorArea>(`${API_BASE}/presupuesto/presupuestos/${id}/`),
  create: (data: Partial<PresupuestoPorArea>) =>
    apiClient.post<PresupuestoPorArea>(`${API_BASE}/presupuesto/presupuestos/`, data),
  update: (id: number, data: Partial<PresupuestoPorArea>) =>
    apiClient.patch<PresupuestoPorArea>(`${API_BASE}/presupuesto/presupuestos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/presupuesto/presupuestos/${id}/`),
  getResumenEjecucion: (params?: { anio?: number }) =>
    apiClient.get<ResumenEjecucion>(`${API_BASE}/presupuesto/presupuestos/resumen-ejecucion/`, {
      params,
    }),
  getDisponible: (id: number) =>
    apiClient.get(`${API_BASE}/presupuesto/presupuestos/${id}/disponible/`),
  getPorTipo: (params?: Record<string, unknown>) =>
    apiClient.get(`${API_BASE}/presupuesto/presupuestos/por-tipo/`, { params }),
};

export const aprobacionesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<AprobacionList>>(`${API_BASE}/presupuesto/aprobaciones/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<Aprobacion>(`${API_BASE}/presupuesto/aprobaciones/${id}/`),
  create: (data: Partial<Aprobacion>) =>
    apiClient.post<Aprobacion>(`${API_BASE}/presupuesto/aprobaciones/`, data),
  aprobar: (id: number, data?: { observaciones?: string }) =>
    apiClient.post(`${API_BASE}/presupuesto/aprobaciones/${id}/aprobar/`, data),
  rechazar: (id: number, data?: { observaciones?: string }) =>
    apiClient.post(`${API_BASE}/presupuesto/aprobaciones/${id}/rechazar/`, data),
  getPendientes: () =>
    apiClient.get<PaginatedResponse<AprobacionList>>(
      `${API_BASE}/presupuesto/aprobaciones/pendientes/`
    ),
};

export const ejecucionesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<EjecucionList>>(`${API_BASE}/presupuesto/ejecuciones/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<Ejecucion>(`${API_BASE}/presupuesto/ejecuciones/${id}/`),
  create: (data: Partial<Ejecucion>) =>
    apiClient.post<Ejecucion>(`${API_BASE}/presupuesto/ejecuciones/`, data),
  update: (id: number, data: Partial<Ejecucion>) =>
    apiClient.patch<Ejecucion>(`${API_BASE}/presupuesto/ejecuciones/${id}/`, data),
  anular: (id: number) => apiClient.post(`${API_BASE}/presupuesto/ejecuciones/${id}/anular/`),
};

// ==================== ACTIVOS FIJOS API ====================

export const categoriasActivosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<CategoriaActivoList>>(`${API_BASE}/activos-fijos/categorias/`, {
      params,
    }),
  getById: (id: number) =>
    apiClient.get<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/${id}/`),
  create: (data: Partial<CategoriaActivo>) =>
    apiClient.post<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/`, data),
  update: (id: number, data: Partial<CategoriaActivo>) =>
    apiClient.patch<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/activos-fijos/categorias/${id}/`),
};

export const activosFijosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ActivoFijoList>>(`${API_BASE}/activos-fijos/activos/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<ActivoFijo>(`${API_BASE}/activos-fijos/activos/${id}/`),
  create: (data: Partial<ActivoFijo>) =>
    apiClient.post<ActivoFijo>(`${API_BASE}/activos-fijos/activos/`, data),
  update: (id: number, data: Partial<ActivoFijo>) =>
    apiClient.patch<ActivoFijo>(`${API_BASE}/activos-fijos/activos/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/activos-fijos/activos/${id}/`),
  enviarMantenimiento: (id: number) =>
    apiClient.post(`${API_BASE}/activos-fijos/activos/${id}/enviar-mantenimiento/`),
  activar: (id: number) => apiClient.post(`${API_BASE}/activos-fijos/activos/${id}/activar/`),
  getEstadisticas: () =>
    apiClient.get<ActivosFijosEstadisticas>(`${API_BASE}/activos-fijos/activos/estadisticas/`),
  getPorCategoria: () => apiClient.get(`${API_BASE}/activos-fijos/activos/activos-por-categoria/`),
};

export const hojasVidaApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<HojaVidaActivoList>>(`${API_BASE}/activos-fijos/hojas-vida/`, {
      params,
    }),
  getById: (id: number) =>
    apiClient.get<HojaVidaActivo>(`${API_BASE}/activos-fijos/hojas-vida/${id}/`),
  create: (data: Partial<HojaVidaActivo>) =>
    apiClient.post<HojaVidaActivo>(`${API_BASE}/activos-fijos/hojas-vida/`, data),
  update: (id: number, data: Partial<HojaVidaActivo>) =>
    apiClient.patch<HojaVidaActivo>(`${API_BASE}/activos-fijos/hojas-vida/${id}/`, data),
  getResumenCostos: (params?: Record<string, unknown>) =>
    apiClient.get(`${API_BASE}/activos-fijos/hojas-vida/resumen-costos/`, { params }),
  getPorActivo: (activoId: number) =>
    apiClient.get<PaginatedResponse<HojaVidaActivoList>>(
      `${API_BASE}/activos-fijos/hojas-vida/por-activo/`,
      { params: { activo: activoId } }
    ),
};

export const programasMantenimientoApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ProgramaMantenimientoList>>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<ProgramaMantenimiento>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/${id}/`
    ),
  create: (data: Partial<ProgramaMantenimiento>) =>
    apiClient.post<ProgramaMantenimiento>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/`,
      data
    ),
  update: (id: number, data: Partial<ProgramaMantenimiento>) =>
    apiClient.patch<ProgramaMantenimiento>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/${id}/`,
      data
    ),
  getProximos: () =>
    apiClient.get<PaginatedResponse<ProgramaMantenimientoList>>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/proximos/`
    ),
  getVencidos: () =>
    apiClient.get<PaginatedResponse<ProgramaMantenimientoList>>(
      `${API_BASE}/activos-fijos/programas-mantenimiento/vencidos/`
    ),
  ejecutar: (id: number, data?: Record<string, unknown>) =>
    apiClient.post(`${API_BASE}/activos-fijos/programas-mantenimiento/${id}/ejecutar/`, data),
};

export const depreciacionesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<DepreciacionList>>(
      `${API_BASE}/activos-fijos/depreciaciones/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<Depreciacion>(`${API_BASE}/activos-fijos/depreciaciones/${id}/`),
  calcularPeriodo: (data: { periodo_mes: number; periodo_anio: number }) =>
    apiClient.post(`${API_BASE}/activos-fijos/depreciaciones/calcular-periodo/`, data),
  getReporteMensual: (params: { periodo_mes: number; periodo_anio: number }) =>
    apiClient.get(`${API_BASE}/activos-fijos/depreciaciones/reporte-mensual/`, { params }),
  getResumenDepreciacion: () =>
    apiClient.get(`${API_BASE}/activos-fijos/depreciaciones/resumen-depreciacion/`),
  getPorUbicacion: () => apiClient.get(`${API_BASE}/activos-fijos/depreciaciones/por-ubicacion/`),
};

export const bajasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<BajaActivoList>>(`${API_BASE}/activos-fijos/bajas/`, {
      params,
    }),
  getById: (id: number) => apiClient.get<BajaActivo>(`${API_BASE}/activos-fijos/bajas/${id}/`),
  create: (data: Partial<BajaActivo>) =>
    apiClient.post<BajaActivo>(`${API_BASE}/activos-fijos/bajas/`, data),
  aprobar: (id: number) => apiClient.post(`${API_BASE}/activos-fijos/bajas/${id}/aprobar/`),
};

// ==================== SERVICIOS GENERALES API ====================

export const mantenimientosLocativosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<MantenimientoLocativoList>>(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<MantenimientoLocativo>(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/${id}/`
    ),
  create: (data: Partial<MantenimientoLocativo>) =>
    apiClient.post<MantenimientoLocativo>(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/`,
      data
    ),
  update: (id: number, data: Partial<MantenimientoLocativo>) =>
    apiClient.patch<MantenimientoLocativo>(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/${id}/`,
      data
    ),
  programar: (id: number, data: { fecha_programada: string }) =>
    apiClient.post(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/${id}/programar/`,
      data
    ),
  completar: (id: number, data?: Record<string, unknown>) =>
    apiClient.post(
      `${API_BASE}/servicios-generales/mantenimientos-locativos/${id}/completar/`,
      data
    ),
  cancelar: (id: number) =>
    apiClient.post(`${API_BASE}/servicios-generales/mantenimientos-locativos/${id}/cancelar/`),
  getEstadisticas: () =>
    apiClient.get(`${API_BASE}/servicios-generales/mantenimientos-locativos/estadisticas/`),
};

export const serviciosPublicosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ServicioPublicoList>>(
      `${API_BASE}/servicios-generales/servicios-publicos/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<ServicioPublico>(`${API_BASE}/servicios-generales/servicios-publicos/${id}/`),
  create: (data: Partial<ServicioPublico>) =>
    apiClient.post<ServicioPublico>(`${API_BASE}/servicios-generales/servicios-publicos/`, data),
  update: (id: number, data: Partial<ServicioPublico>) =>
    apiClient.patch<ServicioPublico>(
      `${API_BASE}/servicios-generales/servicios-publicos/${id}/`,
      data
    ),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<ServicioPublicoList>>(
      `${API_BASE}/servicios-generales/servicios-publicos/servicios-por-vencer/`
    ),
  getResumenConsumos: (params?: Record<string, unknown>) =>
    apiClient.get(`${API_BASE}/servicios-generales/servicios-publicos/resumen-consumos/`, {
      params,
    }),
  marcarPagado: (id: number) =>
    apiClient.post(`${API_BASE}/servicios-generales/servicios-publicos/${id}/marcar-pagado/`),
};

export const contratosServiciosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ContratoServicioList>>(
      `${API_BASE}/servicios-generales/contratos/`,
      { params }
    ),
  getById: (id: number) =>
    apiClient.get<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/${id}/`),
  create: (data: Partial<ContratoServicio>) =>
    apiClient.post<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/`, data),
  update: (id: number, data: Partial<ContratoServicio>) =>
    apiClient.patch<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/${id}/`, data),
  terminar: (id: number) =>
    apiClient.post(`${API_BASE}/servicios-generales/contratos/${id}/terminar/`),
  getVigentes: () =>
    apiClient.get<PaginatedResponse<ContratoServicioList>>(
      `${API_BASE}/servicios-generales/contratos/contratos-vigentes/`
    ),
  getPorVencer: () =>
    apiClient.get<PaginatedResponse<ContratoServicioList>>(
      `${API_BASE}/servicios-generales/contratos/contratos-por-vencer/`
    ),
  getResumenPorProveedor: () =>
    apiClient.get(`${API_BASE}/servicios-generales/contratos/resumen-por-proveedor/`),
};
