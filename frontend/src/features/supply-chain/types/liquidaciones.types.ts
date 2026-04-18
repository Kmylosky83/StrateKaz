/**
 * Types TS para Liquidaciones (S3) — Liquidacion
 */

export type EstadoLiquidacion = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'ANULADA';

export interface Liquidacion {
  id: number;
  voucher: number;
  voucher_proveedor?: string;
  voucher_producto?: string;
  precio_kg_aplicado: string;
  peso_neto_kg: string;
  subtotal: string;
  ajuste_calidad_pct: string;
  ajuste_calidad_monto: string;
  total_liquidado: string;
  estado: EstadoLiquidacion;
  estado_display?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLiquidacionDTO {
  voucher: number;
  precio_kg_aplicado: number | string;
  peso_neto_kg: number | string;
  ajuste_calidad_pct?: number | string;
  observaciones?: string;
}

export type UpdateLiquidacionDTO = Partial<CreateLiquidacionDTO> & {
  estado?: EstadoLiquidacion;
};
