/**
 * Types para Proceso Disciplinario - Talent Hub
 * Sistema de Gestión StrateKaz
 */

// ============== ENUMS ==============

export type GravedadFalta = 'leve' | 'grave' | 'muy_grave';
export type TipoLlamado = 'verbal' | 'escrito';
export type EstadoDescargo = 'citado' | 'realizado' | 'no_presentado';
export type DecisionDescargo = 'pendiente' | 'exonerado' | 'sancionado' | 'archivado';
export type TipoSancion = 'amonestacion' | 'suspension' | 'multa' | 'terminacion_justa_causa';
export type TipoEventoDisciplinario = 'llamado_atencion' | 'descargo' | 'memorando' | 'suspension' | 'terminacion';

// ============== TIPO FALTA ==============

export interface TipoFalta {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  gravedad: GravedadFalta;
  sancion_sugerida: TipoSancion;
  dias_suspension_sugeridos: number;
  fundamento_legal: string;
  articulo_rit: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TipoFaltaFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  gravedad: GravedadFalta;
  sancion_sugerida?: TipoSancion;
  dias_suspension_sugeridos?: number;
  fundamento_legal?: string;
  articulo_rit?: string;
}

export interface TipoFaltaFilter {
  gravedad?: GravedadFalta;
  search?: string;
}

// ============== LLAMADO DE ATENCION ==============

