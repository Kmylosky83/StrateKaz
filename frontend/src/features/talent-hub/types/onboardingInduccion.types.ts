/**
 * Tipos TypeScript para Onboarding e Induccion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Basado en: backend/apps/talent_hub/onboarding_induccion/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type TipoModuloInduccion =
  | 'corporativo'
  | 'seguridad'
  | 'puesto'
  | 'sistema'
  | 'normativo'
  | 'especifico';

export type FormatoContenido =
  | 'video'
  | 'presentacion'
  | 'documento'
  | 'interactivo'
  | 'mixto';

export type EstadoEjecucion =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'vencido'
  | 'omitido';

export type CategoriaChecklist =
  | 'documentacion'
  | 'afiliaciones'
  | 'capacitacion'
  | 'equipamiento'
  | 'accesos'
  | 'otros';

export type TipoEPP =
  | 'casco'
  | 'gafas'
  | 'guantes'
  | 'botas'
  | 'overol'
  | 'protector_auditivo'
  | 'mascarilla'
  | 'respirador'
  | 'arnes'
  | 'chaleco'
  | 'otros';

export type TipoActivo =
  | 'computador'
  | 'celular'
  | 'tablet'
  | 'herramienta'
  | 'vehiculo'
  | 'mobiliario'
  | 'otro';

export type EstadoActivo =
  | 'nuevo'
  | 'buen_estado'
  | 'regular'
  | 'requiere_mantenimiento';

export type TipoDocumentoFirma =
  | 'contrato'
  | 'reglamento'
  | 'politica'
  | 'autorizacion'
  | 'consentimiento'
  | 'confidencialidad'
  | 'otro';

export type MetodoFirma =
  | 'fisica'
  | 'electronica'
  | 'digital';

// =============================================================================
// INTERFACES DE MODELOS
// =============================================================================

export interface ModuloInduccion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_modulo: TipoModuloInduccion;
  tipo_display?: string;
  formato_contenido: FormatoContenido;
  formato_display?: string;
  duracion_minutos: number;
  es_obligatorio: boolean;
  requiere_evaluacion: boolean;
  nota_minima_aprobacion: number;
  orden: number;
  url_contenido?: string;
  contenido_texto?: string;
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
}

export interface ItemChecklist {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: CategoriaChecklist;
  categoria_display?: string;
  responsable_area?: string;
  aplica_a_todos: boolean;
  cargos_aplicables: number[];
  requiere_adjunto: boolean;
  dias_limite: number;
  orden: number;
  is_active: boolean;
}

export interface ChecklistIngreso {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  item: number;
  item_descripcion?: string;
  estado: 'pendiente' | 'cumplido' | 'no_aplica' | 'vencido';
  estado_display?: string;
  fecha_cumplimiento?: string;
  observaciones?: string;
  adjunto?: string;
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
  modulo_info?: ModuloInduccion;
  fecha_asignacion: string;
  fecha_limite: string;
  fecha_inicio?: string;
  fecha_completado?: string;
  estado: EstadoEjecucion;
  estado_display?: string;
  progreso_porcentaje: number;
  nota_obtenida?: number;
  intentos_evaluacion: number;
  tiempo_dedicado_minutos: number;
  observaciones?: string;
}

export interface EntregaEPP {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_epp: TipoEPP;
  tipo_display?: string;
  descripcion: string;
  marca?: string;
  referencia?: string;
  talla?: string;
  cantidad: number;
  fecha_entrega: string;
  fecha_vencimiento?: string;
  esta_vencido?: boolean;
  entregado_por?: number;
  entregado_por_nombre?: string;
  recibido_conforme: boolean;
  firma_recibido?: string;
  observaciones?: string;
}

export interface EntregaActivo {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_activo: TipoActivo;
  tipo_display?: string;
  descripcion: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  codigo_activo?: string;
  estado_entrega: EstadoActivo;
  fecha_entrega: string;
  entregado_por?: number;
  entregado_por_nombre?: string;
  acta_entrega?: string;
  devuelto: boolean;
  fecha_devolucion?: string;
  estado_devolucion?: string;
  observaciones_devolucion?: string;
}

export interface FirmaDocumento {
  id: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_documento: TipoDocumentoFirma;
  tipo_display?: string;
  nombre_documento: string;
  descripcion?: string;
  documento_url?: string;
  fecha_firma?: string;
  firmado: boolean;
  metodo_firma?: MetodoFirma;
  firma_digital?: string;
  ip_firma?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES PARA ESTADISTICAS
// =============================================================================

export interface OnboardingEstadisticas {
  colaboradores_en_induccion: number;
  modulos_completados_mes: number;
  tasa_completitud: number;
  checklist_pendientes: number;
  epp_por_entregar: number;
  documentos_sin_firmar: number;
  tiempo_promedio_induccion: number;
  vencimientos_proximos: number;
}

export interface ProgresoColaborador {
  colaborador_id: number;
  colaborador_nombre: string;
  fecha_ingreso: string;
  modulos_total: number;
  modulos_completados: number;
  porcentaje_avance: number;
  checklist_pendientes: number;
  dias_en_induccion: number;
  estado: 'en_tiempo' | 'retrasado' | 'completado';
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
  orden?: number;
  url_contenido?: string;
  contenido_texto?: string;
}

export interface EntregaEPPFormData {
  colaborador: number;
  tipo_epp: TipoEPP;
  descripcion: string;
  marca?: string;
  referencia?: string;
  talla?: string;
  cantidad: number;
  fecha_entrega: string;
  fecha_vencimiento?: string;
  observaciones?: string;
}

export interface EntregaActivoFormData {
  colaborador: number;
  tipo_activo: TipoActivo;
  descripcion: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  codigo_activo?: string;
  estado_entrega: EstadoActivo;
  fecha_entrega: string;
  observaciones?: string;
}
