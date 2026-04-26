/**
 * Hooks React Query — Paradas de Ruta de Recolección.
 * H-SC-RUTA-02.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { rutaParadasApi } from '../api/ruta-paradas';
import { rutasKeys } from './useRutas';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { ApiError } from '@/types';
import type {
  CreateRutaParadaDTO,
  UpdateRutaParadaDTO,
  RutaParadasFilterParams,
} from '../types/ruta-paradas.types';

export const rutaParadasKeys = {
  all: ['supply-chain', 'rutas-paradas'] as const,
  list: (filters?: RutaParadasFilterParams) =>
    [...rutaParadasKeys.all, 'list', filters ?? {}] as const,
  byRuta: (rutaId: number) => [...rutaParadasKeys.all, 'by-ruta', rutaId] as const,
  detail: (id: number) => [...rutaParadasKeys.all, 'detail', id] as const,
};

export function useRutaParadas(filters?: RutaParadasFilterParams) {
  return useQuery({
    queryKey: rutaParadasKeys.list(filters),
    queryFn: async () => {
      const response = await rutaParadasApi.getAll(filters);
      return response.results;
    },
  });
}

export function useRutaParadasByRuta(rutaId: number | null | undefined) {
  return useQuery({
    queryKey: rutaParadasKeys.byRuta(rutaId ?? 0),
    queryFn: () => rutaParadasApi.byRuta(rutaId as number),
    enabled: !!rutaId,
  });
}

export function useCreateRutaParada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRutaParadaDTO) => rutaParadasApi.create(data),
    onSuccess: (created) => {
      toast.success('Parada agregada a la ruta.');
      qc.invalidateQueries({ queryKey: rutaParadasKeys.all });
      qc.invalidateQueries({ queryKey: rutaParadasKeys.byRuta(created.ruta) });
      qc.invalidateQueries({ queryKey: rutasKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateRutaParada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRutaParadaDTO }) =>
      rutaParadasApi.update(id, data),
    onSuccess: (updated) => {
      toast.success('Parada actualizada.');
      qc.invalidateQueries({ queryKey: rutaParadasKeys.all });
      qc.invalidateQueries({ queryKey: rutaParadasKeys.byRuta(updated.ruta) });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteRutaParada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rutaParadasApi.delete(id),
    onSuccess: () => {
      toast.success('Parada eliminada.');
      qc.invalidateQueries({ queryKey: rutaParadasKeys.all });
      qc.invalidateQueries({ queryKey: rutasKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
