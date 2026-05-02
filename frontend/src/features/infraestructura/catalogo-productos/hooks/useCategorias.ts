import { createCrudHooks } from '@/lib/crud-hooks-factory';
import { createQueryKeys } from '@/lib/query-keys';
import { categoriaProductoApi } from '../api/catalogoProductos.api';
import type {
  CategoriaProducto,
  CreateCategoriaProductoDTO,
  UpdateCategoriaProductoDTO,
} from '../types/catalogoProductos.types';

const keys = createQueryKeys<Record<string, unknown>>('catalogo-categorias');

const hooks = createCrudHooks<
  CategoriaProducto,
  CreateCategoriaProductoDTO,
  UpdateCategoriaProductoDTO
>(categoriaProductoApi, keys, 'Categoría', { isFeminine: true });

export const useCategorias = hooks.useList;
export const useCategoria = hooks.useDetail;
export const useCreateCategoria = hooks.useCreate;
export const useUpdateCategoria = hooks.useUpdate;
export const useDeleteCategoria = hooks.useDelete;
