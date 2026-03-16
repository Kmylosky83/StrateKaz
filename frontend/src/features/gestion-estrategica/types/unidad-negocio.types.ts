/**
 * Tipos para Unidades de Negocio — Fundacion Tab 1 (Mi Empresa)
 * Backend: apps/gestion_estrategica/configuracion/models.py
 */

export type TipoUnidad = 'SEDE' | 'SUCURSAL' | 'PLANTA' | 'CENTRO_ACOPIO' | 'ALMACEN' | 'OTRO';

export interface UnidadNegocio {
  id: number;
  codigo: string;
  nombre: string;
  tipo_unidad: TipoUnidad;
  tipo_unidad_display?: string;
  direccion: string;
  ciudad: string;
  departamento?: number;
  departamento_nombre?: string;
  responsable?: number;
  responsable_nombre?: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUnidadNegocioDTO {
  codigo: string;
  nombre: string;
  tipo_unidad: TipoUnidad;
  direccion?: string;
  ciudad?: string;
  departamento?: number;
  responsable?: number;
  is_active?: boolean;
}

export type UpdateUnidadNegocioDTO = Partial<CreateUnidadNegocioDTO>;
