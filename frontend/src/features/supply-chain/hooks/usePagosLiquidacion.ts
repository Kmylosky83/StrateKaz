/**
 * Hooks React Query para PagoLiquidacion (H-SC-12)
 *
 * Mini-tesorería: registro de pagos de liquidaciones aprobadas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';
import { pagoLiquidacionApi } from '../api/liquidacionesApi';
import type { CreatePagoLiquidacionDTO } from '../types/liquidaciones.types';
import { liquidacionesKeys } from './useLiquidaciones';

export const pagosLiquidacionKeys = {
  all: ['supply-chain', 'pagos-liquidacion'] as const,
  list: () => [...pagosLiquidacionKeys.all, 'list'] as const,
  listFiltered: (filters: Record<string, unknown>) =>
    [...pagosLiquidacionKeys.list(), filters] as const,
  detail: (id: number) => [...pagosLiquidacionKeys.all, 'detail', id] as const,
};

export function usePagos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? pagosLiquidacionKeys.listFiltered(params) : pagosLiquidacionKeys.list(),
    queryFn: async () => {
      const response = await pagoLiquidacionApi.getAll(params);
      return response.data;
    },
  });
}

export function usePago(id: number | null | undefined) {
  return useQuery({
    queryKey: pagosLiquidacionKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await pagoLiquidacionApi.getById(id as number);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePagoLiquidacionDTO) => {
      const response = await pagoLiquidacionApi.create(data);
      return response.data;
    },
    onSuccess: (pago) => {
      qc.invalidateQueries({ queryKey: pagosLiquidacionKeys.all });
      // Al crear un pago el backend cambia el estado de la liquidacion a PAGADA
      qc.invalidateQueries({ queryKey: liquidacionesKeys.all });
      if (pago?.liquidacion) {
        qc.invalidateQueries({ queryKey: liquidacionesKeys.detail(pago.liquidacion) });
      }
      toast.success('Pago registrado');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al registrar pago'));
    },
  });
}
