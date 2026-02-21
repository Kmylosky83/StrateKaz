/**
 * TypeScript types para el Workflow Engine
 * Mapea 1:1 con los modelos de Django en:
 * - disenador_flujos/models.py
 * - ejecucion/models.py
 */

// ============================================================
// ENUMS
// ============================================================

export type EstadoPlantilla = 'BORRADOR' | 'ACTIVO' | 'OBSOLETO' | 'ARCHIVADO';

export type TipoNodo =
  | 'INICIO'
  | 'FIN'
  | 'TAREA'
  | 'GATEWAY_PARALELO'
  | 'GATEWAY_EXCLUSIVO'
  | 'EVENTO';

export type TipoCampo =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'EMAIL'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE'
  | 'SIGNATURE';

export type TipoAsignacion = 'ROL_SISTEMA' | 'CARGO' | 'GRUPO' | 'USUARIO' | 'DINAMICO';

export type EstadoInstancia = 'INICIADO' | 'EN_PROCESO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';

export type TipoTarea =
  | 'APROBACION'
  | 'REVISION'
  | 'FORMULARIO'
  | 'NOTIFICACION'
  | 'FIRMA'
  | 'SISTEMA';

export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'RECHAZADA' | 'ESCALADA';

export type Prioridad = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type EstadoFormulario = 'EN_PROGRESO' | 'COMPLETADO' | 'APROBADO' | 'RECHAZADO' | 'ANULADO';

export type EstadoAsignacion = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO' | 'CANCELADO';

export type AccionHistorial =
  | 'CREACION'
  | 'ASIGNACION'
  | 'REASIGNACION'
  | 'INICIO'
  | 'COMPLETACION'
  | 'RECHAZO'
  | 'ESCALAMIENTO'
  | 'COMENTARIO'
  | 'MODIFICACION'
  | 'CANCELACION';

export type TipoNotificacion =
  | 'TAREA_ASIGNADA'
  | 'TAREA_VENCIDA'
  | 'TAREA_COMPLETADA'
  | 'TAREA_RECHAZADA'
  | 'TAREA_ESCALADA'
  | 'FLUJO_INICIADO'
  | 'FLUJO_COMPLETADO'
  | 'FLUJO_CANCELADO'
  | 'APROBACION_REQUERIDA'
  | 'COMENTARIO_NUEVO'
  | 'ALERTA';

// ============================================================
// SHARED / GENERIC
// ============================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserRef {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

// ============================================================
// DESIGNER MODULE (disenador_flujos)
// ============================================================

export interface CategoriaFlujo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
  orden: number;
  activo: boolean;
  total_plantillas?: number;
  created_at: string;
  updated_at: string;
}

