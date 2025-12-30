/**
 * Tipos TypeScript para Módulo de Emergencias - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye:
 * - Análisis de Vulnerabilidad y Amenazas
 * - Planes de Emergencia y Procedimientos
 * - Planos de Evacuación
 * - Brigadas y Brigadistas
 * - Simulacros y Evaluaciones
 * - Recursos de Emergencia e Inspecciones
 */

// ==================== USER DETAIL ====================
// Se importa de tipos compartidos para evitar duplicación

// ==================== ENUMS Y TIPOS ====================

// Análisis de Vulnerabilidad
export type TipoAmenazaGlobal = 'NATURAL' | 'TECNOLOGICA' | 'SOCIAL';
export type NivelVulnerabilidad = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type EstadoAnalisisVulnerabilidad = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'ACTUALIZADO';

// Amenazas
export type CategoriaAmenaza =
  | 'SISMO'
  | 'INUNDACION'
  | 'DESLIZAMIENTO'
  | 'VENDAVAL'
  | 'TORMENTA_ELECTRICA'
  | 'INCENDIO'
  | 'EXPLOSION'
  | 'FUGA_QUIMICA'
  | 'FALLA_ESTRUCTURAL'
  | 'FALLA_ELECTRICA'
  | 'TERRORISMO'
  | 'VANDALISMO'
  | 'DISTURBIOS'
  | 'ROBO'
  | 'SECUESTRO'
  | 'OTRA';

export type ProbabilidadAmenaza = 'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA';
export type SeveridadAmenaza = 'INSIGNIFICANTE' | 'MENOR' | 'MODERADA' | 'MAYOR' | 'CATASTROFICA';

// Plan de Emergencia
export type EstadoPlanEmergencia = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'VIGENTE' | 'DESACTUALIZADO';

// Procedimiento de Emergencia
export type TipoEmergencia =
  | 'INCENDIO'
  | 'SISMO'
  | 'EXPLOSION'
  | 'FUGA_QUIMICA'
  | 'INUNDACION'
  | 'AMENAZA_BOMBA'
  | 'ACCIDENTE_GRAVE'
  | 'EMERGENCIA_MEDICA'
  | 'DISTURBIOS'
  | 'EVACUACION_GENERAL'
  | 'OTRA';

export type EstadoProcedimiento = 'BORRADOR' | 'APROBADO' | 'VIGENTE' | 'OBSOLETO';

// Brigadas
export type EstadoBrigada = 'ACTIVA' | 'EN_FORMACION' | 'INACTIVA' | 'DISUELTA';
export type RolBrigadista = 'LIDER' | 'SUBLIDER' | 'BRIGADISTA';
export type EstadoBrigadista = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'RETIRADO';
export type GrupoSanguineo = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Simulacros
export type TipoSimulacro =
  | 'EVACUACION'
  | 'INCENDIO'
  | 'SISMO'
  | 'PRIMEROS_AUXILIOS'
  | 'FUGA_QUIMICA'
  | 'AMENAZA_BOMBA'
  | 'INTEGRAL'
  | 'OTRO';

export type AlcanceSimulacro = 'PARCIAL' | 'TOTAL' | 'POR_AREAS';
export type EstadoSimulacro = 'PROGRAMADO' | 'CONFIRMADO' | 'REALIZADO' | 'EVALUADO' | 'CANCELADO' | 'POSPUESTO';

// Recursos de Emergencia
export type TipoRecursoEmergencia =
  | 'EXTINTOR'
  | 'BOTIQUIN'
  | 'CAMILLA'
  | 'ALARMA'
  | 'SEÑALIZACION'
  | 'EQUIPO_COMUNICACION'
  | 'LINTERNA'
  | 'MEGAFONO'
  | 'EQUIPO_RESCATE'
  | 'DESFIBRILADOR'
  | 'OTRO';

