/**
 * React Query Hooks para Estructura de Cargos - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks + createApiClient factories.
 * Types imported from types/estructuraCargos.types.ts (canonical source).
 *
 * @module useEstructuraCargos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { profesiogramaApi, vacanteECApi } from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  Profesiograma,
  ProfesiogramaFormData,
  MatrizCompetencia,
  RequisitoEspecial,
  Vacante,
  VacanteFormData,
  ProfesiogramaFilters,
  VacanteFilters,
} from '../types';

// Re-export types for backward compatibility
export type {
  Profesiograma,
  ProfesiogramaFormData,
  MatrizCompetencia,
  RequisitoEspecial,
  Vacante,
  VacanteFormData,
  ProfesiogramaFilters,
  VacanteFilters,
};

// Re-export VacanteEstadisticas (defined inline since not in types file yet)
export interface VacanteEstadisticas {
  total_vacantes: number;
  vacantes_abiertas: number;
  vacantes_en_proceso: number;
  vacantes_cerradas_mes: number;
  posiciones_totales: number;
  posiciones_cubiertas: number;
  posiciones_pendientes: number;
  tiempo_promedio_cierre: number;
  vacantes_vencidas: number;
  vacantes_por_prioridad: {
    prioridad: string;
    cantidad: number;
  }[];
  vacantes_por_area: {
    area: string;
    cantidad: number;
  }[];
}

// ============================================================================
// QUERY KEYS (backward compat re-exports)
// ============================================================================

export const profesiogramaKeys = {
  all: thKeys.profesiogramas.all,
  list: (filters?: ProfesiogramaFilters) =>
    thKeys.profesiogramas.list(filters as Record<string, unknown>),
  detail: (id: string) => thKeys.profesiogramas.detail(id),
  competencias: (id: string) => thKeys.profesiogramas.custom('competencias', id),
  requisitos: (id: string) => thKeys.profesiogramas.custom('requisitos', id),
  vacantes: (id: string) => thKeys.profesiogramas.custom('vacantes', id),
};

export const vacanteKeys = {
  all: thKeys.vacantesEC.all,
  list: (filters?: VacanteFilters) => thKeys.vacantesEC.list(filters as Record<string, unknown>),
  detail: (id: string) => thKeys.vacantesEC.detail(id),
  abiertas: () => thKeys.vacantesEC.custom('abiertas'),
  estadisticas: () => thKeys.vacantesEC.custom('estadisticas'),
};

// ============================================================================
// CRUD HOOKS - PROFESIOGRAMAS (via factory)
// ============================================================================

const profHooks = createCrudHooks<
  Profesiograma,
  ProfesiogramaFormData,
  Partial<ProfesiogramaFormData>
>(profesiogramaApi, thKeys.profesiogramas, 'Profesiograma');

/**
 * Hook para obtener lista de profesiogramas con filtros
 */
export function useProfesiogramas(filters?: ProfesiogramaFilters) {
  return profHooks.useList(filters as Record<string, unknown>, {
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener un profesiograma especifico
 */
export function useProfesiograma(id: string) {
  return profHooks.useDetail(id ? Number(id) || id : undefined);
}

/**
 * Hook para crear un nuevo profesiograma
 */
export const useCreateProfesiograma = profHooks.useCreate;

/**
 * Hook para actualizar un profesiograma existente
 */
export const useUpdateProfesiograma = profHooks.useUpdate;

// ============================================================================
// HOOKS - COMPETENCIAS (custom — nested under profesiograma)
// ============================================================================

/**
 * Hook para obtener competencias de un profesiograma
 */
export function useCompetencias(profesiogramaId: string) {
  return useQuery({
    queryKey: profesiogramaKeys.competencias(profesiogramaId),
    queryFn: async () => {
      const response = await apiClient.get(
        `/mi-equipo/estructura-cargos/profesiogramas/${profesiogramaId}/competencias/`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as MatrizCompetencia[];
    },
    enabled: !!profesiogramaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - REQUISITOS ESPECIALES (custom — nested under profesiograma)
// ============================================================================

/**
 * Hook para obtener requisitos especiales de un profesiograma
 */
export function useRequisitos(profesiogramaId: string) {
  return useQuery({
    queryKey: profesiogramaKeys.requisitos(profesiogramaId),
    queryFn: async () => {
      const response = await apiClient.get(
        `/mi-equipo/estructura-cargos/profesiogramas/${profesiogramaId}/requisitos-especiales/`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as RequisitoEspecial[];
    },
    enabled: !!profesiogramaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// CRUD HOOKS - VACANTES (via factory + custom hooks)
// ============================================================================

const vacanteHooks = createCrudHooks<Vacante, VacanteFormData, Partial<VacanteFormData>>(
  vacanteECApi,
  thKeys.vacantesEC,
  'Vacante',
  { isFeminine: true }
);

/**
 * Hook para obtener lista de vacantes con filtros
 */
export function useVacantes(filters?: VacanteFilters) {
  return vacanteHooks.useList(filters as Record<string, unknown>, {
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook para obtener solo vacantes abiertas
 */
export function useVacantesAbiertas() {
  return useQuery({
    queryKey: vacanteKeys.abiertas(),
    queryFn: async () => {
      const response = await apiClient.get('/mi-equipo/estructura-cargos/vacantes/?abierta=true');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Vacante[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadisticas de vacantes
 */
export function useVacanteEstadisticas() {
  return useQuery({
    queryKey: vacanteKeys.estadisticas(),
    queryFn: async () => {
      const response = await apiClient.get<VacanteEstadisticas>(
        '/mi-equipo/estructura-cargos/vacantes/estadisticas/'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear una nueva vacante
 */
export const useCreateVacante = vacanteHooks.useCreate;

/**
 * Hook para actualizar una vacante existente
 */
export const useUpdateVacante = vacanteHooks.useUpdate;

/**
 * Hook para cerrar una vacante
 */
export function useCerrarVacante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      return vacanteECApi.cerrar(id, motivo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.vacantesEC.lists() });
      queryClient.invalidateQueries({ queryKey: vacanteKeys.estadisticas() });
      toast.success('Vacante cerrada exitosamente');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Error al cerrar la vacante';
      toast.error(message);
    },
  });
}
