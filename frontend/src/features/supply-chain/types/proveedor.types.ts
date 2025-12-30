/**
 * Tipos para Proveedores y Gestión de Precios
 * Backend: backend/apps/supply_chain/gestion_proveedores/models.py
 */

import type { BaseTimestamped } from './catalogos.types';

// ==================== UNIDAD DE NEGOCIO ====================

/**
 * Unidad de Negocio (plantas/sucursales internas que venden a otras unidades)
 */
export interface UnidadNegocio extends BaseTimestamped {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  responsable?: string;
  es_planta_produccion: boolean;
  es_centro_distribucion: boolean;
  is_active: boolean;
}

export interface CreateUnidadNegocioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  responsable?: string;
  es_planta_produccion?: boolean;
  es_centro_distribucion?: boolean;
  is_active?: boolean;
}

export type UpdateUnidadNegocioDTO = Partial<CreateUnidadNegocioDTO>;

// ==================== PROVEEDOR ====================

/**
 * Proveedor principal con toda la información
 */
export interface Proveedor extends BaseTimestamped {
  id: number;
  codigo: string;

  // Tipo de proveedor
  tipo_proveedor: number;
  tipo_proveedor_nombre?: string;

  // Si es unidad de negocio interna
  unidad_negocio?: number;
  unidad_negocio_nombre?: string;

  // Tipos de materia prima que suministra
  tipos_materia_prima: number[];
  tipos_materia_prima_nombres?: string[];

  // Modalidad logística
  modalidad_logistica?: number;
  modalidad_logistica_nombre?: string;

  // Información básica
  razon_social: string;
  nombre_comercial?: string;
  tipo_documento: number;
  tipo_documento_nombre?: string;
  numero_documento: string;
  digito_verificacion?: string;

  // Contacto
  telefono?: string;
  celular?: string;
  email?: string;
  sitio_web?: string;

  // Ubicación
  departamento?: number;
  departamento_nombre?: string;
  ciudad?: number;
  ciudad_nombre?: string;
  direccion?: string;
  barrio?: string;

  // Representante legal
  nombre_representante_legal?: string;
  tipo_documento_representante?: number;
  documento_representante?: string;
  email_representante?: string;
  telefono_representante?: string;

  // Información bancaria
  banco?: string;
  tipo_cuenta?: number;
  tipo_cuenta_nombre?: string;
  numero_cuenta?: string;

  // Condiciones comerciales
  forma_pago_default?: number;
  forma_pago_default_nombre?: string;
  dias_pago_default?: number;
  aplica_retencion_fuente: boolean;
  porcentaje_retencion?: number;

  // Estado y evaluación
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO';
  es_proveedor_critico: boolean;
  calificacion_actual?: number;

  // Fechas
  fecha_ultima_compra?: string;
  fecha_ultima_evaluacion?: string;

  // Observaciones
  observaciones?: string;

  is_active: boolean;
}

/**
 * Proveedor para listados (vista resumida)
 */
export interface ProveedorList {
  id: number;
  codigo: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_proveedor_nombre: string;
  numero_documento: string;
  telefono?: string;
  email?: string;
  estado: string;
  calificacion_actual?: number;
  tipos_materia_prima_nombres: string[];
  is_active: boolean;
}

export interface CreateProveedorDTO {
  codigo: string;
  tipo_proveedor: number;
  unidad_negocio?: number;
  tipos_materia_prima: number[];
  modalidad_logistica?: number;
  razon_social: string;
  nombre_comercial?: string;
  tipo_documento: number;
  numero_documento: string;
  digito_verificacion?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  sitio_web?: string;
  departamento?: number;
  ciudad?: number;
  direccion?: string;
  barrio?: string;
  nombre_representante_legal?: string;
  tipo_documento_representante?: number;
  documento_representante?: string;
  email_representante?: string;
  telefono_representante?: string;
  banco?: string;
  tipo_cuenta?: number;
  numero_cuenta?: string;
  forma_pago_default?: number;
  dias_pago_default?: number;
  aplica_retencion_fuente?: boolean;
  porcentaje_retencion?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO';
  es_proveedor_critico?: boolean;
  observaciones?: string;
  is_active?: boolean;
}

export type UpdateProveedorDTO = Partial<CreateProveedorDTO>;

// ==================== PRECIOS DE MATERIA PRIMA ====================

/**
 * Precio actual de materia prima por proveedor
 */
export interface PrecioMateriaPrima {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  tipo_materia_prima: number;
  tipo_materia_prima_nombre?: string;
  precio_unitario: number;
  fecha_vigencia: string;
  created_at: string;
  updated_at: string;
}

/**
 * Historial de cambios de precio
 */
export interface HistorialPrecioProveedor extends BaseTimestamped {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  tipo_materia_prima: number;
  tipo_materia_prima_nombre?: string;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_cambio: string;
  motivo_cambio?: string;
  usuario_cambio?: number;
  usuario_cambio_nombre?: string;
  porcentaje_variacion: number;
}

export interface CambiarPrecioDTO {
  tipo_materia_prima: number;
  precio_nuevo: number;
  motivo_cambio?: string;
}

// ==================== CONDICIONES COMERCIALES ====================

/**
 * Condiciones comerciales específicas por proveedor
 */
export interface CondicionComercialProveedor extends BaseTimestamped {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  forma_pago: number;
  forma_pago_nombre?: string;
  dias_pago: number;
  descuento_pronto_pago?: number;
  monto_minimo_compra?: number;
  aplica_flete: boolean;
  valor_flete?: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string;
  observaciones?: string;
  is_active: boolean;
}

export interface CreateCondicionComercialDTO {
  proveedor: number;
  forma_pago: number;
  dias_pago: number;
  descuento_pronto_pago?: number;
  monto_minimo_compra?: number;
  aplica_flete?: boolean;
  valor_flete?: number;
  fecha_vigencia_desde: string;
  fecha_vigencia_hasta?: string;
  observaciones?: string;
  is_active?: boolean;
}

export type UpdateCondicionComercialDTO = Partial<CreateCondicionComercialDTO>;

// ==================== ESTADÍSTICAS ====================

export interface EstadisticasProveedores {
  total_proveedores: number;
  proveedores_activos: number;
  proveedores_inactivos: number;
  proveedores_criticos: number;
  por_tipo: Array<{
    tipo: string;
    count: number;
  }>;
  por_estado: Array<{
    estado: string;
    count: number;
  }>;
  calificacion_promedio: number;
  total_materias_primas: number;
}
