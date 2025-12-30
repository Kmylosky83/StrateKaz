/**
 * API Clients para Analytics
 */
import { apiClient } from '@/lib/api-client';
import type {
  CatalogoKPI,
  FichaTecnicaKPI,
  MetaKPI,
  ConfiguracionSemaforo,
  VistaDashboard,
  WidgetDashboard,
  FavoritoDashboard,
  ValorKPI,
  AccionPorKPI,
  AlertaKPI,
  AnalyticsStats,
  KPISummary,
  DashboardData,
} from '../types';

const API_BASE = '/api/analytics';

// ==================== CONFIG INDICADORES API ====================

export const catalogoKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<CatalogoKPI[]>(`${API_BASE}/config/kpis/`, { params }),
  getById: (id: number) =>
    apiClient.get<CatalogoKPI>(`${API_BASE}/config/kpis/${id}/`),
  create: (data: Partial<CatalogoKPI>) =>
    apiClient.post<CatalogoKPI>(`${API_BASE}/config/kpis/`, data),
  update: (id: number, data: Partial<CatalogoKPI>) =>
    apiClient.patch<CatalogoKPI>(`${API_BASE}/config/kpis/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/config/kpis/${id}/`),
  porCategoria: (categoria: string) =>
    apiClient.get<CatalogoKPI[]>(`${API_BASE}/config/kpis/por_categoria/?categoria=${categoria}`),
  porArea: (areaId: number) =>
    apiClient.get<CatalogoKPI[]>(`${API_BASE}/config/kpis/por_area/?area=${areaId}`),
  porPerspectiva: (perspectiva: string) =>
    apiClient.get<CatalogoKPI[]>(`${API_BASE}/config/kpis/por_perspectiva/?perspectiva=${perspectiva}`),
};

export const fichasTecnicasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<FichaTecnicaKPI[]>(`${API_BASE}/config/fichas-tecnicas/`, { params }),
  getById: (id: number) =>
    apiClient.get<FichaTecnicaKPI>(`${API_BASE}/config/fichas-tecnicas/${id}/`),
  getByKPI: (kpiId: number) =>
    apiClient.get<FichaTecnicaKPI>(`${API_BASE}/config/fichas-tecnicas/por_kpi/${kpiId}/`),
  create: (data: Partial<FichaTecnicaKPI>) =>
    apiClient.post<FichaTecnicaKPI>(`${API_BASE}/config/fichas-tecnicas/`, data),
  update: (id: number, data: Partial<FichaTecnicaKPI>) =>
    apiClient.patch<FichaTecnicaKPI>(`${API_BASE}/config/fichas-tecnicas/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/config/fichas-tecnicas/${id}/`),
};

export const metasKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<MetaKPI[]>(`${API_BASE}/config/metas/`, { params }),
  getById: (id: number) =>
    apiClient.get<MetaKPI>(`${API_BASE}/config/metas/${id}/`),
  getByKPI: (kpiId: number, params?: Record<string, unknown>) =>
    apiClient.get<MetaKPI[]>(`${API_BASE}/config/metas/por_kpi/${kpiId}/`, { params }),
  create: (data: Partial<MetaKPI>) =>
    apiClient.post<MetaKPI>(`${API_BASE}/config/metas/`, data),
  update: (id: number, data: Partial<MetaKPI>) =>
    apiClient.patch<MetaKPI>(`${API_BASE}/config/metas/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/config/metas/${id}/`),
};

export const semaforosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ConfiguracionSemaforo[]>(`${API_BASE}/config/semaforos/`, { params }),
  getById: (id: number) =>
    apiClient.get<ConfiguracionSemaforo>(`${API_BASE}/config/semaforos/${id}/`),
  getByKPI: (kpiId: number) =>
    apiClient.get<ConfiguracionSemaforo>(`${API_BASE}/config/semaforos/por_kpi/${kpiId}/`),
  create: (data: Partial<ConfiguracionSemaforo>) =>
    apiClient.post<ConfiguracionSemaforo>(`${API_BASE}/config/semaforos/`, data),
  update: (id: number, data: Partial<ConfiguracionSemaforo>) =>
    apiClient.patch<ConfiguracionSemaforo>(`${API_BASE}/config/semaforos/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/config/semaforos/${id}/`),
};

