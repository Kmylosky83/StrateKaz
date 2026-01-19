/**
 * Tipos para Centro de Notificaciones
 *
 * MN-001: Tipos para API de notificaciones
 */

export type CategoriaNotiifcacion = 'sistema' | 'tarea' | 'alerta' | 'recordatorio' | 'aprobacion';
export type PrioridadNotificacion = 'baja' | 'normal' | 'alta' | 'urgente';
export type FrecuenciaResumen = 'tiempo_real' | 'diario' | 'semanal' | 'nunca';

export interface TipoNotificacion {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaNotiifcacion;
  descripcion?: string;
  plantilla_titulo: string;
  plantilla_cuerpo: string;
  enviar_email: boolean;
  enviar_push: boolean;
  enviar_sms: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion | number;
  tipo_notificacion_nombre?: string;
  usuario: number;
  titulo: string;
  cuerpo: string;
  categoria: CategoriaNotiifcacion;
  prioridad: PrioridadNotificacion;
  esta_leida: boolean;
  leida_at?: string;
  archivada: boolean;
  archivada_at?: string;
  datos_adicionales?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface PreferenciaNotificacion {
  id: number;
  usuario: number;
  categoria: CategoriaNotiifcacion;
  recibir_email: boolean;
  recibir_push: boolean;
  recibir_sms: boolean;
  frecuencia_resumen: FrecuenciaResumen;
  horario_silencio_inicio?: string;
  horario_silencio_fin?: string;
}

export interface NotificacionMasiva {
  id: number;
  tipo: TipoNotificacion | number;
  titulo: string;
  cuerpo: string;
  destinatarios_tipo: 'todos' | 'cargo' | 'area' | 'seleccion';
  destinatarios_filtro?: Record<string, unknown>;
  enviada_at?: string;
  enviada_por?: number;
  total_destinatarios: number;
  total_enviados: number;
  created_at: string;
}

export interface NotificacionFilters {
  usuario?: number;
  esta_leida?: boolean;
  prioridad?: PrioridadNotificacion;
  categoria?: CategoriaNotiifcacion;
  archivada?: boolean;
}

// Para compatibilidad con el componente existente
export interface NotificacionUI {
  id: number;
  titulo: string;
  cuerpo: string;
  categoria: string;
  prioridad: string;
  leida: boolean;
  archivada: boolean;
  created_at: string;
  tipo_notificacion_nombre: string;
}

// Helper para convertir de API a UI
export const toNotificacionUI = (notif: Notificacion): NotificacionUI => ({
  id: notif.id,
  titulo: notif.titulo,
  cuerpo: notif.cuerpo,
  categoria: notif.categoria,
  prioridad: notif.prioridad,
  leida: notif.esta_leida,
  archivada: notif.archivada,
  created_at: notif.created_at,
  tipo_notificacion_nombre: notif.tipo_notificacion_nombre || '',
});