export interface PlantillaFlujo {
  id: number;
  categoria: number;
  categoria_detail?: CategoriaFlujo;
  codigo: string;
  nombre: string;
  descripcion: string;
  version: number;
  estado: EstadoPlantilla;
  xml_bpmn: string | null;
  json_diagram: Record<string, unknown> | null;
  tiempo_estimado_horas: string | null;
  requiere_aprobacion_gerencia: boolean;
  permite_cancelacion: boolean;
  etiquetas: string[];
  plantilla_origen: number | null;
  fecha_activacion: string | null;
  fecha_obsolescencia: string | null;
  puede_activar?: boolean;
  total_nodos?: number;
  total_transiciones?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface NodoFlujo {
  id: number;
  plantilla: number;
  tipo: TipoNodo;
  codigo: string;
  nombre: string;
  descripcion: string;
  posicion_x: number;
  posicion_y: number;
  rol_asignado: number | null;
  rol_asignado_detail?: RolFlujo;
  tiempo_estimado_horas: string | null;
  configuracion: Record<string, unknown>;
  es_tarea?: boolean;
  es_gateway?: boolean;
  total_campos_formulario?: number;
  created_at: string;
  updated_at: string;
}

export interface TransicionFlujo {
  id: number;
  plantilla: number;
  nodo_origen: number;
  nodo_destino: number;
  nombre: string;
  condicion: CondicionTransicion | null;
  prioridad: number;
  tiene_condicion?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CondicionTransicion {
  campo?: string;
  operador?: string;
  valor?: unknown;
  condiciones?: CondicionTransicion[];
}

export interface CampoFormulario {
  id: number;
  nodo: number;
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  orden: number;
  requerido: boolean;
  valor_defecto: string;
  opciones: OpcionCampo[] | null;
  validaciones: Record<string, unknown> | null;
  ayuda: string;
  placeholder: string;
  requiere_opciones?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpcionCampo {
  valor: string;
  etiqueta: string;
}

export interface RolFlujo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_asignacion: TipoAsignacion;
  rol_sistema_id: number | null;
  cargo_id: number | null;
  grupo_usuarios_id: number | null;
  usuario_id: number | null;
  regla_asignacion: Record<string, unknown> | null;
  color: string;
  permite_delegacion: boolean;
  activo: boolean;
  total_nodos_asignados?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EXECUTION MODULE (ejecucion)
// ============================================================

export interface InstanciaFlujo {
  id: number;
  codigo_instancia: string;
  titulo: string;
  descripcion: string;
  plantilla: number;
  plantilla_detail?: PlantillaFlujo;
  nodo_actual: number | null;
  nodo_actual_detail?: NodoFlujo;
  estado: EstadoInstancia;
  prioridad: Prioridad;
  data_contexto: Record<string, unknown>;
  variables_flujo: Record<string, unknown>;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_limite: string | null;
  tiempo_total_horas: string | null;
  iniciado_por: number;
  iniciado_por_detail?: UserRef;
  responsable_actual: number | null;
  responsable_actual_detail?: UserRef;
  finalizado_por: number | null;
  motivo_cancelacion: string;
  motivo_pausa: string;
  observaciones: string;
  esta_vencida?: boolean;
  progreso_porcentaje?: number;
  created_at: string;
  updated_at: string;
}

export interface TareaActiva {
  id: number;
  instancia: number;
  instancia_detail?: InstanciaFlujo;
  nodo: number;
  nodo_detail?: NodoFlujo;
  codigo_tarea: string;
  nombre_tarea: string;
  descripcion: string;
  tipo_tarea: TipoTarea;
  estado: EstadoTarea;
  asignado_a: number | null;
  asignado_a_detail?: UserRef;
  rol_asignado: string;
  asignado_por: number | null;
  fecha_creacion: string;
  fecha_inicio: string | null;
  fecha_completada: string | null;
  fecha_vencimiento: string | null;
  tiempo_ejecucion_horas: string | null;
  formulario_schema: Record<string, unknown> | null;
  formulario_data: Record<string, unknown> | null;
  decision: string;
  escalada_a: number | null;
  motivo_escalamiento: string;
  motivo_rechazo: string;
  observaciones: string;
  esta_vencida?: boolean;
  horas_restantes?: number;
  created_at: string;
  updated_at: string;
}

export interface HistorialTarea {
  id: number;
  tarea: number;
  instancia: number;
  accion: AccionHistorial;
  descripcion: string;
  estado_anterior: string;
  estado_nuevo: string;
  asignado_anterior: number | null;
  asignado_nuevo: number | null;
  datos_cambio: Record<string, unknown>;
  usuario: number;
  usuario_detail?: UserRef;
  fecha_accion: string;
  observaciones: string;
}

export interface ArchivoAdjunto {
  id: number;
  instancia: number | null;
  tarea: number | null;
  archivo: string;
  nombre_original: string;
  tipo_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  titulo: string;
  descripcion: string;
  metadatos: Record<string, unknown>;
  subido_por: number;
  fecha_subida: string;
  tamano_legible?: string;
}

export interface NotificacionFlujo {
  id: number;
  destinatario: number;
  destinatario_detail?: UserRef;
  instancia: number | null;
  tarea: number | null;
  tipo_notificacion: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: Prioridad;
  datos_contexto: Record<string, unknown>;
  url_accion: string;
  leida: boolean;
  fecha_lectura: string | null;
  enviada_app: boolean;
  enviada_email: boolean;
  fecha_creacion: string;
  tiempo_desde_creacion?: string;
}

// ============================================================
// FORM BUILDER (disenador_flujos - FormularioDiligenciado)
// ============================================================

export interface FormularioDiligenciado {
  id: number;
  plantilla_flujo: number;
  numero_formulario: string;
  titulo: string;
  diligenciado_por: number;
  diligenciado_por_detail?: UserRef;
  fecha_diligenciamiento: string;
  fecha_completado: string | null;
  datos_formulario: Record<string, unknown>;
  estado: EstadoFormulario;
  observaciones: string;
  respuestas?: RespuestaCampo[];
  created_at: string;
  updated_at: string;
}

export interface RespuestaCampo {
  id: number;
  formulario_diligenciado: number;
  campo_formulario: number;
  campo_formulario_detail?: CampoFormulario;
  valor: unknown;
  firma_base64: string | null;
  modificado_por: number;
  fecha_modificacion: string;
  es_valido: boolean;
  mensaje_validacion: string;
  version: number;
  valor_anterior: unknown;
}

export interface AsignacionFormulario {
  id: number;
  plantilla_flujo: number;
  asignado_a: number;
  asignado_a_detail?: UserRef;
  asignado_por: number;
  area_id: number | null;
  fecha_asignacion: string;
  fecha_limite: string | null;
  estado: EstadoAsignacion;
  prioridad: Prioridad;
  titulo: string;
  descripcion: string;
  notificacion_enviada: boolean;
  dias_recordatorio: number;
  formulario_diligenciado: number | null;
  formulario_detalle?: FormularioDiligenciado;
  created_at: string;
  updated_at: string;
}

// ============================================================
// DTOs (Create / Update)
// ============================================================

export interface CreatePlantillaDTO {
  categoria?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tiempo_estimado_horas?: string;
  requiere_aprobacion_gerencia?: boolean;
  permite_cancelacion?: boolean;
  etiquetas?: string[];
}

export interface UpdatePlantillaDTO extends Partial<CreatePlantillaDTO> {
  json_diagram?: Record<string, unknown>;
}

export interface CreateNodoDTO {
  plantilla: number;
  tipo: TipoNodo;
  codigo: string;
  nombre: string;
  descripcion?: string;
  posicion_x: number;
  posicion_y: number;
  rol_asignado?: number;
  tiempo_estimado_horas?: string;
  configuracion?: Record<string, unknown>;
}

export type UpdateNodoDTO = Partial<CreateNodoDTO>;

export interface CreateTransicionDTO {
  plantilla: number;
  nodo_origen: number;
  nodo_destino: number;
  nombre?: string;
  condicion?: CondicionTransicion;
  prioridad?: number;
}

export type UpdateTransicionDTO = Partial<CreateTransicionDTO>;

export interface CreateCampoFormularioDTO {
  nodo: number;
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  orden?: number;
  requerido?: boolean;
  valor_defecto?: string;
  opciones?: OpcionCampo[];
  validaciones?: Record<string, unknown>;
  ayuda?: string;
  placeholder?: string;
}

export interface CreateRolFlujoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_asignacion: TipoAsignacion;
  rol_sistema_id?: number;
  cargo_id?: number;
  grupo_usuarios_id?: number;
  usuario_id?: number;
  regla_asignacion?: Record<string, unknown>;
  color?: string;
  permite_delegacion?: boolean;
}

export interface IniciarFlujoDTO {
  plantilla_id: number;
  titulo: string;
  descripcion?: string;
  datos_iniciales?: Record<string, unknown>;
  prioridad?: Prioridad;
}

export interface CompletarTareaDTO {
  formulario_data?: Record<string, unknown>;
  decision?: string;
  observaciones?: string;
}

export interface RechazarTareaDTO {
  motivo_rechazo: string;
  observaciones?: string;
}

// ============================================================
// FILTER TYPES
// ============================================================

export interface PlantillaFilters {
  estado?: EstadoPlantilla;
  categoria?: number;
  search?: string;
}

export interface InstanciaFilters {
  estado?: EstadoInstancia;
  prioridad?: Prioridad;
  plantilla?: number;
  responsable_actual?: number;
  search?: string;
}

export interface TareaFilters {
  estado?: EstadoTarea;
  tipo_tarea?: TipoTarea;
  instancia?: number;
  asignado_a?: number;
  search?: string;
}

export interface NotificacionFilters {
  leida?: boolean;
  tipo_notificacion?: TipoNotificacion;
}

// ============================================================
// REACT FLOW TYPES (for canvas)
// ============================================================

export interface WorkflowNodeData {
  tipo: TipoNodo;
  nodo: NodoFlujo;
  rolDetail?: RolFlujo;
  camposCount?: number;
  onEdit?: (nodoId: number) => void;
  onDelete?: (nodoId: number) => void;
  isSelected?: boolean;
}

export interface WorkflowEdgeData {
  transicion: TransicionFlujo;
  hasCondition: boolean;
}
