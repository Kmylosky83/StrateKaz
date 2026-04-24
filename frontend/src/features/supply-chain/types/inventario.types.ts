/**
 * Types TS para Dashboard de Almacén e Inventario por producto.
 *
 * Fase 1 — contratos acordados con agent B backend:
 *   GET /supply-chain/catalogos/almacenes/<id>/dashboard/
 *   GET /supply-chain/catalogos/almacenes/<id>/kardex/?producto=&desde=&hasta=&tipo=
 *   GET /supply-chain/catalogos/almacenes/resumen-general/
 */

// ==================== RESUMEN GENERAL (landing SC) ====================

export interface ResumenGeneralSC {
  total_almacenes: number;
  /** Productos distintos con inventario. */
  total_productos_stock: number;
  /** Cantidad total global sumada de todos los almacenes. */
  total_cantidad_global: number | string;
  /** Alertas activas no resueltas. */
  alertas_pendientes: number;
  /** Ocupación promedio (%) de los almacenes con capacidad definida. */
  ocupacion_promedio?: number | string;
  /** Top 5 productos por cantidad global. */
  top_productos?: ResumenTopProducto[];
  /** Almacenes agregados — ocupación, stock, última recepción, alertas. */
  almacenes?: AlmacenResumenItem[];
}

export interface ResumenTopProducto {
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  cantidad_total: number | string;
  almacenes_count: number;
}

export interface AlmacenResumenItem {
  id: number;
  codigo: string;
  nombre: string;
  is_active: boolean;
  tipo_almacen_nombre?: string | null;
  sede_nombre?: string | null;
  /** Decimal serializado como string desde DRF. */
  cantidad_total: number | string;
  capacidad_maxima?: number | string | null;
  /** 0-100 como Decimal/string. Si no hay capacidad definida, null. */
  ocupacion_pct?: number | string | null;
  productos_distintos: number;
  /** ISO datetime de la última recepción que impactó el almacén. */
  ultima_recepcion?: string | null;
  /** Días transcurridos desde última recepción. */
  dias_desde_ultima_recepcion?: number | null;
  alertas_activas?: number;
}

// ==================== DASHBOARD DETALLE ====================

export interface ProductoInventarioEntry {
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  cantidad_total: number;
  unidad_codigo: string;
  /**
   * Promedio ponderado de calidad por producto — el backend devuelve el rango
   * dominante (moda ponderada por cantidad) y el valor ponderado si aplica.
   */
  calidad_rango_codigo?: string | null;
  calidad_rango_nombre?: string | null;
  calidad_rango_color?: string | null;
  calidad_valor_ponderado?: number | string | null;
  parametro_calidad_nombre?: string | null;
}

export interface AlertaActivaEntry {
  id: number;
  tipo_alerta_nombre?: string;
  prioridad?: string;
  mensaje?: string;
  inventario_producto?: string;
  fecha_alerta?: string;
}

export interface AlmacenDashboard {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  sede_nombre?: string | null;
  tipo_almacen_nombre?: string | null;
  cantidad_total: number;
  capacidad_maxima?: number | null;
  ocupacion_pct?: number | null;
  productos_distintos: number;
  movimientos_30d?: number;
  alertas_activas?: number;
  inventario_por_producto: ProductoInventarioEntry[];
  alertas?: AlertaActivaEntry[];
}

// ==================== KARDEX ====================

export type TipoAfectacion = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface KardexEntry {
  id: number;
  fecha: string;
  tipo_movimiento_codigo?: string;
  tipo_movimiento_nombre?: string;
  afectacion_stock: TipoAfectacion;
  producto_id?: number;
  producto_nombre?: string;
  cantidad: number;
  unidad_codigo?: string;
  saldo_despues?: number;
  usuario_nombre?: string;
  referencia?: string;
  observaciones?: string;
}

export interface KardexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: KardexEntry[];
}

export interface KardexFilterParams {
  producto?: number;
  desde?: string;
  hasta?: string;
  tipo?: TipoAfectacion;
  page?: number;
  page_size?: number;
}
