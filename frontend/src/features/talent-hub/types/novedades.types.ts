/**
 * Types para Novedades - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Aligned with backend models + serializers (2026-02-13)
 */

// ============== ENUMS ==============

export type OrigenIncapacidad = 'comun' | 'laboral' | 'maternidad' | 'paternidad';
export type EstadoIncapacidad = 'pendiente' | 'aprobada' | 'en_cobro' | 'pagada' | 'rechazada';
export type CategoriaLicencia = 'remunerada' | 'no_remunerada' | 'legal';
export type EstadoLicencia = 'solicitada' | 'aprobada' | 'rechazada' | 'cancelada';
export type TipoPermiso = 'personal' | 'medico' | 'academico' | 'calamidad' | 'otro';
export type EstadoPermiso = 'solicitado' | 'aprobado' | 'rechazado';
export type EstadoVacaciones = 'solicitada' | 'aprobada' | 'rechazada' | 'disfrutada' | 'cancelada';
export type PeriodoDotacion = 'abril' | 'agosto' | 'diciembre';

// ============== TIPO INCAPACIDAD ==============

export interface TipoIncapacidad {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  origen: OrigenIncapacidad;
  dias_maximos: number | null;
  porcentaje_pago: string; // DecimalField comes as string
  requiere_prorroga: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoIncapacidadFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  origen: OrigenIncapacidad;
  dias_maximos?: number | null;
  porcentaje_pago?: string;
  requiere_prorroga?: boolean;
}

// ============== INCAPACIDAD ==============

export interface Incapacidad {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_incapacidad: number;
  tipo_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_incapacidad: number;
  diagnostico: string;
  codigo_cie10: string;
  eps_arl: string;
  numero_incapacidad: string;
  prorroga_de: number | null;
  es_prorroga: boolean;
  tiene_prorrogas: boolean;
  dias_totales_con_prorrogas: number;
  archivo_soporte: string;
  estado: EstadoIncapacidad;
  fecha_radicacion_cobro: string | null;
  valor_cobrado: string | null;
  observaciones: string;
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
  codigo_cie10?: string;
  eps_arl: string;
  numero_incapacidad: string;
  prorroga_de?: number | null;
  observaciones?: string;
}

export interface IncapacidadFilter {
  colaborador?: number;
  tipo_incapacidad?: number;
  estado?: EstadoIncapacidad;
}

// ============== TIPO LICENCIA ==============

export interface TipoLicencia {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaLicencia;
  dias_permitidos: number | null;
  requiere_aprobacion: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoLicenciaFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaLicencia;
  dias_permitidos?: number | null;
  requiere_aprobacion?: boolean;
}

// ============== LICENCIA ==============

