/**
 * Tipos para el Portal Proveedor (usuarios externos vinculados a un Proveedor)
 */

// ============================================================================
// CATÁLOGOS
// ============================================================================

export interface TipoDocumentoData {
  id: number;
  nombre: string;
  codigo: string;
}

export interface TipoProveedorData {
  id: number;
  nombre: string;
  codigo: string;
  requiere_materia_prima: boolean;
  requiere_modalidad_logistica: boolean;
}

export interface DepartamentoData {
  id: number;
  nombre: string;
}

// ============================================================================
// PROVEEDOR (Mi Empresa)
// ============================================================================

/** Datos del Proveedor vinculado al usuario externo */
export interface MiEmpresaData {
  id: number;
  codigo_interno: string;
  nombre_comercial: string;
  razon_social: string;
  tipo_documento: number;
  tipo_documento_data: TipoDocumentoData | null;
  numero_documento: string;
  nit: string | null;
  tipo_proveedor: number;
  tipo_proveedor_data: TipoProveedorData | null;
  telefono: string | null;
  email: string | null;
  direccion: string;
  ciudad: string;
  departamento: number | null;
  departamento_data: DepartamentoData | null;
  is_active: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

/** Código del tipo de proveedor */
export type TipoProveedorCodigo =
  | 'MATERIA_PRIMA'
  | 'PRODUCTOS_SERVICIOS'
  | 'UNIDAD_NEGOCIO'
  | 'TRANSPORTISTA'
  | 'CONSULTOR'
  | 'CONTRATISTA';

// ============================================================================
// CONTRATOS (CondicionComercialProveedor)
// ============================================================================

export interface ContratoProveedor {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  descripcion: string;
  valor_acordado: string;
  forma_pago: string | null;
  plazo_entrega: string | null;
  garantias: string | null;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  esta_vigente: boolean;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EVALUACIONES
// ============================================================================

export type EstadoEvaluacion = 'BORRADOR' | 'EN_PROCESO' | 'COMPLETADA' | 'APROBADA';

export interface EvaluacionProveedor {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  periodo: string;
  fecha_evaluacion: string;
  estado: EstadoEvaluacion;
  estado_display: string;
  calificacion_total: string | null;
  observaciones: string | null;
  evaluado_por: number;
  evaluado_por_nombre: string;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRECIOS DE MATERIA PRIMA (Portal)
// ============================================================================

export interface PrecioMateriaPrimaPortal {
  id: number;
  proveedor: number;
  tipo_materia: number;
  tipo_materia_nombre: string;
  tipo_materia_codigo: string;
  categoria_nombre: string;
  precio_kg: string;
  modificado_por: number;
  modificado_por_nombre: string;
  modificado_fecha: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROFESIONALES (Consultoras — Mis Profesionales)
// ============================================================================

export interface ProfesionalProveedor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cargo_name: string | null;
  is_active: boolean;
  last_login: string | null;
  date_joined: string | null;
  es_yo: boolean;
}
