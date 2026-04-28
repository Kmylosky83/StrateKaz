/**
 * Types TS para Liquidaciones (H-SC-12)
 *
 * Refactor: Liquidacion ahora es "header + líneas" (una liquidación por
 * voucher con N líneas de detalle). Se agregan PagoLiquidacion para la
 * mini-tesorería.
 */

export type EstadoLiquidacion =
  | 'SUGERIDA'
  | 'AJUSTADA'
  | 'CONFIRMADA'
  | 'PAGADA'
  | 'ANULADA'
  // Legacy (deprecated tras H-SC-02). Mantenidos para datos pre-refactor.
  | 'BORRADOR'
  | 'APROBADA';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'PSE' | 'OTRO';

// ==================== LIQUIDACION (header) ====================

export interface LiquidacionLinea {
  id: number;
  voucher_linea: number;
  voucher_linea_producto_nombre?: string;
  voucher_linea_peso?: number | string;
  cantidad: number | string;
  precio_unitario: number | string;
  monto_base: number | string;
  ajuste_calidad_pct: number | string;
  ajuste_calidad_monto: number | string;
  monto_final: number | string;
  observaciones?: string;
}

export interface Liquidacion {
  id: number;
  /** Codigo legible LIQ-0001 */
  codigo: string;
  /** Numero consecutivo */
  numero: number;
  /** FK a VoucherRecepcion */
  voucher: number;
  voucher_proveedor_nombre?: string;
  voucher_fecha_viaje?: string;
  subtotal: number | string;
  ajuste_calidad_total: number | string;
  total: number | string;
  estado: EstadoLiquidacion;
  estado_display?: string;
  fecha_aprobacion?: string | null;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string | null;
  observaciones?: string;
  /** Solo en detail. En list usar `lineas_count`. */
  lineas_liquidacion?: LiquidacionLinea[];
  /** Solo en list (LiquidacionListSerializer). Para detail usar lineas_liquidacion.length. */
  lineas_count?: number;
  /** Pagos registrados (cuando estado=PAGADA) */
  pagos?: PagoLiquidacion[];
  documento_archivado_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLiquidacionDTO {
  voucher: number;
  observaciones?: string;
}

export type UpdateLiquidacionDTO = {
  observaciones?: string;
};

export interface AjustarLineaDTO {
  ajuste_calidad_pct: number | string;
  observaciones?: string;
}

// ==================== PAGO LIQUIDACION ====================

export interface PagoLiquidacion {
  id: number;
  liquidacion: number;
  liquidacion_codigo?: string;
  fecha_pago: string;
  metodo: MetodoPago;
  metodo_display?: string;
  referencia?: string;
  monto_pagado: number | string;
  observaciones?: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  created_at: string;
}

export interface CreatePagoLiquidacionDTO {
  liquidacion: number;
  fecha_pago: string;
  metodo: MetodoPago;
  referencia?: string;
  monto_pagado: number | string;
  observaciones?: string;
}
