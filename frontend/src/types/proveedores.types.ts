/**
 * Tipos TypeScript para el módulo de Proveedores
 * Sistema de Gestión StrateKaz
 */

// ==================== PROVEEDOR ====================

export type TipoProveedor = 'MATERIA_PRIMA_EXTERNO' | 'UNIDAD_NEGOCIO' | 'PRODUCTO_SERVICIO';

// ==============================================================================
// CATEGORÍAS PRINCIPALES DE MATERIA PRIMA (para agrupación en UI)
// ==============================================================================
export type CategoriaMateriaPrima = 'HUESO' | 'SEBO_CRUDO' | 'SEBO_PROCESADO' | 'OTROS';

// ==============================================================================
// CÓDIGOS COMPLETOS DE MATERIA PRIMA - CADA UNO CON PRECIO INDEPENDIENTE
// 18 tipos en total
// ==============================================================================
export type CodigoMateriaPrima =
  // ===== HUESO (4 tipos) =====
  | 'HUESO_CRUDO'
  | 'HUESO_SECO'
  | 'HUESO_CALCINADO'
  | 'HUESO_CENIZA'
  // ===== SEBO CRUDO (5 tipos) =====
  | 'SEBO_CRUDO_CARNICERIA'
  | 'SEBO_CRUDO_MATADERO'
  | 'SEBO_CUERO'
  | 'SEBO_CUERO_VIRIL'
  | 'SEBO_POLLO'
  // ===== SEBO PROCESADO (6 tipos por acidez) =====
  | 'SEBO_PROCESADO_A'
  | 'SEBO_PROCESADO_B'
  | 'SEBO_PROCESADO_B1'
  | 'SEBO_PROCESADO_B2'
  | 'SEBO_PROCESADO_B4'
  | 'SEBO_PROCESADO_C'
  // ===== OTROS (3 tipos) =====
  | 'CHICHARRON'
  | 'CABEZAS'
  | 'ACU';

// LEGACY: Mantener compatibilidad con código existente
export type TipoPrincipalMateria = 'HUESO' | 'SEBO' | 'CABEZAS' | 'ACU';
export type SubtipoMateria = TipoPrincipalMateria;

// ==============================================================================
// ESTRUCTURA JERÁRQUICA PARA UI (Selección en formularios)
// ==============================================================================

export interface ItemMateriaPrima {
  codigo: CodigoMateriaPrima;
  nombre: string;
  acidez_min?: number;
  acidez_max?: number;
}

export interface CategoriaMateriaPrimaInfo {
  nombre: string;
  descripcion: string;
  items: ItemMateriaPrima[];
}

export const JERARQUIA_MATERIA_PRIMA: Record<CategoriaMateriaPrima, CategoriaMateriaPrimaInfo> = {
  HUESO: {
    nombre: 'Hueso',
    descripcion: 'Hueso en diferentes estados de procesamiento',
    items: [
      { codigo: 'HUESO_CRUDO', nombre: 'Hueso Crudo' },
      { codigo: 'HUESO_SECO', nombre: 'Hueso Seco' },
      { codigo: 'HUESO_CALCINADO', nombre: 'Hueso Calcinado' },
      { codigo: 'HUESO_CENIZA', nombre: 'Hueso Ceniza' },
    ],
  },
  SEBO_CRUDO: {
    nombre: 'Sebo Crudo',
    descripcion: 'Sebo sin procesar de diferentes orígenes',
    items: [
      { codigo: 'SEBO_CRUDO_CARNICERIA', nombre: 'Sebo Crudo Carnicería' },
      { codigo: 'SEBO_CRUDO_MATADERO', nombre: 'Sebo Crudo Matadero' },
      { codigo: 'SEBO_CUERO', nombre: 'Sebo de Cuero' },
      { codigo: 'SEBO_CUERO_VIRIL', nombre: 'Sebo de Cuero de Viril' },
      { codigo: 'SEBO_POLLO', nombre: 'Sebo Pollo' },
    ],
  },
  SEBO_PROCESADO: {
    nombre: 'Sebo Procesado',
    descripcion: 'Sebo procesado clasificado por nivel de acidez',
    items: [
      { codigo: 'SEBO_PROCESADO_A', nombre: 'Tipo A (1-5% Acidez)', acidez_min: 1, acidez_max: 5 },
      { codigo: 'SEBO_PROCESADO_B', nombre: 'Tipo B (5.1-8% Acidez)', acidez_min: 5.1, acidez_max: 8 },
      { codigo: 'SEBO_PROCESADO_B1', nombre: 'Tipo B1 (8.1-10% Acidez)', acidez_min: 8.1, acidez_max: 10 },
      { codigo: 'SEBO_PROCESADO_B2', nombre: 'Tipo B2 (10.1-15% Acidez)', acidez_min: 10.1, acidez_max: 15 },
      { codigo: 'SEBO_PROCESADO_B4', nombre: 'Tipo B4 (15.1-20% Acidez)', acidez_min: 15.1, acidez_max: 20 },
      { codigo: 'SEBO_PROCESADO_C', nombre: 'Tipo C (>20.1% Acidez)', acidez_min: 20.1, acidez_max: 100 },
    ],
  },
  OTROS: {
    nombre: 'Otros',
    descripcion: 'Otras materias primas',
    items: [
      { codigo: 'CHICHARRON', nombre: 'Chicharrón' },
      { codigo: 'CABEZAS', nombre: 'Cabezas' },
      { codigo: 'ACU', nombre: 'ACU - Aceite de Cocina Usado' },
    ],
  },
};

