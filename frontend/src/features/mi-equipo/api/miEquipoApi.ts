/**
 * React Query Hooks para Mi Equipo (MSS)
 * Sistema de Gestion StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  ColaboradorEquipo,
  AprobacionPendiente,
  AprobarRechazarData,
  AsistenciaEquipo,
  EvaluacionEquipo,
  TipoSolicitud,
} from '../types';

const BASE_URL = '/mi-equipo';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const miEquipoKeys = {
  all: ['mi-equipo'] as const,
  equipo: () => [...miEquipoKeys.all, 'equipo'] as const,
  aprobaciones: () => [...miEquipoKeys.all, 'aprobaciones'] as const,
  asistencia: () => [...miEquipoKeys.all, 'asistencia'] as const,
  evaluaciones: () => [...miEquipoKeys.all, 'evaluaciones'] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useMiEquipo() {
  return useQuery({
    queryKey: miEquipoKeys.equipo(),
    queryFn: async () => {
      const response = await api.get<ColaboradorEquipo[]>(`${BASE_URL}/`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAprobacionesPendientes() {
  return useQuery({
    queryKey: miEquipoKeys.aprobaciones(),
    queryFn: async () => {
      const response = await api.get<AprobacionPendiente[]>(`${BASE_URL}/aprobaciones/`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 min - mas frecuente por urgencia
  });
}

export function useAprobarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tipo,
      solicitudId,
      data,
    }: {
      tipo: TipoSolicitud;
      solicitudId: number;
      data: AprobarRechazarData;
    }) => {
      const response = await api.post(`${BASE_URL}/aprobar/${tipo}/${solicitudId}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: miEquipoKeys.aprobaciones() });
      queryClient.invalidateQueries({ queryKey: miEquipoKeys.equipo() });
      const accionLabel = variables.data.accion === 'aprobar' ? 'aprobada' : 'rechazada';
      toast.success(`Solicitud ${accionLabel} exitosamente`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al procesar solicitud');
    },
  });
}

export function useAsistenciaEquipo() {
  return useQuery({
    queryKey: miEquipoKeys.asistencia(),
    queryFn: async () => {
      const response = await api.get<AsistenciaEquipo[]>(`${BASE_URL}/asistencia/`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvaluacionesEquipo() {
  return useQuery({
    queryKey: miEquipoKeys.evaluaciones(),
    queryFn: async () => {
      const response = await api.get<EvaluacionEquipo[]>(`${BASE_URL}/evaluaciones/`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
