/**
 * Tipos TypeScript para Paradas de Ruta de Recolección.
 *
 * H-SC-RUTA-02: vínculo M2M Ruta ↔ Proveedor con metadata operativa
 * (orden de visita, frecuencia de pago al productor).
 *
 * Endpoint: /api/supply-chain/catalogos/rutas-paradas/
 */

export const FrecuenciaPago = {
  SEMANAL: 'SEMANAL',
  QUINCENAL: 'QUINCENAL',
  MENSUAL: 'MENSUAL',
} as const;

export type FrecuenciaPago = (typeof FrecuenciaPago)[keyof typeof FrecuenciaPago];

export const FRECUENCIA_PAGO_LABELS: Record<FrecuenciaPago, string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
};

export interface RutaParada {
  id: number;
  ruta: number;
  ruta_codigo?: string;
  ruta_nombre?: string;
  proveedor: number;
  proveedor_nombre?: string;
  proveedor_documento?: string;
  proveedor_codigo?: string;
  orden: number;
  frecuencia_pago: FrecuenciaPago;
  frecuencia_pago_display?: string;
  is_active: boolean;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRutaParadaDTO {
  ruta: number;
  proveedor: number;
  orden?: number;
  frecuencia_pago?: FrecuenciaPago;
  is_active?: boolean;
  notas?: string;
}

export type UpdateRutaParadaDTO = Partial<CreateRutaParadaDTO>;

export interface RutaParadasFilterParams {
  ruta?: number;
  proveedor?: number;
  frecuencia_pago?: FrecuenciaPago;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
