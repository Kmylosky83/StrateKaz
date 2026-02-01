/**
 * MS-002-A: Hooks para gestión de sesiones de usuario
 *
 * Proporciona:
 * - useSessions: Lista de sesiones activas
 * - useCurrentSession: Sesión actual del usuario
 * - useCloseSession: Cerrar sesión específica
 * - useCloseOtherSessions: Cerrar todas excepto actual
 * - useRenameSession: Renombrar dispositivo
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as sessionsApi from '../api/sessions.api';
import type { UpdateDeviceNameDTO } from '../types/sessions.types';

// Query keys
export const SESSION_QUERY_KEYS = {
  all: ['sessions'] as const,
  list: () => [...SESSION_QUERY_KEYS.all, 'list'] as const,
  current: () => [...SESSION_QUERY_KEYS.all, 'current'] as const,
  detail: (id: number) => [...SESSION_QUERY_KEYS.all, 'detail', id] as const,
};

/**
 * Hook para obtener lista de sesiones activas
 */
export const useSessions = () => {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.list(),
    queryFn: sessionsApi.getSessions,
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook para obtener la sesión actual
 */
export const useCurrentSession = () => {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.current(),
    queryFn: sessionsApi.getCurrentSession,
    staleTime: 60 * 1000, // 1 minuto
  });
};

/**
 * Hook para cerrar una sesión específica
 */
export const useCloseSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => sessionsApi.closeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.list() });
      toast.success('Sesión cerrada correctamente');
    },
    onError: () => {
      toast.error('Error al cerrar la sesión');
    },
  });
};

/**
 * Hook para cerrar todas las sesiones excepto la actual
 */
export const useCloseOtherSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionsApi.closeOtherSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.list() });
      toast.success(data.detail || 'Otras sesiones cerradas correctamente');
    },
    onError: () => {
      toast.error('Error al cerrar las otras sesiones');
    },
  });
};

/**
 * Hook para renombrar el dispositivo de una sesión
 */
export const useRenameSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeviceNameDTO }) =>
      sessionsApi.renameSessionDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.list() });
      toast.success('Dispositivo renombrado correctamente');
    },
    onError: () => {
      toast.error('Error al renombrar el dispositivo');
    },
  });
};
