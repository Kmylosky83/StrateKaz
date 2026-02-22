/**
 * Types para Admin Finance - Alineados con serializers del backend
 * DRF DecimalField retorna STRING - usar Number() antes de .toFixed()
 */

// ==================== BASE AUDIT FIELDS ====================

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

// ==================== PRESUPUESTO ====================

export interface CentroCosto extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  area: number | null;
  area_nombre: string | null;
  responsable: number | null;
  responsable_nombre: string | null;
  estado: 'activo' | 'inactivo';
  estado_display: string;
}

export interface CentroCostoList {
  id: number;
  codigo: string;
  nombre: string;
  area_nombre: string | null;
  estado: string;
  estado_display: string;
}

export interface Rubro extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  tipo_display: string;
  categoria: string;
  categoria_display: string;
  descripcion: string;
  rubro_padre: number | null;
  rubro_padre_nombre: string | null;
  subrubros: RubroList[];
}

export interface RubroList {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  tipo_display: string;
  categoria: string;
  categoria_display: string;
}

export interface PresupuestoPorArea extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  area: number | null;
  area_nombre: string | null;
  centro_costo: number | null;
  centro_costo_nombre: string | null;
  rubro: number;
  rubro_nombre: string;
  rubro_tipo: string;
  anio: number;
  monto_asignado: string;
  monto_ejecutado: string;
  saldo_disponible: string;
  porcentaje_ejecucion: string;
  estado: 'borrador' | 'aprobado' | 'en_ejecucion' | 'cerrado';
  estado_display: string;
  observaciones: string;
}

export interface PresupuestoPorAreaList {
  id: number;
  codigo: string;
  area_nombre: string | null;
  centro_costo_nombre: string | null;
  rubro_nombre: string;
  anio: number;
  monto_asignado: string;
  monto_ejecutado: string;
  saldo_disponible: string;
  porcentaje_ejecucion: string;
  estado: string;
  estado_display: string;
}

export interface Aprobacion extends AuditFields {
  id: number;
  empresa: number;
  presupuesto: number;
  presupuesto_codigo: string;
  nivel_aprobacion: string;
  nivel_aprobacion_display: string;
  orden: number;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  fecha_aprobacion: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  estado_display: string;
  observaciones: string;
}

export interface AprobacionList {
  id: number;
  presupuesto_codigo: string;
  nivel_aprobacion: string;
  nivel_aprobacion_display: string;
  orden: number;
  aprobado_por_nombre: string | null;
  fecha_aprobacion: string | null;
  estado: string;
  estado_display: string;
}

export interface Ejecucion extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  presupuesto: number;
  presupuesto_codigo: string;
  presupuesto_area: string | null;
  presupuesto_rubro: string;
  presupuesto_saldo_disponible: string;
  fecha: string;
  monto: string;
  concepto: string;
  documento_soporte: string | null;
  numero_documento: string;
  estado: 'registrada' | 'aprobada' | 'anulada';
  estado_display: string;
  observaciones: string;
}

export interface EjecucionList {
  id: number;
  codigo: string;
  fecha: string;
  monto: string;
  concepto: string;
  presupuesto_codigo: string;
  presupuesto_area: string | null;
  presupuesto_rubro: string;
  estado: string;
  estado_display: string;
}

// ==================== ACTIVOS FIJOS ====================

export interface CategoriaActivo extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  vida_util_anios: number;
  vida_util_meses: number;
  metodo_depreciacion: 'linea_recta' | 'saldos_decrecientes' | 'unidades_produccion';
  metodo_depreciacion_display: string;
  cantidad_activos: number;
}

export interface CategoriaActivoList {
  id: number;
  codigo: string;
  nombre: string;
  vida_util_anios: number;
  metodo_depreciacion: string;
  metodo_depreciacion_display: string;
}

