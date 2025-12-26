/**
 * Tipos TypeScript para el módulo de Cumplimiento Legal
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Mapea los modelos del backend:
 * - Matriz Legal
 * - Requisitos Legales
 * - Partes Interesadas
 * - Reglamentos Internos
 */

import type { BaseEntity } from '@/hooks/useGenericCRUD';

// ==================== COMMON TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface BaseTimestamped extends BaseEntity {
  created_at: string;
  updated_at: string;
}

export interface SoftDelete {
  is_active: boolean;
  deleted_at: string | null;
}

export interface Audit {
  created_by: number | null;
  updated_by: number | null;
}

export interface BaseCompany extends BaseTimestamped, SoftDelete, Audit {
  empresa: number;
}

// ==================== MATRIZ LEGAL ====================

export interface TipoNorma extends BaseTimestamped, SoftDelete {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface CreateTipoNormaDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface UpdateTipoNormaDTO extends Partial<CreateTipoNormaDTO> {
  is_active?: boolean;
}

export interface NormaLegal extends BaseTimestamped, SoftDelete {
  tipo_norma: number;
  tipo_norma_detail?: TipoNorma;
  numero: string;
  anio: number;
  titulo: string;
  entidad_emisora: string;
  fecha_expedicion: string;
  fecha_vigencia: string | null;
  url_original: string;
  resumen: string;
  contenido: string;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  vigente: boolean;
  fecha_scraping: string | null;
  codigo_completo: string;
}

export interface CreateNormaLegalDTO {
  tipo_norma: number;
  numero: string;
  anio: number;
  titulo: string;
  entidad_emisora: string;
  fecha_expedicion: string;
  fecha_vigencia?: string;
  url_original?: string;
  resumen?: string;
  contenido?: string;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  vigente?: boolean;
}

export interface UpdateNormaLegalDTO extends Partial<CreateNormaLegalDTO> {
  is_active?: boolean;
}

export interface NormaLegalFilters {
  tipo_norma?: number;
  vigente?: boolean;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  search?: string;
}

export type PorcentajeCumplimiento = 0 | 25 | 50 | 75 | 100;

export interface EmpresaNorma extends BaseCompany {
  norma: number;
  norma_detail?: NormaLegal;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  aplica: boolean;
  justificacion: string;
  porcentaje_cumplimiento: PorcentajeCumplimiento;
  fecha_evaluacion: string | null;
  observaciones: string;
  estado_cumplimiento: string;
}

export interface CreateEmpresaNormaDTO {
  empresa: number;
  norma: number;
  responsable?: number;
  aplica?: boolean;
  justificacion?: string;
  porcentaje_cumplimiento?: PorcentajeCumplimiento;
  fecha_evaluacion?: string;
  observaciones?: string;
}

export interface UpdateEmpresaNormaDTO extends Partial<CreateEmpresaNormaDTO> {
  is_active?: boolean;
}

export interface EmpresaNormaFilters {
  empresa?: number;
  norma?: number;
  aplica?: boolean;
  porcentaje_cumplimiento?: PorcentajeCumplimiento;
  responsable?: number;
}

// ==================== REQUISITOS LEGALES ====================

export interface TipoRequisito extends BaseTimestamped, SoftDelete {
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_renovacion: boolean;
  dias_anticipacion_alerta: number;
}

export interface CreateTipoRequisitoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_renovacion?: boolean;
  dias_anticipacion_alerta?: number;
}

export interface UpdateTipoRequisitoDTO extends Partial<CreateTipoRequisitoDTO> {
  is_active?: boolean;
}

export type EstadoRequisito = 'vigente' | 'proximo_vencer' | 'vencido' | 'en_tramite' | 'no_aplica';

export interface RequisitoLegal extends BaseTimestamped, SoftDelete, Audit {
  tipo: number;
  tipo_detail?: TipoRequisito;
  codigo: string;
  nombre: string;
  descripcion: string;
  entidad_emisora: string;
  base_legal: string;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  es_obligatorio: boolean;
  periodicidad_renovacion: string;
}

export interface CreateRequisitoLegalDTO {
  tipo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  entidad_emisora: string;
  base_legal?: string;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  es_obligatorio?: boolean;
  periodicidad_renovacion?: string;
}

export interface UpdateRequisitoLegalDTO extends Partial<CreateRequisitoLegalDTO> {
  is_active?: boolean;
}

export interface RequisitoLegalFilters {
  tipo?: number;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  es_obligatorio?: boolean;
  search?: string;
}

export type EstadoEmpresaRequisito = 'vigente' | 'proximo_vencer' | 'vencido' | 'en_tramite' | 'renovando' | 'no_aplica';

