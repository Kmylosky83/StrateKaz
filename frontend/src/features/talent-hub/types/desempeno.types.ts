/**
 * Tipos TypeScript para Desempeno - Talent Hub
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Basado en: backend/apps/talent_hub/desempeno/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type TipoCicloEvaluacion =
  | 'anual'
  | 'semestral'
  | 'trimestral'
  | 'especial';

export type EstadoCiclo =
  | 'planificado'
  | 'en_configuracion'
  | 'activo'
  | 'en_evaluacion'
  | 'en_revision'
  | 'cerrado'
  | 'cancelado';

export type TipoCompetenciaEvaluacion =
  | 'tecnica'
  | 'comportamental'
  | 'organizacional'
  | 'liderazgo'
  | 'funcional';

export type NivelCompetencia =
  | 'basico'
  | 'intermedio'
  | 'avanzado'
  | 'experto';

export type EstadoEvaluacionDesempeno =
  | 'pendiente'
  | 'en_autoevaluacion'
  | 'en_evaluacion_jefe'
  | 'en_evaluacion_pares'
  | 'en_revision'
  | 'calibracion'
  | 'retroalimentacion'
  | 'completada'
  | 'cancelada';

export type TipoEvaluador =
  | 'autoevaluacion'
  | 'jefe'
  | 'par'
  | 'subordinado';

export type EstadoEvaluadorPar =
  | 'pendiente'
  | 'en_proceso'
  | 'completada'
  | 'rechazada';

export type TipoPlanMejora =
  | 'desarrollo'
  | 'mejora'
  | 'alto_potencial'
  | 'correctivo'
  | 'transicion';

export type EstadoPlanMejora =
  | 'borrador'
  | 'aprobado'
  | 'en_ejecucion'
  | 'seguimiento'
  | 'completado'
  | 'cancelado';

export type TipoActividadMejora =
  | 'capacitacion'
  | 'coaching'
  | 'mentoria'
  | 'proyecto'
  | 'lectura'
  | 'rotacion'
  | 'asignacion'
  | 'otro';

export type EstadoActividadMejora =
  | 'pendiente'
  | 'en_progreso'
  | 'completada'
  | 'cancelada';

export type CategoriaReconocimiento =
  | 'desempeno'
  | 'innovacion'
  | 'servicio'
  | 'equipo'
  | 'liderazgo'
  | 'antiguedad'
  | 'otro';

export type EstadoReconocimiento =
  | 'pendiente'
  | 'aprobado'
  | 'entregado'
  | 'rechazado';

// =============================================================================
// INTERFACES DE MODELOS
// =============================================================================

export interface CicloEvaluacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_ciclo: TipoCicloEvaluacion;
  tipo_display?: string;
  anio: number;
  periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_inicio_evaluacion?: string;
  fecha_fin_evaluacion?: string;
  fecha_revision?: string;
  fecha_cierre?: string;
  incluye_autoevaluacion: boolean;
  incluye_evaluacion_jefe: boolean;
  incluye_evaluacion_pares: boolean;
  incluye_evaluacion_subordinados: boolean;
  numero_pares_requeridos: number;
  peso_autoevaluacion: number;
  peso_evaluacion_jefe: number;
  peso_evaluacion_pares: number;
  peso_evaluacion_subordinados: number;
  peso_total?: number;
  estado: EstadoCiclo;
  estado_display?: string;
  evaluaciones_count?: number;
  is_active: boolean;
}

export interface CompetenciaEvaluacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_competencia: TipoCompetenciaEvaluacion;
  tipo_display?: string;
  nivel_esperado: NivelCompetencia;
  nivel_display?: string;
  indicadores_basico?: string;
  indicadores_intermedio?: string;
  indicadores_avanzado?: string;
  indicadores_experto?: string;
  peso: number;
  orden: number;
  aplica_a_todos: boolean;
  cargos_aplicables: number[];
  criterios?: CriterioEvaluacion[];
  criterios_count?: number;
  is_active: boolean;
}

export interface CriterioEvaluacion {
  id: number;
  competencia: number;
  descripcion: string;
  peso: number;
  orden: number;
}

export interface EscalaCalificacion {
  id: number;
  ciclo: number;
  valor: number;
  etiqueta: string;
  descripcion?: string;
  color: string;
}

export interface EvaluacionDesempeno {
  id: number;
  ciclo: number;
  ciclo_codigo?: string;
  ciclo_nombre?: string;
  ciclo_info?: CicloEvaluacion;
  colaborador: number;
  colaborador_nombre?: string;
  jefe_evaluador?: number;
  jefe_nombre?: string;
  fecha_asignacion: string;
  fecha_inicio_autoevaluacion?: string;
  fecha_fin_autoevaluacion?: string;
  fecha_evaluacion_jefe?: string;
  fecha_revision?: string;
  fecha_retroalimentacion?: string;
  fecha_cierre?: string;
  calificacion_autoevaluacion?: number;
  calificacion_jefe?: number;
  calificacion_pares?: number;
  calificacion_subordinados?: number;
  calificacion_final?: number;
  calificacion_calibrada?: number;
  motivo_calibracion?: string;
  calibrado_por?: number;
  calibrado_por_nombre?: string;
  estado: EstadoEvaluacionDesempeno;
  estado_display?: string;
  fortalezas?: string;
  areas_mejora?: string;
  compromisos?: string;
  comentarios_colaborador?: string;
  firma_colaborador: boolean;
  fecha_firma_colaborador?: string;
  detalles?: DetalleEvaluacion[];
  evaluadores_pares?: EvaluadorPar[];
}

export interface DetalleEvaluacion {
  id: number;
  evaluacion: number;
  competencia: number;
  competencia_nombre?: string;
  criterio?: number;
  criterio_descripcion?: string;
  tipo_evaluador: TipoEvaluador;
  tipo_evaluador_display?: string;
  evaluador?: number;
  evaluador_nombre?: string;
  calificacion: number;
  comentario?: string;
  fecha_evaluacion: string;
}

export interface EvaluadorPar {
  id: number;
  evaluacion: number;
  evaluador: number;
  evaluador_nombre?: string;
  es_subordinado: boolean;
  fecha_asignacion: string;
  fecha_limite?: string;
  fecha_evaluacion?: string;
  calificacion_otorgada?: number;
  estado: EstadoEvaluadorPar;
  estado_display?: string;
  comentario?: string;
}

export interface PlanMejora {
  id: number;
  evaluacion?: number;
  colaborador: number;
  colaborador_nombre?: string;
  codigo: string;
  titulo: string;
  tipo_plan: TipoPlanMejora;
  tipo_display?: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_aprobacion?: string;
  responsable: number;
  responsable_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  objetivo_general: string;
  competencias_a_desarrollar?: string;
  recursos_necesarios?: string;
  indicadores_exito?: string;
  estado: EstadoPlanMejora;
  estado_display?: string;
  porcentaje_avance: number;
  observaciones?: string;
  actividades?: ActividadPlanMejora[];
  seguimientos?: SeguimientoPlanMejora[];
  actividades_count?: number;
}

export interface ActividadPlanMejora {
  id: number;
  plan: number;
  tipo_actividad: TipoActividadMejora;
  tipo_display?: string;
  descripcion: string;
  resultado_esperado?: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_completado?: string;
  responsable?: number;
  responsable_nombre?: string;
  prioridad: 1 | 2 | 3;
  estado: EstadoActividadMejora;
  estado_display?: string;
  comentarios?: string;
  evidencia?: string;
}

export interface SeguimientoPlanMejora {
  id: number;
  plan: number;
  fecha_seguimiento: string;
  realizado_por: number;
  realizado_por_nombre?: string;
  porcentaje_avance: number;
  logros?: string;
  dificultades?: string;
  acciones_correctivas?: string;
  proxima_fecha_seguimiento?: string;
  observaciones?: string;
}

export interface TipoReconocimiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaReconocimiento;
  categoria_display?: string;
  icono?: string;
  color: string;
  puntos_otorgados: number;
  tiene_premio: boolean;
  descripcion_premio?: string;
  valor_premio: number;
  orden: number;
  is_active: boolean;
}

export interface Reconocimiento {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_reconocimiento: number;
  tipo_nombre?: string;
  tipo_categoria?: string;
  tipo_info?: TipoReconocimiento;
  evaluacion?: number;
  fecha_reconocimiento: string;
  motivo: string;
  logro_especifico?: string;
  nominado_por: number;
  nominado_por_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  estado: EstadoReconocimiento;
  estado_display?: string;
  puntos_otorgados: number;
  premio_entregado: boolean;
  fecha_entrega_premio?: string;
  es_publico: boolean;
  publicado_en_muro: boolean;
  fecha_publicacion?: string;
  observaciones?: string;
}

export interface MuroReconocimiento {
  id: number;
  reconocimiento: number;
  reconocimiento_info?: Reconocimiento;
  titulo: string;
  mensaje: string;
  imagen?: string;
  fecha_publicacion: string;
  likes: number;
  comentarios_count: number;
  es_destacado: boolean;
}

// =============================================================================
// INTERFACES PARA ESTADISTICAS
// =============================================================================

export interface DesempenoEstadisticas {
  ciclo_activo: string;
  evaluaciones_pendientes: number;
  evaluaciones_completadas: number;
  evaluaciones_en_proceso: number;
  promedio_calificacion: number;
  planes_mejora_activos: number;
  reconocimientos_mes: number;
  tasa_completitud: number;
}

export interface DistribucionCalificaciones {
  excelente: number;
  sobresaliente: number;
  bueno: number;
  aceptable: number;
  necesita_mejora: number;
}

export interface TopReconocido {
  colaborador_id: number;
  colaborador_nombre: string;
  reconocimientos: number;
}

export interface ResumenColaborador {
  colaborador_id: number;
  colaborador_nombre: string;
  ultima_calificacion?: number;
  tendencia: 'mejorando' | 'estable' | 'declinando';
  planes_mejora_activos: number;
  reconocimientos_total: number;
  puntos_acumulados: number;
}

// =============================================================================
// INTERFACES PARA FORMULARIOS
// =============================================================================

export interface CicloEvaluacionFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_ciclo: TipoCicloEvaluacion;
  anio: number;
  periodo?: number;
  fecha_inicio: string;
  fecha_fin: string;
  incluye_autoevaluacion?: boolean;
  incluye_evaluacion_jefe?: boolean;
  incluye_evaluacion_pares?: boolean;
  incluye_evaluacion_subordinados?: boolean;
  numero_pares_requeridos?: number;
  peso_autoevaluacion?: number;
  peso_evaluacion_jefe?: number;
  peso_evaluacion_pares?: number;
  peso_evaluacion_subordinados?: number;
}

export interface EvaluacionCreateFormData {
  ciclo: number;
  colaborador: number;
  jefe_evaluador?: number;
}

export interface AutoevaluacionFormData {
  calificacion: number;
  comentarios?: string;
}

export interface EvaluacionJefeFormData {
  calificacion: number;
  fortalezas: string;
  areas_mejora: string;
}

export interface CalibracionFormData {
  calificacion: number;
  motivo: string;
}

export interface PlanMejoraFormData {
  codigo: string;
  titulo: string;
  evaluacion?: number;
  colaborador: number;
  tipo_plan: TipoPlanMejora;
  fecha_inicio: string;
  fecha_fin: string;
  responsable: number;
  objetivo_general: string;
  competencias_a_desarrollar?: string;
  recursos_necesarios?: string;
  indicadores_exito?: string;
  observaciones?: string;
}

export interface ActividadMejoraFormData {
  plan: number;
  tipo_actividad: TipoActividadMejora;
  descripcion: string;
  resultado_esperado?: string;
  fecha_inicio: string;
  fecha_fin: string;
  responsable?: number;
  prioridad?: 1 | 2 | 3;
}

export interface SeguimientoFormData {
  fecha_seguimiento?: string;
  porcentaje_avance: number;
  logros?: string;
  dificultades?: string;
  acciones_correctivas?: string;
  proxima_fecha_seguimiento?: string;
  observaciones?: string;
}

export interface ReconocimientoFormData {
  colaborador: number;
  tipo_reconocimiento: number;
  evaluacion?: number;
  fecha_reconocimiento: string;
  motivo: string;
  logro_especifico?: string;
  es_publico?: boolean;
  observaciones?: string;
}

export interface PublicarMuroFormData {
  titulo?: string;
  mensaje?: string;
  es_destacado?: boolean;
}
