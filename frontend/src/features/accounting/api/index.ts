/**
 * API Clients para Accounting — alineados con backend URLs y ViewSets
 */
import { apiClient } from '@/lib/api-client';
import type {
  PlanCuentas,
  PlanCuentasList,
  CuentaContable,
  CuentaContableList,
  CuentaContableTree,
  TipoDocumentoContable,
  TipoDocumentoContableList,
  Tercero,
  TerceroList,
  CentroCostoContable,
  CentroCostoContableList,
  CentroCostoContableTree,
  ConfiguracionModulo,
  ComprobanteContable,
  ComprobanteContableList,
  ComprobanteContableCreate,
  DetalleComprobante,
  SecuenciaDocumento,
  AsientoPlantilla,
  AsientoPlantillaList,
  InformeContable,
  InformeContableList,
  LineaInforme,
  GeneracionInforme,
  GeneracionInformeList,
  ParametrosIntegracion,
  ParametrosIntegracionList,
  LogIntegracion,
  LogIntegracionList,
  ColaContabilizacion,
  ColaContabilizacionList,
  PaginatedResponse,
} from '../types';

const BASE = '/accounting';

// ==================== CONFIG CONTABLE ====================

export const planesCuentasApi = {
  getAll: () =>
    apiClient.get<PaginatedResponse<PlanCuentasList>>(`${BASE}/config/planes/`).then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<PlanCuentas>(`${BASE}/config/planes/${id}/`).then((r) => r.data),
  create: (data: Partial<PlanCuentas>) =>
    apiClient.post<PlanCuentas>(`${BASE}/config/planes/`, data).then((r) => r.data),
  update: (id: number, data: Partial<PlanCuentas>) =>
    apiClient.patch<PlanCuentas>(`${BASE}/config/planes/${id}/`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`${BASE}/config/planes/${id}/`).then((r) => r.data),
  activar: (id: number) =>
    apiClient.post(`${BASE}/config/planes/${id}/activar/`).then((r) => r.data),
  getCuentas: (id: number) =>
    apiClient.get<CuentaContableList[]>(`${BASE}/config/planes/${id}/cuentas/`).then((r) => r.data),
};

export const cuentasContablesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<CuentaContableList>>(`${BASE}/config/cuentas/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<CuentaContable>(`${BASE}/config/cuentas/${id}/`).then((r) => r.data),
  create: (data: Partial<CuentaContable>) =>
    apiClient.post<CuentaContable>(`${BASE}/config/cuentas/`, data).then((r) => r.data),
  update: (id: number, data: Partial<CuentaContable>) =>
    apiClient.patch<CuentaContable>(`${BASE}/config/cuentas/${id}/`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`${BASE}/config/cuentas/${id}/`).then((r) => r.data),
  getArbol: (params?: Record<string, unknown>) =>
    apiClient
      .get<CuentaContableTree[]>(`${BASE}/config/cuentas/arbol/`, { params })
      .then((r) => r.data),
  getMovimientos: (id: number, params?: Record<string, unknown>) =>
    apiClient.get(`${BASE}/config/cuentas/${id}/movimientos/`, { params }).then((r) => r.data),
  getSubcuentas: (id: number) =>
    apiClient
      .get<CuentaContableList[]>(`${BASE}/config/cuentas/${id}/subcuentas/`)
      .then((r) => r.data),
  getSaldos: (id: number) =>
    apiClient.get(`${BASE}/config/cuentas/${id}/saldos/`).then((r) => r.data),
};

export const tiposDocumentoApi = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<TipoDocumentoContableList>>(`${BASE}/config/tipos-documento/`)
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient
      .get<TipoDocumentoContable>(`${BASE}/config/tipos-documento/${id}/`)
      .then((r) => r.data),
  create: (data: Partial<TipoDocumentoContable>) =>
    apiClient
      .post<TipoDocumentoContable>(`${BASE}/config/tipos-documento/`, data)
      .then((r) => r.data),
  update: (id: number, data: Partial<TipoDocumentoContable>) =>
    apiClient
      .patch<TipoDocumentoContable>(`${BASE}/config/tipos-documento/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/config/tipos-documento/${id}/`).then((r) => r.data),
  reiniciarConsecutivo: (id: number) =>
    apiClient
      .post(`${BASE}/config/tipos-documento/${id}/reiniciar_consecutivo/`)
      .then((r) => r.data),
};

export const tercerosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<TerceroList>>(`${BASE}/config/terceros/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<Tercero>(`${BASE}/config/terceros/${id}/`).then((r) => r.data),
  create: (data: Partial<Tercero>) =>
    apiClient.post<Tercero>(`${BASE}/config/terceros/`, data).then((r) => r.data),
  update: (id: number, data: Partial<Tercero>) =>
    apiClient.patch<Tercero>(`${BASE}/config/terceros/${id}/`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`${BASE}/config/terceros/${id}/`).then((r) => r.data),
  porTipo: (tipo: string) =>
    apiClient
      .get<TerceroList[]>(`${BASE}/config/terceros/por_tipo/`, { params: { tipo } })
      .then((r) => r.data),
  buscar: (q: string) =>
    apiClient
      .get<TerceroList[]>(`${BASE}/config/terceros/buscar/`, { params: { q } })
      .then((r) => r.data),
};

