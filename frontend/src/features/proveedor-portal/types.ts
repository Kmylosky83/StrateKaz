/**
 * Tipos para el Portal Proveedor (usuarios externos vinculados a un Proveedor)
 */

// ============================================================================
// PROVEEDOR
// ============================================================================

export interface TipoDocumentoData {
  id: number;
  nombre: string;
  codigo: string;
}

export interface TipoProveedorData {
  id: number;
  nombre: string;
}

export interface DepartamentoData {
  id: number;
  nombre: string;
}

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
