/**
 * Hooks para Analytics
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  catalogoKPIApi,
  fichasTecnicasApi,
  metasKPIApi,
  semaforosApi,
  vistasDashboardApi,
  widgetsDashboardApi,
  favoritosApi,
  valoresKPIApi,
  accionesKPIApi,
  alertasKPIApi,
  analyticsApi,
} from '../api';

// ==================== CONFIG INDICADORES HOOKS ====================

// Catálogo KPI
export const useCatalogosKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['catalogos-kpi', params],
    queryFn: () => catalogoKPIApi.getAll(params),
  });
};

export const useCatalogoKPI = (id: number) => {
  return useQuery({
    queryKey: ['catalogo-kpi', id],
    queryFn: () => catalogoKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useCatalogosKPIPorCategoria = (categoria: string) => {
  return useQuery({
    queryKey: ['catalogos-kpi-categoria', categoria],
    queryFn: () => catalogoKPIApi.porCategoria(categoria),
    enabled: !!categoria,
  });
};

export const useCatalogosKPIPorPerspectiva = (perspectiva: string) => {
  return useQuery({
    queryKey: ['catalogos-kpi-perspectiva', perspectiva],
    queryFn: () => catalogoKPIApi.porPerspectiva(perspectiva),
    enabled: !!perspectiva,
  });
};

export const useCreateCatalogoKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogoKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogos-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

export const useUpdateCatalogoKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      catalogoKPIApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalogos-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo-kpi', variables.id] });
    },
  });
};

export const useDeleteCatalogoKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogoKPIApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogos-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

// Fichas Técnicas
export const useFichasTecnicas = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['fichas-tecnicas', params],
    queryFn: () => fichasTecnicasApi.getAll(params),
  });
};

export const useFichaTecnica = (id: number) => {
  return useQuery({
    queryKey: ['ficha-tecnica', id],
    queryFn: () => fichasTecnicasApi.getById(id),
    enabled: !!id,
  });
};

export const useFichaTecnicaByKPI = (kpiId: number) => {
  return useQuery({
    queryKey: ['ficha-tecnica-kpi', kpiId],
    queryFn: () => fichasTecnicasApi.getByKPI(kpiId),
    enabled: !!kpiId,
  });
};

export const useCreateFichaTecnica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fichasTecnicasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
    },
  });
};

export const useUpdateFichaTecnica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      fichasTecnicasApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['ficha-tecnica', variables.id] });
    },
  });
};

export const useDeleteFichaTecnica = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fichasTecnicasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
    },
  });
};

// Metas KPI
export const useMetasKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['metas-kpi', params],
    queryFn: () => metasKPIApi.getAll(params),
  });
};

export const useMetaKPI = (id: number) => {
  return useQuery({
    queryKey: ['meta-kpi', id],
    queryFn: () => metasKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useMetasKPIByKPI = (kpiId: number, params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['metas-kpi-by-kpi', kpiId, params],
    queryFn: () => metasKPIApi.getByKPI(kpiId, params),
    enabled: !!kpiId,
  });
};

export const useCreateMetaKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: metasKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-kpi'] });
    },
  });
};

export const useUpdateMetaKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) => metasKPIApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['metas-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['meta-kpi', variables.id] });
    },
  });
};

export const useDeleteMetaKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: metasKPIApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-kpi'] });
    },
  });
};

// Semáforos
export const useSemaforos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['semaforos', params],
    queryFn: () => semaforosApi.getAll(params),
  });
};

export const useSemaforo = (id: number) => {
  return useQuery({
    queryKey: ['semaforo', id],
    queryFn: () => semaforosApi.getById(id),
    enabled: !!id,
  });
};

export const useSemaforoByKPI = (kpiId: number) => {
  return useQuery({
    queryKey: ['semaforo-kpi', kpiId],
    queryFn: () => semaforosApi.getByKPI(kpiId),
    enabled: !!kpiId,
  });
};

export const useCreateSemaforo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: semaforosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semaforos'] });
    },
  });
};

export const useUpdateSemaforo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) => semaforosApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['semaforos'] });
      queryClient.invalidateQueries({ queryKey: ['semaforo', variables.id] });
    },
  });
};

export const useDeleteSemaforo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: semaforosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semaforos'] });
    },
  });
};

// ==================== DASHBOARD HOOKS ====================

// Vistas Dashboard
export const useVistasDashboard = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['vistas-dashboard', params],
    queryFn: () => vistasDashboardApi.getAll(params),
  });
};

export const useVistaDashboard = (id: number) => {
  return useQuery({
    queryKey: ['vista-dashboard', id],
    queryFn: () => vistasDashboardApi.getById(id),
    enabled: !!id,
  });
};

export const useDashboardData = (id: number) => {
  return useQuery({
    queryKey: ['dashboard-data', id],
    queryFn: () => vistasDashboardApi.getData(id),
    enabled: !!id,
  });
};

export const useVistasDashboardPorPerspectiva = (perspectiva: string) => {
  return useQuery({
    queryKey: ['vistas-dashboard-perspectiva', perspectiva],
    queryFn: () => vistasDashboardApi.porPerspectiva(perspectiva),
    enabled: !!perspectiva,
  });
};

export const useCreateVistaDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vistasDashboardApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vistas-dashboard'] });
    },
  });
};

export const useUpdateVistaDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      vistasDashboardApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vistas-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vista-dashboard', variables.id] });
    },
  });
};

export const useDeleteVistaDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vistasDashboardApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vistas-dashboard'] });
    },
  });
};

// Widgets Dashboard
export const useWidgetsDashboard = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['widgets-dashboard', params],
    queryFn: () => widgetsDashboardApi.getAll(params),
  });
};

export const useWidgetDashboard = (id: number) => {
  return useQuery({
    queryKey: ['widget-dashboard', id],
    queryFn: () => widgetsDashboardApi.getById(id),
    enabled: !!id,
  });
};

export const useWidgetsByVista = (vistaId: number) => {
  return useQuery({
    queryKey: ['widgets-by-vista', vistaId],
    queryFn: () => widgetsDashboardApi.getByVista(vistaId),
    enabled: !!vistaId,
  });
};

export const useCreateWidgetDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: widgetsDashboardApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets-dashboard'] });
    },
  });
};

export const useUpdateWidgetDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      widgetsDashboardApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['widgets-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['widget-dashboard', variables.id] });
    },
  });
};

export const useDeleteWidgetDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: widgetsDashboardApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets-dashboard'] });
    },
  });
};

// Favoritos
export const useFavoritos = () => {
  return useQuery({
    queryKey: ['favoritos-dashboard'],
    queryFn: () => favoritosApi.getAll(),
  });
};

export const useCreateFavorito = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos-dashboard'] });
    },
  });
};

export const useDeleteFavorito = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos-dashboard'] });
    },
  });
};

// ==================== INDICADORES HOOKS ====================

// Valores KPI
export const useValoresKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['valores-kpi', params],
    queryFn: () => valoresKPIApi.getAll(params),
  });
};

export const useValorKPI = (id: number) => {
  return useQuery({
    queryKey: ['valor-kpi', id],
    queryFn: () => valoresKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useValoresKPIByKPI = (kpiId: number, params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['valores-kpi-by-kpi', kpiId, params],
    queryFn: () => valoresKPIApi.getByKPI(kpiId, params),
    enabled: !!kpiId,
  });
};

export const useUltimoValorKPI = (kpiId: number) => {
  return useQuery({
    queryKey: ['ultimo-valor-kpi', kpiId],
    queryFn: () => valoresKPIApi.getUltimoValor(kpiId),
    enabled: !!kpiId,
  });
};

export const useCreateValorKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: valoresKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
    },
  });
};

export const useUpdateValorKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      valoresKPIApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['valores-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['valor-kpi', variables.id] });
    },
  });
};

export const useDeleteValorKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: valoresKPIApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

export const useAprobarValorKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: valoresKPIApi.aprobar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores-kpi'] });
    },
  });
};

// Acciones KPI
export const useAccionesKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['acciones-kpi', params],
    queryFn: () => accionesKPIApi.getAll(params),
  });
};

export const useAccionKPI = (id: number) => {
  return useQuery({
    queryKey: ['accion-kpi', id],
    queryFn: () => accionesKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useAccionesKPIByKPI = (kpiId: number) => {
  return useQuery({
    queryKey: ['acciones-kpi-by-kpi', kpiId],
    queryFn: () => accionesKPIApi.getByKPI(kpiId),
    enabled: !!kpiId,
  });
};

export const useCreateAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accionesKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acciones-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

export const useUpdateAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      accionesKPIApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['acciones-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['accion-kpi', variables.id] });
    },
  });
};

export const useDeleteAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accionesKPIApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acciones-kpi'] });
    },
  });
};

export const useCompletarAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resultado }: { id: number; resultado: string }) =>
      accionesKPIApi.completar(id, resultado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acciones-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

// Alertas KPI
export const useAlertasKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['alertas-kpi', params],
    queryFn: () => alertasKPIApi.getAll(params),
  });
};

export const useAlertaKPI = (id: number) => {
  return useQuery({
    queryKey: ['alerta-kpi', id],
    queryFn: () => alertasKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useAlertasKPIByKPI = (kpiId: number) => {
  return useQuery({
    queryKey: ['alertas-kpi-by-kpi', kpiId],
    queryFn: () => alertasKPIApi.getByKPI(kpiId),
    enabled: !!kpiId,
  });
};

export const useMarcarAlertaLeida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: alertasKPIApi.marcarLeida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-stats'] });
    },
  });
};

// ==================== ANALYTICS HOOKS ====================

export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => analyticsApi.getStats(),
  });
};

export const useKPISummary = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['kpi-summary', params],
    queryFn: () => analyticsApi.getKPISummary(params),
  });
};

export const useKPISummaryByCategoria = (categoria: string) => {
  return useQuery({
    queryKey: ['kpi-summary-categoria', categoria],
    queryFn: () => analyticsApi.getKPISummaryByCategoria(categoria),
    enabled: !!categoria,
  });
};

export const useKPISummaryByPerspectiva = (perspectiva: string) => {
  return useQuery({
    queryKey: ['kpi-summary-perspectiva', perspectiva],
    queryFn: () => analyticsApi.getKPISummaryByPerspectiva(perspectiva),
    enabled: !!perspectiva,
  });
};

// ==================== SEMANA 24 HOOKS ====================

// Import additional APIs
import {
  analisisKPIApi,
  tendenciasKPIApi,
  anomaliasApi,
  plantillasInformeApi,
  informesDinamicosApi,
  programacionesInformeApi,
  planesAccionKPIApi,
  actividadesPlanKPIApi,
  seguimientosPlanKPIApi,
  integracionesACApi,
  configExportacionApi,
  logsExportacionApi,
} from '../api';

// Análisis KPI Hooks
export const useAnalisisKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['analisis-kpi', params],
    queryFn: () => analisisKPIApi.getAll(params),
  });
};

export const useGenerarAnalisisKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kpiId,
      periodo,
      tipoAnalisis,
    }: {
      kpiId: number;
      periodo: string;
      tipoAnalisis: string;
    }) => analisisKPIApi.generarAnalisis(kpiId, periodo, tipoAnalisis),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis-kpi'] });
    },
  });
};

// Tendencias KPI Hooks
export const useTendenciasKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['tendencias-kpi', params],
    queryFn: () => tendenciasKPIApi.getAll(params),
  });
};

export const useCalcularTendencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kpiId,
      periodoInicio,
      periodoFin,
      tipoTendencia,
    }: {
      kpiId: number;
      periodoInicio: string;
      periodoFin: string;
      tipoTendencia: string;
    }) => tendenciasKPIApi.calcularTendencia(kpiId, periodoInicio, periodoFin, tipoTendencia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tendencias-kpi'] });
    },
  });
};

// Anomalías Hooks
export const useAnomalias = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['anomalias', params],
    queryFn: () => anomaliasApi.getAll(params),
  });
};

export const useAnomaliasPendientes = () => {
  return useQuery({
    queryKey: ['anomalias-pendientes'],
    queryFn: () => anomaliasApi.pendientes(),
  });
};

export const useMarcarAnomaliaRevisada = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones: string }) =>
      anomaliasApi.marcarRevisada(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalias'] });
      queryClient.invalidateQueries({ queryKey: ['anomalias-pendientes'] });
    },
  });
};

// Plantillas Informe Hooks
export const usePlantillasInforme = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['plantillas-informe', params],
    queryFn: () => plantillasInformeApi.getAll(params),
  });
};

export const useCreatePlantillaInforme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plantillasInformeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-informe'] });
    },
  });
};

export const useUpdatePlantillaInforme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      plantillasInformeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-informe'] });
    },
  });
};

// Informes Dinámicos Hooks
export const useInformesDinamicos = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['informes-dinamicos', params],
    queryFn: () => informesDinamicosApi.getAll(params),
  });
};

export const useGenerarInforme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plantillaId,
      periodo,
      parametros,
    }: {
      plantillaId: number;
      periodo: string;
      parametros?: Record<string, unknown>;
    }) => informesDinamicosApi.generar(plantillaId, periodo, parametros),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informes-dinamicos'] });
    },
  });
};

// Programaciones Informe Hooks
export const useProgramacionesInforme = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['programaciones-informe', params],
    queryFn: () => programacionesInformeApi.getAll(params),
  });
};

export const useCreateProgramacionInforme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programacionesInformeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones-informe'] });
    },
  });
};

// Planes Acción KPI Hooks
export const usePlanesAccionKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['planes-accion-kpi', params],
    queryFn: () => planesAccionKPIApi.getAll(params),
  });
};

export const usePlanAccionKPI = (id: number) => {
  return useQuery({
    queryKey: ['plan-accion-kpi', id],
    queryFn: () => planesAccionKPIApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePlanAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: planesAccionKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-accion-kpi'] });
    },
  });
};

export const useUpdatePlanAccionKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<unknown> }) =>
      planesAccionKPIApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planes-accion-kpi'] });
      queryClient.invalidateQueries({ queryKey: ['plan-accion-kpi', variables.id] });
    },
  });
};

// Actividades Plan KPI Hooks
export const useActividadesPlanKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['actividades-plan-kpi', params],
    queryFn: () => actividadesPlanKPIApi.getAll(params),
  });
};

export const useCreateActividadPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actividadesPlanKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades-plan-kpi'] });
    },
  });
};

// Seguimientos Plan KPI Hooks
export const useSeguimientosPlanKPI = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['seguimientos-plan-kpi', params],
    queryFn: () => seguimientosPlanKPIApi.getAll(params),
  });
};

export const useCreateSeguimientoPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seguimientosPlanKPIApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguimientos-plan-kpi'] });
    },
  });
};

// Integraciones AC Hooks
export const useIntegracionesAC = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['integraciones-ac', params],
    queryFn: () => integracionesACApi.getAll(params),
  });
};

export const useCreateIntegracionAC = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: integracionesACApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integraciones-ac'] });
    },
  });
};

// Configuración Exportación Hooks
export const useConfiguracionesExportacion = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['configuraciones-exportacion', params],
    queryFn: () => configExportacionApi.getAll(params),
  });
};

export const useCreateConfigExportacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: configExportacionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones-exportacion'] });
    },
  });
};

// Logs Exportación Hooks
export const useLogsExportacion = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-exportacion', params],
    queryFn: () => logsExportacionApi.getAll(params),
  });
};
