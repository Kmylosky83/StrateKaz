/**
 * Tipos TypeScript para Onboarding e Induccion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Basado en: backend/apps/talent_hub/onboarding_induccion/models.py
 */

// =============================================================================
// ENUMS Y CHOICES (alineados con backend models.py)
// =============================================================================

export type TipoModuloInduccion =
  | 'induccion_general'
  | 'induccion_especifica'
  | 'reinduccion'
  | 'sst'
  | 'calidad'
  | 'ambiente'
  | 'etica'
  | 'pesv'
  | 'otro';

export type FormatoContenido =
  | 'video'
  | 'presentacion'
  | 'documento'
  | 'quiz'
  | 'actividad'
  | 'presencial'
  | 'mixto';

export type EstadoEjecucion =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'reprobado'
  | 'cancelado';

export type EstadoChecklist = 'pendiente' | 'cumplido' | 'no_aplica' | 'incompleto';

export type CategoriaChecklist =
  | 'documentos'
  | 'afiliaciones'
  | 'equipos'
  | 'accesos'
  | 'capacitacion'
  | 'otros';

// TipoEPP ELIMINADO — EPP ahora usa catálogo TipoEPP de HSEQ Seguridad Industrial
// Re-exportar tipos HSEQ para compatibilidad
export type {
  EntregaEPP as HseqEntregaEPP,
  CreateEntregaEPPDTO,
  EstadoEntregaEPP,
  TipoEPP as HseqTipoEPP,
  CategoriaEPP,
} from '@/features/hseq/types/seguridad-industrial.types';

export type TipoActivo =
  | 'computador'
  | 'celular'
  | 'radio'
  | 'vehiculo'
  | 'herramienta'
  | 'uniforme'
  | 'carnet'
  | 'llaves'
  | 'tarjeta_acceso'
  | 'otro';

export type EstadoEntrega = 'nuevo' | 'buen_estado' | 'uso_normal' | 'desgastado';

export type EstadoDevolucion = 'buen_estado' | 'uso_normal' | 'desgastado' | 'danado' | 'perdido';

export type TipoDocumentoFirma =
  | 'contrato'
  | 'reglamento_interno'
  | 'politica_datos'
  | 'politica_sst'
  | 'acuerdo_confidencialidad'
  | 'autorizacion_descuento'
  | 'compromiso_cumplimiento'
  | 'otro';

export type MetodoFirma = 'fisico' | 'digital' | 'electronica';

// =============================================================================
// INTERFACES DE MODELOS
// =============================================================================

export interface ModuloInduccion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_modulo: TipoModuloInduccion;
  tipo_modulo_display?: string;
  formato_contenido: FormatoContenido;
  formato_display?: string;
  duracion_minutos: number;
  requiere_evaluacion: boolean;
  nota_minima_aprobacion: number;
  intentos_permitidos: number;
  contenido_url?: string;
  archivo_contenido?: string;
  preguntas_evaluacion?: unknown[];
  fecha_vigencia_desde?: string;
  fecha_vigencia_hasta?: string;
  orden: number;
  es_obligatorio: boolean;
  responsable?: number;
  responsable_nombre?: string;
  esta_vigente?: boolean;
  is_active: boolean;
}

export interface AsignacionPorCargo {
  id: number;
  cargo: number;
  cargo_nombre?: string;
  modulo: number;
  modulo_nombre?: string;
  es_obligatorio: boolean;
  dias_para_completar: number;
  orden_ejecucion: number;
  observaciones?: string;
  is_active: boolean;
}

export interface ItemChecklist {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: CategoriaChecklist;
  categoria_display?: string;
  requiere_adjunto: boolean;
  requiere_fecha: boolean;
  orden: number;
  aplica_a_todos: boolean;
  cargos_aplicables: number[];
  is_active: boolean;
}

export interface ChecklistIngreso {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  item: number;
  item_descripcion?: string;
  item_categoria?: string;
  estado: EstadoChecklist;
  estado_display?: string;
  fecha_cumplimiento?: string;
  archivo_adjunto?: string;
  observaciones?: string;
  verificado_por?: number;
  verificado_por_nombre?: string;
  fecha_verificacion?: string;
}

