/**
 * Hooks React Query — Dashboard de Almacén / Inventario (Fase 1).
 *
 * Endpoints (agent B):
 *   GET /almacenes/<id>/dashboard/
 *   GET /almacenes/<id>/kardex/
 *   GET /almacenes/resumen-general/
 *
 * Los hooks son defensivos: si el endpoint aún no está desplegado
 * retornan null/empty para que el UI muestre skeleton/empty state.
 */
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { inventarioApi } from '../api/inventario';
import type {
  AlmacenDashboard,
  KardexFilterParams,
  KardexResponse,
  ResumenGeneralSC,
} from '../types/inventario.types';

export const inventarioKeys = {
  all: ['supply-chain', 'inventario'] as const,
  resumen: () => [...inventarioKeys.all, 'resumen-general'] as const,
  dashboard: (almacenId: number) => [...inventarioKeys.all, 'dashboard', almacenId] as const,
  kardex: (almacenId: number, filters?: KardexFilterParams) =>
    [...inventarioKeys.all, 'kardex', almacenId, filters ?? {}] as const,
};

export function useResumenGeneralSC() {
  return useQuery<ResumenGeneralSC | null>({
    queryKey: inventarioKeys.resumen(),
    queryFn: async () => {
      try {
        return await inventarioApi.resumenGeneral();
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) return null;
        throw err;
      }
    },
    retry: false,
  });
}

export function useAlmacenDashboard(almacenId: number | null | undefined) {
  return useQuery<AlmacenDashboard | null>({
    queryKey: inventarioKeys.dashboard(almacenId ?? 0),
    queryFn: async () => {
      if (!almacenId) return null;
      try {
        return await inventarioApi.dashboard(almacenId);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) return null;
        throw err;
      }
    },
    enabled: !!almacenId,
    retry: false,
  });
}

export function useKardexAlmacen(
  almacenId: number | null | undefined,
  filters?: KardexFilterParams
) {
  return useQuery<KardexResponse | null>({
    queryKey: inventarioKeys.kardex(almacenId ?? 0, filters),
    queryFn: async () => {
      if (!almacenId) return null;
      try {
        return await inventarioApi.kardex(almacenId, filters);
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 403) {
          return { count: 0, next: null, previous: null, results: [] };
        }
        throw err;
      }
    },
    enabled: !!almacenId,
    retry: false,
  });
}
