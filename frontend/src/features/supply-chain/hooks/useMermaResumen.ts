/**
 * Hook React Query — Merma Resumen (H-SC-RUTA-04).
 *
 * Lee del endpoint custom:
 *   GET /supply-chain/recepcion/vouchers/merma-resumen/
 *
 * Filtros opcionales:
 *   - rutaIds[]   → repite el query param ruta_id (filtro por múltiples rutas)
 *   - fechaDesde  → YYYY-MM-DD
 *   - fechaHasta  → YYYY-MM-DD
 */
import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/axios-config';
import type { MermaResumenFiltros, MermaResumenItem } from '../types/merma.types';

export const mermaResumenKeys = {
  all: ['supply-chain', 'merma-resumen'] as const,
  list: (filtros: MermaResumenFiltros) => [...mermaResumenKeys.all, filtros] as const,
};

export function useMermaResumen(filtros: MermaResumenFiltros = {}) {
  return useQuery<MermaResumenItem[]>({
    queryKey: mermaResumenKeys.list(filtros),
    queryFn: async () => {
      const params = new URLSearchParams();
      filtros.rutaIds?.forEach((id) => params.append('ruta_id', String(id)));
      if (filtros.fechaDesde) params.append('fecha_desde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fecha_hasta', filtros.fechaHasta);

      const qs = params.toString();
      const url = `/supply-chain/recepcion/vouchers/merma-resumen/${qs ? `?${qs}` : ''}`;
      const { data } = await apiClient.get<MermaResumenItem[]>(url);
      return data;
    },
  });
}
