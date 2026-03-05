/**
 * Types para Off-Boarding - Talent Hub
 * Sistema de Gestión StrateKaz
 */

// ============== ENUMS ==============

export type TipoRetiroCode =
  | 'renuncia_voluntaria'
  | 'mutuo_acuerdo'
  | 'terminacion_justa_causa'
  | 'terminacion_sin_justa_causa'
  | 'finalizacion_contrato'
  | 'pension'
  | 'muerte'
  | 'incapacidad_permanente'
  | 'abandono_cargo';

export type EstadoProceso =
  | 'iniciado'
  | 'en_proceso'
  | 'pendiente_liquidacion'
  | 'finalizado'
  | 'cancelado';
export type EstadoItem = 'pendiente' | 'en_proceso' | 'completado' | 'no_aplica';
export type TipoPazSalvo =
  | 'herramientas'
  | 'equipos'
  | 'documentos'
  | 'llaves'
  | 'uniformes'
  | 'carnet'
  | 'tarjetas'
  | 'vehiculo'
  | 'credenciales'
  | 'otros';
export type EstadoPazSalvo = 'pendiente' | 'aprobado' | 'rechazado';
export type TipoExamenEgreso =
  | 'medico_general'
  | 'audiometria'
  | 'optometria'
  | 'espirometria'
  | 'laboratorios'
  | 'psicologico'
  | 'otros';
export type ResultadoExamen = 'apto' | 'apto_con_restricciones' | 'no_apto' | 'pendiente';
export type SatisfaccionGeneral =
  | 'muy_satisfecho'
  | 'satisfecho'
  | 'neutral'
  | 'insatisfecho'
  | 'muy_insatisfecho';
export type EstadoLiquidacionFinal = 'borrador' | 'calculada' | 'aprobada' | 'pagada';

// ============== TIPO RETIRO ==============

