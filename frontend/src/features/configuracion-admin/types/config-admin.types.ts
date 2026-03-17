/**
 * Types para Configuración de Plataforma
 *
 * Los tipos de SystemModule vienen del backend (core/viewsets_config.py).
 * Consecutivos y catálogos reusan los endpoints existentes del backend.
 *
 * IMPORTANTE: Los nombres de campo DEBEN coincidir exactamente con los
 * serializers del backend (snake_case). Ver serializers_consecutivos.py.
 */

// ── Módulos del Sistema ──

export interface SystemModuleItem {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  is_enabled: boolean;
  is_core: boolean;
  orden: number;
  category: string;
}

export interface ToggleModuleDTO {
  is_enabled: boolean;
}

// ── Árbol de módulos ──
// NOTA: Los tipos del árbol (SystemModuleTree, ModuleTab, ModulesTree)
// viven en @/features/gestion-estrategica/types/modules.types.ts
// (fuente única). NO duplicar aquí.

// ── Consecutivos ──
// Campos alineados con ConsecutivoConfigSerializer (backend)

export interface ConsecutivoConfig {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  categoria_display: string;
  prefix: string;
  suffix: string;
  separator: string;
  separator_display: string;
  current_number: number;
  padding: number;
  numero_inicial: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date: string | null;
  es_sistema: boolean;
  is_active: boolean;
  ejemplo_formato: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConsecutivoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  prefix: string;
  suffix?: string;
  separator?: string;
  padding?: number;
  numero_inicial?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
}

export type UpdateConsecutivoDTO = Partial<CreateConsecutivoDTO>;

// ── Unidades de Medida ──

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  categoria: string;
  factor_conversion: string;
  unidad_base_id: number | null;
  is_active: boolean;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUnidadMedidaDTO {
  nombre: string;
  abreviatura: string;
  categoria: string;
  factor_conversion?: string;
  unidad_base_id?: number | null;
  descripcion?: string;
}

export type UpdateUnidadMedidaDTO = Partial<CreateUnidadMedidaDTO>;

// ── Tipos de Contrato ──

export interface TipoContrato {
  id: number;
  name: string;
  code: string;
  descripcion: string;
  is_active: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoContratoDTO {
  name: string;
  code?: string;
  descripcion?: string;
  orden?: number;
}

export type UpdateTipoContratoDTO = Partial<CreateTipoContratoDTO>;

// ── Integraciones Externas ──

export interface IntegracionExterna {
  id: number;
  nombre: string;
  tipo_servicio: string;
  proveedor: string;
  estado: string;
  url_base: string;
  api_key_configured: boolean;
  is_active: boolean;
  descripcion: string;
  ultima_sincronizacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegracionDTO {
  nombre: string;
  tipo_servicio: string;
  proveedor: string;
  url_base: string;
  api_key?: string;
  descripcion?: string;
}

export type UpdateIntegracionDTO = Partial<CreateIntegracionDTO>;

// ── Tipos de Documento de Identidad (Core C0) ──

export interface TipoDocumentoIdentidad {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  is_active: boolean;
}

export interface CreateTipoDocumentoIdentidadDTO {
  codigo: string;
  nombre: string;
  orden?: number;
  is_active?: boolean;
}

export type UpdateTipoDocumentoIdentidadDTO = Partial<CreateTipoDocumentoIdentidadDTO>;

// ── Normas ISO (Configuración C1) ──

export interface NormaISOConfig {
  id: number;
  code: string;
  name: string;
  short_name: string;
  description: string;
  category: string;
  category_display?: string;
  version: string;
  icon: string;
  color: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface CreateNormaISOConfigDTO {
  name: string;
  short_name?: string;
  description?: string;
  category: string;
  version?: string;
  icon?: string;
  color?: string;
  orden?: number;
}

export type UpdateNormaISOConfigDTO = Partial<CreateNormaISOConfigDTO>;

// ── Tipos de EPP (HSEQ — Seguridad Industrial) ──

export interface TipoEPP {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  vida_util_dias: number | null;
  normas_aplicables: string;
  requiere_talla: boolean;
  tallas_disponibles: string[];
  es_desechable: boolean;
  requiere_capacitacion: boolean;
  activo: boolean;
  orden: number;
}

export interface CreateTipoEPPDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  vida_util_dias?: number | null;
  normas_aplicables?: string;
  requiere_talla?: boolean;
  es_desechable?: boolean;
  requiere_capacitacion?: boolean;
  orden?: number;
}

export type UpdateTipoEPPDTO = Partial<CreateTipoEPPDTO>;

// ── Tipos de Examen Médico (HSEQ — Medicina Laboral) ──

export interface TipoExamen {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  periodicidad: string;
  meses_periodicidad: number | null;
  incluye_clinico: boolean;
  incluye_laboratorio: boolean;
  incluye_paraclinicos: boolean;
  incluye_audiometria: boolean;
  incluye_visiometria: boolean;
  incluye_espirometria: boolean;
  enfasis_osteomuscular: boolean;
  enfasis_cardiovascular: boolean;
  enfasis_respiratorio: boolean;
  enfasis_neurologico: boolean;
  observaciones: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTipoExamenDTO {
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  periodicidad?: string;
  meses_periodicidad?: number | null;
}

export type UpdateTipoExamenDTO = Partial<CreateTipoExamenDTO>;

// ── Tipos de Inspección (HSEQ — Seguridad Industrial) ──

export interface TipoInspeccion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  frecuencia_recomendada: string;
  area_responsable: string;
  activo: boolean;
  orden: number;
}

export interface CreateTipoInspeccionDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  frecuencia_recomendada?: string;
  area_responsable?: string;
  orden?: number;
}

export type UpdateTipoInspeccionDTO = Partial<CreateTipoInspeccionDTO>;

// ── Tipos de Residuo (HSEQ — Gestión Ambiental) ──

export interface TipoResiduo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  clase: string;
  codigo_cer: string;
  es_corrosivo: boolean;
  es_reactivo: boolean;
  es_explosivo: boolean;
  es_toxico: boolean;
  es_inflamable: boolean;
  es_infeccioso: boolean;
  requiere_tratamiento_especial: boolean;
  instrucciones_manejo: string;
  color_contenedor: string;
  activo: boolean;
}

export interface CreateTipoResiduoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  clase: string;
  codigo_cer?: string;
  color_contenedor?: string;
}

export type UpdateTipoResiduoDTO = Partial<CreateTipoResiduoDTO>;

// ── Formas de Pago (Supply Chain) ──

export interface FormaPago {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  orden: number;
  is_active: boolean;
}

export interface CreateFormaPagoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

export type UpdateFormaPagoDTO = Partial<CreateFormaPagoDTO>;

// ── Tipo genérico para catálogos simples (código + nombre + activo) ──

export interface SimpleCatalogItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  is_active?: boolean;
  activo?: boolean;
  es_sistema?: boolean;
  orden?: number;
}
