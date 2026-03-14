/**
 * Tipos TypeScript para Caracterización de Procesos (SIPOC)
 * Módulo: C1 — Fundación / Organización
 */

// ==================== SIPOC ITEM TYPES ====================

export interface SIPOCProveedor {
  nombre: string;
  tipo: 'interno' | 'externo';
}

export interface SIPOCEntrada {
  descripcion: string;
  origen: string;
}

export interface SIPOCActividad {
  descripcion: string;
  responsable: string;
}

export interface SIPOCSalida {
  descripcion: string;
  destino: string;
}

export interface SIPOCCliente {
  nombre: string;
  tipo: 'interno' | 'externo';
}

export interface RecursoItem {
  tipo: 'humano' | 'tecnologico' | 'fisico' | 'financiero';
  descripcion: string;
}

export interface IndicadorVinculado {
  nombre: string;
  formula: string;
  meta: string;
}

export interface RiesgoAsociado {
  descripcion: string;
  nivel: 'alto' | 'medio' | 'bajo';
  tratamiento: string;
}

export interface DocumentoReferencia {
  codigo: string;
  nombre: string;
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
  // SIPOC
  proveedores: SIPOCProveedor[];
  entradas: SIPOCEntrada[];
  actividades_clave: SIPOCActividad[];
  salidas: SIPOCSalida[];
  clientes: SIPOCCliente[];
  // Recursos y referencias
  recursos: RecursoItem[];
  indicadores_vinculados: IndicadorVinculado[];
  riesgos_asociados: RiesgoAsociado[];
  documentos_referencia: DocumentoReferencia[];
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
  proveedores?: SIPOCProveedor[];
  entradas?: SIPOCEntrada[];
  actividades_clave?: SIPOCActividad[];
  salidas?: SIPOCSalida[];
  clientes?: SIPOCCliente[];
  recursos?: RecursoItem[];
  indicadores_vinculados?: IndicadorVinculado[];
  riesgos_asociados?: RiesgoAsociado[];
  documentos_referencia?: DocumentoReferencia[];
  requisitos_normativos?: string;
  observaciones?: string;
}

export type UpdateCaracterizacionDTO = Partial<CreateCaracterizacionDTO>;
