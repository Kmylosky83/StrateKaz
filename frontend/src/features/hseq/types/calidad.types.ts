/**
 * Tipos TypeScript para Módulo de Calidad - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye:
 * - No Conformidades
 * - Acciones Correctivas/Preventivas/Mejora
 * - Salidas No Conformes (Productos/Servicios)
 * - Solicitudes de Cambio
 * - Control de Cambios
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

// No Conformidad
export type TipoNoConformidad = 'REAL' | 'POTENCIAL' | 'OBSERVACION';

export type OrigenNoConformidad =
  | 'AUDITORIA_INTERNA'
  | 'AUDITORIA_EXTERNA'
  | 'AUDITORIA_CLIENTE'
  | 'INSPECCION'
  | 'QUEJA_CLIENTE'
  | 'QUEJA_PROVEEDOR'
  | 'PROCESO_INTERNO'
  | 'PRODUCTO_NO_CONFORME'
  | 'REVISION_DIRECCION'
  | 'MEJORA_CONTINUA';

export type EstadoNoConformidad = 'ABIERTA' | 'EN_ANALISIS' | 'EN_TRATAMIENTO' | 'VERIFICACION' | 'CERRADA' | 'CANCELADA';

export type SeveridadNoConformidad = 'CRITICA' | 'MAYOR' | 'MENOR' | 'OBSERVACION';

export type MetodoAnalisis = '5_PORQUES' | 'ISHIKAWA' | 'PARETO' | 'OTRO';

// Acción Correctiva
export type TipoAccion = 'CORRECTIVA' | 'PREVENTIVA' | 'MEJORA' | 'CONTENCION';

export type EstadoAccion = 'PLANIFICADA' | 'EN_EJECUCION' | 'EJECUTADA' | 'VERIFICADA' | 'CERRADA' | 'CANCELADA';

// Salida No Conforme
export type TipoSalidaNoConforme = 'PRODUCTO' | 'SERVICIO' | 'MATERIA_PRIMA' | 'PROCESO';

export type EstadoSalidaNoConforme =
  | 'DETECTADA'
  | 'EN_EVALUACION'
  | 'DISPOSICION_DEFINIDA'
  | 'EN_TRATAMIENTO'
  | 'RESUELTA'
  | 'CERRADA';

export type DisposicionSalidaNoConforme =
  | 'REPROCESO'
  | 'REPARACION'
  | 'ACEPTACION_CONCESION'
  | 'RECLASIFICACION'
  | 'RECHAZO'
  | 'DESECHO'
  | 'CUARENTENA';

export type NivelRiesgoUso = 'ALTO' | 'MEDIO' | 'BAJO';

// Solicitud de Cambio
export type TipoSolicitudCambio =
  | 'PROCESO'
  | 'PROCEDIMIENTO'
  | 'DOCUMENTO'
  | 'PRODUCTO'
  | 'INFRAESTRUCTURA'
  | 'EQUIPAMIENTO'
  | 'SISTEMA'
  | 'ORGANIZACIONAL';

export type EstadoSolicitudCambio =
  | 'SOLICITADA'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'EN_IMPLEMENTACION'
  | 'IMPLEMENTADA'
  | 'CANCELADA';

export type PrioridadCambio = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';

// ==================== NO CONFORMIDAD ====================

/**
 * No Conformidades detectadas en el sistema de gestión
 * Origen: auditorías, inspecciones, quejas de clientes, procesos internos
 */
export interface NoConformidad {
  id: number;
  empresa_id: number;
  codigo: string;
  tipo: TipoNoConformidad;
  origen: OrigenNoConformidad;
  severidad: SeveridadNoConformidad;
  titulo: string;
  descripcion: string;
  fecha_deteccion: string;
  ubicacion: string;
  proceso_relacionado: string;
  requisito_incumplido: string;
  analisis_causa_raiz: string;
  metodo_analisis: MetodoAnalisis | '';
  detectado_por: number;
  detectado_por_detail?: UserDetail;
  responsable_analisis: number | null;
  responsable_analisis_detail?: UserDetail;
  responsable_cierre: number | null;
  responsable_cierre_detail?: UserDetail;
  estado: EstadoNoConformidad;
  fecha_analisis: string | null;
  fecha_verificacion: string | null;
  fecha_cierre: string | null;
  verificacion_eficaz: boolean | null;
  comentarios_verificacion: string;
  evidencia_deteccion: string | null;
  evidencia_cierre: string | null;
  observaciones: string;
  acciones_correctivas?: AccionCorrectiva[];
  salidas_no_conformes?: SalidaNoConforme[];
  created_at: string;
  updated_at: string;
}

