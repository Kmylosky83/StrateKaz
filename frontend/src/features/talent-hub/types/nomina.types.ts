/**
 * Types para Nómina - Talent Hub
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// ============== ENUMS ==============

export type TipoPeriodoNomina = 'quincenal' | 'mensual';
export type EstadoPeriodo = 'abierto' | 'en_proceso' | 'cerrado' | 'pagado';
export type TipoConcepto = 'devengado' | 'deduccion' | 'provision' | 'aporte_empresa';
export type CategoriaConcepto =
  | 'salario'
  | 'auxilio_transporte'
  | 'horas_extras'
  | 'recargos'
  | 'comisiones'
  | 'bonificaciones'
  | 'incapacidades'
  | 'licencias'
  | 'vacaciones'
  | 'salud'
  | 'pension'
  | 'arl'
  | 'caja_compensacion'
  | 'retencion_fuente'
  | 'embargos'
  | 'libranzas'
  | 'prestamos'
  | 'cesantias'
  | 'intereses_cesantias'
  | 'prima'
  | 'otros';
export type EstadoLiquidacion = 'borrador' | 'calculada' | 'aprobada' | 'pagada';
export type TipoPrestacion = 'cesantias' | 'intereses_cesantias' | 'prima' | 'vacaciones' | 'dotacion';
export type EstadoPrestacion = 'provisionada' | 'pagada' | 'consignada';
export type MetodoPago = 'transferencia' | 'cheque' | 'efectivo' | 'consignacion';
export type EstadoPago = 'pendiente' | 'procesado' | 'fallido' | 'anulado';

// ============== CONFIGURACION NOMINA ==============

export interface ConfiguracionNomina {
  id: number;
  empresa: number;
  salario_minimo_vigente: number;
  auxilio_transporte_vigente: number;
  porcentaje_salud_empleado: number;
  porcentaje_salud_empleador: number;
  porcentaje_pension_empleado: number;
  porcentaje_pension_empleador: number;
  porcentaje_arl_base: number;
  porcentaje_caja_compensacion: number;
  porcentaje_sena: number;
  porcentaje_icbf: number;
  uvt_vigente: number;
  tope_horas_extras_mes: number;
  factor_hora_extra_diurna: number;
  factor_hora_extra_nocturna: number;
  factor_hora_extra_dominical: number;
  factor_hora_extra_festiva: number;
  factor_recargo_nocturno: number;
  factor_recargo_dominical: number;
  factor_recargo_festivo: number;
  ano_vigencia: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ConfiguracionNominaFormData {
  salario_minimo_vigente: number;
  auxilio_transporte_vigente: number;
  porcentaje_salud_empleado?: number;
  porcentaje_salud_empleador?: number;
  porcentaje_pension_empleado?: number;
  porcentaje_pension_empleador?: number;
  porcentaje_arl_base?: number;
  porcentaje_caja_compensacion?: number;
  porcentaje_sena?: number;
  porcentaje_icbf?: number;
  uvt_vigente?: number;
  tope_horas_extras_mes?: number;
  ano_vigencia: number;
}

// ============== CONCEPTO NOMINA ==============

export interface ConceptoNomina {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: TipoConcepto;
  categoria: CategoriaConcepto;
  afecta_base_salud: boolean;
  afecta_base_pension: boolean;
  afecta_base_arl: boolean;
  afecta_base_parafiscales: boolean;
  afecta_base_prestaciones: boolean;
  afecta_base_retencion: boolean;
  es_fijo: boolean;
  valor_fijo: number;
  porcentaje: number;
  formula: string;
  orden_calculo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ConceptoNominaFormData {
  codigo: string;
  nombre: string;
  tipo: TipoConcepto;
  categoria: CategoriaConcepto;
  afecta_base_salud?: boolean;
  afecta_base_pension?: boolean;
  afecta_base_arl?: boolean;
  afecta_base_parafiscales?: boolean;
  afecta_base_prestaciones?: boolean;
  afecta_base_retencion?: boolean;
  es_fijo?: boolean;
  valor_fijo?: number;
  porcentaje?: number;
  formula?: string;
  orden_calculo?: number;
  activo?: boolean;
}

export interface ConceptoNominaFilter {
  tipo?: TipoConcepto;
  categoria?: CategoriaConcepto;
  activo?: boolean;
  search?: string;
}

// ============== PERIODO NOMINA ==============

export interface PeriodoNomina {
  id: number;
  empresa: number;
  tipo: TipoPeriodoNomina;
  anio: number;
  mes: number;
  numero_periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  estado: EstadoPeriodo;
  total_devengados: number;
  total_deducciones: number;
  total_neto: number;
  total_aportes_empresa: number;
  total_provisiones: number;
  cantidad_empleados: number;
  cerrado_por: number | null;
  cerrado_por_nombre: string;
  fecha_cierre: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PeriodoNominaFormData {
  tipo: TipoPeriodoNomina;
  anio: number;
  mes: number;
  numero_periodo: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  observaciones?: string;
}

export interface PeriodoNominaFilter {
  tipo?: TipoPeriodoNomina;
  anio?: number;
  mes?: number;
  estado?: EstadoPeriodo;
}

// ============== LIQUIDACION NOMINA ==============

export interface LiquidacionNomina {
  id: number;
  empresa: number;
  periodo: number;
  periodo_descripcion: string;
  colaborador: number;
  colaborador_nombre: string;
  colaborador_documento: string;
  cargo: string;
  salario_base: number;
  dias_trabajados: number;
  dias_incapacidad: number;
  dias_licencia: number;
  dias_vacaciones: number;
  dias_ausencia: number;
  total_devengados: number;
  total_deducciones: number;
  neto_pagar: number;
  base_salud: number;
  base_pension: number;
  base_arl: number;
  base_parafiscales: number;
  base_prestaciones: number;
  base_retencion: number;
  estado: EstadoLiquidacion;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LiquidacionNominaFilter {
  periodo?: number;
  colaborador?: number;
  estado?: EstadoLiquidacion;
}

export interface CalcularLiquidacionData {
  periodo: number;
  colaborador?: number;
}

// ============== DETALLE LIQUIDACION ==============

export interface DetalleLiquidacion {
  id: number;
  empresa: number;
  liquidacion: number;
  concepto: number;
  concepto_codigo: string;
  concepto_nombre: string;
  tipo: TipoConcepto;
  categoria: CategoriaConcepto;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  base_calculo: number;
  porcentaje_aplicado: number;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DetalleLiquidacionFormData {
  liquidacion: number;
  concepto: number;
  cantidad?: number;
  valor_unitario?: number;
  valor_total: number;
  observaciones?: string;
}

// ============== PRESTACION ==============

export interface Prestacion {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo: TipoPrestacion;
  periodo_inicio: string;
  periodo_fin: string;
  dias_base: number;
  salario_base: number;
  valor_provisionado: number;
  valor_pagado: number;
  estado: EstadoPrestacion;
  fecha_pago: string | null;
  fecha_consignacion: string | null;
  entidad_consignacion: string;
  numero_radicado: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PrestacionFormData {
  colaborador: number;
  tipo: TipoPrestacion;
  periodo_inicio: string;
  periodo_fin: string;
  dias_base: number;
  salario_base: number;
  valor_provisionado: number;
}

export interface PrestacionFilter {
  colaborador?: number;
  tipo?: TipoPrestacion;
  estado?: EstadoPrestacion;
  anio?: number;
}

export interface PagarPrestacionData {
  valor_pagado: number;
  entidad_consignacion?: string;
  numero_radicado?: string;
  observaciones?: string;
}

// ============== PAGO NOMINA ==============

export interface PagoNomina {
  id: number;
  empresa: number;
  periodo: number;
  periodo_descripcion: string;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  banco: string;
  numero_lote: string;
  cantidad_pagos: number;
  valor_total: number;
  estado: EstadoPago;
  archivo_plano: string;
  procesado_por: number;
  procesado_por_nombre: string;
  fecha_procesamiento: string | null;
  error_procesamiento: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PagoNominaFormData {
  periodo: number;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  banco?: string;
  observaciones?: string;
}

export interface PagoNominaFilter {
  periodo?: number;
  metodo_pago?: MetodoPago;
  estado?: EstadoPago;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ProcesarPagoData {
  numero_lote?: string;
}

// ============== OPTIONS ==============

export const tipoPeriodoNominaOptions = [
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
];

export const estadoPeriodoOptions = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'pagado', label: 'Pagado' },
];

export const tipoConceptoOptions = [
  { value: 'devengado', label: 'Devengado' },
  { value: 'deduccion', label: 'Deducción' },
  { value: 'provision', label: 'Provisión' },
  { value: 'aporte_empresa', label: 'Aporte Empresa' },
];

export const categoriaConceptoOptions = [
  { value: 'salario', label: 'Salario' },
  { value: 'auxilio_transporte', label: 'Auxilio de Transporte' },
  { value: 'horas_extras', label: 'Horas Extras' },
  { value: 'recargos', label: 'Recargos' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'bonificaciones', label: 'Bonificaciones' },
  { value: 'incapacidades', label: 'Incapacidades' },
  { value: 'licencias', label: 'Licencias' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'salud', label: 'Salud' },
  { value: 'pension', label: 'Pensión' },
  { value: 'arl', label: 'ARL' },
  { value: 'caja_compensacion', label: 'Caja de Compensación' },
  { value: 'retencion_fuente', label: 'Retención en la Fuente' },
  { value: 'embargos', label: 'Embargos' },
  { value: 'libranzas', label: 'Libranzas' },
  { value: 'prestamos', label: 'Préstamos' },
  { value: 'cesantias', label: 'Cesantías' },
  { value: 'intereses_cesantias', label: 'Intereses de Cesantías' },
  { value: 'prima', label: 'Prima' },
  { value: 'otros', label: 'Otros' },
];

export const estadoLiquidacionOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'calculada', label: 'Calculada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'pagada', label: 'Pagada' },
];

export const tipoPrestacionOptions = [
  { value: 'cesantias', label: 'Cesantías' },
  { value: 'intereses_cesantias', label: 'Intereses de Cesantías' },
  { value: 'prima', label: 'Prima de Servicios' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'dotacion', label: 'Dotación' },
];

export const estadoPrestacionOptions = [
  { value: 'provisionada', label: 'Provisionada' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'consignada', label: 'Consignada' },
];

export const metodoPagoOptions = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'consignacion', label: 'Consignación' },
];

export const estadoPagoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'procesado', label: 'Procesado' },
  { value: 'fallido', label: 'Fallido' },
  { value: 'anulado', label: 'Anulado' },
];
