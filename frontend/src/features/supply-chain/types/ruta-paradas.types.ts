/**
 * Tipos TypeScript para Paradas de Ruta de Recolección.
 *
 * H-SC-RUTA-02: vínculo M2M Ruta ↔ Proveedor con orden sugerido.
 *
 * NOTA (refactor 2026-04-26): el campo `frecuencia_pago` fue eliminado.
 * La frecuencia es decisión del momento de liquidación (acumulativa,
 * semanal/quincenal/mensual decidida por el liquidador), no camisa de
 * fuerza por parada.
 *
 * Endpoint: /api/supply-chain/catalogos/rutas-paradas/
 */

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
  is_active: boolean;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRutaParadaDTO {
  ruta: number;
  proveedor: number;
  orden?: number;
  is_active?: boolean;
  notas?: string;
}

export type UpdateRutaParadaDTO = Partial<CreateRutaParadaDTO>;

export interface RutaParadasFilterParams {
  ruta?: number;
  proveedor?: number;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
