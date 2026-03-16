/**
 * Tipos para Proveedores y Gestión de Precios
 * Backend: backend/apps/supply_chain/gestion_proveedores/models.py
 * Serializers: backend/apps/supply_chain/gestion_proveedores/serializers.py
 */

// ==================== PROVEEDOR ====================

/**
 * Proveedor detalle completo (ProveedorDetailSerializer - fields='__all__')
 */
export interface Proveedor {
  id: number;
  codigo_interno: string;

  // Tipo de proveedor
  tipo_proveedor: number;
  tipo_proveedor_data?: {
    id: number;
    codigo: string;
    nombre: string;
    requiere_materia_prima: boolean;
    requiere_modalidad_logistica: boolean;
  };

  // Tipos de materia prima (M2M)
  tipos_materia_prima: number[];
  tipos_materia_prima_data?: Array<{ id: number; nombre: string; codigo?: string }>;

  // Modalidad logística
  modalidad_logistica?: number;
  modalidad_logistica_data?: { id: number; nombre: string };

  // Información básica
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: number;
  tipo_documento_data?: { id: number; nombre: string; codigo?: string };
  numero_documento: string;
  nit?: string;

  // Contacto
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: number;
  departamento_data?: { id: number; nombre: string };

  // Unidad de negocio
  unidad_negocio?: number;
  unidad_negocio_data?: { id: number; nombre: string; codigo?: string };

  // Información financiera
  formas_pago: number[];
  formas_pago_data?: Array<{ id: number; nombre: string }>;
  dias_plazo_pago?: number;

  // Información bancaria
  banco?: string;
  tipo_cuenta?: number;
  tipo_cuenta_data?: { id: number; nombre: string };
  numero_cuenta?: string;
  titular_cuenta?: string;

  // Precios
  precios_materia_prima?: PrecioMateriaPrima[];
  es_proveedor_materia_prima: boolean;

  // Consultor independiente
  es_independiente: boolean;

  // Vínculo Parte Interesada (C1)
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;

  // Metadatos
  observaciones?: string;
  is_active: boolean;
  created_by?: number;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_deleted: boolean;
}

/**
 * Proveedor para listados (ProveedorListSerializer - vista resumida)
 */
export interface ProveedorList {
  id: number;
  codigo_interno: string;
  tipo_proveedor: number;
  tipo_proveedor_nombre: string;
  tipo_proveedor_codigo: string;
  tipos_materia_prima: number[];
  tipos_materia_prima_display: string[];
  modalidad_logistica?: number;
  modalidad_logistica_nombre?: string;
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: number;
  tipo_documento_nombre: string;
  numero_documento: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: number;
  departamento_nombre?: string;
  unidad_negocio?: number;
  unidad_negocio_nombre?: string;
  formas_pago: number[];
  formas_pago_display: string[];
  dias_plazo_pago?: number;
  banco?: string;
  tipo_cuenta?: number;
  numero_cuenta?: string;
  titular_cuenta?: string;
  precios_materia_prima?: PrecioMateriaPrima[];
  es_proveedor_materia_prima: boolean;
  es_independiente: boolean;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  observaciones?: string;
  is_active: boolean;
  created_by_nombre?: string;
  created_at: string;
  usuarios_vinculados_count: number;
  tiene_acceso: boolean;
}

/**
 * DTO para crear proveedor (ProveedorCreateSerializer)
 */
export interface CreateProveedorDTO {
  tipo_proveedor: number;
  tipos_materia_prima?: number[];
  modalidad_logistica?: number;
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: number;
  numero_documento: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: number;
  unidad_negocio?: number;
  formas_pago?: number[];
  dias_plazo_pago?: number;
  banco?: string;
  tipo_cuenta?: number;
  numero_cuenta?: string;
  titular_cuenta?: string;
  precios?: Array<{ tipo_materia_id: number; precio_kg: string }>;
  es_independiente?: boolean;
  observaciones?: string;
  is_active?: boolean;
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
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
  tipo_materia: number;
  tipo_materia_nombre?: string;
  tipo_materia_codigo?: string;
  categoria_nombre?: string;
  precio_kg: string;
  modificado_por?: number;
  modificado_por_nombre?: string;
  modificado_fecha?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Historial de cambios de precio
 * Backend: HistorialPrecioSerializer
 */
export interface HistorialPrecioProveedor {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  tipo_materia: number;
  tipo_materia_nombre?: string;
  precio_anterior: string | null;
  precio_nuevo: string;
  variacion_precio?: string;
  tipo_cambio?: string;
  modificado_por?: number;
  modificado_por_nombre?: string;
  motivo?: string;
  fecha_modificacion: string;
  created_at: string;
}

/**
 * Backend: CambiarPrecioSerializer
 */
export interface CambiarPrecioDTO {
  tipo_materia_id: number;
  precio_nuevo: number;
  motivo: string;
}

// ==================== CONDICIONES COMERCIALES ====================

/**
 * Condiciones comerciales específicas por proveedor
 */
export interface CondicionComercialProveedor {
  id: number;
  proveedor: number;
  proveedor_nombre?: string;
  descripcion: string;
  valor_acordado: string;
  forma_pago?: string;
  plazo_entrega?: string;
  garantias?: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
  esta_vigente?: boolean;
  created_by?: number;
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
  vigencia_hasta?: string;
}

export type UpdateCondicionComercialDTO = Partial<CreateCondicionComercialDTO>;

// ==================== ESTADÍSTICAS ====================

export interface EstadisticasProveedores {
  total_proveedores: number;
  proveedores_activos: number;
  proveedores_inactivos: number;
  por_tipo: Array<{
    tipo: string;
    count: number;
  }>;
  calificacion_promedio: number | null;
  total_materias_primas: number;
}
