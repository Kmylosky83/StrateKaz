/**
 * API client — Dashboard de Almacén / Inventario.
 *
 * Endpoints (Fase 1 — agent B):
 *   GET /supply-chain/catalogos/almacenes/<id>/dashboard/
 *   GET /supply-chain/catalogos/almacenes/<id>/kardex/
 *   GET /supply-chain/catalogos/almacenes/resumen-general/
 */
import apiClient from '@/api/axios-config';
import type {
  AlmacenDashboard,
  KardexFilterParams,
  KardexResponse,
  ResumenGeneralSC,
} from '../types/inventario.types';

const BASE = '/supply-chain/catalogos/almacenes';

export const inventarioApi = {
  resumenGeneral: (): Promise<ResumenGeneralSC> =>
    apiClient.get<ResumenGeneralSC>(`${BASE}/resumen-general/`).then((r) => r.data),

  dashboard: (almacenId: number): Promise<AlmacenDashboard> =>
    apiClient.get<AlmacenDashboard>(`${BASE}/${almacenId}/dashboard/`).then((r) => r.data),

  kardex: (almacenId: number, params?: KardexFilterParams): Promise<KardexResponse> =>
    apiClient.get<KardexResponse>(`${BASE}/${almacenId}/kardex/`, { params }).then((r) => r.data),
};

export default inventarioApi;
