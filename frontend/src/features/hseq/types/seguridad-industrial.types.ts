/**
 * Tipos TypeScript para Módulo de Seguridad Industrial - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Permisos de Trabajo
 * - Inspecciones de Seguridad
 * - Control de EPP (Equipos de Protección Personal)
 * - Programas de Seguridad
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

// Permisos de Trabajo
export type EstadoPermisoTrabajo =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'APROBADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'VENCIDO';

// Inspecciones
export type FrecuenciaInspeccion =
  | 'DIARIA'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL'
  | 'EVENTUAL';

export type EstadoInspeccion = 'PROGRAMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export type ResultadoInspeccionGlobal = 'SATISFACTORIO' | 'ACEPTABLE' | 'DEFICIENTE' | 'CRITICO';

export type ResultadoItemInspeccion = 'CONFORME' | 'NO_CONFORME' | 'NO_APLICA' | 'OBSERVACION';

// EPP
export type CategoriaEPP =
  | 'CABEZA'
  | 'OJOS_CARA'
  | 'AUDITIVA'
  | 'RESPIRATORIA'
  | 'MANOS'
  | 'PIES'
  | 'CUERPO'
  | 'CAIDAS'
  | 'OTROS';

export type EstadoEntregaEPP = 'EN_USO' | 'DEVUELTO' | 'EXTRAVIADO' | 'DANADO' | 'VENCIDO';

// Programas de Seguridad
export type TipoProgramaSeguridad =
  | 'PREVENCION_RIESGOS'
  | 'CAPACITACION'
  | 'VIGILANCIA_SALUD'
  | 'INSPECCION'
  | 'PREPARACION_EMERGENCIAS'
  | 'INVESTIGACION_INCIDENTES'
  | 'MEJORA_CONTINUA'
  | 'OTRO';

export type EstadoProgramaSeguridad =
  | 'PLANIFICADO'
  | 'EN_EJECUCION'
  | 'PAUSADO'
  | 'COMPLETADO'
  | 'CANCELADO';

// ==================== TIPO PERMISO TRABAJO ====================

export interface TipoPermisoTrabajo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  requiere_autorizacion_sst: boolean;
  requiere_autorizacion_operaciones: boolean;
  duracion_maxima_horas: number;
  checklist_items: string[];
  epp_requeridos: string[];
  orden: number;
  activo: boolean;
}

export interface CreateTipoPermisoTrabajoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  requiere_autorizacion_sst?: boolean;
  requiere_autorizacion_operaciones?: boolean;
  duracion_maxima_horas?: number;
  checklist_items?: string[];
  epp_requeridos?: string[];
  orden?: number;
  activo?: boolean;
}

export type UpdateTipoPermisoTrabajoDTO = Partial<CreateTipoPermisoTrabajoDTO>;

// ==================== PERMISO TRABAJO ====================

export interface PermisoTrabajo {
  id: number;
  empresa_id: number;
  numero_permiso: string;
  tipo_permiso: TipoPermisoTrabajo;
  tipo_permiso_id?: number;
  ubicacion: string;
  descripcion_trabajo: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_horas: string;
  solicitante: UserDetail;
  solicitante_id?: number;
  ejecutor?: UserDetail;
  ejecutor_id?: number;
  supervisor: UserDetail;
  supervisor_id?: number;
  autorizado_sst: boolean;
  autorizado_sst_por?: UserDetail;
  autorizado_sst_fecha?: string;
  autorizado_operaciones: boolean;
  autorizado_operaciones_por?: UserDetail;
  autorizado_operaciones_fecha?: string;
  checklist_verificado: Record<string, boolean>;
  epp_verificado: string[];
  requiere_vigilia: boolean;
  vigilia?: UserDetail;
  vigilia_id?: number;
  estado: EstadoPermisoTrabajo;
  fecha_cierre?: string;
  cerrado_por?: UserDetail;
  observaciones_cierre: string;
  hubo_incidente: boolean;
  descripcion_incidente: string;
  documentos: string[];
  esta_activo?: boolean;
  esta_vencido?: boolean;
  puede_aprobar?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePermisoTrabajoDTO {
  tipo_permiso_id: number;
  ubicacion: string;
  descripcion_trabajo: string;
  fecha_inicio: string;
  fecha_fin: string;
  solicitante_id: number;
  ejecutor_id?: number;
  supervisor_id: number;
  requiere_vigilia?: boolean;
  vigilia_id?: number;
  checklist_verificado?: Record<string, boolean>;
  epp_verificado?: string[];
  documentos?: string[];
}

export interface UpdatePermisoTrabajoDTO extends Partial<CreatePermisoTrabajoDTO> {
  estado?: EstadoPermisoTrabajo;
  observaciones_cierre?: string;
  hubo_incidente?: boolean;
  descripcion_incidente?: string;
}

export interface AprobarPermisoDTO {
  tipo_aprobacion: 'SST' | 'OPERACIONES';
  observaciones?: string;
}

export interface CerrarPermisoDTO {
  hubo_incidente: boolean;
  descripcion_incidente?: string;
  observaciones_cierre?: string;
}

export interface EstadisticasPermisosTrabajo {
  total: number;
  por_estado: Record<EstadoPermisoTrabajo, number>;
  por_tipo: Record<string, number>;
  activos: number;
  vencidos: number;
  con_incidentes: number;
}

// ==================== TIPO INSPECCION ====================

export interface TipoInspeccion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  frecuencia_recomendada: FrecuenciaInspeccion;
  area_responsable: string;
  activo: boolean;
  orden: number;
}

export interface CreateTipoInspeccionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  frecuencia_recomendada?: FrecuenciaInspeccion;
  area_responsable?: string;
  activo?: boolean;
  orden?: number;
}

export type UpdateTipoInspeccionDTO = Partial<CreateTipoInspeccionDTO>;

// ==================== PLANTILLA INSPECCION ====================

export interface ItemPlantillaInspeccion {
  id: number;
  categoria: string;
  descripcion: string;
  es_critico: boolean;
  criterio_cumplimiento: string;
}

export interface PlantillaInspeccion {
  id: number;
  empresa_id: number;
  tipo_inspeccion: TipoInspeccion;
  tipo_inspeccion_id?: number;
  nombre: string;
  descripcion: string;
  items: ItemPlantillaInspeccion[];
  requiere_calificacion_numerica: boolean;
  escala_minima: number;
  escala_maxima: number;
  umbral_critico: number;
  version: number;
  activo: boolean;
}

export interface CreatePlantillaInspeccionDTO {
  tipo_inspeccion_id: number;
  nombre: string;
  descripcion?: string;
  items: ItemPlantillaInspeccion[];
  requiere_calificacion_numerica?: boolean;
  escala_minima?: number;
  escala_maxima?: number;
  umbral_critico?: number;
  activo?: boolean;
}

export type UpdatePlantillaInspeccionDTO = Partial<CreatePlantillaInspeccionDTO>;

// ==================== INSPECCION ====================

export interface ItemInspeccion {
  id: number;
  inspeccion_id?: number;
  item_plantilla_id: number;
  categoria: string;
  descripcion: string;
  es_critico: boolean;
  resultado: ResultadoItemInspeccion;
  calificacion?: number;
  observaciones: string;
  accion_requerida: string;
  foto: string;
  genera_hallazgo: boolean;
  hallazgo_id?: number;
}

export interface Inspeccion {
  id: number;
  empresa_id: number;
  numero_inspeccion: string;
  tipo_inspeccion: TipoInspeccion;
  tipo_inspeccion_id?: number;
  plantilla: PlantillaInspeccion;
  plantilla_id?: number;
  fecha_programada: string;
  fecha_realizada?: string;
  ubicacion: string;
  area: string;
  inspector: UserDetail;
  inspector_id?: number;
  acompanante?: UserDetail;
  acompanante_id?: number;
  estado: EstadoInspeccion;
  porcentaje_cumplimiento?: number;
  calificacion_general?: number;
  resultado_global: ResultadoInspeccionGlobal;
  tiene_hallazgos: boolean;
  numero_hallazgos: number;
  numero_hallazgos_criticos: number;
  observaciones_generales: string;
  recomendaciones: string;
  fotos: string[];
  documentos: string[];
  items_inspeccion?: ItemInspeccion[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateInspeccionDTO {
  tipo_inspeccion_id: number;
  plantilla_id: number;
  fecha_programada: string;
  ubicacion: string;
  area?: string;
  inspector_id: number;
  acompanante_id?: number;
}

export interface UpdateInspeccionDTO extends Partial<CreateInspeccionDTO> {
  estado?: EstadoInspeccion;
  fecha_realizada?: string;
  observaciones_generales?: string;
  recomendaciones?: string;
  fotos?: string[];
  documentos?: string[];
}

export interface CompletarInspeccionDTO {
  items: Omit<ItemInspeccion, 'id' | 'inspeccion_id'>[];
  observaciones_generales?: string;
  recomendaciones?: string;
  fotos?: string[];
  documentos?: string[];
}

export interface GenerarHallazgoDTO {
  item_id: number;
  tipo_hallazgo: string;
  descripcion: string;
  accion_inmediata?: string;
}

export interface EstadisticasInspecciones {
  total: number;
  por_estado: Record<EstadoInspeccion, number>;
  por_resultado: Record<ResultadoInspeccionGlobal, number>;
  programadas: number;
  vencidas: number;
  promedio_cumplimiento: number;
  con_hallazgos_criticos: number;
}

// ==================== TIPO EPP ====================

export interface TipoEPP {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaEPP;
  vida_util_dias?: number;
  normas_aplicables: string;
  requiere_talla: boolean;
  tallas_disponibles: string[];
  es_desechable: boolean;
  requiere_capacitacion: boolean;
  activo: boolean;
  orden: number;
}

export interface CreateTipoEPPDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaEPP;
  vida_util_dias?: number;
  normas_aplicables?: string;
  requiere_talla?: boolean;
  tallas_disponibles?: string[];
  es_desechable?: boolean;
  requiere_capacitacion?: boolean;
  activo?: boolean;
  orden?: number;
}

export type UpdateTipoEPPDTO = Partial<CreateTipoEPPDTO>;

export interface TiposEPPPorCategoria {
  categoria: CategoriaEPP;
  categoria_display: string;
  tipos: TipoEPP[];
}

// ==================== ENTREGA EPP ====================

export interface EntregaEPP {
  id: number;
  empresa_id: number;
  numero_entrega: string;
  colaborador: UserDetail;
  colaborador_id?: number;
  tipo_epp: TipoEPP;
  tipo_epp_id?: number;
  marca: string;
  modelo: string;
  talla: string;
  serial: string;
  cantidad: number;
  fecha_entrega: string;
  fecha_reposicion_programada?: string;
  entregado_por: UserDetail;
  entregado_por_id?: number;
  capacitacion_realizada: boolean;
  fecha_capacitacion?: string;
  estado: EstadoEntregaEPP;
  fecha_devolucion?: string;
  motivo_devolucion: string;
  observaciones: string;
  firma_colaborador: string;
  foto_entrega: string;
  documentos: string[];
  requiere_reposicion?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEntregaEPPDTO {
  colaborador_id: number;
  tipo_epp_id: number;
  marca?: string;
  modelo?: string;
  talla?: string;
  serial?: string;
  cantidad?: number;
  fecha_entrega: string;
  entregado_por_id: number;
  capacitacion_realizada?: boolean;
  fecha_capacitacion?: string;
  observaciones?: string;
  firma_colaborador?: string;
  foto_entrega?: string;
  documentos?: string[];
}

export interface UpdateEntregaEPPDTO extends Partial<CreateEntregaEPPDTO> {
  estado?: EstadoEntregaEPP;
  fecha_devolucion?: string;
  motivo_devolucion?: string;
}

export interface DevolverEPPDTO {
  fecha_devolucion: string;
  motivo_devolucion: string;
  estado: 'DEVUELTO' | 'EXTRAVIADO' | 'DANADO';
}

// ==================== PROGRAMA SEGURIDAD ====================

export interface ActividadPrograma {
  id: number;
  nombre: string;
  descripcion: string;
  responsable_id: number;
  responsable?: UserDetail;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
  porcentaje_avance: number;
}

export interface IndicadorPrograma {
  nombre: string;
  meta: number;
  unidad: string;
  frecuencia: string;
  valor_actual?: number;
}

export interface ProgramaSeguridad {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoProgramaSeguridad;
  alcance: string;
  responsable: UserDetail;
  responsable_id?: number;
  equipo_apoyo: UserDetail[];
  equipo_apoyo_ids?: number[];
  fecha_inicio: string;
  fecha_fin: string;
  objetivos: string[];
  indicadores: IndicadorPrograma[];
  actividades: ActividadPrograma[];
  presupuesto_asignado?: number;
  presupuesto_ejecutado: number;
  recursos_requeridos: string;
  estado: EstadoProgramaSeguridad;
  porcentaje_avance: number;
  fecha_ultima_revision?: string;
  resultado_ultima_revision: string;
  documentos: string[];
  normativa_aplicable: string;
  activo: boolean;
  esta_vigente?: boolean;
  dias_restantes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProgramaSeguridadDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoProgramaSeguridad;
  alcance: string;
  responsable_id: number;
  equipo_apoyo_ids?: number[];
  fecha_inicio: string;
  fecha_fin: string;
  objetivos?: string[];
  indicadores?: IndicadorPrograma[];
  actividades?: ActividadPrograma[];
  presupuesto_asignado?: number;
  recursos_requeridos?: string;
  documentos?: string[];
  normativa_aplicable?: string;
  activo?: boolean;
}

export interface UpdateProgramaSeguridadDTO extends Partial<CreateProgramaSeguridadDTO> {
  estado?: EstadoProgramaSeguridad;
  porcentaje_avance?: number;
  presupuesto_ejecutado?: number;
  fecha_ultima_revision?: string;
  resultado_ultima_revision?: string;
}

export interface ActualizarAvanceProgramaDTO {
  porcentaje_avance: number;
  comentarios?: string;
}

export interface EstadisticasProgramasSeguridad {
  total: number;
  por_estado: Record<EstadoProgramaSeguridad, number>;
  por_tipo: Record<TipoProgramaSeguridad, number>;
  vigentes: number;
  promedio_avance: number;
  con_retraso: number;
}

// ==================== RESPUESTAS PAGINADAS ====================

// PaginatedResponse: importar desde '@/types'
