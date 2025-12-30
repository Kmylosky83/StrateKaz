/**
 * Tipos TypeScript para Módulo de Accidentalidad (ATEL) - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye:
 * - Accidentes de Trabajo (AT)
 * - Enfermedades Laborales (EL)
 * - Incidentes de Trabajo
 * - Investigaciones ATEL
 * - Causas Raíz
 * - Lecciones Aprendidas
 * - Planes de Acción ATEL
 */

// ==================== USER DETAIL ====================

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== ENUMS Y TIPOS ====================

// Tipos de evento de accidente
export type TipoEventoAccidente =
  | 'CAIDA_MISMO_NIVEL'
  | 'CAIDA_DIFERENTE_NIVEL'
  | 'GOLPE_OBJETO'
  | 'ATRAPAMIENTO'
  | 'CORTE'
  | 'QUEMADURA'
  | 'CONTACTO_ELECTRICO'
  | 'SOBREESFUERZO'
  | 'EXPOSICION_SUSTANCIA'
  | 'ACCIDENTE_TRANSITO'
  | 'OTRO';

// Tipos de lesión
export type TipoLesion =
  | 'CONTUSION'
  | 'HERIDA'
  | 'FRACTURA'
  | 'ESGUINCE'
  | 'LUXACION'
  | 'QUEMADURA'
  | 'AMPUTACION'
  | 'INTOXICACION'
  | 'ASFIXIA'
  | 'ELECTROCUCION'
  | 'TRAUMATISMO'
  | 'OTRO';

// Partes del cuerpo
export type ParteCuerpo =
  | 'CABEZA'
  | 'CUELLO'
  | 'HOMBRO_DERECHO'
  | 'HOMBRO_IZQUIERDO'
  | 'BRAZO_DERECHO'
  | 'BRAZO_IZQUIERDO'
  | 'ANTEBRAZO_DERECHO'
  | 'ANTEBRAZO_IZQUIERDO'
  | 'MANO_DERECHA'
  | 'MANO_IZQUIERDA'
  | 'DEDO_MANO'
  | 'TORAX'
  | 'ESPALDA'
  | 'COLUMNA'
  | 'CADERA'
  | 'PIERNA_DERECHA'
  | 'PIERNA_IZQUIERDA'
  | 'RODILLA_DERECHA'
  | 'RODILLA_IZQUIERDA'
  | 'PIE_DERECHO'
  | 'PIE_IZQUIERDO'
  | 'DEDO_PIE'
  | 'OJOS'
  | 'OIDOS'
  | 'ORGANOS_INTERNOS'
  | 'MULTIPLES'
  | 'OTRO';

// Gravedad
export type GravedadAccidente = 'LEVE' | 'MODERADO' | 'GRAVE' | 'MORTAL';

// Tipos de enfermedad laboral
export type TipoEnfermedadLaboral =
  | 'MUSCULOESQUELETICA'
  | 'RESPIRATORIA'
  | 'DERMATOLOGICA'
  | 'AUDITIVA'
  | 'MENTAL'
  | 'CARDIOVASCULAR'
  | 'CANCER_OCUPACIONAL'
  | 'INTOXICACION'
  | 'OTRA';

// Estado de calificación
export type EstadoCalificacionEL =
  | 'PENDIENTE'
  | 'EN_ESTUDIO'
  | 'CALIFICADA_LABORAL'
  | 'CALIFICADA_COMUN'
  | 'APELADA';

// Tipos de incidente
export type TipoIncidente =
  | 'CASI_ACCIDENTE'
  | 'CONDICION_INSEGURA'
  | 'ACTO_INSEGURO'
  | 'EMERGENCIA_CONTROLADA'
  | 'OTRO';

// Potencial de gravedad
export type PotencialGravedad = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

// Metodología de investigación
export type MetodologiaInvestigacion =
  | 'ARBOL_CAUSAS'
  | 'CINCO_PORQUES'
  | 'ISHIKAWA'
  | 'TAPROOT'
  | 'OTRO';

// Estado de investigación
export type EstadoInvestigacion =
  | 'INICIADA'
  | 'EN_DESARROLLO'
  | 'EN_REVISION'
  | 'COMPLETADA'
  | 'CERRADA';

// Tipos de causa raíz
export type TipoCausaRaiz =
  | 'INMEDIATA_ACTO'
  | 'INMEDIATA_CONDICION'
  | 'BASICA_PERSONAL'
  | 'BASICA_TRABAJO'
  | 'ADMINISTRATIVA';

// Categoría de lección aprendida
export type CategoriaLeccion =
  | 'TECNICA'
  | 'PROCEDIMENTAL'
  | 'COMPORTAMENTAL'
  | 'ORGANIZACIONAL'
  | 'AMBIENTAL';

