/**
 * Types para Control de Tiempo - Talent Hub
 * Sistema de Gestión StrateKaz
 */

// ============== ENUMS ==============

export type TipoTurno = 'diurno' | 'nocturno' | 'mixto' | 'rotativo';
export type EstadoTurno = 'activo' | 'inactivo';
export type TipoMarcaje = 'entrada' | 'salida' | 'inicio_descanso' | 'fin_descanso';
export type MetodoMarcaje = 'biometrico' | 'tarjeta' | 'app_movil' | 'web' | 'manual';
export type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza' | 'permiso' | 'licencia' | 'incapacidad' | 'vacaciones';
export type TipoHoraExtra = 'diurna' | 'nocturna' | 'dominical' | 'festiva' | 'dominical_nocturna' | 'festiva_nocturna';
export type EstadoHoraExtra = 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
export type EstadoConsolidado = 'borrador' | 'cerrado' | 'aprobado';

// ============== TURNO ==============

export interface Turno {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: TipoTurno;
  hora_inicio: string;
  hora_fin: string;
  duracion_jornada: number;
  tiempo_descanso: number;
  aplica_recargo_nocturno: boolean;
  hora_inicio_nocturno: string;
  hora_fin_nocturno: string;
  dias_laborales: string[];
  estado: EstadoTurno;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TurnoFormData {
  codigo: string;
  nombre: string;
  tipo: TipoTurno;
  hora_inicio: string;
  hora_fin: string;
  duracion_jornada: number;
  tiempo_descanso?: number;
  aplica_recargo_nocturno?: boolean;
  hora_inicio_nocturno?: string;
  hora_fin_nocturno?: string;
  dias_laborales?: string[];
  estado?: EstadoTurno;
  observaciones?: string;
}

export interface TurnoFilter {
  tipo?: TipoTurno;
  estado?: EstadoTurno;
  search?: string;
}

// ============== ASIGNACION TURNO ==============

export interface AsignacionTurno {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  turno: number;
  turno_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_temporal: boolean;
  motivo_asignacion: string;
  asignado_por: number;
  asignado_por_nombre: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AsignacionTurnoFormData {
  colaborador: number;
  turno: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_temporal?: boolean;
  motivo_asignacion?: string;
}

export interface AsignacionTurnoFilter {
  colaborador?: number;
  turno?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  es_temporal?: boolean;
}

// ============== REGISTRO ASISTENCIA ==============

export interface RegistroAsistencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha: string;
  turno_asignado: number | null;
  turno_asignado_nombre: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  metodo_marcaje_entrada: MetodoMarcaje | null;
  metodo_marcaje_salida: MetodoMarcaje | null;
  ubicacion_entrada: string;
  ubicacion_salida: string;
  estado: EstadoAsistencia;
  minutos_tardanza: number;
  horas_trabajadas: number;
  observaciones: string;
  justificacion: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface RegistroAsistenciaFormData {
  colaborador: number;
  fecha: string;
  turno_asignado?: number | null;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  metodo_marcaje_entrada?: MetodoMarcaje;
  metodo_marcaje_salida?: MetodoMarcaje;
  ubicacion_entrada?: string;
  ubicacion_salida?: string;
  estado?: EstadoAsistencia;
  observaciones?: string;
  justificacion?: string;
}

export interface RegistroAsistenciaFilter {
  colaborador?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoAsistencia;
  turno_asignado?: number;
}

export interface MarcajeData {
  colaborador: number;
  tipo_marcaje: TipoMarcaje;
  metodo: MetodoMarcaje;
  ubicacion?: string;
}

// ============== HORA EXTRA ==============

export interface HoraExtra {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha: string;
  tipo: TipoHoraExtra;
  hora_inicio: string;
  hora_fin: string;
  horas_solicitadas: number;
  horas_aprobadas: number;
  motivo: string;
  trabajo_realizado: string;
  estado: EstadoHoraExtra;
  solicitado_por: number;
  solicitado_por_nombre: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones_aprobacion: string;
  factor_recargo: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface HoraExtraFormData {
  colaborador: number;
  fecha: string;
  tipo: TipoHoraExtra;
  hora_inicio: string;
  hora_fin: string;
  horas_solicitadas: number;
  motivo: string;
  trabajo_realizado?: string;
}

export interface HoraExtraFilter {
  colaborador?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: TipoHoraExtra;
  estado?: EstadoHoraExtra;
}

export interface AprobacionHoraExtraData {
  horas_aprobadas: number;
  observaciones_aprobacion?: string;
}

// ============== CONSOLIDADO ASISTENCIA ==============

export interface ConsolidadoAsistencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  dias_laborados: number;
  dias_ausencia: number;
  dias_incapacidad: number;
  dias_licencia: number;
  dias_permiso: number;
  dias_vacaciones: number;
  total_horas_trabajadas: number;
  total_horas_extras_diurnas: number;
  total_horas_extras_nocturnas: number;
  total_horas_extras_dominicales: number;
  total_horas_extras_festivas: number;
  total_recargo_nocturno: number;
  total_recargo_dominical: number;
  total_recargo_festivo: number;
  minutos_tardanza_acumulados: number;
  estado: EstadoConsolidado;
  generado_por: number;
  generado_por_nombre: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ConsolidadoAsistenciaFilter {
  colaborador?: number;
  periodo_inicio?: string;
  periodo_fin?: string;
  estado?: EstadoConsolidado;
}

export interface GenerarConsolidadoData {
  colaborador?: number;
  periodo_inicio: string;
  periodo_fin: string;
}

// ============== OPTIONS ==============

export const tipoTurnoOptions = [
  { value: 'diurno', label: 'Diurno' },
  { value: 'nocturno', label: 'Nocturno' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'rotativo', label: 'Rotativo' },
];

export const estadoTurnoOptions = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

export const tipoMarcajeOptions = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'inicio_descanso', label: 'Inicio Descanso' },
  { value: 'fin_descanso', label: 'Fin Descanso' },
];

export const metodoMarcajeOptions = [
  { value: 'biometrico', label: 'Biométrico' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'app_movil', label: 'App Móvil' },
  { value: 'web', label: 'Web' },
  { value: 'manual', label: 'Manual' },
];

export const estadoAsistenciaOptions = [
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'tardanza', label: 'Tardanza' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'incapacidad', label: 'Incapacidad' },
  { value: 'vacaciones', label: 'Vacaciones' },
];

export const tipoHoraExtraOptions = [
  { value: 'diurna', label: 'Diurna (25%)' },
  { value: 'nocturna', label: 'Nocturna (75%)' },
  { value: 'dominical', label: 'Dominical (75%)' },
  { value: 'festiva', label: 'Festiva (75%)' },
  { value: 'dominical_nocturna', label: 'Dominical Nocturna (110%)' },
  { value: 'festiva_nocturna', label: 'Festiva Nocturna (110%)' },
];

export const estadoHoraExtraOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'pagada', label: 'Pagada' },
];

export const estadoConsolidadoOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'aprobado', label: 'Aprobado' },
];

export const diasSemanaOptions = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];
