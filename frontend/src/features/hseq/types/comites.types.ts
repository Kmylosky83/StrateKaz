/**
 * Tipos TypeScript para Módulo de Gestión de Comités - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Comité (COPASST, COCOLA, CSV, Brigadas, etc.)
 * - Comités Activos con periodos
 * - Miembros del Comité
 * - Reuniones y Asistencias
 * - Actas de Reunión y Compromisos
 * - Votaciones
 */

// ==================== ENUMS Y TIPOS ====================

// Tipos de Comité
export type PeriodicidadReunion =
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL'
  | 'PERSONALIZADO';

// Comité
export type EstadoComite = 'CONFORMACION' | 'ACTIVO' | 'SUSPENDIDO' | 'FINALIZADO';

// Miembro de Comité
export type RolBrigadista = 'LIDER' | 'SUBLIDER' | 'BRIGADISTA';

// Reunión
export type TipoReunion = 'ORDINARIA' | 'EXTRAORDINARIA';
export type ModalidadReunion = 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDA';
export type EstadoReunion = 'PROGRAMADA' | 'EN_CURSO' | 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA';

// Acta de Reunión
export type EstadoActa = 'BORRADOR' | 'REVISION' | 'APROBADA' | 'RECHAZADA';

// Compromiso
export type TipoCompromiso =
  | 'ACCION'
  | 'SEGUIMIENTO'
  | 'VERIFICACION'
  | 'INVESTIGACION'
  | 'CAPACITACION'
  | 'INSPECCION'
  | 'OTRO';

export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'VENCIDO' | 'CANCELADO';
export type PrioridadCompromiso = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Votación
export type TipoVotacion = 'ELECCION' | 'DECISION' | 'APROBACION' | 'OTRO';
export type EstadoVotacion = 'PROGRAMADA' | 'EN_CURSO' | 'CERRADA' | 'CANCELADA';

// ==================== TIPO DE COMITÉ ====================

export interface TipoComite {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  normativa_base: string;

  // Configuración de periodicidad
  periodicidad_reuniones: PeriodicidadReunion;

  // Configuración de miembros
  num_minimo_miembros: number;
  num_maximo_miembros: number | null;
  requiere_eleccion: boolean;
  duracion_periodo_meses: number;

  // Roles configurables
  roles_disponibles: string[];

  // Configuración de quorum
  requiere_quorum: boolean;
  porcentaje_quorum: number;

  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoComiteList {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  periodicidad_reuniones: PeriodicidadReunion;
  num_minimo_miembros: number;
  requiere_eleccion: boolean;
  activo: boolean;
  created_at: string;
}

// ==================== COMITÉ ====================

export interface Comite {
  id: number;
  empresa_id: number;
  tipo_comite: number;
  tipo_comite_nombre?: string;
  tipo_comite_codigo?: string;
  codigo_comite: string;
  nombre: string;

  // Periodo
  fecha_inicio: string;
  fecha_fin: string;
  periodo_descripcion: string;

  // Estado
  estado: EstadoComite;

  // Acta de conformación
  acta_conformacion: string | null;
  fecha_conformacion: string | null;

  // Observaciones
  observaciones: string;

  // Propiedades calculadas
  esta_vigente?: boolean;
  num_miembros_activos?: number;
  miembros?: MiembroComite[];

  created_at: string;
  updated_at: string;
}

export interface ComiteList {
  id: number;
  codigo_comite: string;
  nombre: string;
  tipo_comite: number;
  tipo_comite_nombre?: string;
  tipo_comite_codigo?: string;
  periodo_descripcion: string;
  estado: EstadoComite;
  fecha_inicio: string;
  fecha_fin: string;
  num_miembros_activos?: number;
  esta_vigente?: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== MIEMBRO DE COMITÉ ====================

export interface MiembroComite {
  id: number;
  empresa_id: number;
  comite: number;
  comite_nombre?: string;
  empleado_id: number;
  empleado_nombre: string;
  empleado_cargo: string;

  // Rol en el comité
  rol: string;
  es_principal: boolean;

  // Representación
  representa_a: string;

  // Vigencia
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;

  // Elección (si aplica)
  numero_votos: number | null;
  acta_eleccion: string | null;

  // Motivo de retiro
  motivo_retiro: string;

