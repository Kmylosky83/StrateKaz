/**
 * Tipos TypeScript para el módulo de Organización
 *
 * Incluye:
 * - Normas ISO (catálogo dinámico)
 * - Unidades de Medida
 * - Consecutivos
 */

// ============================================================================
// NORMAS ISO (Catálogo Dinámico)
// ============================================================================

export interface NormaISO {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  description?: string | null;
  category: string;
  category_display?: string;
  version?: string | null;
  icon: string | null;
  color: string | null;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface NormaISOChoices {
  normas: Array<{
    value: number;
    label: string;
    code: string;
    name: string;
    short_name: string | null;
    icon: string | null;
    color: string | null;
    category: string;
  }>;
  categorias: Array<{ value: string; label: string }>;
}

/**
 * Norma ISO para selector en objetivos estratégicos
 * Viene del endpoint GET /planeacion/objetivos/normas-iso-choices/
 */
export interface NormaISOChoice {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  icon: string | null;
  color: string | null;
  category: string | null;
  // Campos de compatibilidad para SelectOption
  value: number;
  label: string;
}

export interface CreateNormaISODTO {
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  orden?: number;
  is_active?: boolean;
}

export interface UpdateNormaISODTO {
  code?: string;
  name?: string;
  short_name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  orden?: number;
  is_active?: boolean;
}

export interface NormaISOFilters {
  category?: string;
  es_sistema?: boolean;
  is_active?: boolean;
  search?: string;
}

// ============================================================================
// UNIDADES DE MEDIDA (MC-001)
// ============================================================================

export type CategoriaUnidad =
  | 'MASA'
  | 'VOLUMEN'
  | 'LONGITUD'
  | 'AREA'
  | 'CANTIDAD'
  | 'TIEMPO'
  | 'CONTENEDOR'
  | 'OTRO';

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  nombre_plural: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  categoria_display: string;
  unidad_base: number | null;
  unidad_base_nombre: string | null;
  unidad_base_simbolo: string | null;
  factor_conversion: string;
  decimales_display: number;
  prefiere_notacion_cientifica: boolean;
  usar_separador_miles: boolean;
  descripcion: string | null;
  es_sistema: boolean;
  orden_display: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadMedidaList {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  categoria_display: string;
  decimales_display: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface CreateUnidadMedidaDTO {
  codigo: string;
  nombre: string;
  nombre_plural?: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  unidad_base?: number | null;
  factor_conversion?: string;
  decimales_display?: number;
  prefiere_notacion_cientifica?: boolean;
  usar_separador_miles?: boolean;
  descripcion?: string;
  orden_display?: number;
  is_active?: boolean;
}

export type UpdateUnidadMedidaDTO = Partial<CreateUnidadMedidaDTO>;

export interface UnidadMedidaFilters {
  categoria?: CategoriaUnidad;
  es_sistema?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface UnidadMedidaChoices {
  unidades: Array<{
    value: number;
    label: string;
    codigo: string;
    simbolo: string;
    categoria: CategoriaUnidad;
    es_sistema: boolean;
  }>;
  categorias: Array<{ value: string; label: string }>;
  unidades_base: Array<{
    value: number;
    label: string;
    codigo: string;
    categoria: CategoriaUnidad;
  }>;
}

export interface ConversionResult {
  valor_original: number;
  unidad_origen: { codigo: string; simbolo: string; nombre: string };
  valor_convertido: number;
  unidad_destino: { codigo: string; simbolo: string; nombre: string };
}

export interface FormateoResult {
  valor_original: number;
  valor_formateado: string;
  unidad: { codigo: string; simbolo: string; nombre: string };
}

// ============================================================================
// CONSECUTIVOS (MC-002)
// ============================================================================

export type CategoriaConsecutivo =
  | 'DOCUMENTOS'
  | 'COMPRAS'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'CONTABILIDAD'
  | 'PRODUCCION'
  | 'CALIDAD'
  | 'RRHH'
  | 'SST'
  | 'AMBIENTAL'
  | 'GENERAL';

export type SeparadorConsecutivo = '-' | '/' | '_' | '.' | '';

export interface ConsecutivoConfig {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaConsecutivo;
  categoria_display: string;
  prefix: string;
  suffix: string;
  separator: SeparadorConsecutivo;
  separator_display: string;
  current_number: number;
  padding: number;
  numero_inicial: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date: string | null;
  es_sistema: boolean;
  is_active: boolean;
  ejemplo_formato: string;
  created_at: string;
  updated_at: string;
}

export interface ConsecutivoConfigList {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaConsecutivo;
  categoria_display: string;
  prefix: string;
  current_number: number;
  es_sistema: boolean;
  is_active: boolean;
  ejemplo_formato: string;
}

export interface CreateConsecutivoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaConsecutivo;
  prefix: string;
  suffix?: string;
  separator?: SeparadorConsecutivo;
  padding?: number;
  numero_inicial?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
}

export type UpdateConsecutivoDTO = Partial<CreateConsecutivoDTO>;

export interface ConsecutivoFilters {
  categoria?: CategoriaConsecutivo;
  es_sistema?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface ConsecutivoChoices {
  categorias: Array<{ value: string; label: string }>;
  separadores: Array<{ value: string; label: string }>;
  consecutivos: Array<{
    value: number;
    label: string;
    codigo: string;
    categoria: CategoriaConsecutivo;
    ejemplo: string;
  }>;
}

export interface GenerarConsecutivoResult {
  consecutivo: string;
  numero: number;
  codigo: string;
}

export interface PreviewConsecutivoParams {
  prefix: string;
  suffix?: string;
  separator?: SeparadorConsecutivo;
  padding?: number;
  numero?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
}