export const centrosCostoApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<CentroCostoContableList>>(`${BASE}/config/centros-costo/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<CentroCostoContable>(`${BASE}/config/centros-costo/${id}/`).then((r) => r.data),
  create: (data: Partial<CentroCostoContable>) =>
    apiClient.post<CentroCostoContable>(`${BASE}/config/centros-costo/`, data).then((r) => r.data),
  update: (id: number, data: Partial<CentroCostoContable>) =>
    apiClient
      .patch<CentroCostoContable>(`${BASE}/config/centros-costo/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/config/centros-costo/${id}/`).then((r) => r.data),
  getArbol: () =>
    apiClient
      .get<CentroCostoContableTree[]>(`${BASE}/config/centros-costo/arbol/`)
      .then((r) => r.data),
  getSubcentros: (id: number) =>
    apiClient
      .get<CentroCostoContableList[]>(`${BASE}/config/centros-costo/${id}/subcentros/`)
      .then((r) => r.data),
};

export const configuracionApi = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<ConfiguracionModulo>>(`${BASE}/config/configuracion/`)
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<ConfiguracionModulo>(`${BASE}/config/configuracion/${id}/`).then((r) => r.data),
  update: (id: number, data: Partial<ConfiguracionModulo>) =>
    apiClient
      .patch<ConfiguracionModulo>(`${BASE}/config/configuracion/${id}/`, data)
      .then((r) => r.data),
  cerrarPeriodo: (id: number) =>
    apiClient.post(`${BASE}/config/configuracion/${id}/cerrar_periodo/`).then((r) => r.data),
  abrirPeriodo: (id: number) =>
    apiClient.post(`${BASE}/config/configuracion/${id}/abrir_periodo/`).then((r) => r.data),
  getEstado: () => apiClient.get(`${BASE}/config/configuracion/estado/`).then((r) => r.data),
};

// ==================== MOVIMIENTOS ====================

export const comprobantesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<
        PaginatedResponse<ComprobanteContableList>
      >(`${BASE}/movimientos/comprobantes/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient
      .get<ComprobanteContable>(`${BASE}/movimientos/comprobantes/${id}/`)
      .then((r) => r.data),
  create: (data: ComprobanteContableCreate) =>
    apiClient
      .post<ComprobanteContable>(`${BASE}/movimientos/comprobantes/`, data)
      .then((r) => r.data),
  update: (id: number, data: Partial<ComprobanteContable>) =>
    apiClient
      .patch<ComprobanteContable>(`${BASE}/movimientos/comprobantes/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/movimientos/comprobantes/${id}/`).then((r) => r.data),
  contabilizar: (id: number) =>
    apiClient.post(`${BASE}/movimientos/comprobantes/${id}/contabilizar/`).then((r) => r.data),
  anular: (id: number, data?: { motivo_anulacion: string }) =>
    apiClient.post(`${BASE}/movimientos/comprobantes/${id}/anular/`, data).then((r) => r.data),
  aprobar: (id: number) =>
    apiClient.post(`${BASE}/movimientos/comprobantes/${id}/aprobar/`).then((r) => r.data),
  recalcularTotales: (id: number) =>
    apiClient
      .post(`${BASE}/movimientos/comprobantes/${id}/recalcular_totales/`)
      .then((r) => r.data),
  porPeriodo: (periodo: number) =>
    apiClient
      .get<
        ComprobanteContableList[]
      >(`${BASE}/movimientos/comprobantes/por_periodo/`, { params: { periodo } })
      .then((r) => r.data),
};

