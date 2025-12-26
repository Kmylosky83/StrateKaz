/**
 * Tipos TypeScript para Requisitos Legales
 * Backend: backend/apps/motor_cumplimiento/requisitos_legales/
 */

// ============================================================================
// ENUMS (todos en minúsculas como el backend)
// ============================================================================

export type EstadoRequisito =
  | 'vigente'
  | 'proximo_vencer'
  | 'vencido'
  | 'en_tramite'
  | 'renovando'
  | 'no_aplica';

export type TipoAlerta = 'email' | 'sistema' | 'ambos';

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface BaseTimestamped {
  created_at: string;
  updated_at: string;
}

export interface BaseSoftDelete {
  is_active: boolean;
  deleted_at?: string | null;
}

// ============================================================================
// TIPO REQUISITO
// ============================================================================

export interface TipoRequisito extends BaseTimestamped, BaseSoftDelete {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_renovacion: boolean;
  dias_anticipacion_alerta: number;
}

export interface TipoRequisitoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_renovacion?: boolean;
  dias_anticipacion_alerta?: number;
}

// ============================================================================
// REQUISITO LEGAL
// ============================================================================

export interface RequisitoLegal extends BaseTimestamped {
  id: number;
  tipo: number;
  tipo_nombre: string; // read-only
  codigo: string;
  nombre: string;
  descripcion?: string;
  entidad_emisora: string;
  base_legal?: string;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  es_obligatorio: boolean;
  periodicidad_renovacion?: string;
  is_active: boolean;
  created_by?: number | null;
}

export interface RequisitoLegalCreate {
  tipo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  entidad_emisora: string;
  base_legal?: string;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  es_obligatorio?: boolean;
  periodicidad_renovacion?: string;
}

// ============================================================================
// EMPRESA REQUISITO
// ============================================================================

export interface EmpresaRequisito extends BaseTimestamped {
  id: number;
  empresa_id: number;
  requisito: number;
  requisito_nombre: string; // read-only
  numero_documento?: string;
  fecha_expedicion?: string | null; // ISO date
  fecha_vencimiento?: string | null; // ISO date
  estado: EstadoRequisito;
  estado_display: string; // read-only
  documento_soporte?: string | null; // URL del archivo
  responsable?: number | null;
  responsable_nombre: string; // read-only
  observaciones?: string;
  justificacion_no_aplica?: string;
  requisito_anterior?: number | null;
  is_active: boolean;
  created_by?: number | null;
  dias_para_vencer: number | null; // read-only property
}

export interface EmpresaRequisitoCreate {
  empresa_id: number;
  requisito: number;
  numero_documento?: string;
  fecha_expedicion?: string | null;
  fecha_vencimiento?: string | null;
  estado?: EstadoRequisito;
  documento_soporte?: File | null;
  responsable?: number | null;
  observaciones?: string;
  justificacion_no_aplica?: string;
  requisito_anterior?: number | null;
}

// ============================================================================
// ALERTA VENCIMIENTO
// ============================================================================

export interface AlertaVencimiento {
  id: number;
  empresa_requisito: number;
  dias_antes: number;
  tipo_alerta: TipoAlerta;
  destinatarios?: string;
  fecha_programada: string; // ISO date
  enviada: boolean;
  fecha_envio?: string | null; // ISO datetime
  mensaje_personalizado?: string;
  created_at: string;
}

export interface AlertaVencimientoCreate {
  empresa_requisito: number;
  dias_antes: number;
  tipo_alerta: TipoAlerta;
  destinatarios?: string;
  fecha_programada: string;
  mensaje_personalizado?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

export const ESTADOS_REQUISITO: Array<{ value: EstadoRequisito; label: string }> = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'proximo_vencer', label: 'Próximo a Vencer' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'en_tramite', label: 'En Trámite' },
  { value: 'renovando', label: 'En Renovación' },
  { value: 'no_aplica', label: 'No Aplica' },
];

export const TIPOS_ALERTA: Array<{ value: TipoAlerta; label: string }> = [
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'sistema', label: 'Notificación Sistema' },
  { value: 'ambos', label: 'Correo y Sistema' },
];
