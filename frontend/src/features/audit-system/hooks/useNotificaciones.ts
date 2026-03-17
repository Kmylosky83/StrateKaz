/**
 * Hooks para Centro de Notificaciones
 *
 * MN-001: React Query hooks para notificaciones
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificacionesAPI } from '../api/notificaciones.api';
import type {
  NotificacionFilters,
  TipoNotificacion,
  PreferenciaNotificacion,
  NotificacionMasiva,
} from '../types/notificaciones.types';
import { useAuthStore } from '@/store/authStore';

// ==================== QUERY KEYS ====================

export const notificacionesKeys = {
  all: ['notificaciones'] as const,
  lists: () => [...notificacionesKeys.all, 'list'] as const,
  list: (filters?: NotificacionFilters) => [...notificacionesKeys.lists(), filters] as const,
  noLeidas: (userId?: number) => [...notificacionesKeys.all, 'no-leidas', userId] as const,
  detail: (id: number) => [...notificacionesKeys.all, 'detail', id] as const,
  tipos: () => [...notificacionesKeys.all, 'tipos'] as const,
  preferencias: (userId?: number) => [...notificacionesKeys.all, 'preferencias', userId] as const,
  masivas: () => [...notificacionesKeys.all, 'masivas'] as const,
};

// ==================== NOTIFICACIONES ====================

/**
 * Hook para obtener lista de notificaciones
 */
export const useNotificaciones = (filters?: NotificacionFilters) => {
  return useQuery({
    queryKey: notificacionesKeys.list(filters),
    queryFn: () => notificacionesAPI.getNotificaciones(filters),
  });
};

/**
 * Hook para obtener notificaciones no leídas del usuario actual
 */
export const useNotificacionesNoLeidas = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificacionesKeys.noLeidas(user?.id),
    queryFn: async () => {
      try {
        return await notificacionesAPI.getNoLeidas(user?.id);
      } catch (err: unknown) {
        // 404 = app no habilitada en este nivel de despliegue → silenciar
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 0,
  });
};

/**
 * Hook para marcar notificación como leída
 */
export const useMarcarLeida = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificacionesAPI.marcarLeida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
    },
    onError: () => {
      toast.error('Error al marcar la notificación como leída');
    },
  });
};

/**
 * Hook para marcar todas las notificaciones como leídas
 */
export const useMarcarTodasLeidas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Usuario no autenticado');
      return notificacionesAPI.marcarTodasLeidas(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: () => {
      toast.error('Error al marcar las notificaciones');
    },
  });
};

/**
 * Hook para archivar notificación
 */
export const useArchivarNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificacionesAPI.archivarNotificacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.all });
      toast.success('Notificación archivada');
    },
    onError: () => {
      toast.error('Error al archivar la notificación');
    },
  });
};

// ==================== TIPOS DE NOTIFICACIÓN ====================

/**
 * Hook para obtener tipos de notificación
 */
export const useTiposNotificacion = (filters?: { categoria?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: [...notificacionesKeys.tipos(), filters],
    queryFn: () => notificacionesAPI.getTipos(filters),
  });
};

/**
 * Hook para crear tipo de notificación
 */
export const useCreateTipoNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TipoNotificacion>) => notificacionesAPI.createTipo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.tipos() });
      toast.success('Tipo de notificación creado');
    },
    onError: () => {
      toast.error('Error al crear el tipo de notificación');
    },
  });
};

/**
 * Hook para actualizar tipo de notificación
 */
export const useUpdateTipoNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TipoNotificacion> }) =>
      notificacionesAPI.updateTipo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.tipos() });
      toast.success('Tipo de notificación actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el tipo de notificación');
    },
  });
};

/**
 * Hook para eliminar tipo de notificación
 */
export const useDeleteTipoNotificacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificacionesAPI.deleteTipo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.tipos() });
      toast.success('Tipo de notificación eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el tipo de notificación');
    },
  });
};

// ==================== PREFERENCIAS ====================

/**
 * Hook para obtener preferencias del usuario
 */
export const usePreferenciasNotificacion = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificacionesKeys.preferencias(user?.id),
    queryFn: () => notificacionesAPI.getPreferencias(user?.id),
    enabled: !!user?.id,
  });
};

/**
 * Hook para actualizar preferencia
 */
export const useUpdatePreferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PreferenciaNotificacion> }) =>
      notificacionesAPI.updatePreferencia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.preferencias() });
      toast.success('Preferencias actualizadas');
    },
    onError: () => {
      toast.error('Error al actualizar las preferencias');
    },
  });
};

// ==================== NOTIFICACIONES MASIVAS ====================

/**
 * Hook para obtener envíos masivos
 */
export const useNotificacionesMasivas = () => {
  return useQuery({
    queryKey: notificacionesKeys.masivas(),
    queryFn: () => notificacionesAPI.getMasivas(),
  });
};

/**
 * Hook para crear envío masivo
 */
export const useCreateNotificacionMasiva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<NotificacionMasiva>) => notificacionesAPI.createMasiva(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.masivas() });
      toast.success('Notificación masiva enviada');
    },
    onError: () => {
      toast.error('Error al enviar la notificación masiva');
    },
  });
};
