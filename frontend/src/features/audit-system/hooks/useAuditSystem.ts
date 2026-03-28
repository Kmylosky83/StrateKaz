/**
 * Custom Hooks - Audit System
 * Sistema de Auditoría StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/** Normaliza respuesta paginada: {results:[]} → [] */
const asList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown> | undefined;
  return (obj?.results ?? []) as T[];
};

import {
  configuracionAuditoriaApi,
  logsAccesoApi,
  logsCambioApi,
  logsConsultaApi,
  tiposNotificacionApi,
  notificacionesApi,
  preferenciasNotificacionApi,
  notificacionesMasivasApi,
  tiposAlertaApi,
  configuracionesAlertaApi,
  alertasGeneradasApi,
  escalamientosAlertaApi,
  tareasApi,
  recordatoriosApi,
  eventosCalendarioApi,
  comentariosTareaApi,
  auditSystemApi,
} from '../api';
import type {
  AuditSystemStats,
  ActividadReciente,
  ConfiguracionAuditoria,
  LogAcceso,
  LogCambio,
  LogConsulta,
  TipoAlerta,
  ConfiguracionAlerta,
  AlertaGenerada,
  EscalamientoAlerta,
  Tarea,
  Recordatorio,
  EventoCalendario,
  ComentarioTarea,
  ResumenAlertas,
  ResumenTareas,
  ResumenNotificaciones,
} from '../types';
import type {
  TipoNotificacion,
  Notificacion,
  PreferenciaNotificacion,
  NotificacionMasiva,
} from '../types/notificaciones.types';

// ==================== AUDIT SYSTEM STATS ====================

export const useAuditSystemStats = () => {
  return useQuery({
    queryKey: ['audit-system', 'stats'],
    queryFn: async () => {
      const response = await auditSystemApi.getStats();
      return response.data as AuditSystemStats;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useActividadReciente = (limit = 10) => {
  return useQuery({
    queryKey: ['audit-system', 'actividad-reciente', limit],
    queryFn: async () => {
      const response = await auditSystemApi.getActividadReciente(limit);
      return response.data as ActividadReciente[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// ==================== LOGS SISTEMA ====================

// Configuración Auditoría
export const useConfiguracionesAuditoria = () => {
  return useQuery({
    queryKey: ['configuraciones-auditoria'],
    queryFn: async () => {
      const response = await configuracionAuditoriaApi.getAll();
      return asList<ConfiguracionAuditoria>(response.data);
    },
  });
};

export const useConfiguracionAuditoria = (id: number) => {
  return useQuery({
    queryKey: ['configuracion-auditoria', id],
    queryFn: async () => {
      const response = await configuracionAuditoriaApi.getById(id);
      return response.data as ConfiguracionAuditoria;
    },
    enabled: !!id,
  });
};

export const useCreateConfiguracionAuditoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configuracionAuditoriaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones-auditoria'] });
    },
  });
};

export const useUpdateConfiguracionAuditoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      configuracionAuditoriaApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones-auditoria'] });
      queryClient.invalidateQueries({ queryKey: ['configuracion-auditoria', variables.id] });
    },
  });
};

// Logs Acceso
export const useLogsAcceso = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-acceso', params],
    queryFn: async () => {
      const response = await logsAccesoApi.getAll(params);
      return asList<LogAcceso>(response.data);
    },
  });
};

export const useLogAcceso = (id: number) => {
  return useQuery({
    queryKey: ['log-acceso', id],
    queryFn: async () => {
      const response = await logsAccesoApi.getById(id);
      return response.data as LogAcceso;
    },
    enabled: !!id,
  });
};

export const useLogsAccesoPorUsuario = (usuarioId: number, params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-acceso', 'usuario', usuarioId, params],
    queryFn: async () => {
      const response = await logsAccesoApi.porUsuario(usuarioId, params);
      return asList<LogAcceso>(response.data);
    },
    enabled: !!usuarioId,
  });
};

// Logs Cambio
export const useLogsCambio = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-cambio', params],
    queryFn: async () => {
      const response = await logsCambioApi.getAll(params);
      return asList<LogCambio>(response.data);
    },
  });
};

export const useLogCambio = (id: number) => {
  return useQuery({
    queryKey: ['log-cambio', id],
    queryFn: async () => {
      const response = await logsCambioApi.getById(id);
      return response.data as LogCambio;
    },
    enabled: !!id,
  });
};

export const useLogsCambioPorObjeto = (contentType: number, objectId: string) => {
  return useQuery({
    queryKey: ['logs-cambio', 'objeto', contentType, objectId],
    queryFn: async () => {
      const response = await logsCambioApi.porObjeto(contentType, objectId);
      return asList<LogCambio>(response.data);
    },
    enabled: !!contentType && !!objectId,
  });
};

// Logs Consulta
export const useLogsConsulta = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-consulta', params],
    queryFn: async () => {
      const response = await logsConsultaApi.getAll(params);
      return asList<LogConsulta>(response.data);
    },
  });
};

// ==================== CENTRO NOTIFICACIONES ====================

