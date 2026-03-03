/**
 * Hooks React Query para Pruebas de Acidez
 * NOTA: Migrado de Supply Chain a Production Ops
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import pruebaAcidezApi from '../api/pruebas-acidez.api';
import type {
  CreatePruebaAcidezDTO,
  UpdatePruebaAcidezDTO,
  SimularPruebaAcidezDTO,
} from '../types/prueba-acidez.types';

// ==================== QUERY KEYS ====================

export const pruebasAcidezKeys = {
  all: ['production-ops', 'pruebas-acidez'] as const,
  pruebas: () => [...pruebasAcidezKeys.all, 'list'] as const,
  pruebasFiltered: (filters: Record<string, unknown>) =>
    [...pruebasAcidezKeys.pruebas(), 'filtered', filters] as const,
  prueba: (id: number) => [...pruebasAcidezKeys.all, 'detail', id] as const,
  pruebasPorProveedor: (proveedorId: number) =>
    [...pruebasAcidezKeys.all, 'proveedor', proveedorId] as const,
  pruebasPendientes: () => [...pruebasAcidezKeys.all, 'pendientes'] as const,
  estadisticas: () => [...pruebasAcidezKeys.all, 'estadisticas'] as const,
};

// ==================== PRUEBAS ====================

export function usePruebasAcidez(params?: {
  proveedor?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  cumple_especificacion?: boolean;
}) {
  return useQuery({
    queryKey: params ? pruebasAcidezKeys.pruebasFiltered(params) : pruebasAcidezKeys.pruebas(),
    queryFn: () => pruebaAcidezApi.getAll(params),
  });
}

export function usePruebaAcidez(id: number) {
  return useQuery({
    queryKey: pruebasAcidezKeys.prueba(id),
    queryFn: () => pruebaAcidezApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePruebaAcidez() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePruebaAcidezDTO) => pruebaAcidezApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.pruebas() });
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.estadisticas() });
      toast.success('Prueba de acidez registrada exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Error al registrar prueba de acidez');
    },
  });
}

export function useUpdatePruebaAcidez() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePruebaAcidezDTO }) =>
      pruebaAcidezApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.pruebas() });
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.prueba(id) });
      toast.success('Prueba de acidez actualizada exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Error al actualizar prueba de acidez');
    },
  });
}

export function useDeletePruebaAcidez() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pruebaAcidezApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.pruebas() });
      queryClient.invalidateQueries({ queryKey: pruebasAcidezKeys.estadisticas() });
      toast.success('Prueba de acidez eliminada exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Error al eliminar prueba de acidez');
    },
  });
}

// ==================== SIMULAR ====================

export function useSimularPruebaAcidez() {
  return useMutation({
    mutationFn: (data: SimularPruebaAcidezDTO) => pruebaAcidezApi.simular(data),
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Error al simular prueba de acidez');
    },
  });
}

// ==================== ESTADÍSTICAS ====================

export function useEstadisticasPruebasAcidez(params?: {
  proveedor?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  return useQuery({
    queryKey: pruebasAcidezKeys.estadisticas(),
    queryFn: () => pruebaAcidezApi.getEstadisticas(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== PENDIENTES ====================

export function usePruebasPendientes() {
  return useQuery({
    queryKey: pruebasAcidezKeys.pruebasPendientes(),
    queryFn: () => pruebaAcidezApi.getPendientes(),
    refetchInterval: 60000,
  });
}