export interface EmpresaRequisito extends BaseCompany {
  requisito: number;
  requisito_detail?: RequisitoLegal;
  numero_documento: string;
  fecha_expedicion: string | null;
  fecha_vencimiento: string | null;
  estado: EstadoEmpresaRequisito;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  documento_soporte: string | null;
  observaciones: string;
  justificacion_no_aplica: string;
  requisito_anterior: number | null;
  dias_para_vencer: number | null;
  esta_vencido: boolean;
  esta_proximo_vencer: boolean;
}

export interface CreateEmpresaRequisitoDTO {
  empresa: number;
  requisito: number;
  numero_documento?: string;
  fecha_expedicion?: string;
  fecha_vencimiento?: string;
  estado?: EstadoEmpresaRequisito;
  responsable?: number;
  documento_soporte?: File | string;
  observaciones?: string;
  justificacion_no_aplica?: string;
  requisito_anterior?: number;
}

export interface UpdateEmpresaRequisitoDTO extends Partial<CreateEmpresaRequisitoDTO> {
  is_active?: boolean;
}

export interface EmpresaRequisitoFilters {
  empresa?: number;
  requisito?: number;
  estado?: EstadoEmpresaRequisito;
  responsable?: number;
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
}

// ==================== PARTES INTERESADAS ====================

export type CategoriaParteInteresada = 'interna' | 'externa';
export type NivelInfluencia = 'alta' | 'media' | 'baja';
export type NivelInteres = 'alto' | 'medio' | 'bajo';

export interface TipoParteInteresada extends BaseTimestamped, SoftDelete {
  codigo: string;
  nombre: string;
  categoria: CategoriaParteInteresada;
  descripcion: string;
  orden: number;
}

export interface CreateTipoParteInteresadaDTO {
  codigo: string;
  nombre: string;
  categoria: CategoriaParteInteresada;
  descripcion?: string;
  orden?: number;
}

export interface UpdateTipoParteInteresadaDTO extends Partial<CreateTipoParteInteresadaDTO> {
  is_active?: boolean;
}

export interface ParteInteresada extends BaseCompany {
  tipo: number;
  tipo_detail?: TipoParteInteresada;
  nombre: string;
  descripcion: string;
  representante: string;
  cargo_representante: string;
  telefono: string;
  email: string;
  direccion: string;
  nivel_influencia: NivelInfluencia;
  nivel_interes: NivelInteres;
  relacionado_sst: boolean;
  relacionado_ambiental: boolean;
  relacionado_calidad: boolean;
  relacionado_pesv: boolean;
}

export interface CreateParteInteresadaDTO {
  empresa: number;
  tipo: number;
  nombre: string;
  descripcion?: string;
  representante?: string;
  cargo_representante?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  relacionado_sst?: boolean;
  relacionado_ambiental?: boolean;
  relacionado_calidad?: boolean;
  relacionado_pesv?: boolean;
}

export interface UpdateParteInteresadaDTO extends Partial<CreateParteInteresadaDTO> {
  is_active?: boolean;
}

export interface ParteInteresadaFilters {
  empresa?: number;
  tipo?: number;
  nivel_influencia?: NivelInfluencia;
  nivel_interes?: NivelInteres;
  search?: string;
}

// ==================== REGLAMENTOS INTERNOS ====================

export interface TipoReglamento extends BaseTimestamped, SoftDelete {
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_aprobacion_legal: boolean;
  vigencia_anios: number;
  orden: number;
}

export interface CreateTipoReglamentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_aprobacion_legal?: boolean;
  vigencia_anios?: number;
  orden?: number;
}

export interface UpdateTipoReglamentoDTO extends Partial<CreateTipoReglamentoDTO> {
  is_active?: boolean;
}

export type EstadoReglamento = 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'obsoleto';

export interface Reglamento extends BaseCompany {
  tipo: number;
  tipo_detail?: TipoReglamento;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: EstadoReglamento;
  version_actual: string;
  fecha_aprobacion: string | null;
  fecha_vigencia: string | null;
  fecha_proxima_revision: string | null;
  aprobado_por: number | null;
  aprobado_por_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  documento: string | null;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  observaciones: string;
  orden: number;
}

export interface CreateReglamentoDTO {
  empresa: number;
  tipo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado?: EstadoReglamento;
  version_actual?: string;
  fecha_aprobacion?: string;
  fecha_vigencia?: string;
  fecha_proxima_revision?: string;
  aprobado_por?: number;
  documento?: File | string;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  observaciones?: string;
  orden?: number;
}

export interface UpdateReglamentoDTO extends Partial<CreateReglamentoDTO> {
  is_active?: boolean;
}

export interface ReglamentoFilters {
  empresa?: number;
  tipo?: number;
  estado?: EstadoReglamento;
  search?: string;
}
