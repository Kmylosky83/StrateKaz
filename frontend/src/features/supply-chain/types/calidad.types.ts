/**
 * Types TS para Calidad (QC) — ParametroCalidad, RangoCalidad, MedicionCalidad
 *
 * Fase 1 QC — contratos acordados con agent A backend:
 *   GET/POST/PATCH/DELETE /supply-chain/parametros-calidad/
 *   GET/POST/PATCH/DELETE /supply-chain/rangos-calidad/
 *   GET /supply-chain/mediciones-calidad/
 *   POST /supply-chain/voucher-lines/<id>/measurements/bulk/
 */

// ==================== ENTIDADES ====================

export interface RangoCalidad {
  id: number;
  parametro: number;
  parametro_nombre?: string;
  codigo: string;
  nombre: string;
  /** Límite inferior inclusivo. Puede ser nulo si el rango es abierto (min). */
  min_value: string | null;
  /** Límite superior inclusivo. Puede ser nulo si el rango es abierto (max). */
  max_value: string | null;
  color: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ParametroCalidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad: string;
  /** Ej: "número", "porcentaje", "ph". */
  tipo_medida?: string;
  is_active: boolean;
  /** Rangos asociados, si el serializer los anida. */
  rangos?: RangoCalidad[];
  created_at?: string;
  updated_at?: string;
}

export interface MedicionCalidad {
  id: number;
  voucher_line: number;
  parameter: number;
  parameter_nombre?: string;
  measured_value: string;
  rango?: number | null;
  rango_codigo?: string | null;
  rango_nombre?: string | null;
  rango_color?: string | null;
  medido_por?: number | null;
  medido_por_nombre?: string | null;
  fecha_medicion?: string;
  observaciones?: string;
}

// ==================== DTOs ====================

export interface CreateParametroCalidadDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidad: string;
  tipo_medida?: string;
  is_active?: boolean;
}

export type UpdateParametroCalidadDTO = Partial<CreateParametroCalidadDTO>;

export interface CreateRangoCalidadDTO {
  parametro: number;
  codigo: string;
  nombre: string;
  min_value?: number | string | null;
  max_value?: number | string | null;
  color: string;
  order?: number;
  is_active?: boolean;
}

export type UpdateRangoCalidadDTO = Partial<CreateRangoCalidadDTO>;

/**
 * Item individual del bulk de mediciones.
 * Array de estos en payload al endpoint
 * POST /voucher-lines/<line_id>/measurements/bulk/
 */
export interface MedicionBulkItem {
  parameter_id: number;
  measured_value: number | string;
}

export interface BulkMedicionesDTO {
  measurements: MedicionBulkItem[];
}
