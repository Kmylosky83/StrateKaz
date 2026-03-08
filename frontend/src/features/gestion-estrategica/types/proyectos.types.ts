/**
 * Tipos TypeScript para el módulo de Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Semana 5: Gestión de Proyectos
 */

// ==================== ENUMS ====================
// NOTA: Los valores deben coincidir con el backend (minúsculas)

export type EstadoProyecto =
  | 'propuesto'
  | 'iniciacion'
  | 'planificacion'
  | 'ejecucion'
  | 'monitoreo'
  | 'cierre'
  | 'completado'
  | 'cancelado'
  | 'suspendido';

export type PrioridadProyecto = 'baja' | 'media' | 'alta';

export type TipoProyecto =
  | 'mejora'
  | 'implementacion'
  | 'desarrollo'
  | 'infraestructura'
  | 'normativo'
  | 'otro';

export type SaludProyecto = 'verde' | 'amarillo' | 'rojo';

// Origen del proyecto (trazabilidad PMI/ISO) — valores de Proyecto.OrigenProyecto en backend
export type OrigenProyecto =
  | 'manual'
  | 'cambio'
  | 'objetivo'
  | 'estrategia_tows'
  | 'auditoria'
  | 'riesgo'
  | 'mejora';

// Estados para Portafolio
export type EstadoPortafolio = 'activo' | 'en_revision' | 'archivado';

// Estados para Programa
export type EstadoPrograma = 'activo' | 'en_revision' | 'completado' | 'archivado';

// ==================== PORTAFOLIO ====================
// Campos alineados con PortafolioSerializer del backend

