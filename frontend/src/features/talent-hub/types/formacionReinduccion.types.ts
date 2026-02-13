/**
 * Tipos TypeScript para Formacion y Reinduccion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Alineado 1:1 con backend/apps/talent_hub/formacion_reinduccion/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type TipoCapacitacion =
  | 'induccion'
  | 'reinduccion'
  | 'tecnica'
  | 'habilidades_blandas'
  | 'sst'
  | 'calidad'
  | 'ambiente'
  | 'pesv'
  | 'liderazgo'
  | 'normativa'
  | 'otro';

export type ModalidadCapacitacion = 'presencial' | 'virtual' | 'asincronica' | 'mixta' | 'outdoor';

export type EstadoCapacitacion =
  | 'borrador'
  | 'publicada'
  | 'en_ejecucion'
  | 'finalizada'
  | 'cancelada';

export type EstadoProgramacion =
  | 'programada'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'reprogramada';

export type EstadoEjecucionCapacitacion =
  | 'inscrito'
  | 'confirmado'
  | 'asistio'
  | 'no_asistio'
  | 'cancelado'
  | 'pendiente_evaluacion'
  | 'aprobado'
  | 'reprobado';

export type TipoBadge = 'logro' | 'nivel' | 'especial' | 'competencia' | 'racha';

export type NivelEvaluacionEficacia = 'reaccion' | 'aprendizaje' | 'comportamiento' | 'resultados';

// =============================================================================
// INTERFACES DE MODELOS
// =============================================================================

export interface PlanFormacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_asignado: number;
  presupuesto_ejecutado: number;
  objetivos?: string[];
  responsable?: number;
  responsable_nombre?: string;
  aprobado: boolean;
  fecha_aprobacion?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  observaciones?: string;
  porcentaje_ejecucion_presupuesto?: number;
  capacitaciones_count?: number;
  is_active: boolean;
}

export interface Capacitacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_capacitacion: TipoCapacitacion;
  tipo_display?: string;
  modalidad: ModalidadCapacitacion;
  modalidad_display?: string;
  plan_formacion?: number;
  plan_nombre?: string;
  duracion_horas: number;
  numero_sesiones: number;
  instructor_interno?: number;
  instructor_nombre?: string;
  instructor_externo?: string;
  proveedor_externo?: string;
  objetivos?: string[];
  contenido_tematico?: string[];
  material_apoyo?: string;
  cupo_maximo: number;
  cupo_minimo: number;
  requisitos_previos?: string;
  cargos_objetivo: number[];
  requiere_evaluacion: boolean;
  nota_aprobacion: number;
  genera_certificado: boolean;
  costo_por_persona: number;
  costo_total: number;
  puntos_otorgados: number;
  estado: EstadoCapacitacion;
  estado_display?: string;
  observaciones?: string;
  is_active: boolean;
}

export interface ProgramacionCapacitacion {
  id: number;
  capacitacion: number;
  capacitacion_nombre?: string;
  capacitacion_info?: Capacitacion;
  numero_sesion: number;
  titulo_sesion?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar?: string;
  direccion?: string;
  enlace_virtual?: string;
  instructor?: number;
  instructor_nombre?: string;
  instructor_externo?: string;
  inscritos: number;
  cupo_disponible?: number;
  esta_llena?: boolean;
  material_sesion?: string;
  estado: EstadoProgramacion;
  estado_display?: string;
  observaciones?: string;
}

export interface EjecucionCapacitacion {
  id: number;
  programacion: number;
  programacion_info?: ProgramacionCapacitacion;
  colaborador: number;
  colaborador_nombre?: string;
  capacitacion_nombre?: string;
  fecha?: string;
  estado: EstadoEjecucionCapacitacion;
  estado_display?: string;
  asistio: boolean;
  hora_entrada?: string;
  hora_salida?: string;
  justificacion_inasistencia?: string;
  nota_evaluacion?: number;
  fecha_evaluacion?: string;
  intentos_evaluacion: number;
  puntos_ganados: number;
  retroalimentacion?: string;
  calificacion_instructor?: number;
  calificacion_contenido?: number;
  observaciones?: string;
  aprobo?: boolean;
}

export interface Badge {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoBadge;
  tipo_display?: string;
  icono?: string;
  color: string;
  puntos_requeridos: number;
  capacitaciones_requeridas: number;
  criterio_especial?: string;
  puntos_otorgados: number;
  orden: number;
  is_active: boolean;
}

export interface GamificacionColaborador {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  puntos_totales: number;
  puntos_mes: number;
  puntos_anio: number;
  nivel: number;
  nombre_nivel: string;
  capacitaciones_completadas: number;
  badges_obtenidos: number;
  racha_actual: number;
  racha_maxima: number;
  posicion_ranking?: number;
  ultima_actividad?: string;
}

export interface BadgeColaborador {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  badge: number;
  badge_info?: Badge;
  fecha_obtencion: string;
  motivo?: string;
  capacitacion_relacionada?: number;
}

export interface LeaderboardEntry {
  posicion: number;
  colaborador_id: number;
  colaborador_nombre: string;
  nivel: number;
  nombre_nivel: string;
  puntos_totales: number;
  badges_obtenidos: number;
  capacitaciones_completadas: number;
}

export interface EvaluacionEficacia {
  id: number;
  ejecucion: number;
  colaborador_nombre?: string;
  capacitacion_nombre?: string;
  nivel_evaluacion: NivelEvaluacionEficacia;
  nivel_display?: string;
  fecha_evaluacion: string;
  fecha_programada?: string;
  evaluador: number;
  evaluador_nombre?: string;
  calificacion: number;
  criterios_evaluados?: unknown[];
  evidencias?: string;
  mejoras_observadas?: string;
  areas_oportunidad?: string;
  requiere_refuerzo: boolean;
  recomendaciones?: string;
  observaciones?: string;
}

export interface Certificado {
  id: number;
  numero_certificado: string;
  ejecucion: number;
  colaborador_nombre?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  esta_vigente?: boolean;
  titulo_capacitacion: string;
  duracion_horas: number;
  nota_obtenida?: number;
  firmado_por?: string;
  cargo_firmante?: string;
  archivo_certificado?: string;
  anulado: boolean;
  motivo_anulacion?: string;
  codigo_verificacion: string;
}

// =============================================================================
// INTERFACES PARA ESTADISTICAS
// =============================================================================

export interface FormacionEstadisticas {
  capacitaciones_activas: number;
  sesiones_programadas_mes: number;
  participantes_mes: number;
  tasa_asistencia: number;
  tasa_aprobacion: number;
  horas_formacion_mes: number;
  certificados_emitidos_mes: number;
  presupuesto_ejecutado_anio: number;
}

// =============================================================================
// INTERFACES PARA FORMULARIOS
// =============================================================================

export interface PlanFormacionFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_asignado?: number;
  observaciones?: string;
}

export interface CapacitacionFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_capacitacion: TipoCapacitacion;
  modalidad: ModalidadCapacitacion;
  plan_formacion?: number;
  duracion_horas: number;
  numero_sesiones?: number;
  instructor_interno?: number;
  instructor_externo?: string;
  proveedor_externo?: string;
  objetivos?: string;
  contenido_tematico?: string;
  cupo_maximo?: number;
  cupo_minimo?: number;
  requiere_evaluacion?: boolean;
  nota_aprobacion?: number;
  genera_certificado?: boolean;
  costo_por_persona?: number;
  puntos_otorgados?: number;
}

export interface ProgramacionFormData {
  capacitacion: number;
  numero_sesion: number;
  titulo_sesion?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar?: string;
  direccion?: string;
  enlace_virtual?: string;
  instructor?: number;
  instructor_externo?: string;
}

export interface InscripcionFormData {
  programacion: number;
  colaborador: number;
}

export interface AsistenciaFormData {
  asistio: boolean;
  hora_entrada?: string;
  hora_salida?: string;
}

export interface EvaluacionFormData {
  nota: number;
  retroalimentacion?: string;
}
