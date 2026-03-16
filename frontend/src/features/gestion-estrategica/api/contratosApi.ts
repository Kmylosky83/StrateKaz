/**
 * API Client para Tipos de Contrato - Configuracion
 * Sistema de Gestion StrateKaz
 *
 * Base URL: /gestion-estrategica/configuracion
 * Endpoint: contratos-tipo/
 */
import { createApiClient } from '@/lib/api-factory';
import type {
  TipoContratoDetail,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO,
} from '../types/contratos.types';

const API_BASE = '/gestion-estrategica/configuracion';

// ==================== TIPOS DE CONTRATO ====================

export const contratosTipoApi = createApiClient<
  TipoContratoDetail,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO
>(API_BASE, 'contratos-tipo');
