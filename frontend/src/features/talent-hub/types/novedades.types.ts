/**
 * Types para Novedades - Talent Hub
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// ============== ENUMS ==============

export type OrigenIncapacidad = 'enfermedad_general' | 'accidente_trabajo' | 'enfermedad_laboral' | 'accidente_transito';
export type EstadoIncapacidad = 'reportada' | 'en_tramite' | 'pagada' | 'rechazada';
export type TipoLicenciaCode = 'maternidad' | 'paternidad' | 'luto' | 'matrimonio' | 'calamidad' | 'sindical' | 'estudio' | 'otra';
export type EstadoLicencia = 'solicitada' | 'aprobada' | 'rechazada' | 'en_curso' | 'finalizada';
export type TipoPermisoCode = 'personal' | 'medico' | 'familiar' | 'academico' | 'judicial' | 'otro';
export type EstadoPermiso = 'solicitado' | 'aprobado' | 'rechazado';
export type EstadoVacaciones = 'pendiente' | 'programada' | 'aprobada' | 'en_curso' | 'disfrutada' | 'cancelada';

// ============== TIPO INCAPACIDAD ==============

export interface TipoIncapacidad {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  origen: OrigenIncapacidad;
  dias_empresa: number;
  porcentaje_pago_empresa: number;
  porcentaje_pago_eps: number;
  requiere_prorroga: boolean;
  dias_maximos: number;
  descripcion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoIncapacidadFormData {
  codigo: string;
  nombre: string;
  origen: OrigenIncapacidad;
  dias_empresa?: number;
  porcentaje_pago_empresa?: number;
  porcentaje_pago_eps?: number;
  requiere_prorroga?: boolean;
  dias_maximos?: number;
  descripcion?: string;
}

// ============== INCAPACIDAD ==============

export interface Incapacidad {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_incapacidad: number;
  tipo_incapacidad_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_incapacidad: number;
  diagnostico: string;
  codigo_diagnostico: string;
  entidad_salud: string;
  numero_incapacidad: string;
  es_prorroga: boolean;
  incapacidad_original: number | null;
  fecha_radicacion: string | null;
  estado: EstadoIncapacidad;
  valor_reconocido_empresa: number;
  valor_reconocido_eps: number;
  fecha_pago_eps: string | null;
  archivo_soporte: string;
  observaciones: string;
  registrado_por: number;
  registrado_por_nombre: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface IncapacidadFormData {
  colaborador: number;
  tipo_incapacidad: number;
  fecha_inicio: string;
  fecha_fin: string;
  diagnostico: string;
  codigo_diagnostico?: string;
  entidad_salud: string;
  numero_incapacidad: string;
  es_prorroga?: boolean;
  incapacidad_original?: number | null;
  fecha_radicacion?: string | null;
  observaciones?: string;
}

export interface IncapacidadFilter {
  colaborador?: number;
  tipo_incapacidad?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoIncapacidad;
  origen?: OrigenIncapacidad;
}

// ============== TIPO LICENCIA ==============

export interface TipoLicencia {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: TipoLicenciaCode;
  dias_legales: number;
  es_remunerada: boolean;
  requiere_soporte: boolean;
  descripcion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoLicenciaFormData {
  codigo: string;
  nombre: string;
  tipo: TipoLicenciaCode;
  dias_legales: number;
  es_remunerada?: boolean;
  requiere_soporte?: boolean;
  descripcion?: string;
}

// ============== LICENCIA ==============

export interface Licencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_licencia: number;
  tipo_licencia_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  dias_aprobados: number;
  motivo: string;
  estado: EstadoLicencia;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones_aprobacion: string;
  archivo_soporte: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LicenciaFormData {
  colaborador: number;
  tipo_licencia: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
}

export interface LicenciaFilter {
  colaborador?: number;
  tipo_licencia?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoLicencia;
}

export interface AprobacionLicenciaData {
  dias_aprobados: number;
  observaciones_aprobacion?: string;
}

// ============== TIPO PERMISO ==============

export interface TipoPermiso {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: TipoPermisoCode;
  requiere_soporte: boolean;
  requiere_compensacion: boolean;
  horas_maximas_mes: number;
  descripcion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoPermisoFormData {
  codigo: string;
  nombre: string;
  tipo: TipoPermisoCode;
  requiere_soporte?: boolean;
  requiere_compensacion?: boolean;
  horas_maximas_mes?: number;
  descripcion?: string;
}

// ============== PERMISO ==============

export interface Permiso {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_permiso: number;
  tipo_permiso_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  horas_solicitadas: number;
  motivo: string;
  estado: EstadoPermiso;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  requiere_compensacion: boolean;
  fecha_compensacion: string | null;
  horas_compensadas: number;
  archivo_soporte: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PermisoFormData {
  colaborador: number;
  tipo_permiso: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  horas_solicitadas: number;
  motivo: string;
}

export interface PermisoFilter {
  colaborador?: number;
  tipo_permiso?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoPermiso;
}

// ============== PERIODO VACACIONES ==============

export interface PeriodoVacaciones {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha_inicio_periodo: string;
  fecha_fin_periodo: string;
  dias_derecho: number;
  dias_disfrutados: number;
  dias_pendientes: number;
  dias_compensados: number;
  valor_dia_vacaciones: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PeriodoVacacionesFilter {
  colaborador?: number;
  anio?: number;
}

// ============== SOLICITUD VACACIONES ==============

export interface SolicitudVacaciones {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  periodo_vacaciones: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  dias_habiles: number;
  incluye_prima: boolean;
  estado: EstadoVacaciones;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones_aprobacion: string;
  motivo_cancelacion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SolicitudVacacionesFormData {
  colaborador: number;
  periodo_vacaciones: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  incluye_prima?: boolean;
}

export interface SolicitudVacacionesFilter {
  colaborador?: number;
  periodo_vacaciones?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoVacaciones;
}

// ============== OPTIONS ==============

export const origenIncapacidadOptions = [
  { value: 'enfermedad_general', label: 'Enfermedad General' },
  { value: 'accidente_trabajo', label: 'Accidente de Trabajo' },
  { value: 'enfermedad_laboral', label: 'Enfermedad Laboral' },
  { value: 'accidente_transito', label: 'Accidente de Tránsito' },
];

export const estadoIncapacidadOptions = [
  { value: 'reportada', label: 'Reportada' },
  { value: 'en_tramite', label: 'En Trámite' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'rechazada', label: 'Rechazada' },
];

export const tipoLicenciaOptions = [
  { value: 'maternidad', label: 'Maternidad' },
  { value: 'paternidad', label: 'Paternidad' },
  { value: 'luto', label: 'Luto' },
  { value: 'matrimonio', label: 'Matrimonio' },
  { value: 'calamidad', label: 'Calamidad Doméstica' },
  { value: 'sindical', label: 'Sindical' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'otra', label: 'Otra' },
];

export const estadoLicenciaOptions = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'finalizada', label: 'Finalizada' },
];

export const tipoPermisoOptions = [
  { value: 'personal', label: 'Personal' },
  { value: 'medico', label: 'Médico' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'academico', label: 'Académico' },
  { value: 'judicial', label: 'Judicial' },
  { value: 'otro', label: 'Otro' },
];

export const estadoPermisoOptions = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const estadoVacacionesOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'programada', label: 'Programada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'disfrutada', label: 'Disfrutada' },
  { value: 'cancelada', label: 'Cancelada' },
];
