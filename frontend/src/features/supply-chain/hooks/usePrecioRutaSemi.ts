/**
 * Hooks React Query — Precios de Ruta Semi-Autónoma.
 * H-SC-RUTA-02 Modelo 2.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { precioRutaSemiApi } from '../api/precio-ruta-semi';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { ApiError } from '@/types';
import type {
  CreatePrecioRutaSemiDTO,
  UpdatePrecioRutaSemiDTO,
  PrecioRutaSemiFilterParams,
} from '../types/precio-ruta-semi.types';

export const precioRutaSemiKeys = {
  all: ['supply-chain', 'precios-ruta-semi'] as const,
  list: (filters?: PrecioRutaSemiFilterParams) =>
    [...precioRutaSemiKeys.all, 'list', filters ?? {}] as const,
  detail: (id: number) => [...precioRutaSemiKeys.all, 'detail', id] as const,
};

export function usePreciosRutaSemi(filters?: PrecioRutaSemiFilterParams) {
  return useQuery({
    queryKey: precioRutaSemiKeys.list(filters),
    queryFn: async () => {
      const response = await precioRutaSemiApi.getAll(filters);
      return response.results;
    },
  });
}

export function useCreatePrecioRutaSemi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrecioRutaSemiDTO) => precioRutaSemiApi.create(data),
    onSuccess: () => {
      toast.success('Precio configurado.');
      qc.invalidateQueries({ queryKey: precioRutaSemiKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdatePrecioRutaSemi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePrecioRutaSemiDTO }) =>
      precioRutaSemiApi.update(id, data),
    onSuccess: () => {
      toast.success('Precio actualizado.');
      qc.invalidateQueries({ queryKey: precioRutaSemiKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeletePrecioRutaSemi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => precioRutaSemiApi.delete(id),
    onSuccess: () => {
      toast.success('Precio eliminado.');
      qc.invalidateQueries({ queryKey: precioRutaSemiKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
