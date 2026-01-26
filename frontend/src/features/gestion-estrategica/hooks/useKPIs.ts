/**
 * React Query Hooks para el módulo de KPIs y Seguimiento
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { kpisApi } from '../api/kpisApi';
import type {
  CreateKPIObjetivoDTO,
  UpdateKPIObjetivoDTO,
  CreateMedicionKPIDTO,
  UpdateMedicionKPIDTO,
  KPIFilters,
} from '../types/kpi.types';

// ==================== QUERY KEYS ====================

export const kpisKeys = {
  // KPIs
  all: ['kpis'] as const,
  lists: () => [...kpisKeys.all, 'list'] as const,
  list: (filters?: KPIFilters) => [...kpisKeys.lists(), filters] as const,
  details: () => [...kpisKeys.all, 'detail'] as const,
  detail: (id: number) => [...kpisKeys.details(), id] as const,
  choices: () => [...kpisKeys.all, 'choices'] as const,

  // Mediciones
  measurements: (kpiId: number) => ['kpi-measurements', kpiId] as const,
  measurement: (id: number) => ['kpi-measurement', id] as const,
};

// ==================== KPI HOOKS ====================

/**
 * Obtiene la lista de KPIs con filtros opcionales
 */
export const useKPIs = (filters?: KPIFilters, page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: kpisKeys.list(filters),
    queryFn: () => kpisApi.list(filters, page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutos - datos que cambian frecuentemente
    gcTime: 5 * 60 * 1000, // 5 minutos cache
  });
};

/**
 * Obtiene un KPI por ID
 */
export const useKPI = (id: number) => {
  return useQuery({
    queryKey: kpisKeys.detail(id),
    queryFn: () => kpisApi.get(id),
    enabled: !!id && id > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Crea un nuevo KPI
 */
export const useCreateKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKPIObjetivoDTO) => kpisApi.create(data),
    onSuccess: (newKPI) => {
      // Invalidar listas de KPIs
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      // Invalidar el objetivo relacionado
      queryClient.invalidateQueries({ queryKey: ['objective', newKPI.objective] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success('KPI creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el KPI');
    },
  });
};

/**
 * Actualiza un KPI existente
 */
export const useUpdateKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateKPIObjetivoDTO }) =>
      kpisApi.update(id, data),
    onSuccess: (updatedKPI, { id }) => {
      // Actualizar cache directamente con los datos retornados del servidor
      queryClient.setQueryData(kpisKeys.detail(id), updatedKPI);
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      // Invalidar el objetivo relacionado
      queryClient.invalidateQueries({ queryKey: ['objective', updatedKPI.objective] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success('KPI actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el KPI');
    },
  });
};

/**
 * Elimina un KPI
 */
export const useDeleteKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => kpisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success('KPI eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el KPI');
    },
  });
};

// ==================== MEDICIONES HOOKS ====================

/**
 * Obtiene las mediciones de un KPI específico
 */
export const useKPIMeasurements = (kpiId: number, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: kpisKeys.measurements(kpiId),
    queryFn: () => kpisApi.getMeasurements(kpiId, page, pageSize),
    enabled: !!kpiId && kpiId > 0,
    staleTime: 1 * 60 * 1000, // 1 minuto - datos más dinámicos
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Crea una nueva medición para un KPI
 */
export const useCreateMeasurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicionKPIDTO) => kpisApi.createMeasurement(data),
    onSuccess: async (newMeasurement, variables) => {
      // Forzar refetch inmediato del KPI para actualizar last_value y status_semaforo
      await queryClient.refetchQueries({ queryKey: kpisKeys.detail(variables.kpi) });
      // Invalidar mediciones
      queryClient.invalidateQueries({ queryKey: kpisKeys.measurements(variables.kpi) });
      // Invalidar listas de KPIs
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      // Invalidar objetivos relacionados
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success('Medición registrada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar la medición');
    },
  });
};

/**
 * Actualiza una medición existente
 */
export const useUpdateMeasurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMedicionKPIDTO }) =>
      kpisApi.updateMeasurement(id, data),
    onSuccess: async (updatedMeasurement) => {
      // Forzar refetch del KPI relacionado
      await queryClient.refetchQueries({ queryKey: kpisKeys.detail(updatedMeasurement.kpi) });
      // Invalidar mediciones
      queryClient.invalidateQueries({ queryKey: kpisKeys.measurements(updatedMeasurement.kpi) });
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      toast.success('Medición actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la medición');
    },
  });
};

/**
 * Elimina una medición
 */
export const useDeleteMeasurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kpiId }: { id: number; kpiId: number }) => kpisApi.deleteMeasurement(id),
    onSuccess: async (_, variables) => {
      // Forzar refetch del KPI relacionado
      await queryClient.refetchQueries({ queryKey: kpisKeys.detail(variables.kpiId) });
      // Invalidar mediciones
      queryClient.invalidateQueries({ queryKey: kpisKeys.measurements(variables.kpiId) });
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: kpisKeys.lists() });
      toast.success('Medición eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la medición');
    },
  });
};

// ==================== HELPERS HOOKS ====================

/**
 * Obtiene las opciones para selects (frecuencias, tipos de tendencia, etc.)
 */
export const useKPIChoices = () => {
  return useQuery({
    queryKey: kpisKeys.choices(),
    queryFn: kpisApi.getChoices,
    staleTime: 10 * 60 * 1000, // 10 minutos - datos estáticos
    gcTime: 15 * 60 * 1000,
  });
};
