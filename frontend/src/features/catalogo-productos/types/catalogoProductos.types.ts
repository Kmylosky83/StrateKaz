/**
 * Types: Catálogo de Productos (CT-layer L17)
 * Sincronizados 1:1 con apps/catalogo_productos/serializers.py
 */

// ==================== CATEGORIA PRODUCTO ====================

export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion: string;
  parent: number | null;
  codigo: string;
  orden: number;
  is_system: boolean;
  full_path: string;
  subcategorias_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoriaProductoDTO {
  nombre: string;
  descripcion?: string;
  parent?: number | null;
  codigo?: string;
  orden?: number;
}

export type UpdateCategoriaProductoDTO = Partial<CreateCategoriaProductoDTO>;

// ==================== UNIDAD DE MEDIDA ====================

export type UnidadMedidaTipo = 'PESO' | 'VOLUMEN' | 'LONGITUD' | 'AREA' | 'UNIDAD' | 'OTRO';

export const UNIDAD_MEDIDA_TIPO_LABELS: Record<UnidadMedidaTipo, string> = {
  PESO: 'Peso',
  VOLUMEN: 'Volumen',
  LONGITUD: 'Longitud',
  AREA: 'Área',
  UNIDAD: 'Unidad',
  OTRO: 'Otro',
};

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  tipo: UnidadMedidaTipo;
  factor_conversion: string | null;
  es_base: boolean;
  orden: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUnidadMedidaDTO {
  nombre: string;
  abreviatura: string;
  tipo: UnidadMedidaTipo;
  factor_conversion?: string | null;
  es_base?: boolean;
  orden?: number;
}

export type UpdateUnidadMedidaDTO = Partial<CreateUnidadMedidaDTO>;

// ==================== PRODUCTO ====================

export type ProductoTipo = 'MATERIA_PRIMA' | 'INSUMO' | 'PRODUCTO_TERMINADO' | 'SERVICIO';

export const PRODUCTO_TIPO_LABELS: Record<ProductoTipo, string> = {
  MATERIA_PRIMA: 'Materia prima',
  INSUMO: 'Insumo',
  PRODUCTO_TERMINADO: 'Producto terminado',
  SERVICIO: 'Servicio',
};

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: number | null;
  categoria_nombre: string | null;
  unidad_medida: number;
  unidad_medida_nombre: string;
  unidad_medida_abreviatura: string;
  tipo: ProductoTipo;
  precio_referencia: string | null;
  sku: string;
  notas: string;
  /** H-SC-03: si true, voucher de recepción no aprobable sin RecepcionCalidad. */
  requiere_qc_recepcion: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductoDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  categoria?: number | null;
  unidad_medida: number;
  tipo?: ProductoTipo;
  precio_referencia?: string | null;
  sku?: string;
  notas?: string;
  requiere_qc_recepcion?: boolean;
}

export type UpdateProductoDTO = Partial<CreateProductoDTO>;

// ==================== ESPECIFICACIÓN DE CALIDAD (H-SC-03) ====================

export interface ProductoEspecCalidadParametro {
  id: number;
  espec_calidad: number;
  nombre_parametro: string;
  descripcion: string;
  unidad: string;
  valor_min: string;
  valor_max: string;
  es_critico: boolean;
  orden: number;
}

export interface CreateProductoEspecCalidadParametroDTO {
  espec_calidad?: number;
  nombre_parametro: string;
  descripcion?: string;
  unidad: string;
  valor_min: string | number;
  valor_max: string | number;
  es_critico?: boolean;
  orden?: number;
}

export interface ProductoEspecCalidad {
  id: number;
  producto: number;
  acidez_min: string;
  acidez_max: string;
  requiere_prueba_acidez: boolean;
  parametros_adicionales: Record<string, unknown>;
  parametros: ProductoEspecCalidadParametro[];
}
