/**
 * Tipos TypeScript para Planificacion del Sistema - HSEQ Management
 * Sistema de Gestion Grasas y Huesos del Norte
 *
 * Incluye:
 * - Plan de Trabajo Anual
 * - Actividades del Plan
 * - Objetivos del Sistema (vinculados a BSC)
 * - Programas de Gestion
 * - Actividades de Programas
 * - Seguimiento de Cronograma
 */

// ==================== USER DETAIL ====================

/**
 * Información básica de usuario para relaciones
 */
export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== ENUMS Y TIPOS ====================

export type EstadoPlanTrabajo = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'EN_EJECUCION' | 'CERRADO' | 'CANCELADO';

export type TipoActividad =
  | 'CAPACITACION'
  | 'INSPECCION'
  | 'AUDITORIA'
  | 'MANTENIMIENTO'
  | 'SIMULACRO'
  | 'REVISION'
  | 'EVALUACION'
  | 'ACTUALIZACION'
  | 'MEJORA'
  | 'OTRA';

export type EstadoActividad = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'RETRASADA';

export type PerspectivaBSC = 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';

export type TipoObjetivo = 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO';

export type AreaAplicacion = 'SST' | 'CALIDAD' | 'AMBIENTAL' | 'INTEGRAL';

export type EstadoObjetivo = 'ACTIVO' | 'EN_SEGUIMIENTO' | 'CUMPLIDO' | 'NO_CUMPLIDO' | 'CANCELADO';

export type TipoPrograma =
  | 'PVE'
  | 'CAPACITACION'
  | 'INSPECCIONES'
  | 'MANTENIMIENTO'
  | 'AMBIENTAL'
  | 'RESIDUOS'
  | 'EMERGENCIAS'
  | 'MEDICINA'
  | 'HIGIENE'
  | 'SEGURIDAD'
  | 'OTRO';

export type EstadoPrograma = 'PLANIFICADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'SUSPENDIDO' | 'CANCELADO';

export type EstadoActividadPrograma = 'PENDIENTE' | 'EN_PROCESO' | 'EJECUTADA' | 'CANCELADA';

export type NivelCumplimiento = 'EXCELENTE' | 'BUENO' | 'ACEPTABLE' | 'DEFICIENTE';

// ==================== PLAN TRABAJO ANUAL ====================

/**
 * Plan de Trabajo Anual del Sistema HSEQ
 */
export interface PlanTrabajoAnual {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  periodo: number;
  estado: EstadoPlanTrabajo;
  responsable: number;
  responsable_detail?: UserDetail;
  fecha_inicio: string;
  fecha_fin: string;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  fecha_aprobacion: string | null;
  descripcion: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
  actividades?: ActividadPlan[];
  objetivos?: ObjetivoSistema[];
  programas?: ProgramaGestion[];
  seguimientos?: SeguimientoCronograma[];
}

// ==================== ACTIVIDAD PLAN ====================

/**
 * Actividades del Plan de Trabajo Anual
 */
