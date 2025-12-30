/**
 * API Clients para Accounting
 */
import { apiClient } from '@/lib/api-client';
import type {
  PlanCuentas,
  CuentaContable,
  TipoDocumentoContable,
  Tercero,
  CentroCostoContable,
  ConfiguracionModulo,
  ComprobanteContable,
  DetalleComprobante,
  AsientoPlantilla,
  InformeContable,
  GeneracionInforme,
  ParametrosIntegracion,
  LogIntegracion,
  ColaContabilizacion,
} from '../types';

const API_BASE = '/api/accounting';

// ==================== CONFIG CONTABLE API ====================

export const planesCuentasApi = {
  getAll: () => apiClient.get<PlanCuentas[]>(`${API_BASE}/config/planes/`),
  getById: (id: number) => apiClient.get<PlanCuentas>(`${API_BASE}/config/planes/${id}/`),
  create: (data: Partial<PlanCuentas>) => apiClient.post<PlanCuentas>(`${API_BASE}/config/planes/`, data),
  update: (id: number, data: Partial<PlanCuentas>) => apiClient.patch<PlanCuentas>(`${API_BASE}/config/planes/${id}/`, data),
};

export const cuentasContablesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<CuentaContable[]>(`${API_BASE}/config/cuentas/`, { params }),
  getById: (id: number) => apiClient.get<CuentaContable>(`${API_BASE}/config/cuentas/${id}/`),
  create: (data: Partial<CuentaContable>) => apiClient.post<CuentaContable>(`${API_BASE}/config/cuentas/`, data),
  update: (id: number, data: Partial<CuentaContable>) => apiClient.patch<CuentaContable>(`${API_BASE}/config/cuentas/${id}/`, data),
  getArbol: (planId: number) => apiClient.get(`${API_BASE}/config/cuentas/arbol/?plan=${planId}`),
  getSaldo: (id: number) => apiClient.get(`${API_BASE}/config/cuentas/${id}/saldos/`),
};

export const tiposDocumentoApi = {
  getAll: () => apiClient.get<TipoDocumentoContable[]>(`${API_BASE}/config/tipos-documento/`),
  getById: (id: number) => apiClient.get<TipoDocumentoContable>(`${API_BASE}/config/tipos-documento/${id}/`),
  create: (data: Partial<TipoDocumentoContable>) => apiClient.post<TipoDocumentoContable>(`${API_BASE}/config/tipos-documento/`, data),
  update: (id: number, data: Partial<TipoDocumentoContable>) => apiClient.patch<TipoDocumentoContable>(`${API_BASE}/config/tipos-documento/${id}/`, data),
};

export const tercerosApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<Tercero[]>(`${API_BASE}/config/terceros/`, { params }),
  getById: (id: number) => apiClient.get<Tercero>(`${API_BASE}/config/terceros/${id}/`),
  create: (data: Partial<Tercero>) => apiClient.post<Tercero>(`${API_BASE}/config/terceros/`, data),
  update: (id: number, data: Partial<Tercero>) => apiClient.patch<Tercero>(`${API_BASE}/config/terceros/${id}/`, data),
};

export const centrosCostoApi = {
  getAll: () => apiClient.get<CentroCostoContable[]>(`${API_BASE}/config/centros-costo/`),
  getById: (id: number) => apiClient.get<CentroCostoContable>(`${API_BASE}/config/centros-costo/${id}/`),
  create: (data: Partial<CentroCostoContable>) => apiClient.post<CentroCostoContable>(`${API_BASE}/config/centros-costo/`, data),
};

export const configuracionApi = {
  get: () => apiClient.get<ConfiguracionModulo>(`${API_BASE}/config/configuracion/`),
  update: (data: Partial<ConfiguracionModulo>) => apiClient.patch<ConfiguracionModulo>(`${API_BASE}/config/configuracion/`, data),
  cerrarPeriodo: () => apiClient.post(`${API_BASE}/config/configuracion/cerrar_periodo/`),
  abrirPeriodo: () => apiClient.post(`${API_BASE}/config/configuracion/abrir_periodo/`),
};

// ==================== MOVIMIENTOS API ====================

export const comprobantesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ComprobanteContable[]>(`${API_BASE}/movimientos/comprobantes/`, { params }),
  getById: (id: number) => apiClient.get<ComprobanteContable>(`${API_BASE}/movimientos/comprobantes/${id}/`),
  create: (data: Partial<ComprobanteContable>) => apiClient.post<ComprobanteContable>(`${API_BASE}/movimientos/comprobantes/`, data),
  update: (id: number, data: Partial<ComprobanteContable>) => apiClient.patch<ComprobanteContable>(`${API_BASE}/movimientos/comprobantes/${id}/`, data),
  contabilizar: (id: number) => apiClient.post(`${API_BASE}/movimientos/comprobantes/${id}/contabilizar/`),
  anular: (id: number) => apiClient.post(`${API_BASE}/movimientos/comprobantes/${id}/anular/`),
};

