/**
 * Types para Accounting — alineados con serializers backend
 * DRF DecimalField retorna STRING, no number
 */

// ==================== COMMON ====================

interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== CONFIG CONTABLE ====================

// --- PlanCuentas ---
export interface PlanCuentasList {
  id: number;
  nombre: string;
  version: string;
  tipo_plan: 'comercial' | 'niif_pymes' | 'niif_plenas' | 'simplificado';
  tipo_plan_display: string;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
  es_activo: boolean;
  total_cuentas: number;
  created_at: string;
}

export interface PlanCuentas extends AuditFields {
  id: number;
  empresa: number;
  nombre: string;
  version: string;
  tipo_plan: 'comercial' | 'niif_pymes' | 'niif_plenas' | 'simplificado';
  tipo_plan_display: string;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
  es_activo: boolean;
  descripcion: string;
  total_cuentas: number;
}

// --- CuentaContable ---
export interface CuentaContableList {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  nivel_display: string;
  naturaleza: 'debito' | 'credito';
  naturaleza_display: string;
  tipo_cuenta: 'detalle' | 'titulo';
  clase_cuenta: string;
  clase_cuenta_display: string;
  acepta_movimientos: boolean;
  saldo_debito: string; // DecimalField
  saldo_credito: string; // DecimalField
  saldo_final: string; // DecimalField
  cuenta_padre: number | null;
  cuenta_padre_codigo: string | null;
  is_active: boolean;
}

export interface CuentaContable extends AuditFields {
  id: number;
  empresa: number;
  plan_cuentas: number;
  plan_cuentas_nombre: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  cuenta_padre: number | null;
  cuenta_padre_codigo: string | null;
  nivel: number;
  nivel_display: string;
  naturaleza: 'debito' | 'credito';
  naturaleza_display: string;
  tipo_cuenta: 'detalle' | 'titulo';
  tipo_cuenta_display: string;
  clase_cuenta: string;
  clase_cuenta_display: string;
  exige_tercero: boolean;
  exige_centro_costo: boolean;
  exige_base_retencion: boolean;
  permite_saldo_negativo: boolean;
  acepta_movimientos: boolean;
  saldo_debito: string; // DecimalField
  saldo_credito: string; // DecimalField
  saldo_final: string; // DecimalField
  es_cuenta_titulo: boolean;
  modulo_origen: string | null;
  total_subcuentas: number;
  is_active: boolean;
}

export interface CuentaContableTree {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  naturaleza: 'debito' | 'credito';
  tipo_cuenta: 'detalle' | 'titulo';
  clase_cuenta: string;
  acepta_movimientos: boolean;
  saldo_final: string; // DecimalField
  children: CuentaContableTree[];
}

// --- TipoDocumentoContable ---
export interface TipoDocumentoContableList {
  id: number;
  codigo: string;
  nombre: string;
  clase_documento: 'CD' | 'CE' | 'CI' | 'CA' | 'CC' | 'NC';
  clase_documento_display: string;
  prefijo: string;
  consecutivo_actual: number;
  requiere_aprobacion: boolean;
  afecta_contabilidad: boolean;
  is_active: boolean;
}

export interface TipoDocumentoContable extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  clase_documento: 'CD' | 'CE' | 'CI' | 'CA' | 'CC' | 'NC';
  clase_documento_display: string;
  prefijo: string;
  consecutivo_actual: number;
  usa_periodo_numeracion: boolean;
  requiere_aprobacion: boolean;
  afecta_contabilidad: boolean;
  descripcion: string;
  siguiente_consecutivo: number;
  is_active: boolean;
}

// --- Tercero ---
export interface TerceroList {
  id: number;
  tipo_identificacion: string;
  tipo_identificacion_display: string;
  numero_identificacion: string;
  identificacion_completa: string;
  razon_social: string;
  nombre_comercial: string | null;
  tipo_tercero: 'cliente' | 'proveedor' | 'empleado' | 'otro';
  tipo_tercero_display: string;
  tipo_persona: 'natural' | 'juridica';
  ciudad: string | null;
  is_active: boolean;
}

export interface Tercero extends AuditFields {
  id: number;
  empresa: number;
  tipo_identificacion: string;
  tipo_identificacion_display: string;
  numero_identificacion: string;
  digito_verificacion: string | null;
  identificacion_completa: string;
  razon_social: string;
  nombre_comercial: string | null;
  tipo_tercero: 'cliente' | 'proveedor' | 'empleado' | 'otro';
  tipo_tercero_display: string;
  tipo_persona: 'natural' | 'juridica';
  tipo_persona_display: string;
  responsable_iva: boolean;
  regimen: string;
  regimen_display: string;
  gran_contribuyente: boolean;
  autoretenedor: boolean;
  direccion: string;
  ciudad: string | null;
  telefono: string;
  email: string;
  is_active: boolean;
}

// --- CentroCostoContable ---
export interface CentroCostoContableList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_centro: string;
  tipo_centro_display: string;
  centro_padre: number | null;
  centro_padre_codigo: string | null;
  responsable: number | null;
  responsable_nombre: string | null;
  presupuesto_anual: string; // DecimalField
  is_active: boolean;
}