export interface ActivoFijo extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  categoria: number;
  categoria_codigo: string;
  categoria_nombre: string;
  nombre: string;
  descripcion: string;
  numero_serie: string;
  marca: string;
  modelo: string;
  fecha_adquisicion: string;
  valor_adquisicion: string;
  valor_residual: string;
  valor_depreciable: string;
  depreciacion_mensual: string;
  depreciacion_acumulada: string;
  valor_en_libros: string;
  meses_desde_adquisicion: number;
  porcentaje_depreciacion: string;
  ubicacion: string;
  area: number | null;
  area_nombre: string | null;
  responsable: number | null;
  responsable_nombre: string | null;
  estado: 'activo' | 'en_mantenimiento' | 'dado_de_baja' | 'vendido';
  estado_display: string;
  observaciones: string;
}

export interface ActivoFijoList {
  id: number;
  codigo: string;
  nombre: string;
  categoria_nombre: string;
  area_nombre: string | null;
  fecha_adquisicion: string;
  valor_adquisicion: string;
  valor_en_libros: string;
  estado: string;
  estado_display: string;
  ubicacion: string;
}

export interface HojaVidaActivo extends AuditFields {
  id: number;
  empresa: number;
  codigo: string;
  activo: number;
  activo_codigo: string;
  activo_nombre: string;
  tipo_evento: 'mantenimiento' | 'reparacion' | 'mejora' | 'traslado' | 'otro';
  tipo_evento_display: string;
  fecha: string;
  descripcion: string;
  costo: string;
  realizado_por: number | null;
  realizado_por_nombre: string | null;
  documento_soporte: string | null;
}

export interface HojaVidaActivoList {
  id: number;
  codigo: string;
  activo_codigo: string;
  tipo_evento: string;
  tipo_evento_display: string;
  fecha: string;
  descripcion: string;
  costo: string;
}

export interface ProgramaMantenimiento extends AuditFields {
  id: number;
  empresa: number;
  activo: number;
  activo_codigo: string;
  activo_nombre: string;
  tipo: 'preventivo' | 'correctivo' | 'predictivo';
  tipo_display: string;
  descripcion: string;
  frecuencia_dias: number;
  ultima_fecha: string | null;
  proxima_fecha: string;
  dias_para_mantenimiento: number;
  esta_vencido: boolean;
  responsable: number | null;
  responsable_nombre: string | null;
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
  estado_display: string;
  observaciones: string;
}

export interface ProgramaMantenimientoList {
  id: number;
  activo_codigo: string;
  tipo: string;
  tipo_display: string;
  proxima_fecha: string;
  dias_para_mantenimiento: number;
  estado: string;
  estado_display: string;
}

export interface Depreciacion extends AuditFields {
  id: number;
  empresa: number;
  activo: number;
  activo_codigo: string;
  activo_nombre: string;
  periodo_mes: number;
  periodo_anio: number;
  periodo_label: string;
  valor_inicial: string;
  depreciacion_periodo: string;
  depreciacion_acumulada: string;
  valor_en_libros: string;
}

export interface DepreciacionList {
  id: number;
  activo_codigo: string;
  periodo_label: string;
  depreciacion_periodo: string;
  depreciacion_acumulada: string;
  valor_en_libros: string;
}

export interface BajaActivo extends AuditFields {
  id: number;
  empresa: number;
  activo: number;
  activo_codigo: string;
  activo_nombre: string;
  activo_valor_residual_estimado: string;
  fecha_baja: string;
  motivo: 'obsolescencia' | 'dano' | 'venta' | 'donacion' | 'hurto' | 'otro';
  motivo_display: string;
  valor_residual_real: string;
  diferencia_valor_residual: string;
  acta_baja: string | null;
  observaciones: string;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  fecha_aprobacion: string | null;
}

export interface BajaActivoList {
  id: number;
  activo_codigo: string;
  activo_nombre: string;
  fecha_baja: string;
  motivo: string;
  motivo_display: string;
  valor_residual_real: string;
}

// ==================== SERVICIOS GENERALES ====================

