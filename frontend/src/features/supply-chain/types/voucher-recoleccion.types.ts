/**
 * Tipos TypeScript para VoucherRecoleccion (recolección en ruta).
 *
 * H-SC-RUTA-02: documento que registra qué se recogió en cada parada.
 * Sin precios ni firmas — solo cargo+nombre del operador (auto).
 *
 * Endpoint: /api/supply-chain/recoleccion/vouchers/
 */

export const EstadoVoucherRecoleccion = {
  BORRADOR: 'BORRADOR',
  COMPLETADO: 'COMPLETADO',
  CONSOLIDADO: 'CONSOLIDADO',
} as const;

export type EstadoVoucherRecoleccion =
  (typeof EstadoVoucherRecoleccion)[keyof typeof EstadoVoucherRecoleccion];

export const ESTADO_VOUCHER_RECOLECCION_LABELS: Record<EstadoVoucherRecoleccion, string> = {
  BORRADOR: 'Borrador',
  COMPLETADO: 'Completado',
  CONSOLIDADO: 'Consolidado en recepción',
};

export interface LineaVoucherRecoleccion {
  id: number;
  voucher: number;
  proveedor: number;
  proveedor_nombre?: string;
  proveedor_codigo?: string;
  producto: number;
  producto_nombre?: string;
  producto_codigo?: string;
  cantidad: string; // DRF Decimal serializa como string
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoucherRecoleccion {
  id: number;
  codigo: string;
  ruta: number;
  ruta_codigo?: string;
  ruta_nombre?: string;
  fecha_recoleccion: string;
  operador: number;
  operador_nombre?: string;
  operador_cargo?: string | null;
  estado: EstadoVoucherRecoleccion;
  estado_display?: string;
  notas?: string;
  lineas: LineaVoucherRecoleccion[];
  total_lineas: number;
  total_kilos: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVoucherRecoleccionDTO {
  codigo?: string;
  ruta: number;
  fecha_recoleccion: string;
  notas?: string;
}

export type UpdateVoucherRecoleccionDTO = Partial<CreateVoucherRecoleccionDTO> & {
  estado?: EstadoVoucherRecoleccion;
};

export interface CreateLineaVoucherRecoleccionDTO {
  voucher: number;
  proveedor: number;
  producto: number;
  cantidad: number | string;
  notas?: string;
}

export type UpdateLineaVoucherRecoleccionDTO = Partial<CreateLineaVoucherRecoleccionDTO>;

export interface VoucherRecoleccionFilterParams {
  ruta?: number;
  estado?: EstadoVoucherRecoleccion;
  fecha_recoleccion?: string;
  operador?: number;
  search?: string;
  ordering?: string;
}
