/**
 * React Query Hooks para Partes Interesadas
 * Sistema de Gestión StrateKaz
 *
 * Usa useGenericCRUD como base para operaciones CRUD estándar
 */
import { useGenericCRUD } from '@/hooks/useGenericCRUD';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { tiposParteInteresadaApi, partesInteresadasApi } from '../api';
import type {
  TipoParteInteresada,
  ParteInteresada,
  ParteInteresadaFilters,
} from '../types';

// ==================== QUERY KEYS ====================

export const partesInteresadasKeys = {
  // Tipos de Parte Interesada
  tipos: ['tipos-parte-interesada'] as const,
  tipo: (id: number) => ['tipo-parte-interesada', id] as const,

  // Partes Interesadas
  partes: (filters?: ParteInteresadaFilters) => ['partes-interesadas', filters] as const,
  parte: (id: number) => ['parte-interesada', id] as const,
  matrizInfluenciaInteres: (empresaId: number) =>
    ['partes-interesadas', 'matriz', empresaId] as const,
};

// ==================== TIPOS DE PARTE INTERESADA HOOKS ====================

export const useTiposParteInteresada = () => {
  return useGenericCRUD<TipoParteInteresada>({
    queryKey: partesInteresadasKeys.tipos,
    endpoint: '/motor_cumplimiento/partes-interesadas/tipos/',
    entityName: 'Tipo de Parte Interesada',
    isFeminine: true,
    isPaginated: true,
  });
};

export const useReorderTiposParteInteresada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: { id: number; orden: number }[]) =>
      tiposParteInteresadaApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partesInteresadasKeys.tipos });
      toast.success('Orden actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el orden');
    },
  });
};

// ==================== PARTES INTERESADAS HOOKS ====================

export const usePartesInteresadas = (filters?: ParteInteresadaFilters) => {
  return useGenericCRUD<ParteInteresada>({
    queryKey: partesInteresadasKeys.partes(filters),
    endpoint: `/motor_cumplimiento/partes-interesadas/partes/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Parte Interesada',
    isFeminine: true,
    isPaginated: true,
  });
};

export const useMatrizInfluenciaInteres = (empresaId: number) => {
  return useQuery({
    queryKey: partesInteresadasKeys.matrizInfluenciaInteres(empresaId),
    queryFn: () => partesInteresadasApi.getMatrizInfluenciaInteres(empresaId),
    enabled: !!empresaId,
  });
};
