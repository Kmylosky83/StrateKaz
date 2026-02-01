/**
 * React Query Hooks para Aspectos Ambientales - ISO 14001
 * Sistema de Gestion Ambiental
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoriasAspectoApi,
  aspectosAmbientalesApi,
  impactosAmbientalesApi,
  programasAmbientalesApi,
  monitoreosAmbientalesApi,
} from '../api/aspectosAmbientalesApi';
import type {
  CategoriaAspectoCreate,
  CategoriaAspectoUpdate,
  AspectoAmbientalCreate,
  AspectoAmbientalUpdate,
  AspectoAmbientalFilter,
  ImpactoAmbientalCreate,
  ImpactoAmbientalUpdate,
  ImpactoAmbientalFilter,
  ProgramaAmbientalCreate,
  ProgramaAmbientalUpdate,
  ProgramaAmbientalFilter,
  MonitoreoAmbientalCreate,
  MonitoreoAmbientalUpdate,
  MonitoreoAmbientalFilter,
} from '../types/aspectos-ambientales.types';

// ============================================
// QUERY KEYS
// ============================================

export const aspectosAmbientalesKeys = {
  all: ['aspectos-ambientales'] as const,

  // Categorias
  categorias: () => [...aspectosAmbientalesKeys.all, 'categorias'] as const,
  categoria: (id: number) => [...aspectosAmbientalesKeys.categorias(), id] as const,

  // Aspectos
  aspectos: () => [...aspectosAmbientalesKeys.all, 'aspectos'] as const,
  aspectosList: (filters?: AspectoAmbientalFilter) =>
    [...aspectosAmbientalesKeys.aspectos(), 'list', filters] as const,
  aspecto: (id: number) => [...aspectosAmbientalesKeys.aspectos(), id] as const,
  aspectosResumen: () => [...aspectosAmbientalesKeys.aspectos(), 'resumen'] as const,
  aspectosSignificativos: () => [...aspectosAmbientalesKeys.aspectos(), 'significativos'] as const,
  aspectosCriticos: () => [...aspectosAmbientalesKeys.aspectos(), 'criticos'] as const,
  aspectosIncumplimiento: () => [...aspectosAmbientalesKeys.aspectos(), 'incumplimiento'] as const,

  // Impactos
  impactos: () => [...aspectosAmbientalesKeys.all, 'impactos'] as const,
  impactosList: (filters?: ImpactoAmbientalFilter) =>
    [...aspectosAmbientalesKeys.impactos(), 'list', filters] as const,
  impacto: (id: number) => [...aspectosAmbientalesKeys.impactos(), id] as const,
  impactosPorAspecto: (aspectoId: number) =>
    [...aspectosAmbientalesKeys.impactos(), 'aspecto', aspectoId] as const,
  impactosPorComponente: () => [...aspectosAmbientalesKeys.impactos(), 'por-componente'] as const,

  // Programas
  programas: () => [...aspectosAmbientalesKeys.all, 'programas'] as const,
  programasList: (filters?: ProgramaAmbientalFilter) =>
    [...aspectosAmbientalesKeys.programas(), 'list', filters] as const,
  programa: (id: number) => [...aspectosAmbientalesKeys.programas(), id] as const,
  programasResumen: () => [...aspectosAmbientalesKeys.programas(), 'resumen'] as const,
  programasActivos: () => [...aspectosAmbientalesKeys.programas(), 'activos'] as const,
  programasVencidos: () => [...aspectosAmbientalesKeys.programas(), 'vencidos'] as const,

  // Monitoreos
  monitoreos: () => [...aspectosAmbientalesKeys.all, 'monitoreos'] as const,
  monitoreosList: (filters?: MonitoreoAmbientalFilter) =>
    [...aspectosAmbientalesKeys.monitoreos(), 'list', filters] as const,
  monitoreo: (id: number) => [...aspectosAmbientalesKeys.monitoreos(), id] as const,
  monitoreosResumen: () => [...aspectosAmbientalesKeys.monitoreos(), 'resumen'] as const,
  monitoreosIncumplimientos: () => [...aspectosAmbientalesKeys.monitoreos(), 'incumplimientos'] as const,
  monitoreosPorAspecto: (aspectoId: number) =>
    [...aspectosAmbientalesKeys.monitoreos(), 'aspecto', aspectoId] as const,
  monitoreosPorPrograma: (programaId: number) =>
    [...aspectosAmbientalesKeys.monitoreos(), 'programa', programaId] as const,
};

// ============================================
// HOOKS PARA CATEGORIAS
// ============================================

export function useCategoriasAspecto() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.categorias(),
    queryFn: categoriasAspectoApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutos (es catalogo)
  });
}

export function useCategoriaAspecto(id: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.categoria(id),
    queryFn: () => categoriasAspectoApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategoriaAspecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoriaAspectoCreate) => categoriasAspectoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.categorias() });
    },
  });
}

export function useUpdateCategoriaAspecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaAspectoUpdate }) =>
      categoriasAspectoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.categorias() });
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.categoria(id) });
    },
  });
}

export function useDeleteCategoriaAspecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoriasAspectoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.categorias() });
    },
  });
}

// ============================================
// HOOKS PARA ASPECTOS AMBIENTALES
// ============================================

export function useAspectosAmbientales(filters?: AspectoAmbientalFilter) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspectosList(filters),
    queryFn: () => aspectosAmbientalesApi.getAll(filters),
  });
}

export function useAspectoAmbiental(id: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspecto(id),
    queryFn: () => aspectosAmbientalesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenAspectos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspectosResumen(),
    queryFn: aspectosAmbientalesApi.resumen,
  });
}

export function useAspectosSignificativos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspectosSignificativos(),
    queryFn: aspectosAmbientalesApi.significativos,
  });
}

export function useAspectosCriticos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspectosCriticos(),
    queryFn: aspectosAmbientalesApi.criticos,
  });
}

export function useAspectosIncumplimientoLegal() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.aspectosIncumplimiento(),
    queryFn: aspectosAmbientalesApi.incumplimientoLegal,
  });
}

export function useCreateAspectoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AspectoAmbientalCreate) => aspectosAmbientalesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.aspectos() });
    },
  });
}

export function useUpdateAspectoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AspectoAmbientalUpdate }) =>
      aspectosAmbientalesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.aspectos() });
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.aspecto(id) });
    },
  });
}

export function useDeleteAspectoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => aspectosAmbientalesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.aspectos() });
    },
  });
}

// ============================================
// HOOKS PARA IMPACTOS AMBIENTALES
// ============================================

export function useImpactosAmbientales(filters?: ImpactoAmbientalFilter) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.impactosList(filters),
    queryFn: () => impactosAmbientalesApi.getAll(filters),
  });
}

export function useImpactoAmbiental(id: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.impacto(id),
    queryFn: () => impactosAmbientalesApi.getById(id),
    enabled: !!id,
  });
}

export function useImpactosPorAspecto(aspectoId: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.impactosPorAspecto(aspectoId),
    queryFn: () => impactosAmbientalesApi.getByAspecto(aspectoId),
    enabled: !!aspectoId,
  });
}

export function useImpactosPorComponente() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.impactosPorComponente(),
    queryFn: impactosAmbientalesApi.porComponente,
  });
}

export function useCreateImpactoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImpactoAmbientalCreate) => impactosAmbientalesApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.impactos() });
      queryClient.invalidateQueries({
        queryKey: aspectosAmbientalesKeys.impactosPorAspecto(data.aspecto_id),
      });
    },
  });
}

export function useUpdateImpactoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ImpactoAmbientalUpdate }) =>
      impactosAmbientalesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.impactos() });
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.impacto(id) });
    },
  });
}

export function useDeleteImpactoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => impactosAmbientalesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.impactos() });
    },
  });
}

// ============================================
// HOOKS PARA PROGRAMAS AMBIENTALES
// ============================================

export function useProgramasAmbientales(filters?: ProgramaAmbientalFilter) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.programasList(filters),
    queryFn: () => programasAmbientalesApi.getAll(filters),
  });
}

export function useProgramaAmbiental(id: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.programa(id),
    queryFn: () => programasAmbientalesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenProgramas() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.programasResumen(),
    queryFn: programasAmbientalesApi.resumen,
  });
}

export function useProgramasActivos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.programasActivos(),
    queryFn: programasAmbientalesApi.activos,
  });
}

export function useProgramasVencidos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.programasVencidos(),
    queryFn: programasAmbientalesApi.vencidos,
  });
}

export function useCreateProgramaAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProgramaAmbientalCreate) => programasAmbientalesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.programas() });
    },
  });
}

export function useUpdateProgramaAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProgramaAmbientalUpdate }) =>
      programasAmbientalesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.programas() });
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.programa(id) });
    },
  });
}

export function useDeleteProgramaAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => programasAmbientalesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.programas() });
    },
  });
}

// ============================================
// HOOKS PARA MONITOREOS AMBIENTALES
// ============================================

export function useMonitoreosAmbientales(filters?: MonitoreoAmbientalFilter) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreosList(filters),
    queryFn: () => monitoreosAmbientalesApi.getAll(filters),
  });
}

export function useMonitoreoAmbiental(id: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreo(id),
    queryFn: () => monitoreosAmbientalesApi.getById(id),
    enabled: !!id,
  });
}

export function useResumenMonitoreos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreosResumen(),
    queryFn: monitoreosAmbientalesApi.resumen,
  });
}

export function useMonitoreosIncumplimientos() {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreosIncumplimientos(),
    queryFn: monitoreosAmbientalesApi.incumplimientos,
  });
}

export function useMonitoreosPorAspecto(aspectoId: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreosPorAspecto(aspectoId),
    queryFn: () => monitoreosAmbientalesApi.getByAspecto(aspectoId),
    enabled: !!aspectoId,
  });
}

export function useMonitoreosPorPrograma(programaId: number) {
  return useQuery({
    queryKey: aspectosAmbientalesKeys.monitoreosPorPrograma(programaId),
    queryFn: () => monitoreosAmbientalesApi.getByPrograma(programaId),
    enabled: !!programaId,
  });
}

export function useMonitoreosPorRangoFechas(fechaInicio: string, fechaFin: string) {
  return useQuery({
    queryKey: [...aspectosAmbientalesKeys.monitoreos(), 'rango', fechaInicio, fechaFin],
    queryFn: () => monitoreosAmbientalesApi.porRangoFechas(fechaInicio, fechaFin),
    enabled: !!fechaInicio && !!fechaFin,
  });
}

export function useCreateMonitoreoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MonitoreoAmbientalCreate) => monitoreosAmbientalesApi.create(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.monitoreos() });
      if (data.aspecto_relacionado_id) {
        queryClient.invalidateQueries({
          queryKey: aspectosAmbientalesKeys.monitoreosPorAspecto(data.aspecto_relacionado_id),
        });
      }
      if (data.programa_relacionado_id) {
        queryClient.invalidateQueries({
          queryKey: aspectosAmbientalesKeys.monitoreosPorPrograma(data.programa_relacionado_id),
        });
      }
    },
  });
}

export function useUpdateMonitoreoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonitoreoAmbientalUpdate }) =>
      monitoreosAmbientalesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.monitoreos() });
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.monitoreo(id) });
    },
  });
}

export function useDeleteMonitoreoAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => monitoreosAmbientalesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aspectosAmbientalesKeys.monitoreos() });
    },
  });
}
