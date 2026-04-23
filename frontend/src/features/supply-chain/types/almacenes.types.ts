/**
 * Tipos TypeScript para Almacenes (catálogo CT Supply Chain)
 *
 * Almacenes físicos del tenant (silos, bodegas, tanques, pallets)
 * que viven dentro de una SedeEmpresa (FK sede).
 *
 * Endpoint: /api/supply-chain/catalogos/almacenes/
 * Filtro clave: ?sede=<id> → almacenes de una sede específica (H-SC-07)
 */

// ==================== ENTIDADES ====================

export interface Almacen {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  es_principal: boolean;
  permite_despacho: boolean;
  permite_recepcion: boolean;
  tipo_almacen: number | null;
  tipo_almacen_nombre?: string | null;
  capacidad_maxima?: number | null;
  sede: number | null;
  sede_nombre?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vista de lista — por ahora misma forma del detalle (el serializer retorna
// todos los campos en list y retrieve). Se mantiene alias por claridad semántica.
export type AlmacenList = Almacen;

// ==================== DTOs ====================

export interface CreateAlmacenDTO {
  codigo?: string; // Opcional: el backend puede auto-generarlo
  nombre: string;
  descripcion?: string;
  direccion?: string;
  es_principal?: boolean;
  permite_despacho?: boolean;
  permite_recepcion?: boolean;
  tipo_almacen?: number | null;
  capacidad_maxima?: number | null;
  sede?: number | null;
  is_active?: boolean;
}

export type UpdateAlmacenDTO = Partial<CreateAlmacenDTO>;

// ==================== FILTROS ====================

export interface AlmacenesFilterParams {
  sede?: number;
  is_active?: boolean;
  permite_recepcion?: boolean;
  permite_despacho?: boolean;
  tipo_almacen?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

