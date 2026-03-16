/**
 * Custom Hooks para Tipos de Contrato - Configuracion
 * Sistema de Gestion StrateKaz
 *
 * Hooks basados en TanStack Query (React Query) para gestion de estado del servidor.
 * Usa createCrudHooks para CRUD basico.
 */
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { contratosTipoApi } from '../api/contratosApi';
import type {
  TipoContratoDetail,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO,
} from '../types/contratos.types';

// ==================== QUERY KEYS ====================

export const contratosTipoKeys = createQueryKeys('contratos-tipo');

// ==================== TIPOS DE CONTRATO (CRUD) ====================

const contratosTipoHooks = createCrudHooks<
  TipoContratoDetail,
  CreateTipoContratoDTO,
  UpdateTipoContratoDTO
>(contratosTipoApi, contratosTipoKeys, 'Tipo de contrato');

export const useContratosTipo = contratosTipoHooks.useList;
export const useContratoTipo = contratosTipoHooks.useDetail;
export const useCreateContratoTipo = contratosTipoHooks.useCreate;
export const useUpdateContratoTipo = contratosTipoHooks.useUpdate;
export const useDeleteContratoTipo = contratosTipoHooks.useDelete;
