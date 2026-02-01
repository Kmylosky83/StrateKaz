/**
 * Tipos TypeScript para Reglamentos Internos
 * Backend: backend/apps/motor_cumplimiento/reglamentos_internos/
 */

// ============================================================================
// ENUMS (todos en minúsculas como el backend)
// ============================================================================

export type EstadoReglamento =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'vigente'
  | 'obsoleto';

export type MedioPublicacion =
  | 'cartelera'
  | 'email'
  | 'intranet'
  | 'reunion'
  | 'impreso';

export type TipoSocializacion =
  | 'induccion'
  | 'reinduccion'
  | 'capacitacion'
  | 'reunion'
  | 'virtual';

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

export interface BaseOrdered {
  orden: number;
}

// ============================================================================
// TIPO REGLAMENTO
// ============================================================================

export interface TipoReglamento
  extends BaseTimestamped,
    BaseSoftDelete,
    BaseOrdered {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_aprobacion_legal: boolean;
  vigencia_anios: number;
}

export interface TipoReglamentoCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_aprobacion_legal?: boolean;
  vigencia_anios?: number;
  orden?: number;
}

// ============================================================================
// REGLAMENTO
// ============================================================================

export interface Reglamento
  extends BaseTimestamped,
    BaseSoftDelete,
    BaseOrdered {
  id: number;
  empresa_id: number;
  tipo: number;
  tipo_nombre: string; // read-only
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: EstadoReglamento;
  estado_display: string; // read-only
  version_actual: string;
  fecha_aprobacion?: string | null; // ISO date
  fecha_vigencia?: string | null; // ISO date
  fecha_proxima_revision?: string | null; // ISO date
  aprobado_por?: number | null;
  aprobado_por_nombre: string; // read-only
  documento?: string | null; // URL del archivo
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  observaciones?: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ReglamentoCreate {
  empresa_id: number;
  tipo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado?: EstadoReglamento;
  version_actual?: string;
  fecha_aprobacion?: string | null;
  fecha_vigencia?: string | null;
  fecha_proxima_revision?: string | null;
  aprobado_por?: number | null;
  documento?: File | null;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  observaciones?: string;
  orden?: number;
}

// ============================================================================
// VERSION REGLAMENTO
// ============================================================================

export interface VersionReglamento {
  id: number;
  reglamento: number;
  numero_version: string;
  fecha_version: string; // ISO date
  cambios_realizados: string;
  motivo_cambio?: string;
  documento?: string | null; // URL del archivo
  elaborado_por?: number | null;
  elaborado_por_nombre: string; // read-only
  revisado_por?: number | null;
  aprobado_por?: number | null;
  fecha_aprobacion?: string | null; // ISO date
  created_at: string;
}

export interface VersionReglamentoCreate {
  reglamento: number;
  numero_version: string;
  fecha_version: string;
  cambios_realizados: string;
  motivo_cambio?: string;
  documento?: File | null;
  elaborado_por?: number | null;
  revisado_por?: number | null;
  aprobado_por?: number | null;
  fecha_aprobacion?: string | null;
}

// ============================================================================
// PUBLICACION REGLAMENTO
// ============================================================================

export interface PublicacionReglamento {
  id: number;
  reglamento: number;
  version_publicada: string;
  fecha_publicacion: string; // ISO date
  medio: MedioPublicacion;
  medio_display: string; // read-only
  ubicacion?: string;
  observaciones?: string;
  evidencia?: string | null; // URL del archivo
  publicado_por?: number | null;
  publicado_por_nombre: string; // read-only
  created_at: string;
}

export interface PublicacionReglamentoCreate {
  reglamento: number;
  version_publicada: string;
  fecha_publicacion: string;
  medio: MedioPublicacion;
  ubicacion?: string;
  observaciones?: string;
  evidencia?: File | null;
  publicado_por?: number | null;
}

// ============================================================================
// SOCIALIZACION REGLAMENTO
// ============================================================================

export interface SocializacionReglamento {
  id: number;
  reglamento: number;
  tipo: TipoSocializacion;
  tipo_display: string; // read-only
  fecha: string; // ISO date
  duracion_horas: number;
  facilitador?: number | null;
  facilitador_nombre: string; // read-only
  numero_asistentes: number;
  temas_tratados?: string;
  lista_asistencia?: string | null; // URL del archivo
  observaciones?: string;
  created_at: string;
  created_by?: number | null;
}

export interface SocializacionReglamentoCreate {
  reglamento: number;
  tipo: TipoSocializacion;
  fecha: string;
  duracion_horas?: number;
  facilitador?: number | null;
  numero_asistentes?: number;
  temas_tratados?: string;
  lista_asistencia?: File | null;
  observaciones?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

export const ESTADOS_REGLAMENTO: Array<{ value: EstadoReglamento; label: string }> = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_revision', label: 'En Revisión' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'obsoleto', label: 'Obsoleto' },
];

export const MEDIOS_PUBLICACION: Array<{ value: MedioPublicacion; label: string }> = [
  { value: 'cartelera', label: 'Cartelera' },
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'intranet', label: 'Intranet' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'impreso', label: 'Documento Impreso' },
];

export const TIPOS_SOCIALIZACION: Array<{ value: TipoSocializacion; label: string }> = [
  { value: 'induccion', label: 'Inducción' },
  { value: 'reinduccion', label: 'Reinducción' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'virtual', label: 'Virtual' },
];
