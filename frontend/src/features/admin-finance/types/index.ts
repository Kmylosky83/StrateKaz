/**
 * Types para Admin Finance
 */

// ==================== TESORERÍA ====================

export interface CuentaBancaria {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  tipo_cuenta: 'ahorros' | 'corriente' | 'fiducia' | 'cdt' | 'otro';
  banco: string;
  numero_cuenta: string;
  saldo_inicial: number;
  saldo_actual: number;
  moneda: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovimientoBancario {
  id: number;
  empresa: number;
  cuenta: number;
  cuenta_nombre?: string;
  tipo_movimiento: 'ingreso' | 'egreso' | 'transferencia' | 'nota_debito' | 'nota_credito';
  numero_documento: string;
  fecha: string;
  concepto: string;
  valor: number;
  saldo_anterior: number;
  saldo_posterior: number;
  tercero?: number;
  tercero_nombre?: string;
  referencia?: string;
  conciliado: boolean;
  created_at: string;
}

export interface FlujoCaja {
  id: number;
  empresa: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  saldo_inicial: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_final: number;
  estado: 'borrador' | 'cerrado';
  created_at: string;
}

export interface ConciliacionBancaria {
  id: number;
  cuenta: number;
  cuenta_nombre?: string;
  periodo: string;
  saldo_libros: number;
  saldo_extracto: number;
  diferencia: number;
  estado: 'pendiente' | 'conciliada' | 'descuadrada';
  fecha_conciliacion?: string;
  created_at: string;
}

export interface ProgramacionPago {
  id: number;
  empresa: number;
  cuenta: number;
  cuenta_nombre?: string;
  proveedor: number;
  proveedor_nombre?: string;
  concepto: string;
  valor: number;
  fecha_vencimiento: string;
  fecha_programada?: string;
  estado: 'pendiente' | 'programado' | 'pagado' | 'vencido';
  prioridad: 'alta' | 'media' | 'baja';
  created_at: string;
}

export interface CajaChica {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  responsable: number;
  responsable_nombre?: string;
  fondo_fijo: number;
  saldo_actual: number;
  estado: 'activa' | 'cerrada' | 'en_reembolso';
  created_at: string;
}

// ==================== PRESUPUESTO ====================

export interface PresupuestoAnual {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  periodo_fiscal: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto_total: number;
  estado: 'borrador' | 'aprobado' | 'en_ejecucion' | 'cerrado';
  created_at: string;
}

export interface RubroPresupuestal {
  id: number;
  presupuesto: number;
  codigo: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto';
  monto_asignado: number;
  monto_ejecutado: number;
  monto_disponible: number;
  porcentaje_ejecucion: number;
  rubro_padre?: number;
  nivel: number;
  created_at: string;
}

export interface EjecucionPresupuestal {
  id: number;
  rubro: number;
  rubro_codigo?: string;
  rubro_nombre?: string;
  tipo_ejecucion: 'compromiso' | 'causacion' | 'pago';
  numero_documento: string;
  fecha: string;
  concepto: string;
  valor: number;
  tercero?: number;
  tercero_nombre?: string;
  created_at: string;
}

export interface CdpCrp {
  id: number;
  empresa: number;
  tipo: 'cdp' | 'crp';
  numero: string;
  fecha: string;
  objeto: string;
  valor: number;
  tercero: number;
  tercero_nombre?: string;
  estado: 'vigente' | 'ejecutado' | 'anulado';
  created_at: string;
}

export interface TrasladorPresupuestal {
  id: number;
  empresa: number;
  numero: string;
  fecha: string;
  rubro_origen: number;
  rubro_destino: number;
  valor: number;
  justificacion: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
}

// ==================== ACTIVOS FIJOS ====================

export interface ActivoFijo {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: number;
  categoria_nombre?: string;
  ubicacion: number;
  ubicacion_nombre?: string;
  responsable: number;
  responsable_nombre?: string;
  proveedor?: number;
  proveedor_nombre?: string;
  numero_factura?: string;
  fecha_adquisicion: string;
  costo_adquisicion: number;
  valor_residual: number;
  vida_util_meses: number;
  metodo_depreciacion: 'linea_recta' | 'doble_declive' | 'unidades_producidas';
  depreciacion_acumulada: number;
  valor_libros: number;
  estado: 'activo' | 'en_mantenimiento' | 'dado_de_baja' | 'vendido';
  created_at: string;
}

export interface CategoriaActivo {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  cuenta_contable?: number;
  cuenta_depreciacion?: number;
  vida_util_default: number;
  metodo_default: 'linea_recta' | 'doble_declive' | 'unidades_producidas';
  activa: boolean;
  created_at: string;
}

export interface UbicacionActivo {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  responsable?: number;
  responsable_nombre?: string;
  activa: boolean;
  created_at: string;
}

export interface DepreciacionMensual {
  id: number;
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;
  periodo: string;
  valor_inicial: number;
  depreciacion: number;
  depreciacion_acumulada: number;
  valor_final: number;
  created_at: string;
}

export interface MovimientoActivo {
  id: number;
  activo: number;
  activo_codigo?: string;
  tipo_movimiento: 'traslado' | 'mantenimiento' | 'mejora' | 'baja' | 'venta';
  fecha: string;
  ubicacion_origen?: number;
  ubicacion_destino?: number;
  responsable_origen?: number;
  responsable_destino?: number;
  descripcion: string;
  costo?: number;
  created_at: string;
}

export interface MantenimientoActivo {
  id: number;
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;
  tipo_mantenimiento: 'preventivo' | 'correctivo' | 'predictivo';
  fecha_programada?: string;
  fecha_ejecucion?: string;
  proveedor?: number;
  proveedor_nombre?: string;
  descripcion: string;
  costo: number;
  estado: 'programado' | 'en_proceso' | 'completado' | 'cancelado';
  created_at: string;
}

// ==================== SERVICIOS GENERALES ====================

export interface ContratoServicio {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  proveedor: number;
  proveedor_nombre?: string;
  tipo_servicio: 'arrendamiento' | 'vigilancia' | 'aseo' | 'mantenimiento' | 'comunicaciones' | 'servicios_publicos' | 'seguros' | 'otro';
  fecha_inicio: string;
  fecha_fin?: string;
  valor_mensual: number;
  forma_pago: 'mensual' | 'bimestral' | 'trimestral' | 'anual';
  estado: 'activo' | 'suspendido' | 'terminado' | 'vencido';
  renovacion_automatica: boolean;
  created_at: string;
}

export interface GastoOperativo {
  id: number;
  empresa: number;
  contrato?: number;
  contrato_nombre?: string;
  categoria: 'arrendamiento' | 'servicios_publicos' | 'aseo_cafeteria' | 'vigilancia' | 'comunicaciones' | 'papeleria' | 'transporte' | 'varios';
  concepto: string;
  proveedor?: number;
  proveedor_nombre?: string;
  numero_factura?: string;
  fecha: string;
  valor: number;
  iva?: number;
  retencion?: number;
  valor_neto: number;
  estado: 'registrado' | 'aprobado' | 'pagado' | 'anulado';
  created_at: string;
}

export interface ConsumoServicioPublico {
  id: number;
  empresa: number;
  contrato?: number;
  tipo_servicio: 'energia' | 'agua' | 'gas' | 'telefono' | 'internet';
  periodo: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo: number;
  unidad_medida: string;
  valor_consumo: number;
  otros_cargos: number;
  valor_total: number;
  fecha_vencimiento: string;
  estado: 'pendiente' | 'pagado' | 'vencido';
  created_at: string;
}

// ==================== STATS & SUMMARY TYPES ====================

export interface TesoreriaStats {
  saldo_total_bancos: number;
  ingresos_mes: number;
  egresos_mes: number;
  pagos_pendientes: number;
  pagos_vencidos: number;
  cuentas_activas: number;
}

export interface PresupuestoStats {
  presupuesto_total: number;
  ejecutado: number;
  comprometido: number;
  disponible: number;
  porcentaje_ejecucion: number;
  rubros_sobre_ejecutados: number;
}

export interface ActivosFijosStats {
  total_activos: number;
  valor_adquisicion: number;
  depreciacion_acumulada: number;
  valor_libros: number;
  activos_en_mantenimiento: number;
  proximas_depreciaciones: number;
}

export interface ServiciosGeneralesStats {
  contratos_activos: number;
  gastos_mes: number;
  presupuesto_mensual: number;
  consumo_energia: number;
  consumo_agua: number;
  facturas_pendientes: number;
}