export interface CentroCostoContable extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  centro_padre: number | null;
  centro_padre_codigo: string | null;
  tipo_centro: string;
  tipo_centro_display: string;
  responsable: number | null;
  responsable_nombre: string | null;
  presupuesto_anual: string; // DecimalField
  descripcion: string;
  total_subcentros: number;
  is_active: boolean;
}

export interface CentroCostoContableTree {
  id: number;
  codigo: string;
  nombre: string;
  tipo_centro: string;
  presupuesto_anual: string; // DecimalField
  children: CentroCostoContableTree[];
}

// --- ConfiguracionModulo ---
export interface ConfiguracionModulo extends AuditFields {
  id: number;
  empresa: number;
  plan_cuentas_activo: number | null;
  plan_cuentas_nombre: string | null;
  periodo_actual: number;
  fecha_inicio_ejercicio: string;
  fecha_fin_ejercicio: string;
  ultimo_periodo_cerrado: number;
  permite_modificar_periodos_cerrados: boolean;
  cuenta_utilidad_ejercicio: number | null;
  cuenta_utilidad_codigo: string | null;
  cuenta_perdida_ejercicio: number | null;
  cuenta_perdida_codigo: string | null;
  cuenta_ganancias_retenidas: number | null;
  cuenta_ganancias_codigo: string | null;
  contabiliza_automatico_pagos: boolean;
  contabiliza_automatico_recaudos: boolean;
  contabiliza_automatico_nomina: boolean;
  contabiliza_automatico_inventarios: boolean;
  decimales_moneda: number;
  exige_cuadre_comprobantes: boolean;
  exige_centro_costo_gastos: boolean;
  ejercicio_abierto: boolean;
  is_active: boolean;
}

// ==================== MOVIMIENTOS ====================

// --- DetalleComprobante ---
export interface DetalleComprobante {
  id: number;
  secuencia: number;
  cuenta: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  descripcion: string;
  debito: string; // DecimalField
  credito: string; // DecimalField
  monto: string; // DecimalField (computed)
  tercero: number | null;
  tercero_nombre: string | null;
  centro_costo: number | null;
  centro_costo_nombre: string | null;
  base_retencion: string | null; // DecimalField
  tipo_documento_soporte: string | null;
  numero_documento_soporte: string | null;
  created_at: string;
  updated_at: string;
}

// --- ComprobanteContable ---
export interface ComprobanteContableList {
  id: number;
  numero_comprobante: string;
  tipo_documento: number;
  tipo_documento_codigo: string;
  tipo_documento_nombre: string;
  periodo: number;
  fecha_comprobante: string;
  concepto: string;
  total_debito: string; // DecimalField
  total_credito: string; // DecimalField
  estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'contabilizado' | 'anulado';
  estado_display: string;
  esta_cuadrado: boolean;
  diferencia: string; // DecimalField
  origen_automatico: boolean;
  modulo_origen: string | null;
  created_at: string;
}

export interface ComprobanteContable extends AuditFields {
  id: number;
  empresa: number;
  numero_comprobante: string;
  tipo_documento: number;
  tipo_documento_codigo: string;
  tipo_documento_nombre: string;
  periodo: number;
  fecha_comprobante: string;
  fecha_elaboracion: string;
  concepto: string;
  total_debito: string; // DecimalField
  total_credito: string; // DecimalField
  estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'contabilizado' | 'anulado';
  estado_display: string;
  requiere_aprobacion: boolean;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  fecha_aprobacion: string | null;
  origen_automatico: boolean;
  modulo_origen: string | null;
  documento_origen_id: number | null;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  anulado_por: number | null;
  anulado_por_nombre: string | null;
  notas: string;
  esta_cuadrado: boolean;
  diferencia: string; // DecimalField
  detalles: DetalleComprobante[];
  is_active: boolean;
}

export interface ComprobanteContableCreate {
  tipo_documento: number;
  fecha_comprobante: string;
  concepto: string;
  requiere_aprobacion?: boolean;
  notas?: string;
  detalles: Omit<
    DetalleComprobante,
    | 'id'
    | 'secuencia'
    | 'cuenta_codigo'
    | 'cuenta_nombre'
    | 'monto'
    | 'tercero_nombre'
    | 'centro_costo_nombre'
    | 'created_at'
    | 'updated_at'
  >[];
}

// --- SecuenciaDocumento ---
export interface SecuenciaDocumento {
  id: number;
  empresa: number;
  tipo_documento: number;
  tipo_documento_codigo: string;
  tipo_documento_nombre: string;
  periodo: number;
  consecutivo_actual: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- AsientoPlantilla ---
export interface AsientoPlantillaList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_documento: number;
  tipo_documento_codigo: string;
  es_recurrente: boolean;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual' | null;
  frecuencia_display: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AsientoPlantilla extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_documento: number;
  tipo_documento_codigo: string;
  tipo_documento_nombre: string;
  es_recurrente: boolean;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual' | null;
  frecuencia_display: string | null;
  estructura_json: Record<string, unknown>;
  is_active: boolean;
}