export interface EjecucionIntegral {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  modulo: number;
  modulo_nombre?: string;
  modulo_tipo?: string;
  modulo_info?: ModuloInduccion;
  estado: EstadoEjecucion;
  estado_display?: string;
  fecha_asignacion: string;
  fecha_limite: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  progreso_porcentaje: number;
  tiempo_dedicado_minutos: number;
  nota_obtenida?: number;
  intentos_realizados: number;
  respuestas_evaluacion?: Record<string, unknown>;
  observaciones?: string;
  retroalimentacion_colaborador?: string;
  facilitador?: number;
  facilitador_nombre?: string;
  esta_vencido?: boolean;
  aprobo?: boolean;
}

// EntregaEPP ELIMINADO — Usar HseqEntregaEPP de HSEQ Seguridad Industrial

export interface EntregaActivo {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_activo: TipoActivo;
  tipo_activo_display?: string;
  descripcion: string;
  codigo_activo?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  valor_activo?: string | null;
  fecha_entrega: string;
  fecha_devolucion?: string;
  estado_entrega: EstadoEntrega;
  estado_devolucion?: EstadoDevolucion;
  entregado_por?: number;
  entregado_por_nombre?: string;
  recibido_conforme: boolean;
  recibido_por?: number;
  recibido_por_nombre?: string;
  devuelto: boolean;
  observaciones?: string;
  acta_entrega?: string;
  acta_devolucion?: string;
  esta_pendiente_devolucion?: boolean;
}

export interface FirmaDocumento {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_documento: TipoDocumentoFirma;
  tipo_documento_display?: string;
  nombre_documento: string;
  version?: string;
  documento?: string;
  documento_firmado?: string;
  fecha_firma: string;
  firmado: boolean;
  metodo_firma: MetodoFirma;
  /** ID del HistorialContrato asociado (solo cuando tipo_documento='contrato') */
  historial_contrato?: number | null;
  /** Número de contrato legible (solo lectura) */
  historial_contrato_display?: string | null;
  testigo?: number;
  testigo_nombre?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES PARA ESTADISTICAS
// =============================================================================

export interface OnboardingEstadisticas {
  total_modulos: number;
  modulos_activos: number;
  inducciones_pendientes: number;
  inducciones_en_progreso: number;
  inducciones_completadas_mes: number;
  tasa_cumplimiento: number;
  epp_por_vencer: number;
  activos_pendientes_devolucion: number;
}

export interface ChecklistResumen {
  total: number;
  cumplidos: number;
  pendientes: number;
  porcentaje_avance: number;
}

export interface EjecucionResumen {
  total: number;
  completadas: number;
  en_progreso: number;
  pendientes: number;
  vencidas: number;
  porcentaje_avance: number;
}

// =============================================================================
// INTERFACES PARA FORMULARIOS
// =============================================================================

export interface ModuloInduccionFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_modulo: TipoModuloInduccion;
  formato_contenido: FormatoContenido;
  duracion_minutos: number;
  es_obligatorio: boolean;
  requiere_evaluacion: boolean;
  nota_minima_aprobacion?: number;
  intentos_permitidos?: number;
  contenido_url?: string;
  orden?: number;
  responsable?: number;
}

export interface ItemChecklistFormData {
  codigo: string;
  descripcion: string;
  categoria: CategoriaChecklist;
  requiere_adjunto: boolean;
  requiere_fecha: boolean;
  orden: number;
  aplica_a_todos: boolean;
  cargos_aplicables?: number[];
}

export interface EjecucionCreateData {
  colaborador: number;
  modulo: number;
  fecha_limite: string;
  facilitador?: number;
  observaciones?: string;
}

// EntregaEPPFormData ELIMINADO — Usar CreateEntregaEPPDTO de HSEQ

export interface EntregaActivoFormData {
  colaborador: number;
  tipo_activo: TipoActivo;
  descripcion: string;
  codigo_activo?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  valor_activo?: string | null;
  fecha_entrega: string;
  estado_entrega: EstadoEntrega;
  observaciones?: string;
}

export interface FirmaDocumentoFormData {
  colaborador: number;
  tipo_documento: TipoDocumentoFirma;
  nombre_documento: string;
  version?: string;
  fecha_firma: string;
  metodo_firma: MetodoFirma;
  /** Vincular a un contrato laboral existente (opcional, solo para tipo_documento='contrato') */
  historial_contrato?: number | null;
  observaciones?: string;
}