  created_at: string;
  updated_at: string;
}

export interface MiembroComiteList {
  id: number;
  comite: number;
  comite_nombre?: string;
  empleado_nombre: string;
  empleado_cargo: string;
  rol: string;
  es_principal: boolean;
  representa_a: string;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  created_at: string;
}

// ==================== REUNIÓN ====================

export interface Reunion {
  id: number;
  empresa_id: number;
  comite: number;
  comite_nombre?: string;
  comite_codigo?: string;
  numero_reunion: string;

  // Tipo y clasificación
  tipo: TipoReunion;

  // Programación
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada: string | null;

  // Realización
  fecha_realizada: string | null;
  hora_inicio_real: string | null;
  hora_fin_real: string | null;

  // Ubicación
  lugar: string;
  modalidad: ModalidadReunion;
  enlace_virtual: string;

  // Estado
  estado: EstadoReunion;

  // Quorum
  cumple_quorum: boolean;
  num_asistentes: number;

  // Agenda
  agenda: string;

  // Observaciones
  observaciones: string;
  motivo_cancelacion: string;

  // Propiedades calculadas
  duracion_minutos?: number | null;
  asistencias?: AsistenciaReunion[];
  tiene_acta?: boolean;

  created_at: string;
  updated_at: string;
}

export interface ReunionList {
  id: number;
  numero_reunion: string;
  comite: number;
  comite_nombre?: string;
  tipo: TipoReunion;
  fecha_programada: string;
  estado: EstadoReunion;
  lugar: string;
  modalidad: ModalidadReunion;
  cumple_quorum: boolean;
  num_asistentes: number;
  tiene_acta?: boolean;
  created_at: string;
}

// ==================== ASISTENCIA A REUNIÓN ====================

export interface AsistenciaReunion {
  id: number;
  empresa_id: number;
  reunion: number;
  miembro: number;
  miembro_nombre?: string;
  miembro_rol?: string;

  asistio: boolean;
  hora_llegada: string | null;
  excusa: string;
  excusa_justificada: boolean;
  observaciones: string;

  created_at: string;
  updated_at: string;
}

// ==================== ACTA DE REUNIÓN ====================

export interface ActaReunion {
  id: number;
  empresa_id: number;
  reunion: number;
  reunion_numero?: string;
  comite_nombre?: string;
  fecha_reunion?: string;
  numero_acta: string;

  // Contenido
  desarrollo: string;
  conclusiones: string;
  decisiones: string;

  // Próxima reunión
  proxima_reunion_fecha: string | null;
  proxima_reunion_agenda: string;

  // Aprobación
  estado: EstadoActa;
  fecha_aprobacion: string | null;
  aprobada_por_id: number | null;
  aprobada_por_nombre: string;

  // Archivo
  archivo_pdf: string | null;

  // Firmas digitales
  firmas: unknown[];

  observaciones_revision: string;

  // Relaciones
  compromisos?: Compromiso[];
  num_compromisos?: number;
  num_compromisos_pendientes?: number;

  created_at: string;
  updated_at: string;
}

export interface ActaReunionList {
  id: number;
  numero_acta: string;
  reunion: number;
  reunion_numero?: string;
  comite_nombre?: string;
  fecha_reunion?: string;
  estado: EstadoActa;
  fecha_aprobacion: string | null;
  aprobada_por_nombre: string;
  num_compromisos?: number;
  num_compromisos_pendientes?: number;
  created_at: string;
}

// ==================== COMPROMISO ====================

export interface Compromiso {
  id: number;
  empresa_id: number;
  acta: number;
  acta_numero?: string;
  comite_nombre?: string;
  numero_compromiso: string;

  // Descripción
  descripcion: string;
  tipo: TipoCompromiso;

  // Responsable
  responsable_id: number;
  responsable_nombre: string;
  area_responsable: string;

  // Plazos
  fecha_compromiso: string;
  fecha_limite: string;
  fecha_cierre: string | null;

  // Estado
  estado: EstadoCompromiso;
  porcentaje_avance: number;

  // Prioridad
  prioridad: PrioridadCompromiso;

  // Evidencias
  evidencias: unknown[];

  // Verificación
  verificado_por_id: number | null;
  verificado_por_nombre: string;
  fecha_verificacion: string | null;
  observaciones_verificacion: string;

  // Seguimiento
  observaciones: string;
  seguimientos?: SeguimientoCompromiso[];

  // Propiedades calculadas
  esta_vencido?: boolean;
  dias_para_vencimiento?: number;

