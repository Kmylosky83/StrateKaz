/**
 * Hooks React Query — MedicionCalidad (listado + bulk por línea de voucher).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';

import { medicionesCalidadApi } from '../api/calidad';
import type { BulkMedicionesDTO } from '../types/calidad.types';

export const medicionesCalidadKeys = {
  all: ['supply-chain', 'mediciones-calidad'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...medicionesCalidadKeys.all, 'list', filters ?? {}] as const,
  byLine: (lineId: number) => [...medicionesCalidadKeys.all, 'line', lineId] as const,
};

export function useMedicionesCalidad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: medicionesCalidadKeys.list(params),
    queryFn: async () => {
      try {
        return await medicionesCalidadApi.getAll(params);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) return [];
        throw err;
      }
    },
    retry: false,
  });
}

/**
 * Bulk: crea N MedicionCalidad para una línea de voucher.
 * Se invoca desde VoucherFormModal tras guardar el voucher.
 */
export function useBulkMedicionesPorLinea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      voucherLineId,
      data,
    }: {
      voucherLineId: number;
      data: BulkMedicionesDTO;
    }) => {
      const resp = await medicionesCalidadApi.bulkPorLinea(voucherLineId, data);
      return resp.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: medicionesCalidadKeys.all });
      qc.invalidateQueries({ queryKey: medicionesCalidadKeys.byLine(vars.voucherLineId) });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al guardar mediciones de calidad'));
    },
  });
}