export interface ActividadPlan {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_actividad: TipoActividad;
  area_responsable: string;
  fecha_programada_inicio: string;
  fecha_programada_fin: string;
  fecha_real_inicio: string | null;
  fecha_real_fin: string | null;
  responsable: number;
  responsable_detail?: UserDetail;
  colaboradores: number[];
  colaboradores_detail?: UserDetail[];
  recursos_necesarios: string;
  presupuesto_estimado: string | null;
  presupuesto_ejecutado: string | null;
  estado: EstadoActividad;
  porcentaje_avance: string;
  evidencias: string;
  resultados_obtenidos: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

// ==================== OBJETIVO SISTEMA ====================

/**
 * Objetivos del Sistema HSEQ vinculados al Balanced Scorecard
 */
export interface ObjetivoSistema {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva_bsc: PerspectivaBSC;
  objetivo_bsc_id: string;
  tipo_objetivo: TipoObjetivo;
  area_aplicacion: AreaAplicacion;
  responsable: number;
  responsable_detail?: UserDetail;
  meta_descripcion: string;
  meta_cuantitativa: string | null;
  unidad_medida: string;
  indicador_nombre: string;
  formula_calculo: string;
  valor_actual: string | null;
  porcentaje_cumplimiento: string;
  estado: EstadoObjetivo;
  fecha_inicio: string;
  fecha_meta: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

// ==================== PROGRAMA GESTION ====================

/**
 * Programas de Gestion del Sistema HSEQ
 */
export interface ProgramaGestion {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  alcance: string;
  objetivos: string;
  responsable: number;
  responsable_detail?: UserDetail;
  coordinadores: number[];
  coordinadores_detail?: UserDetail[];
  fecha_inicio: string;
  fecha_fin: string;
  recursos_asignados: string;
  presupuesto: string | null;
  estado: EstadoPrograma;
  porcentaje_avance: string;
  indicadores_medicion: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
  actividades?: ActividadPrograma[];
}

// ==================== ACTIVIDAD PROGRAMA ====================

/**
 * Actividades de un Programa de Gestion
 */
export interface ActividadPrograma {
  id: number;
  empresa_id: number;
  programa: number;
  programa_detail?: Partial<ProgramaGestion>;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_programada: string;
  fecha_ejecucion: string | null;
  responsable: number;
  responsable_detail?: UserDetail;
  estado: EstadoActividadPrograma;
  resultado: string;
  evidencias: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

// ==================== SEGUIMIENTO CRONOGRAMA ====================

/**
 * Seguimiento del Cronograma de Actividades
 */
export interface SeguimientoCronograma {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
  realizado_por_detail?: UserDetail;
  actividades_totales: number;
  actividades_completadas: number;
  actividades_en_proceso: number;
  actividades_retrasadas: number;
  actividades_pendientes: number;
  porcentaje_avance_general: string;
  presupuesto_planificado: string | null;
  presupuesto_ejecutado: string | null;
  desviaciones_identificadas: string;
  causas_desviacion: string;
  acciones_correctivas: string;
  acciones_preventivas: string;
  nivel_cumplimiento: NivelCumplimiento | '';
  observaciones: string;
  recomendaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreatePlanTrabajoAnualDTO {
  codigo: string;
  nombre: string;
  periodo: number;
  responsable: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
  observaciones?: string;
}

export interface CreateActividadPlanDTO {
  plan_trabajo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_actividad: TipoActividad;
  area_responsable: string;
  fecha_programada_inicio: string;
  fecha_programada_fin: string;
  responsable: number;
  colaboradores?: number[];
  recursos_necesarios?: string;
  presupuesto_estimado?: number;
  observaciones?: string;
}

export interface CreateObjetivoSistemaDTO {
  plan_trabajo: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva_bsc: PerspectivaBSC;
  objetivo_bsc_id?: string;
  tipo_objetivo: TipoObjetivo;
  area_aplicacion: AreaAplicacion;
  responsable: number;
  meta_descripcion: string;
  meta_cuantitativa?: number;
  unidad_medida?: string;
  indicador_nombre: string;
  formula_calculo?: string;
  fecha_inicio: string;
  fecha_meta: string;
  observaciones?: string;
}

export interface CreateProgramaGestionDTO {
  plan_trabajo: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  alcance: string;
  objetivos: string;
  responsable: number;
  coordinadores?: number[];
  fecha_inicio: string;
  fecha_fin: string;
  recursos_asignados?: string;
  presupuesto?: number;
  indicadores_medicion?: string;
  observaciones?: string;
}

export interface CreateActividadProgramaDTO {
  programa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  fecha_programada: string;
  responsable: number;
  observaciones?: string;
}

export interface CreateSeguimientoCronogramaDTO {
  plan_trabajo: number;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
  actividades_totales: number;
  actividades_completadas: number;
  actividades_en_proceso: number;
  actividades_retrasadas: number;
  actividades_pendientes: number;
  porcentaje_avance_general: number;
  presupuesto_planificado?: number;
  presupuesto_ejecutado?: number;
  desviaciones_identificadas?: string;
  causas_desviacion?: string;
  acciones_correctivas?: string;
  acciones_preventivas?: string;
  nivel_cumplimiento?: NivelCumplimiento;
  observaciones?: string;
  recomendaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdatePlanTrabajoAnualDTO {
  codigo?: string;
  nombre?: string;
  periodo?: number;
  estado?: EstadoPlanTrabajo;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  descripcion?: string;
  observaciones?: string;
}

export interface UpdateActividadPlanDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo_actividad?: TipoActividad;
  area_responsable?: string;
  fecha_programada_inicio?: string;
  fecha_programada_fin?: string;
  fecha_real_inicio?: string;
  fecha_real_fin?: string;
  responsable?: number;
  colaboradores?: number[];
  recursos_necesarios?: string;
  presupuesto_estimado?: number;
  presupuesto_ejecutado?: number;
  estado?: EstadoActividad;
  porcentaje_avance?: number;
  evidencias?: string;
  resultados_obtenidos?: string;
  observaciones?: string;
}

export interface UpdateObjetivoSistemaDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  perspectiva_bsc?: PerspectivaBSC;
  objetivo_bsc_id?: string;
  tipo_objetivo?: TipoObjetivo;
  area_aplicacion?: AreaAplicacion;
  responsable?: number;
  meta_descripcion?: string;
  meta_cuantitativa?: number;
  unidad_medida?: string;
  indicador_nombre?: string;
  formula_calculo?: string;
  valor_actual?: number;
  porcentaje_cumplimiento?: number;
  estado?: EstadoObjetivo;
  fecha_inicio?: string;
  fecha_meta?: string;
  observaciones?: string;
}

export interface UpdateProgramaGestionDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo_programa?: TipoPrograma;
  alcance?: string;
  objetivos?: string;
  responsable?: number;
  coordinadores?: number[];
  fecha_inicio?: string;
  fecha_fin?: string;
  recursos_asignados?: string;
  presupuesto?: number;
  estado?: EstadoPrograma;
  porcentaje_avance?: number;
  indicadores_medicion?: string;
  observaciones?: string;
}

export interface UpdateActividadProgramaDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  fecha_programada?: string;
  fecha_ejecucion?: string;
  responsable?: number;
  estado?: EstadoActividadPrograma;
  resultado?: string;
  evidencias?: string;
  observaciones?: string;
}

export interface UpdateSeguimientoCronogramaDTO {
  periodo?: string;
  fecha_seguimiento?: string;
  realizado_por?: number;
  actividades_totales?: number;
  actividades_completadas?: number;
  actividades_en_proceso?: number;
  actividades_retrasadas?: number;
  actividades_pendientes?: number;
  porcentaje_avance_general?: number;
  presupuesto_planificado?: number;
  presupuesto_ejecutado?: number;
  desviaciones_identificadas?: string;
  causas_desviacion?: string;
  acciones_correctivas?: string;
  acciones_preventivas?: string;
  nivel_cumplimiento?: NivelCumplimiento;
  observaciones?: string;
  recomendaciones?: string;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Estadísticas del Plan de Trabajo
 */
export interface EstadisticasPlanTrabajo {
  plan_id: number;
  plan_codigo: string;
  plan_nombre: string;
  periodo: number;
  estado: EstadoPlanTrabajo;

