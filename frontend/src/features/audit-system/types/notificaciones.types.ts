/**
 * Tipos para Centro de Notificaciones
 *
 * MN-001: Tipos para API de notificaciones
 *
 * IMPORTANTE: Estos tipos deben coincidir con los modelos del backend:
 * - backend/apps/audit_system/centro_notificaciones/models.py
 */

export type CategoriaNotificacion = 'sistema' | 'tarea' | 'alerta' | 'recordatorio' | 'aprobacion';
export type PrioridadNotificacion = 'baja' | 'normal' | 'alta' | 'urgente';
export type DestinatariosTipo = 'todos' | 'rol' | 'area' | 'usuarios_especificos';

/**
 * TipoNotificacion - Tipos de notificación configurables
 * Backend model: TipoNotificacion
 */
export interface TipoNotificacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono?: string;
  color: string;
  categoria: CategoriaNotificacion;
  plantilla_titulo: string;
  plantilla_mensaje: string;
  url_template?: string;
  es_email: boolean;
  es_push: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Notificacion - Notificaciones individuales
 * Backend model: Notificacion
 */
export interface Notificacion {
  id: number;
  tipo: number;
  tipo_nombre?: string;
  usuario: number;
  usuario_nombre?: string;
  titulo: string;
  mensaje: string;
  url?: string;
  datos_extra?: Record<string, unknown>;
  prioridad: PrioridadNotificacion;
  esta_leida: boolean;
  fecha_lectura?: string;
  esta_archivada: boolean;
  created_at: string;
  updated_at?: string;
  // Computed field from tipo
  categoria?: CategoriaNotificacion;
}

/**
 * PreferenciaNotificacion - Preferencias de notificación por usuario
 * Backend model: PreferenciaNotificacion
 */
export interface PreferenciaNotificacion {
  id: number;
  usuario: number;
  tipo_notificacion: number;
  recibir_app: boolean;
  recibir_email: boolean;
  recibir_push: boolean;
  horario_inicio?: string;
  horario_fin?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * NotificacionMasiva - Notificaciones enviadas a múltiples usuarios
 * Backend model: NotificacionMasiva
 */
export interface NotificacionMasiva {
  id: number;
  tipo: number;
  titulo: string;
  mensaje: string;
  destinatarios_tipo: DestinatariosTipo;
  roles?: number[];
  areas?: number[];
  usuarios?: number[];
  total_enviadas: number;
  total_leidas: number;
  enviada_por?: number;
  created_at: string;
  updated_at?: string;
}

export interface NotificacionFilters {
  usuario?: number;
  esta_leida?: boolean;
  prioridad?: PrioridadNotificacion;
  esta_archivada?: boolean;
}

/**
 * Respuesta paginada de DRF
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * NotificacionUI - Para compatibilidad con componentes existentes
 * Mapea los campos del backend a nombres más legibles para la UI
 */
export interface NotificacionUI {
  id: number;
  titulo: string;
  mensaje: string;
  categoria: string;
  prioridad: string;
  leida: boolean;
  archivada: boolean;
  created_at: string;
  tipo_nombre: string;
}

/**
 * Helper para convertir de API a UI
 */
export const toNotificacionUI = (notif: Notificacion): NotificacionUI => ({
  id: notif.id,
  titulo: notif.titulo,
  mensaje: notif.mensaje,
  categoria: notif.categoria || '',
  prioridad: notif.prioridad,
  leida: notif.esta_leida,
  archivada: notif.esta_archivada,
  created_at: notif.created_at,
  tipo_nombre: notif.tipo_nombre || '',
});
