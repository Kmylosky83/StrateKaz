/**
 * Tipos TypeScript para Módulo de Mejora Continua - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Phase B: Sincronizado con TenantModel + django-fsm
 *
 * Incluye:
 * - Programa de Auditorías
 * - Auditorías Internas/Externas
 * - Hallazgos (No Conformidades, Observaciones, Oportunidades de Mejora)
 * - Evaluación de Cumplimiento Legal
 */

// ==================== ENUMS Y TIPOS ====================

// Programa de Auditoría
export type EstadoProgramaAuditoria =
  | 'BORRADOR'
  | 'APROBADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'CANCELADO';

// Auditoría
export type TipoAuditoria =
  | 'INTERNA'
  | 'EXTERNA'
  | 'SEGUIMIENTO'
  | 'CERTIFICACION'
  | 'RENOVACION'
  | 'CONTROL_INTERNO'
  | 'DIAGNOSTICO'
  | 'PROVEEDOR';

export type NormaAuditoria =
  | 'ISO_9001'
  | 'ISO_14001'
  | 'ISO_45001'
  | 'ISO_27001'
  | 'DECRETO_1072'
  | 'RES_0312'
  | 'RES_40595'
  | 'MULTIPLE';

export type EstadoAuditoria =
  | 'PROGRAMADA'
  | 'PLANIFICADA'
  | 'EN_EJECUCION'
  | 'INFORME_PENDIENTE'
  | 'CERRADA'
  | 'CANCELADA';

// Hallazgo
export type TipoHallazgo =
  | 'NO_CONFORMIDAD_MAYOR'
  | 'NO_CONFORMIDAD_MENOR'
  | 'OBSERVACION'
  | 'OPORTUNIDAD_MEJORA'
  | 'FORTALEZA';

export type EstadoHallazgo =
  | 'IDENTIFICADO'
  | 'COMUNICADO'
  | 'EN_TRATAMIENTO'
  | 'VERIFICADO'
  | 'CERRADO';

export type ImpactoHallazgo = 'ALTO' | 'MEDIO' | 'BAJO';

// Evaluación de Cumplimiento
export type TipoEvaluacionCumplimiento =
  | 'LEGAL'
  | 'REGLAMENTARIO'
  | 'CONTRACTUAL'
  | 'NORMATIVO'
  | 'CLIENTE'
  | 'VOLUNTARIO';

export type ResultadoEvaluacionCumplimiento =
  | 'CUMPLE'
  | 'CUMPLE_PARCIAL'
  | 'NO_CUMPLE'
  | 'NO_APLICA'
  | 'EN_PROCESO';

export type PeriodicidadEvaluacion = 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

// ==================== PROGRAMA DE AUDITORÍA ====================