  created_at: string;
  updated_at: string;
}

export interface CompromisoList {
  id: number;
  numero_compromiso: string;
  descripcion: string;
  tipo: TipoCompromiso;
  acta: number;
  acta_numero?: string;
  comite_nombre?: string;
  responsable_nombre: string;
  fecha_limite: string;
  estado: EstadoCompromiso;
  porcentaje_avance: number;
  prioridad: PrioridadCompromiso;
  esta_vencido?: boolean;
  dias_para_vencimiento?: number;
  created_at: string;
}

// ==================== SEGUIMIENTO DE COMPROMISO ====================

export interface SeguimientoCompromiso {
  id: number;
  empresa_id: number;
  compromiso: number;
  compromiso_numero?: string;
  compromiso_descripcion?: string;

  fecha_seguimiento: string;
  avance_reportado: number;
  descripcion_avance: string;
  evidencias: unknown[];

  dificultades: string;
  requiere_apoyo: boolean;
  tipo_apoyo_requerido: string;

  registrado_por_id: number;
  registrado_por_nombre: string;

  created_at: string;
  updated_at: string;
}

// ==================== VOTACIÓN ====================

export interface Votacion {
  id: number;
  empresa_id: number;
  comite: number;
  comite_nombre?: string;
  reunion: number | null;
  reunion_numero?: string | null;
  numero_votacion: string;

  // Descripción
  titulo: string;
  descripcion: string;
  tipo: TipoVotacion;

  // Periodo de votación
  fecha_inicio: string;
  fecha_fin: string;

  // Configuración
  es_secreta: boolean;
  requiere_mayoria_simple: boolean;
  porcentaje_mayoria_requerido: number;
  permite_abstencion: boolean;

  // Opciones de votación
  opciones: OpcionVotacion[];

  // Estado
  estado: EstadoVotacion;

  // Resultados
  total_votos_emitidos: number;
  resultados: Record<string, unknown>;
  opcion_ganadora: string;

  // Cierre
  fecha_cierre_real: string | null;
  cerrada_por_id: number | null;

  observaciones: string;

  // Propiedades calculadas
  esta_activa?: boolean;
  votos?: VotoMiembro[];
  porcentaje_participacion?: number;

  created_at: string;
  updated_at: string;
}

export interface VotacionList {
  id: number;
  numero_votacion: string;
  titulo: string;
  tipo: TipoVotacion;
  comite: number;
  comite_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoVotacion;
  total_votos_emitidos: number;
  esta_activa?: boolean;
  porcentaje_participacion?: number;
  created_at: string;
}

export interface OpcionVotacion {
  id: number;
  texto: string;
}

// ==================== VOTO DE MIEMBRO ====================

export interface VotoMiembro {
  id: number;
  empresa_id: number;
  votacion: number;
  miembro: number;
  miembro_nombre?: string;

  // Voto
  fecha_voto: string;
  opcion_id: number | null;
  opcion_texto: string;

  // Abstención
  es_abstencion: boolean;
  justificacion_abstencion: string;

  // Comentarios
  comentarios: string;

  // Anonimización (para votaciones secretas)
  voto_hash: string;

