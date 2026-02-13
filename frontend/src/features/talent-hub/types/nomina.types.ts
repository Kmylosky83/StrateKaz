/**
 * Types para Nómina - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Alineado con backend: apps/talent_hub/nomina/models.py + serializers.py
 */

// ============== ENUMS ==============

/** Backend: TIPO_PERIODO_CHOICES */
export type TipoPeriodoNomina = 'primera_quincena' | 'segunda_quincena' | 'mensual';

/** Backend: ESTADO_PERIODO_CHOICES */
export type EstadoPeriodo = 'abierto' | 'preliquidado' | 'liquidado' | 'pagado' | 'cerrado';

/** Backend: TIPO_CONCEPTO_CHOICES — solo 2 valores */
export type TipoConcepto = 'devengado' | 'deduccion';

/** Backend: CATEGORIA_CONCEPTO_CHOICES */
export type CategoriaConcepto =
  | 'salario'
  | 'auxilio'
  | 'bonificacion'
  | 'comision'
  | 'hora_extra'
  | 'recargo_nocturno'
  | 'incapacidad'
  | 'licencia'
  | 'vacaciones'
  | 'prima'
  | 'cesantias'
  | 'intereses_cesantias'
  | 'salud'
  | 'pension'
  | 'fondo_solidaridad'
  | 'retencion_fuente'
  | 'libranza'
  | 'embargo'
  | 'fondo_empleados'
  | 'otro';

/** Backend: ESTADO_LIQUIDACION_CHOICES */
export type EstadoLiquidacion = 'borrador' | 'preliquidado' | 'aprobado' | 'pagado' | 'anulado';

/** Backend: TIPO_PRESTACION_CHOICES */
export type TipoPrestacion = 'cesantias' | 'intereses_cesantias' | 'prima_servicios' | 'vacaciones';

/** Backend: ESTADO_PRESTACION_CHOICES */
export type EstadoPrestacion = 'en_provision' | 'liquidada' | 'pagada';

/** Backend: METODO_PAGO_CHOICES */
export type MetodoPago = 'transferencia' | 'cheque' | 'efectivo';

// ============== CONFIGURACION NOMINA ==============