export const detallesComprobanteApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<DetalleComprobante>>(`${BASE}/movimientos/detalles/`, { params })
      .then((r) => r.data),
  create: (data: Partial<DetalleComprobante>) =>
    apiClient.post<DetalleComprobante>(`${BASE}/movimientos/detalles/`, data).then((r) => r.data),
  update: (id: number, data: Partial<DetalleComprobante>) =>
    apiClient
      .patch<DetalleComprobante>(`${BASE}/movimientos/detalles/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/movimientos/detalles/${id}/`).then((r) => r.data),
};

export const secuenciasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<SecuenciaDocumento>>(`${BASE}/movimientos/secuencias/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<SecuenciaDocumento>(`${BASE}/movimientos/secuencias/${id}/`).then((r) => r.data),
  create: (data: Partial<SecuenciaDocumento>) =>
    apiClient.post<SecuenciaDocumento>(`${BASE}/movimientos/secuencias/`, data).then((r) => r.data),
  update: (id: number, data: Partial<SecuenciaDocumento>) =>
    apiClient
      .patch<SecuenciaDocumento>(`${BASE}/movimientos/secuencias/${id}/`, data)
      .then((r) => r.data),
};

export const plantillasApi = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<AsientoPlantillaList>>(`${BASE}/movimientos/plantillas/`)
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<AsientoPlantilla>(`${BASE}/movimientos/plantillas/${id}/`).then((r) => r.data),
  create: (data: Partial<AsientoPlantilla>) =>
    apiClient.post<AsientoPlantilla>(`${BASE}/movimientos/plantillas/`, data).then((r) => r.data),
  update: (id: number, data: Partial<AsientoPlantilla>) =>
    apiClient
      .patch<AsientoPlantilla>(`${BASE}/movimientos/plantillas/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/movimientos/plantillas/${id}/`).then((r) => r.data),
  generarComprobante: (id: number, data: Record<string, unknown>) =>
    apiClient
      .post(`${BASE}/movimientos/plantillas/${id}/generar_comprobante/`, data)
      .then((r) => r.data),
};

// ==================== INFORMES CONTABLES ====================

export const informesApi = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<InformeContableList>>(`${BASE}/informes/informes/`)
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<InformeContable>(`${BASE}/informes/informes/${id}/`).then((r) => r.data),
  create: (data: Partial<InformeContable>) =>
    apiClient.post<InformeContable>(`${BASE}/informes/informes/`, data).then((r) => r.data),
  update: (id: number, data: Partial<InformeContable>) =>
    apiClient.patch<InformeContable>(`${BASE}/informes/informes/${id}/`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`${BASE}/informes/informes/${id}/`).then((r) => r.data),
  getLineas: (id: number) =>
    apiClient.get<LineaInforme[]>(`${BASE}/informes/informes/${id}/lineas/`).then((r) => r.data),
  duplicar: (id: number, data: { codigo: string; nombre: string }) =>
    apiClient
      .post<InformeContable>(`${BASE}/informes/informes/${id}/duplicar/`, data)
      .then((r) => r.data),
};

export const lineasInformeApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<LineaInforme>>(`${BASE}/informes/lineas/`, { params })
      .then((r) => r.data),
  create: (data: Partial<LineaInforme>) =>
    apiClient.post<LineaInforme>(`${BASE}/informes/lineas/`, data).then((r) => r.data),
  update: (id: number, data: Partial<LineaInforme>) =>
    apiClient.patch<LineaInforme>(`${BASE}/informes/lineas/${id}/`, data).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`${BASE}/informes/lineas/${id}/`).then((r) => r.data),
};

export const generacionesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<GeneracionInformeList>>(`${BASE}/informes/generaciones/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<GeneracionInforme>(`${BASE}/informes/generaciones/${id}/`).then((r) => r.data),
  create: (data: {
    informe: number;
    fecha_desde: string;
    fecha_hasta: string;
    centro_costo?: number;
  }) =>
    apiClient.post<GeneracionInforme>(`${BASE}/informes/generaciones/`, data).then((r) => r.data),
  regenerar: (id: number) =>
    apiClient.post(`${BASE}/informes/generaciones/${id}/regenerar/`).then((r) => r.data),
  getHistorial: (params?: Record<string, unknown>) =>
    apiClient
      .get<GeneracionInformeList[]>(`${BASE}/informes/generaciones/historial/`, { params })
      .then((r) => r.data),
};

