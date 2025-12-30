/**
 * Tipos TypeScript para Formacion y Reinduccion - Talent Hub
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Basado en: backend/apps/talent_hub/formacion_reinduccion/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type TipoCapacitacion =
  | 'induccion'
  | 'reinduccion'
  | 'sst'
  | 'pesv'
  | 'tecnica'
  | 'habilidades_blandas'
  | 'normativa'
  | 'liderazgo'
  | 'especifica';

export type ModalidadCapacitacion =
  | 'presencial'
  | 'virtual'
  | 'hibrida'
  | 'e_learning';

export type EstadoCapacitacion =
  | 'borrador'
  | 'publicada'
  | 'en_ejecucion'
  | 'completada'
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
  | 'asistio'
  | 'no_asistio'
  | 'aprobado'
  | 'reprobado'
  | 'pendiente_evaluacion';

export type TipoBadge =
  | 'logro'
  | 'habilidad'
  | 'participacion'
  | 'liderazgo'
  | 'especial';

export type NivelEvaluacionEficacia = 1 | 2 | 3 | 4;

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
  responsable?: number;
  responsable_nombre?: string;
  presupuesto_asignado: number;
  presupuesto_ejecutado: number;
  porcentaje_ejecucion?: number;
  aprobado: boolean;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
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
  objetivos?: string;
  contenido_tematico?: string;
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
  is_active: boolean;
}

export interface ProgramacionCapacitacion {
  id: number;
  capacitacion: number;
  capacitacion_nombre?: string;
  capacitacion_info?: Capacitacion;
  numero_sesion: number;
  titulo_sesion?: string;
  descripcion_sesion?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar?: string;
  enlace_virtual?: string;
  instructor?: number;
  instructor_nombre?: string;
  material_sesion?: string;
  inscritos: number;
  cupo_disponible?: number;
  esta_llena?: boolean;
  estado: EstadoProgramacion;
  estado_display?: string;
}

export interface EjecucionCapacitacion {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  programacion: number;
  programacion_info?: ProgramacionCapacitacion;
  capacitacion_nombre?: string;
  fecha?: string;
  fecha_inscripcion: string;
  asistio: boolean;
  hora_entrada?: string;
  hora_salida?: string;
  nota_evaluacion?: number;
  fecha_evaluacion?: string;
  intentos_evaluacion: number;
  estado: EstadoEjecucionCapacitacion;
  estado_display?: string;
  puntos_ganados: number;
  retroalimentacion?: string;
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
  criterios_especiales?: string;
  orden: number;
  is_active: boolean;
}

export interface GamificacionColaborador {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  puntos_totales: number;
  nivel: number;
  nombre_nivel?: string;
  puntos_siguiente_nivel?: number;
  badges_obtenidos: number;
  capacitaciones_completadas: number;
  horas_formacion: number;
  racha_actual: number;
  mejor_racha: number;
  ultima_actividad?: string;
}

export interface BadgeColaborador {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  badge: number;
  badge_info?: Badge;
  fecha_obtencion: string;
  otorgado_automaticamente: boolean;
  motivo?: string;
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
  evaluador: number;
  evaluador_nombre?: string;
  calificacion: number;
  evidencia_aplicacion?: string;
  impacto_observado?: string;
  requiere_refuerzo: boolean;
  plan_refuerzo?: string;
  observaciones?: string;
}

export interface Certificado {
  id: number;
  ejecucion: number;
  colaborador_nombre?: string;
  numero_certificado: string;
  titulo_capacitacion: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  esta_vigente?: boolean;
  horas_certificadas: number;
  nota_obtenida: number;
  codigo_verificacion: string;
  url_certificado?: string;
  anulado: boolean;
  motivo_anulacion?: string;
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
  enlace_virtual?: string;
  instructor?: number;
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