// Estado de divulgación
export type EstadoDivulgacion = 'PENDIENTE' | 'EN_PROCESO' | 'DIVULGADA';

// Estado del plan de acción
export type EstadoPlanAccion =
  | 'PLANIFICADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'VERIFICADO'
  | 'CERRADO'
  | 'CANCELADO';

// Tipo de acción según ISO 45001
export type TipoAccionISO =
  | 'ELIMINACION'
  | 'SUSTITUCION'
  | 'CONTROL_INGENIERIA'
  | 'CONTROL_ADMINISTRATIVO'
  | 'EPP';

// Estado de acción
export type EstadoAccion =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'VERIFICADA'
  | 'CANCELADA';

// ==================== ACCIDENTE DE TRABAJO ====================

export interface AccidenteTrabajo {
  id: number;
  empresa_id: number;
  codigo_at: string;
  fecha_evento: string;
  hora_evento?: string;
  lugar_evento: string;
  descripcion_evento: string;
  tipo_evento: TipoEventoAccidente;
  trabajador_id: number;
  trabajador_nombre?: string;
  cargo_trabajador: string;
  tipo_lesion: TipoLesion;
  parte_cuerpo: ParteCuerpo;
  descripcion_lesion: string;
  gravedad: GravedadAccidente;
  dias_incapacidad: number;
  mortal: boolean;
  fecha_muerte?: string;
  centro_atencion: string;
  diagnostico_medico: string;
  reportado_arl: boolean;
  fecha_reporte_arl?: string;
  numero_caso_arl: string;
  calificacion_origen: string;
  testigos: string;
  requiere_investigacion: boolean;
  tiene_investigacion?: boolean;
  reportado_por_id: number;
  reportado_por_nombre?: string;
  fecha_reporte_interno: string;
  fecha_actualizacion?: string;
}

export interface CreateAccidenteTrabajoDTO {
  fecha_evento: string;
  hora_evento?: string;
  lugar_evento: string;
  descripcion_evento: string;
  tipo_evento: TipoEventoAccidente;
  trabajador_id: number;
  cargo_trabajador: string;
  tipo_lesion: TipoLesion;
  parte_cuerpo: ParteCuerpo;
  descripcion_lesion: string;
  gravedad: GravedadAccidente;
  dias_incapacidad?: number;
  mortal?: boolean;
  fecha_muerte?: string;
  centro_atencion?: string;
  diagnostico_medico?: string;
  testigos?: string;
  requiere_investigacion?: boolean;
}

export interface UpdateAccidenteTrabajoDTO extends Partial<CreateAccidenteTrabajoDTO> {
  reportado_arl?: boolean;
  fecha_reporte_arl?: string;
  numero_caso_arl?: string;
  calificacion_origen?: string;
}

// ==================== ENFERMEDAD LABORAL ====================

export interface EnfermedadLaboral {
  id: number;
  empresa_id: number;
  codigo_el: string;
  trabajador_id: number;
  trabajador_nombre?: string;
  cargo_trabajador: string;
  fecha_diagnostico: string;
  tipo_enfermedad: TipoEnfermedadLaboral;
  diagnostico_cie10: string;
  diagnostico_descripcion: string;
  factor_riesgo: string;
  tiempo_exposicion: string;
  descripcion_exposicion: string;
  estado_calificacion: EstadoCalificacionEL;
  fecha_calificacion?: string;
  porcentaje_pcl?: number;
  entidad_calificadora: string;
  numero_dictamen: string;
  reportado_arl: boolean;
  fecha_reporte_arl?: string;
  numero_caso_arl: string;
  requiere_investigacion: boolean;
  tiene_investigacion?: boolean;
  reportado_por_id: number;
  reportado_por_nombre?: string;
  fecha_reporte_interno: string;
  fecha_actualizacion?: string;
}

export interface CreateEnfermedadLaboralDTO {
  trabajador_id: number;
  cargo_trabajador: string;
  fecha_diagnostico: string;
  tipo_enfermedad: TipoEnfermedadLaboral;
  diagnostico_cie10?: string;
  diagnostico_descripcion: string;
  factor_riesgo: string;
  tiempo_exposicion: string;
  descripcion_exposicion: string;
  requiere_investigacion?: boolean;
}

export interface UpdateEnfermedadLaboralDTO extends Partial<CreateEnfermedadLaboralDTO> {
  estado_calificacion?: EstadoCalificacionEL;
  fecha_calificacion?: string;
  porcentaje_pcl?: number;
  entidad_calificadora?: string;
  numero_dictamen?: string;
  reportado_arl?: boolean;
  fecha_reporte_arl?: string;
  numero_caso_arl?: string;
}

// ==================== INCIDENTE DE TRABAJO ====================

