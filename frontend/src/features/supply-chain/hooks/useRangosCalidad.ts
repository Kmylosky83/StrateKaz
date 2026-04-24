/**
 * Hooks React Query — RangoCalidad (clasificaciones por ParametroCalidad).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

import { rangosCalidadApi } from '../api/calidad';
import type { CreateRangoCalidadDTO, UpdateRangoCalidadDTO } from '../types/calidad.types';

export const rangosCalidadKeys = {
  all: ['supply-chain', 'rangos-calidad'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...rangosCalidadKeys.all, 'list', filters ?? {}] as const,
  byParametro: (parametroId: number) =>
    [...rangosCalidadKeys.all, 'por-parametro', parametroId] as const,
};

export function useRangosCalidad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: rangosCalidadKeys.list(params),
    queryFn: async () => {
      try {
        return await rangosCalidadApi.getAll(params);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) return [];
        throw err;
      }
    },
    retry: false,
  });
}

export function useRangosPorParametro(parametroId: number | null | undefined) {
  return useQuery({
    queryKey: rangosCalidadKeys.byParametro(parametroId ?? 0),
    queryFn: async () => {
      if (!parametroId) return [];
      try {
        return await rangosCalidadApi.getByParametro(parametroId);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) return [];
        throw err;
      }
    },
    enabled: !!parametroId,
    retry: false,
  });
}

export function useCreateRangoCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRangoCalidadDTO) => {
      const resp = await rangosCalidadApi.create(data);
      return resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rangosCalidadKeys.all });
      toast.success('Rango creado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear rango'));
    },
  });
}

export function useUpdateRangoCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRangoCalidadDTO }) => {
      const resp = await rangosCalidadApi.update(id, data);
      return resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rangosCalidadKeys.all });
      toast.success('Rango actualizado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar rango'));
    },
  });
}

export function useDeleteRangoCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await rangosCalidadApi.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rangosCalidadKeys.all });
      toast.success('Rango eliminado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar rango'));
    },
  });
}
