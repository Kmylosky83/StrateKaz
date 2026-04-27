/**
 * Tipos TypeScript para VoucherRecoleccion (1 voucher = 1 parada).
 *
 * H-SC-RUTA-02 refactor 2 (2026-04-26): cada voucher es atómico (no tiene
 * líneas). El recolector emite un voucher por cada parada visitada.
 *
 * Endpoint: /api/supply-chain/recoleccion/vouchers/
 */

export const EstadoVoucherRecoleccion = {
  BORRADOR: 'BORRADOR',
  COMPLETADO: 'COMPLETADO',
} as const;

export type EstadoVoucherRecoleccion =
  (typeof EstadoVoucherRecoleccion)[keyof typeof EstadoVoucherRecoleccion];

export const ESTADO_VOUCHER_RECOLECCION_LABELS: Record<EstadoVoucherRecoleccion, string> = {
  BORRADOR: 'Borrador',
  COMPLETADO: 'Completado',
};

export interface VoucherRecoleccion {
  id: number;
  codigo: string;
  ruta: number;
  ruta_codigo?: string;
  ruta_nombre?: string;
  fecha_recoleccion: string;
  proveedor: number;
  proveedor_codigo?: string;
  proveedor_nombre?: string;
  producto: number;
  producto_codigo?: string;
  producto_nombre?: string;
  cantidad: string; // DRF Decimal
  operador: number;
  operador_nombre?: string;
  operador_cargo?: string | null;
  estado: EstadoVoucherRecoleccion;
  estado_display?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVoucherRecoleccionDTO {
  codigo?: string;
  ruta: number;
  fecha_recoleccion: string;
  proveedor: number;
  producto: number;
  cantidad: number | string;
  notas?: string;
}

export type UpdateVoucherRecoleccionDTO = Partial<CreateVoucherRecoleccionDTO> & {
  estado?: EstadoVoucherRecoleccion;
};

export interface VoucherRecoleccionFilterParams {
  ruta?: number;
  proveedor?: number;
  producto?: number;
  estado?: EstadoVoucherRecoleccion;
  fecha_recoleccion?: string;
  operador?: number;
  search?: string;
  ordering?: string;
}
