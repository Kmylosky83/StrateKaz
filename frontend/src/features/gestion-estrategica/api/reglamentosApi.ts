/**
 * API Client para Reglamentos Internos - Motor de Cumplimiento
 * Sistema de Gestion StrateKaz
 *
 * Base URL: /motor-cumplimiento/reglamentos-internos
 *
 * Endpoints:
 * - tipos-reglamento/ (catalogo global)
 * - reglamentos/ (CRUD + vigentes + estadisticas)
 * - versiones/
 * - publicaciones/
 * - socializaciones/
 */
import { createApiClient } from '@/lib/api-factory';
import { apiClient } from '@/lib/api-client';
import type {
  TipoReglamento,
  Reglamento,
  CreateReglamentoDTO,
  UpdateReglamentoDTO,
  VersionReglamento,
  PublicacionReglamento,
  SocializacionReglamento,
  ReglamentosEstadisticas,
} from '../types/reglamentos.types';
import type { PaginatedResponse } from '@/types';

const API_BASE = '/motor-cumplimiento/reglamentos-internos';

// ==================== TIPOS DE REGLAMENTO ====================

export const tiposReglamentoApi = createApiClient<TipoReglamento>(API_BASE, 'tipos-reglamento');

// ==================== REGLAMENTOS ====================

export const reglamentosApi = {
  ...createApiClient<Reglamento, CreateReglamentoDTO, UpdateReglamentoDTO>(API_BASE, 'reglamentos'),

  /**
   * Obtener solo reglamentos vigentes
   */
  getVigentes: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Reglamento>> => {
    const response = await apiClient.get<PaginatedResponse<Reglamento>>(
      `${API_BASE}/reglamentos/vigentes/`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener estadisticas de reglamentos por estado
   */
  getEstadisticas: async (): Promise<ReglamentosEstadisticas> => {
    const response = await apiClient.get<ReglamentosEstadisticas>(
      `${API_BASE}/reglamentos/estadisticas/`
    );
    return response.data;
  },
};

// ==================== VERSIONES ====================

export const versionesReglamentoApi = createApiClient<VersionReglamento>(API_BASE, 'versiones');

// ==================== PUBLICACIONES ====================

export const publicacionesReglamentoApi = createApiClient<PublicacionReglamento>(
  API_BASE,
  'publicaciones'
);

// ==================== SOCIALIZACIONES ====================

export const socializacionesReglamentoApi = createApiClient<SocializacionReglamento>(
  API_BASE,
  'socializaciones'
);
