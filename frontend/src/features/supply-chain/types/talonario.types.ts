/**
 * Tipos TypeScript — Transcripción de talonario manual desde planta.
 *
 * H-SC-TALONARIO: el operador de planta transcribe el talonario en papel
 * llenado por el conductor durante la ruta, generando N VoucherRecoleccion
 * en lote y asociándolos al VoucherRecepcion ya creado.
 *
 * Endpoint canónico: POST /api/supply-chain/recepcion/vouchers/{id}/asociar-talonario-planta/
 */

export interface ParadaTalonario {
  proveedor_id: number;
  producto_id: number;
  cantidad_kg: string;
  numero_talonario?: string;
  notas?: string;
}

export interface TranscribirTalonarioRequest {
  fecha_recoleccion: string;
  operador_id?: number;
  paradas: ParadaTalonario[];
}

export interface TranscribirTalonarioResponse {
  creados: Array<{
    id: number;
    codigo: string;
    proveedor: number;
    proveedor_nombre?: string;
    producto: number;
    producto_nombre?: string;
    cantidad: string | number;
    estado: string;
    numero_talonario?: string;
  }>;
  total: number;
  voucher_recepcion_id: number;
}
