/**
 * React Query Hooks para Normas ISO
 *
 * Hooks específicos para gestión de normas ISO del sistema.
 * Incluye operaciones CRUD completas con validación y toasts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { normasISOApi } from '../api/strategicApi';
import type { CreateNormaISODTO, UpdateNormaISODTO } from '../api/strategicApi';

// Query Keys
export const normasISOKeys = {
  all: ['normas_iso'] as const,
  lists: () => [...normasISOKeys.all, 'list'] as const,
  list: () => [...normasISOKeys.lists()] as const,
  details: () => [...normasISOKeys.all, 'detail'] as const,
  detail: (id: number) => [...normasISOKeys.details(), id] as const,
  choices: () => [...normasISOKeys.all, 'choices'] as const,
  byCategory: () => [...normasISOKeys.all, 'by-category'] as const,
};

/**
 * Hook para obtener todas las normas ISO
 */
export const useNormasISO = () => {
  return useQuery({
    queryKey: normasISOKeys.list(),
    queryFn: normasISOApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutos - datos relativamente estáticos
    gcTime: 15 * 60 * 1000, // 15 minutos cache
  });
};

/**
 * Hook para obtener una norma ISO por ID
 */
export const useNormaISO = (id: number) => {
  return useQuery({
    queryKey: normasISOKeys.detail(id),
    queryFn: () => normasISOApi.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener choices (categorías y opciones)
 */
export const useNormasISOChoices = () => {
  return useQuery({
    queryKey: normasISOKeys.choices(),
    queryFn: normasISOApi.getChoices,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos - datos muy estáticos
  });
};

/**
 * Hook para obtener normas agrupadas por categoría
 */
export const useNormasISOByCategory = () => {
  return useQuery({
    queryKey: normasISOKeys.byCategory(),
    queryFn: normasISOApi.getByCategory,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para crear una nueva norma ISO
 */
export const useCreateNormaISO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNormaISODTO) => normasISOApi.create(data),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: normasISOKeys.all });
      toast.success('Norma creada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.code?.[0] ||
        'Error al crear la norma';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar una norma ISO existente
 */
export const useUpdateNormaISO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNormaISODTO }) =>
      normasISOApi.update(id, data),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas para asegurar actualización inmediata
      queryClient.invalidateQueries({ queryKey: normasISOKeys.all });
      toast.success('Norma actualizada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.code?.[0] ||
        'Error al actualizar la norma';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar una norma ISO
 * Solo permite eliminar normas custom (es_sistema=false)
 */
export const useDeleteNormaISO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => normasISOApi.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: normasISOKeys.all });
      toast.success('Norma eliminada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Error al eliminar la norma. Puede estar en uso.';
      toast.error(message);
    },
  });
};
