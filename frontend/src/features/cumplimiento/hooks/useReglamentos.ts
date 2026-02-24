/**
 * React Query Hooks para Reglamentos Internos
 * Sistema de Gestión StrateKaz
 *
 * Usa useGenericCRUD como base para operaciones CRUD estándar
 */
import { useGenericCRUD } from '@/hooks/useGenericCRUD';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tiposReglamentoApi, reglamentosApi } from '../api';
import type {
  TipoReglamento,
  Reglamento,
  ReglamentoFilters,
  CreateReglamentoDTO,
  UpdateReglamentoDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const reglamentosKeys = {
  // Tipos de Reglamento
  tipos: ['tipos-reglamento'] as const,
  tipo: (id: number) => ['tipo-reglamento', id] as const,

  // Reglamentos
  reglamentos: (filters?: ReglamentoFilters) => ['reglamentos', filters] as const,
  reglamento: (id: number) => ['reglamento', id] as const,
};

// ==================== TIPOS DE REGLAMENTO HOOKS ====================

export const useTiposReglamento = () => {
  return useGenericCRUD<TipoReglamento>({
    queryKey: reglamentosKeys.tipos,
    endpoint: '/cumplimiento/reglamentos-internos/tipos/',
    entityName: 'Tipo de Reglamento',
    isPaginated: true,
  });
};

export const useReorderTiposReglamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: { id: number; orden: number }[]) => tiposReglamentoApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.tipos });
      toast.success('Orden actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el orden');
    },
  });
};

// ==================== REGLAMENTOS HOOKS ====================

export const useReglamentos = (filters?: ReglamentoFilters) => {
  return useGenericCRUD<Reglamento>({
    queryKey: reglamentosKeys.reglamentos(filters),
    endpoint: `/cumplimiento/reglamentos-internos/reglamentos/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Reglamento',
    isPaginated: true,
  });
};

// Hook especializado para crear/actualizar con archivos
export const useCreateReglamentoWithFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReglamentoDTO) => reglamentosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      toast.success('Reglamento creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el reglamento');
    },
  });
};

export const useUpdateReglamentoWithFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReglamentoDTO }) =>
      reglamentosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamento(id) });
      toast.success('Reglamento actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el reglamento');
    },
  });
};

export const useAprobarReglamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, aprobado_por }: { id: number; aprobado_por: number }) =>
      reglamentosApi.aprobar(id, aprobado_por),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamento(id) });
      toast.success('Reglamento aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el reglamento');
    },
  });
};

export const usePublicarReglamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reglamentosApi.publicar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamento(id) });
      toast.success('Reglamento publicado exitosamente');
    },
    onError: () => {
      toast.error('Error al publicar el reglamento');
    },
  });
};

export const useMarcarObsoleto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      reglamentosApi.marcarObsoleto(id, observaciones),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamento(id) });
      toast.success('Reglamento marcado como obsoleto');
    },
    onError: () => {
      toast.error('Error al marcar el reglamento como obsoleto');
    },
  });
};

export const useReorderReglamentos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      empresaId,
      items,
    }: {
      empresaId: number;
      items: { id: number; orden: number }[];
    }) => reglamentosApi.reorder(empresaId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reglamentosKeys.reglamentos() });
      toast.success('Orden actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el orden');
    },
  });
};