export type EstadoRecursoEmergencia = 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'FUERA_SERVICIO' | 'DADO_BAJA';
export type FrecuenciaInspeccionEmergencia = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type ResultadoInspeccionRecurso = 'CONFORME' | 'NO_CONFORME_MENOR' | 'NO_CONFORME_MAYOR';

// ==================== ANÁLISIS DE VULNERABILIDAD ====================

export interface AnalisisVulnerabilidad {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  tipo_amenaza: TipoAmenazaGlobal;
  fecha_analisis: string;
  descripcion: string;
  metodologia_utilizada: string;
  nivel_vulnerabilidad: NivelVulnerabilidad;
  puntuacion_vulnerabilidad: string;
  hallazgos: string;
  recomendaciones: string;
  responsable_analisis: string;
  estado: EstadoAnalisisVulnerabilidad;
  fecha_aprobacion: string | null;
  aprobado_por: string;
  proxima_revision: string | null;
  amenazas?: Amenaza[];
  total_amenazas?: number;
  amenazas_criticas?: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
  actualizado_por: string;
}

export interface AnalisisVulnerabilidadList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_amenaza: TipoAmenazaGlobal;
  fecha_analisis: string;
  nivel_vulnerabilidad: NivelVulnerabilidad;
  puntuacion_vulnerabilidad: string;
  estado: EstadoAnalisisVulnerabilidad;
  proxima_revision: string | null;
  total_amenazas?: number;
  amenazas_criticas?: number;
  creado_en: string;
  actualizado_en: string;
}

// ==================== AMENAZAS ====================