// ==================== DASHBOARD API ====================

export const vistasDashboardApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<VistaDashboard[]>(`${API_BASE}/dashboards/vistas/`, { params }),
  getById: (id: number) =>
    apiClient.get<VistaDashboard>(`${API_BASE}/dashboards/vistas/${id}/`),
  getData: (id: number) =>
    apiClient.get<DashboardData>(`${API_BASE}/dashboards/vistas/${id}/data/`),
  create: (data: Partial<VistaDashboard>) =>
    apiClient.post<VistaDashboard>(`${API_BASE}/dashboards/vistas/`, data),
  update: (id: number, data: Partial<VistaDashboard>) =>
    apiClient.patch<VistaDashboard>(`${API_BASE}/dashboards/vistas/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/dashboards/vistas/${id}/`),
  porPerspectiva: (perspectiva: string) =>
    apiClient.get<VistaDashboard[]>(`${API_BASE}/dashboards/vistas/por_perspectiva/?perspectiva=${perspectiva}`),
};

export const widgetsDashboardApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<WidgetDashboard[]>(`${API_BASE}/dashboards/widgets/`, { params }),
  getById: (id: number) =>
    apiClient.get<WidgetDashboard>(`${API_BASE}/dashboards/widgets/${id}/`),
  getByVista: (vistaId: number) =>
    apiClient.get<WidgetDashboard[]>(`${API_BASE}/dashboards/widgets/por_vista/${vistaId}/`),
  create: (data: Partial<WidgetDashboard>) =>
    apiClient.post<WidgetDashboard>(`${API_BASE}/dashboards/widgets/`, data),
  update: (id: number, data: Partial<WidgetDashboard>) =>
    apiClient.patch<WidgetDashboard>(`${API_BASE}/dashboards/widgets/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/dashboards/widgets/${id}/`),
  reordenar: (vistaId: number, widgets: Array<{ id: number; posicion_fila: number; posicion_columna: number }>) =>
    apiClient.post(`${API_BASE}/dashboards/widgets/reordenar/`, { vista: vistaId, widgets }),
};

export const favoritosApi = {
  getAll: () =>
    apiClient.get<FavoritoDashboard[]>(`${API_BASE}/dashboards/favoritos/`),
  create: (vistaId: number) =>
    apiClient.post<FavoritoDashboard>(`${API_BASE}/dashboards/favoritos/`, { vista: vistaId }),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/dashboards/favoritos/${id}/`),
  setPredeterminado: (id: number) =>
    apiClient.post(`${API_BASE}/dashboards/favoritos/${id}/predeterminado/`),
};

// ==================== INDICADORES API ====================

export const valoresKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ValorKPI[]>(`${API_BASE}/indicadores/valores/`, { params }),
  getById: (id: number) =>
    apiClient.get<ValorKPI>(`${API_BASE}/indicadores/valores/${id}/`),
  getByKPI: (kpiId: number, params?: Record<string, unknown>) =>
    apiClient.get<ValorKPI[]>(`${API_BASE}/indicadores/valores/por_kpi/${kpiId}/`, { params }),
  getUltimoValor: (kpiId: number) =>
    apiClient.get<ValorKPI>(`${API_BASE}/indicadores/valores/ultimo/${kpiId}/`),
  create: (data: Partial<ValorKPI>) =>
    apiClient.post<ValorKPI>(`${API_BASE}/indicadores/valores/`, data),
  update: (id: number, data: Partial<ValorKPI>) =>
    apiClient.patch<ValorKPI>(`${API_BASE}/indicadores/valores/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/indicadores/valores/${id}/`),
  aprobar: (id: number) =>
    apiClient.post(`${API_BASE}/indicadores/valores/${id}/aprobar/`),
  rechazar: (id: number, motivo: string) =>
    apiClient.post(`${API_BASE}/indicadores/valores/${id}/rechazar/`, { motivo }),
};

export const accionesKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<AccionPorKPI[]>(`${API_BASE}/indicadores/acciones/`, { params }),
  getById: (id: number) =>
    apiClient.get<AccionPorKPI>(`${API_BASE}/indicadores/acciones/${id}/`),
  getByKPI: (kpiId: number) =>
    apiClient.get<AccionPorKPI[]>(`${API_BASE}/indicadores/acciones/por_kpi/${kpiId}/`),
  create: (data: Partial<AccionPorKPI>) =>
    apiClient.post<AccionPorKPI>(`${API_BASE}/indicadores/acciones/`, data),
  update: (id: number, data: Partial<AccionPorKPI>) =>
    apiClient.patch<AccionPorKPI>(`${API_BASE}/indicadores/acciones/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/indicadores/acciones/${id}/`),
  completar: (id: number, resultado: string) =>
    apiClient.post(`${API_BASE}/indicadores/acciones/${id}/completar/`, { resultado }),
  cancelar: (id: number, motivo: string) =>
    apiClient.post(`${API_BASE}/indicadores/acciones/${id}/cancelar/`, { motivo }),
};

export const alertasKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<AlertaKPI[]>(`${API_BASE}/indicadores/alertas/`, { params }),
  getById: (id: number) =>
    apiClient.get<AlertaKPI>(`${API_BASE}/indicadores/alertas/${id}/`),
  getByKPI: (kpiId: number) =>
    apiClient.get<AlertaKPI[]>(`${API_BASE}/indicadores/alertas/por_kpi/${kpiId}/`),
  marcarLeida: (id: number) =>
    apiClient.post(`${API_BASE}/indicadores/alertas/${id}/marcar_leida/`),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/indicadores/alertas/${id}/`),
};

