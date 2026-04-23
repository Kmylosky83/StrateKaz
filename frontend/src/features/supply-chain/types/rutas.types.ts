/**
 * Tipos TypeScript para Rutas de Recolección (catálogo CT Supply Chain)
 *
 * Una RutaRecoleccion representa un circuito logístico por el cual la empresa
 * recoge materia prima de proveedores externos (modalidad RECOLECCION). También
 * puede marcarse como "proveedor interno" (la empresa recoge de una UNeg
 * propia), caso en el cual se sincroniza con el catálogo de Proveedores.
 *
 * Endpoint: /api/supply-chain/catalogos/rutas-recoleccion/
 * Hallazgo: H-SC-10.
 */

// ==================== ENTIDADES ====================

export interface RutaRecoleccion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  es_proveedor_interno: boolean;
  is_active: boolean;
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
  es_proveedor_interno?: boolean;
  is_active?: boolean;
}

export type UpdateRutaDTO = Partial<CreateRutaDTO>;

// ==================== FILTROS ====================

export interface RutasFilterParams {
  is_active?: boolean;
  es_proveedor_interno?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