/**
 * Vista de lista simplificada para NoConformidad
 */
export interface NoConformidadList {
  id: number;
  codigo: string;
  tipo: TipoNoConformidad;
  origen: OrigenNoConformidad;
  severidad: SeveridadNoConformidad;
  titulo: string;
  fecha_deteccion: string;
  estado: EstadoNoConformidad;
  detectado_por_detail?: UserDetail;
  dias_abierta?: number;
}

// ==================== ACCIÓN CORRECTIVA ====================

/**
 * Acciones Correctivas, Preventivas o de Mejora
 * Vinculadas a No Conformidades
 */
export interface AccionCorrectiva {
  id: number;
  empresa_id: number;
  codigo: string;
  tipo: TipoAccion;
  no_conformidad: number;
  no_conformidad_detail?: Partial<NoConformidad>;
  descripcion: string;
  objetivo: string;
  fecha_planificada: string;
  fecha_limite: string;
  recursos_necesarios: string;
  responsable: number;
  responsable_detail?: UserDetail;
  verificador: number | null;
  verificador_detail?: UserDetail;
  estado: EstadoAccion;
  fecha_ejecucion: string | null;
  evidencia_ejecucion: string | null;
  comentarios_ejecucion: string;
  fecha_verificacion: string | null;
  eficaz: boolean | null;
  metodo_verificacion: string;
  resultados_verificacion: string;
  evidencia_verificacion: string | null;
  costo_estimado: string | null;
  costo_real: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Vista de lista simplificada para AccionCorrectiva
 */
export interface AccionCorrectivaList {
  id: number;
  codigo: string;
  tipo: TipoAccion;
  descripcion: string;
  fecha_limite: string;
  responsable_detail?: UserDetail;
  estado: EstadoAccion;
  esta_vencida?: boolean;
}

// ==================== SALIDA NO CONFORME ====================

/**
 * Productos o Servicios No Conformes
 * Control de salidas que no cumplen requisitos
 */
export interface SalidaNoConforme {
  id: number;
  empresa_id: number;
  codigo: string;
  tipo: TipoSalidaNoConforme;
  descripcion_producto: string;
  descripcion_no_conformidad: string;
  fecha_deteccion: string;
  lote_numero: string;
  cantidad_afectada: string;
  unidad_medida: string;
  ubicacion_actual: string;
  bloqueada: boolean;
  requisito_incumplido: string;
  impacto_cliente: string;
  riesgo_uso: NivelRiesgoUso;
  detectado_por: number;
  detectado_por_detail?: UserDetail;
  responsable_evaluacion: number | null;
  responsable_evaluacion_detail?: UserDetail;
  responsable_disposicion: number | null;
  responsable_disposicion_detail?: UserDetail;
  disposicion: DisposicionSalidaNoConforme | '';
  justificacion_disposicion: string;
  fecha_disposicion: string | null;
  acciones_tomadas: string;
  fecha_resolucion: string | null;
  costo_estimado: string | null;
  estado: EstadoSalidaNoConforme;
  no_conformidad: number | null;
  no_conformidad_detail?: Partial<NoConformidad>;
  evidencia_deteccion: string | null;
  evidencia_tratamiento: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vista de lista simplificada para SalidaNoConforme
 */
export interface SalidaNoConformeList {
  id: number;
  codigo: string;
  tipo: TipoSalidaNoConforme;
  descripcion_producto: string;
  fecha_deteccion: string;
  cantidad_afectada: string;
  unidad_medida: string;
  bloqueada: boolean;
  estado: EstadoSalidaNoConforme;
  disposicion: DisposicionSalidaNoConforme | '';
}

// ==================== SOLICITUD DE CAMBIO ====================

/**
 * Solicitudes de Cambio en el Sistema de Gestión
 * Control de cambios planificados
 */
export interface SolicitudCambio {
  id: number;
  empresa_id: number;
  codigo: string;
  tipo: TipoSolicitudCambio;
  prioridad: PrioridadCambio;
  titulo: string;
  descripcion_actual: string;
  descripcion_cambio: string;
  justificacion: string;
  solicitante: number;
  solicitante_detail?: UserDetail;
  fecha_solicitud: string;
  impacto_calidad: string;
  impacto_procesos: string;
  impacto_clientes: string;
  impacto_cumplimiento: string;
  impacto_recursos: string;
  riesgos_identificados: string;
  medidas_mitigacion: string;
  revisado_por: number | null;
  revisado_por_detail?: UserDetail;
  fecha_revision: string | null;
  comentarios_revision: string;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  fecha_aprobacion: string | null;
  comentarios_aprobacion: string;
  responsable_implementacion: number | null;
  responsable_implementacion_detail?: UserDetail;
  fecha_implementacion_planificada: string | null;
  fecha_implementacion_real: string | null;
  estado: EstadoSolicitudCambio;
  costo_estimado: string | null;
  documento_soporte: string | null;
  control?: ControlCambio;
  created_at: string;
  updated_at: string;
}

/**
 * Vista de lista simplificada para SolicitudCambio
 */
export interface SolicitudCambioList {
  id: number;
  codigo: string;
  tipo: TipoSolicitudCambio;
  titulo: string;
  prioridad: PrioridadCambio;
  fecha_solicitud: string;
  solicitante_detail?: UserDetail;
  estado: EstadoSolicitudCambio;
}

// ==================== CONTROL DE CAMBIO ====================

/**
 * Registro de Cambios Implementados
 * Trazabilidad de cambios en el sistema de gestión
 */
export interface ControlCambio {
  id: number;
  empresa_id: number;
  solicitud_cambio: number;
  solicitud_cambio_detail?: Partial<SolicitudCambio>;
  fecha_inicio_implementacion: string;
  fecha_fin_implementacion: string;
  acciones_realizadas: string;
  personal_comunicado: string;
  fecha_comunicacion: string;
  metodo_comunicacion: string;
  capacitacion_realizada: boolean;
  descripcion_capacitacion: string;
  personal_capacitado: string;
  documentos_actualizados: string;
  nueva_version: string;
  verificacion_realizada: boolean;
  fecha_verificacion: string | null;
  resultados_verificacion: string;
  eficaz: boolean | null;
  seguimiento_planificado: boolean;
  proxima_revision: string | null;
  costo_real: string | null;
  evidencia_implementacion: string | null;
  registro_capacitacion: string | null;
  lecciones_aprendidas: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vista de lista simplificada para ControlCambio
 */
export interface ControlCambioList {
  id: number;
  solicitud_cambio_detail?: Partial<SolicitudCambio>;
  fecha_inicio_implementacion: string;
  fecha_fin_implementacion: string;
  verificacion_realizada: boolean;
  eficaz: boolean | null;
}

// ==================== DTOs - CREATE ====================

export interface CreateNoConformidadDTO {
  tipo: TipoNoConformidad;
  origen: OrigenNoConformidad;
  severidad: SeveridadNoConformidad;
  titulo: string;
  descripcion: string;
  fecha_deteccion: string;
  ubicacion?: string;
  proceso_relacionado?: string;
  requisito_incumplido?: string;
  detectado_por: number;
  responsable_analisis?: number;
  observaciones?: string;
}

export interface CreateAccionCorrectivaDTO {
  tipo: TipoAccion;
  no_conformidad: number;
  descripcion: string;
  objetivo?: string;
  fecha_planificada: string;
  fecha_limite: string;
  recursos_necesarios?: string;
  responsable: number;
  verificador?: number;
  costo_estimado?: number;
}

export interface CreateSalidaNoConformeDTO {
  tipo: TipoSalidaNoConforme;
  descripcion_producto: string;
  descripcion_no_conformidad: string;
  fecha_deteccion: string;
  lote_numero?: string;
  cantidad_afectada: number;
  unidad_medida: string;
  ubicacion_actual: string;
  requisito_incumplido: string;
  impacto_cliente?: string;
  riesgo_uso?: NivelRiesgoUso;
  detectado_por: number;
  bloqueada?: boolean;
}

export interface CreateSolicitudCambioDTO {
  tipo: TipoSolicitudCambio;
  prioridad: PrioridadCambio;
  titulo: string;
  descripcion_actual: string;
  descripcion_cambio: string;
  justificacion: string;
  solicitante: number;
  impacto_calidad?: string;
  impacto_procesos?: string;
  impacto_clientes?: string;
  impacto_cumplimiento?: string;
  impacto_recursos?: string;
  riesgos_identificados?: string;
  medidas_mitigacion?: string;
  costo_estimado?: number;
}

export interface CreateControlCambioDTO {
  solicitud_cambio: number;
  fecha_inicio_implementacion: string;
  fecha_fin_implementacion: string;
  acciones_realizadas: string;
  personal_comunicado: string;
  fecha_comunicacion: string;
  metodo_comunicacion: string;
  documentos_actualizados: string;
  capacitacion_realizada?: boolean;
  descripcion_capacitacion?: string;
  personal_capacitado?: string;
  nueva_version?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateNoConformidadDTO {
  tipo?: TipoNoConformidad;
  origen?: OrigenNoConformidad;
  severidad?: SeveridadNoConformidad;
  titulo?: string;
  descripcion?: string;
  fecha_deteccion?: string;
  ubicacion?: string;
  proceso_relacionado?: string;
  requisito_incumplido?: string;
  analisis_causa_raiz?: string;
  metodo_analisis?: MetodoAnalisis;
  responsable_analisis?: number;
  responsable_cierre?: number;
  estado?: EstadoNoConformidad;
  fecha_analisis?: string;
  fecha_verificacion?: string;
  fecha_cierre?: string;
  verificacion_eficaz?: boolean;
  comentarios_verificacion?: string;
  evidencia_deteccion?: string;
  evidencia_cierre?: string;
  observaciones?: string;
}

export interface UpdateAccionCorrectivaDTO {
  tipo?: TipoAccion;
  descripcion?: string;
  objetivo?: string;
  fecha_planificada?: string;
  fecha_limite?: string;
  recursos_necesarios?: string;
  responsable?: number;
  verificador?: number;
  estado?: EstadoAccion;
  fecha_ejecucion?: string;
  evidencia_ejecucion?: string;
  comentarios_ejecucion?: string;
  fecha_verificacion?: string;
  eficaz?: boolean;
  metodo_verificacion?: string;
  resultados_verificacion?: string;
  evidencia_verificacion?: string;
  costo_estimado?: number;
  costo_real?: number;
}

export interface UpdateSalidaNoConformeDTO {
  tipo?: TipoSalidaNoConforme;
  descripcion_producto?: string;
  descripcion_no_conformidad?: string;
  fecha_deteccion?: string;
  lote_numero?: string;
  cantidad_afectada?: number;
  unidad_medida?: string;
  ubicacion_actual?: string;
  bloqueada?: boolean;
  requisito_incumplido?: string;
  impacto_cliente?: string;
  riesgo_uso?: NivelRiesgoUso;
  responsable_evaluacion?: number;
  responsable_disposicion?: number;
  disposicion?: DisposicionSalidaNoConforme;
  justificacion_disposicion?: string;
  fecha_disposicion?: string;
  acciones_tomadas?: string;
  fecha_resolucion?: string;
  costo_estimado?: number;
  estado?: EstadoSalidaNoConforme;
  no_conformidad?: number;
  evidencia_deteccion?: string;
  evidencia_tratamiento?: string;
  observaciones?: string;
}

export interface UpdateSolicitudCambioDTO {
  tipo?: TipoSolicitudCambio;
  prioridad?: PrioridadCambio;
  titulo?: string;
  descripcion_actual?: string;
  descripcion_cambio?: string;
  justificacion?: string;
  impacto_calidad?: string;
  impacto_procesos?: string;
  impacto_clientes?: string;
  impacto_cumplimiento?: string;
  impacto_recursos?: string;
  riesgos_identificados?: string;
  medidas_mitigacion?: string;
  revisado_por?: number;
  fecha_revision?: string;
  comentarios_revision?: string;
  aprobado_por?: number;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
  responsable_implementacion?: number;
  fecha_implementacion_planificada?: string;
  fecha_implementacion_real?: string;
  estado?: EstadoSolicitudCambio;
  costo_estimado?: number;
  documento_soporte?: string;
}

export interface UpdateControlCambioDTO {
  fecha_inicio_implementacion?: string;
  fecha_fin_implementacion?: string;
  acciones_realizadas?: string;
  personal_comunicado?: string;
  fecha_comunicacion?: string;
  metodo_comunicacion?: string;
  capacitacion_realizada?: boolean;
  descripcion_capacitacion?: string;
  personal_capacitado?: string;
  documentos_actualizados?: string;
  nueva_version?: string;
  verificacion_realizada?: boolean;
  fecha_verificacion?: string;
  resultados_verificacion?: string;
  eficaz?: boolean;
  seguimiento_planificado?: boolean;
  proxima_revision?: string;
  costo_real?: number;
  evidencia_implementacion?: string;
  registro_capacitacion?: string;
  lecciones_aprendidas?: string;
  observaciones?: string;
}

// ==================== DTOs - FILTERS ====================

export interface NoConformidadFilters {
  tipo?: TipoNoConformidad;
  origen?: OrigenNoConformidad;
  severidad?: SeveridadNoConformidad;
  estado?: EstadoNoConformidad;
  detectado_por?: number;
  responsable_analisis?: number;
  responsable_cierre?: number;
  fecha_deteccion_desde?: string;
  fecha_deteccion_hasta?: string;
  proceso_relacionado?: string;
  search?: string;
}

export interface AccionCorrectivaFilters {
  tipo?: TipoAccion;
  estado?: EstadoAccion;
  no_conformidad?: number;
  responsable?: number;
  verificador?: number;
  fecha_limite_desde?: string;
  fecha_limite_hasta?: string;
  vencidas?: boolean;
  search?: string;
}

export interface SalidaNoConformeFilters {
  tipo?: TipoSalidaNoConforme;
  estado?: EstadoSalidaNoConforme;
  disposicion?: DisposicionSalidaNoConforme;
  riesgo_uso?: NivelRiesgoUso;
  bloqueada?: boolean;
  detectado_por?: number;
  fecha_deteccion_desde?: string;
  fecha_deteccion_hasta?: string;
  lote_numero?: string;
  search?: string;
}

export interface SolicitudCambioFilters {
  tipo?: TipoSolicitudCambio;
  estado?: EstadoSolicitudCambio;
  prioridad?: PrioridadCambio;
  solicitante?: number;
  aprobado_por?: number;
  responsable_implementacion?: number;
  fecha_solicitud_desde?: string;
  fecha_solicitud_hasta?: string;
  search?: string;
}

export interface ControlCambioFilters {
  solicitud_cambio?: number;
  verificacion_realizada?: boolean;
  eficaz?: boolean;
  fecha_implementacion_desde?: string;
  fecha_implementacion_hasta?: string;
  capacitacion_realizada?: boolean;
  seguimiento_planificado?: boolean;
}

// ==================== ACCIONES ESPECIALES ====================

/**
 * DTO para cerrar una No Conformidad
 */
export interface CerrarNoConformidadDTO {
  fecha_cierre: string;
  verificacion_eficaz: boolean;
  comentarios_verificacion?: string;
  evidencia_cierre?: string;
  responsable_cierre: number;
}

/**
 * DTO para completar análisis de causa raíz
 */
export interface CompletarAnalisisDTO {
  analisis_causa_raiz: string;
  metodo_analisis: MetodoAnalisis;
  fecha_analisis: string;
}

/**
 * DTO para ejecutar una acción correctiva
 */
export interface EjecutarAccionDTO {
  fecha_ejecucion: string;
  comentarios_ejecucion: string;
  evidencia_ejecucion?: string;
}

/**
 * DTO para verificar eficacia de una acción
 */
export interface VerificarEficaciaDTO {
  fecha_verificacion: string;
  eficaz: boolean;
  metodo_verificacion: string;
  resultados_verificacion: string;
  evidencia_verificacion?: string;
  costo_real?: number;
}

/**
 * DTO para definir disposición de salida no conforme
 */
export interface DefinirDisposicionDTO {
  disposicion: DisposicionSalidaNoConforme;
  justificacion_disposicion: string;
  fecha_disposicion: string;
  responsable_disposicion: number;
}

/**
 * DTO para liberar salida no conforme
 */
export interface LiberarSalidaDTO {
  acciones_tomadas: string;
  fecha_resolucion: string;
  evidencia_tratamiento?: string;
}

/**
 * DTO para aprobar solicitud de cambio
 */
export interface AprobarCambioDTO {
  aprobado_por: number;
  fecha_aprobacion: string;
  comentarios_aprobacion?: string;
  responsable_implementacion?: number;
  fecha_implementacion_planificada?: string;
}

/**
 * DTO para rechazar solicitud de cambio
 */
export interface RechazarCambioDTO {
  revisado_por: number;
  fecha_revision: string;
  comentarios_revision: string;
}

/**
 * DTO para verificar cambio implementado
 */
export interface VerificarCambioDTO {
  verificacion_realizada: boolean;
  fecha_verificacion: string;
  resultados_verificacion: string;
  eficaz: boolean;
  seguimiento_planificado?: boolean;
  proxima_revision?: string;
  lecciones_aprendidas?: string;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Estadísticas del módulo de Calidad
 */
export interface EstadisticasCalidad {
  total_no_conformidades: number;
  nc_por_estado: Record<EstadoNoConformidad, number>;
  nc_por_severidad: Record<SeveridadNoConformidad, number>;
  nc_por_origen: Record<OrigenNoConformidad, number>;
  total_acciones_correctivas: number;
  acciones_por_estado: Record<EstadoAccion, number>;
  acciones_vencidas: number;
  total_salidas_nc: number;
  salidas_bloqueadas: number;
  salidas_por_disposicion: Record<DisposicionSalidaNoConforme, number>;
  total_solicitudes_cambio: number;
  cambios_por_estado: Record<EstadoSolicitudCambio, number>;
  cambios_pendientes_aprobacion: number;
  tiempo_promedio_cierre_nc: number;
  eficacia_acciones: number;
}

/**
 * Dashboard de indicadores de calidad
 */
export interface DashboardCalidad {
  periodo: string;
  no_conformidades_mes: number;
  acciones_correctivas_abiertas: number;
  salidas_nc_bloqueadas: number;
  cambios_pendientes: number;
  eficacia_acciones_porcentaje: number;
  tiempo_promedio_cierre_dias: number;
  tendencias: {
    nc_por_mes: Array<{ mes: string; cantidad: number }>;
    acciones_por_tipo: Array<{ tipo: string; cantidad: number }>;
  };
}

// ==================== OPCIONES PARA SELECTORES ====================

/**
 * Arrays de opciones para formularios y filtros
 */

export const TIPO_NO_CONFORMIDAD_OPCIONES: Array<{ value: TipoNoConformidad; label: string }> = [
  { value: 'REAL', label: 'No Conformidad Real' },
  { value: 'POTENCIAL', label: 'No Conformidad Potencial' },
  { value: 'OBSERVACION', label: 'Observación' },
];

export const ORIGEN_NO_CONFORMIDAD_OPCIONES: Array<{ value: OrigenNoConformidad; label: string }> = [
  { value: 'AUDITORIA_INTERNA', label: 'Auditoría Interna' },
  { value: 'AUDITORIA_EXTERNA', label: 'Auditoría Externa' },
  { value: 'AUDITORIA_CLIENTE', label: 'Auditoría de Cliente' },
  { value: 'INSPECCION', label: 'Inspección' },
  { value: 'QUEJA_CLIENTE', label: 'Queja de Cliente' },
  { value: 'QUEJA_PROVEEDOR', label: 'Queja de Proveedor' },
  { value: 'PROCESO_INTERNO', label: 'Proceso Interno' },
  { value: 'PRODUCTO_NO_CONFORME', label: 'Producto No Conforme' },
  { value: 'REVISION_DIRECCION', label: 'Revisión por la Dirección' },
  { value: 'MEJORA_CONTINUA', label: 'Iniciativa de Mejora Continua' },
];

export const ESTADO_NO_CONFORMIDAD_OPCIONES: Array<{ value: EstadoNoConformidad; label: string }> = [
  { value: 'ABIERTA', label: 'Abierta' },
  { value: 'EN_ANALISIS', label: 'En Análisis de Causa' },
  { value: 'EN_TRATAMIENTO', label: 'En Tratamiento' },
  { value: 'VERIFICACION', label: 'En Verificación' },
  { value: 'CERRADA', label: 'Cerrada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const SEVERIDAD_NO_CONFORMIDAD_OPCIONES: Array<{ value: SeveridadNoConformidad; label: string }> = [
  { value: 'CRITICA', label: 'Crítica' },
  { value: 'MAYOR', label: 'Mayor' },
  { value: 'MENOR', label: 'Menor' },
  { value: 'OBSERVACION', label: 'Observación' },
];

export const METODO_ANALISIS_OPCIONES: Array<{ value: MetodoAnalisis; label: string }> = [
  { value: '5_PORQUES', label: '5 Por qués' },
  { value: 'ISHIKAWA', label: 'Diagrama Ishikawa' },
  { value: 'PARETO', label: 'Análisis de Pareto' },
  { value: 'OTRO', label: 'Otro método' },
];

export const TIPO_ACCION_OPCIONES: Array<{ value: TipoAccion; label: string }> = [
  { value: 'CORRECTIVA', label: 'Acción Correctiva' },
  { value: 'PREVENTIVA', label: 'Acción Preventiva' },
  { value: 'MEJORA', label: 'Acción de Mejora' },
  { value: 'CONTENCION', label: 'Acción de Contención' },
];

export const ESTADO_ACCION_OPCIONES: Array<{ value: EstadoAccion; label: string }> = [
  { value: 'PLANIFICADA', label: 'Planificada' },
  { value: 'EN_EJECUCION', label: 'En Ejecución' },
  { value: 'EJECUTADA', label: 'Ejecutada' },
  { value: 'VERIFICADA', label: 'Verificada' },
  { value: 'CERRADA', label: 'Cerrada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const TIPO_SALIDA_NO_CONFORME_OPCIONES: Array<{ value: TipoSalidaNoConforme; label: string }> = [
  { value: 'PRODUCTO', label: 'Producto' },
  { value: 'SERVICIO', label: 'Servicio' },
  { value: 'MATERIA_PRIMA', label: 'Materia Prima' },
  { value: 'PROCESO', label: 'Proceso' },
];

export const ESTADO_SALIDA_NO_CONFORME_OPCIONES: Array<{ value: EstadoSalidaNoConforme; label: string }> = [
  { value: 'DETECTADA', label: 'Detectada' },
  { value: 'EN_EVALUACION', label: 'En Evaluación' },
  { value: 'DISPOSICION_DEFINIDA', label: 'Disposición Definida' },
  { value: 'EN_TRATAMIENTO', label: 'En Tratamiento' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'CERRADA', label: 'Cerrada' },
];

export const DISPOSICION_SALIDA_NO_CONFORME_OPCIONES: Array<{ value: DisposicionSalidaNoConforme; label: string }> = [
  { value: 'REPROCESO', label: 'Reproceso' },
  { value: 'REPARACION', label: 'Reparación' },
  { value: 'ACEPTACION_CONCESION', label: 'Aceptación con Concesión' },
  { value: 'RECLASIFICACION', label: 'Reclasificación' },
  { value: 'RECHAZO', label: 'Rechazo/Devolución' },
  { value: 'DESECHO', label: 'Desecho/Destrucción' },
  { value: 'CUARENTENA', label: 'Cuarentena' },
];

export const NIVEL_RIESGO_USO_OPCIONES: Array<{ value: NivelRiesgoUso; label: string }> = [
  { value: 'ALTO', label: 'Alto' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'BAJO', label: 'Bajo' },
];

export const TIPO_SOLICITUD_CAMBIO_OPCIONES: Array<{ value: TipoSolicitudCambio; label: string }> = [
  { value: 'PROCESO', label: 'Proceso' },
  { value: 'PROCEDIMIENTO', label: 'Procedimiento' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'PRODUCTO', label: 'Producto/Servicio' },
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'EQUIPAMIENTO', label: 'Equipamiento' },
  { value: 'SISTEMA', label: 'Sistema de Gestión' },
  { value: 'ORGANIZACIONAL', label: 'Cambio Organizacional' },
];

export const ESTADO_SOLICITUD_CAMBIO_OPCIONES: Array<{ value: EstadoSolicitudCambio; label: string }> = [
  { value: 'SOLICITADA', label: 'Solicitada' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'EN_IMPLEMENTACION', label: 'En Implementación' },
  { value: 'IMPLEMENTADA', label: 'Implementada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const PRIORIDAD_CAMBIO_OPCIONES: Array<{ value: PrioridadCambio; label: string }> = [
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];
