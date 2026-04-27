/**
 * Tipos TypeScript para Merma Resumen (H-SC-RUTA-04).
 *
 * Endpoint backend:
 *   GET /api/supply-chain/recepcion/vouchers/merma-resumen/
 *     ?ruta_id=X&fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
 *
 * Devuelve un array plano por voucher de recepción (sin paginar). Los
 * pesos llegan como string (DRF DecimalField) — convertir a Number en UI.
 */

export interface MermaResumenItem {
  voucher_id: number;
  fecha_viaje: string;
  ruta_id: number | null;
  ruta_codigo: string | null;
  peso_recolectado: string;
  peso_recibido: string;
  merma_kg: string;
  merma_porcentaje: string;
}

export interface MermaResumenFiltros {
  rutaIds?: number[];
  fechaDesde?: string;
  fechaHasta?: string;
}
