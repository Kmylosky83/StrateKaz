/**
 * API Clients para Admin Finance
 */
import { apiClient } from '@/lib/api-client';
import type {
  CuentaBancaria,
  MovimientoBancario,
  FlujoCaja,
  ConciliacionBancaria,
  ProgramacionPago,
  CajaChica,
  PresupuestoAnual,
  RubroPresupuestal,
  EjecucionPresupuestal,
  CdpCrp,
  TrasladorPresupuestal,
  ActivoFijo,
  CategoriaActivo,
  UbicacionActivo,
  DepreciacionMensual,
  MovimientoActivo,
  MantenimientoActivo,
  ContratoServicio,
  GastoOperativo,
  ConsumoServicioPublico,
} from '../types';

const API_BASE = '/api/admin-finance';

// ==================== TESORERÍA API ====================

export const cuentasBancariasApi = {
  getAll: () => apiClient.get<CuentaBancaria[]>(`${API_BASE}/tesoreria/cuentas/`),
  getById: (id: number) => apiClient.get<CuentaBancaria>(`${API_BASE}/tesoreria/cuentas/${id}/`),
  create: (data: Partial<CuentaBancaria>) => apiClient.post<CuentaBancaria>(`${API_BASE}/tesoreria/cuentas/`, data),
  update: (id: number, data: Partial<CuentaBancaria>) => apiClient.patch<CuentaBancaria>(`${API_BASE}/tesoreria/cuentas/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/tesoreria/cuentas/${id}/`),
  getSaldo: (id: number) => apiClient.get<{ saldo: number }>(`${API_BASE}/tesoreria/cuentas/${id}/saldo/`),
};

export const movimientosBancariosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<MovimientoBancario[]>(`${API_BASE}/tesoreria/movimientos/`, { params }),
  getById: (id: number) => apiClient.get<MovimientoBancario>(`${API_BASE}/tesoreria/movimientos/${id}/`),
  create: (data: Partial<MovimientoBancario>) => apiClient.post<MovimientoBancario>(`${API_BASE}/tesoreria/movimientos/`, data),
  conciliar: (id: number) => apiClient.post(`${API_BASE}/tesoreria/movimientos/${id}/conciliar/`),
};

export const flujoCajaApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<FlujoCaja[]>(`${API_BASE}/tesoreria/flujo-caja/`, { params }),
  getById: (id: number) => apiClient.get<FlujoCaja>(`${API_BASE}/tesoreria/flujo-caja/${id}/`),
  generar: (data: { fecha_inicio: string; fecha_fin: string }) => apiClient.post<FlujoCaja>(`${API_BASE}/tesoreria/flujo-caja/generar/`, data),
};

export const conciliacionesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ConciliacionBancaria[]>(`${API_BASE}/tesoreria/conciliaciones/`, { params }),
  getById: (id: number) => apiClient.get<ConciliacionBancaria>(`${API_BASE}/tesoreria/conciliaciones/${id}/`),
  create: (data: Partial<ConciliacionBancaria>) => apiClient.post<ConciliacionBancaria>(`${API_BASE}/tesoreria/conciliaciones/`, data),
};

export const programacionPagosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ProgramacionPago[]>(`${API_BASE}/tesoreria/programacion-pagos/`, { params }),
  getById: (id: number) => apiClient.get<ProgramacionPago>(`${API_BASE}/tesoreria/programacion-pagos/${id}/`),
  create: (data: Partial<ProgramacionPago>) => apiClient.post<ProgramacionPago>(`${API_BASE}/tesoreria/programacion-pagos/`, data),
  update: (id: number, data: Partial<ProgramacionPago>) => apiClient.patch<ProgramacionPago>(`${API_BASE}/tesoreria/programacion-pagos/${id}/`, data),
  marcarPagado: (id: number) => apiClient.post(`${API_BASE}/tesoreria/programacion-pagos/${id}/pagar/`),
};

export const cajasChicasApi = {
  getAll: () => apiClient.get<CajaChica[]>(`${API_BASE}/tesoreria/cajas-chicas/`),
  getById: (id: number) => apiClient.get<CajaChica>(`${API_BASE}/tesoreria/cajas-chicas/${id}/`),
  create: (data: Partial<CajaChica>) => apiClient.post<CajaChica>(`${API_BASE}/tesoreria/cajas-chicas/`, data),
  reembolsar: (id: number) => apiClient.post(`${API_BASE}/tesoreria/cajas-chicas/${id}/reembolsar/`),
};

