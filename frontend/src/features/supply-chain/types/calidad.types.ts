/**
 * Types TS para Calidad (QC) — ParametroCalidad, RangoCalidad, MedicionCalidad
 *
 * Convención: código en inglés (alineado con modelo backend), UI español.
 * Endpoints:
 *   GET/POST/PATCH/DELETE /supply-chain/parametros-calidad/
 *   GET/POST/PATCH/DELETE /supply-chain/rangos-calidad/  (filtro ?parameter=<id>)
 *   GET /supply-chain/mediciones-calidad/  (filtro ?voucher_line=<id>)
 *   POST /supply-chain/voucher-lines/<id>/measurements/bulk/
 */

// ==================== ENTIDADES ====================

export interface RangoCalidad {
  id: number;
  parameter: number;
  parameter_code?: string;
  parameter_name?: string;
  code: string;
  name: string;
  /** Límite inferior inclusivo. */
  min_value: string | number;
  /** Límite superior inclusivo. Null = sin límite superior. */
  max_value: string | number | null;
  color_hex: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ParametroCalidad {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit: string;
  decimals: number;
  is_active: boolean;
  order: number;
  /** Rangos asociados (nested read-only). */
  ranges?: RangoCalidad[];
  created_at?: string;
  updated_at?: string;
}

export interface MedicionCalidad {
  id: number;
  voucher_line: number;
  parameter: number;
  parameter_code?: string;
  parameter_name?: string;
  parameter_unit?: string;
  measured_value: string | number;
  classified_range?: number | null;
  classified_range_code?: string | null;
  classified_range_name?: string | null;
  classified_range_color?: string | null;
  measured_by?: number | null;
  measured_by_nombre?: string | null;
  measured_at?: string;
  observations?: string;
}

// ==================== DTOs ====================

export interface CreateParametroCalidadDTO {
  code: string;
  name: string;
  description?: string;
  unit: string;
  decimals?: number;
  is_active?: boolean;
  order?: number;
}

export type UpdateParametroCalidadDTO = Partial<CreateParametroCalidadDTO>;

export interface CreateRangoCalidadDTO {
  parameter: number;
  code: string;
  name: string;
  min_value: number | string;
  max_value?: number | string | null;
  color_hex: string;
  order?: number;
  is_active?: boolean;
}

export type UpdateRangoCalidadDTO = Partial<CreateRangoCalidadDTO>;

/**
 * Item individual del bulk de mediciones.
 * Array en payload al endpoint
 * POST /voucher-lines/<line_id>/measurements/bulk/
 */
export interface MedicionBulkItem {
  parameter_id: number;
  measured_value: number | string;
}

export interface BulkMedicionesDTO {
  measurements: MedicionBulkItem[];
}
