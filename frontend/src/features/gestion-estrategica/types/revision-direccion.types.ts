/**
 * Tipos TypeScript para Revisión por Dirección (ISO 9.3)
 * Sistema de Gestión StrateKaz
 */

// ==================== ENUMS ====================
// Nota: Los valores son lowercase porque el backend Django TextChoices los almacena asi

export type FrecuenciaRevision =
  | 'mensual'
  | 'bimestral'
  | 'trimestral'
  | 'cuatrimestral'
  | 'semestral'
  | 'anual';

export type EstadoProgramacion =
  | 'programada'
  | 'convocada'
  | 'realizada'
  | 'cancelada'
  | 'reprogramada';

export type EstadoActa = 'BORRADOR' | 'EN_REVISION' | 'APROBADA' | 'CERRADA';

export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO' | 'CANCELADO';

export type PrioridadCompromiso = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TipoDecision =
  | 'MEJORA_SISTEMA'
  | 'CAMBIO_PRODUCTO_SERVICIO'
  | 'RECURSOS_NECESARIOS'
  | 'REVISION_OBJETIVOS'
  | 'REVISION_POLITICA'
  | 'ACCION_CORRECTIVA'
  | 'ACCION_PREVENTIVA'
  | 'OTRO';

export type AsistenciaEstado = 'CONFIRMADA' | 'ASISTIO' | 'NO_ASISTIO' | 'JUSTIFICADA';

// ==================== PROGRAMACIÓN DE REVISIÓN ====================