/** ConfiguracionNominaDetailSerializer — fields='__all__' */
export interface ConfiguracionNomina {
  id: number;
  empresa: number;
  anio: number;
  salario_minimo: number;
  auxilio_transporte: number;
  // Seguridad Social - Empleado
  porcentaje_salud_empleado: number;
  porcentaje_pension_empleado: number;
  // Seguridad Social - Empresa
  porcentaje_salud_empresa: number;
  porcentaje_pension_empresa: number;
  // ARL
  porcentaje_arl: number;
  // Parafiscales
  porcentaje_caja_compensacion: number;
  porcentaje_icbf: number;
  porcentaje_sena: number;
  // Prestaciones
  dias_base_cesantias: number;
  porcentaje_intereses_cesantias: number;
  dias_base_prima: number;
  dias_vacaciones_por_anio: number;
  // Fondo Solidaridad
  salario_base_solidaridad: number;
  porcentaje_solidaridad_empleado: number;
  // Observaciones
  observaciones: string;
  // Computed
  total_seguridad_social_empleado?: number;
  total_seguridad_social_empresa?: number;
  total_parafiscales?: number;
  // Audit
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** ConfiguracionNominaListSerializer fields */
export interface ConfiguracionNominaList {
  id: number;
  anio: number;
  salario_minimo: number;
  auxilio_transporte: number;
  total_seguridad_social_empleado: number;
  total_seguridad_social_empresa: number;
  total_parafiscales: number;
  created_at: string;
}

/** ConfiguracionNominaCreateSerializer fields */
export interface ConfiguracionNominaFormData {
  anio: number;
  salario_minimo: number;
  auxilio_transporte: number;
  porcentaje_salud_empleado?: number;
  porcentaje_pension_empleado?: number;
  porcentaje_salud_empresa?: number;
  porcentaje_pension_empresa?: number;
  porcentaje_arl?: number;
  porcentaje_caja_compensacion?: number;
  porcentaje_icbf?: number;
  porcentaje_sena?: number;
  dias_base_cesantias?: number;
  porcentaje_intereses_cesantias?: number;
  dias_base_prima?: number;
  dias_vacaciones_por_anio?: number;
  salario_base_solidaridad?: number;
  porcentaje_solidaridad_empleado?: number;
  observaciones?: string;
}

// ============== CONCEPTO NOMINA ==============

/** ConceptoNominaListSerializer fields */
export interface ConceptoNomina {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoConcepto;
  tipo_display?: string;
  categoria: CategoriaConcepto;
  categoria_display?: string;
  es_fijo: boolean;
  es_base_seguridad_social: boolean;
  es_base_parafiscales: boolean;
  es_base_prestaciones: boolean;
  formula?: string;
  orden: number;
  // Audit (from detail)
  empresa?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

/** ConceptoNominaCreateSerializer fields */
export interface ConceptoNominaFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoConcepto;
  categoria: CategoriaConcepto;
  es_fijo?: boolean;
  es_base_seguridad_social?: boolean;
  es_base_parafiscales?: boolean;
  es_base_prestaciones?: boolean;
  formula?: string;
  orden?: number;
}

export interface ConceptoNominaFilter {
  tipo?: TipoConcepto;
  categoria?: CategoriaConcepto;
  search?: string;
}

// ============== PERIODO NOMINA ==============

/** PeriodoNominaListSerializer fields */
export interface PeriodoNomina {
  id: number;
  empresa?: number;
  anio: number;
  mes: number;
  tipo: TipoPeriodoNomina;
  tipo_display?: string;
  nombre_periodo?: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  estado: EstadoPeriodo;
  estado_display?: string;
  esta_abierto?: boolean;
  total_devengados?: number;
  total_deducciones?: number;
  total_neto: number;
  numero_colaboradores: number;
  cerrado_por?: number | null;
  cerrado_por_nombre?: string;
  fecha_cierre?: string | null;
  observaciones?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

/** PeriodoNominaCreateSerializer fields */
export interface PeriodoNominaFormData {
  anio: number;
  mes: number;
  tipo: TipoPeriodoNomina;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  observaciones?: string;
}

export interface PeriodoNominaFilter {
  anio?: number;
  mes?: number;
  estado?: EstadoPeriodo;
}

// ============== LIQUIDACION NOMINA ==============

/** LiquidacionNominaListSerializer fields */
export interface LiquidacionNomina {
  id: number;
  empresa?: number;
  periodo: number;
  periodo_nombre?: string;
  colaborador: number;
  colaborador_nombre?: string;
  colaborador_identificacion?: string;
  salario_base: number;
  dias_trabajados: number;
  total_devengados: number;
  total_deducciones: number;
  neto_pagar: number;
  estado: EstadoLiquidacion;
  estado_display?: string;
  esta_aprobada?: boolean;
  esta_pagada?: boolean;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string | null;
  observaciones?: string;
  // Detail includes detalles array
  detalles?: DetalleLiquidacion[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface LiquidacionNominaFilter {
  periodo?: number;
  colaborador?: number;
  estado?: EstadoLiquidacion;
}

/** LiquidacionNominaCreateSerializer fields */
export interface LiquidacionNominaFormData {
  periodo: number;
  colaborador: number;
  salario_base: number;
  dias_trabajados: number;
  observaciones?: string;
  detalles?: DetalleCreateData[];
}

export interface DetalleCreateData {
  concepto: number;
  cantidad: number;
  valor_unitario: number;
  observaciones?: string;
}

// ============== DETALLE LIQUIDACION ==============

/** DetalleLiquidacionListSerializer fields */
export interface DetalleLiquidacion {
  id: number;
  concepto: number;
  concepto_codigo?: string;
  concepto_nombre?: string;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  es_devengado: boolean;
  observaciones?: string;
}

export interface DetalleLiquidacionFormData {
  concepto: number;
  cantidad: number;
  valor_unitario: number;
  observaciones?: string;
}

// ============== PRESTACION ==============

/** PrestacionListSerializer fields */
export interface Prestacion {
  id: number;
  empresa?: number;
  colaborador: number;
  colaborador_nombre?: string;
  anio: number;
  tipo: TipoPrestacion;
  tipo_display?: string;
  valor_base?: number;
  dias_causados?: number;
  valor_provisionado: number;
  valor_pagado: number;
  saldo_pendiente?: number;
  estado: EstadoPrestacion;
  estado_display?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_pago?: string | null;
  observaciones?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

/** PrestacionCreateSerializer fields */
export interface PrestacionFormData {
  colaborador: number;
  anio: number;
  tipo: TipoPrestacion;
  valor_base: number;
  dias_causados: number;
  valor_provisionado: number;
  valor_pagado?: number;
  estado?: EstadoPrestacion;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_pago?: string | null;
  observaciones?: string;
}

export interface PrestacionFilter {
  colaborador?: number;
  tipo?: TipoPrestacion;
  estado?: EstadoPrestacion;
  anio?: number;
}

// ============== PAGO NOMINA ==============

/** PagoNominaListSerializer fields */
export interface PagoNomina {
  id: number;
  empresa?: number;
  liquidacion: number;
  liquidacion_colaborador?: string;
  liquidacion_periodo?: string;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  metodo_pago_display?: string;
  banco?: string;
  numero_cuenta?: string;
  referencia_pago?: string;
  valor_pagado: number;
  comprobante?: string | null;
  observaciones?: string;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

/** PagoNominaCreateSerializer fields */
export interface PagoNominaFormData {
  liquidacion: number;
  fecha_pago: string;
  metodo_pago: MetodoPago;
  banco?: string;
  numero_cuenta?: string;
  referencia_pago?: string;
  valor_pagado: number;
  comprobante?: File | null;
  observaciones?: string;
}

export interface PagoNominaFilter {
  liquidacion?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ============== OPTIONS ==============

export const tipoPeriodoNominaOptions = [
  { value: 'primera_quincena', label: 'Primera Quincena' },
  { value: 'segunda_quincena', label: 'Segunda Quincena' },
  { value: 'mensual', label: 'Mensual' },
];

export const estadoPeriodoOptions = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'preliquidado', label: 'Preliquidado' },
  { value: 'liquidado', label: 'Liquidado' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'cerrado', label: 'Cerrado' },
];

export const tipoConceptoOptions = [
  { value: 'devengado', label: 'Devengado' },
  { value: 'deduccion', label: 'Deducción' },
];

export const categoriaConceptoOptions = [
  { value: 'salario', label: 'Salario Básico' },
  { value: 'auxilio', label: 'Auxilio' },
  { value: 'bonificacion', label: 'Bonificación' },
  { value: 'comision', label: 'Comisión' },
  { value: 'hora_extra', label: 'Hora Extra' },
  { value: 'recargo_nocturno', label: 'Recargo Nocturno' },
  { value: 'incapacidad', label: 'Incapacidad' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'prima', label: 'Prima de Servicios' },
  { value: 'cesantias', label: 'Cesantías' },
  { value: 'intereses_cesantias', label: 'Intereses Cesantías' },
  { value: 'salud', label: 'Salud' },
  { value: 'pension', label: 'Pensión' },
  { value: 'fondo_solidaridad', label: 'Fondo Solidaridad Pensional' },
  { value: 'retencion_fuente', label: 'Retención en la Fuente' },
  { value: 'libranza', label: 'Libranza' },
  { value: 'embargo', label: 'Embargo' },
  { value: 'fondo_empleados', label: 'Fondo de Empleados' },
  { value: 'otro', label: 'Otro' },
];

export const estadoLiquidacionOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'preliquidado', label: 'Preliquidado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'anulado', label: 'Anulado' },
];

export const tipoPrestacionOptions = [
  { value: 'cesantias', label: 'Cesantías' },
  { value: 'intereses_cesantias', label: 'Intereses Cesantías' },
  { value: 'prima_servicios', label: 'Prima de Servicios' },
  { value: 'vacaciones', label: 'Vacaciones' },
];

export const estadoPrestacionOptions = [
  { value: 'en_provision', label: 'En Provisión' },
  { value: 'liquidada', label: 'Liquidada' },
  { value: 'pagada', label: 'Pagada' },
];

export const metodoPagoOptions = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
];
