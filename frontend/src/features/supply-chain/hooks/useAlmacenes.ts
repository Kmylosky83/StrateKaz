/**
 * Hooks React Query — Almacenes (catálogo CT Supply Chain)
 *
 * Gestión CRUD de almacenes físicos (silos, bodegas, tanques) por sede.
 * H-SC-07: soporta filtro ?sede=<id> para listar almacenes de una sede.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { almacenesApi } from '../api/almacenes';
import type {
  Almacen,
  AlmacenList,
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  AlmacenesFilterParams,
} from '../types';
import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

// ==================== QUERY KEYS ====================

export const almacenesKeys = {
  all: ['supply-chain', 'almacenes'] as const,
  list: (filters?: AlmacenesFilterParams) =>
    [...almacenesKeys.all, 'list', filters ?? {}] as const,
  detail: (id: number) => [...almacenesKeys.all, 'detail', id] as const,
};

// ==================== QUERIES ====================

/**
 * Lista almacenes con filtros opcionales.
 *
 * @example
 *   useAlmacenes({ sede: 5 })  // → GET /almacenes/?sede=5
 *   useAlmacenes({ is_active: true })
 */
export function useAlmacenes(filters?: AlmacenesFilterParams) {
  return useQuery({
    queryKey: almacenesKeys.list(filters),
    queryFn: async () => {
      const response = await almacenesApi.getAll(filters);
      return response.results as AlmacenList[];
    },
  });
}

export function useAlmacen(id: number | null | undefined) {
  return useQuery({
    queryKey: almacenesKeys.detail(id ?? 0),
    queryFn: () => almacenesApi.getById(id as number),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

export function useCreateAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlmacenDTO) => almacenesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: almacenesKeys.all });
      toast.success('Almacén creado correctamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear almacén'));
    },
  });
}

export function useUpdateAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAlmacenDTO }) =>
      almacenesApi.update(id, data),
    onSuccess: (updated: Almacen) => {
      qc.invalidateQueries({ queryKey: almacenesKeys.all });
      qc.invalidateQueries({ queryKey: almacenesKeys.detail(updated.id) });
      toast.success('Almacén actualizado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar almacén'));
    },
  });
}

export function useDeleteAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => almacenesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: almacenesKeys.all });
      toast.success('Almacén eliminado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar almacén'));
    },
  });
}
