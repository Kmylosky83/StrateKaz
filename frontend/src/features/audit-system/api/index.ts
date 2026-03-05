/**
 * API Client - Audit System
 * Sistema de Auditoría StrateKaz
 */

import { apiClient } from '@/lib/api-client';
import type {
  ConfiguracionAuditoria,
  LogAcceso,
  LogCambio,
  LogConsulta,
  TipoNotificacion,
  Notificacion,
  PreferenciaNotificacion,
  NotificacionMasiva,
  TipoAlerta,
  ConfiguracionAlerta,
  AlertaGenerada,
  EscalamientoAlerta,
  Tarea,
  Recordatorio,
  EventoCalendario,
  ComentarioTarea,
  AuditSystemStats,
  ActividadReciente,
  ResumenNotificaciones,
  ResumenAlertas,
  ResumenTareas,
} from '../types';

const API_BASE = '/audit';

// ==================== LOGS SISTEMA ====================

export const configuracionAuditoriaApi = {
  getAll: () => apiClient.get<ConfiguracionAuditoria[]>(`${API_BASE}/logs-sistema/configuracion/`),

  getById: (id: number) =>
    apiClient.get<ConfiguracionAuditoria>(`${API_BASE}/logs-sistema/configuracion/${id}/`),

  create: (data: Partial<ConfiguracionAuditoria>) =>
    apiClient.post<ConfiguracionAuditoria>(`${API_BASE}/logs-sistema/configuracion/`, data),

  update: (id: number, data: Partial<ConfiguracionAuditoria>) =>
    apiClient.patch<ConfiguracionAuditoria>(`${API_BASE}/logs-sistema/configuracion/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/logs-sistema/configuracion/${id}/`),
};

export const logsAccesoApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<LogAcceso[]>(`${API_BASE}/logs-sistema/accesos/`, { params }),

  getById: (id: number) => apiClient.get<LogAcceso>(`${API_BASE}/logs-sistema/accesos/${id}/`),

  porUsuario: (usuarioId: number, params?: Record<string, unknown>) =>
    apiClient.get<LogAcceso[]>(`${API_BASE}/logs-sistema/accesos/por-usuario/${usuarioId}/`, {
      params,
    }),

  porFecha: (fechaInicio: string, fechaFin: string) =>
    apiClient.get<LogAcceso[]>(`${API_BASE}/logs-sistema/accesos/por-fecha/`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),

  stats: () => apiClient.get(`${API_BASE}/logs-sistema/accesos/stats/`),
};

export const logsCambioApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<LogCambio[]>(`${API_BASE}/logs-sistema/cambios/`, { params }),

  getById: (id: number) => apiClient.get<LogCambio>(`${API_BASE}/logs-sistema/cambios/${id}/`),

  porObjeto: (contentType: number, objectId: string) =>
    apiClient.get<LogCambio[]>(`${API_BASE}/logs-sistema/cambios/por-objeto/`, {
      params: { content_type: contentType, object_id: objectId },
    }),

  porUsuario: (usuarioId: number, params?: Record<string, unknown>) =>
    apiClient.get<LogCambio[]>(`${API_BASE}/logs-sistema/cambios/por-usuario/${usuarioId}/`, {
      params,
    }),

  exportar: (formato: 'excel' | 'csv', params?: Record<string, unknown>) =>
    apiClient.get(`${API_BASE}/logs-sistema/cambios/exportar/`, {
      params: { formato, ...params },
      responseType: 'blob',
    }),
};

export const logsConsultaApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<LogConsulta[]>(`${API_BASE}/logs-sistema/consultas/`, { params }),

  getById: (id: number) => apiClient.get<LogConsulta>(`${API_BASE}/logs-sistema/consultas/${id}/`),

  porModulo: (modulo: string, params?: Record<string, unknown>) =>
    apiClient.get<LogConsulta[]>(`${API_BASE}/logs-sistema/consultas/por-modulo/`, {
      params: { modulo, ...params },
    }),
};

// ==================== CENTRO NOTIFICACIONES ====================

export const tiposNotificacionApi = {
  getAll: () => apiClient.get<TipoNotificacion[]>(`${API_BASE}/notificaciones/tipos/`),

  getById: (id: number) =>
    apiClient.get<TipoNotificacion>(`${API_BASE}/notificaciones/tipos/${id}/`),

  create: (data: Partial<TipoNotificacion>) =>
    apiClient.post<TipoNotificacion>(`${API_BASE}/notificaciones/tipos/`, data),

  update: (id: number, data: Partial<TipoNotificacion>) =>
    apiClient.patch<TipoNotificacion>(`${API_BASE}/notificaciones/tipos/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/notificaciones/tipos/${id}/`),
};

