/**
 * React Query hooks para Proveedores (CT-layer).
 */
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { proveedorApi, tipoProveedorApi } from '../api/proveedores.api';
import type {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  TipoProveedor,
  CreateTipoProveedorDTO,
  UpdateTipoProveedorDTO,
} from '../types/proveedor.types';

const keys = createQueryKeys<Record<string, unknown>>('catalogo-productos-proveedores');

const hooks = createCrudHooks<Proveedor, CreateProveedorDTO, UpdateProveedorDTO>(
  proveedorApi,
  keys,
  'Proveedor'
);

export const useProveedores = hooks.useList;
/** Detalle de un proveedor (incluye productos_suministrados M2M). */
export const useProveedor = hooks.useDetail;
export const useCreateProveedor = hooks.useCreate;
export const useUpdateProveedor = hooks.useUpdate;
export const useDeleteProveedor = hooks.useDelete;

const tipoKeys = createQueryKeys<Record<string, unknown>>('catalogo-productos-tipos-proveedor');

const tipoHooks = createCrudHooks<TipoProveedor, CreateTipoProveedorDTO, UpdateTipoProveedorDTO>(
  tipoProveedorApi,
  tipoKeys,
  'TipoProveedor'
);

export const useTiposProveedor = tipoHooks.useList;
export const useCreateTipoProveedor = tipoHooks.useCreate;
export const useUpdateTipoProveedor = tipoHooks.useUpdate;
export const useDeleteTipoProveedor = tipoHooks.useDelete;
