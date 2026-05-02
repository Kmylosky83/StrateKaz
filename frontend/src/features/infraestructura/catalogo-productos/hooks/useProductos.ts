import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { productoApi } from '../api/catalogoProductos.api';
import type {
  Producto,
  CreateProductoDTO,
  UpdateProductoDTO,
} from '../types/catalogoProductos.types';

const keys = createQueryKeys<Record<string, unknown>>('catalogo-productos');

const hooks = createCrudHooks<Producto, CreateProductoDTO, UpdateProductoDTO>(
  productoApi,
  keys,
  'Producto'
);

export const useProductos = hooks.useList;
export const useProducto = hooks.useDetail;
export const useCreateProducto = hooks.useCreate;
export const useUpdateProducto = hooks.useUpdate;
export const useDeleteProducto = hooks.useDelete;