export interface IncidenteTrabajo {
  id: number;
  empresa_id: number;
  codigo_incidente: string;
  fecha_evento: string;
  hora_evento?: string;
  lugar_evento: string;
  tipo_incidente: TipoIncidente;
  descripcion_evento: string;
  potencial_gravedad: PotencialGravedad;
  consecuencias_potenciales: string;
  reportado_por_id: number;
  reportado_por_nombre?: string;
  personas_involucradas: string;
  hubo_danos_materiales: boolean;
  descripcion_danos: string;
  costo_estimado?: number;
  requiere_investigacion: boolean;
  tiene_investigacion?: boolean;
  fecha_reporte: string;
  fecha_actualizacion?: string;
}

export interface CreateIncidenteTrabajoDTO {
  fecha_evento: string;
  hora_evento?: string;
  lugar_evento: string;
  tipo_incidente: TipoIncidente;
  descripcion_evento: string;
  potencial_gravedad: PotencialGravedad;
  consecuencias_potenciales?: string;
  personas_involucradas?: string;
  hubo_danos_materiales?: boolean;
  descripcion_danos?: string;
  costo_estimado?: number;
  requiere_investigacion?: boolean;
}

export interface UpdateIncidenteTrabajoDTO extends Partial<CreateIncidenteTrabajoDTO> {}

// ==================== INVESTIGACION ATEL ====================

