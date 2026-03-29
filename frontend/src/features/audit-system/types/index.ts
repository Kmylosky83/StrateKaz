/**
 * Types para Audit System
 * Sistema de Auditoría StrateKaz
 */

// ==================== LOGS SISTEMA ====================

export type TipoEventoAcceso =
  | 'login'
  | 'logout'
  | 'login_fallido'
  | 'sesion_expirada'
  | 'cambio_password';
export type AccionCambio = 'crear' | 'modificar' | 'eliminar';

export interface ConfiguracionAuditoria {
  id: number;
  empresa: number;
  modulo: string;
  modelo: string;
  auditar_creacion: boolean;
  auditar_modificacion: boolean;
  auditar_eliminacion: boolean;
  auditar_consulta: boolean;
  campos_sensibles: string[];
  dias_retencion: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogAcceso {
  id: number;
  usuario: number;
  usuario_nombre: string;
  tipo_evento: TipoEventoAcceso;
  ip_address: string;
  user_agent: string;
  ubicacion?: string;
  dispositivo?: string;
  navegador?: string;
  fue_exitoso: boolean;
  mensaje_error?: string;
  fecha: string;
}

export interface LogCambio {
  id: number;
  usuario: number;
  usuario_nombre: string;
  content_type: number;
  content_type_nombre?: string;
  object_id: string;
  object_repr: string;
  accion: AccionCambio;
  cambios: Record<string, { old: unknown; new: unknown }>;
  fecha: string;
  ip_address?: string;
}

export interface LogConsulta {
  id: number;
  usuario: number;
  usuario_nombre: string;
  modulo: string;
  endpoint: string;
  parametros?: Record<string, unknown>;
  registros_accedidos: number;
  fue_exportacion: boolean;
  formato_exportacion?: string;
  ip_address?: string;
  fecha: string;
  created_at: string;
}

// ==================== CENTRO NOTIFICACIONES ====================
// Los tipos de notificaciones están definidos en ./notificaciones.types.ts
// Importar desde ahí: import { ... } from './notificaciones.types';
export * from './notificaciones.types';

// ==================== CONFIG ALERTAS ====================

export type CategoriaAlerta = 'vencimiento' | 'umbral' | 'evento' | 'inactividad' | 'cumplimiento';
export type SeveridadAlerta = 'info' | 'warning' | 'danger' | 'critical';

export interface TipoAlerta {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaAlerta;
  descripcion?: string;
  severidad_default: SeveridadAlerta;
  modulo_origen: string;
  modelo_origen?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionAlerta {
  id: number;
  empresa: number;
  tipo_alerta: number;
  tipo_alerta_nombre?: string;
  nombre: string;
  condicion: Record<string, unknown>;
  dias_anticipacion?: number;
  frecuencia_verificacion: 'cada_hora' | 'diario' | 'semanal';
  notificar_a: string;
  crear_tarea: boolean;
  enviar_email: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertaGenerada {
  id: number;
  configuracion: number;
  configuracion_nombre?: string;
  content_type?: number;
  object_id?: string;
  titulo: string;
  mensaje: string;
  severidad: SeveridadAlerta;
  fecha_vencimiento?: string;
  esta_atendida: boolean;
  atendida_por?: number;
  fecha_atencion?: string;
  accion_tomada?: string;
  created_at: string;
}

export interface EscalamientoAlerta {
  id: number;
  empresa: number;
  configuracion_alerta: number;
  nivel: number;
  horas_espera: number;
  notificar_a: string;
  mensaje_escalamiento: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== TAREAS RECORDATORIOS ====================

export type TipoTarea = 'manual' | 'automatica' | 'recurrente';
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada' | 'vencida';
export type PrioridadTarea = 'baja' | 'normal' | 'alta' | 'urgente';
export type TipoEvento = 'reunion' | 'capacitacion' | 'auditoria' | 'mantenimiento' | 'otro';
export type Repeticion = 'una_vez' | 'diario' | 'semanal' | 'mensual';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  asignado_a: number;
  asignado_a_nombre?: string;
  creado_por?: number;
  creado_por_nombre?: string;
  content_type?: number;
  object_id?: string;
  url_relacionada?: string;
  fecha_limite: string;
  fecha_completada?: string;
  porcentaje_avance: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Recordatorio {
  id: number;
  tarea?: number;
  titulo: string;
  mensaje: string;
  usuario: number;
  usuario_nombre?: string;
  fecha_recordatorio: string;
  repetir: Repeticion;
  dias_repeticion?: number[];
  hora_repeticion?: string;
  esta_activo: boolean;
  ultima_ejecucion?: string;
  proxima_ejecucion?: string;
  created_at: string;
  updated_at: string;
}

export interface EventoCalendario {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: TipoEvento;
  fecha_inicio: string;
  fecha_fin: string;
  todo_el_dia: boolean;
  ubicacion?: string;
  url_reunion?: string;
  participantes: number[];
  participantes_nombres?: string[];
  creado_por?: number;
  creado_por_nombre?: string;
  color?: string;
  recordar_antes?: number;
  created_at: string;
  updated_at: string;
}

export interface ComentarioTarea {
  id: number;
  tarea: number;
  usuario: number;
  usuario_nombre?: string;
  mensaje: string;
  archivo_adjunto?: string;
  created_at: string;
}

// ==================== STATS & SUMMARY TYPES ====================

export interface AuditSystemStats {
  logs_hoy: number;
  notificaciones_sin_leer: number;
  alertas_pendientes: number;
  alertas_criticas: number;
  tareas_vencidas: number;
  tareas_hoy: number;
  eventos_semana: number;
}

export interface ActividadReciente {
  id: number;
  tipo: 'log' | 'notificacion' | 'alerta' | 'tarea';
  titulo: string;
  descripcion: string;
  usuario?: string;
  fecha: string;
  severidad?: SeveridadAlerta;
  prioridad?: PrioridadTarea;
}

export interface ResumenNotificaciones {
  total: number;
  no_leidas: number;
  por_categoria: Record<CategoriaNotificacion, number>;
  por_prioridad: Record<PrioridadNotificacion, number>;
}

export interface ResumenAlertas {
  total: number;
  pendientes: number;
  por_severidad: Record<SeveridadAlerta, number>;
  por_categoria: Record<CategoriaAlerta, number>;
}

export interface ResumenTareas {
  total: number;
  pendientes: number;
  vencidas: number;
  completadas_mes: number;
  por_prioridad: Record<PrioridadTarea, number>;
  por_estado: Record<EstadoTarea, number>;
}