export interface MantenimientoLocativo extends AuditFields {
  id: number;
  empresa: number;
  empresa_nombre: string;
  codigo: string;
  tipo: 'preventivo' | 'correctivo' | 'mejora';
  tipo_display: string;
  ubicacion: string;
  descripcion_trabajo: string;
  fecha_solicitud: string;
  fecha_programada: string | null;
  fecha_ejecucion: string | null;
  responsable: number | null;
  responsable_nombre: string;
  proveedor: number | null;
  proveedor_nombre: string | null;
  costo_estimado: string;
  costo_real: string | null;
  variacion_costo: string;
  porcentaje_variacion: string;
  estado: 'solicitado' | 'programado' | 'en_ejecucion' | 'completado' | 'cancelado';
  estado_display: string;
  observaciones: string;
  dias_hasta_programacion: number;
}

export interface MantenimientoLocativoList {
  id: number;
  codigo: string;
  tipo: string;
  tipo_display: string;
  ubicacion: string;
  fecha_solicitud: string;
  fecha_programada: string | null;
  responsable_nombre: string;
  proveedor_nombre: string | null;
  costo_estimado: string;
  costo_real: string | null;
  estado: string;
  estado_display: string;
}

export interface ServicioPublico extends AuditFields {
  id: number;
  empresa: number;
  empresa_nombre: string;
  codigo: string;
  tipo_servicio: 'energia' | 'agua' | 'gas' | 'telefonia' | 'internet' | 'alcantarillado' | 'otro';
  tipo_servicio_display: string;
  proveedor_nombre: string; // plain field, not FK
  numero_cuenta: string;
  ubicacion: string;
  periodo_mes: number;
  periodo_anio: number;
  fecha_vencimiento: string;
  valor: string;
  estado_pago: 'pendiente' | 'pagado' | 'vencido';
  estado_pago_display: string;
  consumo: string | null;
  unidad_medida: string;
  observaciones: string;
  dias_para_vencimiento: number;
  esta_vencido: boolean;
  proximo_a_vencer: boolean;
}

export interface ServicioPublicoList {
  id: number;
  codigo: string;
  tipo_servicio: string;
  tipo_servicio_display: string;
  proveedor_nombre: string;
  periodo_mes: number;
  periodo_anio: number;
  fecha_vencimiento: string;
  valor: string;
  estado_pago: string;
  estado_pago_display: string;
  esta_vencido: boolean;
  proximo_a_vencer: boolean;
}

export interface ContratoServicio extends AuditFields {
  id: number;
  empresa: number;
  empresa_nombre: string;
  codigo: string;
  proveedor: number | null;
  proveedor_nombre: string | null;
  proveedor_nit: string | null;
  tipo_servicio: string;
  tipo_servicio_display: string;
  objeto: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  valor_mensual: string;
  valor_total: string;
  frecuencia_pago: string;
  frecuencia_pago_display: string;
  estado: 'vigente' | 'suspendido' | 'terminado' | 'vencido';
  estado_display: string;
  observaciones: string;
  dias_para_vencimiento: number;
  contrato_vigente: boolean;
  contrato_vencido: boolean;
  proximo_a_vencer: boolean;
  duracion_dias: number;
}

export interface ContratoServicioList {
  id: number;
  codigo: string;
  proveedor_nombre: string | null;
  tipo_servicio: string;
  tipo_servicio_display: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  valor_mensual: string;
  valor_total: string;
  estado: string;
  estado_display: string;
  contrato_vigente: boolean;
  proximo_a_vencer: boolean;
}

// ==================== STATS & DASHBOARD TYPES ====================

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

export interface ResumenEjecucion {
  total_asignado: string;
  total_ejecutado: string;
  total_disponible: string;
  porcentaje_ejecucion: string;
  por_area: Array<{
    area_nombre: string;
    monto_asignado: string;
    monto_ejecutado: string;
    porcentaje: string;
  }>;
}

export interface ActivosFijosEstadisticas {
  total_activos: number;
  valor_total_adquisicion: string;
  depreciacion_total_acumulada: string;
  valor_total_en_libros: string;
  por_estado: Record<string, number>;
  por_categoria: Array<{
    categoria_nombre: string;
    cantidad: number;
    valor_adquisicion: string;
  }>;
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