export const notificacionesApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<Notificacion[]>(`${API_BASE}/notificaciones/`, { params }),

  getById: (id: number) => apiClient.get<Notificacion>(`${API_BASE}/notificaciones/${id}/`),

  marcarLeida: (id: number) => apiClient.post(`${API_BASE}/notificaciones/${id}/marcar-leida/`),

  marcarTodasLeidas: () => apiClient.post(`${API_BASE}/notificaciones/marcar-todas-leidas/`),

  archivar: (id: number) => apiClient.post(`${API_BASE}/notificaciones/${id}/archivar/`),

  noLeidas: () => apiClient.get<Notificacion[]>(`${API_BASE}/notificaciones/no-leidas/`),

  resumen: () => apiClient.get<ResumenNotificaciones>(`${API_BASE}/notificaciones/resumen/`),
};

export const preferenciasNotificacionApi = {
  getAll: () =>
    apiClient.get<PreferenciaNotificacion[]>(`${API_BASE}/notificaciones/preferencias/`),

  getById: (id: number) =>
    apiClient.get<PreferenciaNotificacion>(`${API_BASE}/notificaciones/preferencias/${id}/`),

  update: (id: number, data: Partial<PreferenciaNotificacion>) =>
    apiClient.patch<PreferenciaNotificacion>(
      `${API_BASE}/notificaciones/preferencias/${id}/`,
      data
    ),
};

export const notificacionesMasivasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<NotificacionMasiva[]>(`${API_BASE}/notificaciones/masivas/`, { params }),

  getById: (id: number) =>
    apiClient.get<NotificacionMasiva>(`${API_BASE}/notificaciones/masivas/${id}/`),

  create: (data: Partial<NotificacionMasiva>) =>
    apiClient.post<NotificacionMasiva>(`${API_BASE}/notificaciones/masivas/`, data),

  enviar: (id: number) => apiClient.post(`${API_BASE}/notificaciones/masivas/${id}/enviar/`),
};

// ==================== CONFIG ALERTAS ====================

export const tiposAlertaApi = {
  getAll: () => apiClient.get<TipoAlerta[]>(`${API_BASE}/config-alertas/tipos/`),

  getById: (id: number) => apiClient.get<TipoAlerta>(`${API_BASE}/config-alertas/tipos/${id}/`),

  create: (data: Partial<TipoAlerta>) =>
    apiClient.post<TipoAlerta>(`${API_BASE}/config-alertas/tipos/`, data),

  update: (id: number, data: Partial<TipoAlerta>) =>
    apiClient.patch<TipoAlerta>(`${API_BASE}/config-alertas/tipos/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/config-alertas/tipos/${id}/`),
};

export const configuracionesAlertaApi = {
  getAll: () => apiClient.get<ConfiguracionAlerta[]>(`${API_BASE}/config-alertas/configuraciones/`),

  getById: (id: number) =>
    apiClient.get<ConfiguracionAlerta>(`${API_BASE}/config-alertas/configuraciones/${id}/`),

  create: (data: Partial<ConfiguracionAlerta>) =>
    apiClient.post<ConfiguracionAlerta>(`${API_BASE}/config-alertas/configuraciones/`, data),

  update: (id: number, data: Partial<ConfiguracionAlerta>) =>
    apiClient.patch<ConfiguracionAlerta>(`${API_BASE}/config-alertas/configuraciones/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/config-alertas/configuraciones/${id}/`),
};

export const alertasGeneradasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<AlertaGenerada[]>(`${API_BASE}/config-alertas/alertas-generadas/`, { params }),

  getById: (id: number) =>
    apiClient.get<AlertaGenerada>(`${API_BASE}/config-alertas/alertas-generadas/${id}/`),

  atender: (id: number, observaciones?: string) =>
    apiClient.post(`${API_BASE}/config-alertas/alertas-generadas/${id}/atender/`, {
      observaciones,
    }),

  escalar: (id: number, escaladoA: number, motivo: string) =>
    apiClient.post(`${API_BASE}/config-alertas/alertas-generadas/${id}/escalar/`, {
      escalado_a: escaladoA,
      motivo_escalamiento: motivo,
    }),

  pendientes: () =>
    apiClient.get<AlertaGenerada[]>(`${API_BASE}/config-alertas/alertas-generadas/pendientes/`),

  porSeveridad: (severidad: string) =>
    apiClient.get<AlertaGenerada[]>(`${API_BASE}/config-alertas/alertas-generadas/por-severidad/`, {
      params: { severidad },
    }),

  resumen: () =>
    apiClient.get<ResumenAlertas>(`${API_BASE}/config-alertas/alertas-generadas/resumen/`),
};

export const escalamientosAlertaApi = {
  getAll: (alertaId?: number) =>
    apiClient.get<EscalamientoAlerta[]>(`${API_BASE}/config-alertas/escalamientos/`, {
      params: alertaId ? { alerta: alertaId } : {},
    }),

  getById: (id: number) =>
    apiClient.get<EscalamientoAlerta>(`${API_BASE}/config-alertas/escalamientos/${id}/`),

  create: (data: Partial<EscalamientoAlerta>) =>
    apiClient.post<EscalamientoAlerta>(`${API_BASE}/config-alertas/escalamientos/`, data),

  resolver: (id: number, observaciones?: string) =>
    apiClient.post(`${API_BASE}/config-alertas/escalamientos/${id}/resolver/`, { observaciones }),
};

