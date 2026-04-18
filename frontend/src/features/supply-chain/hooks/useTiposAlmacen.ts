/**
 * Hooks React Query para TipoAlmacen (catálogo S3) — silo / contenedor / pallet / piso
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import apiClient from '@/api/axios-config';
import type { ApiError, PaginatedResponse } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

export interface TipoAlmacen {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoAlmacenDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden?: number;
  is_active?: boolean;
}

export type UpdateTipoAlmacenDTO = Partial<CreateTipoAlmacenDTO>;

const BASE = '/supply-chain/catalogos/tipos-almacen';

const tiposAlmacenApi = {
  getAll: () => apiClient.get<PaginatedResponse<TipoAlmacen> | TipoAlmacen[]>(`${BASE}/`),
  create: (data: CreateTipoAlmacenDTO) => apiClient.post<TipoAlmacen>(`${BASE}/`, data),
  update: (id: number, data: UpdateTipoAlmacenDTO) =>
    apiClient.patch<TipoAlmacen>(`${BASE}/${id}/`, data),
  delete: (id: number) => apiClient.delete(`${BASE}/${id}/`),
};

export const tiposAlmacenKeys = {
  all: ['supply-chain', 'tipos-almacen'] as const,
};

export function useTiposAlmacen() {
  return useQuery({
    queryKey: tiposAlmacenKeys.all,
    queryFn: async () => {
      const response = await tiposAlmacenApi.getAll();
      return response.data;
    },
  });
}

export function useCreateTipoAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTipoAlmacenDTO) => {
      const response = await tiposAlmacenApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tiposAlmacenKeys.all });
      toast.success('Tipo de almacén creado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear tipo de almacén'));
    },
  });
}

export function useUpdateTipoAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTipoAlmacenDTO }) => {
      const response = await tiposAlmacenApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tiposAlmacenKeys.all });
      toast.success('Tipo de almacén actualizado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar'));
    },
  });
}

export function useDeleteTipoAlmacen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await tiposAlmacenApi.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tiposAlmacenKeys.all });
      toast.success('Tipo de almacén eliminado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar'));
    },
  });
}
