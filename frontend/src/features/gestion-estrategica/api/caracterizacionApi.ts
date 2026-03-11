/**
 * API Client para Caracterización de Procesos (SIPOC)
 * Módulo: C1 — Fundación / Organización
 */
import { createApiClient } from '@/lib/api-factory';
import { apiClient } from '@/lib/api-client';
import type {
  CaracterizacionProcesoList,
  CaracterizacionProceso,
  CreateCaracterizacionDTO,
  UpdateCaracterizacionDTO,
} from '../types/caracterizacion.types';

export const caracterizacionApi = {
  ...createApiClient<
    CaracterizacionProcesoList,
    CreateCaracterizacionDTO,
    UpdateCaracterizacionDTO
  >('/organizacion', 'caracterizaciones'),
  /** Obtener caracterización por área */
  getByArea: (areaId: number): Promise<CaracterizacionProceso> =>
    apiClient.get(`/organizacion/caracterizaciones/by-area/${areaId}/`).then((r) => r.data),
};
