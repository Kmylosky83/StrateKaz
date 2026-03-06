/**
 * Types para Off-Boarding - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Sincronizado con backend: apps/talent_hub/off_boarding/
 * - models.py (choices, campos)
 * - serializers.py (List/Detail/Create fields, read_only)
 * - views.py (@action url_path, HTTP methods)
 */

// ============== ENUMS (exactos de models.py) ==============

export type TipoRetiroCode =
  | 'voluntario'
  | 'despido_justa_causa'
  | 'despido_sin_justa_causa'
  | 'mutuo_acuerdo'
  | 'terminacion_contrato'
  | 'jubilacion'
  | 'fallecimiento'
  | 'abandono_trabajo';

export type EstadoProceso =
  | 'iniciado'
  | 'checklist_pendiente'
  | 'paz_salvo_pendiente'
  | 'examen_pendiente'
  | 'entrevista_pendiente'
  | 'liquidacion_pendiente'
  | 'completado'
  | 'cancelado';

export type EstadoItem = 'pendiente' | 'en_proceso' | 'completado' | 'no_aplica';

export type TipoItem =
  | 'entrega_activo'
  | 'entrega_documento'
  | 'devolucion_epp'
  | 'cierre_sistema'
  | 'entrega_cargo'
  | 'otro';

export type EstadoPazSalvo = 'pendiente' | 'aprobado' | 'rechazado';

export type AreaPazSalvo =
  | 'talento_humano'
  | 'sistemas'
  | 'almacen'
  | 'administracion'
  | 'produccion'
  | 'hseq'
  | 'contabilidad'
  | 'jefe_inmediato';

export type ResultadoExamen = 'apto' | 'apto_con_recomendaciones' | 'no_apto';

export type MotivoRetiro =
  | 'mejor_oportunidad'
  | 'cambio_residencia'
  | 'estudios'
  | 'salud'
  | 'clima_laboral'
  | 'remuneracion'
  | 'crecimiento_profesional'
  | 'equilibrio_vida'
  | 'personal'
  | 'bajo_desempeno'
  | 'incumplimiento'
  | 'reestructuracion'
  | 'otro';

export type ModalidadEntrevista = 'presencial' | 'virtual' | 'telefonica';

export type MetodoPago = 'transferencia' | 'cheque' | 'efectivo';

export type TipoCertificado = 'laboral' | 'ingresos' | 'cargo';

export type EstadoCertificado = 'pendiente' | 'generado' | 'entregado';

// ============== TIPO RETIRO ==============
// ListSerializer fields
export interface TipoRetiro {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoRetiroCode;
  tipo_display?: string;
  requiere_indemnizacion: boolean;
  requiere_preaviso: boolean;
  dias_preaviso: number;
  requiere_autorizacion: boolean;
  requiere_entrevista_salida: boolean;
  es_voluntario?: boolean;
  es_despido?: boolean;
  orden: number;
  // DetailSerializer adds:
  descripcion?: string;
  formula_indemnizacion?: string;
  is_active?: boolean;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
}

// CreateSerializer fields
export interface TipoRetiroFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoRetiroCode;
  requiere_indemnizacion?: boolean;
  formula_indemnizacion?: string;
  requiere_preaviso?: boolean;
  dias_preaviso?: number;
  requiere_autorizacion?: boolean;
  requiere_entrevista_salida?: boolean;
  orden?: number;
}