export interface InvestigacionATEL {
  id: number;
  empresa_id: number;
  codigo_investigacion: string;
  accidente_trabajo_id?: number;
  accidente_trabajo?: AccidenteTrabajo;
  enfermedad_laboral_id?: number;
  enfermedad_laboral?: EnfermedadLaboral;
  incidente_trabajo_id?: number;
  incidente_trabajo?: IncidenteTrabajo;
  evento_codigo?: string;
  evento_tipo?: string;
  metodologia: MetodologiaInvestigacion;
  lider_investigacion_id: number;
  lider_investigacion_nombre?: string;
  equipo_investigacion: UserDetail[];
  equipo_investigacion_nombres?: string[];
  fecha_inicio: string;
  fecha_limite: string;
  fecha_completada?: string;
  estado: EstadoInvestigacion;
  descripcion_hechos: string;
  analisis_datos?: Record<string, unknown>;
  conclusiones: string;
  recomendaciones: string;
  aprobada: boolean;
  aprobada_por_id?: number;
  fecha_aprobacion?: string;
  causas_raiz?: CausaRaiz[];
  total_causas?: number;
  total_planes_accion?: number;
  total_lecciones?: number;
  creado_por_id: number;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface CreateInvestigacionATELDTO {
  accidente_trabajo_id?: number;
  enfermedad_laboral_id?: number;
  incidente_trabajo_id?: number;
  metodologia: MetodologiaInvestigacion;
  lider_investigacion_id: number;
  equipo_investigacion_ids?: number[];
  fecha_inicio: string;
  fecha_limite: string;
  descripcion_hechos: string;
}

export interface UpdateInvestigacionATELDTO extends Partial<CreateInvestigacionATELDTO> {
  estado?: EstadoInvestigacion;
  analisis_datos?: Record<string, unknown>;
  conclusiones?: string;
  recomendaciones?: string;
}

export interface CompletarInvestigacionDTO {
  conclusiones: string;
  recomendaciones: string;
  analisis_datos?: Record<string, unknown>;
}

export interface AprobarInvestigacionDTO {
  comentarios?: string;
}

// ==================== CAUSA RAIZ ====================

export interface CausaRaiz {
  id: number;
  empresa_id: number;
  investigacion_id: number;
  tipo_causa: TipoCausaRaiz;
  tipo_causa_display?: string;
  descripcion: string;
  evidencia: string;
  prioridad: number;
  creado_por_id: number;
  creado_por_nombre?: string;
  fecha_creacion: string;
}

export interface CreateCausaRaizDTO {
  investigacion_id: number;
  tipo_causa: TipoCausaRaiz;
  descripcion: string;
  evidencia?: string;
  prioridad?: number;
}

export interface UpdateCausaRaizDTO extends Partial<CreateCausaRaizDTO> {}

// ==================== LECCION APRENDIDA ====================

export interface LeccionAprendida {
  id: number;
  empresa_id: number;
  codigo_leccion: string;
  investigacion_id: number;
  investigacion_codigo?: string;
  categoria: CategoriaLeccion;
  categoria_display?: string;
  titulo: string;
  situacion: string;
  causa: string;
  leccion: string;
  recomendacion: string;
  areas_aplicables: string;
  puestos_trabajo_aplicables: string;
  estado_divulgacion: EstadoDivulgacion;
  estado_divulgacion_display?: string;
  fecha_divulgacion?: string;
  metodo_divulgacion: string;
  personas_divulgadas: string;
  evidencia_divulgacion: string;
  creado_por_id: number;
  creado_por_nombre?: string;
  divulgado_por_id?: number;
  divulgado_por_nombre?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface CreateLeccionAprendidaDTO {
  investigacion_id: number;
  categoria: CategoriaLeccion;
  titulo: string;
  situacion: string;
  causa: string;
  leccion: string;
  recomendacion: string;
  areas_aplicables?: string;
  puestos_trabajo_aplicables?: string;
}

export interface UpdateLeccionAprendidaDTO extends Partial<CreateLeccionAprendidaDTO> {}

export interface DivulgarLeccionDTO {
  metodo_divulgacion: string;
  personas_divulgadas: string;
  evidencia_divulgacion?: string;
  fecha_divulgacion?: string;
}

// ==================== PLAN ACCION ATEL ====================

export interface PlanAccionATEL {
  id: number;
  empresa_id: number;
  codigo_plan: string;
  investigacion_id: number;
  investigacion_codigo?: string;
  nombre_plan: string;
  objetivo: string;
  responsable_id: number;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_compromiso: string;
  fecha_completado?: string;
  estado: EstadoPlanAccion;
  estado_display?: string;
  recursos_necesarios: string;
  presupuesto_estimado?: number;
  porcentaje_avance: number;
  observaciones_seguimiento: string;
  verificado: boolean;
  verificado_por_id?: number;
  verificado_por_nombre?: string;
  fecha_verificacion?: string;
  efectividad: string;
  acciones?: AccionPlan[];
  total_acciones?: number;
  acciones_completadas?: number;
  acciones_pendientes?: number;
  acciones_vencidas?: number;
  dias_restantes?: number;
  esta_vencido?: boolean;
  creado_por_id: number;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface CreatePlanAccionATELDTO {
  investigacion_id: number;
  nombre_plan: string;
  objetivo: string;
  responsable_id: number;
  fecha_inicio: string;
  fecha_compromiso: string;
  recursos_necesarios?: string;
  presupuesto_estimado?: number;
}

export interface UpdatePlanAccionATELDTO extends Partial<CreatePlanAccionATELDTO> {
  estado?: EstadoPlanAccion;
  porcentaje_avance?: number;
  observaciones_seguimiento?: string;
}

export interface VerificarPlanDTO {
  efectividad: string;
  comentarios?: string;
}

// ==================== ACCION PLAN ====================

export interface AccionPlan {
  id: number;
  empresa_id: number;
  plan_accion_id: number;
  orden: number;
  tipo_accion: TipoAccionISO;
  tipo_accion_display?: string;
  descripcion: string;
  causa_raiz_id?: number;
  causa_raiz_descripcion?: string;
  responsable_id: number;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_compromiso: string;
  fecha_completada?: string;
  estado: EstadoAccion;
  estado_display?: string;
  recursos: string;
  costo_estimado?: number;
  evidencia_implementacion: string;
  verificado: boolean;
  verificado_por_id?: number;
  verificado_por_nombre?: string;
  fecha_verificacion?: string;
  observaciones_verificacion: string;
  dias_restantes?: number;
  esta_vencida?: boolean;
  creado_por_id: number;
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface CreateAccionPlanDTO {
  plan_accion_id: number;
  tipo_accion: TipoAccionISO;
  descripcion: string;
  causa_raiz_id?: number;
  responsable_id: number;
  fecha_inicio: string;
  fecha_compromiso: string;
  recursos?: string;
  costo_estimado?: number;
}

export interface UpdateAccionPlanDTO extends Partial<CreateAccionPlanDTO> {
  estado?: EstadoAccion;
  evidencia_implementacion?: string;
}

export interface CompletarAccionDTO {
  evidencia_implementacion: string;
  comentarios?: string;
}

export interface VerificarAccionDTO {
  observaciones_verificacion: string;
  efectiva: boolean;
}

// ==================== ESTADISTICAS ====================

export interface EstadisticasAccidentalidad {
  accidentes_trabajo: {
    total: number;
    por_gravedad: Record<GravedadAccidente, number>;
    por_tipo_evento: Record<TipoEventoAccidente, number>;
    mortales: number;
    dias_incapacidad_total: number;
    tasa_accidentalidad: number;
  };
  enfermedades_laborales: {
    total: number;
    por_tipo: Record<TipoEnfermedadLaboral, number>;
    por_estado_calificacion: Record<EstadoCalificacionEL, number>;
    calificadas_laborales: number;
  };
  incidentes: {
    total: number;
    por_tipo: Record<TipoIncidente, number>;
    por_potencial_gravedad: Record<PotencialGravedad, number>;
    con_danos_materiales: number;
  };
  investigaciones: {
    total: number;
    por_estado: Record<EstadoInvestigacion, number>;
    pendientes: number;
    vencidas: number;
    promedio_dias_cierre: number;
  };
}

// ==================== RESPUESTAS PAGINADAS ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