  // Actividades
  total_actividades: number;
  actividades_completadas: number;
  actividades_en_proceso: number;
  actividades_pendientes: number;
  actividades_retrasadas: number;
  actividades_canceladas: number;
  porcentaje_avance_actividades: number;

  // Objetivos
  total_objetivos: number;
  objetivos_cumplidos: number;
  objetivos_en_seguimiento: number;
  objetivos_no_cumplidos: number;
  porcentaje_cumplimiento_objetivos: number;

  // Programas
  total_programas: number;
  programas_completados: number;
  programas_en_ejecucion: number;
  programas_planificados: number;
  porcentaje_avance_programas: number;

  // Presupuesto
  presupuesto_total_estimado: number;
  presupuesto_total_ejecutado: number;
  porcentaje_ejecucion_presupuestaria: number;

  // Por tipo de actividad
  actividades_por_tipo: Array<{
    tipo: TipoActividad;
    cantidad: number;
    completadas: number;
  }>;

  // Por area
  actividades_por_area: Array<{
    area: string;
    cantidad: number;
    completadas: number;
  }>;

  // Por perspectiva BSC
  objetivos_por_perspectiva: Array<{
    perspectiva: PerspectivaBSC;
    cantidad: number;
    cumplidos: number;
    porcentaje_cumplimiento: number;
  }>;

  // Por tipo de programa
  programas_por_tipo: Array<{
    tipo: TipoPrograma;
    cantidad: number;
    completados: number;
  }>;

  // Alertas
  actividades_proximas_vencer: number;
  actividades_vencidas: number;
  objetivos_riesgo_incumplimiento: number;
  programas_atrasados: number;
}
