/**
 * Tipos TypeScript para Caracterización de Procesos (SIPOC)
 * Módulo: C1 — Fundación / Organización
 *
 * REORG-B6: Tipos relacionales reemplazan JSONField types.
 * Matchean con backend serializers (CaracterizacionProveedorSerializer, etc.)
 */

// ==================== RELATIONAL ITEM TYPES (REORG-B5/B6) ====================

export interface ProveedorItem {
  id?: number;
  nombre: string;
  tipo: 'interno' | 'externo';
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  orden?: number;
}

export interface EntradaItem {
  id?: number;
  descripcion: string;
  origen: string;
  orden?: number;
}

export interface ActividadItem {
  id?: number;
  descripcion: string;
  responsable: string;
  responsable_cargo_id?: number | null;
  responsable_cargo_nombre?: string;
  orden?: number;
}

export interface SalidaItem {
  id?: number;
  descripcion: string;
  destino: string;
  orden?: number;
}

export interface ClienteItem {
  id?: number;
  nombre: string;
  tipo: 'interno' | 'externo';
  parte_interesada_id?: number | null;
  parte_interesada_nombre?: string;
  orden?: number;
}

export interface RecursoItem {
  id?: number;
  tipo: 'humano' | 'tecnologico' | 'fisico' | 'financiero';
  tipo_display?: string;
  descripcion: string;
  orden?: number;
}

export interface IndicadorItem {
  id?: number;
  nombre: string;
  formula: string;
  meta: string;
  indicador_id?: number | null;
  orden?: number;
}

export interface RiesgoItem {
  id?: number;
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
  nivel_display?: string;
  tratamiento: string;
  riesgo_id?: number | null;
  orden?: number;
}

export interface DocumentoItem {
  id?: number;
  codigo: string;
  nombre: string;
  documento_id?: number | null;
  orden?: number;
}

// ==================== ENUMS ====================

export type EstadoCaracterizacion = 'BORRADOR' | 'VIGENTE' | 'EN_REVISION' | 'OBSOLETO';

export const ESTADO_LABELS: Record<EstadoCaracterizacion, string> = {
  BORRADOR: 'Borrador',
  VIGENTE: 'Vigente',
  EN_REVISION: 'En Revisión',
  OBSOLETO: 'Obsoleto',
};

export const ESTADO_BADGE_VARIANTS: Record<
  EstadoCaracterizacion,
  'secondary' | 'success' | 'warning' | 'danger'
> = {
  BORRADOR: 'secondary',
  VIGENTE: 'success',
  EN_REVISION: 'warning',
  OBSOLETO: 'danger',
};

export const TIPO_RECURSO_LABELS: Record<string, string> = {
  humano: 'Humano',
  tecnologico: 'Tecnológico',
  fisico: 'Físico',
  financiero: 'Financiero',
};

// ==================== LIST / DETAIL ====================

export interface CaracterizacionProcesoList {
  id: number;
  area: number;
  area_name: string;
  area_code: string;
  estado: EstadoCaracterizacion;
  estado_display: string;
  objetivo_resumen: string;
  lider_proceso: number | null;
  lider_proceso_nombre: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaracterizacionProceso {
  id: number;
  area: number;
  area_name: string;
  area_code: string;
  version: number;
  estado: EstadoCaracterizacion;
  estado_display: string;
  objetivo: string;
  alcance: string;
  lider_proceso: number | null;
  lider_proceso_nombre: string | null;
  // SIPOC relacional (REORG-B5)
  items_proveedores: ProveedorItem[];
  items_entradas: EntradaItem[];
  items_actividades: ActividadItem[];
  items_salidas: SalidaItem[];
  items_clientes: ClienteItem[];
  items_recursos: RecursoItem[];
  items_indicadores: IndicadorItem[];
  items_riesgos: RiesgoItem[];
  items_documentos: DocumentoItem[];
  // Otros
  requisitos_normativos: string;
  observaciones: string;
  // Audit
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_nombre: string | null;
}

// ==================== DTOs ====================

export interface CreateCaracterizacionDTO {
  area: number;
  version?: number;
  estado?: EstadoCaracterizacion;
  objetivo?: string;
  alcance?: string;
  lider_proceso?: number | null;
  // SIPOC relacional (items_*)
  items_proveedores?: ProveedorItem[];
  items_entradas?: EntradaItem[];
  items_actividades?: ActividadItem[];
  items_salidas?: SalidaItem[];
  items_clientes?: ClienteItem[];
  items_recursos?: RecursoItem[];
  items_indicadores?: IndicadorItem[];
  items_riesgos?: RiesgoItem[];
  items_documentos?: DocumentoItem[];
  // Otros
  requisitos_normativos?: string;
  observaciones?: string;
}

export type UpdateCaracterizacionDTO = Partial<CreateCaracterizacionDTO>;
