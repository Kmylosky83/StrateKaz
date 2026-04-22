/**
 * Hooks React Query para Recepcion (S3)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';
import recepcionApi from '../api/recepcionApi';
import type {
  CreateRecepcionCalidadDTO,
  CreateVoucherRecepcionDTO,
  RegistrarQCDTO,
  UpdateVoucherRecepcionDTO,
} from '../types/recepcion.types';

export const recepcionKeys = {
  all: ['supply-chain', 'recepcion'] as const,
  vouchers: () => [...recepcionKeys.all, 'vouchers'] as const,
  voucher: (id: number) => [...recepcionKeys.all, 'voucher', id] as const,
  vouchersFiltered: (filters: Record<string, unknown>) =>
    [...recepcionKeys.vouchers(), 'filtered', filters] as const,
  calidad: () => [...recepcionKeys.all, 'calidad'] as const,
  calidadDetail: (id: number) => [...recepcionKeys.all, 'calidad', id] as const,
};

// ──────── VoucherRecepcion ────────
export function useVouchers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? recepcionKeys.vouchersFiltered(params) : recepcionKeys.vouchers(),
    queryFn: async () => {
      const response = await recepcionApi.voucher.getAll(params);
      return response.data;
    },
  });
}

export function useVoucher(id: number) {
  return useQuery({
    queryKey: recepcionKeys.voucher(id),
    queryFn: async () => {
      const response = await recepcionApi.voucher.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVoucherRecepcionDTO) => {
      const response = await recepcionApi.voucher.create(data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      toast.success('Voucher creado exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear voucher'));
    },
  });
}

export function useUpdateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateVoucherRecepcionDTO }) => {
      const response = await recepcionApi.voucher.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      qc.invalidateQueries({ queryKey: recepcionKeys.voucher(id) });
      toast.success('Voucher actualizado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar voucher'));
    },
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await recepcionApi.voucher.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      toast.success('Voucher eliminado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar voucher'));
    },
  });
}

// ──────── H-SC-03: transiciones de estado ────────
export function useAprobarVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await recepcionApi.voucher.aprobar(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      qc.invalidateQueries({ queryKey: recepcionKeys.voucher(id) });
      toast.success('Voucher aprobado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'No se pudo aprobar el voucher'));
    },
  });
}

export function useRechazarVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const response = await recepcionApi.voucher.rechazar(id, motivo);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      qc.invalidateQueries({ queryKey: recepcionKeys.voucher(id) });
      toast.success('Voucher rechazado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'No se pudo rechazar el voucher'));
    },
  });
}

export function useRegistrarQC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarQCDTO }) => {
      const response = await recepcionApi.voucher.registrarQC(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      qc.invalidateQueries({ queryKey: recepcionKeys.voucher(id) });
      qc.invalidateQueries({ queryKey: recepcionKeys.calidad() });
      toast.success('Control de calidad registrado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el QC'));
    },
  });
}

// ──────── RecepcionCalidad ────────
export function useCalidades(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...recepcionKeys.calidad(), params || {}],
    queryFn: async () => {
      const response = await recepcionApi.calidad.getAll(params);
      return response.data;
    },
  });
}

export function useCreateCalidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecepcionCalidadDTO) => {
      const response = await recepcionApi.calidad.create(data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recepcionKeys.calidad() });
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      toast.success('Control de calidad registrado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al registrar calidad'));
    },
  });
}
