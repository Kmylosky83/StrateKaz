/**
 * Hooks React Query — Rutas de Recolección (catálogo CT Supply Chain)
 *
 * CRUD de circuitos de recolección de MP. H-SC-10: sustituye al dropdown de
 * SedeEmpresa en VoucherRecepcion cuando la modalidad es RECOLECCION.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { rutasApi } from '../api/rutas';
import type {
  RutaRecoleccion,
  RutaRecoleccionList,
  CreateRutaDTO,
  UpdateRutaDTO,
  RutasFilterParams,
} from '../types/rutas.types';
import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

// ==================== QUERY KEYS ====================

export const rutasKeys = {
  all: ['supply-chain', 'rutas-recoleccion'] as const,
  list: (filters?: RutasFilterParams) => [...rutasKeys.all, 'list', filters ?? {}] as const,
  detail: (id: number) => [...rutasKeys.all, 'detail', id] as const,
};

// ==================== QUERIES ====================

export function useRutas(filters?: RutasFilterParams) {
  return useQuery({
    queryKey: rutasKeys.list(filters),
    queryFn: async () => {
      const response = await rutasApi.getAll(filters);
      return response.results as RutaRecoleccionList[];
    },
  });
}

export function useRuta(id: number | null | undefined) {
  return useQuery({
    queryKey: rutasKeys.detail(id ?? 0),
    queryFn: () => rutasApi.getById(id as number),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

export function useCreateRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRutaDTO) => rutasApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rutasKeys.all });
      toast.success('Ruta creada correctamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear ruta'));
    },
  });
}

export function useUpdateRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRutaDTO }) => rutasApi.update(id, data),
    onSuccess: (updated: RutaRecoleccion) => {
      qc.invalidateQueries({ queryKey: rutasKeys.all });
      qc.invalidateQueries({ queryKey: rutasKeys.detail(updated.id) });
      toast.success('Ruta actualizada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar ruta'));
    },
  });
}

export function useDeleteRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rutasApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rutasKeys.all });
      toast.success('Ruta eliminada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar ruta'));
    },
  });
}
