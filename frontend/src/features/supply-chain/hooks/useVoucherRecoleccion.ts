/**
 * Hooks React Query — VoucherRecoleccion + Líneas.
 * H-SC-RUTA-02.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { voucherRecoleccionApi, lineaVoucherRecoleccionApi } from '../api/voucher-recoleccion';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { ApiError } from '@/types';
import type {
  CreateVoucherRecoleccionDTO,
  UpdateVoucherRecoleccionDTO,
  CreateLineaVoucherRecoleccionDTO,
  UpdateLineaVoucherRecoleccionDTO,
  VoucherRecoleccionFilterParams,
} from '../types/voucher-recoleccion.types';

export const voucherRecoleccionKeys = {
  all: ['supply-chain', 'voucher-recoleccion'] as const,
  list: (filters?: VoucherRecoleccionFilterParams) =>
    [...voucherRecoleccionKeys.all, 'list', filters ?? {}] as const,
  detail: (id: number) => [...voucherRecoleccionKeys.all, 'detail', id] as const,
};

export function useVouchersRecoleccion(filters?: VoucherRecoleccionFilterParams) {
  return useQuery({
    queryKey: voucherRecoleccionKeys.list(filters),
    queryFn: async () => {
      const response = await voucherRecoleccionApi.getAll(filters);
      return response.results;
    },
  });
}

export function useVoucherRecoleccion(id: number | null | undefined) {
  return useQuery({
    queryKey: voucherRecoleccionKeys.detail(id ?? 0),
    queryFn: () => voucherRecoleccionApi.getById(id as number),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoucherRecoleccionDTO) => voucherRecoleccionApi.create(data),
    onSuccess: () => {
      toast.success('Voucher de recolección creado.');
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVoucherRecoleccionDTO }) =>
      voucherRecoleccionApi.update(id, data),
    onSuccess: (updated) => {
      toast.success('Voucher actualizado.');
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.detail(updated.id) });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useCompletarVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => voucherRecoleccionApi.completar(id),
    onSuccess: (updated) => {
      toast.success(`Voucher ${updated.codigo} completado.`);
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.detail(updated.id) });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => voucherRecoleccionApi.delete(id),
    onSuccess: () => {
      toast.success('Voucher eliminado.');
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ─── Líneas ────────────────────────────────────────────────────────────────

export function useCreateLineaVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLineaVoucherRecoleccionDTO) => lineaVoucherRecoleccionApi.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
      qc.invalidateQueries({
        queryKey: voucherRecoleccionKeys.detail(created.voucher),
      });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateLineaVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLineaVoucherRecoleccionDTO }) =>
      lineaVoucherRecoleccionApi.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
      qc.invalidateQueries({
        queryKey: voucherRecoleccionKeys.detail(updated.voucher),
      });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteLineaVoucherRecoleccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => lineaVoucherRecoleccionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