export interface TipoRetiro {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: TipoRetiroCode;
  requiere_preaviso: boolean;
  dias_preaviso: number;
  requiere_indemnizacion: boolean;
  descripcion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoRetiroFormData {
  codigo: string;
  nombre: string;
  tipo: TipoRetiroCode;
  requiere_preaviso?: boolean;
  dias_preaviso?: number;
  requiere_indemnizacion?: boolean;
  descripcion?: string;
}

// ============== PROCESO RETIRO ==============

export interface ProcesoRetiro {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  colaborador_documento: string;
  colaborador_cargo: string;
  tipo_retiro: number;
  tipo_retiro_nombre: string;
  fecha_notificacion: string;
  fecha_ultimo_dia_trabajo: string;
  motivo_retiro: string;
  carta_renuncia: string;
  carta_terminacion: string;
  estado: EstadoProceso;
  fecha_inicio_proceso: string;
  fecha_fin_proceso: string | null;
  responsable_proceso: number;
  responsable_proceso_nombre: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ProcesoRetiroFormData {
  colaborador: number;
  tipo_retiro: number;
  fecha_notificacion: string;
  fecha_ultimo_dia_trabajo: string;
  motivo_retiro: string;
}

export interface ProcesoRetiroFilter {
  colaborador?: number;
  tipo_retiro?: number;
  estado?: EstadoProceso;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ============== CHECKLIST RETIRO ==============

export interface ChecklistRetiro {
  id: number;
  empresa: number;
  proceso_retiro: number;
  orden: number;
  descripcion: string;
  responsable: number | null;
  responsable_nombre: string;
  area_responsable: string;
  estado: EstadoItem;
  fecha_limite: string | null;
  fecha_completado: string | null;
  completado_por: number | null;
  completado_por_nombre: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ChecklistRetiroFormData {
  proceso_retiro: number;
  orden: number;
  descripcion: string;
  responsable?: number | null;
  area_responsable?: string;
  fecha_limite?: string | null;
}

export interface ChecklistRetiroFilter {
  proceso_retiro?: number;
  responsable?: number;
  estado?: EstadoItem;
}

export interface CompletarItemData {
  observaciones?: string;
}

// ============== PAZ Y SALVO ==============

export interface PazSalvo {
  id: number;
  empresa: number;
  proceso_retiro: number;
  tipo: TipoPazSalvo;
  descripcion: string;
  cantidad_entregada: number;
  cantidad_devuelta: number;
  estado: EstadoPazSalvo;
  area_responsable: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones: string;
  valor_pendiente: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PazSalvoFormData {
  proceso_retiro: number;
  tipo: TipoPazSalvo;
  descripcion: string;
  cantidad_entregada: number;
  area_responsable?: string;
}

export interface PazSalvoFilter {
  proceso_retiro?: number;
  tipo?: TipoPazSalvo;
  estado?: EstadoPazSalvo;
}

export interface AprobarPazSalvoData {
  cantidad_devuelta: number;
  observaciones?: string;
  valor_pendiente?: number;
}

// ============== EXAMEN EGRESO ==============

export interface ExamenEgreso {
  id: number;
  empresa: number;
  proceso_retiro: number;
  tipo_examen: TipoExamenEgreso;
  fecha_examen: string;
  fecha_realizado: string | null;
  entidad_prestadora: string;
  resultado: ResultadoExamen;
  concepto_medico: string;
  restricciones: string;
  recomendaciones: string;
  archivo_resultado: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ExamenEgresoFormData {
  proceso_retiro: number;
  tipo_examen: TipoExamenEgreso;
  fecha_examen: string;
  entidad_prestadora: string;
}

export interface ExamenEgresoFilter {
  proceso_retiro?: number;
  tipo_examen?: TipoExamenEgreso;
  resultado?: ResultadoExamen;
}

export interface RegistrarResultadoExamenData {
  fecha_realizado: string;
  resultado: ResultadoExamen;
  concepto_medico?: string;
  restricciones?: string;
  recomendaciones?: string;
}

// ============== ENTREVISTA RETIRO ==============

export interface EntrevistaRetiro {
  id: number;
  empresa: number;
  proceso_retiro: number;
  fecha_entrevista: string;
  entrevistador: number;
  entrevistador_nombre: string;
  motivo_principal_retiro: string;
  motivos_secundarios: string;
  aspectos_positivos: string;
  aspectos_mejorar: string;
  recomendaria_empresa: boolean;
  volveria_trabajar: boolean;
  satisfaccion_salario: SatisfaccionGeneral;
  satisfaccion_ambiente: SatisfaccionGeneral;
  satisfaccion_liderazgo: SatisfaccionGeneral;
  satisfaccion_desarrollo: SatisfaccionGeneral;
  sugerencias: string;
  observaciones_generales: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface EntrevistaRetiroFormData {
  proceso_retiro: number;
  fecha_entrevista: string;
  motivo_principal_retiro: string;
  motivos_secundarios?: string;
  aspectos_positivos?: string;
  aspectos_mejorar?: string;
  recomendaria_empresa?: boolean;
  volveria_trabajar?: boolean;
  satisfaccion_salario?: SatisfaccionGeneral;
  satisfaccion_ambiente?: SatisfaccionGeneral;
  satisfaccion_liderazgo?: SatisfaccionGeneral;
  satisfaccion_desarrollo?: SatisfaccionGeneral;
  sugerencias?: string;
  observaciones_generales?: string;
}

export interface EntrevistaRetiroFilter {
  proceso_retiro?: number;
  entrevistador?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ============== LIQUIDACION FINAL ==============

export interface LiquidacionFinal {
  id: number;
  empresa: number;
  proceso_retiro: number;
  colaborador_nombre: string;
  fecha_ingreso: string;
  fecha_retiro: string;
  dias_laborados_ultimo_mes: number;
  salario_base: number;
  promedio_salario: number;
  valor_salario_pendiente: number;
  valor_vacaciones: number;
  dias_vacaciones_pendientes: number;
  valor_cesantias: number;
  valor_intereses_cesantias: number;
  valor_prima: number;
  valor_indemnizacion: number;
  valor_bonificaciones: number;
  otros_devengados: number;
  total_devengados: number;
  valor_salud: number;
  valor_pension: number;
  valor_retencion_fuente: number;
  valor_embargos: number;
  valor_prestamos: number;
  otros_descuentos: number;
  total_deducciones: number;
  neto_pagar: number;
  estado: EstadoLiquidacionFinal;
  calculado_por: number;
  calculado_por_nombre: string;
  fecha_calculo: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  fecha_pago: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LiquidacionFinalFilter {
  proceso_retiro?: number;
  estado?: EstadoLiquidacionFinal;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface CalcularLiquidacionFinalData {
  proceso_retiro: number;
}

// ============== OPTIONS ==============

export const tipoRetiroOptions = [
  { value: 'renuncia_voluntaria', label: 'Renuncia Voluntaria' },
  { value: 'mutuo_acuerdo', label: 'Mutuo Acuerdo' },
  { value: 'terminacion_justa_causa', label: 'Terminación con Justa Causa' },
  { value: 'terminacion_sin_justa_causa', label: 'Terminación sin Justa Causa' },
  { value: 'finalizacion_contrato', label: 'Finalización de Contrato' },
  { value: 'pension', label: 'Pensión' },
  { value: 'muerte', label: 'Muerte' },
  { value: 'incapacidad_permanente', label: 'Incapacidad Permanente' },
  { value: 'abandono_cargo', label: 'Abandono del Cargo' },
];

export const estadoProcesoOptions = [
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'pendiente_liquidacion', label: 'Pendiente Liquidación' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const estadoItemOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completado', label: 'Completado' },
  { value: 'no_aplica', label: 'No Aplica' },
];

export const tipoPazSalvoOptions = [
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'equipos', label: 'Equipos' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'llaves', label: 'Llaves' },
  { value: 'uniformes', label: 'Uniformes' },
  { value: 'carnet', label: 'Carnet' },
  { value: 'tarjetas', label: 'Tarjetas de Acceso' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'credenciales', label: 'Credenciales' },
  { value: 'otros', label: 'Otros' },
];

export const estadoPazSalvoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const tipoExamenEgresoOptions = [
  { value: 'medico_general', label: 'Médico General' },
  { value: 'audiometria', label: 'Audiometría' },
  { value: 'optometria', label: 'Optometría' },
  { value: 'espirometria', label: 'Espirometría' },
  { value: 'laboratorios', label: 'Laboratorios' },
  { value: 'psicologico', label: 'Psicológico' },
  { value: 'otros', label: 'Otros' },
];

export const resultadoExamenOptions = [
  { value: 'apto', label: 'Apto' },
  { value: 'apto_con_restricciones', label: 'Apto con Restricciones' },
  { value: 'no_apto', label: 'No Apto' },
  { value: 'pendiente', label: 'Pendiente' },
];

export const satisfaccionGeneralOptions = [
  { value: 'muy_satisfecho', label: 'Muy Satisfecho' },
  { value: 'satisfecho', label: 'Satisfecho' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'insatisfecho', label: 'Insatisfecho' },
  { value: 'muy_insatisfecho', label: 'Muy Insatisfecho' },
];

export const estadoLiquidacionFinalOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'calculada', label: 'Calculada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'pagada', label: 'Pagada' },
];
