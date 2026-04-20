/**
 * Types para Proveedores (CT-layer).
 *
 * Backend: /api/catalogo-productos/proveedores/
 *
 * Doctrina 2026-04-21:
 *   Proveedor es dato maestro multi-industria.
 *   Identificación mínima + contacto + productos suministrados.
 *   Tributario, bancario, contratos, evaluaciones → fuera (Admin/Compras).
 */

export type TipoPersona = 'natural' | 'empresa' | 'con_cedula';

export interface TipoProveedor {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  requiere_materia_prima: boolean;
  requiere_modalidad_logistica: boolean;
  orden: number;
  is_active: boolean;
}

export interface CreateTipoProveedorDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_materia_prima?: boolean;
  requiere_modalidad_logistica?: boolean;
  orden?: number;
  is_active?: boolean;
}
export type UpdateTipoProveedorDTO = Partial<CreateTipoProveedorDTO>;

/** Proveedor (versión lista — sin M2M). */
export interface Proveedor {
  id: number;
  codigo_interno: string;
  tipo_persona: TipoPersona;
  tipo_persona_display: string;
  tipo_proveedor: number | null;
  tipo_proveedor_nombre: string | null;
  razon_social: string;
  nombre_comercial: string;
  tipo_documento: number;
  tipo_documento_nombre: string;
  numero_documento: string;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string;
  departamento: number | null;
  departamento_nombre: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Proveedor detalle — incluye M2M y vínculo PI. */
export interface ProveedorDetail extends Proveedor {
  direccion: string;
  productos_suministrados: number[];
  parte_interesada_id: number | null;
  parte_interesada_nombre: string;
}

export interface CreateProveedorDTO {
  tipo_persona: TipoPersona;
  tipo_proveedor?: number | null;
  razon_social: string;
  nombre_comercial: string;
  tipo_documento: number;
  numero_documento: string;
  nit?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  departamento?: number | null;
  direccion?: string;
  productos_suministrados?: number[];
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  is_active?: boolean;
}
export type UpdateProveedorDTO = Partial<CreateProveedorDTO>;

export interface EstadisticasProveedores {
  total: number;
  activos: number;
  inactivos: number;
  por_tipo_persona: Record<TipoPersona, number>;
}