export interface ProgramaAuditoria {
  id: number;
  codigo: string;
  nombre: string;
  año: number;
  version: number;
  estado: EstadoProgramaAuditoria;
  estado_display?: string;
  alcance: string;
  objetivos: string;
  criterios_auditoria: string;
  normas_aplicables: string[];
  equipo_auditor_interno: string[];
  recursos_necesarios: string;
  presupuesto: string | null;
  responsable_programa: number;
  responsable_programa_nombre?: string;
  aprobado_por: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  observaciones: string;
  porcentaje_avance?: number;
  transiciones_disponibles?: string[];
  auditorias?: AuditoriaList[];
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface ProgramaAuditoriaList {
  id: number;
  codigo: string;
  nombre: string;
  año: number;
  version: number;
  estado: EstadoProgramaAuditoria;
  estado_display?: string;
  alcance?: string;
  normas_aplicables?: string[];
  presupuesto?: string | null;
  responsable_programa?: number;
  responsable_programa_nombre?: string;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  porcentaje_avance?: number;
  cantidad_auditorias?: number;
  created_at: string;
  updated_at: string;
}

// ==================== AUDITORÍA ====================

export interface Auditoria {
  id: number;
  programa: number;
  programa_nombre?: string;
  programa_codigo?: string;
  codigo: string;
  tipo: TipoAuditoria;
  tipo_display?: string;
  norma_principal: NormaAuditoria;
  norma_principal_display?: string;
  normas_adicionales: string[];
  estado: EstadoAuditoria;
  estado_display?: string;
  titulo: string;
  objetivo: string;
  alcance: string;
  criterios: string;
  procesos_auditados: string[];
  fecha_planificada_inicio: string;
  fecha_planificada_fin: string;
  fecha_real_inicio: string | null;
  fecha_real_fin: string | null;
  auditor_lider: number;
  auditor_lider_nombre?: string;
  equipo_auditor: number[];
  equipo_auditor_info?: Array<{ id: number; nombre: string }>;
  resumen_ejecutivo: string;
  fortalezas: string;
  conclusiones: string;
  recomendaciones: string;
  total_hallazgos: number;
  no_conformidades_mayores: number;
  no_conformidades_menores: number;
  observaciones_count: number;
  oportunidades_mejora: number;
  plan_auditoria: string | null;
  lista_verificacion: string | null;
  informe_auditoria: string | null;
  observaciones_internas: string;
  hallazgos?: HallazgoList[];
  transiciones_disponibles?: string[];
  dias_restantes?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface AuditoriaList {
  id: number;
  programa: number;
  programa_nombre?: string;
  codigo: string;
  tipo: TipoAuditoria;
  tipo_display?: string;
  norma_principal: NormaAuditoria;
  norma_principal_display?: string;
  estado: EstadoAuditoria;
  estado_display?: string;
  titulo: string;
  objetivo?: string;
  fecha_planificada_inicio: string;
  fecha_planificada_fin: string;
  fecha_real_inicio?: string | null;
  fecha_real_fin?: string | null;
  auditor_lider?: number;
  auditor_lider_nombre?: string;
  total_hallazgos: number;
  no_conformidades_mayores: number;
  no_conformidades_menores: number;
  observaciones_count?: number;
  oportunidades_mejora?: number;
  dias_restantes?: number | null;
  created_at: string;
  updated_at: string;
}

// ==================== HALLAZGO ====================

export interface Hallazgo {
  id: number;
  auditoria: number;
  auditoria_codigo?: string;
  auditoria_titulo?: string;
  codigo: string;
  tipo: TipoHallazgo;
  tipo_display?: string;
  estado: EstadoHallazgo;
  estado_display?: string;
  titulo: string;
  descripcion: string;
  evidencia: string;
  criterio: string;
  proceso_area: string;
  clausula_norma: string;
  norma_referencia: string;
  impacto: ImpactoHallazgo | '';
  impacto_display?: string;
  area_impactada: string;
  recomendacion: string;
  identificado_por: number;
  identificado_por_nombre?: string;
  responsable_proceso: number | null;
  responsable_proceso_nombre?: string;
  fecha_deteccion: string;
  fecha_comunicacion: string | null;
  fecha_cierre_esperada: string | null;
  fecha_cierre_real: string | null;
  analisis_causa_raiz: string;
  accion_propuesta: string;
  no_conformidad_id: number | null;
  no_conformidad_codigo: string;
  no_conformidad_info?: { id: number; codigo: string } | null;
  verificacion_eficacia: string;
  es_eficaz: boolean | null;
  verificado_por: number | null;
  verificado_por_nombre?: string;
  fecha_verificacion: string | null;
  observaciones_verificacion: string;
  archivo_evidencia: string | null;
  observaciones: string;
  requiere_accion_correctiva?: boolean;
  dias_abierto?: number;
  transiciones_disponibles?: string[];
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface HallazgoList {
  id: number;
  auditoria: number;
  auditoria_codigo?: string;
  auditoria_titulo?: string;
  codigo: string;
  tipo: TipoHallazgo;
  tipo_display?: string;
  estado: EstadoHallazgo;
  estado_display?: string;
  titulo: string;
  descripcion?: string;
  proceso_area: string;
  clausula_norma?: string;
  norma_referencia?: string;
  impacto: ImpactoHallazgo | '';
  impacto_display?: string;
  area_impactada: string;
  recomendacion: string;
  identificado_por?: number;
  identificado_por_nombre?: string;
  responsable_proceso?: number | null;
  responsable_proceso_nombre?: string;
  fecha_deteccion: string;
  fecha_cierre_esperada: string | null;
  fecha_cierre_real?: string | null;
  no_conformidad_id?: number | null;
  no_conformidad_codigo?: string;
  es_eficaz?: boolean | null;
  requiere_accion_correctiva?: boolean;
  dias_abierto?: number;
  created_at: string;
  updated_at: string;
}

// ==================== EVALUACIÓN DE CUMPLIMIENTO ====================

export interface EvaluacionCumplimiento {
  id: number;
  codigo: string;
  tipo: TipoEvaluacionCumplimiento;
  tipo_display?: string;
  nombre: string;
  descripcion: string;
  requisito_legal_id: number | null;
  requisito_legal_nombre: string;
  requisito_legal_info?: { id: number; nombre: string } | null;
  resultado: ResultadoEvaluacionCumplimiento;
  resultado_display?: string;
  porcentaje_cumplimiento: number;
  evidencia_cumplimiento: string;
  archivos_evidencia: string[];
  brechas_identificadas: string;
  acciones_requeridas: string;
  evaluador: number;
  evaluador_nombre?: string;
  responsable_cumplimiento: number | null;
  responsable_cumplimiento_nombre?: string;
  periodicidad: PeriodicidadEvaluacion;
  periodicidad_display?: string;
  fecha_evaluacion: string;
  proxima_evaluacion: string | null;
  hallazgo_generado: number | null;
  hallazgo_info?: { id: number; codigo: string; titulo: string; estado: string } | null;
  observaciones: string;
  estado_cumplimiento?: 'success' | 'warning' | 'danger' | 'info';
  dias_para_proxima_evaluacion?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface EvaluacionCumplimientoList {
  id: number;
  codigo: string;
  tipo: TipoEvaluacionCumplimiento;
  tipo_display?: string;
  nombre: string;
  descripcion?: string;
  resultado: ResultadoEvaluacionCumplimiento;
  resultado_display?: string;
  porcentaje_cumplimiento: number;
  periodicidad?: PeriodicidadEvaluacion;
  periodicidad_display?: string;
  fecha_evaluacion: string;
  proxima_evaluacion: string | null;
  evaluador?: number;
  evaluador_nombre?: string;
  responsable_cumplimiento?: number | null;
  responsable_cumplimiento_nombre?: string;
  requisito_legal_id?: number | null;
  requisito_legal_nombre?: string;
  estado_cumplimiento?: 'success' | 'warning' | 'danger' | 'info';
  dias_para_proxima_evaluacion?: number | null;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateProgramaAuditoriaDTO {
  codigo: string;
  nombre: string;
  año: number;
  version?: number;
  alcance: string;
  objetivos: string;
  criterios_auditoria?: string;
  normas_aplicables?: string[];
  equipo_auditor_interno?: string[];
  recursos_necesarios?: string;
  presupuesto?: number;
  responsable_programa: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  observaciones?: string;
}

export interface CreateAuditoriaDTO {
  programa: number;
  codigo: string;
  tipo: TipoAuditoria;
  norma_principal: NormaAuditoria;
  normas_adicionales?: string[];
  titulo: string;
  objetivo: string;
  alcance: string;
  criterios?: string;
  procesos_auditados?: string[];
  fecha_planificada_inicio: string;
  fecha_planificada_fin: string;
  auditor_lider: number;
  equipo_auditor?: number[];
}

export interface CreateHallazgoDTO {
  auditoria: number;
  codigo: string;
  tipo: TipoHallazgo;
  titulo: string;
  descripcion: string;
  evidencia: string;
  criterio: string;
  proceso_area?: string;
  clausula_norma?: string;
  norma_referencia?: string;
  impacto?: ImpactoHallazgo | '';
  area_impactada?: string;
  recomendacion?: string;
  identificado_por: number;
  responsable_proceso?: number;
  fecha_deteccion: string;
  fecha_cierre_esperada?: string;
  analisis_causa_raiz?: string;
  accion_propuesta?: string;
}

export interface CreateEvaluacionCumplimientoDTO {
  codigo: string;
  tipo: TipoEvaluacionCumplimiento;
  nombre: string;
  descripcion?: string;
  requisito_legal_id?: number;
  resultado: ResultadoEvaluacionCumplimiento;
  porcentaje_cumplimiento?: number;
  evidencia_cumplimiento?: string;
  archivos_evidencia?: string[];
  brechas_identificadas?: string;
  acciones_requeridas?: string;
  evaluador: number;
  responsable_cumplimiento?: number;
  periodicidad?: PeriodicidadEvaluacion;
  fecha_evaluacion: string;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

// Estado es FSM-protected — NO se puede asignar directamente.
// Usar acciones de transición: /aprobar/, /iniciar/, /completar/, /cancelar/

export interface UpdateProgramaAuditoriaDTO extends Partial<CreateProgramaAuditoriaDTO> {
  aprobado_por?: number;
  fecha_aprobacion?: string;
}

export interface UpdateAuditoriaDTO extends Partial<CreateAuditoriaDTO> {
  fecha_real_inicio?: string;
  fecha_real_fin?: string;
  resumen_ejecutivo?: string;
  fortalezas?: string;
  conclusiones?: string;
  recomendaciones?: string;
  observaciones_internas?: string;
}

export interface UpdateHallazgoDTO extends Partial<CreateHallazgoDTO> {
  fecha_comunicacion?: string;
  fecha_cierre_real?: string;
  no_conformidad_id?: number;
  no_conformidad_codigo?: string;
  verificacion_eficacia?: string;
  es_eficaz?: boolean;
  verificado_por?: number;
  fecha_verificacion?: string;
  observaciones?: string;
  observaciones_verificacion?: string;
}

export interface UpdateEvaluacionCumplimientoDTO extends Partial<CreateEvaluacionCumplimientoDTO> {
  proxima_evaluacion?: string;
  hallazgo_generado?: number;
}

// ==================== RESPONSE TYPES ====================

// PaginatedResponse: importar desde '@/types'