  created_at: string;
  updated_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoComiteDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  normativa_base?: string;
  periodicidad_reuniones?: PeriodicidadReunion;
  num_minimo_miembros?: number;
  num_maximo_miembros?: number;
  requiere_eleccion?: boolean;
  duracion_periodo_meses?: number;
  roles_disponibles?: string[];
  requiere_quorum?: boolean;
  porcentaje_quorum?: number;
}

export interface CreateComiteDTO {
  tipo_comite: number;
  codigo_comite: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  periodo_descripcion: string;
  fecha_conformacion?: string;
  observaciones?: string;
}

export interface CreateMiembroComiteDTO {
  comite: number;
  empleado_id: number;
  empleado_nombre: string;
  empleado_cargo: string;
  rol: string;
  es_principal?: boolean;
  representa_a?: string;
  fecha_inicio: string;
  numero_votos?: number;
}

export interface CreateReunionDTO {
  comite: number;
  numero_reunion: string;
  tipo?: TipoReunion;
  fecha_programada: string;
  hora_inicio_programada: string;
  hora_fin_programada?: string;
  lugar: string;
  modalidad?: ModalidadReunion;
  enlace_virtual?: string;
  agenda: string;
}

export interface CreateActaReunionDTO {
  reunion: number;
  numero_acta: string;
  desarrollo: string;
  conclusiones?: string;
  decisiones?: string;
  proxima_reunion_fecha?: string;
  proxima_reunion_agenda?: string;
}

export interface CreateCompromisoDTO {
  acta: number;
  numero_compromiso: string;
  descripcion: string;
  tipo?: TipoCompromiso;
  responsable_id: number;
  responsable_nombre: string;
  area_responsable?: string;
  fecha_compromiso: string;
  fecha_limite: string;
  prioridad?: PrioridadCompromiso;
}

export interface CreateSeguimientoCompromisoDTO {
  compromiso: number;
  fecha_seguimiento: string;
  avance_reportado: number;
  descripcion_avance: string;
  evidencias?: unknown[];
  dificultades?: string;
  requiere_apoyo?: boolean;
  tipo_apoyo_requerido?: string;
  registrado_por_id: number;
  registrado_por_nombre: string;
}

export interface CreateVotacionDTO {
  comite: number;
  reunion?: number;
  numero_votacion: string;
  titulo: string;
  descripcion: string;
  tipo?: TipoVotacion;
  fecha_inicio: string;
  fecha_fin: string;
  es_secreta?: boolean;
  requiere_mayoria_simple?: boolean;
  porcentaje_mayoria_requerido?: number;
  permite_abstencion?: boolean;
  opciones: OpcionVotacion[];
}

export interface CreateVotoMiembroDTO {
  votacion: number;
  miembro: number;
  opcion_id?: number;
  es_abstencion?: boolean;
  justificacion_abstencion?: string;
  comentarios?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoComiteDTO extends Partial<CreateTipoComiteDTO> {
  activo?: boolean;
}

export interface UpdateComiteDTO extends Partial<CreateComiteDTO> {
  estado?: EstadoComite;
  acta_conformacion?: string;
}

export interface UpdateMiembroComiteDTO extends Partial<CreateMiembroComiteDTO> {
  activo?: boolean;
  fecha_fin?: string;
  motivo_retiro?: string;
}

export interface UpdateReunionDTO extends Partial<CreateReunionDTO> {
  estado?: EstadoReunion;
  fecha_realizada?: string;
  hora_inicio_real?: string;
  hora_fin_real?: string;
  num_asistentes?: number;
  cumple_quorum?: boolean;
  motivo_cancelacion?: string;
}

export interface UpdateActaReunionDTO extends Partial<CreateActaReunionDTO> {
  estado?: EstadoActa;
  observaciones_revision?: string;
}

export interface UpdateCompromisoDTO extends Partial<CreateCompromisoDTO> {
  estado?: EstadoCompromiso;
  porcentaje_avance?: number;
  fecha_cierre?: string;
  evidencias?: unknown[];
  observaciones?: string;
}

export interface UpdateVotacionDTO extends Partial<CreateVotacionDTO> {
  estado?: EstadoVotacion;
  observaciones?: string;
}

// ==================== ACTIONS ====================

export interface RegistrarAsistenciaDTO {
  asistencias: Array<{
    miembro_id: number;
    asistio: boolean;
    hora_llegada?: string;
    excusa?: string;
    excusa_justificada?: boolean;
    observaciones?: string;
  }>;
}

export interface AprobarActaDTO {
  aprobada_por_id: number;
  aprobada_por_nombre: string;
  observaciones?: string;
}

export interface CerrarCompromisoDTO {
  verificado_por_id: number;
  verificado_por_nombre: string;
  observaciones_verificacion?: string;
  evidencias?: unknown[];
}

export interface CerrarVotacionDTO {
  cerrada_por_id: number;
  observaciones?: string;
}

export interface ActualizarAvanceCompromisoDTO {
  porcentaje_avance: number;
}

export interface RetirarMiembroDTO {
  fecha_fin: string;
  motivo_retiro?: string;
}

// ==================== RESPONSE TYPES ====================

// PaginatedResponse: importar desde '@/types'

export interface EstadisticasComite {
  comite: Comite;
  reuniones: {
    total: number;
    realizadas: number;
    pendientes: number;
  };
  compromisos: {
    total: number;
    completados: number;
    vencidos: number;
    tasa_cumplimiento: number;
  };
  votaciones: {
    total: number;
    cerradas: number;
    activas: number;
  };
}
