/**
 * Hook para Partes Interesadas (Stakeholders)
 *
 * Ubicación: gestion-estrategica/contexto
 * API: /gestion-estrategica/contexto/partes-interesadas/
 * Cumple ISO 9001:2015 Cláusula 4.2 - Partes Interesadas
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  partesInteresadasApi,
  tiposParteInteresadaApi,
  type ParteInteresada,
  type TipoParteInteresada,
  type ParteInteresadaFilters,
} from '../api/contextoApi';

// Query keys
const QUERY_KEYS = {
  partesInteresadas: 'partes-interesadas',
  tiposParteInteresada: 'tipos-parte-interesada',
};

/**
 * Hook para listar partes interesadas con filtros
 */
export const usePartesInteresadas = (filters?: ParteInteresadaFilters) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, filters],
    queryFn: () => partesInteresadasApi.list(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: partesInteresadasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  return {
    // Data
    data: query.data?.results || [],
    rawData: query.data,
    totalCount: query.data?.count || 0,

    // Status
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,

    // Actions
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Query control
    refetch: query.refetch,
  };
};

/**
 * Hook para obtener una parte interesada por ID
 */
export const useParteInteresada = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, id],
    queryFn: () => (id ? partesInteresadasApi.get(id) : null),
    enabled: !!id,
  });
};

/**
 * Hook para crear/actualizar partes interesadas
 */
export const useParteInteresadaMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: partesInteresadasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ParteInteresada> }) =>
      partesInteresadasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
};

/**
 * Hook para listar tipos de parte interesada
 */
export const useTiposParteInteresada = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.tiposParteInteresada],
    queryFn: tiposParteInteresadaApi.list,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos (catálogo estático)
  });

  return {
    data: query.data?.results || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

/**
 * Hook para obtener matriz poder-interés
 */
export const useMatrizPoderInteres = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, 'matriz-poder-interes'],
    queryFn: partesInteresadasApi.matrizPoderInteres,
  });
};

/**
 * Hook para estadísticas de partes interesadas
 */
export const useEstadisticasPartesInteresadas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, 'estadisticas'],
    queryFn: partesInteresadasApi.estadisticas,
  });
};

// Re-exportar tipos para conveniencia
export type { ParteInteresada, TipoParteInteresada, ParteInteresadaFilters };
