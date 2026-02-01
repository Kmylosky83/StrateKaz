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
  modelo: string;
  tipo_consulta: 'lectura' | 'exportacion' | 'reporte' | 'api';
  parametros?: Record<string, unknown>;
  registros_afectados: number;
  duracion_ms?: number;
  fecha: string;
  ip_address?: string;
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
  severidad_base: SeveridadAlerta;
  condicion_disparo: Record<string, unknown>;
  dias_anticipacion?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionAlerta {
  id: number;
  empresa: number;
  tipo_alerta: number;
  tipo_alerta_nombre?: string;
  modulo: string;
  modelo: string;
  campo_fecha?: string;
  campo_umbral?: string;
  valor_umbral?: number;
  responsable_default?: number;
  responsable_nombre?: string;
  escalar_automaticamente: boolean;
  dias_escalamiento?: number;
  notificar_responsable: boolean;
  notificar_supervisor: boolean;
  notificar_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertaGenerada {
  id: number;
  configuracion: number;
  configuracion_nombre?: string;
  tipo_alerta: number;
  tipo_alerta_nombre?: string;
  severidad: SeveridadAlerta;
  titulo: string;
  descripcion: string;
  object_id?: string;
  object_repr?: string;
  responsable?: number;
  responsable_nombre?: string;
  fecha_alerta: string;
  fecha_vencimiento?: string;
  atendida: boolean;
  fecha_atencion?: string;
  atendida_por?: number;
  atendida_por_nombre?: string;
  observaciones_atencion?: string;
  escalada: boolean;
  fecha_escalamiento?: string;
  created_at: string;
}

export interface EscalamientoAlerta {
  id: number;
  alerta: number;
  nivel_escalamiento: number;
  escalado_a: number;
  escalado_a_nombre?: string;
  motivo_escalamiento: string;
  fecha_escalamiento: string;
  resuelto: boolean;
  fecha_resolucion?: string;
  observaciones?: string;
  created_at: string;
}

// ==================== TAREAS RECORDATORIOS ====================

export type TipoTarea = 'manual' | 'automatica' | 'recurrente';
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada' | 'vencida';
export type PrioridadTarea = 'baja' | 'normal' | 'alta' | 'urgente';
export type TipoEvento = 'reunion' | 'capacitacion' | 'auditoria' | 'mantenimiento' | 'otro';
export type Repeticion = 'una_vez' | 'diario' | 'semanal' | 'mensual';

export interface Tarea {
  id: number;
  empresa: number;
  codigo: string;
  titulo: string;
  descripcion?: string;
  tipo_tarea: TipoTarea;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  asignado_a: number;
  asignado_a_nombre?: string;
  asignado_por?: number;
  asignado_por_nombre?: string;
  modulo_origen?: string;
  object_id?: string;
  fecha_inicio?: string;
  fecha_limite: string;
  fecha_completada?: string;
  porcentaje_avance: number;
  tiempo_estimado_horas?: number;
  tiempo_real_horas?: number;
  tags?: string[];
  adjuntos?: string[];
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface Recordatorio {
  id: number;
  empresa: number;
  titulo: string;
  descripcion?: string;
  tipo_repeticion: Repeticion;
  dias_semana?: number[];
  dia_mes?: number;
  hora_recordatorio: string;
  activo: boolean;
  ultima_ejecucion?: string;
  proxima_ejecucion?: string;
  usuario: number;
  usuario_nombre?: string;
  tarea_relacionada?: number;
  created_at: string;
  updated_at: string;
}

export interface EventoCalendario {
  id: number;
  empresa: number;
  titulo: string;
  descripcion?: string;
  tipo_evento: TipoEvento;
  fecha_inicio: string;
  fecha_fin: string;
  todo_el_dia: boolean;
  ubicacion?: string;
  participantes: number[];
  participantes_nombres?: string[];
  organizador: number;
  organizador_nombre?: string;
  url_reunion?: string;
  recordatorio_minutos?: number;
  color?: string;
  tarea_relacionada?: number;
  created_at: string;
  updated_at: string;
}

export interface ComentarioTarea {
  id: number;
  tarea: number;
  usuario: number;
  usuario_nombre?: string;
  comentario: string;
  adjuntos?: string[];
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
