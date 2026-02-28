/**
 * Types para Control de Tiempo - Talent Hub
 * Alineados con los modelos y serializers del backend.
 * Sistema de Gestión StrateKaz
 */

// ============== ENUMS ==============

export type TipoJornada = 'ordinaria' | 'flexible' | 'por_turnos' | 'reducida';
export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';
export type EstadoAsistencia =
  | 'presente'
  | 'ausente'
  | 'tardanza'
  | 'permiso'
  | 'incapacidad'
  | 'vacaciones'
  | 'licencia';
export type TipoHoraExtra =
  | 'diurna'
  | 'nocturna'
  | 'dominical_diurna'
  | 'dominical_nocturna'
  | 'festivo_diurna'
  | 'festivo_nocturna';
export type EstadoHoraExtra = 'pendiente' | 'aprobada' | 'rechazada';

// Tipos de marcaje (backend: MarcajeTiempo.TipoMarcaje)
export type TipoMarcaje = 'entrada' | 'salida' | 'entrada_almuerzo' | 'salida_almuerzo';

// Métodos de marcaje (backend: MarcajeTiempo.MetodoMarcaje)
export type MetodoMarcaje = 'manual' | 'web' | 'qr' | 'movil';

// ============== TURNO ==============

export interface Turno {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string; // "HH:MM:SS"
  duracion_jornada: string; // decimal string
  aplica_recargo_nocturno: boolean;
  dias_semana: DiaSemana[];
  horas_semanales_maximas: string; // decimal string
  tipo_jornada: TipoJornada;
  qr_token?: string; // UUID, solo en detail
  es_turno_nocturno?: boolean;
  horario_formateado?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoFormData {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_jornada: number;
  aplica_recargo_nocturno?: boolean;
  dias_semana?: DiaSemana[];
  horas_semanales_maximas?: number;
  tipo_jornada?: TipoJornada;
}

export interface TurnoFilter {
  search?: string;
  is_active?: boolean;
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
  es_rotativo: boolean;
  observaciones: string;
  esta_vigente: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AsignacionTurnoFormData {
  colaborador: number;
  turno: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_rotativo?: boolean;
  observaciones?: string;
}

export interface AsignacionTurnoFilter {
  colaborador?: number;
  turno?: number;
  vigente?: boolean;
}

// ============== REGISTRO ASISTENCIA ==============

export interface RegistroAsistencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  turno: number;
  turno_nombre: string;
  fecha: string;
  hora_entrada: string | null; // "HH:MM:SS"
  hora_salida: string | null; // "HH:MM:SS"
  hora_entrada_almuerzo: string | null;
  hora_salida_almuerzo: string | null;
  estado: EstadoAsistencia;
  estado_display: string;
  minutos_tardanza: number;
  horas_trabajadas: string; // decimal string
  observaciones: string;
  justificacion: string;
  registrado_por: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistroAsistenciaFormData {
  colaborador: number;
  turno: number;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  hora_entrada_almuerzo?: string | null;
  hora_salida_almuerzo?: string | null;
  estado?: EstadoAsistencia;
  observaciones?: string;
  justificacion?: string;
}

export interface RegistrarEntradaData {
  colaborador_id: number;
  turno_id: number;
  fecha: string;
  hora_entrada: string;
  observaciones?: string;
}

export interface RegistrarSalidaData {
  hora_salida: string;
  observaciones?: string;
}

export interface JustificarAsistenciaData {
  justificacion: string;
  nuevo_estado?: 'permiso' | 'incapacidad' | 'vacaciones' | 'licencia';
}

export interface RegistroAsistenciaFilter {
  colaborador?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: EstadoAsistencia;
}

export interface EstadisticasAsistencia {
  total_registros: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  permisos: number;
  incapacidades: number;
  vacaciones: number;
  licencias: number;
  porcentaje_asistencia: number;
  total_minutos_tardanza: number;
  total_horas_trabajadas: number;
}

// ============== MARCAJE DE TIEMPO ==============

export interface MarcajeTiempo {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo: TipoMarcaje;
  tipo_display: string;
  metodo: MetodoMarcaje;
  metodo_display: string;
  fecha_hora: string; // ISO datetime
  latitud: string | null;
  longitud: string | null;
  ip_address: string | null;
  registro_asistencia: number | null;
  is_active: boolean;
  created_at: string;
}

export interface MarcajeData {
  colaborador_id: number;
  tipo: TipoMarcaje;
  metodo?: MetodoMarcaje;
  latitud?: number | null;
  longitud?: number | null;
}

export interface MarcajeQRData {
  qr_token: string;
  tipo: TipoMarcaje;
  latitud?: number | null;
  longitud?: number | null;
}

export interface MarcajeFilter {
  colaborador?: number;
  fecha?: string;
}

// ============== HORA EXTRA ==============

export interface HoraExtra {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  fecha: string;
  tipo: TipoHoraExtra;
  tipo_display: string;
  hora_inicio: string;
  hora_fin: string;
  horas_trabajadas: string; // decimal string (auto-calculado)
  factor_recargo: string; // decimal string (auto-calculado)
  horas_con_recargo: string;
  porcentaje_recargo: string;
  justificacion: string;
  estado: EstadoHoraExtra;
  estado_display: string;
  aprobado: boolean;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HoraExtraFormData {
  colaborador: number;
  fecha: string;
  tipo: TipoHoraExtra;
  hora_inicio: string;
  hora_fin: string;
  justificacion: string;
}

export interface HoraExtraFilter {
  colaborador?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo?: TipoHoraExtra;
  estado?: EstadoHoraExtra;
}

export interface RechazarHoraExtraData {
  motivo?: string;
}

// ============== CONSOLIDADO ASISTENCIA ==============

export interface ConsolidadoAsistencia {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  anio: number;
  mes: number;
  periodo_formateado: string;
  dias_trabajados: number;
  dias_ausente: number;
  dias_tardanza: number;
  total_horas_trabajadas: string; // decimal string
  total_horas_extras: string; // decimal string
  total_minutos_tardanza: number;
  total_horas_tardanza: string; // decimal string
  porcentaje_asistencia: string; // decimal string
  cerrado: boolean;
  cerrado_por: number | null;
  fecha_cierre: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsolidadoFilter {
  colaborador?: number;
  anio?: number;
  mes?: number;
  cerrado?: boolean;
}

export interface GenerarConsolidadoData {
  colaborador_id?: number | null;
  anio: number;
  mes: number;
}

// ============== CONFIGURACION RECARGOS ==============

export interface ConfiguracionRecargo {
  id: number;
  empresa: number;
  tipo_hora_extra: TipoHoraExtra;
  tipo_hora_extra_display: string;
  factor_vigente: string;
  factor_fase_1: string;
  fecha_inicio_fase_1: string;
  factor_fase_2: string;
  fecha_inicio_fase_2: string;
  factor_fase_3: string;
  fecha_inicio_fase_3: string;
  factor_actual: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionRecargoFormData {
  tipo_hora_extra: TipoHoraExtra;
  factor_vigente: number;
  factor_fase_1: number;
  fecha_inicio_fase_1?: string;
  factor_fase_2: number;
  fecha_inicio_fase_2?: string;
  factor_fase_3: number;
  fecha_inicio_fase_3?: string;
}

// ============== OPTIONS (para selects) ==============

export const tipoJornadaOptions = [
  { value: 'ordinaria', label: 'Jornada Ordinaria' },
  { value: 'flexible', label: 'Jornada Flexible' },
  { value: 'por_turnos', label: 'Jornada por Turnos' },
  { value: 'reducida', label: 'Jornada Reducida' },
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
  { value: 'dominical_diurna', label: 'Dominical Diurna (75%)' },
  { value: 'dominical_nocturna', label: 'Dominical Nocturna (110%)' },
  { value: 'festivo_diurna', label: 'Festivo Diurna (75%)' },
  { value: 'festivo_nocturna', label: 'Festivo Nocturna (110%)' },
];

export const estadoHoraExtraOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
];

export const tipoMarcajeOptions = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'entrada_almuerzo', label: 'Entrada Almuerzo' },
  { value: 'salida_almuerzo', label: 'Salida Almuerzo' },
];

export const metodoMarcajeOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'web', label: 'Plataforma Web' },
  { value: 'qr', label: 'Código QR' },
  { value: 'movil', label: 'App Móvil' },
];

// Nombres de meses en español
export const MESES_NOMBRES: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};