// ==================== ANALYTICS API ====================

export const analyticsApi = {
  getStats: () =>
    apiClient.get<AnalyticsStats>(`${API_BASE}/stats/`),
  getKPISummary: (params?: Record<string, unknown>) =>
    apiClient.get<KPISummary[]>(`${API_BASE}/kpi-summary/`, { params }),
  getKPISummaryByCategoria: (categoria: string) =>
    apiClient.get<KPISummary[]>(`${API_BASE}/kpi-summary/categoria/${categoria}/`),
  getKPISummaryByPerspectiva: (perspectiva: string) =>
    apiClient.get<KPISummary[]>(`${API_BASE}/kpi-summary/perspectiva/${perspectiva}/`),
};

// ==================== SEMANA 24 API ====================

// Import types
import type {
  AnalisisKPI,
  TendenciaKPI,
  AnomaliaDetectada,
  PlantillaInforme,
  InformeDinamico,
  ProgramacionInforme,
  HistorialInforme,
  PlanAccionKPI,
  ActividadPlanKPI,
  SeguimientoPlanKPI,
  IntegracionAccionCorrectiva,
  ConfiguracionExportacion,
  LogExportacion,
} from '../types';

// Análisis KPI
export const analisisKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<AnalisisKPI[]>(`${API_BASE}/analisis/analisis-kpi/`, { params }),
  getById: (id: number) =>
    apiClient.get<AnalisisKPI>(`${API_BASE}/analisis/analisis-kpi/${id}/`),
  create: (data: Partial<AnalisisKPI>) =>
    apiClient.post<AnalisisKPI>(`${API_BASE}/analisis/analisis-kpi/`, data),
  generarAnalisis: (kpiId: number, periodo: string, tipoAnalisis: string) =>
    apiClient.post<AnalisisKPI>(`${API_BASE}/analisis/analisis-kpi/generar/`, {
      kpi: kpiId,
      periodo,
      tipo_analisis: tipoAnalisis,
    }),
  compararPeriodos: (kpiId: number, periodo1: string, periodo2: string) =>
    apiClient.post<AnalisisKPI>(`${API_BASE}/analisis/analisis-kpi/comparar_periodos/`, {
      kpi: kpiId,
      periodo1,
      periodo2,
    }),
};

