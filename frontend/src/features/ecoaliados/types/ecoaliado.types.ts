/**
 * Tipos TypeScript para el módulo de Ecoaliados
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// ==================== ECOALIADO ====================

export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PASAPORTE';

export interface Ecoaliado {
  id: number;
  codigo: string;
  razon_social: string;
  documento_tipo: TipoDocumento;
  documento_tipo_display: string;
  documento_numero: string;
  unidad_negocio: number;
  unidad_negocio_nombre: string;
  telefono: string;
  email?: string | null;
  direccion: string;
  ciudad: string;
  departamento: string;
  latitud?: number | null;
  longitud?: number | null;
  tiene_geolocalizacion: boolean;
  precio_compra_kg: string;
  comercial_asignado: number;
  comercial_asignado_nombre: string;
  observaciones?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  created_by_nombre?: string;
}

export interface CreateEcoaliadoDTO {
  razon_social: string;
  documento_tipo: TipoDocumento;
  documento_numero: string;
  unidad_negocio: number;
  telefono: string;
  email?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  latitud?: number | null;
  longitud?: number | null;
  precio_compra_kg: string | number;
  comercial_asignado: number;
  observaciones?: string;
  is_active?: boolean;
}

export interface UpdateEcoaliadoDTO {
  razon_social?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  latitud?: number | null;
  longitud?: number | null;
  comercial_asignado?: number;
  observaciones?: string;
  is_active?: boolean;
}

export interface CambiarPrecioEcoaliadoDTO {
  precio_nuevo: string | number;
  justificacion: string;
}

// ==================== HISTORIAL DE PRECIO ====================

export type TipoCambioPrecio = 'INICIAL' | 'AUMENTO' | 'DISMINUCION';

export interface HistorialPrecioEcoaliado {
  id: number;
  ecoaliado: number;
  ecoaliado_nombre: string;
  precio_anterior?: string | null;
  precio_nuevo: string;
  diferencia_precio?: string | null;
  porcentaje_cambio?: string | null;
  tipo_cambio: TipoCambioPrecio;
  justificacion: string;
  modificado_por: number;
  modificado_por_nombre: string;
  fecha_cambio: string;
  created_at: string;
}

// ==================== UNIDAD DE NEGOCIO (Simplificada) ====================

export interface UnidadNegocio {
  id: number;
  razon_social: string;
  nombre_comercial: string;
  ciudad: string;
  departamento: string;
  subtipo_materia: string[];
}

// ==================== FILTROS Y PAGINACIÓN ====================

export interface EcoaliadoFilters {
  search?: string;
  unidad_negocio?: number | '';
  ciudad?: string;
  departamento?: string;
  tiene_geolocalizacion?: boolean | undefined;
  is_active?: boolean | undefined;
  comercial_asignado?: number | '';
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== GEOLOCALIZACIÓN ====================

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}
