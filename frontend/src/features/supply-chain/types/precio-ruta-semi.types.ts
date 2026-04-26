/**
 * Tipos TypeScript para Precios de Ruta Semi-Autónoma.
 *
 * H-SC-RUTA-02 Modelo 2: doble precio por (ruta, proveedor, producto):
 *   - precio_ruta_paga_proveedor: lo que la ruta paga al productor
 *   - precio_empresa_paga_ruta: lo que la empresa paga a la ruta
 *   - margen_ruta = diferencia (ingreso operativo de la ruta)
 *
 * Endpoint: /api/supply-chain/catalogos/precios-ruta-semi/
 */

export interface PrecioRutaSemi {
  id: number;
  ruta: number;
  ruta_codigo?: string;
  ruta_nombre?: string;
  proveedor: number;
  proveedor_codigo?: string;
  proveedor_nombre?: string;
  producto: number;
  producto_codigo?: string;
  producto_nombre?: string;
  precio_ruta_paga_proveedor: string; // DRF Decimal serializa como string
  precio_empresa_paga_ruta: string;
  margen_ruta?: string;
  is_active: boolean;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePrecioRutaSemiDTO {
  ruta: number;
  proveedor: number;
  producto: number;
  precio_ruta_paga_proveedor: number | string;
  precio_empresa_paga_ruta: number | string;
  is_active?: boolean;
  notas?: string;
}

export type UpdatePrecioRutaSemiDTO = Partial<CreatePrecioRutaSemiDTO>;

export interface PrecioRutaSemiFilterParams {
  ruta?: number;
  proveedor?: number;
  producto?: number;
  is_active?: boolean;
  search?: string;
}