// ==================== PRESUPUESTO API ====================

export const presupuestosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<PresupuestoAnual[]>(`${API_BASE}/presupuesto/presupuestos/`, { params }),
  getById: (id: number) => apiClient.get<PresupuestoAnual>(`${API_BASE}/presupuesto/presupuestos/${id}/`),
  create: (data: Partial<PresupuestoAnual>) => apiClient.post<PresupuestoAnual>(`${API_BASE}/presupuesto/presupuestos/`, data),
  update: (id: number, data: Partial<PresupuestoAnual>) => apiClient.patch<PresupuestoAnual>(`${API_BASE}/presupuesto/presupuestos/${id}/`, data),
  aprobar: (id: number) => apiClient.post(`${API_BASE}/presupuesto/presupuestos/${id}/aprobar/`),
  cerrar: (id: number) => apiClient.post(`${API_BASE}/presupuesto/presupuestos/${id}/cerrar/`),
};

export const rubrosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<RubroPresupuestal[]>(`${API_BASE}/presupuesto/rubros/`, { params }),
  getById: (id: number) => apiClient.get<RubroPresupuestal>(`${API_BASE}/presupuesto/rubros/${id}/`),
  create: (data: Partial<RubroPresupuestal>) => apiClient.post<RubroPresupuestal>(`${API_BASE}/presupuesto/rubros/`, data),
  update: (id: number, data: Partial<RubroPresupuestal>) => apiClient.patch<RubroPresupuestal>(`${API_BASE}/presupuesto/rubros/${id}/`, data),
};

export const ejecucionesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<EjecucionPresupuestal[]>(`${API_BASE}/presupuesto/ejecuciones/`, { params }),
  getById: (id: number) => apiClient.get<EjecucionPresupuestal>(`${API_BASE}/presupuesto/ejecuciones/${id}/`),
  create: (data: Partial<EjecucionPresupuestal>) => apiClient.post<EjecucionPresupuestal>(`${API_BASE}/presupuesto/ejecuciones/`, data),
};

export const cdpCrpApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<CdpCrp[]>(`${API_BASE}/presupuesto/cdp-crp/`, { params }),
  getById: (id: number) => apiClient.get<CdpCrp>(`${API_BASE}/presupuesto/cdp-crp/${id}/`),
  create: (data: Partial<CdpCrp>) => apiClient.post<CdpCrp>(`${API_BASE}/presupuesto/cdp-crp/`, data),
  anular: (id: number) => apiClient.post(`${API_BASE}/presupuesto/cdp-crp/${id}/anular/`),
};

export const trasladosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<TrasladorPresupuestal[]>(`${API_BASE}/presupuesto/traslados/`, { params }),
  getById: (id: number) => apiClient.get<TrasladorPresupuestal>(`${API_BASE}/presupuesto/traslados/${id}/`),
  create: (data: Partial<TrasladorPresupuestal>) => apiClient.post<TrasladorPresupuestal>(`${API_BASE}/presupuesto/traslados/`, data),
  aprobar: (id: number) => apiClient.post(`${API_BASE}/presupuesto/traslados/${id}/aprobar/`),
  rechazar: (id: number) => apiClient.post(`${API_BASE}/presupuesto/traslados/${id}/rechazar/`),
};

// ==================== ACTIVOS FIJOS API ====================

export const activosFijosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ActivoFijo[]>(`${API_BASE}/activos-fijos/activos/`, { params }),
  getById: (id: number) => apiClient.get<ActivoFijo>(`${API_BASE}/activos-fijos/activos/${id}/`),
  create: (data: Partial<ActivoFijo>) => apiClient.post<ActivoFijo>(`${API_BASE}/activos-fijos/activos/`, data),
  update: (id: number, data: Partial<ActivoFijo>) => apiClient.patch<ActivoFijo>(`${API_BASE}/activos-fijos/activos/${id}/`, data),
  darDeBaja: (id: number, data: { motivo: string }) => apiClient.post(`${API_BASE}/activos-fijos/activos/${id}/dar-de-baja/`, data),
};

