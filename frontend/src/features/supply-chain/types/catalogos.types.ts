/**
 * Tipos para Catálogos Dinámicos - Gestión de Proveedores
 * Backend: backend/apps/supply_chain/gestion_proveedores/models.py
 *
 * 9 Catálogos dinámicos configurables desde base de datos
 */

// ==================== TIPOS BASE ====================

export interface BaseTimestamped {
  created_at: string;
  updated_at: string;
}

export interface BaseCatalogo extends BaseTimestamped {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  is_active: boolean;
}

// ==================== CATÁLOGOS ====================

/**
 * Categoría de Materia Prima
 * Ejemplos: HUESO, SEBO_CRUDO, SEBO_PROCESADO, OTROS
 */
export type CategoriaMateriaPrima = BaseCatalogo;

/**
 * Tipo de Materia Prima (relacionado con CategoriaMateriaPrima)
 * Ejemplos: HUESO_CRUDO, SEBO_PROCESADO_A, SEBO_PROCESADO_B, ACU
 */
export interface TipoMateriaPrima extends BaseCatalogo {
  categoria: number;
  categoria_nombre?: string;
  acidez_min?: number;
  acidez_max?: number;
  codigo_legacy?: string;
}

/**
 * Tipo de Proveedor
 * Ejemplos: MATERIA_PRIMA_EXTERNO, UNIDAD_NEGOCIO, PRODUCTO_SERVICIO
 */
export interface TipoProveedor extends BaseCatalogo {
  requiere_materia_prima: boolean;
  requiere_modalidad_logistica: boolean;
}

/**
 * Modalidad Logística
 * Ejemplos: ENTREGA_PLANTA, COMPRA_EN_PUNTO
 */
export type ModalidadLogistica = BaseCatalogo;

/**
 * Forma de Pago
 * Ejemplos: EFECTIVO, TRANSFERENCIA, CHEQUE
 */
export type FormaPago = BaseCatalogo;

/**
 * Tipo de Cuenta Bancaria
 * Ejemplos: AHORROS, CORRIENTE
 */
export type TipoCuentaBancaria = BaseCatalogo;

/**
 * Tipo de Documento de Identidad
 * Ejemplos: CC, NIT, CE, PASAPORTE
 */
export type TipoDocumentoIdentidad = BaseCatalogo;

/**
 * Departamento (Colombia)
 */
export interface Departamento extends BaseCatalogo {
  codigo_dane?: string;
}

/**
 * Ciudad (relacionada con Departamento)
 */
export interface Ciudad extends BaseCatalogo {
  departamento: number;
  departamento_nombre?: string;
  codigo_dane?: string;
}

// ==================== DTOs PARA CREATE/UPDATE ====================

export interface CreateCategoriaMateriaPrimaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateTipoMateriaPrimaDTO {
  categoria: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  acidez_min?: number;
  acidez_max?: number;
  codigo_legacy?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateTipoProveedorDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_materia_prima?: boolean;
  requiere_modalidad_logistica?: boolean;
  orden?: number;
  is_active?: boolean;
}

export interface CreateModalidadLogisticaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateFormaPagoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateTipoCuentaBancariaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateTipoDocumentoIdentidadDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateDepartamentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  codigo_dane?: string;
  orden?: number;
  is_active?: boolean;
}

export interface CreateCiudadDTO {
  departamento: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  codigo_dane?: string;
  orden?: number;
  is_active?: boolean;
}

// ==================== TIPOS AUXILIARES ====================

export type UpdateCategoriaMateriaPrimaDTO = Partial<CreateCategoriaMateriaPrimaDTO>;
export type UpdateTipoMateriaPrimaDTO = Partial<CreateTipoMateriaPrimaDTO>;
export type UpdateTipoProveedorDTO = Partial<CreateTipoProveedorDTO>;
export type UpdateModalidadLogisticaDTO = Partial<CreateModalidadLogisticaDTO>;
export type UpdateFormaPagoDTO = Partial<CreateFormaPagoDTO>;
export type UpdateTipoCuentaBancariaDTO = Partial<CreateTipoCuentaBancariaDTO>;
export type UpdateTipoDocumentoIdentidadDTO = Partial<CreateTipoDocumentoIdentidadDTO>;
export type UpdateDepartamentoDTO = Partial<CreateDepartamentoDTO>;
export type UpdateCiudadDTO = Partial<CreateCiudadDTO>;
