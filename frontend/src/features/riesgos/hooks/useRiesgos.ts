/**
 * Hooks React Query para Riesgos de Procesos
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riesgosApi, controlesRiesgoApi, tratamientosApi, oportunidadesApi } from '../api/riesgosApi';
import type {
  RiesgoProceso,
  ControlRiesgo,
  TratamientoRiesgo,
  Oportunidad,
  CreateRiesgoProcesoDTO,
  UpdateRiesgoProcesoDTO,
  CreateControlRiesgoDTO,
  UpdateControlRiesgoDTO,
  CreateTratamientoRiesgoDTO,
  UpdateTratamientoRiesgoDTO,
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  RiesgoProcesoFilters,
  OportunidadFilters,
} from '../types';

// ==================== QUERY KEYS ====================

export const riesgosKeys = {
  all: ['riesgos'] as const,
  lists: () => [...riesgosKeys.all, 'list'] as const,
  list: (filters?: RiesgoProcesoFilters) => [...riesgosKeys.lists(), filters] as const,
  details: () => [...riesgosKeys.all, 'detail'] as const,
  detail: (id: number) => [...riesgosKeys.details(), id] as const,
  resumen: (empresaId?: number) => [...riesgosKeys.all, 'resumen', empresaId] as const,
  criticos: (empresaId?: number) => [...riesgosKeys.all, 'criticos', empresaId] as const,
  mapaCalor: (empresaId?: number) => [...riesgosKeys.all, 'mapa-calor', empresaId] as const,
};

export const controlesKeys = {
  all: ['controles-riesgo'] as const,
  lists: () => [...controlesKeys.all, 'list'] as const,
  list: (riesgoId?: number) => [...controlesKeys.lists(), riesgoId] as const,
  details: () => [...controlesKeys.all, 'detail'] as const,
  detail: (id: number) => [...controlesKeys.details(), id] as const,
};

export const tratamientosKeys = {
  all: ['tratamientos'] as const,
  lists: () => [...tratamientosKeys.all, 'list'] as const,
  list: (riesgoId?: number) => [...tratamientosKeys.lists(), riesgoId] as const,
  details: () => [...tratamientosKeys.all, 'detail'] as const,
  detail: (id: number) => [...tratamientosKeys.details(), id] as const,
};

export const oportunidadesKeys = {
  all: ['oportunidades'] as const,
  lists: () => [...oportunidadesKeys.all, 'list'] as const,
  list: (filters?: OportunidadFilters) => [...oportunidadesKeys.lists(), filters] as const,
  details: () => [...oportunidadesKeys.all, 'detail'] as const,
  detail: (id: number) => [...oportunidadesKeys.details(), id] as const,
};

// ==================== RIESGOS HOOKS ====================

export function useRiesgos(filters?: RiesgoProcesoFilters) {
  return useQuery({
    queryKey: riesgosKeys.list(filters),
    queryFn: () => riesgosApi.getAll(filters),
  });
}

export function useRiesgo(id: number) {
  return useQuery({
    queryKey: riesgosKeys.detail(id),
    queryFn: () => riesgosApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenRiesgos(empresaId?: number) {
  return useQuery({
    queryKey: riesgosKeys.resumen(empresaId),
    queryFn: () => riesgosApi.getResumen(empresaId),
  });
}

export function useRiesgosCriticos(empresaId?: number) {
  return useQuery({
    queryKey: riesgosKeys.criticos(empresaId),
    queryFn: () => riesgosApi.getCriticos(empresaId),
  });
}

export function useMapaCalorRiesgos(empresaId?: number) {
  return useQuery({
    queryKey: riesgosKeys.mapaCalor(empresaId),
    queryFn: () => riesgosApi.getMapaCalor(empresaId),
  });
}

export function useCreateRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRiesgoProcesoDTO) => riesgosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosKeys.all });
    },
  });
}

export function useUpdateRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRiesgoProcesoDTO }) =>
      riesgosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosKeys.all });
      queryClient.invalidateQueries({ queryKey: riesgosKeys.detail(id) });
    },
  });
}

export function useDeleteRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => riesgosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riesgosKeys.all });
    },
  });
}

export function useCambiarEstadoRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      riesgosApi.cambiarEstado(id, estado),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: riesgosKeys.all });
      queryClient.invalidateQueries({ queryKey: riesgosKeys.detail(id) });
    },
  });
}

// ==================== CONTROLES HOOKS ====================

export function useControlesRiesgo(riesgoId?: number) {
  return useQuery({
    queryKey: controlesKeys.list(riesgoId),
    queryFn: () => controlesRiesgoApi.getAll(riesgoId),
    enabled: riesgoId !== undefined,
  });
}

export function useCreateControlRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateControlRiesgoDTO) => controlesRiesgoApi.create(data),
    onSuccess: (_, { riesgo }) => {
      queryClient.invalidateQueries({ queryKey: controlesKeys.list(riesgo) });
    },
  });
}

export function useUpdateControlRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateControlRiesgoDTO }) =>
      controlesRiesgoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlesKeys.all });
    },
  });
}

export function useDeleteControlRiesgo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => controlesRiesgoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlesKeys.all });
    },
  });
}

// ==================== TRATAMIENTOS HOOKS ====================

export function useTratamientos(riesgoId?: number) {
  return useQuery({
    queryKey: tratamientosKeys.list(riesgoId),
    queryFn: () => tratamientosApi.getAll(riesgoId),
    enabled: riesgoId !== undefined,
  });
}

export function useCreateTratamiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTratamientoRiesgoDTO) => tratamientosApi.create(data),
    onSuccess: (_, { riesgo }) => {
      queryClient.invalidateQueries({ queryKey: tratamientosKeys.list(riesgo) });
    },
  });
}

export function useUpdateTratamiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTratamientoRiesgoDTO }) =>
      tratamientosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tratamientosKeys.all });
    },
  });
}

export function useDeleteTratamiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tratamientosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tratamientosKeys.all });
    },
  });
}

export function useActualizarAvanceTratamiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, porcentaje }: { id: number; porcentaje: number }) =>
      tratamientosApi.actualizarAvance(id, porcentaje),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tratamientosKeys.all });
    },
  });
}

// ==================== OPORTUNIDADES HOOKS ====================

export function useOportunidades(filters?: OportunidadFilters) {
  return useQuery({
    queryKey: oportunidadesKeys.list(filters),
    queryFn: () => oportunidadesApi.getAll(filters),
  });
}

export function useOportunidad(id: number) {
  return useQuery({
    queryKey: oportunidadesKeys.detail(id),
    queryFn: () => oportunidadesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateOportunidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOportunidadDTO) => oportunidadesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.all });
    },
  });
}

export function useUpdateOportunidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOportunidadDTO }) =>
      oportunidadesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.all });
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.detail(id) });
    },
  });
}

export function useDeleteOportunidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => oportunidadesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.all });
    },
  });
}

export function useCambiarEstadoOportunidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      oportunidadesApi.cambiarEstado(id, estado),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.all });
      queryClient.invalidateQueries({ queryKey: oportunidadesKeys.detail(id) });
    },
  });
}