export interface Portafolio {
  id: number;
  empresa?: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  objetivo_estrategico?: string | null;
  presupuesto_asignado?: string | null;
  responsable?: number | null;
  responsable_nombre?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total_programas?: number;
  total_proyectos?: number;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePortafolioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  objetivo_estrategico?: string;
  presupuesto_asignado?: string;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export interface UpdatePortafolioDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  objetivo_estrategico?: string;
  presupuesto_asignado?: string;
  responsable?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

// ==================== PROGRAMA ====================
// Campos alineados con ProgramaSerializer del backend

export interface Programa {
  id: number;
  empresa?: number;
  portafolio: number;
  portafolio_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  responsable?: number | null;
  responsable_nombre?: string | null;
  presupuesto?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  total_proyectos?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramaDTO {
  portafolio: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsable?: number;
  presupuesto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export interface UpdateProgramaDTO {
  portafolio?: number;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  responsable?: number;
  presupuesto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

// ==================== PROYECTO ====================
// NOTA: Campos alineados con ProyectoListSerializer y ProyectoSerializer del backend

export interface Proyecto {
  id: number;
  empresa?: number | null;
  programa?: number | null;
  programa_nombre?: string | null;
  // Identificación (backend usa 'codigo' y 'nombre')
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoProyecto;
  tipo_display?: string;
  estado: EstadoProyecto;
  estado_display?: string;
  prioridad: PrioridadProyecto;
  prioridad_display?: string;
  // Fechas (backend usa fecha_*_plan y fecha_*_real)
  fecha_propuesta?: string | null;
  fecha_inicio_plan?: string | null;
  fecha_fin_plan?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  // Presupuesto
  presupuesto_estimado?: number | null;
  presupuesto_aprobado?: number | null;
  costo_real?: number | null;
  // Progreso (backend usa 'porcentaje_avance')
  porcentaje_avance: number;
  // Roles clave
  sponsor?: number | null;
  sponsor_nombre?: string | null;
  gerente_proyecto?: number | null;
  gerente_nombre?: string | null;
  // Justificación
  justificacion?: string | null;
  beneficios_esperados?: string | null;
  // Origen del proyecto (trazabilidad)
  tipo_origen: OrigenProyecto;
  tipo_origen_display?: string;
  origen_cambio?: number | null;
  origen_cambio_titulo?: string | null;
  origen_objetivo?: number | null;
  origen_objetivo_nombre?: string | null;
  // Salud del proyecto
  health_status?: SaludProyecto | null;
  health_notes?: string | null;
  // Campos calculados desde serializer
  variacion_costo?: number | null;
  indice_desempeno_costo?: number | null;
  total_actividades?: number;
  total_riesgos?: number;
  total_recursos?: number;
  // Estado
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProyectoDTO {
  programa?: number | null;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad: PrioridadProyecto;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  presupuesto_estimado?: string;
  justificacion?: string;
  beneficios_esperados?: string;
  sponsor?: number;
  gerente_proyecto?: number;
  // Origen del proyecto (trazabilidad)
  tipo_origen?: OrigenProyecto;
  origen_cambio?: number;
  origen_objetivo?: number;
  is_active?: boolean;
}

// DTO para crear proyecto desde Gestión de Cambios
export interface CreateProyectoDesdeCambioDTO {
  cambio_id: number;
}

export interface UpdateProyectoDTO {
  programa?: number | null;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad?: PrioridadProyecto;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  presupuesto_estimado?: string;
  presupuesto_aprobado?: string;
  costo_real?: string;
  justificacion?: string;
  beneficios_esperados?: string;
  sponsor?: number;
  gerente_proyecto?: number;
  porcentaje_avance?: number;
  // Origen del proyecto (trazabilidad)
  tipo_origen?: OrigenProyecto;
  origen_cambio?: number;
  origen_objetivo?: number;
  is_active?: boolean;
}

// ==================== PROJECT CHARTER ====================
// Campos alineados con ProjectCharterSerializer del backend

export interface ProjectCharter {
  id: number;
  proyecto: number;
  proposito: string;
  objetivos_medibles: string;
  requisitos_alto_nivel?: string | null;
  descripcion_alto_nivel?: string | null;
  supuestos?: string | null;
  restricciones?: string | null;
  hitos_clave?: string | null;
  riesgos_alto_nivel?: string | null;
  resumen_presupuesto?: string | null;
  resumen_cronograma?: string | null;
  criterios_exito?: string | null;
  fecha_aprobacion?: string | null;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string | null;
  observaciones_aprobacion?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCharterDTO {
  proyecto: number;
  proposito: string;
  objetivos_medibles: string;
  requisitos_alto_nivel?: string;
  descripcion_alto_nivel?: string;
  supuestos?: string;
  restricciones?: string;
  hitos_clave?: string;
  riesgos_alto_nivel?: string;
  resumen_presupuesto?: string;
  resumen_cronograma?: string;
  criterios_exito?: string;
}

export type UpdateCharterDTO = Partial<CreateCharterDTO>;

// ==================== INTERESADO (STAKEHOLDER) ====================
// Campos alineados con InteresadoProyectoSerializer del backend

export type NivelInteres = 'alto' | 'medio' | 'bajo';
export type NivelInfluencia = 'alta' | 'media' | 'baja';

export interface InteresadoProyecto {
  id: number;
  proyecto: number;
  nombre: string;
  cargo_rol?: string | null;
  organizacion?: string | null;
  contacto?: string | null;
  nivel_interes: NivelInteres;
  nivel_interes_display?: string;
  nivel_influencia: NivelInfluencia;
  nivel_influencia_display?: string;
  requisitos?: string | null;
  estrategia_gestion?: string | null;
  is_internal: boolean;
  is_active: boolean;
  origen_parte_interesada_id?: number | null;
  created_at: string;
}

export interface CreateInteresadoDTO {
  proyecto: number;
  nombre: string;
  cargo_rol?: string;
  organizacion?: string;
  contacto?: string;
  nivel_interes?: NivelInteres;
  nivel_influencia?: NivelInfluencia;
  requisitos?: string;
  estrategia_gestion?: string;
  is_internal?: boolean;
  is_active?: boolean;
}

export type UpdateInteresadoDTO = Partial<Omit<CreateInteresadoDTO, 'proyecto'>>;

export interface InteresadoFilters {
  proyecto?: number;
  nivel_interes?: NivelInteres;
  nivel_influencia?: NivelInfluencia;
  is_internal?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface MatrizPoderInteres {
  gestionar_cerca: InteresadoProyecto[];
  mantener_satisfecho: InteresadoProyecto[];
  mantener_informado: InteresadoProyecto[];
  monitorear: InteresadoProyecto[];
}

// ==================== FASE DEL PROYECTO ====================
// Campos alineados con FaseProyectoSerializer del backend

export interface FaseProyecto {
  id: number;
  proyecto: number;
  orden: number;
  nombre: string;
  descripcion?: string | null;
  fecha_inicio_plan?: string | null;
  fecha_fin_plan?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  porcentaje_avance: number;
  entregables?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateFaseDTO {
  proyecto: number;
  orden?: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  porcentaje_avance?: number;
  entregables?: string;
  is_active?: boolean;
}

export type UpdateFaseDTO = Partial<Omit<CreateFaseDTO, 'proyecto'>>;

export interface FaseFilters {
  proyecto?: number;
  is_active?: boolean;
}

// ==================== RECURSO DEL PROYECTO ====================
// Campos alineados con RecursoProyectoSerializer del backend

export type TipoRecurso = 'humano' | 'material' | 'equipo' | 'servicio';

export interface RecursoProyecto {
  id: number;
  proyecto: number;
  tipo: TipoRecurso;
  tipo_display?: string;
  nombre: string;
  descripcion?: string | null;
  usuario?: number | null;
  usuario_nombre?: string | null;
  rol_proyecto?: string | null;
  dedicacion_porcentaje: number;
  costo_unitario: string;
  cantidad: string;
  costo_total: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateRecursoDTO {
  proyecto: number;
  tipo: TipoRecurso;
  nombre: string;
  descripcion?: string;
  usuario?: number;
  rol_proyecto?: string;
  dedicacion_porcentaje?: number;
  costo_unitario?: string;
  cantidad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  is_active?: boolean;
}

export type UpdateRecursoDTO = Partial<Omit<CreateRecursoDTO, 'proyecto'>>;

export interface RecursoFilters {
  proyecto?: number;
  tipo?: TipoRecurso;
  is_active?: boolean;
}

// ==================== RIESGO DEL PROYECTO ====================
// Campos alineados con RiesgoProyectoSerializer del backend

export type ProbabilidadRiesgo = 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja';
export type ImpactoRiesgo = 'muy_alto' | 'alto' | 'medio' | 'bajo' | 'muy_bajo';
export type TipoRiesgoProyecto = 'amenaza' | 'oportunidad';
export type EstrategiaRespuesta =
  | 'evitar'
  | 'transferir'
  | 'mitigar'
  | 'aceptar'
  | 'explotar'
  | 'compartir'
  | 'mejorar';

export interface RiesgoProyecto {
  id: number;
  proyecto: number;
  codigo: string;
  tipo: TipoRiesgoProyecto;
  tipo_display?: string;
  descripcion: string;
  causa?: string | null;
  efecto?: string | null;
  probabilidad: ProbabilidadRiesgo;
  probabilidad_display?: string;
  impacto: ImpactoRiesgo;
  impacto_display?: string;
  nivel_riesgo?: number;
  estrategia?: EstrategiaRespuesta | null;
  plan_respuesta?: string | null;
  responsable?: number | null;
  responsable_nombre?: string | null;
  is_materializado: boolean;
  fecha_identificacion: string;
  fecha_materializacion?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRiesgoDTO {
  proyecto: number;
  codigo: string;
  tipo?: TipoRiesgoProyecto;
  descripcion: string;
  causa?: string;
  efecto?: string;
  probabilidad?: ProbabilidadRiesgo;
  impacto?: ImpactoRiesgo;
  estrategia?: EstrategiaRespuesta;
  plan_respuesta?: string;
  responsable?: number;
  is_active?: boolean;
}

export type UpdateRiesgoDTO = Partial<Omit<CreateRiesgoDTO, 'proyecto'>>;

export interface RiesgoFilters {
  proyecto?: number;
  tipo?: TipoRiesgoProyecto;
  probabilidad?: ProbabilidadRiesgo;
  impacto?: ImpactoRiesgo;
  is_materializado?: boolean;
  is_active?: boolean;
}

export interface MatrizRiesgos {
  matriz: Record<string, Record<string, RiesgoProyecto[]>>;
  total_riesgos: number;
  riesgos_alto_nivel: number;
}

// ==================== SEGUIMIENTO (EVM) ====================
// Campos alineados con SeguimientoProyectoSerializer del backend

export type EstadoGeneral = 'verde' | 'amarillo' | 'rojo';

export interface SeguimientoProyecto {
  id: number;
  proyecto: number;
  fecha: string;
  porcentaje_avance: number;
  costo_acumulado: string;
  estado_general: EstadoGeneral;
  logros_periodo?: string | null;
  problemas_encontrados?: string | null;
  acciones_correctivas?: string | null;
  proximas_actividades?: string | null;
  valor_planificado: string;
  valor_ganado: string;
  costo_actual: string;
  observaciones?: string | null;
  registrado_por?: number | null;
  registrado_por_nombre?: string | null;
  spi?: number;
  cpi?: number;
  created_at: string;
}

export interface CreateSeguimientoDTO {
  proyecto: number;
  fecha: string;
  porcentaje_avance: number;
  costo_acumulado?: string;
  estado_general?: EstadoGeneral;
  logros_periodo?: string;
  problemas_encontrados?: string;
  acciones_correctivas?: string;
  proximas_actividades?: string;
  valor_planificado?: string;
  valor_ganado?: string;
  costo_actual?: string;
  observaciones?: string;
}

export type UpdateSeguimientoDTO = Partial<Omit<CreateSeguimientoDTO, 'proyecto'>>;

export interface SeguimientoFilters {
  proyecto?: number;
  estado_general?: EstadoGeneral;
}

export interface CurvaSPoint {
  fecha: string;
  valor_planificado: number;
  valor_ganado: number;
  costo_actual: number;
  avance: number;
  spi: number;
  cpi: number;
}

// ==================== LECCION APRENDIDA ====================
// Campos alineados con LeccionAprendidaSerializer del backend

export type TipoLeccion = 'exito' | 'problema' | 'mejora' | 'buena_practica';

export interface LeccionAprendida {
  id: number;
  proyecto: number;
  tipo: TipoLeccion;
  tipo_display?: string;
  titulo: string;
  situacion: string;
  accion_tomada?: string | null;
  resultado?: string | null;
  recomendacion: string;
  area_conocimiento?: string | null;
  tags?: string | null;
  registrado_por?: number | null;
  registrado_por_nombre?: string | null;
  fecha_registro: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateLeccionDTO {
  proyecto: number;
  tipo: TipoLeccion;
  titulo: string;
  situacion: string;
  accion_tomada?: string;
  resultado?: string;
  recomendacion: string;
  area_conocimiento?: string;
  tags?: string;
}

export type UpdateLeccionDTO = Partial<Omit<CreateLeccionDTO, 'proyecto'>>;

export interface LeccionFilters {
  proyecto?: number;
  tipo?: TipoLeccion;
  is_active?: boolean;
  search?: string;
}

// ==================== ACTA DE CIERRE ====================
// Campos alineados con ActaCierreSerializer del backend

export interface ActaCierre {
  id: number;
  proyecto: number;
  proyecto_codigo?: string;
  proyecto_nombre?: string;
  fecha_cierre: string;
  objetivos_cumplidos: string;
  objetivos_no_cumplidos?: string | null;
  entregables_completados: string;
  entregables_pendientes?: string | null;
  presupuesto_final: string;
  costo_final: string;
  variacion_presupuesto: string;
  duracion_planificada_dias: number;
  duracion_real_dias: number;
  evaluacion_general?: string | null;
  recomendaciones_futuras?: string | null;
  aprobado_por_sponsor: boolean;
  fecha_aprobacion?: string | null;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string | null;
  created_at: string;
  created_by?: number | null;
}

export interface CreateActaCierreDTO {
  proyecto: number;
  fecha_cierre: string;
  objetivos_cumplidos: string;
  objetivos_no_cumplidos?: string;
  entregables_completados: string;
  entregables_pendientes?: string;
  presupuesto_final: string;
  costo_final: string;
  duracion_planificada_dias: number;
  duracion_real_dias: number;
  evaluacion_general?: string;
  recomendaciones_futuras?: string;
}

export type UpdateActaCierreDTO = Partial<Omit<CreateActaCierreDTO, 'proyecto'>>;

export interface ActaCierreFilters {
  proyecto?: number;
  aprobado_por_sponsor?: boolean;
}

// ==================== DASHBOARD ====================

export interface ProyectosDashboard {
  // Totales por estado
  total_proyectos: number;
  propuestos: number;
  en_iniciacion: number;
  en_planificacion: number;
  en_ejecucion: number;
  en_monitoreo: number;
  en_cierre: number;
  completados: number;
  cancelados: number;

  // Salud del portafolio
  proyectos_verde: number;
  proyectos_amarillo: number;
  proyectos_rojo: number;

  // Por prioridad
  criticos: number;
  alta_prioridad: number;
  media_prioridad: number;
  baja_prioridad: number;

  // Presupuesto
  presupuesto_total: string;
  presupuesto_ejecutado: string;
  presupuesto_disponible: string;
  porcentaje_ejecucion: number;

  // Portafolios y programas
  total_portafolios: number;
  portafolios_activos: number;
  total_programas: number;
  programas_activos: number;

  // Progreso general
  progreso_promedio: number;

  // Proyectos atrasados
  proyectos_atrasados: number;
}

// ==================== FILTERS ====================

export interface PortafolioFilters {
  status?: EstadoPortafolio;
  owner?: number;
  is_active?: boolean;
  search?: string;
}

export interface ProgramaFilters {
  portafolio?: number;
  status?: EstadoPrograma;
  manager?: number;
  is_active?: boolean;
  search?: string;
}

export interface ProyectoFilters {
  programa?: number;
  portafolio?: number;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad?: PrioridadProyecto;
  health_status?: SaludProyecto;
  sponsor?: number;
  project_manager?: number;
  objetivo_estrategico?: number;
  is_active?: boolean;
  search?: string;
}

// ==================== KANBAN ====================

export type KanbanColumn = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface ActividadProyecto {
  id: number;
  proyecto: number;
  fase?: number | null;
  fase_nombre?: string | null;
  codigo_wbs?: string;
  nombre: string;
  descripcion?: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada' | 'cancelada';
  estado_display?: string;
  fecha_inicio_plan?: string | null;
  fecha_fin_plan?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  duracion_estimada_dias?: number;
  esfuerzo_estimado_horas?: string | null;
  porcentaje_avance: number;
  responsable?: number | null;
  responsable_nombre?: string | null;
  predecesoras?: number[];
  prioridad: number;
  notas?: string | null;
  kanban_column: KanbanColumn;
  kanban_column_display?: string;
  kanban_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateActividadDTO {
  proyecto: number;
  fase?: number;
  codigo_wbs?: string;
  nombre: string;
  descripcion?: string;
  estado?: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada' | 'cancelada';
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  duracion_estimada_dias?: number;
  esfuerzo_estimado_horas?: string;
  responsable?: number;
  predecesoras?: number[];
  prioridad?: number;
  notas?: string;
  kanban_column?: KanbanColumn;
  is_active?: boolean;
}

export type UpdateActividadDTO = Partial<Omit<CreateActividadDTO, 'proyecto'>>;

export interface ActividadFilters {
  proyecto?: number;
  fase?: number;
  estado?: string;
  responsable?: number;
  is_active?: boolean;
  kanban_column?: KanbanColumn;
  search?: string;
}

export interface KanbanData {
  columns: Record<KanbanColumn, ActividadProyecto[]>;
  column_order: KanbanColumn[];
  column_labels: Record<KanbanColumn, string>;
}

export interface KanbanReorderItem {
  id: number;
  kanban_column: KanbanColumn;
  kanban_order: number;
}

export interface GanttItem {
  id: number;
  codigo_wbs: string;
  nombre: string;
  inicio: string | null;
  fin: string | null;
  avance: number;
  responsable: string | null;
  predecesoras: number[];
  estado: string;
  fase_id: number | null;
  fase_nombre: string | null;
  fase_orden: number | null;
}

// ==================== SELECT OPTIONS ====================

export interface SelectOption {
  value: string | number;
  label: string;
}