// Mapeo de código a categoría principal
export const CODIGO_A_CATEGORIA: Record<CodigoMateriaPrima, CategoriaMateriaPrima> = {
  // Hueso
  HUESO_CRUDO: 'HUESO',
  HUESO_SECO: 'HUESO',
  HUESO_CALCINADO: 'HUESO',
  HUESO_CENIZA: 'HUESO',
  // Sebo Crudo
  SEBO_CRUDO_CARNICERIA: 'SEBO_CRUDO',
  SEBO_CRUDO_MATADERO: 'SEBO_CRUDO',
  SEBO_CUERO: 'SEBO_CRUDO',
  SEBO_CUERO_VIRIL: 'SEBO_CRUDO',
  SEBO_POLLO: 'SEBO_CRUDO',
  // Sebo Procesado
  SEBO_PROCESADO_A: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B1: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B2: 'SEBO_PROCESADO',
  SEBO_PROCESADO_B4: 'SEBO_PROCESADO',
  SEBO_PROCESADO_C: 'SEBO_PROCESADO',
  // Otros
  CHICHARRON: 'OTROS',
  CABEZAS: 'OTROS',
  ACU: 'OTROS',
};

// Lista plana de todas las materias primas con su display
export const MATERIAS_PRIMAS_LIST: Array<{ codigo: CodigoMateriaPrima; nombre: string; categoria: CategoriaMateriaPrima }> = [
  // Hueso
  { codigo: 'HUESO_CRUDO', nombre: 'Hueso Crudo', categoria: 'HUESO' },
  { codigo: 'HUESO_SECO', nombre: 'Hueso Seco', categoria: 'HUESO' },
  { codigo: 'HUESO_CALCINADO', nombre: 'Hueso Calcinado', categoria: 'HUESO' },
  { codigo: 'HUESO_CENIZA', nombre: 'Hueso Ceniza', categoria: 'HUESO' },
  // Sebo Crudo
  { codigo: 'SEBO_CRUDO_CARNICERIA', nombre: 'Sebo Crudo Carnicería', categoria: 'SEBO_CRUDO' },
  { codigo: 'SEBO_CRUDO_MATADERO', nombre: 'Sebo Crudo Matadero', categoria: 'SEBO_CRUDO' },
  { codigo: 'SEBO_CUERO', nombre: 'Sebo de Cuero', categoria: 'SEBO_CRUDO' },
  { codigo: 'SEBO_CUERO_VIRIL', nombre: 'Sebo de Cuero de Viril', categoria: 'SEBO_CRUDO' },
  { codigo: 'SEBO_POLLO', nombre: 'Sebo Pollo', categoria: 'SEBO_CRUDO' },
  // Sebo Procesado
  { codigo: 'SEBO_PROCESADO_A', nombre: 'Sebo Procesado Tipo A (1-5%)', categoria: 'SEBO_PROCESADO' },
  { codigo: 'SEBO_PROCESADO_B', nombre: 'Sebo Procesado Tipo B (5.1-8%)', categoria: 'SEBO_PROCESADO' },
  { codigo: 'SEBO_PROCESADO_B1', nombre: 'Sebo Procesado Tipo B1 (8.1-10%)', categoria: 'SEBO_PROCESADO' },
  { codigo: 'SEBO_PROCESADO_B2', nombre: 'Sebo Procesado Tipo B2 (10.1-15%)', categoria: 'SEBO_PROCESADO' },
  { codigo: 'SEBO_PROCESADO_B4', nombre: 'Sebo Procesado Tipo B4 (15.1-20%)', categoria: 'SEBO_PROCESADO' },
  { codigo: 'SEBO_PROCESADO_C', nombre: 'Sebo Procesado Tipo C (>20.1%)', categoria: 'SEBO_PROCESADO' },
  // Otros
  { codigo: 'CHICHARRON', nombre: 'Chicharrón', categoria: 'OTROS' },
  { codigo: 'CABEZAS', nombre: 'Cabezas', categoria: 'OTROS' },
  { codigo: 'ACU', nombre: 'ACU - Aceite de Cocina Usado', categoria: 'OTROS' },
];