// ============== PROCESO RETIRO ==============
// ListSerializer fields
export interface ProcesoRetiro {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  colaborador_identificacion?: string;
  tipo_retiro: number;
  tipo_retiro_nombre?: string;
  nombre_proceso?: string;
  fecha_notificacion: string;
  fecha_ultimo_dia_trabajo: string;
  fecha_retiro_efectivo?: string | null;
  motivo_retiro: MotivoRetiro;
  motivo_retiro_display?: string;
  estado: EstadoProceso;
  estado_display?: string;
  progreso_porcentaje?: number;
  esta_completado?: boolean;
  created_at?: string;
  // DetailSerializer adds:
  motivo_detallado?: string;
  justa_causa_detalle?: string;
  responsable_proceso?: number | null;
  responsable_nombre?: string;
  autorizado_por?: number | null;
  autorizado_por_nombre?: string;
  fecha_autorizacion?: string | null;
  cerrado_por?: number | null;
  cerrado_por_nombre?: string;
  fecha_cierre?: string | null;
  observaciones?: string;
  checklist_completado?: boolean;
  paz_salvo_completo?: boolean;
  examen_egreso_realizado?: boolean;
  entrevista_realizada?: boolean;
  liquidacion_aprobada?: boolean;
  requiere_autorizacion?: boolean;
  dias_preaviso_requeridos?: number;
  dias_preaviso_cumplidos?: number;
  cumple_preaviso?: boolean;
  items_checklist_total?: number;
  items_checklist_completados?: number;
  paz_salvos_total?: number;
  paz_salvos_aprobados?: number;
  empresa?: number;
  updated_at?: string;
}

// CreateSerializer fields
export interface ProcesoRetiroFormData {
  colaborador: number;
  tipo_retiro: number;
  fecha_notificacion: string;
  fecha_ultimo_dia_trabajo: string;
  motivo_retiro: MotivoRetiro;
  motivo_detallado?: string;
  justa_causa_detalle?: string;
  responsable_proceso?: number | null;
  observaciones?: string;
}

export interface ProcesoRetiroFilter {
  estado?: EstadoProceso;
  colaborador?: number;
}

// ============== CHECKLIST RETIRO ==============
// ListSerializer fields
export interface ChecklistRetiro {
  id: number;
  proceso_retiro: number;
  tipo_item: TipoItem;
  tipo_item_display?: string;
  descripcion: string;
  estado: EstadoItem;
  estado_display?: string;
  responsable_area: AreaPazSalvo;
  responsable_area_display?: string;
  validado_por?: number | null;
  validado_por_nombre?: string;
  fecha_validacion?: string | null;
  esta_completado?: boolean;
  orden: number;
  // DetailSerializer adds:
  detalles?: string;
  evidencia?: string | null;
  observaciones?: string;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
}

// CreateSerializer fields
export interface ChecklistRetiroFormData {
  proceso_retiro: number;
  tipo_item: TipoItem;
  descripcion: string;
  detalles?: string;
  responsable_area: AreaPazSalvo;
  evidencia?: string | null;
  observaciones?: string;
  orden?: number;
}

export interface ChecklistRetiroFilter {
  proceso_retiro?: number;
  estado?: EstadoItem;
}

export interface MarcarCompletadoData {
  observaciones?: string;
}

// ============== PAZ Y SALVO ==============
// ListSerializer fields
export interface PazSalvo {
  id: number;
  proceso_retiro: number;
  area: AreaPazSalvo;
  area_display?: string;
  descripcion_area?: string;
  estado: EstadoPazSalvo;
  estado_display?: string;
  responsable?: number | null;
  responsable_nombre?: string;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string | null;
  esta_aprobado?: boolean;
  esta_rechazado?: boolean;
  pendientes?: string;
  // DetailSerializer adds:
  observaciones?: string;
  motivo_rechazo?: string;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
}

// CreateSerializer fields
export interface PazSalvoFormData {
  proceso_retiro: number;
  area: AreaPazSalvo;
  descripcion_area?: string;
  responsable?: number | null;
  pendientes?: string;
  observaciones?: string;
}

export interface PazSalvoFilter {
  proceso_retiro?: number;
  area?: AreaPazSalvo;
  estado?: EstadoPazSalvo;
}

export interface AprobarPazSalvoData {
  observaciones?: string;
}

export interface RechazarPazSalvoData {
  motivo: string;
}