// ==================== INFORMES CONTABLES ====================

// --- LineaInforme ---
export interface LineaInforme {
  id: number;
  secuencia: number;
  codigo_linea: string;
  descripcion: string;
  tipo_linea: 'cuenta' | 'rango' | 'formula' | 'titulo' | 'subtotal' | 'total';
  tipo_linea_display: string;
  cuenta_desde: number | null;
  cuenta_desde_codigo: string | null;
  cuenta_hasta: number | null;
  cuenta_hasta_codigo: string | null;
  formula: string | null;
  nivel_indentacion: number;
  negrita: boolean;
  created_at: string;
  updated_at: string;
}

// --- InformeContable ---
export interface InformeContableList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_informe:
    | 'balance_general'
    | 'estado_resultados'
    | 'flujo_efectivo'
    | 'cambios_patrimonio'
    | 'auxiliar_cuentas'
    | 'balance_prueba'
    | 'personalizado';
  tipo_informe_display: string;
  nivel_detalle: number;
  nivel_detalle_display: string;
  incluye_saldo_cero: boolean;
  total_lineas: number;
  is_active: boolean;
  created_at: string;
}

export interface InformeContable extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo_informe:
    | 'balance_general'
    | 'estado_resultados'
    | 'flujo_efectivo'
    | 'cambios_patrimonio'
    | 'auxiliar_cuentas'
    | 'balance_prueba'
    | 'personalizado';
  tipo_informe_display: string;
  nivel_detalle: number;
  nivel_detalle_display: string;
  incluye_saldo_cero: boolean;
  descripcion: string;
  lineas: LineaInforme[];
  is_active: boolean;
}

// --- GeneracionInforme ---
export interface GeneracionInformeList {
  id: number;
  informe: number;
  informe_nombre: string;
  informe_tipo: string;
  fecha_desde: string;
  fecha_hasta: string;
  estado: 'generando' | 'completado' | 'error';
  estado_display: string;
  archivo_pdf: string | null;
  archivo_excel: string | null;
  created_at: string;
}

export interface GeneracionInforme extends AuditFields {
  id: number;
  empresa: number;
  informe: number;
  informe_nombre: string;
  informe_codigo: string;
  informe_tipo: string;
  fecha_desde: string;
  fecha_hasta: string;
  centro_costo: number | null;
  centro_costo_nombre: string | null;
  resultado_json: Record<string, unknown> | null;
  archivo_pdf: string | null;
  archivo_excel: string | null;
  estado: 'generando' | 'completado' | 'error';
  estado_display: string;
  mensaje_error: string | null;
  is_active: boolean;
}

// ==================== INTEGRACION ====================

// --- ParametrosIntegracion ---
export interface ParametrosIntegracionList {
  id: number;
  modulo: 'tesoreria' | 'nomina' | 'inventarios' | 'activos_fijos' | 'ventas' | 'compras';
  modulo_display: string;
  clave: string;
  descripcion: string;
  cuenta_contable: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  activo: boolean;
}

export interface ParametrosIntegracion extends AuditFields {
  id: number;
  empresa: number;
  modulo: 'tesoreria' | 'nomina' | 'inventarios' | 'activos_fijos' | 'ventas' | 'compras';
  modulo_display: string;
  clave: string;
  descripcion: string;
  cuenta_contable: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  configuracion_json: Record<string, unknown> | null;
  activo: boolean;
  is_active: boolean;
}

// --- LogIntegracion ---
export interface LogIntegracionList {
  id: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  estado: 'pendiente' | 'procesando' | 'exitoso' | 'error' | 'revertido';
  estado_display: string;
  comprobante: number | null;
  comprobante_numero: string | null;
  created_at: string;
}

export interface LogIntegracion {
  id: number;
  empresa: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  comprobante: number | null;
  comprobante_numero: string | null;
  comprobante_tipo: string | null;
  estado: 'pendiente' | 'procesando' | 'exitoso' | 'error' | 'revertido';
  estado_display: string;
  descripcion: string;
  datos_json: Record<string, unknown> | null;
  mensaje_error: string | null;
  created_at: string;
  procesado_at: string | null;
  created_by: number | null;
}

// --- ColaContabilizacion ---
export interface ColaContabilizacionList {
  id: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  prioridad: number;
  prioridad_display: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  estado_display: string;
  intentos: number;
  max_intentos: number;
  created_at: string;
}

export interface ColaContabilizacion {
  id: number;
  empresa: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  prioridad: number;
  prioridad_display: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  estado_display: string;
  datos_json: Record<string, unknown> | null;
  comprobante_generado: number | null;
  comprobante_numero: string | null;
  mensaje_error: string | null;
  intentos: number;
  max_intentos: number;
  puede_reintentar: boolean;
  created_at: string;
  procesado_at: string | null;
  proximo_intento_at: string | null;
}