// Tendencias KPI
export const tendenciasKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<TendenciaKPI[]>(`${API_BASE}/analisis/tendencias/`, { params }),
  getById: (id: number) =>
    apiClient.get<TendenciaKPI>(`${API_BASE}/analisis/tendencias/${id}/`),
  calcularTendencia: (kpiId: number, periodoInicio: string, periodoFin: string, tipoTendencia: string) =>
    apiClient.post<TendenciaKPI>(`${API_BASE}/analisis/tendencias/calcular/`, {
      kpi: kpiId,
      periodo_inicio: periodoInicio,
      periodo_fin: periodoFin,
      tipo_tendencia: tipoTendencia,
    }),
  proyectar: (id: number, periodosProyeccion: number) =>
    apiClient.post(`${API_BASE}/analisis/tendencias/${id}/proyectar/`, {
      periodos: periodosProyeccion,
    }),
};

// Anomalías Detectadas
export const anomaliasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<AnomaliaDetectada[]>(`${API_BASE}/analisis/anomalias/`, { params }),
  getById: (id: number) =>
    apiClient.get<AnomaliaDetectada>(`${API_BASE}/analisis/anomalias/${id}/`),
  marcarRevisada: (id: number, observaciones: string) =>
    apiClient.post(`${API_BASE}/analisis/anomalias/${id}/marcar_revisada/`, { observaciones }),
  pendientes: () =>
    apiClient.get<AnomaliaDetectada[]>(`${API_BASE}/analisis/anomalias/pendientes/`),
};

// Plantillas de Informe
export const plantillasInformeApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PlantillaInforme[]>(`${API_BASE}/informes/plantillas/`, { params }),
  getById: (id: number) =>
    apiClient.get<PlantillaInforme>(`${API_BASE}/informes/plantillas/${id}/`),
  create: (data: Partial<PlantillaInforme>) =>
    apiClient.post<PlantillaInforme>(`${API_BASE}/informes/plantillas/`, data),
  update: (id: number, data: Partial<PlantillaInforme>) =>
    apiClient.patch<PlantillaInforme>(`${API_BASE}/informes/plantillas/${id}/`, data),
  delete: (id: number) =>
    apiClient.delete(`${API_BASE}/informes/plantillas/${id}/`),
  duplicar: (id: number) =>
    apiClient.post<PlantillaInforme>(`${API_BASE}/informes/plantillas/${id}/duplicar/`),
};

// Informes Dinámicos
export const informesDinamicosApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<InformeDinamico[]>(`${API_BASE}/informes/dinamicos/`, { params }),
  getById: (id: number) =>
    apiClient.get<InformeDinamico>(`${API_BASE}/informes/dinamicos/${id}/`),
  create: (data: Partial<InformeDinamico>) =>
    apiClient.post<InformeDinamico>(`${API_BASE}/informes/dinamicos/`, data),
  generar: (plantillaId: number, periodo: string, parametros?: Record<string, unknown>) =>
    apiClient.post<InformeDinamico>(`${API_BASE}/informes/dinamicos/generar/`, {
      plantilla: plantillaId,
      periodo,
      parametros_generacion: parametros,
    }),
  descargar: (id: number) =>
    apiClient.get(`${API_BASE}/informes/dinamicos/${id}/descargar/`, { responseType: 'blob' }),
  reenviar: (id: number, destinatarios: string[]) =>
    apiClient.post(`${API_BASE}/informes/dinamicos/${id}/reenviar/`, { destinatarios }),
};

// Programaciones de Informe
export const programacionesInformeApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ProgramacionInforme[]>(`${API_BASE}/informes/programaciones/`, { params }),
  getById: (id: number) =>
    apiClient.get<ProgramacionInforme>(`${API_BASE}/informes/programaciones/${id}/`),
  create: (data: Partial<ProgramacionInforme>) =>
    apiClient.post<ProgramacionInforme>(`${API_BASE}/informes/programaciones/`, data),
  update: (id: number, data: Partial<ProgramacionInforme>) =>
    apiClient.patch<ProgramacionInforme>(`${API_BASE}/informes/programaciones/${id}/`, data),
  ejecutarAhora: (id: number) =>
    apiClient.post(`${API_BASE}/informes/programaciones/${id}/ejecutar_ahora/`),
  pausar: (id: number) =>
    apiClient.post(`${API_BASE}/informes/programaciones/${id}/pausar/`),
  reanudar: (id: number) =>
    apiClient.post(`${API_BASE}/informes/programaciones/${id}/reanudar/`),
};

