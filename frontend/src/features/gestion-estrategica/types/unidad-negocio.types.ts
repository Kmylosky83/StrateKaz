/**
 * Tipos para Unidades de Negocio — Fundación Tab 1 (Mi Empresa)
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
  departamento?: string;
  departamento_display?: string;
  responsable?: number;
  responsable_nombre?: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUnidadNegocioDTO {
  nombre: string;
  tipo_unidad: TipoUnidad;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  responsable?: number;
  is_active?: boolean;
}

export type UpdateUnidadNegocioDTO = Partial<CreateUnidadNegocioDTO>;