export interface LlamadoAtencion {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo: TipoLlamado;
  tipo_falta: number | null;
  tipo_falta_nombre: string;
  fecha_llamado: string;
  fecha_hechos: string;
  descripcion_hechos: string;
  lugar_hechos: string;
  testigos: string;
  compromiso_colaborador: string;
  realizado_por: number;
  realizado_por_nombre: string;
  firmado_colaborador: boolean;
  fecha_firma: string | null;
  observaciones: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LlamadoAtencionFormData {
  colaborador: number;
  tipo: TipoLlamado;
  tipo_falta?: number | null;
  fecha_llamado: string;
  fecha_hechos: string;
  descripcion_hechos: string;
  lugar_hechos?: string;
  testigos?: string;
  compromiso_colaborador?: string;
  observaciones?: string;
}

export interface LlamadoAtencionFilter {
  colaborador?: number;
  tipo?: TipoLlamado;
  tipo_falta?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ============== DESCARGO ==============

export interface Descargo {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_falta: number;
  tipo_falta_nombre: string;
  fecha_hechos: string;
  descripcion_hechos: string;
  pruebas_empresa: string;
  testigos_empresa: string;
  fecha_citacion: string;
  hora_citacion: string;
  lugar_citacion: string;
  estado: EstadoDescargo;
  fecha_descargo: string | null;
  descargo_colaborador: string;
  pruebas_presentadas: string;
  testigos_colaborador: string;
  decision: DecisionDescargo;
  justificacion_decision: string;
  decidido_por: number | null;
  decidido_por_nombre: string;
  fecha_decision: string | null;
  genera_memorando: boolean;
  memorando_generado: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DescargoFormData {
  colaborador: number;
  tipo_falta: number;
  fecha_hechos: string;
  descripcion_hechos: string;
  pruebas_empresa?: string;
  testigos_empresa?: string;
  fecha_citacion: string;
  hora_citacion: string;
  lugar_citacion: string;
}

export interface DescargoFilter {
  colaborador?: number;
  tipo_falta?: number;
  estado?: EstadoDescargo;
  decision?: DecisionDescargo;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface RegistrarDescargoData {
  descargo_colaborador: string;
  pruebas_presentadas?: string;
  testigos_colaborador?: string;
}

export interface EmitirDecisionData {
  decision: DecisionDescargo;
  justificacion_decision: string;
}

// ============== MEMORANDO ==============

export interface Memorando {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  numero_memorando: string;
  tipo_falta: number;
  tipo_falta_nombre: string;
  fecha_memorando: string;
  descargo_relacionado: number | null;
  antecedentes: string;
  hechos: string;
  normas_infringidas: string;
  descargos_considerados: string;
  consideraciones: string;
  sancion_aplicada: TipoSancion;
  dias_suspension: number;
  fecha_inicio_sancion: string | null;
  fecha_fin_sancion: string | null;
  valor_multa: number;
  elaborado_por: number;
  elaborado_por_nombre: string;
  notificado: boolean;
  fecha_notificacion: string | null;
  apelacion: string;
  fecha_apelacion: string | null;
  resolucion_apelacion: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface MemorandoFormData {
  colaborador: number;
  tipo_falta: number;
  fecha_memorando: string;
  descargo_relacionado?: number | null;
  antecedentes?: string;
  hechos: string;
  normas_infringidas?: string;
  descargos_considerados?: string;
  consideraciones?: string;
  sancion_aplicada: TipoSancion;
  dias_suspension?: number;
  fecha_inicio_sancion?: string | null;
  fecha_fin_sancion?: string | null;
  valor_multa?: number;
}

export interface MemorandoFilter {
  colaborador?: number;
  tipo_falta?: number;
  sancion_aplicada?: TipoSancion;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface RegistrarApelacionData {
  apelacion: string;
}

// ============== HISTORIAL DISCIPLINARIO ==============

export interface HistorialDisciplinario {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre: string;
  tipo_evento: TipoEventoDisciplinario;
  fecha_evento: string;
  descripcion: string;
  referencia_id: number | null;
  gravedad: GravedadFalta | null;
  sancion_aplicada: TipoSancion | null;
  dias_suspension: number;
  valor_multa: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface HistorialDisciplinarioFilter {
  colaborador?: number;
  tipo_evento?: TipoEventoDisciplinario;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ResumenDisciplinario {
  colaborador_id: number;
  total_eventos: number;
  resumen_por_tipo: { tipo_evento: TipoEventoDisciplinario; total: number }[];
  ultimo_evento: HistorialDisciplinario | null;
}

// ============== LEY 2466/2025 — NOTIFICACIONES Y PRUEBAS ==============

export type TipoNotificacionDisciplinaria =
  | 'citacion_descargos'
  | 'notificacion_sancion'
  | 'notificacion_apelacion'
  | 'notificacion_resultado';

export type TipoPruebaDisciplinaria =
  | 'documental'
  | 'testimonial'
  | 'tecnica'
  | 'fotografica'
  | 'video';

export type PresentadaPor = 'empresa' | 'colaborador';

export interface NotificacionDisciplinaria {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre?: string;
  descargo: number | null;
  memorando: number | null;
  tipo: TipoNotificacionDisciplinaria;
  tipo_display?: string;
  contenido: string;
  fecha_entrega: string | null;
  acuse_recibo: boolean;
  fecha_acuse: string | null;
  testigo_entrega: string;
  archivo_soporte: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificacionDisciplinariaFormData {
  colaborador: number;
  descargo?: number | null;
  memorando?: number | null;
  tipo: TipoNotificacionDisciplinaria;
  contenido: string;
  fecha_entrega?: string | null;
  acuse_recibo?: boolean;
  fecha_acuse?: string | null;
  testigo_entrega?: string;
  archivo_soporte?: File | null;
}

export interface PruebaDisciplinaria {
  id: number;
  empresa: number;
  descargo: number;
  tipo_prueba: TipoPruebaDisciplinaria;
  tipo_prueba_display?: string;
  descripcion: string;
  presentada_por: PresentadaPor;
  presentada_por_display?: string;
  archivo: string | null;
  fecha_presentacion: string;
  admitida: boolean | null;
  observaciones_admision: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PruebaDisciplinariaFormData {
  descargo: number;
  tipo_prueba: TipoPruebaDisciplinaria;
  descripcion: string;
  presentada_por: PresentadaPor;
  archivo?: File | null;
}

// ============== OPTIONS ==============

export const gravedadFaltaOptions = [
  { value: 'leve', label: 'Leve' },
  { value: 'grave', label: 'Grave' },
  { value: 'muy_grave', label: 'Muy Grave' },
];

export const tipoLlamadoOptions = [
  { value: 'verbal', label: 'Verbal' },
  { value: 'escrito', label: 'Escrito' },
];

export const estadoDescargoOptions = [
  { value: 'citado', label: 'Citado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'no_presentado', label: 'No Presentado' },
];

export const decisionDescargoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'exonerado', label: 'Exonerado' },
  { value: 'sancionado', label: 'Sancionado' },
  { value: 'archivado', label: 'Archivado' },
];

export const tipoSancionOptions = [
  { value: 'amonestacion', label: 'Amonestación Escrita' },
  { value: 'suspension', label: 'Suspensión' },
  { value: 'multa', label: 'Multa' },
  { value: 'terminacion_justa_causa', label: 'Terminación con Justa Causa' },
];

export const tipoEventoDisciplinarioOptions = [
  { value: 'llamado_atencion', label: 'Llamado de Atención' },
  { value: 'descargo', label: 'Descargo' },
  { value: 'memorando', label: 'Memorando' },
  { value: 'suspension', label: 'Suspensión' },
  { value: 'terminacion', label: 'Terminación' },
];
