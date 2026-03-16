/**
 * Tipos TypeScript para Planificacion del Sistema - Gestion Estrategica
 * Sistema de Gestion StrateKaz
 *
 * Migrado desde features/hseq a features/gestion-estrategica (N1)
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

export type EstadoPlanTrabajo =
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'EN_EJECUCION'
  | 'CERRADO'
  | 'CANCELADO';

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

export type EstadoPrograma =
  | 'PLANIFICADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'SUSPENDIDO'
  | 'CANCELADO';

export type EstadoActividadPrograma = 'PENDIENTE' | 'EN_PROCESO' | 'EJECUTADA' | 'CANCELADA';

export type NivelCumplimiento = 'EXCELENTE' | 'BUENO' | 'ACEPTABLE' | 'DEFICIENTE';

// ==================== PLAN TRABAJO ANUAL ====================

/**
 * Plan de Trabajo Anual del Sistema de Gestion
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
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  aprobado_por_nombre?: string;
  fecha_aprobacion: string | null;
  descripcion: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  // Campos calculados (serializer)
  total_actividades?: number;
  total_objetivos?: number;
  total_programas?: number;
  porcentaje_avance?: number;
  actividades_resumen?: {
    total: number;
    pendientes: number;
    en_proceso: number;
    completadas: number;
    retrasadas: number;
  };
  objetivos_resumen?: {
    total: number;
    activos: number;
    cumplidos: number;
    no_cumplidos: number;
  };
  programas_resumen?: {
    total: number;
    en_ejecucion: number;
    completados: number;
  };
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
  plan_trabajo_codigo?: string;
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
  responsable_nombre?: string;
  colaboradores: number[];
  colaboradores_detail?: UserDetail[];
  colaboradores_nombres?: string[];
  recursos_necesarios: string;
  presupuesto_estimado: string | null;
  presupuesto_ejecutado: string | null;
  estado: EstadoActividad;
  porcentaje_avance: string;
  evidencias: string;
  resultados_obtenidos: string;
  observaciones: string;
  dias_restantes?: number | null;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
}

// ==================== OBJETIVO SISTEMA ====================

/**
 * Objetivos del Sistema vinculados al Balanced Scorecard
 */
export interface ObjetivoSistema {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  plan_trabajo_codigo?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva_bsc: PerspectivaBSC;
  objetivo_bsc_id: string;
  tipo_objetivo: TipoObjetivo;
  area_aplicacion: AreaAplicacion;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_nombre?: string;
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
  dias_para_meta?: number | null;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
}

// ==================== PROGRAMA GESTION ====================

/**
 * Programas de Gestion del Sistema
 */
export interface ProgramaGestion {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_detail?: Partial<PlanTrabajoAnual>;
  plan_trabajo_codigo?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  alcance: string;
  objetivos: string;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_nombre?: string;
  coordinadores: number[];
  coordinadores_detail?: UserDetail[];
  coordinadores_nombres?: string[];
  fecha_inicio: string;
  fecha_fin: string;
  recursos_asignados: string;
  presupuesto: string | null;
  estado: EstadoPrograma;
  porcentaje_avance: string;
  indicadores_medicion: string;
  observaciones: string;
  total_actividades?: number;
  actividades_completadas?: number;
  actividades_resumen?: {
    total: number;
    pendientes: number;
    en_proceso: number;
    ejecutadas: number;
  };
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
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
  programa_codigo?: string;
  programa_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_programada: string;
  fecha_ejecucion: string | null;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_nombre?: string;
  estado: EstadoActividadPrograma;
  resultado: string;
  evidencias: string;
  observaciones: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
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
  plan_trabajo_codigo?: string;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
  realizado_por_detail?: UserDetail;
  realizado_por_nombre?: string;
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
  eficiencia_presupuestal?: number | null;
  created_by: number | null;
  created_by_detail?: UserDetail;
  created_by_nombre?: string;
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

/**
 * Respuesta paginada genérica
 */
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
  plan: {
    codigo: string;
    nombre: string;
    periodo: number;
    estado: EstadoPlanTrabajo;
  };
  metricas_actividades: {
    total: number;
    por_estado: {
      pendientes: number;
      en_proceso: number;
      completadas: number;
      retrasadas: number;
      canceladas: number;
    };
    porcentaje_avance: number;
  };
  metricas_objetivos: {
    total: number;
    por_estado: {
      activos: number;
      en_seguimiento: number;
      cumplidos: number;
      no_cumplidos: number;
    };
    cumplimiento_promedio: number;
  };
  metricas_programas: {
    total: number;
    por_estado: {
      planificados: number;
      en_ejecucion: number;
      completados: number;
    };
  };
  presupuesto: {
    estimado: number;
    ejecutado: number;
    eficiencia: number;
  };
}
