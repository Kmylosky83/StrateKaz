/**
 * Tipos TypeScript para el módulo de Planificación del Sistema HSEQ
 * Sistema de Gestión StrateKaz
 *
 * Mapea los modelos del backend:
 * - Plan de Trabajo Anual
 * - Actividades del Plan
 * - Objetivos del Sistema
 * - Programas de Gestión
 * - Actividades del Programa
 * - Seguimiento de Cronograma
 */

// ==================== ENUMS ====================

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

// ==================== COMMON TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== PLAN DE TRABAJO ANUAL ====================

export interface PlanTrabajoAnual {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  periodo: number;
  estado: EstadoPlanTrabajo;
  estado_display?: string;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_name?: string;
  fecha_inicio: string;
  fecha_fin: string;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  aprobado_por_name?: string | null;
  fecha_aprobacion: string | null;
  descripcion: string;
  observaciones: string;
  // Campos calculados
  actividades_count?: number;
  objetivos_count?: number;
  programas_count?: number;
  porcentaje_avance?: number;
  actividades_completadas?: number;
  actividades_totales?: number;
  dias_restantes?: number;
  esta_vencido?: boolean;
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanTrabajoAnualDTO {
  empresa_id: number;
  codigo: string;
  nombre: string;
  periodo: number;
  responsable: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
  observaciones?: string;
  estado?: EstadoPlanTrabajo;
}

export interface UpdatePlanTrabajoAnualDTO {
  nombre?: string;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  descripcion?: string;
  observaciones?: string;
  estado?: EstadoPlanTrabajo;
}

export interface PlanTrabajoAnualFilters {
  empresa_id?: number;
  periodo?: number;
  estado?: EstadoPlanTrabajo;
  responsable?: number;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  search?: string;
}

// ==================== ACTIVIDAD DEL PLAN ====================

export interface ActividadPlan {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_codigo?: string;
  plan_trabajo_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_actividad: TipoActividad;
  tipo_actividad_display?: string;
  area_responsable: string;
  fecha_programada_inicio: string;
  fecha_programada_fin: string;
  fecha_real_inicio: string | null;
  fecha_real_fin: string | null;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_name?: string;
  colaboradores: number[];
  colaboradores_details?: UserDetail[];
  colaboradores_names?: string[];
  recursos_necesarios: string;
  presupuesto_estimado: string | null;
  presupuesto_ejecutado: string | null;
  estado: EstadoActividad;
  estado_display?: string;
  porcentaje_avance: string;
  evidencias: string;
  resultados_obtenidos: string;
  observaciones: string;
  // Campos calculados
  dias_restantes?: number;
  esta_retrasada?: boolean;
  desviacion_presupuesto?: string;
  duracion_programada_dias?: number;
  duracion_real_dias?: number;
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActividadPlanDTO {
  empresa_id: number;
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
  estado?: EstadoActividad;
  porcentaje_avance?: number;
}

export interface UpdateActividadPlanDTO {
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

export interface ActividadPlanFilters {
  empresa_id?: number;
  plan_trabajo?: number;
  tipo_actividad?: TipoActividad;
  estado?: EstadoActividad;
  responsable?: number;
  area_responsable?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  esta_retrasada?: boolean;
  search?: string;
}

// ==================== OBJETIVO DEL SISTEMA ====================

export interface ObjetivoSistema {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_codigo?: string;
  plan_trabajo_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  perspectiva_bsc: PerspectivaBSC;
  perspectiva_bsc_display?: string;
  objetivo_bsc_id: string;
  tipo_objetivo: TipoObjetivo;
  tipo_objetivo_display?: string;
  area_aplicacion: AreaAplicacion;
  area_aplicacion_display?: string;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_name?: string;
  meta_descripcion: string;
  meta_cuantitativa: string | null;
  unidad_medida: string;
  indicador_nombre: string;
  formula_calculo: string;
  valor_actual: string | null;
  porcentaje_cumplimiento: string;
  estado: EstadoObjetivo;
  estado_display?: string;
  fecha_inicio: string;
  fecha_meta: string;
  observaciones: string;
  // Campos calculados
  dias_para_meta?: number;
  esta_vencido?: boolean;
  cumplimiento_color?: 'success' | 'warning' | 'danger';
  desviacion?: string;
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateObjetivoSistemaDTO {
  empresa_id: number;
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
  valor_actual?: number;
  porcentaje_cumplimiento?: number;
  estado?: EstadoObjetivo;
}

export interface UpdateObjetivoSistemaDTO {
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

export interface ObjetivoSistemaFilters {
  empresa_id?: number;
  plan_trabajo?: number;
  perspectiva_bsc?: PerspectivaBSC;
  tipo_objetivo?: TipoObjetivo;
  area_aplicacion?: AreaAplicacion;
  estado?: EstadoObjetivo;
  responsable?: number;
  esta_vencido?: boolean;
  search?: string;
}

// ==================== PROGRAMA DE GESTIÓN ====================

export interface ProgramaGestion {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_codigo?: string;
  plan_trabajo_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  tipo_programa_display?: string;
  alcance: string;
  objetivos: string;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_name?: string;
  coordinadores: number[];
  coordinadores_details?: UserDetail[];
  coordinadores_names?: string[];
  fecha_inicio: string;
  fecha_fin: string;
  recursos_asignados: string;
  presupuesto: string | null;
  estado: EstadoPrograma;
  estado_display?: string;
  porcentaje_avance: string;
  indicadores_medicion: string;
  observaciones: string;
  // Campos calculados
  actividades_count?: number;
  actividades_completadas?: number;
  actividades_pendientes?: number;
  dias_restantes?: number;
  esta_vencido?: boolean;
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramaGestionDTO {
  empresa_id: number;
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
  estado?: EstadoPrograma;
}

export interface UpdateProgramaGestionDTO {
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

export interface ProgramaGestionFilters {
  empresa_id?: number;
  plan_trabajo?: number;
  tipo_programa?: TipoPrograma;
  estado?: EstadoPrograma;
  responsable?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

// ==================== ACTIVIDAD DEL PROGRAMA ====================

export interface ActividadPrograma {
  id: number;
  empresa_id: number;
  programa: number;
  programa_codigo?: string;
  programa_nombre?: string;
  programa_tipo?: TipoPrograma;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha_programada: string;
  fecha_ejecucion: string | null;
  responsable: number;
  responsable_detail?: UserDetail;
  responsable_name?: string;
  estado: EstadoActividadPrograma;
  estado_display?: string;
  resultado: string;
  evidencias: string;
  observaciones: string;
  // Campos calculados
  dias_hasta_programada?: number;
  esta_vencida?: boolean;
  dias_diferencia?: number; // entre programada y ejecutada
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActividadProgramaDTO {
  empresa_id: number;
  programa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  fecha_programada: string;
  responsable: number;
  estado?: EstadoActividadPrograma;
}

export interface UpdateActividadProgramaDTO {
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

export interface ActividadProgramaFilters {
  empresa_id?: number;
  programa?: number;
  estado?: EstadoActividadPrograma;
  responsable?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  esta_vencida?: boolean;
  search?: string;
}

// ==================== SEGUIMIENTO DE CRONOGRAMA ====================

export interface SeguimientoCronograma {
  id: number;
  empresa_id: number;
  plan_trabajo: number;
  plan_trabajo_codigo?: string;
  plan_trabajo_nombre?: string;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
  realizado_por_detail?: UserDetail;
  realizado_por_name?: string;
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
  nivel_cumplimiento_display?: string;
  observaciones: string;
  recomendaciones: string;
  // Campos calculados
  porcentaje_cumplimiento?: number;
  porcentaje_presupuesto_ejecutado?: number;
  desviacion_presupuesto?: string;
  cumplimiento_color?: 'success' | 'warning' | 'danger';
  // Auditoría
  created_by: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSeguimientoCronogramaDTO {
  empresa_id: number;
  plan_trabajo: number;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
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

export interface SeguimientoCronogramaFilters {
  empresa_id?: number;
  plan_trabajo?: number;
  periodo?: string;
  nivel_cumplimiento?: NivelCumplimiento;
  realizado_por?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

// ==================== ESTADÍSTICAS DEL DASHBOARD ====================

export interface PlanificacionDashboardStats {
  // Plan de Trabajo
  plan_actual?: PlanTrabajoAnual | null;
  tiene_plan_activo: boolean;
  porcentaje_avance_plan: number;

  // Actividades
  total_actividades: number;
  actividades_completadas: number;
  actividades_en_proceso: number;
  actividades_pendientes: number;
  actividades_retrasadas: number;
  actividades_canceladas: number;

  // Objetivos
  total_objetivos: number;
  objetivos_cumplidos: number;
  objetivos_en_seguimiento: number;
  objetivos_no_cumplidos: number;
  porcentaje_cumplimiento_objetivos: number;

  // Objetivos por perspectiva BSC
  objetivos_por_perspectiva: {
    FINANCIERA: number;
    CLIENTES: number;
    PROCESOS: number;
    APRENDIZAJE: number;
  };

  // Programas
  total_programas: number;
  programas_en_ejecucion: number;
  programas_completados: number;
  programas_planificados: number;

  // Programas por tipo
  programas_por_tipo: {
    PVE: number;
    CAPACITACION: number;
    INSPECCIONES: number;
    MANTENIMIENTO: number;
    AMBIENTAL: number;
    RESIDUOS: number;
    EMERGENCIAS: number;
    MEDICINA: number;
    HIGIENE: number;
    SEGURIDAD: number;
    OTRO: number;
  };

  // Presupuesto
  presupuesto_total_planificado: number;
  presupuesto_total_ejecutado: number;
  porcentaje_ejecucion_presupuesto: number;
  desviacion_presupuesto: number;

  // Seguimiento
  ultimo_seguimiento?: SeguimientoCronograma | null;
  nivel_cumplimiento_actual: NivelCumplimiento | null;
  dias_desde_ultimo_seguimiento: number | null;

  // Alertas
  actividades_proximas_vencer: number;
  objetivos_proximos_vencer: number;
  actividades_vencidas: number;
  objetivos_vencidos: number;

  // Tendencias (últimos 6 meses)
  tendencia_cumplimiento: Array<{
    mes: string;
    porcentaje_cumplimiento: number;
    actividades_completadas: number;
    actividades_totales: number;
  }>;

  // Top responsables
  top_responsables_actividades: Array<{
    responsable_id: number;
    responsable_name: string;
    total_actividades: number;
    actividades_completadas: number;
    porcentaje_cumplimiento: number;
  }>;
}

export interface ObjetivosPorPerspectiva {
  perspectiva: PerspectivaBSC;
  perspectiva_display: string;
  total: number;
  cumplidos: number;
  en_seguimiento: number;
  no_cumplidos: number;
  porcentaje_cumplimiento: number;
  objetivos: ObjetivoSistema[];
}

export interface ActividadesPorTipo {
  tipo: TipoActividad;
  tipo_display: string;
  total: number;
  completadas: number;
  en_proceso: number;
  pendientes: number;
  retrasadas: number;
  porcentaje_cumplimiento: number;
}

export interface ProgramasPorTipo {
  tipo: TipoPrograma;
  tipo_display: string;
  total: number;
  en_ejecucion: number;
  completados: number;
  planificados: number;
  porcentaje_avance_promedio: number;
  actividades_totales: number;
  actividades_ejecutadas: number;
}

// ==================== REPORTES ====================

export interface ReportePlanTrabajo {
  plan: PlanTrabajoAnual;
  resumen_general: {
    total_actividades: number;
    actividades_completadas: number;
    actividades_en_proceso: number;
    actividades_pendientes: number;
    actividades_retrasadas: number;
    porcentaje_avance_general: number;
  };
  resumen_por_tipo: ActividadesPorTipo[];
  resumen_objetivos: {
    total: number;
    cumplidos: number;
    en_seguimiento: number;
    no_cumplidos: number;
    porcentaje_cumplimiento: number;
  };
  resumen_objetivos_por_perspectiva: ObjetivosPorPerspectiva[];
  resumen_programas: {
    total: number;
    en_ejecucion: number;
    completados: number;
    porcentaje_avance_promedio: number;
  };
  resumen_programas_por_tipo: ProgramasPorTipo[];
  resumen_presupuesto: {
    planificado: number;
    ejecutado: number;
    porcentaje_ejecucion: number;
    desviacion: number;
  };
  seguimientos: SeguimientoCronograma[];
  actividades_criticas: ActividadPlan[];
  objetivos_en_riesgo: ObjetivoSistema[];
}

export interface ReporteAvanceMensual {
  periodo: string;
  mes: number;
  anio: number;
  actividades_programadas: number;
  actividades_ejecutadas: number;
  porcentaje_ejecucion: number;
  objetivos_evaluados: number;
  porcentaje_cumplimiento_objetivos: number;
  presupuesto_planificado: number;
  presupuesto_ejecutado: number;
  nivel_cumplimiento: NivelCumplimiento;
  actividades_por_tipo: ActividadesPorTipo[];
  principales_logros: string[];
  principales_desviaciones: string[];
  acciones_correctivas: string[];
}

// ==================== SELECT OPTIONS ====================

export interface SelectOption {
  value: string | number;
  label: string;
}

// ==================== FILTROS GENERALES ====================

export interface DateRangeFilter {
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface CommonFilters extends DateRangeFilter {
  empresa_id?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