// Diccionario para búsqueda rápida
export const CODIGO_MATERIA_PRIMA_DICT: Record<CodigoMateriaPrima, string> = {
  HUESO_CRUDO: 'Hueso Crudo',
  HUESO_SECO: 'Hueso Seco',
  HUESO_CALCINADO: 'Hueso Calcinado',
  HUESO_CENIZA: 'Hueso Ceniza',
  SEBO_CRUDO_CARNICERIA: 'Sebo Crudo Carnicería',
  SEBO_CRUDO_MATADERO: 'Sebo Crudo Matadero',
  SEBO_CUERO: 'Sebo de Cuero',
  SEBO_CUERO_VIRIL: 'Sebo de Cuero de Viril',
  SEBO_POLLO: 'Sebo Pollo',
  SEBO_PROCESADO_A: 'Sebo Procesado Tipo A (1-5%)',
  SEBO_PROCESADO_B: 'Sebo Procesado Tipo B (5.1-8%)',
  SEBO_PROCESADO_B1: 'Sebo Procesado Tipo B1 (8.1-10%)',
  SEBO_PROCESADO_B2: 'Sebo Procesado Tipo B2 (10.1-15%)',
  SEBO_PROCESADO_B4: 'Sebo Procesado Tipo B4 (15.1-20%)',
  SEBO_PROCESADO_C: 'Sebo Procesado Tipo C (>20.1%)',
  CHICHARRON: 'Chicharrón',
  CABEZAS: 'Cabezas',
  ACU: 'ACU - Aceite de Cocina Usado',
};

export type ModalidadLogistica = 'ENTREGA_PLANTA' | 'COMPRA_EN_PUNTO';
export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PASSPORT';
export type FormaPago = 'CONTADO' | 'CHEQUE' | 'TRANSFERENCIA' | 'CREDITO' | 'OTRO';
export type TipoCuenta = 'AHORROS' | 'CORRIENTE';

// ==================== PRECIO MATERIA PRIMA ====================

export interface PrecioMateriaPrima {
  id: number;
  proveedor: number;
  tipo_materia: CodigoMateriaPrima;
  tipo_materia_display: string;
  tipo_principal?: TipoPrincipalMateria;
  tipo_principal_display?: string;
  precio_kg: string;
  modificado_por: number;
  modificado_por_nombre: string;
  modificado_fecha: string;
  vigente_desde?: string;
  created_at: string;
  updated_at: string;
}

export interface Proveedor {
  id: number;
  codigo_interno: string;
  tipo_proveedor: TipoProveedor;
  tipo_proveedor_display: string;
  subtipo_materia?: string[];
  subtipo_materia_display?: string[];
  modalidad_logistica?: ModalidadLogistica | null;
  modalidad_logistica_display?: string;
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: TipoDocumento;
  tipo_documento_display: string;
  numero_documento: string;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion: string;
  ciudad: string;
  departamento: string;
  unidad_negocio?: number | null;
  unidad_negocio_nombre?: string;
  precios_materia_prima?: PrecioMateriaPrima[];
  formas_pago?: string[];
  formas_pago_display?: string[];
  dias_plazo_pago?: number | null;
  banco?: string | null;
  tipo_cuenta?: string | null;
  numero_cuenta?: string | null;
  titular_cuenta?: string | null;
  observaciones?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  es_proveedor_materia_prima: boolean;
  is_deleted: boolean;
}

export interface CreateProveedorDTO {
  tipo_proveedor: TipoProveedor;
  subtipo_materia?: string[];
  modalidad_logistica?: ModalidadLogistica | null;
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  unidad_negocio?: number | null;
  precios?: Array<{ tipo_materia: string; precio_kg: string }>;
  formas_pago?: string[];
  dias_plazo_pago?: number;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  titular_cuenta?: string;
  observaciones?: string;
  is_active?: boolean;
}