// ============== EXAMEN EGRESO ==============
// ListSerializer fields
export interface ExamenEgreso {
  id: number;
  proceso_retiro: number;
  colaborador_nombre?: string;
  fecha_examen: string;
  entidad_prestadora: string;
  medico_evaluador?: string;
  resultado: ResultadoExamen;
  resultado_display?: string;
  es_apto?: boolean;
  enfermedad_laboral_identificada?: boolean;
  tiene_enfermedad_laboral?: boolean;
  requiere_seguimiento?: boolean;
  // DetailSerializer adds:
  licencia_medico?: string;
  concepto_medico?: string;
  hallazgos_clinicos?: string;
  diagnostico_egreso?: string;
  comparacion_examen_ingreso?: string;
  enfermedad_laboral_detalle?: string;
  recomendaciones?: string;
  certificado_medico?: string | null;
  examenes_adjuntos?: string | null;
  observaciones?: string;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
}

// CreateSerializer fields
export interface ExamenEgresoFormData {
  proceso_retiro: number;
  fecha_examen: string;
  entidad_prestadora: string;
  medico_evaluador?: string;
  licencia_medico?: string;
  resultado: ResultadoExamen;
  concepto_medico?: string;
  hallazgos_clinicos?: string;
  diagnostico_egreso?: string;
  comparacion_examen_ingreso?: string;
  enfermedad_laboral_identificada?: boolean;
  enfermedad_laboral_detalle?: string;
  recomendaciones?: string;
  requiere_seguimiento?: boolean;
  certificado_medico?: string | null;
  examenes_adjuntos?: string | null;
  observaciones?: string;
}

export interface ExamenEgresoFilter {
  proceso_retiro?: number;
  resultado?: ResultadoExamen;
}

// ============== ENTREVISTA RETIRO ==============
// ListSerializer fields
export interface EntrevistaRetiro {
  id: number;
  proceso_retiro: number;
  colaborador_nombre?: string;
  fecha_entrevista: string;
  entrevistador: number;
  entrevistador_nombre?: string;
  modalidad: ModalidadEntrevista;
  modalidad_display?: string;
  satisfaccion_general: number;
  promedio_evaluacion?: number;
  evaluacion_positiva?: boolean;
  motivo_principal_retiro: MotivoRetiro;
  motivo_principal_display?: string;
  volveria_trabajar: boolean;
  recomendaria_empresa: boolean;
  // DetailSerializer adds:
  evaluacion_liderazgo?: number;
  evaluacion_clima_laboral?: number;
  evaluacion_remuneracion?: number;
  evaluacion_desarrollo?: number;
  evaluacion_equilibrio_vida?: number;
  motivo_detallado?: string;
  aspectos_positivos?: string;
  aspectos_mejorar?: string;
  sugerencias?: string;
  justificacion_recontratacion?: string;
  analisis_entrevistador?: string;
  recomendaciones_organizacion?: string;
  acta_entrevista?: string | null;
  observaciones?: string;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
}

// CreateSerializer fields
export interface EntrevistaRetiroFormData {
  proceso_retiro: number;
  fecha_entrevista: string;
  entrevistador: number;
  modalidad: ModalidadEntrevista;
  satisfaccion_general: number;
  evaluacion_liderazgo?: number;
  evaluacion_clima_laboral?: number;
  evaluacion_remuneracion?: number;
  evaluacion_desarrollo?: number;
  evaluacion_equilibrio_vida?: number;
  motivo_principal_retiro: MotivoRetiro;
  motivo_detallado?: string;
  aspectos_positivos?: string;
  aspectos_mejorar?: string;
  sugerencias?: string;
  volveria_trabajar?: boolean;
  justificacion_recontratacion?: string;
  recomendaria_empresa?: boolean;
  analisis_entrevistador?: string;
  recomendaciones_organizacion?: string;
  acta_entrevista?: string | null;
  observaciones?: string;
}

