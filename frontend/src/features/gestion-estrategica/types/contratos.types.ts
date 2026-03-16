/**
 * Tipos TypeScript para Tipos de Contrato - Configuracion
 * Sistema de Gestion StrateKaz
 *
 * Consumido desde Fundacion Tab 4 "Mis Politicas y Reglamentos"
 * Backend: apps/gestion_estrategica/configuracion (TipoContrato)
 */

// ==================== ENUMS ====================

export type TipoContratoChoices =
  | 'TERMINO_FIJO'
  | 'INDEFINIDO'
  | 'OBRA_LABOR'
  | 'PRESTACION_SERVICIOS'
  | 'APRENDIZAJE';

// ==================== MODELS ====================

/**
 * TipoContrato (lista ligera - TipoContratoListSerializer)
 */
export interface TipoContratoList {
  id: number;
  nombre: string;
  tipo: TipoContratoChoices;
  tipo_display: string;
  duracion_default_dias: number | null;
  periodo_prueba_dias: number;
  requiere_poliza: boolean;
  orden: number;
  is_active: boolean;
}

/**
 * TipoContrato (detalle completo - TipoContratoSerializer)
 */
export interface TipoContratoDetail {
  id: number;
  empresa: number;
  nombre: string;
  tipo: TipoContratoChoices;
  tipo_display: string;
  descripcion: string;
  clausulas_principales: string[];
  duracion_default_dias: number | null;
  periodo_prueba_dias: number;
  requiere_poliza: boolean;
  plantilla_documento: string | null;
  notas_legales: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs ====================

export interface CreateTipoContratoDTO {
  nombre: string;
  tipo: TipoContratoChoices;
  descripcion?: string;
  clausulas_principales?: string[];
  duracion_default_dias?: number | null;
  periodo_prueba_dias?: number;
  requiere_poliza?: boolean;
  notas_legales?: string;
  orden?: number;
  is_active?: boolean;
}

export interface UpdateTipoContratoDTO {
  nombre?: string;
  tipo?: TipoContratoChoices;
  descripcion?: string;
  clausulas_principales?: string[];
  duracion_default_dias?: number | null;
  periodo_prueba_dias?: number;
  requiere_poliza?: boolean;
  notas_legales?: string;
  orden?: number;
  is_active?: boolean;
}
