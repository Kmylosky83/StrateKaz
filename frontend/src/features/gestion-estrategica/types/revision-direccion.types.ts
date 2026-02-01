/**
 * Tipos TypeScript para Revisión por Dirección (ISO 9.3)
 * Sistema de Gestión StrateKaz
 */

import type { ISOStandard } from './strategic.types';

// ==================== ENUMS ====================

export type FrecuenciaRevision = 'TRIMESTRAL' | 'CUATRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export type EstadoProgramacion = 'PROGRAMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'REPROGRAMADA';

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
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  frecuencia: FrecuenciaRevision;
  frecuencia_display?: string;
  fecha_programada: string;
  hora_inicio: string;
  hora_fin?: string | null;
  duracion_estimada_horas?: number | null;
  ubicacion?: string | null;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
  modalidad_display?: string;
  enlace_reunion?: string | null;
  estado: EstadoProgramacion;
  estado_display?: string;
  // ISO Standards aplicables
  iso_9001: boolean;
  iso_14001: boolean;
  iso_45001: boolean;
  iso_27001: boolean;
  pesv: boolean;
  sg_sst: boolean;
  // Participantes
  convocados: ParticipanteConvocado[];
  convocados_count?: number;
  // Control
  responsable_preparacion?: number | null;
  responsable_preparacion_name?: string | null;
  notificacion_enviada: boolean;
  fecha_notificacion?: string | null;
  recordatorio_enviado: boolean;
  // Relaciones
  acta_id?: number | null;
  acta_numero?: string | null;
  tiene_acta: boolean;
  // Auditoría
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
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
  codigo?: string;
  nombre: string;
  descripcion?: string;
  frecuencia: FrecuenciaRevision;
  fecha_programada: string;
  hora_inicio: string;
  hora_fin?: string;
  duracion_estimada_horas?: number;
  ubicacion?: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
  enlace_reunion?: string;
  iso_9001?: boolean;
  iso_14001?: boolean;
  iso_45001?: boolean;
  iso_27001?: boolean;
  pesv?: boolean;
  sg_sst?: boolean;
  responsable_preparacion?: number;
  convocados?: CreateParticipanteConvocadoDTO[];
}

export interface UpdateProgramacionRevisionDTO {
  nombre?: string;
  descripcion?: string;
  fecha_programada?: string;
  hora_inicio?: string;
  hora_fin?: string;
  duracion_estimada_horas?: number;
  ubicacion?: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
  enlace_reunion?: string;
  estado?: EstadoProgramacion;
  responsable_preparacion?: number;
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
