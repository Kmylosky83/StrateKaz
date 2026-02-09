/**
 * Types para Mi Portal (ESS - Employee Self-Service)
 * Sistema de Gestion StrateKaz
 */

// ============ PERFIL ============

export interface ColaboradorESS {
  id: string;
  nombre_completo: string;
  numero_identificacion: string;
  cargo_nombre: string;
  area_nombre: string;
  fecha_ingreso: string;
  estado: string;
  foto_url: string | null;
  telefono: string;
  celular: string;
  direccion: string;
  email_personal: string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_telefono: string;
  contacto_emergencia_parentesco: string;
}

export interface InfoPersonalUpdateData {
  telefono?: string;
  celular?: string;
  direccion?: string;
  email_personal?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
}

// ============ VACACIONES ============

export interface VacacionesSaldo {
  dias_acumulados: number;
  dias_disfrutados: number;
  dias_disponibles: number;
  fecha_ultimo_periodo: string | null;
  solicitudes_pendientes: number;
}

export interface SolicitudVacacionesFormData {
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  observaciones?: string;
}

// ============ PERMISOS ============

export type TipoPermisoESS =
  | 'personal'
  | 'medico'
  | 'familiar'
  | 'academico'
  | 'legal'
  | 'otro';

export interface SolicitudPermisoFormData {
  tipo_permiso: TipoPermisoESS;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  motivo: string;
}

// ============ RECIBOS DE NOMINA ============

export interface ReciboNomina {
  id: string;
  periodo: string;
  fecha_liquidacion: string;
  salario_base: number;
  total_devengado: number;
  total_deducciones: number;
  neto_pagar: number;
}

// ============ CAPACITACIONES ============

export interface CapacitacionESS {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string;
  calificacion: number | null;
  certificado_url: string | null;
}

// ============ EVALUACIONES ============

export interface EvaluacionESS {
  id: string;
  periodo: string;
  calificacion_general: number | null;
  estado: string;
  fecha_evaluacion: string | null;
}

// ============ PORTAL TABS ============

export type MiPortalTab =
  | 'perfil'
  | 'vacaciones'
  | 'permisos'
  | 'recibos'
  | 'capacitaciones'
  | 'evaluacion';
