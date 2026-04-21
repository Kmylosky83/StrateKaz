/**
 * React Query hooks para Precios MP + Historial + Modalidades Logísticas.
 */
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { precioMPApi, historialPrecioApi, modalidadLogisticaApi } from '../api/precios.api';
import type {
  PrecioMP,
  CreatePrecioMPDTO,
  UpdatePrecioMPDTO,
  HistorialPrecio,
  ModalidadLogistica,
} from '../types/precio.types';

// ─── Precios MP ───
const preciosKeys = createQueryKeys<Record<string, unknown>>('sc-precios-mp');
const preciosHooks = createCrudHooks<PrecioMP, CreatePrecioMPDTO, UpdatePrecioMPDTO>(
  precioMPApi,
  preciosKeys,
  'Precio MP'
);

export const usePreciosMP = preciosHooks.useList;
export const usePrecioMP = preciosHooks.useDetail;
export const useCreatePrecioMP = preciosHooks.useCreate;
export const useUpdatePrecioMP = preciosHooks.useUpdate;
export const useDeletePrecioMP = preciosHooks.useDelete;

// ─── Historial (readonly) ───
const historialKeys = createQueryKeys<Record<string, unknown>>('sc-historial-precios');
const historialHooks = createCrudHooks<HistorialPrecio>(
  historialPrecioApi,
  historialKeys,
  'Historial Precio'
);

export const useHistorialPrecios = historialHooks.useList;

// ─── Modalidades Logísticas ───
const modalidadesKeys = createQueryKeys<Record<string, unknown>>('sc-modalidades-logistica');
const modalidadesHooks = createCrudHooks<ModalidadLogistica>(
  modalidadLogisticaApi,
  modalidadesKeys,
  'Modalidad Logística'
);

export const useModalidadesLogistica = modalidadesHooks.useList;