// Historial de Informes
export const historialInformesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<HistorialInforme[]>(`${API_BASE}/informes/historial/`, { params }),
  getById: (id: number) =>
    apiClient.get<HistorialInforme>(`${API_BASE}/informes/historial/${id}/`),
};

// Planes de Acción KPI
export const planesAccionKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PlanAccionKPI[]>(`${API_BASE}/acciones/planes/`, { params }),
  getById: (id: number) =>
    apiClient.get<PlanAccionKPI>(`${API_BASE}/acciones/planes/${id}/`),
  create: (data: Partial<PlanAccionKPI>) =>
    apiClient.post<PlanAccionKPI>(`${API_BASE}/acciones/planes/`, data),
  update: (id: number, data: Partial<PlanAccionKPI>) =>
    apiClient.patch<PlanAccionKPI>(`${API_BASE}/acciones/planes/${id}/`, data),
  aprobar: (id: number) =>
    apiClient.post(`${API_BASE}/acciones/planes/${id}/aprobar/`),
  completar: (id: number, resultadoObtenido: string) =>
    apiClient.post(`${API_BASE}/acciones/planes/${id}/completar/`, { resultado_obtenido: resultadoObtenido }),
  agregarSeguimiento: (id: number, data: Partial<SeguimientoPlanKPI>) =>
    apiClient.post<SeguimientoPlanKPI>(`${API_BASE}/acciones/planes/${id}/seguimientos/`, data),
};

// Actividades de Plan KPI
export const actividadesPlanKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ActividadPlanKPI[]>(`${API_BASE}/acciones/actividades/`, { params }),
  getById: (id: number) =>
    apiClient.get<ActividadPlanKPI>(`${API_BASE}/acciones/actividades/${id}/`),
  create: (data: Partial<ActividadPlanKPI>) =>
    apiClient.post<ActividadPlanKPI>(`${API_BASE}/acciones/actividades/`, data),
  update: (id: number, data: Partial<ActividadPlanKPI>) =>
    apiClient.patch<ActividadPlanKPI>(`${API_BASE}/acciones/actividades/${id}/`, data),
};

// Seguimientos de Plan KPI
export const seguimientosPlanKPIApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<SeguimientoPlanKPI[]>(`${API_BASE}/acciones/seguimientos/`, { params }),
  getById: (id: number) =>
    apiClient.get<SeguimientoPlanKPI>(`${API_BASE}/acciones/seguimientos/${id}/`),
  create: (data: Partial<SeguimientoPlanKPI>) =>
    apiClient.post<SeguimientoPlanKPI>(`${API_BASE}/acciones/seguimientos/`, data),
};

// Integraciones con Acciones Correctivas
export const integracionesACApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<IntegracionAccionCorrectiva[]>(`${API_BASE}/acciones/integraciones-ac/`, { params }),
  create: (data: Partial<IntegracionAccionCorrectiva>) =>
    apiClient.post<IntegracionAccionCorrectiva>(`${API_BASE}/acciones/integraciones-ac/`, data),
};

// Configuraciones de Exportación
export const configExportacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<ConfiguracionExportacion[]>(`${API_BASE}/exportacion/configuraciones/`, { params }),
  getById: (id: number) =>
    apiClient.get<ConfiguracionExportacion>(`${API_BASE}/exportacion/configuraciones/${id}/`),
  create: (data: Partial<ConfiguracionExportacion>) =>
    apiClient.post<ConfiguracionExportacion>(`${API_BASE}/exportacion/configuraciones/`, data),
  update: (id: number, data: Partial<ConfiguracionExportacion>) =>
    apiClient.patch<ConfiguracionExportacion>(`${API_BASE}/exportacion/configuraciones/${id}/`, data),
};

// Logs de Exportación
export const logsExportacionApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<LogExportacion[]>(`${API_BASE}/exportacion/logs/`, { params }),
  getById: (id: number) =>
    apiClient.get<LogExportacion>(`${API_BASE}/exportacion/logs/${id}/`),
};
