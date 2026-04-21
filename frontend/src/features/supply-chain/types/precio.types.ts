/**
 * Types para Precios MP (post refactor 2026-04-21).
 *
 * Proveedor vive en catalogo_productos. Precio vive en supply_chain.
 * Backend: /api/supply-chain/precios-mp/
 */

export interface PrecioMP {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  proveedor_codigo: string;
  producto: number;
  producto_nombre: string;
  producto_codigo: string;
  unidad_medida: string;
  precio_kg: string;
  modalidad_logistica: number | null;
  modalidad_logistica_nombre: string | null;
  tipo_proveedor_requiere_modalidad: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePrecioMPDTO {
  proveedor: number;
  producto: number;
  precio_kg: number | string;
  modalidad_logistica?: number | null;
}

export interface UpdatePrecioMPDTO {
  precio_kg?: number | string;
  modalidad_logistica?: number | null;
  motivo?: string;
}

export interface HistorialPrecio {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  producto: number | null;
  producto_nombre: string | null;
  precio_anterior: string | null;
  precio_nuevo: string;
  variacion_precio: number | null;
  tipo_cambio: 'INICIAL' | 'AUMENTO' | 'REDUCCION' | 'SIN_CAMBIO';
  modificado_por: number | null;
  modificado_por_nombre: string | null;
  motivo: string;
  created_at: string;
}

export interface ModalidadLogistica {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  is_active: boolean;
}