// ==================== TAREAS RECORDATORIOS ====================

export const tareasApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<Tarea[]>(`${API_BASE}/tareas-recordatorios/tareas/`, { params }),

  getById: (id: number) => apiClient.get<Tarea>(`${API_BASE}/tareas-recordatorios/tareas/${id}/`),

  create: (data: Partial<Tarea>) =>
    apiClient.post<Tarea>(`${API_BASE}/tareas-recordatorios/tareas/`, data),

  update: (id: number, data: Partial<Tarea>) =>
    apiClient.patch<Tarea>(`${API_BASE}/tareas-recordatorios/tareas/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/tareas-recordatorios/tareas/${id}/`),

  completar: (id: number, observaciones?: string) =>
    apiClient.post(`${API_BASE}/tareas-recordatorios/tareas/${id}/completar/`, { observaciones }),

  cancelar: (id: number, motivo?: string) =>
    apiClient.post(`${API_BASE}/tareas-recordatorios/tareas/${id}/cancelar/`, { motivo }),

  reasignar: (id: number, asignadoA: number, observaciones?: string) =>
    apiClient.post(`${API_BASE}/tareas-recordatorios/tareas/${id}/reasignar/`, {
      asignado_a: asignadoA,
      observaciones,
    }),

  misTareas: () => apiClient.get<Tarea[]>(`${API_BASE}/tareas-recordatorios/tareas/mis-tareas/`),

  vencidas: () => apiClient.get<Tarea[]>(`${API_BASE}/tareas-recordatorios/tareas/vencidas/`),

  resumen: () => apiClient.get<ResumenTareas>(`${API_BASE}/tareas-recordatorios/tareas/resumen/`),
};

export const recordatoriosApi = {
  getAll: () => apiClient.get<Recordatorio[]>(`${API_BASE}/tareas-recordatorios/recordatorios/`),

  getById: (id: number) =>
    apiClient.get<Recordatorio>(`${API_BASE}/tareas-recordatorios/recordatorios/${id}/`),

  create: (data: Partial<Recordatorio>) =>
    apiClient.post<Recordatorio>(`${API_BASE}/tareas-recordatorios/recordatorios/`, data),

  update: (id: number, data: Partial<Recordatorio>) =>
    apiClient.patch<Recordatorio>(`${API_BASE}/tareas-recordatorios/recordatorios/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/tareas-recordatorios/recordatorios/${id}/`),

  activar: (id: number) =>
    apiClient.post(`${API_BASE}/tareas-recordatorios/recordatorios/${id}/activar/`),

  desactivar: (id: number) =>
    apiClient.post(`${API_BASE}/tareas-recordatorios/recordatorios/${id}/desactivar/`),
};

export const eventosCalendarioApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<EventoCalendario[]>(`${API_BASE}/tareas-recordatorios/eventos/`, { params }),

  getById: (id: number) =>
    apiClient.get<EventoCalendario>(`${API_BASE}/tareas-recordatorios/eventos/${id}/`),

  create: (data: Partial<EventoCalendario>) =>
    apiClient.post<EventoCalendario>(`${API_BASE}/tareas-recordatorios/eventos/`, data),

  update: (id: number, data: Partial<EventoCalendario>) =>
    apiClient.patch<EventoCalendario>(`${API_BASE}/tareas-recordatorios/eventos/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/tareas-recordatorios/eventos/${id}/`),

  porMes: (anio: number, mes: number) =>
    apiClient.get<EventoCalendario[]>(`${API_BASE}/tareas-recordatorios/eventos/por-mes/`, {
      params: { anio, mes },
    }),

  porSemana: (anio: number, semana: number) =>
    apiClient.get<EventoCalendario[]>(`${API_BASE}/tareas-recordatorios/eventos/por-semana/`, {
      params: { anio, semana },
    }),

  misEventos: () =>
    apiClient.get<EventoCalendario[]>(`${API_BASE}/tareas-recordatorios/eventos/mis-eventos/`),
};

export const comentariosTareaApi = {
  getAll: (tareaId: number) =>
    apiClient.get<ComentarioTarea[]>(`${API_BASE}/tareas-recordatorios/comentarios/`, {
      params: { tarea: tareaId },
    }),

  create: (data: Partial<ComentarioTarea>) =>
    apiClient.post<ComentarioTarea>(`${API_BASE}/tareas-recordatorios/comentarios/`, data),

  delete: (id: number) => apiClient.delete(`${API_BASE}/tareas-recordatorios/comentarios/${id}/`),
};

// ==================== DASHBOARD & STATS ====================

export const auditSystemApi = {
  getStats: () => apiClient.get<AuditSystemStats>(`${API_BASE}/stats/`),

  getActividadReciente: (limit = 10) =>
    apiClient.get<ActividadReciente[]>(`${API_BASE}/actividad-reciente/`, {
      params: { limit },
    }),
};
