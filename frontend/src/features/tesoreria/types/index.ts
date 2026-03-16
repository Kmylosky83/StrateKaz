/**
 * Types para Tesoreria — Modulo V2 (Cascada)
 * Flujo de caja, cuentas bancarias, pagos, cobros
 */

// ==================== BASE ====================

interface AuditFields {
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

// ==================== TESORERIA ====================

export interface Banco extends AuditFields {
  id: number;
  empresa: number;
  entidad_bancaria: string;
  tipo_cuenta: 'ahorros' | 'corriente';
  tipo_cuenta_display: string;
  numero_cuenta: string;
  nombre_cuenta: string;
  saldo_actual: string; // DecimalField -> string
  saldo_disponible: string;
  saldo_comprometido: string;
  estado: 'activa' | 'inactiva' | 'bloqueada';
  estado_display: string;
  sucursal: string;
  responsable: number | null;
  responsable_nombre: string | null;
  observaciones: string;
}

export interface BancoList {
  id: number;
  entidad_bancaria: string;
  tipo_cuenta: string;
  tipo_cuenta_display: string;
  numero_cuenta: string;
  nombre_cuenta: string;
  saldo_actual: string;
  saldo_disponible: string;
  estado: string;
  estado_display: string;
}

export interface CuentaPorPagar extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  concepto: string;
  proveedor: number | null;
  proveedor_nombre: string | null;
  orden_compra: number | null;
  orden_compra_numero: string | null;
  liquidacion_nomina: number | null;
  liquidacion_numero: string | null;
  monto_total: string;
  monto_pagado: string;
  saldo_pendiente: string;
  fecha_documento: string;
  fecha_vencimiento: string;
  dias_para_vencimiento: number;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'anulada';
  estado_display: string;
  esta_vencida: boolean;
  observaciones: string;
}

export interface CuentaPorPagarList {
  id: number;
  codigo: string;
  concepto: string;
  proveedor_nombre: string | null;
  monto_total: string;
  monto_pagado: string;
  saldo_pendiente: string;
  fecha_vencimiento: string;
  dias_para_vencimiento: number;
  estado: string;
  estado_display: string;
}

export interface CuentaPorCobrar extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  concepto: string;
  cliente: number | null;
  cliente_nombre: string | null;
  factura: number | null;
  factura_numero: string | null;
  monto_total: string;
  monto_cobrado: string;
  saldo_pendiente: string;
  fecha_documento: string;
  fecha_vencimiento: string;
  dias_para_vencimiento: number;
  estado: 'pendiente' | 'parcial' | 'cobrada' | 'anulada';
  estado_display: string;
  esta_vencida: boolean;
  observaciones: string;
}

export interface CuentaPorCobrarList {
  id: number;
  codigo: string;
  concepto: string;
  cliente_nombre: string | null;
  monto_total: string;
  monto_cobrado: string;
  saldo_pendiente: string;
  fecha_vencimiento: string;
  dias_para_vencimiento: number;
  estado: string;
  estado_display: string;
}

export interface FlujoCaja extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  tipo: 'ingreso' | 'egreso';
  tipo_display: string;
  concepto: string;
  banco: number | null;
  banco_nombre: string | null;
  cuenta_por_pagar: number | null;
  cuenta_pagar_codigo: string | null;
  cuenta_por_cobrar: number | null;
  cuenta_cobrar_codigo: string | null;
  fecha: string;
  monto_proyectado: string;
  monto_real: string;
  variacion: string;
  porcentaje_cumplimiento: string;
  observaciones: string;
}

export interface FlujoCajaList {
  id: number;
  codigo: string;
  tipo: string;
  tipo_display: string;
  concepto: string;
  fecha: string;
  monto_proyectado: string;
  monto_real: string;
  variacion: string;
}

export interface Pago extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  cuenta_por_pagar: number;
  cuenta_por_pagar_codigo: string;
  cuenta_por_pagar_concepto: string;
  banco: number;
  banco_nombre: string;
  proveedor_nombre: string | null;
  fecha_pago: string;
  monto: string;
  metodo_pago: 'transferencia' | 'cheque' | 'efectivo' | 'pse';
  metodo_pago_display: string;
  referencia: string;
  comprobante: string | null;
  observaciones: string;
}

export interface PagoList {
  id: number;
  codigo: string;
  fecha_pago: string;
  monto: string;
  cuenta_concepto: string;
  proveedor_nombre: string | null;
  metodo_pago: string;
  metodo_pago_display: string;
  referencia: string;
}

export interface Recaudo extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  cuenta_por_cobrar: number;
  cuenta_por_cobrar_codigo: string;
  cuenta_por_cobrar_concepto: string;
  banco: number;
  banco_nombre: string;
  cliente_nombre: string | null;
  fecha_recaudo: string;
  monto: string;
  metodo_pago: 'transferencia' | 'cheque' | 'efectivo' | 'pse';
  metodo_pago_display: string;
  referencia: string;
  comprobante: string | null;
  observaciones: string;
}

export interface RecaudoList {
  id: number;
  codigo: string;
  fecha_recaudo: string;
  monto: string;
  cuenta_concepto: string;
  cliente_nombre: string | null;
  metodo_pago: string;
  metodo_pago_display: string;
  referencia: string;
}

// ==================== STATS ====================

export interface BancoSaldos {
  total_saldo_actual: string;
  total_saldo_disponible: string;
  total_saldo_comprometido: string;
  cuentas_activas: number;
  bancos: BancoList[];
}

export interface CuentaPorPagarEstadisticas {
  total_pendiente: string;
  total_vencido: string;
  cantidad_pendientes: number;
  cantidad_vencidas: number;
  proximas_a_vencer: number;
}

export interface CuentaPorCobrarEstadisticas {
  total_pendiente: string;
  total_vencido: string;
  cantidad_pendientes: number;
  cantidad_vencidas: number;
  proximas_a_vencer: number;
}

export interface FlujoCajaResumen {
  total_ingresos_proyectados: string;
  total_ingresos_reales: string;
  total_egresos_proyectados: string;
  total_egresos_reales: string;
  saldo_neto_proyectado: string;
  saldo_neto_real: string;
}

// ==================== PAGINATED RESPONSE ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