export interface EntrevistaRetiroFilter {
  proceso_retiro?: number;
  motivo_principal_retiro?: MotivoRetiro;
}

// ============== LIQUIDACIÓN FINAL ==============
// ListSerializer fields
export interface LiquidacionFinal {
  id: number;
  proceso_retiro: number;
  colaborador_nombre?: string;
  fecha_liquidacion: string;
  salario_base: number;
  tiempo_servicio_anios?: number;
  total_devengados: number;
  total_deducciones: number;
  neto_pagar: number;
  aplica_indemnizacion: boolean;
  valor_indemnizacion: number;
  esta_aprobada?: boolean;
  esta_pagada?: boolean;
  fecha_pago?: string | null;
  metodo_pago?: MetodoPago;
  // DetailSerializer adds:
  fecha_ingreso?: string;
  fecha_retiro?: string;
  salario_promedio?: number;
  dias_trabajados_total?: number;
  cesantias_causadas?: number;
  cesantias_pendientes?: number;
  cesantias_pagadas?: number;
  intereses_cesantias?: number;
  prima_causada?: number;
  prima_pendiente?: number;
  prima_pagada?: number;
  dias_vacaciones_causados?: number;
  dias_vacaciones_pendientes?: number;
  dias_vacaciones_disfrutados?: number;
  valor_vacaciones?: number;
  bonificaciones?: number;
  otros_devengados?: number;
  detalle_otros_devengados?: string;
  prestamos_pendientes?: number;
  libranzas_pendientes?: number;
  otras_deducciones?: number;
  detalle_otras_deducciones?: string;
  referencia_pago?: string;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  metodo_pago_display?: string;
  fecha_aprobacion?: string | null;
  observaciones?: string;
  empresa?: number;
  created_at?: string;
  updated_at?: string;
}

// CreateSerializer fields
export interface LiquidacionFinalFormData {
  proceso_retiro: number;
  fecha_liquidacion: string;
  fecha_ingreso: string;
  fecha_retiro: string;
  salario_base: number;
  salario_promedio?: number;
  dias_trabajados_total?: number;
  cesantias_pagadas?: number;
  prima_pagada?: number;
  dias_vacaciones_disfrutados?: number;
  aplica_indemnizacion?: boolean;
  bonificaciones?: number;
  otros_devengados?: number;
  detalle_otros_devengados?: string;
  prestamos_pendientes?: number;
  libranzas_pendientes?: number;
  otras_deducciones?: number;
  detalle_otras_deducciones?: string;
  observaciones?: string;
}

export interface LiquidacionFinalFilter {
  proceso_retiro?: number;
}

export interface RegistrarPagoData {
  fecha_pago: string;
  metodo_pago: MetodoPago;
  referencia_pago: string;
}

// ============== CERTIFICADO DE TRABAJO ==============
// ListSerializer fields
export interface CertificadoTrabajo {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_certificado: TipoCertificado;
  tipo_certificado_display?: string;
  fecha_solicitud: string;
  fecha_expedicion?: string | null;
  estado: EstadoCertificado;
  estado_display?: string;
  generado_por_nombre?: string;
  created_at?: string;
  // DetailSerializer adds:
  incluir_cargo?: boolean;
  incluir_salario?: boolean;
  incluir_funciones?: boolean;
  informacion_adicional?: string;
  documento_generado?: string | null;
  generado_por?: number | null;
  dirigido_a?: string;
  empresa?: number;
  updated_at?: string;
}

// CreateSerializer fields
export interface CertificadoTrabajoFormData {
  colaborador: number;
  tipo_certificado: TipoCertificado;
  dirigido_a?: string;
  incluir_cargo?: boolean;
  incluir_salario?: boolean;
  incluir_funciones?: boolean;
  informacion_adicional?: string;
}

