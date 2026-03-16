/**
 * Hooks React Query para Unidades de Negocio — Fundacion Tab 1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { unidadesNegocioApi } from '../api/unidadesNegocioApi';
import type { CreateUnidadNegocioDTO, UpdateUnidadNegocioDTO } from '../types/unidad-negocio.types';

export const unidadesNegocioKeys = {
  all: ['fundacion', 'unidades-negocio'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...unidadesNegocioKeys.all, 'list', filters] as const,
  detail: (id: number) => [...unidadesNegocioKeys.all, 'detail', id] as const,
};

export function useUnidadesNegocio(params?: { is_active?: boolean; search?: string }) {
  return useQuery({
    queryKey: unidadesNegocioKeys.list(params),
    queryFn: () => unidadesNegocioApi.getAll(params),
  });
}

export function useUnidadNegocio(id: number) {
  return useQuery({
    queryKey: unidadesNegocioKeys.detail(id),
    queryFn: () => unidadesNegocioApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnidadNegocioDTO) => unidadesNegocioApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesNegocioKeys.all });
      toast.success('Unidad de negocio creada exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al crear unidad de negocio');
    },
  });
}

export function useUpdateUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnidadNegocioDTO }) =>
      unidadesNegocioApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: unidadesNegocioKeys.all });
      queryClient.invalidateQueries({ queryKey: unidadesNegocioKeys.detail(id) });
      toast.success('Unidad de negocio actualizada exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al actualizar unidad de negocio');
    },
  });
}

export function useDeleteUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unidadesNegocioApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesNegocioKeys.all });
      toast.success('Unidad de negocio eliminada exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al eliminar unidad de negocio');
    },
  });
}