// ==================== INTEGRACION ====================

export const parametrosIntegracionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<
        PaginatedResponse<ParametrosIntegracionList>
      >(`${BASE}/integracion/parametros/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient
      .get<ParametrosIntegracion>(`${BASE}/integracion/parametros/${id}/`)
      .then((r) => r.data),
  create: (data: Partial<ParametrosIntegracion>) =>
    apiClient
      .post<ParametrosIntegracion>(`${BASE}/integracion/parametros/`, data)
      .then((r) => r.data),
  update: (id: number, data: Partial<ParametrosIntegracion>) =>
    apiClient
      .patch<ParametrosIntegracion>(`${BASE}/integracion/parametros/${id}/`, data)
      .then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`${BASE}/integracion/parametros/${id}/`).then((r) => r.data),
  porModulo: (modulo: string) =>
    apiClient
      .get<
        ParametrosIntegracionList[]
      >(`${BASE}/integracion/parametros/por_modulo/`, { params: { modulo } })
      .then((r) => r.data),
  getResumen: () => apiClient.get(`${BASE}/integracion/parametros/resumen/`).then((r) => r.data),
  toggleActivo: (id: number) =>
    apiClient.post(`${BASE}/integracion/parametros/${id}/toggle_activo/`).then((r) => r.data),
};

export const logsIntegracionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<LogIntegracionList>>(`${BASE}/integracion/logs/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<LogIntegracion>(`${BASE}/integracion/logs/${id}/`).then((r) => r.data),
  porDocumento: (tipo: string, id: number) =>
    apiClient
      .get<
        LogIntegracionList[]
      >(`${BASE}/integracion/logs/por_documento/`, { params: { tipo, id } })
      .then((r) => r.data),
  erroresRecientes: (limit?: number) =>
    apiClient
      .get<
        LogIntegracionList[]
      >(`${BASE}/integracion/logs/errores_recientes/`, { params: { limit: limit || 20 } })
      .then((r) => r.data),
  getEstadisticas: () =>
    apiClient.get(`${BASE}/integracion/logs/estadisticas/`).then((r) => r.data),
};

export const colaContabilizacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient
      .get<PaginatedResponse<ColaContabilizacionList>>(`${BASE}/integracion/cola/`, { params })
      .then((r) => r.data),
  getById: (id: number) =>
    apiClient.get<ColaContabilizacion>(`${BASE}/integracion/cola/${id}/`).then((r) => r.data),
  create: (data: {
    modulo_origen: string;
    documento_origen_tipo: string;
    documento_origen_id: number;
    prioridad?: number;
    datos_json?: Record<string, unknown>;
    max_intentos?: number;
  }) => apiClient.post<ColaContabilizacion>(`${BASE}/integracion/cola/`, data).then((r) => r.data),
  reintentar: (id: number) =>
    apiClient.post(`${BASE}/integracion/cola/${id}/reintentar/`).then((r) => r.data),
  cancelar: (id: number) =>
    apiClient.post(`${BASE}/integracion/cola/${id}/cancelar/`).then((r) => r.data),
  getPendientes: () =>
    apiClient
      .get<ColaContabilizacionList[]>(`${BASE}/integracion/cola/pendientes/`)
      .then((r) => r.data),
  getErrores: () =>
    apiClient
      .get<ColaContabilizacionList[]>(`${BASE}/integracion/cola/errores/`)
      .then((r) => r.data),
  reintentarTodos: () =>
    apiClient.post(`${BASE}/integracion/cola/reintentar_todos/`).then((r) => r.data),
  getEstadisticas: () =>
    apiClient.get(`${BASE}/integracion/cola/estadisticas/`).then((r) => r.data),
};
