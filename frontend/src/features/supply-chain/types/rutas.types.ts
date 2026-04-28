/**
 * Tipos TypeScript para Rutas de Recolección (catálogo CT Supply Chain)
 *
 * Una RutaRecoleccion es un recurso logístico de la empresa (vehículo +
 * recorrido). NUNCA es un Proveedor — los proveedores reales viven en
 * `catalogo_productos.Proveedor` con NIT/datos reales y se asocian a la
 * ruta vía RutaParada (M2M).
 *
 * Modos de operación (H-SC-RUTA-02):
 *   - PASS_THROUGH: la empresa paga directo al productor.
 *   - SEMI_AUTONOMA: la ruta tiene caja propia; doble precio (lo que paga
 *     al productor / lo que la empresa le paga a la ruta).
 *
 * Endpoint: /api/supply-chain/catalogos/rutas-recoleccion/
 */

// ==================== ENUMS ====================

export const ModoOperacion = {
  PASS_THROUGH: 'PASS_THROUGH',
  SEMI_AUTONOMA: 'SEMI_AUTONOMA',
} as const;

export type ModoOperacion = (typeof ModoOperacion)[keyof typeof ModoOperacion];

export const MODO_OPERACION_LABELS: Record<ModoOperacion, string> = {
  PASS_THROUGH: 'Directa (empresa paga al productor)',
  SEMI_AUTONOMA: 'Semi-autónoma (ruta con caja propia)',
};

// ==================== ENTIDADES ====================

export interface RutaRecoleccion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  modo_operacion: ModoOperacion;
  modo_operacion_display?: string;
  is_active: boolean;
  /** H-SC-RUTA-RBAC-INSTANCIA: object-level RBAC */
  conductor_principal?: number | null;
  conductor_principal_nombre?: string | null;
  conductores_adicionales?: number[];
  conductores_adicionales_info?: Array<{ id: number; nombre: string }>;
  created_at?: string;
  updated_at?: string;
}

export type RutaRecoleccionList = RutaRecoleccion;

// ==================== DTOs ====================

export interface CreateRutaDTO {
  /** Opcional: el backend autogenera si queda vacío (patrón almacenes). */
  codigo?: string;
  nombre: string;
  descripcion?: string;
  modo_operacion?: ModoOperacion;
  is_active?: boolean;
  /** H-SC-RUTA-RBAC-INSTANCIA */
  conductor_principal?: number | null;
  conductores_adicionales?: number[];
}

export type UpdateRutaDTO = Partial<CreateRutaDTO>;

// ==================== FILTROS ====================

export interface RutasFilterParams {
  is_active?: boolean;
  modo_operacion?: ModoOperacion;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
