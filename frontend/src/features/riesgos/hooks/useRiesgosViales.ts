/**
 * React Query Hooks para Riesgos Viales - PESV
 * Plan Estrategico de Seguridad Vial - Resolucion 40595/2022
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  factoresRiesgoVialApi,
  riesgosVialesApi,
  controlesVialesApi,
  incidentesVialesApi,
  inspeccionesVehiculoApi,
  estadisticasPESVApi,
} from '../api/riesgosVialesApi';
import type {
  TipoRiesgoVialCreate,
  TipoRiesgoVialUpdate,
  RiesgoVialCreate,
  RiesgoVialUpdate,
  RiesgoVialFilter,
  ControlVialCreate,
  ControlVialUpdate,
  ControlVialFilter,
  IncidenteVialCreate,
  IncidenteVialUpdate,
  IncidenteVialFilter,
  InspeccionVehiculoCreate,
  InspeccionVehiculoUpdate,
  InspeccionVehiculoFilter,
  CategoriaFactor,
  PilarPESV,
} from '../types/riesgos-viales.types';

// ============================================
// QUERY KEYS
// ============================================

export const riesgosVialesKeys = {
  all: ['riesgos-viales'] as const,

  // Factores/Tipos de riesgo
  factores: () => [...riesgosVialesKeys.all, 'factores'] as const,
  factoresList: (categoria?: CategoriaFactor) =>
    [...riesgosVialesKeys.factores(), 'list', categoria] as const,
  factor: (id: number) => [...riesgosVialesKeys.factores(), id] as const,
  factoresPorPilar: (pilar: PilarPESV) =>
    [...riesgosVialesKeys.factores(), 'pilar', pilar] as const,

  // Riesgos
  riesgos: () => [...riesgosVialesKeys.all, 'riesgos'] as const,
  riesgosList: (filters?: RiesgoVialFilter) =>
    [...riesgosVialesKeys.riesgos(), 'list', filters] as const,
  riesgo: (id: number) => [...riesgosVialesKeys.riesgos(), id] as const,
  riesgosResumen: () => [...riesgosVialesKeys.riesgos(), 'resumen'] as const,
  riesgosCriticos: () => [...riesgosVialesKeys.riesgos(), 'criticos'] as const,
  riesgosAltos: () => [...riesgosVialesKeys.riesgos(), 'altos'] as const,
  riesgosSinControles: () => [...riesgosVialesKeys.riesgos(), 'sin-controles'] as const,
  riesgosPorPilar: (pilar: PilarPESV) =>
    [...riesgosVialesKeys.riesgos(), 'pilar', pilar] as const,

  // Controles
  controles: () => [...riesgosVialesKeys.all, 'controles'] as const,
  controlesList: (filters?: ControlVialFilter) =>
    [...riesgosVialesKeys.controles(), 'list', filters] as const,
  control: (id: number) => [...riesgosVialesKeys.controles(), id] as const,
  controlesResumen: () => [...riesgosVialesKeys.controles(), 'resumen'] as const,
  controlesAtrasados: () => [...riesgosVialesKeys.controles(), 'atrasados'] as const,
  controlesIneficaces: () => [...riesgosVialesKeys.controles(), 'ineficaces'] as const,
  controlesPorRiesgo: (riesgoId: number) =>
    [...riesgosVialesKeys.controles(), 'riesgo', riesgoId] as const,

  // Incidentes
  incidentes: () => [...riesgosVialesKeys.all, 'incidentes'] as const,
  incidentesList: (filters?: IncidenteVialFilter) =>
    [...riesgosVialesKeys.incidentes(), 'list', filters] as const,
  incidente: (id: number) => [...riesgosVialesKeys.incidentes(), id] as const,
  incidentesResumen: () => [...riesgosVialesKeys.incidentes(), 'resumen'] as const,
  incidentesPendientes: () => [...riesgosVialesKeys.incidentes(), 'pendientes'] as const,
  incidentesGraves: () => [...riesgosVialesKeys.incidentes(), 'graves'] as const,

  // Inspecciones
  inspecciones: () => [...riesgosVialesKeys.all, 'inspecciones'] as const,
  inspeccionesList: (filters?: InspeccionVehiculoFilter) =>
    [...riesgosVialesKeys.inspecciones(), 'list', filters] as const,
  inspeccion: (id: number) => [...riesgosVialesKeys.inspecciones(), id] as const,
  inspeccionesResumen: () => [...riesgosVialesKeys.inspecciones(), 'resumen'] as const,
  inspeccionesRechazadas: () => [...riesgosVialesKeys.inspecciones(), 'rechazadas'] as const,
  inspeccionesPorPlaca: (placa: string) =>
    [...riesgosVialesKeys.inspecciones(), 'placa', placa] as const,

  // Estadisticas
  estadisticas: () => [...riesgosVialesKeys.all, 'estadisticas'] as const,
  estadisticasIndicadores: (periodo?: { fecha_inicio: string; fecha_fin: string }) =>
    [...riesgosVialesKeys.estadisticas(), 'indicadores', periodo] as const,
  estadisticasTendencias: (meses: number) =>
    [...riesgosVialesKeys.estadisticas(), 'tendencias', meses] as const,
  dashboardPilares: () => [...riesgosVialesKeys.estadisticas(), 'dashboard-pilares'] as const,
};

// ============================================
// HOOKS PARA FACTORES DE RIESGO VIAL
// ============================================

export function useFactoresRiesgoVial(categoria?: CategoriaFactor) {
  return useQuery({
    queryKey: riesgosVialesKeys.factoresList(categoria),
    queryFn: () => factoresRiesgoVialApi.getAll(categoria),
    staleTime: 10 * 60 * 1000, // 10 minutos (es catalogo)
  });
}

export function useFactorRiesgoVial(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.factor(id),
    queryFn: () => factoresRiesgoVialApi.getById(id),
    enabled: !!id,
  });
}

export function useFactoresPorPilar(pilar: PilarPESV) {
  return useQuery({
    queryKey: riesgosVialesKeys.factoresPorPilar(pilar),
    queryFn: () => factoresRiesgoVialApi.getByPilar(pilar),
    enabled: !!pilar,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateFactorRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TipoRiesgoVialCreate) => factoresRiesgoVialApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.factores() });
    },
  });
}

export function useUpdateFactorRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TipoRiesgoVialUpdate }) =>
      factoresRiesgoVialApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.factores() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.factor(id) });
    },
  });
}

export function useDeleteFactorRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => factoresRiesgoVialApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.factores() });
    },
  });
}

// ============================================
// HOOKS PARA RIESGOS VIALES
// ============================================

export function useRiesgosViales(filters?: RiesgoVialFilter) {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosList(filters),
    queryFn: () => riesgosVialesApi.getAll(filters),
  });
}

export function useRiesgoVial(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgo(id),
    queryFn: () => riesgosVialesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenRiesgosViales() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosResumen(),
    queryFn: riesgosVialesApi.resumen,
  });
}

export function useRiesgosCriticos() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosCriticos(),
    queryFn: riesgosVialesApi.criticos,
  });
}

export function useRiesgosAltos() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosAltos(),
    queryFn: riesgosVialesApi.altos,
  });
}

export function useRiesgosSinControles() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosSinControles(),
    queryFn: riesgosVialesApi.sinControles,
  });
}

export function useRiesgosPorPilar(pilar: PilarPESV) {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosPorPilar(pilar),
    queryFn: () => riesgosVialesApi.getByPilar(pilar),
    enabled: !!pilar,
  });
}

export function useCreateRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RiesgoVialCreate) => riesgosVialesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.riesgos() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

export function useUpdateRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RiesgoVialUpdate }) =>
      riesgosVialesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.riesgos() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.riesgo(id) });
    },
  });
}

export function useDeleteRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => riesgosVialesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.riesgos() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

// ============================================
// HOOKS PARA CONTROLES VIALES
// ============================================

export function useControlesViales(filters?: ControlVialFilter) {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesList(filters),
    queryFn: () => controlesVialesApi.getAll(filters),
  });
}

export function useControlVial(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.control(id),
    queryFn: () => controlesVialesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenControlesViales() {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesResumen(),
    queryFn: controlesVialesApi.resumen,
  });
}

export function useControlesAtrasados() {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesAtrasados(),
    queryFn: controlesVialesApi.atrasados,
  });
}

export function useControlesIneficaces() {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesIneficaces(),
    queryFn: controlesVialesApi.ineficaces,
  });
}

export function useControlesPorRiesgo(riesgoId: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesPorRiesgo(riesgoId),
    queryFn: () => controlesVialesApi.getByRiesgo(riesgoId),
    enabled: !!riesgoId,
  });
}

export function useCreateControlVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ControlVialCreate) => controlesVialesApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.controles() });
      queryClient.invalidateQueries({
        queryKey: riesgosVialesKeys.controlesPorRiesgo(data.riesgo_id),
      });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

export function useUpdateControlVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ControlVialUpdate }) =>
      controlesVialesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.controles() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.control(id) });
    },
  });
}

export function useDeleteControlVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => controlesVialesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.controles() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

// ============================================
// HOOKS PARA INCIDENTES VIALES
// ============================================

export function useIncidentesViales(filters?: IncidenteVialFilter) {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesList(filters),
    queryFn: () => incidentesVialesApi.getAll(filters),
  });
}

export function useIncidenteVial(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.incidente(id),
    queryFn: () => incidentesVialesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenIncidentesViales() {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesResumen(),
    queryFn: incidentesVialesApi.resumen,
  });
}

export function useIncidentesPendientesInvestigacion() {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesPendientes(),
    queryFn: incidentesVialesApi.pendientesInvestigacion,
  });
}

export function useIncidentesGraves() {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesGraves(),
    queryFn: incidentesVialesApi.graves,
  });
}

export function useIncidentesPorRangoFechas(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: [...riesgosVialesKeys.incidentes(), 'rango', fechaInicio, fechaFin],
    queryFn: () => incidentesVialesApi.porRangoFechas(fechaInicio, fechaFin),
    enabled: !!fechaInicio && !!fechaFin,
  });
}

export function useCreateIncidenteVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IncidenteVialCreate) => incidentesVialesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

export function useUpdateIncidenteVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IncidenteVialUpdate }) =>
      incidentesVialesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidente(id) });
    },
  });
}

export function useDeleteIncidenteVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => incidentesVialesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

// Acciones especiales de incidentes
export function useIniciarInvestigacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, responsableId }: { id: number; responsableId: number }) =>
      incidentesVialesApi.iniciarInvestigacion(id, responsableId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidente(id) });
    },
  });
}

export function useCerrarInvestigacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        causa_inmediata: string;
        causas_basicas: string;
        factores_trabajo?: string;
        acciones_correctivas: string;
      };
    }) => incidentesVialesApi.cerrarInvestigacion(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidente(id) });
    },
  });
}

export function useReportarARL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { numero_reporte_arl: string; fecha_reporte_arl: string };
    }) => incidentesVialesApi.reportarARL(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidente(id) });
    },
  });
}

// ============================================
// HOOKS PARA INSPECCIONES DE VEHICULOS
// ============================================

export function useInspeccionesVehiculo(filters?: InspeccionVehiculoFilter) {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccionesList(filters),
    queryFn: () => inspeccionesVehiculoApi.getAll(filters),
  });
}

export function useInspeccionVehiculo(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccion(id),
    queryFn: () => inspeccionesVehiculoApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenInspeccionesVehiculo() {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccionesResumen(),
    queryFn: inspeccionesVehiculoApi.resumen,
  });
}

export function useInspeccionesRechazadas() {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccionesRechazadas(),
    queryFn: inspeccionesVehiculoApi.rechazadas,
  });
}

export function useInspeccionesPorPlaca(placa: string) {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccionesPorPlaca(placa),
    queryFn: () => inspeccionesVehiculoApi.porPlaca(placa),
    enabled: !!placa,
  });
}

export function useUltimaInspeccion(placa: string) {
  return useQuery({
    queryKey: [...riesgosVialesKeys.inspeccionesPorPlaca(placa), 'ultima'],
    queryFn: () => inspeccionesVehiculoApi.ultimaInspeccion(placa),
    enabled: !!placa,
  });
}

export function usePuedeOperar(placa: string) {
  return useQuery({
    queryKey: [...riesgosVialesKeys.inspecciones(), 'puede-operar', placa],
    queryFn: () => inspeccionesVehiculoApi.puedeOperar(placa),
    enabled: !!placa,
  });
}

export function useCreateInspeccionVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InspeccionVehiculoCreate) => inspeccionesVehiculoApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspecciones() });
      queryClient.invalidateQueries({
        queryKey: riesgosVialesKeys.inspeccionesPorPlaca(data.placa),
      });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

export function useUpdateInspeccionVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InspeccionVehiculoUpdate }) =>
      inspeccionesVehiculoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspeccion(id) });
    },
  });
}

export function useDeleteInspeccionVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inspeccionesVehiculoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.estadisticas() });
    },
  });
}

// ============================================
// HOOKS PARA ESTADISTICAS PESV
// ============================================

export function useEstadisticasPESV() {
  return useQuery({
    queryKey: riesgosVialesKeys.estadisticas(),
    queryFn: estadisticasPESVApi.getGeneral,
  });
}

export function useIndicadoresPESV(periodo?: { fecha_inicio: string; fecha_fin: string }) {
  return useQuery({
    queryKey: riesgosVialesKeys.estadisticasIndicadores(periodo),
    queryFn: () => estadisticasPESVApi.getIndicadores(periodo),
  });
}

export function useTendenciasPESV(meses: number = 12) {
  return useQuery({
    queryKey: riesgosVialesKeys.estadisticasTendencias(meses),
    queryFn: () => estadisticasPESVApi.getTendencias(meses),
  });
}

export function useDashboardPilares() {
  return useQuery({
    queryKey: riesgosVialesKeys.dashboardPilares(),
    queryFn: estadisticasPESVApi.getDashboardPilares,
  });
}
