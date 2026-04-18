/**
 * Hooks React Query para Liquidaciones (S3)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';
import liquidacionApi from '../api/liquidacionesApi';
import type { CreateLiquidacionDTO, UpdateLiquidacionDTO } from '../types/liquidaciones.types';

export const liquidacionesKeys = {
  all: ['supply-chain', 'liquidaciones'] as const,
  list: () => [...liquidacionesKeys.all, 'list'] as const,
  listFiltered: (filters: Record<string, unknown>) =>
    [...liquidacionesKeys.list(), filters] as const,
  detail: (id: number) => [...liquidacionesKeys.all, 'detail', id] as const,
};

export function useLiquidaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? liquidacionesKeys.listFiltered(params) : liquidacionesKeys.list(),
    queryFn: async () => {
      const response = await liquidacionApi.getAll(params);
      return response.data;
    },
  });
}

export function useLiquidacion(id: number) {
  return useQuery({
    queryKey: liquidacionesKeys.detail(id),
    queryFn: async () => {
      const response = await liquidacionApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLiquidacionDTO) => {
      const response = await liquidacionApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: liquidacionesKeys.list() });
      toast.success('Liquidación creada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear liquidación'));
    },
  });
}

export function useUpdateLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLiquidacionDTO }) => {
      const response = await liquidacionApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: liquidacionesKeys.list() });
      qc.invalidateQueries({ queryKey: liquidacionesKeys.detail(id) });
      toast.success('Liquidación actualizada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar liquidación'));
    },
  });
}

export function useAprobarLiquidacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await liquidacionApi.aprobar(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: liquidacionesKeys.list() });
      qc.invalidateQueries({ queryKey: liquidacionesKeys.detail(id) });
      toast.success('Liquidación aprobada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al aprobar liquidación'));
    },
  });
}