// Tipos Notificación
export const useTiposNotificacion = () => {
  return useQuery({
    queryKey: ['tipos-notificacion'],
    queryFn: async () => {
      const response = await tiposNotificacionApi.getAll();
      return asList<TipoNotificacion>(response.data);
    },
  });
};

export const useCreateTipoNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tiposNotificacionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-notificacion'] });
    },
  });
};

export const useUpdateTipoNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      tiposNotificacionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-notificacion'] });
    },
  });
};

// Notificaciones
export const useNotificaciones = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['notificaciones', params],
    queryFn: async () => {
      const response = await notificacionesApi.getAll(params);
      return asList<Notificacion>(response.data);
    },
  });
};

export const useNotificacion = (id: number) => {
  return useQuery({
    queryKey: ['notificacion', id],
    queryFn: async () => {
      const response = await notificacionesApi.getById(id);
      return response.data as Notificacion;
    },
    enabled: !!id,
  });
};

export const useNotificacionesNoLeidas = () => {
  return useQuery({
    queryKey: ['notificaciones', 'no-leidas'],
    queryFn: async () => {
      try {
        const response = await notificacionesApi.noLeidas();
        return asList<Notificacion>(response.data);
      } catch (err: unknown) {
        // 404 = app no habilitada en este nivel de despliegue → silenciar
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    refetchInterval: 30000,
    retry: 0,
  });
};

export const useResumenNotificaciones = () => {
  return useQuery({
    queryKey: ['notificaciones', 'resumen'],
    queryFn: async () => {
      const response = await notificacionesApi.resumen();
      return response.data as ResumenNotificaciones;
    },
    refetchInterval: 60000,
  });
};

export const useMarcarNotificacionLeida = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificacionesApi.marcarLeida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['audit-system', 'stats'] });
    },
  });
};

export const useMarcarTodasNotificacionesLeidas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificacionesApi.marcarTodasLeidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['audit-system', 'stats'] });
    },
  });
};

export const useArchivarNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificacionesApi.archivar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
};

// Preferencias Notificación
export const usePreferenciasNotificacion = () => {
  return useQuery({
    queryKey: ['preferencias-notificacion'],
    queryFn: async () => {
      const response = await preferenciasNotificacionApi.getAll();
      return asList<PreferenciaNotificacion>(response.data);
    },
  });
};

export const useUpdatePreferenciaNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      preferenciasNotificacionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias-notificacion'] });
    },
  });
};

// Notificaciones Masivas
export const useNotificacionesMasivas = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['notificaciones-masivas', params],
    queryFn: async () => {
      const response = await notificacionesMasivasApi.getAll(params);
      return asList<NotificacionMasiva>(response.data);
    },
  });
};

export const useCreateNotificacionMasiva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificacionesMasivasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones-masivas'] });
    },
  });
};

export const useEnviarNotificacionMasiva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificacionesMasivasApi.enviar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones-masivas'] });
    },
  });
};

// ==================== CONFIG ALERTAS ====================

// Tipos Alerta
export const useTiposAlerta = () => {
  return useQuery({
    queryKey: ['tipos-alerta'],
    queryFn: async () => {
      const response = await tiposAlertaApi.getAll();
      return asList<TipoAlerta>(response.data);
    },
  });
};

export const useCreateTipoAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tiposAlertaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-alerta'] });
    },
  });
};

export const useUpdateTipoAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      tiposAlertaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-alerta'] });
    },
  });
};

// Configuraciones Alerta
export const useConfiguracionesAlerta = () => {
  return useQuery({
    queryKey: ['configuraciones-alerta'],
    queryFn: async () => {
      const response = await configuracionesAlertaApi.getAll();
      return asList<ConfiguracionAlerta>(response.data);
    },
  });
};

export const useCreateConfiguracionAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configuracionesAlertaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones-alerta'] });
    },
  });
};

export const useUpdateConfiguracionAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      configuracionesAlertaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones-alerta'] });
    },
  });
};

// Alertas Generadas
export const useAlertasGeneradas = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['alertas-generadas', params],
    queryFn: async () => {
      const response = await alertasGeneradasApi.getAll(params);
      return asList<AlertaGenerada>(response.data);
    },
  });
};

export const useAlertaGenerada = (id: number) => {
  return useQuery({
    queryKey: ['alerta-generada', id],
    queryFn: async () => {
      const response = await alertasGeneradasApi.getById(id);
      return response.data as AlertaGenerada;
    },
    enabled: !!id,
  });
};

export const useAlertasPendientes = () => {
  return useQuery({
    queryKey: ['alertas-generadas', 'pendientes'],
    queryFn: async () => {
      const response = await alertasGeneradasApi.pendientes();
      return asList<AlertaGenerada>(response.data);
    },
    refetchInterval: 60000,
  });
};

export const useResumenAlertas = () => {
  return useQuery({
    queryKey: ['alertas-generadas', 'resumen'],
    queryFn: async () => {
      const response = await alertasGeneradasApi.resumen();
      return response.data as ResumenAlertas;
    },
    refetchInterval: 60000,
  });
};