export interface ProgramacionRevision {
  id: number;
  anio: number;
  periodo: string;
  frecuencia: FrecuenciaRevision;
  frecuencia_display?: string;
  fecha_programada: string;
  fecha_realizada?: string | null;
  hora_inicio?: string | null;
  duracion_estimada_horas?: number | string | null;
  lugar?: string;
  modalidad?: string;
  estado: EstadoProgramacion;
  estado_display?: string;
  // Responsable de convocar
  responsable_convocatoria?: number | null;
  responsable_nombre?: string | null;
  // Sistemas de gestion a revisar
  incluye_calidad: boolean;
  incluye_sst: boolean;
  incluye_ambiental: boolean;
  incluye_pesv: boolean;
  incluye_seguridad_info: boolean;
  // Computed fields (list serializer)
  total_participantes?: number;
  total_temas?: number;
  tiene_acta?: boolean;
  // Detail serializer extras
  participantes?: ParticipanteConvocado[];
  temas?: TemaRevision[];
  observaciones?: string;
  // Auditoria
  is_active: boolean;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

/** Tema/agenda item de una revision */
export interface TemaRevision {
  id: number;
  programa: number;
  categoria: string;
  categoria_display?: string;
  titulo: string;
  descripcion?: string;
  responsable?: number | null;
  responsable_nombre?: string | null;
  orden: number;
}

export interface ParticipanteConvocado {
  id: number;
  programacion: number;
  usuario?: number | null;
  usuario_name?: string | null;
  cargo?: number | null;
  cargo_name?: string | null;
  nombre_externo?: string | null;
  email?: string | null;
  rol_reunion: 'PRESIDENTE' | 'SECRETARIO' | 'MIEMBRO' | 'INVITADO';
  rol_reunion_display?: string;
  es_obligatorio: boolean;
  estado_confirmacion: AsistenciaEstado;
  estado_confirmacion_display?: string;
  observaciones?: string | null;
  created_at: string;
}

export interface CreateProgramacionRevisionDTO {
  anio: number;
  periodo: string;
  frecuencia?: FrecuenciaRevision;
  fecha_programada: string;
  hora_inicio?: string;
  duracion_estimada_horas?: number;
  lugar?: string;
  modalidad?: string;
  incluye_calidad?: boolean;
  incluye_sst?: boolean;
  incluye_ambiental?: boolean;
  incluye_pesv?: boolean;
  incluye_seguridad_info?: boolean;
  responsable_convocatoria?: number;
  observaciones?: string;
}

export interface UpdateProgramacionRevisionDTO {
  periodo?: string;
  frecuencia?: FrecuenciaRevision;
  fecha_programada?: string;
  hora_inicio?: string;
  duracion_estimada_horas?: number;
  lugar?: string;
  modalidad?: string;
  estado?: EstadoProgramacion;
  incluye_calidad?: boolean;
  incluye_sst?: boolean;
  incluye_ambiental?: boolean;
  incluye_pesv?: boolean;
  incluye_seguridad_info?: boolean;
  responsable_convocatoria?: number;
  observaciones?: string;
  is_active?: boolean;
}

export interface CreateParticipanteConvocadoDTO {
  usuario?: number;
  cargo?: number;
  nombre_externo?: string;
  email?: string;
  rol_reunion: 'PRESIDENTE' | 'SECRETARIO' | 'MIEMBRO' | 'INVITADO';
  es_obligatorio?: boolean;
}

// ==================== ACTA DE REVISIÓN ====================

export interface ActaRevision {
  id: number;
  numero_acta: string;
  programacion: number;
  programacion_codigo?: string;
  programacion_nombre?: string;
  fecha_revision: string;
  hora_inicio: string;
  hora_fin?: string | null;
  ubicacion?: string | null;
  // Estados
  estado: EstadoActa;
  estado_display?: string;
  version: number;
  // Participantes
  participantes: ParticipanteActa[];
  participantes_count?: number;
  presidente?: number | null;
  presidente_name?: string | null;
  secretario?: number | null;
  secretario_name?: string | null;
  // Elementos de Entrada (Inputs - ISO 9.3.2)
  elementos_entrada: ElementoEntrada[];
  // Análisis y Discusión
  analisis_discusion?: string | null;
  puntos_discutidos?: string | null;
  // Decisiones y Resultados (Outputs - ISO 9.3.3)
  decisiones: DecisionResultado[];
  // Compromisos y Acciones
  compromisos: CompromisoAccion[];
  compromisos_count?: number;
  // Aprobación y Cierre
  aprobada_por?: number | null;
  aprobada_por_name?: string | null;
  fecha_aprobacion?: string | null;
  firma_digital_hash?: string | null;
  is_firmada: boolean;
  observaciones_cierre?: string | null;
  fecha_cierre?: string | null;
  // Archivos adjuntos
  anexos?: AnexoActa[];
  // Auditoría
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipanteActa {
  id: number;
  acta: number;
  usuario?: number | null;
  usuario_name?: string | null;
  cargo_name?: string | null;
  nombre_externo?: string | null;
  rol_reunion: 'PRESIDENTE' | 'SECRETARIO' | 'MIEMBRO' | 'INVITADO';
  rol_reunion_display?: string;
  asistencia: AsistenciaEstado;
  asistencia_display?: string;
  hora_llegada?: string | null;
  observaciones?: string | null;
}

export interface ElementoEntrada {
  id: number;
  acta: number;
  categoria: EntradaCategoria;
  categoria_display?: string;
  titulo: string;
  descripcion: string;
  fuente_informacion?: string | null;
  responsable_presentacion?: number | null;
  responsable_presentacion_name?: string | null;
  archivo_soporte?: string | null;
  order: number;
  created_at: string;
}

export type EntradaCategoria =
  | 'ESTADO_ACCIONES_ANTERIORES'
  | 'CAMBIOS_CONTEXTO'
  | 'DESEMPENO_PROCESOS'
  | 'SATISFACCION_CLIENTE'
  | 'OBJETIVOS_CALIDAD'
  | 'NO_CONFORMIDADES'
  | 'RESULTADOS_SEGUIMIENTO'
  | 'RESULTADOS_AUDITORIAS'
  | 'DESEMPENO_PROVEEDORES'
  | 'ADECUACION_RECURSOS'
  | 'EFICACIA_ACCIONES_RIESGOS'
  | 'OPORTUNIDADES_MEJORA';

export interface DecisionResultado {
  id: number;
  acta: number;
  tipo_decision: TipoDecision;
  tipo_decision_display?: string;
  descripcion: string;
  justificacion?: string | null;
  impacto_esperado?: string | null;
  recursos_necesarios?: string | null;
  responsable?: number | null;
  responsable_name?: string | null;
  fecha_limite?: string | null;
  prioridad: PrioridadCompromiso;
  prioridad_display?: string;
  order: number;
  created_at: string;
}

export interface CompromisoAccion {
  id: number;
  acta: number;
  codigo: string;
  descripcion: string;
  objetivo?: string | null;
  responsable: number;
  responsable_name?: string;
  responsable_cargo_name?: string;
  fecha_compromiso: string;
  fecha_limite: string;
  prioridad: PrioridadCompromiso;
  prioridad_display?: string;
  estado: EstadoCompromiso;
  estado_display?: string;
  progreso: number;
  // Seguimiento
  fecha_inicio_real?: string | null;
  fecha_finalizacion_real?: string | null;
  evidencia_cumplimiento?: string | null;
  observaciones?: string | null;
  // Verificación
  verificado_por?: number | null;
  verificado_por_name?: string | null;
  fecha_verificacion?: string | null;
  es_eficaz?: boolean | null;
  // Relación con elementos
  relacionado_decision?: number | null;
  relacionado_entrada?: number | null;
  // Auditoría
  created_at: string;
  updated_at: string;
}

export interface AnexoActa {
  id: number;
  acta: number;
  nombre: string;
  descripcion?: string | null;
  archivo: string;
  tipo_archivo?: string | null;
  tamano_bytes?: number | null;
  uploaded_by?: number | null;
  uploaded_by_name?: string | null;
  created_at: string;
}

// ==================== DTOs ====================

export interface CreateActaRevisionDTO {
  programacion: number;
  fecha_revision: string;
  hora_inicio: string;
  hora_fin?: string;
  ubicacion?: string;
  presidente?: number;
  secretario?: number;
  participantes?: CreateParticipanteActaDTO[];
  elementos_entrada?: CreateElementoEntradaDTO[];
  analisis_discusion?: string;
  puntos_discutidos?: string;
  decisiones?: CreateDecisionResultadoDTO[];
  compromisos?: CreateCompromisoAccionDTO[];
}

export interface UpdateActaRevisionDTO {
  fecha_revision?: string;
  hora_inicio?: string;
  hora_fin?: string;
  ubicacion?: string;
  estado?: EstadoActa;
  presidente?: number;
  secretario?: number;
  analisis_discusion?: string;
  puntos_discutidos?: string;
  observaciones_cierre?: string;
}

export interface CreateParticipanteActaDTO {
  usuario?: number;
  nombre_externo?: string;
  rol_reunion: 'PRESIDENTE' | 'SECRETARIO' | 'MIEMBRO' | 'INVITADO';
  asistencia: AsistenciaEstado;
  hora_llegada?: string;
  observaciones?: string;
}

export interface CreateElementoEntradaDTO {
  categoria: EntradaCategoria;
  titulo: string;
  descripcion: string;
  fuente_informacion?: string;
  responsable_presentacion?: number;
  order?: number;
}

export interface CreateDecisionResultadoDTO {
  tipo_decision: TipoDecision;
  descripcion: string;
  justificacion?: string;
  impacto_esperado?: string;
  recursos_necesarios?: string;
  responsable?: number;
  fecha_limite?: string;
  prioridad: PrioridadCompromiso;
  order?: number;
}

export interface CreateCompromisoAccionDTO {
  descripcion: string;
  objetivo?: string;
  responsable: number;
  fecha_limite: string;
  prioridad: PrioridadCompromiso;
  relacionado_decision?: number;
  relacionado_entrada?: number;
}

export interface UpdateCompromisoDTO {
  descripcion?: string;
  objetivo?: string;
  responsable?: number;
  fecha_limite?: string;
  prioridad?: PrioridadCompromiso;
  estado?: EstadoCompromiso;
  progreso?: number;
  fecha_inicio_real?: string;
  fecha_finalizacion_real?: string;
  evidencia_cumplimiento?: string;
  observaciones?: string;
}

export interface AprobarActaDTO {
  observaciones?: string;
}

// ==================== FILTERS ====================

export interface ProgramacionFilters {
  anio?: number;
  frecuencia?: FrecuenciaRevision;
  estado?: EstadoProgramacion;
  fecha_desde?: string;
  fecha_hasta?: string;
  tiene_acta?: boolean;
  search?: string;
}

export interface ActaFilters {
  estado?: EstadoActa;
  fecha_desde?: string;
  fecha_hasta?: string;
  presidente?: number;
  is_firmada?: boolean;
  search?: string;
}

export interface CompromisoFilters {
  acta?: number;
  responsable?: number;
  estado?: EstadoCompromiso;
  prioridad?: PrioridadCompromiso;
  fecha_desde?: string;
  fecha_hasta?: string;
  vencidos?: boolean;
  search?: string;
}

// ==================== ESTADÍSTICAS ====================

export interface RevisionDireccionStats {
  total_programaciones: number;
  programaciones_pendientes: number;
  programaciones_completadas: number;
  total_actas: number;
  actas_aprobadas: number;
  actas_pendientes_aprobacion: number;
  total_compromisos: number;
  compromisos_pendientes: number;
  compromisos_vencidos: number;
  compromisos_completados: number;
  tasa_cumplimiento_compromisos: number;
  proxima_revision?: {
    id: number;
    codigo: string;
    fecha_programada: string;
    dias_restantes: number;
  } | null;
}

// ==================== DASHBOARD ====================

export interface DashboardRevision {
  stats: RevisionDireccionStats;
  programaciones_proximas: ProgramacionRevision[];
  compromisos_criticos: CompromisoAccion[];
  actas_recientes: ActaRevision[];
}

// ==================== INFORME CONSOLIDADO (ISO 9.3 Aggregator) ====================

/** Estructura de un conteo por categoría genérica (estado, tipo, etc.) */
export interface ConteoCategoria {
  [key: string]: string | number;
  cantidad: number;
}

/** Módulo: Cumplimiento Legal */
export interface ResumenCumplimientoLegal {
  total_requisitos: number;
  vigentes: number;
  vencidos: number;
  proximos_vencer_30d: number;
  porcentaje_cumplimiento: number;
  por_estado: ConteoCategoria[];
  nuevos_en_periodo: number;
}

/** Módulo: Riesgos y Oportunidades */
export interface ResumenRiesgos {
  total_riesgos: number;
  por_nivel_residual: {
    BAJO: number;
    MODERADO: number;
    ALTO: number;
    CRITICO: number;
  };
  criticos_y_altos: number;
  por_estado: ConteoCategoria[];
  tratamientos_activos: number;
  nuevos_en_periodo: number;
  total_oportunidades: number;
}

/** Módulo: Accidentalidad SST */
export interface ResumenAccidentalidad {
  total_accidentes: number;
  total_dias_incapacidad: number;
  por_gravedad: {
    leves: number;
    moderados: number;
    graves: number;
    mortales: number;
  };
  total_incidentes: number;
  total_enfermedades_laborales: number;
}

/** Módulo: Auditorías y Mejora Continua */
export interface ResumenAuditorias {
  total_auditorias: number;
  por_estado: ConteoCategoria[];
  por_tipo: ConteoCategoria[];
  hallazgos: {
    total: number;
    por_tipo: ConteoCategoria[];
    cerrados: number;
    porcentaje_cierre: number;
  };
}

/** Módulo: Gestión Ambiental */
export interface ResumenAmbiental {
  residuos_generados_kg: number;
  residuos_aprovechados_kg: number;
  porcentaje_aprovechamiento: number;
  consumos_recursos: Array<{ tipo_recurso__nombre: string; total: number }>;
  certificados_vigentes: number;
}

/** Módulo: Calidad / No Conformidades */
export interface ResumenCalidad {
  total_no_conformidades: number;
  abiertas: number;
  cerradas: number;
  por_estado: ConteoCategoria[];
  por_tipo: ConteoCategoria[];
  por_severidad: ConteoCategoria[];
  acciones_correctivas: {
    total: number;
    verificadas: number;
    porcentaje_efectividad: number;
  };
}

/** Módulo: Gestión de Comités */
export interface ResumenComites {
  reuniones_programadas: number;
  reuniones_realizadas: number;
  porcentaje_cumplimiento: number;
  asistencia_promedio: number;
  compromisos_total: number;
  compromisos_cumplidos: number;
}

/** Módulo: Proveedores */
export interface ResumenProveedores {
  total_activos: number;
  nuevos_en_periodo: number;
  evaluaciones_total: number;
  evaluaciones_completadas: number;
  calificacion_promedio: number | null;
}

/** Módulo: Formación y Capacitación */
export interface ResumenFormacion {
  programaciones_total: number;
  programaciones_completadas: number;
  porcentaje_ejecucion: number;
  total_horas: number;
  participaciones: number;
  porcentaje_asistencia: number;
}

/** Módulo: Talento Humano */
export interface ResumenTalentoHumano {
  total_activos: number;
  nuevos_ingresos: number;
  retiros: number;
  tasa_rotacion: number;
  por_tipo_contrato: ConteoCategoria[];
}

/** Módulo: Satisfacción del Cliente */
export interface ResumenSatisfaccion {
  total_pqrs: number;
  por_tipo: ConteoCategoria[];
  resueltas: number;
  tiempo_promedio_respuesta: number;
  encuestas_respondidas: number;
  nps_promedio: number | null;
}

/** Módulo: Presupuesto y Recursos */
export interface ResumenPresupuesto {
  anio: number;
  total_asignado: number;
  total_ejecutado: number;
  saldo_disponible: number;
  porcentaje_ejecucion: number;
  por_estado: ConteoCategoria[];
}

/** Módulo: Planeación Estratégica */
export interface ResumenPlaneacion {
  total_objetivos: number;
  por_estado: ConteoCategoria[];
  avance_global: number;
  retrasados: number;
  completados: number;
  por_perspectiva_bsc: Array<{
    bsc_perspective: string;
    cantidad: number;
    avance: number;
  }>;
  total_kpis: number;
}

/** Módulo: Contexto Organizacional */
export interface ResumenContexto {
  analisis_dofa: number;
  factores_dofa: ConteoCategoria[];
  analisis_pestel: number;
  partes_interesadas_total: number;
  partes_interesadas_nuevas: number;
}

/** Wrapper genérico para cada módulo en la respuesta */
export interface ModuloConsolidado<T = Record<string, unknown>> {
  disponible: boolean;
  data: T;
  error?: string;
}

/** Mapa de todos los módulos consolidados */
export interface ModulosConsolidados {
  cumplimiento_legal: ModuloConsolidado<ResumenCumplimientoLegal>;
  riesgos_oportunidades: ModuloConsolidado<ResumenRiesgos>;
  accidentalidad_sst: ModuloConsolidado<ResumenAccidentalidad>;
  auditorias_mejora_continua: ModuloConsolidado<ResumenAuditorias>;
  gestion_ambiental: ModuloConsolidado<ResumenAmbiental>;
  calidad_no_conformidades: ModuloConsolidado<ResumenCalidad>;
  gestion_comites: ModuloConsolidado<ResumenComites>;
  proveedores: ModuloConsolidado<ResumenProveedores>;
  formacion_capacitacion: ModuloConsolidado<ResumenFormacion>;
  talento_humano: ModuloConsolidado<ResumenTalentoHumano>;
  satisfaccion_cliente: ModuloConsolidado<ResumenSatisfaccion>;
  presupuesto_recursos: ModuloConsolidado<ResumenPresupuesto>;
  planeacion_estrategica: ModuloConsolidado<ResumenPlaneacion>;
  contexto_organizacional: ModuloConsolidado<ResumenContexto>;
}

/** Resumen ejecutivo del informe */
export interface ResumenEjecutivo {
  total_modulos: number;
  modulos_disponibles: number;
  modulos_con_error: number;
}

/** Respuesta completa del endpoint informe-consolidado */
export interface InformeConsolidadoResponse {
  periodo: {
    fecha_desde: string;
    fecha_hasta: string;
  };
  modulos: ModulosConsolidados;
  resumen_ejecutivo: ResumenEjecutivo;
}

// ==================== FIRMA DIGITAL DEL ACTA ====================

export type RolFirma = 'ELABORO' | 'REVISO' | 'APROBO';

export type EstadoFirmaGeneral = 'pendiente' | 'en_proceso' | 'completado';

export interface FirmaSlot {
  rol: RolFirma;
  usuario_id: number | null;
  usuario_nombre: string;
  firmado: boolean;
  fecha_firma: string | null;
  firma_imagen_url: string | null;
}

export interface EstadoFirmas {
  firma_documento_id: number | null;
  estado: EstadoFirmaGeneral;
  firmas: FirmaSlot[];
}

export interface FirmarActaDTO {
  rol_firma: RolFirma;
  firma_imagen: string; // base64
  observaciones?: string;
}

// ==================== ENVÍO DE INFORME ====================

export interface EnviarInformeDTO {
  destinatarios: string[];
  mensaje?: string;
}

export interface EnviarInformeResponse {
  message: string;
  destinatarios: string[];
}
