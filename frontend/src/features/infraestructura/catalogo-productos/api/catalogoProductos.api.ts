/**
 * API Client: Catálogo de Productos (CT-layer L17)
 * Backend: /api/catalogo-productos/{categorias,unidades-medida,productos}/
 */
import { createApiClient } from '@/lib/api-factory';
import type {
  CategoriaProducto,
  CreateCategoriaProductoDTO,
  UpdateCategoriaProductoDTO,
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO,
  Producto,
  CreateProductoDTO,
  UpdateProductoDTO,
} from '../types/catalogoProductos.types';

const BASE_URL = '/catalogo-productos';

export const categoriaProductoApi = createApiClient<
  CategoriaProducto,
  CreateCategoriaProductoDTO,
  UpdateCategoriaProductoDTO
>(BASE_URL, 'categorias');

export const unidadMedidaApi = createApiClient<
  UnidadMedida,
  CreateUnidadMedidaDTO,
  UpdateUnidadMedidaDTO
>(BASE_URL, 'unidades-medida');

export const productoApi = createApiClient<Producto, CreateProductoDTO, UpdateProductoDTO>(
  BASE_URL,
  'productos'
);
