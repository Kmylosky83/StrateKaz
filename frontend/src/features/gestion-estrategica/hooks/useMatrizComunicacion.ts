/**
 * Hook para Matriz de Comunicación
 *
 * API: /gestion-estrategica/contexto/matriz-comunicacion/
 * ISO 9001:2015 Cláusula 7.4 — Comunicación con Partes Interesadas
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  matrizComunicacionApi,
  type MatrizComunicacion,
  type MatrizComunicacionFilters,
  type CreateMatrizComunicacionDTO,
} from '../api/partesInteresadasApi';

const QUERY_KEY = 'matriz-comunicacion';

/**
 * Hook para listar registros de matriz de comunicación con filtros
 */
export const useMatrizComunicacion = (filters?: MatrizComunicacionFilters) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => matrizComunicacionApi.list(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: matrizComunicacionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Registro de comunicación eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el registro');
    },
  });

  const rawData = query.data;
  const items = Array.isArray(rawData) ? rawData : (rawData?.results ?? []);
  const totalCount = Array.isArray(rawData) ? rawData.length : (rawData?.count ?? 0);

  return {
    data: items as MatrizComunicacion[],
    totalCount,
    isLoading: query.isLoading,
    error: query.error,
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    refetch: query.refetch,
  };
};

/**
 * Hook para crear/editar registros de matriz de comunicación
 */
export const useMatrizComunicacionMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: matrizComunicacionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Registro de comunicación creado');
    },
    onError: () => {
      toast.error('Error al crear el registro');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMatrizComunicacionDTO> }) =>
      matrizComunicacionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Registro de comunicación actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el registro');
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

// Re-export types
export type { MatrizComunicacion, MatrizComunicacionFilters, CreateMatrizComunicacionDTO };
