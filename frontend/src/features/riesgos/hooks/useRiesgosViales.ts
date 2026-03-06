/**
 * React Query Hooks para Riesgos Viales - PESV
 * Plan Estratégico de Seguridad Vial - Resolución 40595/2022
 *
 * Mapea 1:1 con los endpoints del backend:
 *   factores/      -> FactorRiesgoVialViewSet
 *   riesgos/       -> RiesgoVialViewSet
 *   controles/     -> ControlVialViewSet
 *   incidentes/    -> IncidenteVialViewSet
 *   inspecciones/  -> InspeccionVehiculoViewSet
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  factoresRiesgoVialApi,
  riesgosVialesApi,
  controlesVialesApi,
  incidentesVialesApi,
  inspeccionesVehiculoApi,
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
  InspeccionVehiculoFilter,
  CategoriaFactor,
} from '../types/riesgos-viales.types';

// ============================================
// QUERY KEYS
// ============================================

export const riesgosVialesKeys = {
  all: ['riesgos-viales'] as const,

  // Factores/Tipos de riesgo
  factores: () => [...riesgosVialesKeys.all, 'factores'] as const,
  factoresList: (params?: { categoria?: CategoriaFactor; search?: string }) =>
    [...riesgosVialesKeys.factores(), 'list', params] as const,
  factor: (id: number) => [...riesgosVialesKeys.factores(), id] as const,
  factoresPorCategoria: () => [...riesgosVialesKeys.factores(), 'por-categoria'] as const,

  // Riesgos
  riesgos: () => [...riesgosVialesKeys.all, 'riesgos'] as const,
  riesgosList: (filters?: RiesgoVialFilter) =>
    [...riesgosVialesKeys.riesgos(), 'list', filters] as const,
  riesgo: (id: number) => [...riesgosVialesKeys.riesgos(), id] as const,
  riesgosEstadisticas: () => [...riesgosVialesKeys.riesgos(), 'estadisticas'] as const,
  riesgosCriticos: () => [...riesgosVialesKeys.riesgos(), 'criticos'] as const,

  // Controles
  controles: () => [...riesgosVialesKeys.all, 'controles'] as const,
  controlesList: (filters?: ControlVialFilter) =>
    [...riesgosVialesKeys.controles(), 'list', filters] as const,
  control: (id: number) => [...riesgosVialesKeys.controles(), id] as const,
  controlesAtrasados: () => [...riesgosVialesKeys.controles(), 'atrasados'] as const,
  controlesPorRiesgo: (riesgoId: number) =>
    [...riesgosVialesKeys.controles(), 'por-riesgo', riesgoId] as const,

  // Incidentes
  incidentes: () => [...riesgosVialesKeys.all, 'incidentes'] as const,
  incidentesList: (filters?: IncidenteVialFilter) =>
    [...riesgosVialesKeys.incidentes(), 'list', filters] as const,
  incidente: (id: number) => [...riesgosVialesKeys.incidentes(), id] as const,
  incidentesEstadisticas: () => [...riesgosVialesKeys.incidentes(), 'estadisticas'] as const,
  incidentesGraves: () => [...riesgosVialesKeys.incidentes(), 'graves'] as const,

  // Inspecciones
  inspecciones: () => [...riesgosVialesKeys.all, 'inspecciones'] as const,
  inspeccionesList: (filters?: InspeccionVehiculoFilter) =>
    [...riesgosVialesKeys.inspecciones(), 'list', filters] as const,
  inspeccion: (id: number) => [...riesgosVialesKeys.inspecciones(), id] as const,
  inspeccionesPorVehiculo: (placa: string) =>
    [...riesgosVialesKeys.inspecciones(), 'por-vehiculo', placa] as const,
};

// ============================================
// HOOKS PARA FACTORES DE RIESGO VIAL (Catálogo)
// ============================================

export function useFactoresRiesgoVial(params?: { categoria?: CategoriaFactor; search?: string }) {
  return useQuery({
    queryKey: riesgosVialesKeys.factoresList(params),
    queryFn: () => factoresRiesgoVialApi.getAll(params),
    staleTime: 10 * 60 * 1000, // 10 minutos (es catálogo)
  });
}

export function useFactorRiesgoVial(id: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.factor(id),
    queryFn: () => factoresRiesgoVialApi.getById(id),
    enabled: !!id,
  });
}

export function useFactoresPorCategoria() {
  return useQuery({
    queryKey: riesgosVialesKeys.factoresPorCategoria(),
    queryFn: () => factoresRiesgoVialApi.porCategoria(),
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

export function useEstadisticasRiesgosViales() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosEstadisticas(),
    queryFn: riesgosVialesApi.estadisticas,
  });
}

export function useRiesgosCriticos() {
  return useQuery({
    queryKey: riesgosVialesKeys.riesgosCriticos(),
    queryFn: riesgosVialesApi.criticos,
  });
}

export function useCreateRiesgoVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RiesgoVialCreate) => riesgosVialesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.riesgos() });
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

export function useControlesAtrasados() {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesAtrasados(),
    queryFn: () => controlesVialesApi.atrasados(),
  });
}

export function useControlesPorRiesgo(riesgoId: number) {
  return useQuery({
    queryKey: riesgosVialesKeys.controlesPorRiesgo(riesgoId),
    queryFn: () => controlesVialesApi.porRiesgo(riesgoId),
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
        queryKey: riesgosVialesKeys.controlesPorRiesgo(data.riesgo_vial),
      });
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

export function useEstadisticasIncidentesViales() {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesEstadisticas(),
    queryFn: incidentesVialesApi.estadisticas,
  });
}

export function useIncidentesGraves() {
  return useQuery({
    queryKey: riesgosVialesKeys.incidentesGraves(),
    queryFn: () => incidentesVialesApi.graves(),
  });
}

export function useCreateIncidenteVial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IncidenteVialCreate) => incidentesVialesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
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
    },
  });
}

/** POST incidentes/{id}/iniciar-investigacion/ */
export function useIniciarInvestigacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      investigadorId,
      fechaInicio,
    }: {
      id: number;
      investigadorId: number;
      fechaInicio?: string;
    }) => incidentesVialesApi.iniciarInvestigacion(id, investigadorId, fechaInicio),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidentes() });
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.incidente(id) });
    },
  });
}

// ============================================
// HOOKS PARA INSPECCIONES DE VEHÍCULOS
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

export function useInspeccionesPorVehiculo(placa: string) {
  return useQuery({
    queryKey: riesgosVialesKeys.inspeccionesPorVehiculo(placa),
    queryFn: () => inspeccionesVehiculoApi.porVehiculo(placa),
    enabled: !!placa,
  });
}

export function useCreateInspeccionVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InspeccionVehiculoCreate) => inspeccionesVehiculoApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspecciones() });
      if (data.vehiculo_placa) {
        queryClient.invalidateQueries({
          queryKey: riesgosVialesKeys.inspeccionesPorVehiculo(data.vehiculo_placa),
        });
      }
    },
  });
}

export function useDeleteInspeccionVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inspeccionesVehiculoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosVialesKeys.inspecciones() });
    },
  });
}
