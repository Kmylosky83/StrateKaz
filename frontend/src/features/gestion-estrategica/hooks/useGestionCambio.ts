/**
 * React Query Hooks para Gestión del Cambio
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { gestionCambioApi } from '../api/gestionCambioApi';
import type {
  CreateGestionCambioDTO,
  UpdateGestionCambioDTO,
  TransitionStatusDTO,
  GestionCambioFilters,
} from '../types/gestion-cambio.types';

// ==================== QUERY KEYS ====================

export const gestionCambioKeys = {
  all: ['gestion-cambio'] as const,
  lists: () => [...gestionCambioKeys.all, 'list'] as const,
  list: (filters?: GestionCambioFilters) => [...gestionCambioKeys.lists(), filters] as const,
  details: () => [...gestionCambioKeys.all, 'detail'] as const,
  detail: (id: number) => [...gestionCambioKeys.details(), id] as const,
  stats: () => [...gestionCambioKeys.all, 'stats'] as const,
  changeTypes: () => [...gestionCambioKeys.all, 'change-types'] as const,
  priorities: () => [...gestionCambioKeys.all, 'priorities'] as const,
  statuses: () => [...gestionCambioKeys.all, 'statuses'] as const,
};

// ==================== HOOKS ====================

/**
 * Hook para obtener lista de cambios con filtros
 */
export const useGestionCambios = (filters?: GestionCambioFilters) => {
  return useQuery({
    queryKey: gestionCambioKeys.list(filters),
    queryFn: () => gestionCambioApi.getAll(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
};

/**
 * Hook para obtener detalle de un cambio
 */
export const useCambioDetail = (id: number) => {
  return useQuery({
    queryKey: gestionCambioKeys.detail(id),
    queryFn: () => gestionCambioApi.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para obtener estadísticas de gestión del cambio
 */
export const useGestionCambioStats = () => {
  return useQuery({
    queryKey: gestionCambioKeys.stats(),
    queryFn: gestionCambioApi.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener tipos de cambio
 */
export const useChangeTypes = () => {
  return useQuery({
    queryKey: gestionCambioKeys.changeTypes(),
    queryFn: gestionCambioApi.getChangeTypes,
    staleTime: Infinity, // No cambian
  });
};

/**
 * Hook para obtener prioridades
 */
export const useChangePriorities = () => {
  return useQuery({
    queryKey: gestionCambioKeys.priorities(),
    queryFn: gestionCambioApi.getPriorities,
    staleTime: Infinity, // No cambian
  });
};

/**
 * Hook para obtener estados
 */
export const useChangeStatuses = () => {
  return useQuery({
    queryKey: gestionCambioKeys.statuses(),
    queryFn: gestionCambioApi.getStatuses,
    staleTime: Infinity, // No cambian
  });
};

/**
 * Hook para crear un nuevo cambio
 */
export const useCreateCambio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGestionCambioDTO) => gestionCambioApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.stats() });
      toast.success('Cambio creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el cambio');
    },
  });
};

/**
 * Hook para actualizar un cambio existente
 */
export const useUpdateCambio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGestionCambioDTO }) =>
      gestionCambioApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.stats() });
      toast.success('Cambio actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el cambio');
    },
  });
};

/**
 * Hook para eliminar un cambio
 */
export const useDeleteCambio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => gestionCambioApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.stats() });
      toast.success('Cambio eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el cambio');
    },
  });
};

/**
 * Hook para transicionar el estado de un cambio
 */
export const useTransitionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransitionStatusDTO }) =>
      gestionCambioApi.transitionStatus(id, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gestionCambioKeys.stats() });
      toast.success(result.message || 'Estado actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el estado');
    },
  });
};
