/**
 * Types para Accounting
 */

// ==================== CONFIG CONTABLE ====================

export interface PlanCuentas {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo_plan: 'puc_colombia' | 'niif_pymes' | 'niif_plenas' | 'personalizado';
  estado: 'activo' | 'inactivo';
  descripcion?: string;
  created_at: string;
}

export interface CuentaContable {
  id: number;
  plan: number;
  codigo: string;
  nombre: string;
  nivel: number;
  naturaleza: 'debito' | 'credito';
  tipo_cuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo' | 'orden';
  padre?: number;
  permite_movimiento: boolean;
  requiere_tercero: boolean;
  requiere_centro_costo: boolean;
  activa: boolean;
  saldo_actual: number;
  created_at: string;
}

export interface TipoDocumentoContable {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  prefijo: string;
  consecutivo_actual: number;
  tipo: 'comprobante_egreso' | 'comprobante_ingreso' | 'nota_contable' | 'ajuste' | 'cierre';
  activo: boolean;
  created_at: string;
}

export interface Tercero {
  id: number;
  empresa: number;
  tipo_documento: 'CC' | 'NIT' | 'CE' | 'TI' | 'PP' | 'DIE';
  numero_documento: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_tercero: 'cliente' | 'proveedor' | 'empleado' | 'otro';
  direccion?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
}

export interface CentroCostoContable {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  padre?: number;
  nivel: number;
  activo: boolean;
  created_at: string;
}

export interface ConfiguracionModulo {
  id: number;
  empresa: number;
  ejercicio_actual: number;
  periodo_actual: number;
  fecha_cierre?: string;
  permite_movimientos_anteriores: boolean;
  created_at: string;
}

// ==================== MOVIMIENTOS ====================

export interface ComprobanteContable {
  id: number;
  empresa: number;
  tipo_documento: number;
  tipo_documento_nombre?: string;
  numero: string;
  fecha: string;
  concepto: string;
  tercero?: number;
  tercero_nombre?: string;
  total_debito: number;
  total_credito: number;
  diferencia: number;
  estado: 'borrador' | 'contabilizado' | 'anulado';
  created_at: string;
  detalles?: DetalleComprobante[];
}

export interface DetalleComprobante {
  id: number;
  comprobante: number;
  cuenta: number;
  cuenta_codigo?: string;
  cuenta_nombre?: string;
  tercero?: number;
  tercero_nombre?: string;
  centro_costo?: number;
  centro_costo_nombre?: string;
  concepto: string;
  debito: number;
  credito: number;
  created_at: string;
}

export interface SecuenciaDocumento {
  id: number;
  tipo_documento: number;
  tipo_documento_nombre?: string;
  ejercicio: number;
  prefijo: string;
  ultimo_numero: number;
  created_at: string;
}

export interface AsientoPlantilla {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_documento: number;
  tipo_documento_nombre?: string;
  activa: boolean;
  created_at: string;
}

// ==================== INFORMES CONTABLES ====================

export interface InformeContable {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo_informe: 'balance_general' | 'estado_resultados' | 'flujo_efectivo' | 'cambios_patrimonio' | 'auxiliar_cuentas' | 'balance_prueba' | 'personalizado';
  nivel_detalle: number;
  incluye_saldo_cero: boolean;
  descripcion?: string;
  created_at: string;
}

export interface LineaInforme {
  id: number;
  informe: number;
  secuencia: number;
  codigo_linea: string;
  descripcion: string;
  tipo_linea: 'cuenta' | 'rango' | 'formula' | 'titulo' | 'subtotal' | 'total';
  cuenta_desde?: number;
  cuenta_hasta?: number;
  formula?: string;
  nivel_indentacion: number;
  negrita: boolean;
  created_at: string;
}

export interface GeneracionInforme {
  id: number;
  empresa: number;
  informe: number;
  informe_nombre?: string;
  fecha_desde: string;
  fecha_hasta: string;
  centro_costo?: number;
  estado: 'generando' | 'completado' | 'error';
  resultado_json?: Record<string, unknown>;
  archivo_pdf?: string;
  archivo_excel?: string;
  mensaje_error?: string;
  created_at: string;
}

// ==================== INTEGRACIÓN ====================

export interface ParametrosIntegracion {
  id: number;
  empresa: number;
  modulo: 'tesoreria' | 'nomina' | 'inventarios' | 'activos_fijos' | 'ventas' | 'compras';
  clave: string;
  descripcion: string;
  cuenta_contable: number;
  cuenta_codigo?: string;
  cuenta_nombre?: string;
  configuracion_json?: Record<string, unknown>;
  activo: boolean;
  created_at: string;
}

export interface LogIntegracion {
  id: number;
  empresa: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  comprobante?: number;
  comprobante_numero?: string;
  estado: 'pendiente' | 'procesando' | 'exitoso' | 'error' | 'revertido';
  descripcion: string;
  datos_json?: Record<string, unknown>;
  mensaje_error?: string;
  created_at: string;
  procesado_at?: string;
}

export interface ColaContabilizacion {
  id: number;
  empresa: number;
  modulo_origen: string;
  documento_origen_tipo: string;
  documento_origen_id: number;
  prioridad: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  comprobante_generado?: number;
  mensaje_error?: string;
  intentos: number;
  max_intentos: number;
  created_at: string;
}

// ==================== STATS ====================

export interface AccountingStats {
  plan_cuentas: number;
  cuentas_activas: number;
  comprobantes_mes: number;
  total_debitos: number;
  total_creditos: number;
  diferencia: number;
  comprobantes_pendientes: number;
}