export const useAtenderAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      alertasGeneradasApi.atender(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-generadas'] });
      queryClient.invalidateQueries({ queryKey: ['audit-system', 'stats'] });
    },
  });
};

export const useEscalarAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, escaladoA, motivo }: { id: number; escaladoA: number; motivo: string }) =>
      alertasGeneradasApi.escalar(id, escaladoA, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-generadas'] });
      queryClient.invalidateQueries({ queryKey: ['escalamientos-alerta'] });
    },
  });
};

// Escalamientos
export const useEscalamientosAlerta = (alertaId?: number) => {
  return useQuery({
    queryKey: ['escalamientos-alerta', alertaId],
    queryFn: async () => {
      const response = await escalamientosAlertaApi.getAll(alertaId);
      return asList<EscalamientoAlerta>(response.data);
    },
  });
};

// ==================== TAREAS RECORDATORIOS ====================

// Tareas
export const useTareas = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['tareas', params],
    queryFn: async () => {
      const response = await tareasApi.getAll(params);
      return asList<Tarea>(response.data);
    },
  });
};

export const useTarea = (id: number) => {
  return useQuery({
    queryKey: ['tarea', id],
    queryFn: async () => {
      const response = await tareasApi.getById(id);
      return response.data as Tarea;
    },
    enabled: !!id,
  });
};

export const useMisTareas = () => {
  return useQuery({
    queryKey: ['tareas', 'mis-tareas'],
    queryFn: async () => {
      const response = await tareasApi.misTareas();
      return asList<Tarea>(response.data);
    },
  });
};

export const useTareasVencidas = () => {
  return useQuery({
    queryKey: ['tareas', 'vencidas'],
    queryFn: async () => {
      const response = await tareasApi.vencidas();
      return asList<Tarea>(response.data);
    },
    refetchInterval: 300000, // Every 5 minutes
  });
};

export const useResumenTareas = () => {
  return useQuery({
    queryKey: ['tareas', 'resumen'],
    queryFn: async () => {
      const response = await tareasApi.resumen();
      return response.data as ResumenTareas;
    },
    refetchInterval: 60000,
  });
};

export const useCreateTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tareasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      queryClient.invalidateQueries({ queryKey: ['audit-system', 'stats'] });
    },
  });
};

export const useUpdateTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      tareasApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      queryClient.invalidateQueries({ queryKey: ['tarea', variables.id] });
    },
  });
};

export const useCompletarTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, observaciones }: { id: number; observaciones?: string }) =>
      tareasApi.completar(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      queryClient.invalidateQueries({ queryKey: ['audit-system', 'stats'] });
    },
  });
};

export const useCancelarTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) => tareasApi.cancelar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
    },
  });
};

export const useReasignarTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      asignadoA,
      observaciones,
    }: {
      id: number;
      asignadoA: number;
      observaciones?: string;
    }) => tareasApi.reasignar(id, asignadoA, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
    },
  });
};

// Recordatorios
export const useRecordatorios = () => {
  return useQuery({
    queryKey: ['recordatorios'],
    queryFn: async () => {
      const response = await recordatoriosApi.getAll();
      return asList<Recordatorio>(response.data);
    },
  });
};

export const useCreateRecordatorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordatoriosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] });
    },
  });
};

export const useUpdateRecordatorio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      recordatoriosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] });
    },
  });
};

// Eventos Calendario
export const useEventosCalendario = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['eventos-calendario', params],
    queryFn: async () => {
      const response = await eventosCalendarioApi.getAll(params);
      return asList<EventoCalendario>(response.data);
    },
  });
};

export const useEventosPorMes = (anio: number, mes: number) => {
  return useQuery({
    queryKey: ['eventos-calendario', 'mes', anio, mes],
    queryFn: async () => {
      const response = await eventosCalendarioApi.porMes(anio, mes);
      return asList<EventoCalendario>(response.data);
    },
    enabled: !!anio && !!mes,
  });
};

export const useMisEventos = () => {
  return useQuery({
    queryKey: ['eventos-calendario', 'mis-eventos'],
    queryFn: async () => {
      const response = await eventosCalendarioApi.misEventos();
      return asList<EventoCalendario>(response.data);
    },
  });
};

export const useCreateEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventosCalendarioApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-calendario'] });
    },
  });
};

export const useUpdateEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      eventosCalendarioApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-calendario'] });
    },
  });
};

export const useDeleteEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventosCalendarioApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-calendario'] });
    },
  });
};

// Comentarios Tarea
export const useComentariosTarea = (tareaId: number) => {
  return useQuery({
    queryKey: ['comentarios-tarea', tareaId],
    queryFn: async () => {
      const response = await comentariosTareaApi.getAll(tareaId);
      return asList<ComentarioTarea>(response.data);
    },
    enabled: !!tareaId,
  });
};

export const useCreateComentarioTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: comentariosTareaApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-tarea', variables.tarea] });
    },
  });
};
