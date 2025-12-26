/**
 * Tipos TypeScript para Matriz Legal
 * Backend: backend/apps/motor_cumplimiento/matriz_legal/
 */

// ============================================================================
// ENUMS (todos en minúsculas como el backend)
// ============================================================================

export type CumplimientoLevel = 0 | 25 | 50 | 75 | 100;

export type EstadoCumplimiento =
  | 'No evaluado'
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Cumple';

export type SistemaGestion = 'SST' | 'Ambiental' | 'Calidad' | 'PESV';

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface BaseTimestamped {
  created_at: string;
  updated_at: string;
}

export interface BaseSoftDelete {
  is_active: boolean;
  deleted_at?: string | null;
}

// ============================================================================
// TIPO NORMA
// ============================================================================

export interface TipoNorma extends BaseTimestamped, BaseSoftDelete {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface TipoNormaCreate {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

// ============================================================================
// NORMA LEGAL
// ============================================================================

export interface NormaLegal extends BaseTimestamped, BaseSoftDelete {
  id: number;
  tipo_norma: TipoNorma;
  tipo_norma_id?: number; // write-only en serializer
  numero: string;
  anio: number;
  titulo: string;
  entidad_emisora: string;
  fecha_expedicion: string; // ISO date
  fecha_vigencia?: string | null; // ISO date
  url_original?: string | null;
  resumen?: string | null;
  contenido?: string | null;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  vigente: boolean;
  fecha_scraping?: string | null; // ISO datetime
  codigo_completo: string; // read-only
  sistemas_aplicables: SistemaGestion[]; // SerializerMethodField
}

export interface NormaLegalList {
  id: number;
  tipo_norma_codigo: string;
  codigo_completo: string;
  numero: string;
  anio: number;
  titulo: string;
  fecha_expedicion: string;
  vigente: boolean;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
}

export interface NormaLegalCreateUpdate {
  tipo_norma: number;
  numero: string;
  anio: number;
  titulo: string;
  entidad_emisora: string;
  fecha_expedicion: string;
  fecha_vigencia?: string | null;
  url_original?: string | null;
  resumen?: string | null;
  contenido?: string | null;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  vigente: boolean;
}

// ============================================================================
// EMPRESA NORMA
// ============================================================================

export interface EmpresaNorma extends BaseTimestamped {
  id: number;
  empresa_id: number;
  norma: NormaLegalList;
  norma_id?: number; // write-only
  responsable?: number | null;
  responsable_nombre: string; // read-only
  aplica: boolean;
  justificacion?: string | null;
  porcentaje_cumplimiento: CumplimientoLevel;
  estado_cumplimiento: EstadoCumplimiento; // read-only
  fecha_evaluacion?: string | null; // ISO date
  observaciones?: string | null;
  created_by?: number | null;
}

export interface EmpresaNormaCreateUpdate {
  empresa_id: number;
  norma: number;
  responsable?: number | null;
  aplica: boolean;
  justificacion?: string | null;
  porcentaje_cumplimiento: CumplimientoLevel;
  fecha_evaluacion?: string | null;
  observaciones?: string | null;
}

export interface EvaluarCumplimiento {
  porcentaje_cumplimiento: CumplimientoLevel;
  observaciones?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

export const CUMPLIMIENTO_CHOICES: Array<{ value: CumplimientoLevel; label: string }> = [
  { value: 0, label: 'No evaluado' },
  { value: 25, label: '25% - Bajo' },
  { value: 50, label: '50% - Medio' },
  { value: 75, label: '75% - Alto' },
  { value: 100, label: '100% - Cumple' },
];

export const SISTEMAS_GESTION: SistemaGestion[] = ['SST', 'Ambiental', 'Calidad', 'PESV'];