export const categoriasActivosApi = {
  getAll: () => apiClient.get<CategoriaActivo[]>(`${API_BASE}/activos-fijos/categorias/`),
  getById: (id: number) => apiClient.get<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/${id}/`),
  create: (data: Partial<CategoriaActivo>) => apiClient.post<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/`, data),
  update: (id: number, data: Partial<CategoriaActivo>) => apiClient.patch<CategoriaActivo>(`${API_BASE}/activos-fijos/categorias/${id}/`, data),
};

export const ubicacionesActivosApi = {
  getAll: () => apiClient.get<UbicacionActivo[]>(`${API_BASE}/activos-fijos/ubicaciones/`),
  getById: (id: number) => apiClient.get<UbicacionActivo>(`${API_BASE}/activos-fijos/ubicaciones/${id}/`),
  create: (data: Partial<UbicacionActivo>) => apiClient.post<UbicacionActivo>(`${API_BASE}/activos-fijos/ubicaciones/`, data),
  update: (id: number, data: Partial<UbicacionActivo>) => apiClient.patch<UbicacionActivo>(`${API_BASE}/activos-fijos/ubicaciones/${id}/`, data),
};

export const depreciacionesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<DepreciacionMensual[]>(`${API_BASE}/activos-fijos/depreciaciones/`, { params }),
  calcular: (data: { periodo: string }) => apiClient.post(`${API_BASE}/activos-fijos/depreciaciones/calcular/`, data),
};

export const movimientosActivosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<MovimientoActivo[]>(`${API_BASE}/activos-fijos/movimientos/`, { params }),
  create: (data: Partial<MovimientoActivo>) => apiClient.post<MovimientoActivo>(`${API_BASE}/activos-fijos/movimientos/`, data),
};

export const mantenimientosActivosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<MantenimientoActivo[]>(`${API_BASE}/activos-fijos/mantenimientos/`, { params }),
  getById: (id: number) => apiClient.get<MantenimientoActivo>(`${API_BASE}/activos-fijos/mantenimientos/${id}/`),
  create: (data: Partial<MantenimientoActivo>) => apiClient.post<MantenimientoActivo>(`${API_BASE}/activos-fijos/mantenimientos/`, data),
  update: (id: number, data: Partial<MantenimientoActivo>) => apiClient.patch<MantenimientoActivo>(`${API_BASE}/activos-fijos/mantenimientos/${id}/`, data),
  completar: (id: number) => apiClient.post(`${API_BASE}/activos-fijos/mantenimientos/${id}/completar/`),
};

// ==================== SERVICIOS GENERALES API ====================

export const contratosServiciosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ContratoServicio[]>(`${API_BASE}/servicios-generales/contratos/`, { params }),
  getById: (id: number) => apiClient.get<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/${id}/`),
  create: (data: Partial<ContratoServicio>) => apiClient.post<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/`, data),
  update: (id: number, data: Partial<ContratoServicio>) => apiClient.patch<ContratoServicio>(`${API_BASE}/servicios-generales/contratos/${id}/`, data),
  renovar: (id: number) => apiClient.post(`${API_BASE}/servicios-generales/contratos/${id}/renovar/`),
};

export const gastosOperativosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<GastoOperativo[]>(`${API_BASE}/servicios-generales/gastos/`, { params }),
  getById: (id: number) => apiClient.get<GastoOperativo>(`${API_BASE}/servicios-generales/gastos/${id}/`),
  create: (data: Partial<GastoOperativo>) => apiClient.post<GastoOperativo>(`${API_BASE}/servicios-generales/gastos/`, data),
  update: (id: number, data: Partial<GastoOperativo>) => apiClient.patch<GastoOperativo>(`${API_BASE}/servicios-generales/gastos/${id}/`, data),
  aprobar: (id: number) => apiClient.post(`${API_BASE}/servicios-generales/gastos/${id}/aprobar/`),
};

export const consumosServiciosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ConsumoServicioPublico[]>(`${API_BASE}/servicios-generales/consumos/`, { params }),
  getById: (id: number) => apiClient.get<ConsumoServicioPublico>(`${API_BASE}/servicios-generales/consumos/${id}/`),
  create: (data: Partial<ConsumoServicioPublico>) => apiClient.post<ConsumoServicioPublico>(`${API_BASE}/servicios-generales/consumos/`, data),
  update: (id: number, data: Partial<ConsumoServicioPublico>) => apiClient.patch<ConsumoServicioPublico>(`${API_BASE}/servicios-generales/consumos/${id}/`, data),
};
