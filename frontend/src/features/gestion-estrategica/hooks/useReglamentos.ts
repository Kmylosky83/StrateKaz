/**
 * Custom Hooks para Reglamentos Internos - Motor de Cumplimiento
 * Sistema de Gestion StrateKaz
 *
 * Hooks basados en TanStack Query (React Query) para gestion de estado del servidor.
 * Usa createCrudHooks para CRUD basico + hooks custom para vigentes y estadisticas.
 */
import { useQuery } from '@tanstack/react-query';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import {
  tiposReglamentoApi,
  reglamentosApi,
  versionesReglamentoApi,
  publicacionesReglamentoApi,
  socializacionesReglamentoApi,
} from '../api/reglamentosApi';
import type {
  TipoReglamento,
  Reglamento,
  CreateReglamentoDTO,
  UpdateReglamentoDTO,
  VersionReglamento,
  PublicacionReglamento,
  SocializacionReglamento,
  ReglamentosEstadisticas,
} from '../types/reglamentos.types';

// ==================== QUERY KEYS ====================

const reglamentosKeys = createQueryKeys('reglamentos');
const tiposReglamentoKeys = createQueryKeys('tipos-reglamento');
const versionesKeys = createQueryKeys('versiones-reglamento');
const publicacionesKeys = createQueryKeys('publicaciones-reglamento');
const socializacionesKeys = createQueryKeys('socializaciones-reglamento');

// ==================== TIPOS DE REGLAMENTO ====================

const tiposHooks = createCrudHooks<TipoReglamento>(
  tiposReglamentoApi,
  tiposReglamentoKeys,
  'Tipo de reglamento'
);

export const useTiposReglamento = tiposHooks.useList;

// ==================== REGLAMENTOS (CRUD) ====================

const reglamentosHooks = createCrudHooks<Reglamento, CreateReglamentoDTO, UpdateReglamentoDTO>(
  reglamentosApi,
  reglamentosKeys,
  'Reglamento'
);

export const useReglamentos = reglamentosHooks.useList;
export const useReglamento = reglamentosHooks.useDetail;
export const useCreateReglamento = reglamentosHooks.useCreate;
export const useUpdateReglamento = reglamentosHooks.useUpdate;
export const useDeleteReglamento = reglamentosHooks.useDelete;

// ==================== REGLAMENTOS (CUSTOM) ====================

/**
 * Hook para obtener solo reglamentos vigentes
 */
export function useReglamentosVigentes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: reglamentosKeys.custom('vigentes', params),
    queryFn: async () => {
      const response = await reglamentosApi.getVigentes(params);
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadisticas de reglamentos por estado
 */
export function useReglamentosEstadisticas() {
  return useQuery<ReglamentosEstadisticas>({
    queryKey: reglamentosKeys.custom('estadisticas'),
    queryFn: () => reglamentosApi.getEstadisticas(),
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== VERSIONES ====================

const versionesHooks = createCrudHooks<VersionReglamento>(
  versionesReglamentoApi,
  versionesKeys,
  'Version de reglamento',
  { isFeminine: true }
);

export const useVersionesReglamento = versionesHooks.useList;
export const useCreateVersionReglamento = versionesHooks.useCreate;

// ==================== PUBLICACIONES ====================

const publicacionesHooks = createCrudHooks<PublicacionReglamento>(
  publicacionesReglamentoApi,
  publicacionesKeys,
  'Publicacion de reglamento',
  { isFeminine: true }
);

export const usePublicacionesReglamento = publicacionesHooks.useList;
export const useCreatePublicacionReglamento = publicacionesHooks.useCreate;

// ==================== SOCIALIZACIONES ====================

const socializacionesHooks = createCrudHooks<SocializacionReglamento>(
  socializacionesReglamentoApi,
  socializacionesKeys,
  'Socializacion de reglamento',
  { isFeminine: true }
);

export const useSocializacionesReglamento = socializacionesHooks.useList;
export const useCreateSocializacionReglamento = socializacionesHooks.useCreate;
