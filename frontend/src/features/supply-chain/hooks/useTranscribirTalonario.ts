/**
 * Hook React Query — Transcribir talonario manual desde planta.
 *
 * H-SC-TALONARIO: dispara el endpoint que crea N VoucherRecoleccion en lote
 * y los asocia al VoucherRecepcion (M2M).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import apiClient from '@/api/axios-config';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { ApiError } from '@/types';
import { recepcionKeys } from './useRecepcion';
import { voucherRecoleccionKeys } from './useVoucherRecoleccion';
import type {
  TranscribirTalonarioRequest,
  TranscribirTalonarioResponse,
} from '../types/talonario.types';

interface TranscribirTalonarioVariables {
  voucherRecepcionId: number;
  data: TranscribirTalonarioRequest;
}

export function useTranscribirTalonario() {
  const qc = useQueryClient();
  return useMutation<
    TranscribirTalonarioResponse,
    AxiosError<ApiError>,
    TranscribirTalonarioVariables
  >({
    mutationFn: async ({ voucherRecepcionId, data }) => {
      const response = await apiClient.post<TranscribirTalonarioResponse>(
        `/supply-chain/recepcion/vouchers/${voucherRecepcionId}/asociar-talonario-planta/`,
        data
      );
      return response.data;
    },
    onSuccess: (result, { voucherRecepcionId }) => {
      toast.success(
        result.total === 1
          ? '1 voucher de recolección creado y asociado.'
          : `${result.total} vouchers de recolección creados y asociados.`
      );
      // Detalle del voucher receptor (M2M actualizado)
      qc.invalidateQueries({ queryKey: recepcionKeys.voucher(voucherRecepcionId) });
      // Listado de vouchers de recepción
      qc.invalidateQueries({ queryKey: recepcionKeys.vouchers() });
      // Listado de vouchers de recolección
      qc.invalidateQueries({ queryKey: voucherRecoleccionKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo transcribir el talonario.'));
    },
  });
}