export interface Amenaza {
  id: number;
  empresa_id: number;
  analisis_vulnerabilidad: number;
  codigo: string;
  categoria: CategoriaAmenaza;
  nombre: string;
  descripcion: string;
  probabilidad: ProbabilidadAmenaza;
  valor_probabilidad: number;
  severidad: SeveridadAmenaza;
  valor_severidad: number;
  nivel_riesgo: number;
  nivel_riesgo_texto?: string;
  personas_afectadas_potenciales: number;
  areas_criticas_afectadas: string;
  medidas_prevencion: string;
  medidas_propuestas: string;
  requiere_plan_accion: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== PLAN DE EMERGENCIA ====================

export interface PlanEmergencia {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  version: string;
  fecha_elaboracion: string;
  fecha_vigencia: string;
  fecha_revision: string;
  alcance: string;
  objetivos: string;
  director_emergencias: string;
  coordinador_emergencias: string;
  estructura_organizacional: string;
  descripcion_instalaciones: string;
  numero_personas: number;
  horarios_operacion: string;
  contactos_emergencia: Record<string, any>;
  documento_plan: string | null;
  estado: EstadoPlanEmergencia;
  fecha_aprobacion: string | null;
  aprobado_por: string;
  procedimientos?: ProcedimientoEmergencia[];
  planos_evacuacion?: PlanoEvacuacion[];
  total_procedimientos?: number;
  total_planos?: number;
  total_simulacros?: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
  actualizado_por: string;
}

export interface PlanEmergenciaList {
  id: number;
  codigo: string;
  nombre: string;
  version: string;
  fecha_elaboracion: string;
  fecha_vigencia: string;
  fecha_revision: string;
  estado: EstadoPlanEmergencia;
  total_procedimientos?: number;
  total_planos?: number;
  total_simulacros?: number;
  creado_en: string;
  actualizado_en: string;
}

// ==================== PROCEDIMIENTO DE EMERGENCIA ====================

export interface ProcedimientoEmergencia {
  id: number;
  empresa_id: number;
  plan_emergencia: number;
  codigo: string;
  tipo_emergencia: TipoEmergencia;
  tipo_emergencia_display?: string;
  nombre: string;
  version: string;
  objetivo: string;
  alcance: string;
  responsables: string;
  pasos_deteccion: string;
  pasos_alarma: string;
  pasos_comunicacion: string;
  pasos_respuesta: string;
  pasos_evacuacion: string;
  pasos_seguimiento: string;
  recursos_necesarios: string;
  diagrama_flujo: string | null;
  documento_pon: string | null;
  fecha_elaboracion: string;
  fecha_revision: string | null;
  estado: EstadoProcedimiento;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== PLANO DE EVACUACIÓN ====================

export interface PlanoEvacuacion {
  id: number;
  empresa_id: number;
  plan_emergencia: number;
  codigo: string;
  nombre: string;
  version: string;
  edificio: string;
  piso: string;
  area: string;
  descripcion: string;
  capacidad_personas: number;
  numero_rutas: number;
  rutas_detalle: any[];
  puntos_encuentro: any[];
  punto_encuentro_principal: string;
  punto_encuentro_alterno: string;
  salidas_emergencia: number;
  extintores: number;
  alarmas: number;
  botiquines: number;
  archivo_plano: string;
  plano_thumbnail: string | null;
  fecha_elaboracion: string;
  fecha_actualizacion: string;
  fecha_revision_programada: string | null;
  publicado: boolean;
  ubicaciones_publicacion: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
}

// ==================== TIPO DE BRIGADA ====================

export interface TipoBrigada {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  capacitacion_requerida: string;
  horas_capacitacion_minimas: number;
  certificacion_requerida: boolean;
  equipamiento_requerido: string;
  nivel_prioridad: number;
  color_identificacion: string;
  total_brigadas?: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== BRIGADA ====================

export interface Brigada {
  id: number;
  empresa_id: number;
  tipo_brigada: number;
  tipo_brigada_nombre?: string;
  tipo_brigada_color?: string;
  tipo_brigada_data?: TipoBrigada;
  codigo: string;
  nombre: string;
  descripcion: string;
  sede: string;
  area_cobertura: string;
  lider_brigada: string;
  lider_contacto: string;
  numero_minimo_brigadistas: number;
  numero_brigadistas_actuales: number;
  equipamiento_asignado: string;
  ubicacion_equipamiento: string;
  fecha_conformacion: string;
  fecha_ultima_capacitacion: string | null;
  fecha_proxima_capacitacion: string | null;
  estado: EstadoBrigada;
  brigadistas?: BrigadistaActivo[];
  total_brigadistas?: number;
  brigadistas_activos?: number;
  estado_capacidad?: 'INSUFICIENTE' | 'MINIMO' | 'OPTIMO';
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
}

export interface BrigadaList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_brigada: number;
  tipo_brigada_nombre?: string;
  tipo_brigada_color?: string;
  lider_brigada: string;
  estado: EstadoBrigada;
  numero_minimo_brigadistas: number;
  numero_brigadistas_actuales: number;
  total_brigadistas?: number;
  brigadistas_activos?: number;
  estado_capacidad?: 'INSUFICIENTE' | 'MINIMO' | 'OPTIMO';
  fecha_conformacion: string;
  fecha_proxima_capacitacion: string | null;
  creado_en: string;
  actualizado_en: string;
}

// ==================== BRIGADISTA ACTIVO ====================

export interface BrigadistaActivo {
  id: number;
  empresa_id: number;
  brigada: number;
  brigada_nombre?: string;
  codigo_empleado: string;
  nombre_completo: string;
  documento_identidad: string;
  cargo: string;
  area: string;
  telefono: string;
  email: string;
  contacto_emergencia: string;
  grupo_sanguineo: GrupoSanguineo | '';
  alergias: string;
  condiciones_medicas: string;
  rol: RolBrigadista;
  fecha_ingreso_brigada: string;
  fecha_capacitacion_inicial: string | null;
  horas_capacitacion: string;
  certificado: string | null;
  fecha_vencimiento_certificado: string | null;
  certificado_vigente?: boolean | null;
  numero_simulacros_participados: number;
  estado: EstadoBrigadista;
  fecha_inactivacion: string | null;
  motivo_inactivacion: string;
  dotacion_entregada: string;
  fecha_entrega_dotacion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== SIMULACRO ====================

export interface Simulacro {
  id: number;
  empresa_id: number;
  plan_emergencia: number;
  plan_emergencia_nombre?: string;
  plan_emergencia_data?: PlanEmergenciaList;
  codigo: string;
  nombre: string;
  tipo_simulacro: TipoSimulacro;
  tipo_simulacro_display?: string;
  alcance: AlcanceSimulacro;
  fecha_programada: string;
  fecha_realizada: string | null;
  duracion_programada: number;
  duracion_real: number | null;
  objetivo_general: string;
  objetivos_especificos: string;
  descripcion_escenario: string;
  ubicacion: string;
  areas_involucradas: string;
  numero_participantes_esperados: number;
  numero_participantes_reales: number;
  brigadas_participantes: number[];
  brigadas_participantes_data?: BrigadaList[];
  coordinador: string;
  observadores: string;
  recursos_utilizados: string;
  fue_exitoso: boolean;
  observaciones: string;
  fortalezas: string;
  oportunidades_mejora: string;
  plan_simulacro: string | null;
  informe_simulacro: string | null;
  evidencias_fotograficas: string | null;
  estado: EstadoSimulacro;
  notificar_participantes: boolean;
  tipo_simulacro_anunciado: boolean;
  evaluaciones?: EvaluacionSimulacro[];
  total_brigadas?: number;
  total_evaluaciones?: number;
  dias_hasta_fecha?: number | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
}

export interface SimulacroList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_simulacro: TipoSimulacro;
  tipo_simulacro_display?: string;
  plan_emergencia: number;
  plan_emergencia_nombre?: string;
  alcance: AlcanceSimulacro;
  estado: EstadoSimulacro;
  fecha_programada: string;
  fecha_realizada: string | null;
  coordinador: string;
  fue_exitoso: boolean;
  total_brigadas?: number;
  total_evaluaciones?: number;
  dias_hasta_fecha?: number | null;
  creado_en: string;
  actualizado_en: string;
}

// ==================== EVALUACIÓN SIMULACRO ====================

export interface EvaluacionSimulacro {
  id: number;
  empresa_id: number;
  simulacro: number;
  fecha_evaluacion: string;
  evaluador: string;
  cargo_evaluador: string;
  tiempo_respuesta_calificacion: number;
  tiempo_respuesta_observaciones: string;
  activacion_alarma_calificacion: number;
  activacion_alarma_observaciones: string;
  comunicacion_calificacion: number;
  comunicacion_observaciones: string;
  evacuacion_calificacion: number;
  evacuacion_observaciones: string;
  brigadas_calificacion: number;
  brigadas_observaciones: string;
  punto_encuentro_calificacion: number;
  punto_encuentro_observaciones: string;
  conteo_personas_calificacion: number;
  conteo_personas_observaciones: string;
  tiempo_deteccion: number | null;
  tiempo_alarma: number | null;
  tiempo_evacuacion_total: number | null;
  personas_evacuadas: number;
  personas_no_evacuadas: number;
  personas_heridas_simuladas: number;
  calificacion_general: string;
  calificacion_porcentaje: string;
  fortalezas_identificadas: string;
  debilidades_identificadas: string;
  recomendaciones: string;
  requiere_acciones_correctivas: boolean;
  acciones_correctivas: string;
  conclusion_general: string;
  aprobado: boolean;
  documento_evaluacion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== RECURSO DE EMERGENCIA ====================

export interface RecursoEmergencia {
  id: number;
  empresa_id: number;
  codigo: string;
  tipo_recurso: TipoRecursoEmergencia;
  tipo_recurso_display?: string;
  nombre: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  capacidad: string;
  edificio: string;
  piso: string;
  area: string;
  ubicacion_especifica: string;
  tipo_agente: string;
  peso_agente: string | null;
  fecha_adquisicion: string | null;
  fecha_fabricacion: string | null;
  fecha_vencimiento: string | null;
  frecuencia_inspeccion: FrecuenciaInspeccionEmergencia;
  fecha_ultima_inspeccion: string | null;
  fecha_proxima_inspeccion: string | null;
  fecha_ultima_recarga: string | null;
  fecha_proxima_recarga: string | null;
  responsable: string;
  estado: EstadoRecursoEmergencia;
  estado_display?: string;
  observaciones: string;
  tiene_señalizacion: boolean;
  costo_adquisicion: string | null;
  inspecciones?: InspeccionRecurso[];
  ultima_inspeccion?: {
    fecha: string;
    resultado: ResultadoInspeccionRecurso;
    inspector: string;
  } | null;
  dias_proxima_inspeccion?: number | null;
  requiere_inspeccion?: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: string;
}

export interface RecursoEmergenciaList {
  id: number;
  codigo: string;
  tipo_recurso: TipoRecursoEmergencia;
  tipo_recurso_display?: string;
  nombre: string;
  area: string;
  ubicacion_especifica: string;
  estado: EstadoRecursoEmergencia;
  estado_display?: string;
  fecha_proxima_inspeccion: string | null;
  ultima_inspeccion?: {
    fecha: string;
    resultado: ResultadoInspeccionRecurso;
    inspector: string;
  } | null;
  dias_proxima_inspeccion?: number | null;
  requiere_inspeccion?: boolean;
  responsable: string;
  creado_en: string;
  actualizado_en: string;
}

// ==================== INSPECCIÓN DE RECURSO ====================

export interface InspeccionRecurso {
  id: number;
  empresa_id: number;
  recurso: number;
  recurso_codigo?: string;
  recurso_nombre?: string;
  recurso_tipo?: TipoRecursoEmergencia;
  codigo: string;
  fecha_inspeccion: string;
  hora_inspeccion: string | null;
  inspector: string;
  cargo_inspector: string;
  estado_fisico_conforme: boolean;
  estado_fisico_observaciones: string;
  ubicacion_correcta: boolean;
  ubicacion_observaciones: string;
  señalizacion_adecuada: boolean;
  señalizacion_observaciones: string;
  presion_adecuada: boolean | null;
  sello_seguridad_intacto: boolean | null;
  manguera_boquilla_estado: boolean | null;
  contenido_completo: boolean | null;
  medicamentos_vigentes: boolean | null;
  resultado: ResultadoInspeccionRecurso;
  observaciones_generales: string;
  requiere_mantenimiento: boolean;
  requiere_recarga: boolean;
  requiere_reemplazo: boolean;
  acciones_requeridas: string;
  acciones_realizadas: string;
  fecha_cierre: string | null;
  foto_inspeccion: string | null;
  proxima_inspeccion_programada: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateAnalisisVulnerabilidadDTO {
  codigo: string;
  nombre: string;
  tipo_amenaza: TipoAmenazaGlobal;
  fecha_analisis: string;
  descripcion: string;
  metodologia_utilizada: string;
  nivel_vulnerabilidad: NivelVulnerabilidad;
  puntuacion_vulnerabilidad: number;
  hallazgos?: string;
  recomendaciones?: string;
  responsable_analisis: string;
  proxima_revision?: string;
}

export interface CreateAmenazaDTO {
  analisis_vulnerabilidad: number;
  codigo: string;
  categoria: CategoriaAmenaza;
  nombre: string;
  descripcion: string;
  probabilidad: ProbabilidadAmenaza;
  valor_probabilidad: number;
  severidad: SeveridadAmenaza;
  valor_severidad: number;
  personas_afectadas_potenciales?: number;
  areas_criticas_afectadas?: string;
  medidas_prevencion?: string;
  medidas_propuestas?: string;
  requiere_plan_accion?: boolean;
}

export interface CreatePlanEmergenciaDTO {
  codigo: string;
  nombre: string;
  version: string;
  fecha_elaboracion: string;
  fecha_vigencia: string;
  fecha_revision: string;
  alcance: string;
  objetivos: string;
  director_emergencias: string;
  coordinador_emergencias: string;
  estructura_organizacional?: string;
  descripcion_instalaciones?: string;
  numero_personas?: number;
  horarios_operacion?: string;
  contactos_emergencia?: Record<string, any>;
}

export interface CreateProcedimientoEmergenciaDTO {
  plan_emergencia: number;
  codigo: string;
  tipo_emergencia: TipoEmergencia;
  nombre: string;
  version?: string;
  objetivo: string;
  alcance: string;
  responsables: string;
  pasos_respuesta: string;
  pasos_deteccion?: string;
  pasos_alarma?: string;
  pasos_comunicacion?: string;
  pasos_evacuacion?: string;
  pasos_seguimiento?: string;
  recursos_necesarios?: string;
  fecha_elaboracion: string;
  fecha_revision?: string;
}

export interface CreatePlanoEvacuacionDTO {
  plan_emergencia: number;
  codigo: string;
  nombre: string;
  version?: string;
  edificio: string;
  piso: string;
  area?: string;
  descripcion?: string;
  capacidad_personas?: number;
  numero_rutas?: number;
  rutas_detalle?: any[];
  puntos_encuentro?: any[];
  punto_encuentro_principal?: string;
  punto_encuentro_alterno?: string;
  salidas_emergencia?: number;
  extintores?: number;
  alarmas?: number;
  botiquines?: number;
  archivo_plano: string;
  fecha_elaboracion: string;
  fecha_revision_programada?: string;
}

export interface CreateTipoBrigadaDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  capacitacion_requerida: string;
  horas_capacitacion_minimas?: number;
  certificacion_requerida?: boolean;
  equipamiento_requerido?: string;
  nivel_prioridad?: number;
  color_identificacion?: string;
}

export interface CreateBrigadaDTO {
  tipo_brigada: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  sede?: string;
  area_cobertura?: string;
  lider_brigada: string;
  lider_contacto?: string;
  numero_minimo_brigadistas?: number;
  equipamiento_asignado?: string;
  ubicacion_equipamiento?: string;
  fecha_conformacion: string;
  fecha_proxima_capacitacion?: string;
}

export interface CreateBrigadistaActivoDTO {
  brigada: number;
  codigo_empleado: string;
  nombre_completo: string;
  documento_identidad: string;
  cargo: string;
  area: string;
  telefono: string;
  email: string;
  contacto_emergencia?: string;
  grupo_sanguineo?: GrupoSanguineo;
  alergias?: string;
  condiciones_medicas?: string;
  rol?: RolBrigadista;
  fecha_ingreso_brigada: string;
  fecha_capacitacion_inicial?: string;
  horas_capacitacion?: number;
  fecha_vencimiento_certificado?: string;
  dotacion_entregada?: string;
  fecha_entrega_dotacion?: string;
}

export interface CreateSimulacroDTO {
  plan_emergencia: number;
  nombre: string;
  tipo_simulacro: TipoSimulacro;
  alcance: AlcanceSimulacro;
  fecha_programada: string;
  duracion_programada: number;
  objetivo_general: string;
  objetivos_especificos?: string;
  descripcion_escenario: string;
  ubicacion: string;
  areas_involucradas: string;
  coordinador: string;
  numero_participantes_esperados?: number;
  brigadas_participantes?: number[];
  tipo_simulacro_anunciado?: boolean;
  notificar_participantes?: boolean;
}

export interface CreateRecursoEmergenciaDTO {
  codigo: string;
  tipo_recurso: TipoRecursoEmergencia;
  nombre: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  capacidad?: string;
  edificio?: string;
  piso?: string;
  area: string;
  ubicacion_especifica?: string;
  tipo_agente?: string;
  peso_agente?: number;
  fecha_adquisicion?: string;
  fecha_fabricacion?: string;
  fecha_vencimiento?: string;
  frecuencia_inspeccion?: FrecuenciaInspeccionEmergencia;
  fecha_proxima_inspeccion?: string;
  responsable?: string;
  tiene_señalizacion?: boolean;
  costo_adquisicion?: number;
}

export interface CreateInspeccionRecursoDTO {
  recurso: number;
  codigo: string;
  fecha_inspeccion: string;
  hora_inspeccion?: string;
  inspector: string;
  cargo_inspector?: string;
  estado_fisico_conforme?: boolean;
  estado_fisico_observaciones?: string;
  ubicacion_correcta?: boolean;
  ubicacion_observaciones?: string;
  señalizacion_adecuada?: boolean;
  señalizacion_observaciones?: string;
  presion_adecuada?: boolean;
  sello_seguridad_intacto?: boolean;
  manguera_boquilla_estado?: boolean;
  contenido_completo?: boolean;
  medicamentos_vigentes?: boolean;
  resultado: ResultadoInspeccionRecurso;
  observaciones_generales?: string;
  requiere_mantenimiento?: boolean;
  requiere_recarga?: boolean;
  requiere_reemplazo?: boolean;
  acciones_requeridas?: string;
  proxima_inspeccion_programada?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateAnalisisVulnerabilidadDTO extends Partial<CreateAnalisisVulnerabilidadDTO> {
  estado?: EstadoAnalisisVulnerabilidad;
  fecha_aprobacion?: string;
  aprobado_por?: string;
}

export interface UpdateAmenazaDTO extends Partial<CreateAmenazaDTO> {}
export interface UpdatePlanEmergenciaDTO extends Partial<CreatePlanEmergenciaDTO> {
  estado?: EstadoPlanEmergencia;
  fecha_aprobacion?: string;
  aprobado_por?: string;
}
export interface UpdateProcedimientoEmergenciaDTO extends Partial<CreateProcedimientoEmergenciaDTO> {
  estado?: EstadoProcedimiento;
}
export interface UpdatePlanoEvacuacionDTO extends Partial<CreatePlanoEvacuacionDTO> {
  publicado?: boolean;
  ubicaciones_publicacion?: string;
}
export interface UpdateTipoBrigadaDTO extends Partial<CreateTipoBrigadaDTO> {}
export interface UpdateBrigadaDTO extends Partial<CreateBrigadaDTO> {
  estado?: EstadoBrigada;
  fecha_ultima_capacitacion?: string;
}
export interface UpdateBrigadistaActivoDTO extends Partial<CreateBrigadistaActivoDTO> {
  estado?: EstadoBrigadista;
  fecha_inactivacion?: string;
  motivo_inactivacion?: string;
  numero_simulacros_participados?: number;
}
export interface UpdateSimulacroDTO extends Partial<CreateSimulacroDTO> {
  estado?: EstadoSimulacro;
  fecha_realizada?: string;
  duracion_real?: number;
  numero_participantes_reales?: number;
  fue_exitoso?: boolean;
  observaciones?: string;
  fortalezas?: string;
  oportunidades_mejora?: string;
}
export interface UpdateRecursoEmergenciaDTO extends Partial<CreateRecursoEmergenciaDTO> {
  estado?: EstadoRecursoEmergencia;
  fecha_ultima_inspeccion?: string;
  observaciones?: string;
}
export interface UpdateInspeccionRecursoDTO extends Partial<CreateInspeccionRecursoDTO> {
  acciones_realizadas?: string;
  fecha_cierre?: string;
}

// ==================== RESPONSE TYPES ====================
// PaginatedResponse se importa de tipos compartidos