export interface Licencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_licencia: number;
  tipo_nombre: string;
  tipo_categoria: CategoriaLicencia;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo: string;
  archivo_soporte: string | null;
  estado: EstadoLicencia;
  esta_aprobada: boolean;
  esta_vigente: boolean;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones_aprobacion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LicenciaFormData {
  colaborador: number;
  tipo_licencia: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

export interface LicenciaFilter {
  colaborador?: number;
  tipo_licencia?: number;
  estado?: EstadoLicencia;
}

export interface AprobacionLicenciaData {
  observaciones?: string;
}

// ============== PERMISO ==============

export interface Permiso {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha: string;
  hora_salida: string;
  hora_regreso: string;
  horas_permiso: string; // DecimalField
  motivo: string;
  tipo: TipoPermiso;
  compensable: boolean;
  estado: EstadoPermiso;
  esta_aprobado: boolean;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PermisoFormData {
  colaborador: number;
  fecha: string;
  hora_salida: string;
  hora_regreso: string;
  motivo: string;
  tipo: TipoPermiso;
  compensable?: boolean;
}

export interface PermisoFilter {
  colaborador?: number;
  tipo?: TipoPermiso;
  estado?: EstadoPermiso;
}

// ============== PERIODO VACACIONES ==============

export interface PeriodoVacaciones {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha_ingreso: string;
  dias_derecho_anual: string; // DecimalField
  dias_acumulados: string;
  dias_disfrutados: string;
  dias_pendientes: string;
  dias_acumulados_actualizados: string;
  ultimo_corte: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PeriodoVacacionesFormData {
  colaborador: number;
  fecha_ingreso: string;
  dias_derecho_anual?: string;
  dias_acumulados?: string;
  dias_disfrutados?: string;
  ultimo_corte: string;
  observaciones?: string;
}

export interface PeriodoVacacionesFilter {
  colaborador?: number;
}

// ============== SOLICITUD VACACIONES ==============

export interface SolicitudVacaciones {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias_habiles: number;
  dias_calendario: number;
  incluye_prima: boolean;
  estado: EstadoVacaciones;
  esta_aprobada: boolean;
  esta_vigente: boolean;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  periodo_dias_pendientes: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SolicitudVacacionesFormData {
  colaborador: number;
  periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  incluye_prima?: boolean;
  observaciones?: string;
}

export interface SolicitudVacacionesFilter {
  colaborador?: number;
  periodo?: number;
  estado?: EstadoVacaciones;
}

// ============== CONFIGURACION DOTACION ==============

export interface ConfiguracionDotacion {
  id: number;
  empresa: number;
  periodos_entrega: string[];
  salario_maximo_smmlv: string;
  items_obligatorios: string[];
  politica_devolucion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ConfiguracionDotacionFormData {
  periodos_entrega?: string[];
  salario_maximo_smmlv?: string;
  items_obligatorios?: string[];
  politica_devolucion?: string;
}

// ============== ENTREGA DOTACION ==============

export interface EntregaDotacion {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  periodo: PeriodoDotacion;
  periodo_display: string;
  anio: number;
  fecha_entrega: string;
  items_entregados: Array<{ descripcion: string; talla?: string; cantidad?: number }>;
  acta_entrega: string | null;
  firma_recibido: boolean;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EntregaDotacionFormData {
  colaborador: number;
  periodo: PeriodoDotacion;
  anio: number;
  fecha_entrega: string;
  items_entregados?: Array<{ descripcion: string; talla?: string; cantidad?: number }>;
  firma_recibido?: boolean;
  observaciones?: string;
}

export interface EntregaDotacionFilter {
  colaborador?: number;
  periodo?: PeriodoDotacion;
  anio?: number;
}

// ============== OPTIONS ==============

export const origenIncapacidadOptions = [
  { value: 'comun', label: 'Enfermedad Comun' },
  { value: 'laboral', label: 'Origen Laboral' },
  { value: 'maternidad', label: 'Licencia de Maternidad' },
  { value: 'paternidad', label: 'Licencia de Paternidad' },
];

export const estadoIncapacidadOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'en_cobro', label: 'En Cobro' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'rechazada', label: 'Rechazada' },
];

export const categoriaLicenciaOptions = [
  { value: 'remunerada', label: 'Remunerada' },
  { value: 'no_remunerada', label: 'No Remunerada' },
  { value: 'legal', label: 'Legal Remunerada' },
];

export const estadoLicenciaOptions = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const tipoPermisoOptions = [
  { value: 'personal', label: 'Personal' },
  { value: 'medico', label: 'Medico' },
  { value: 'academico', label: 'Academico' },
  { value: 'calamidad', label: 'Calamidad Domestica' },
  { value: 'otro', label: 'Otro' },
];

export const estadoPermisoOptions = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const estadoVacacionesOptions = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'disfrutada', label: 'Disfrutada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const periodoDotacionOptions = [
  { value: 'abril', label: 'Abril (30 de abril)' },
  { value: 'agosto', label: 'Agosto (31 de agosto)' },
  { value: 'diciembre', label: 'Diciembre (20 de diciembre)' },
];
