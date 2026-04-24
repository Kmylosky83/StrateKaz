/**
 * Hooks React Query — ParametroCalidad (catálogo CT-QC).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

import { parametrosCalidadApi } from '../api/calidad';
import type { CreateParametroCalidadDTO, UpdateParametroCalidadDTO } from '../types/calidad.types';

export const parametrosCalidadKeys = {
  all: ['supply-chain', 'parametros-calidad'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...parametrosCalidadKeys.all, 'list', filters ?? {}] as const,
  detail: (id: number) => [...parametrosCalidadKeys.all, 'detail', id] as const,
};

/**
 * Hook defensivo — si el endpoint aún no existe (agent A en paralelo),
 * retorna array vacío en lugar de crashear la UI.
 */
export function useParametrosCalidad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: parametrosCalidadKeys.list(params),
    queryFn: async () => {
      try {
        return await parametrosCalidadApi.getAll(params);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        // 404 = endpoint todavía no desplegado; 403 = permisos — caer silenciosamente.
        if (status === 404 || status === 403) return [];
        throw err;
      }
    },
    retry: false,
  });
}

export function useCreateParametroCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateParametroCalidadDTO) => {
      const resp = await parametrosCalidadApi.create(data);
      return resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parametrosCalidadKeys.all });
      toast.success('Parámetro de calidad creado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear parámetro'));
    },
  });
}

export function useUpdateParametroCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateParametroCalidadDTO }) => {
      const resp = await parametrosCalidadApi.update(id, data);
      return resp.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: parametrosCalidadKeys.all });
      qc.invalidateQueries({ queryKey: parametrosCalidadKeys.detail(vars.id) });
      toast.success('Parámetro actualizado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar parámetro'));
    },
  });
}

export function useDeleteParametroCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await parametrosCalidadApi.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parametrosCalidadKeys.all });
      toast.success('Parámetro eliminado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar parámetro'));
    },
  });
}
