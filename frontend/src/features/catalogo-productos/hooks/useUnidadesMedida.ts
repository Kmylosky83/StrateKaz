import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { unidadMedidaApi } from '../api/catalogoProductos.api';
import type {
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO,
} from '../types/catalogoProductos.types';

const keys = createQueryKeys<Record<string, unknown>>('catalogo-unidades-medida');

const hooks = createCrudHooks<UnidadMedida, CreateUnidadMedidaDTO, UpdateUnidadMedidaDTO>(
  unidadMedidaApi,
  keys,
  'Unidad de medida',
  { isFeminine: true }
);

export const useUnidadesMedida = hooks.useList;
export const useUnidadMedida = hooks.useDetail;
export const useCreateUnidadMedida = hooks.useCreate;
export const useUpdateUnidadMedida = hooks.useUpdate;
export const useDeleteUnidadMedida = hooks.useDelete;