export interface UpdateProveedorDTO {
  nombre_comercial?: string;
  razon_social?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  formas_pago?: string[];
  dias_plazo_pago?: number;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  titular_cuenta?: string;
  observaciones?: string;
  is_active?: boolean;
}

export interface CambiarPrecioDTO {
  tipo_materia: string;
  precio_nuevo: string | number;
  motivo: string;
}

// ==================== HISTORIAL DE PRECIO ====================

export type TipoCambioPrecio = 'INICIAL' | 'AUMENTO' | 'REDUCCION' | 'SIN_CAMBIO';

export interface HistorialPrecio {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  tipo_materia?: CodigoMateriaPrima;
  tipo_materia_display?: string;
  precio_anterior?: string | null;
  precio_nuevo: string;
  variacion_precio?: string | null;
  tipo_cambio: TipoCambioPrecio;
  modificado_por: number;
  modificado_por_nombre: string;
  motivo: string;
  fecha_modificacion: string;
  created_at: string;
}

// ==================== CONDICION COMERCIAL ====================

export interface CondicionComercial {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  descripcion: string;
  valor_acordado: string;
  forma_pago?: string | null;
  plazo_entrega?: string | null;
  garantias?: string | null;
  vigencia_desde: string;
  vigencia_hasta?: string | null;
  esta_vigente: boolean;
  created_by?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCondicionComercialDTO {
  proveedor: number;
  descripcion: string;
  valor_acordado: string;
  forma_pago?: string;
  plazo_entrega?: string;
  garantias?: string;
  vigencia_desde: string;
  vigencia_hasta?: string | null;
}

export interface UpdateCondicionComercialDTO {
  descripcion?: string;
  valor_acordado?: string;
  forma_pago?: string;
  plazo_entrega?: string;
  garantias?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string | null;
}

// ==================== FILTROS Y PAGINACIÓN ====================

export interface ProveedorFilters {
  search?: string;
  tipo_proveedor?: TipoProveedor | '';
  subtipo_materia?: SubtipoMateria | '';
  modalidad_logistica?: ModalidadLogistica | '';
  is_active?: boolean | undefined;
  unidad_negocio?: number | '';
  ciudad?: string;
  departamento?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


// ==================== PRUEBA DE ACIDEZ ====================

export type CalidadSebo = 'A' | 'B' | 'B1' | 'B2' | 'B4' | 'C';

export interface PruebaAcidez {
  id: number;
  codigo_voucher: string;
  proveedor: number;
  proveedor_nombre: string;
  proveedor_documento?: string;
  fecha_prueba: string;
  valor_acidez: string;
  calidad_resultante: CalidadSebo;
  calidad_resultante_display: string;
  codigo_materia: string;
  foto_prueba: string;
  foto_prueba_url?: string;
  cantidad_kg: string;
  precio_kg_aplicado: string | null;
  valor_total: string | null;
  observaciones: string | null;
  lote_numero: string | null;
  realizado_por: number;
  realizado_por_nombre: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_deleted: boolean;
}

export interface CreatePruebaAcidezDTO {
  proveedor: number;
  fecha_prueba: string;
  valor_acidez: number;
  foto_prueba: File;
  cantidad_kg: number;
  observaciones?: string;
  lote_numero?: string;
}

export interface SimularPruebaAcidezDTO {
  valor_acidez: number;
  proveedor_id: number;
  cantidad_kg?: number;
}

export interface SimularPruebaAcidezResponse {
  valor_acidez: number;
  calidad_resultante: CalidadSebo;
  calidad_resultante_display: string;
  codigo_materia: string;
  precio_kg: number | null;
  precio_existe: boolean;
  cantidad_kg: number | null;
  valor_total: number | null;
  mensaje: string;
}

export interface PruebaAcidezFilters {
  search?: string;
  proveedor?: number | '';
  calidad_resultante?: CalidadSebo | '';
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

export interface EstadisticasAcidezPorCalidad {
  calidad_resultante: CalidadSebo;
  cantidad: number;
  total_kg: string | null;
  total_valor: string | null;
  acidez_promedio: string | null;
}

export interface EstadisticasAcidez {
  por_calidad: EstadisticasAcidezPorCalidad[];
  totales: {
    total_pruebas: number;
    total_kg: string | null;
    total_valor: string | null;
    acidez_promedio: string | null;
  };
  filtros: {
    fecha_desde: string | null;
    fecha_hasta: string | null;
  };
}