export const detallesComprobanteApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<DetalleComprobante[]>(`${API_BASE}/movimientos/detalles/`, { params }),
  create: (data: Partial<DetalleComprobante>) => apiClient.post<DetalleComprobante>(`${API_BASE}/movimientos/detalles/`, data),
  update: (id: number, data: Partial<DetalleComprobante>) => apiClient.patch<DetalleComprobante>(`${API_BASE}/movimientos/detalles/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${API_BASE}/movimientos/detalles/${id}/`),
};

export const plantillasApi = {
  getAll: () => apiClient.get<AsientoPlantilla[]>(`${API_BASE}/movimientos/plantillas/`),
  getById: (id: number) => apiClient.get<AsientoPlantilla>(`${API_BASE}/movimientos/plantillas/${id}/`),
  create: (data: Partial<AsientoPlantilla>) => apiClient.post<AsientoPlantilla>(`${API_BASE}/movimientos/plantillas/`, data),
  generarComprobante: (id: number, data: Record<string, unknown>) => apiClient.post(`${API_BASE}/movimientos/plantillas/${id}/generar_comprobante/`, data),
};

// ==================== INFORMES API ====================

export const informesApi = {
  getAll: () => apiClient.get<InformeContable[]>(`${API_BASE}/informes/informes/`),
  getById: (id: number) => apiClient.get<InformeContable>(`${API_BASE}/informes/informes/${id}/`),
  create: (data: Partial<InformeContable>) => apiClient.post<InformeContable>(`${API_BASE}/informes/informes/`, data),
  update: (id: number, data: Partial<InformeContable>) => apiClient.patch<InformeContable>(`${API_BASE}/informes/informes/${id}/`, data),
  duplicar: (id: number, data: { codigo: string; nombre: string }) => apiClient.post(`${API_BASE}/informes/informes/${id}/duplicar/`, data),
};

export const generacionesApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<GeneracionInforme[]>(`${API_BASE}/informes/generaciones/`, { params }),
  getById: (id: number) => apiClient.get<GeneracionInforme>(`${API_BASE}/informes/generaciones/${id}/`),
  create: (data: Partial<GeneracionInforme>) => apiClient.post<GeneracionInforme>(`${API_BASE}/informes/generaciones/`, data),
  regenerar: (id: number) => apiClient.post(`${API_BASE}/informes/generaciones/${id}/regenerar/`),
};

// ==================== INTEGRACIÓN API ====================

export const parametrosIntegracionApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ParametrosIntegracion[]>(`${API_BASE}/integracion/parametros/`, { params }),
  getById: (id: number) => apiClient.get<ParametrosIntegracion>(`${API_BASE}/integracion/parametros/${id}/`),
  create: (data: Partial<ParametrosIntegracion>) => apiClient.post<ParametrosIntegracion>(`${API_BASE}/integracion/parametros/`, data),
  update: (id: number, data: Partial<ParametrosIntegracion>) => apiClient.patch<ParametrosIntegracion>(`${API_BASE}/integracion/parametros/${id}/`, data),
  porModulo: (modulo: string) => apiClient.get<ParametrosIntegracion[]>(`${API_BASE}/integracion/parametros/por_modulo/?modulo=${modulo}`),
};

export const logsIntegracionApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<LogIntegracion[]>(`${API_BASE}/integracion/logs/`, { params }),
  getById: (id: number) => apiClient.get<LogIntegracion>(`${API_BASE}/integracion/logs/${id}/`),
  erroresRecientes: (limit?: number) => apiClient.get<LogIntegracion[]>(`${API_BASE}/integracion/logs/errores_recientes/?limit=${limit || 20}`),
};

export const colaContabilizacionApi = {
  getAll: (params?: Record<string, unknown>) => apiClient.get<ColaContabilizacion[]>(`${API_BASE}/integracion/cola/`, { params }),
  reintentar: (id: number) => apiClient.post(`${API_BASE}/integracion/cola/${id}/reintentar/`),
  cancelar: (id: number) => apiClient.post(`${API_BASE}/integracion/cola/${id}/cancelar/`),
  pendientes: () => apiClient.get<ColaContabilizacion[]>(`${API_BASE}/integracion/cola/pendientes/`),
};