export interface CertificadoTrabajoFilter {
  estado?: EstadoCertificado;
  tipo_certificado?: TipoCertificado;
  colaborador?: number;
}

// ============== OPTIONS (labels en español colombiano) ==============

export const tipoRetiroOptions = [
  { value: 'voluntario', label: 'Retiro Voluntario' },
  { value: 'despido_justa_causa', label: 'Despido con Justa Causa' },
  { value: 'despido_sin_justa_causa', label: 'Despido sin Justa Causa' },
  { value: 'mutuo_acuerdo', label: 'Mutuo Acuerdo' },
  { value: 'terminacion_contrato', label: 'Terminación de Contrato' },
  { value: 'jubilacion', label: 'Jubilación' },
  { value: 'fallecimiento', label: 'Fallecimiento' },
  { value: 'abandono_trabajo', label: 'Abandono del Trabajo' },
];

export const estadoProcesoOptions = [
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'checklist_pendiente', label: 'Checklist Pendiente' },
  { value: 'paz_salvo_pendiente', label: 'Paz y Salvo Pendiente' },
  { value: 'examen_pendiente', label: 'Examen Médico Pendiente' },
  { value: 'entrevista_pendiente', label: 'Entrevista Pendiente' },
  { value: 'liquidacion_pendiente', label: 'Liquidación Pendiente' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const estadoItemOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'no_aplica', label: 'No Aplica' },
];

export const tipoItemOptions = [
  { value: 'entrega_activo', label: 'Entrega de Activo' },
  { value: 'entrega_documento', label: 'Entrega de Documento' },
  { value: 'devolucion_epp', label: 'Devolución de EPP' },
  { value: 'cierre_sistema', label: 'Cierre de Sistema' },
  { value: 'entrega_cargo', label: 'Entrega de Cargo' },
  { value: 'otro', label: 'Otro' },
];

export const areaPazSalvoOptions = [
  { value: 'talento_humano', label: 'Talento Humano' },
  { value: 'sistemas', label: 'Sistemas' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'administracion', label: 'Administración' },
  { value: 'produccion', label: 'Producción' },
  { value: 'hseq', label: 'HSEQ' },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'jefe_inmediato', label: 'Jefe Inmediato' },
];

export const estadoPazSalvoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const resultadoExamenOptions = [
  { value: 'apto', label: 'Apto' },
  { value: 'apto_con_recomendaciones', label: 'Apto con Recomendaciones' },
  { value: 'no_apto', label: 'No Apto' },
];

export const motivoRetiroOptions = [
  { value: 'mejor_oportunidad', label: 'Mejor Oportunidad Laboral' },
  { value: 'cambio_residencia', label: 'Cambio de Residencia' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'salud', label: 'Razones de Salud' },
  { value: 'clima_laboral', label: 'Clima Laboral' },
  { value: 'remuneracion', label: 'Remuneración' },
  { value: 'crecimiento_profesional', label: 'Falta de Crecimiento Profesional' },
  { value: 'equilibrio_vida', label: 'Equilibrio Vida-Trabajo' },
  { value: 'personal', label: 'Motivos Personales' },
  { value: 'bajo_desempeno', label: 'Bajo Desempeño' },
  { value: 'incumplimiento', label: 'Incumplimiento de Normas' },
  { value: 'reestructuracion', label: 'Reestructuración Organizacional' },
  { value: 'otro', label: 'Otro' },
];

export const modalidadEntrevistaOptions = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'telefonica', label: 'Telefónica' },
];

export const metodoPagoOptions = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
];

export const tipoCertificadoOptions = [
  { value: 'laboral', label: 'Certificado Laboral' },
  { value: 'ingresos', label: 'Certificado de Ingresos y Retenciones' },
  { value: 'cargo', label: 'Certificado de Cargo y Funciones' },
];

export const estadoCertificadoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'generado', label: 'Generado' },
  { value: 'entregado', label: 'Entregado' },
];
