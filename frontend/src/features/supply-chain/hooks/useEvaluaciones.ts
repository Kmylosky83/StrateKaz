/**
 * Hooks React Query para Evaluación de Proveedores
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import evaluacionesApi from '../api/evaluaciones.api';
import type {
  CriterioEvaluacion,
  CreateCriterioEvaluacionDTO,
  UpdateCriterioEvaluacionDTO,
  EvaluacionProveedor,
  CreateEvaluacionProveedorDTO,
  UpdateEvaluacionProveedorDTO,
  AprobarEvaluacionDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const evaluacionesKeys = {
  all: ['supply-chain', 'evaluaciones'] as const,
  criterios: () => [...evaluacionesKeys.all, 'criterios'] as const,
  criteriosActivos: () => [...evaluacionesKeys.criterios(), 'activos'] as const,
  evaluaciones: () => [...evaluacionesKeys.all, 'list'] as const,
  evaluacionesFiltered: (filters: Record<string, any>) => [...evaluacionesKeys.evaluaciones(), 'filtered', filters] as const,
  evaluacion: (id: number) => [...evaluacionesKeys.all, 'detail', id] as const,
  evaluacionesPorProveedor: (proveedorId: number) => [...evaluacionesKeys.all, 'proveedor', proveedorId] as const,
  estadisticas: () => [...evaluacionesKeys.all, 'estadisticas'] as const,
};

// ==================== CRITERIOS ====================

export function useCriterios(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params?.is_active ? evaluacionesKeys.criteriosActivos() : evaluacionesKeys.criterios(),
    queryFn: () => (params?.is_active ? evaluacionesApi.criterioEvaluacion.getActivos() : evaluacionesApi.criterioEvaluacion.getAll()),
  });
}

export function useCreateCriterio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCriterioEvaluacionDTO) => evaluacionesApi.criterioEvaluacion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.criterios() });
      toast.success('Criterio creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear criterio');
    },
  });
}

export function useUpdateCriterio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCriterioEvaluacionDTO }) =>
      evaluacionesApi.criterioEvaluacion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.criterios() });
      toast.success('Criterio actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar criterio');
    },
  });
}

export function useDeleteCriterio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => evaluacionesApi.criterioEvaluacion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.criterios() });
      toast.success('Criterio eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar criterio');
    },
  });
}

// ==================== EVALUACIONES ====================

export function useEvaluaciones(params?: { proveedor?: number; estado?: string }) {
  return useQuery({
    queryKey: params ? evaluacionesKeys.evaluacionesFiltered(params) : evaluacionesKeys.evaluaciones(),
    queryFn: () => evaluacionesApi.evaluacionProveedor.getAll(params),
  });
}

export function useEvaluacion(id: number) {
  return useQuery({
    queryKey: evaluacionesKeys.evaluacion(id),
    queryFn: () => evaluacionesApi.evaluacionProveedor.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEvaluacionProveedorDTO) => evaluacionesApi.evaluacionProveedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.estadisticas() });
      toast.success('Evaluación creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear evaluación');
    },
  });
}

export function useUpdateEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEvaluacionProveedorDTO }) =>
      evaluacionesApi.evaluacionProveedor.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluacion(id) });
      toast.success('Evaluación actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar evaluación');
    },
  });
}

export function useAprobarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: AprobarEvaluacionDTO }) =>
      evaluacionesApi.evaluacionProveedor.aprobar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluacion(id) });
      toast.success('Evaluación aprobada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al aprobar evaluación');
    },
  });
}

export function useRechazarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      evaluacionesApi.evaluacionProveedor.rechazar(id, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: evaluacionesKeys.evaluacion(id) });
      toast.success('Evaluación rechazada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al rechazar evaluación');
    },
  });
}

export function useEstadisticasEvaluacion() {
  return useQuery({
    queryKey: evaluacionesKeys.estadisticas(),
    queryFn: () => evaluacionesApi.evaluacionProveedor.getEstadisticas(),
    staleTime: 5 * 60 * 1000,
  });
}
