/**
 * React Query Hooks para Formacion y Reinduccion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks + createApiClient factories.
 * Custom endpoints (calendario, gamificacion, badges, estadisticas) remain manual.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  planFormacionApi,
  capacitacionApi,
  programacionApi,
  ejecucionFormacionApi,
  evaluacionEficaciaApi,
  certificadoApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  PlanFormacion,
  PlanFormacionFormData,
  Capacitacion,
  CapacitacionFormData,
  ProgramacionCapacitacion,
  ProgramacionFormData,
  EjecucionCapacitacion,
  Badge,
  GamificacionColaborador,
  BadgeColaborador,
  LeaderboardEntry,
  EvaluacionEficacia,
  Certificado,
  FormacionEstadisticas,
} from '../types';

const FORMACION_URL = '/talent-hub/formacion';

// ============================================================================
// QUERY KEYS (backward compat re-exports)
// ============================================================================

export const formacionKeys = {
  all: ['formacion'] as const,

  planes: {
    all: thKeys.planesFormacion.all,
    list: () => thKeys.planesFormacion.lists(),
    detail: (id: number) => thKeys.planesFormacion.detail(id),
  },

  capacitaciones: {
    all: thKeys.capacitaciones.all,
    list: () => thKeys.capacitaciones.lists(),
    detail: (id: number) => thKeys.capacitaciones.detail(id),
    porTipo: () => thKeys.capacitaciones.custom('por-tipo'),
  },

  programaciones: {
    all: thKeys.programaciones.all,
    list: () => thKeys.programaciones.lists(),
    detail: (id: number) => thKeys.programaciones.detail(id),
    calendario: (fechaInicio?: string, fechaFin?: string) =>
      thKeys.programaciones.custom('calendario', fechaInicio, fechaFin),
    proximas: (dias?: number) => thKeys.programaciones.custom('proximas', dias),
  },

  ejecuciones: {
    all: thKeys.ejecucionesFormacion.all,
    list: () => thKeys.ejecucionesFormacion.lists(),
    detail: (id: number) => thKeys.ejecucionesFormacion.detail(id),
    porColaborador: (id: number) => thKeys.ejecucionesFormacion.custom('colaborador', id),
  },

  gamificacion: {
    all: thKeys.gamificacion.all,
    leaderboard: (limite?: number) => thKeys.gamificacion.custom('leaderboard', limite),
    miPerfil: (colaboradorId: number) => thKeys.gamificacion.custom('perfil', colaboradorId),
    misBadges: (colaboradorId: number) => thKeys.gamificacion.custom('badges', colaboradorId),
  },

  badges: {
    all: thKeys.badges.all,
    list: () => thKeys.badges.lists(),
  },

  evaluacionesEficacia: {
    all: thKeys.evaluacionesEficacia.all,
    list: () => thKeys.evaluacionesEficacia.lists(),
  },

  certificados: {
    all: thKeys.certificados.all,
    list: () => thKeys.certificados.lists(),
    porColaborador: (id: number) => thKeys.certificados.custom('colaborador', id),
  },

  estadisticas: () => thKeys.estadisticasFormacion.custom('estadisticas'),
};

// ============================================================================
// HOOKS - PLANES DE FORMACION (via factory)
// ============================================================================

const planHooks = createCrudHooks<
  PlanFormacion,
  PlanFormacionFormData,
  Partial<PlanFormacionFormData>
>(planFormacionApi, thKeys.planesFormacion, 'Plan');

export function usePlanesFormacion() {
  return planHooks.useList();
}

export function usePlanFormacion(id: number) {
  return planHooks.useDetail(id);
}

export const useCreatePlanFormacion = planHooks.useCreate;
export const useUpdatePlanFormacion = planHooks.useUpdate;
export const useDeletePlanFormacion = planHooks.useDelete;

export function useAprobarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${FORMACION_URL}/planes-formacion/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.planesFormacion.all });
      toast.success('Plan aprobado');
    },
    onError: () => toast.error('Error al aprobar plan'),
  });
}

// ============================================================================
// HOOKS - CAPACITACIONES (via factory)
// ============================================================================

const capacitacionHooks = createCrudHooks<
  Capacitacion,
  CapacitacionFormData,
  Partial<CapacitacionFormData>
>(capacitacionApi, thKeys.capacitaciones, 'Capacitacion', { isFeminine: true });

export function useCapacitaciones() {
  return capacitacionHooks.useList();
}

export function useCapacitacion(id: number) {
  return capacitacionHooks.useDetail(id);
}

export function useCapacitacionesPorTipo() {
  return useQuery({
    queryKey: formacionKeys.capacitaciones.porTipo(),
    queryFn: async () => {
      const { data } = await apiClient.get<Record<string, Capacitacion[]>>(
        `${FORMACION_URL}/capacitaciones/por_tipo/`
      );
      return data;
    },
  });
}

export const useCreateCapacitacion = capacitacionHooks.useCreate;
export const useUpdateCapacitacion = capacitacionHooks.useUpdate;
export const useDeleteCapacitacion = capacitacionHooks.useDelete;

export function usePublicarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${FORMACION_URL}/capacitaciones/${id}/publicar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.capacitaciones.all });
      toast.success('Capacitacion publicada');
    },
    onError: () => toast.error('Error al publicar'),
  });
}

// ============================================================================
// HOOKS - PROGRAMACIONES (factory + custom endpoints)
// ============================================================================

const programacionHooks = createCrudHooks<ProgramacionCapacitacion, ProgramacionFormData>(
  programacionApi,
  thKeys.programaciones,
  'Sesion',
  { isFeminine: true }
);

export function useProgramaciones() {
  return programacionHooks.useList();
}

export function useCalendarioCapacitaciones(fechaInicio?: string, fechaFin?: string) {
  return useQuery({
    queryKey: formacionKeys.programaciones.calendario(fechaInicio, fechaFin),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      const response = await apiClient.get(`${FORMACION_URL}/programaciones/calendario/?${params}`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ProgramacionCapacitacion[];
    },
  });
}

export function useProximasSesiones(dias = 7) {
  return useQuery({
    queryKey: formacionKeys.programaciones.proximas(dias),
    queryFn: async () => {
      const response = await apiClient.get(
        `${FORMACION_URL}/programaciones/proximas/?dias=${dias}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ProgramacionCapacitacion[];
    },
  });
}

export const useCreateProgramacion = programacionHooks.useCreate;
export const useDeleteProgramacion = programacionHooks.useDelete;

// ============================================================================
// HOOKS - EJECUCIONES (factory + custom actions)
// ============================================================================

const ejecucionHooks = createCrudHooks<
  EjecucionCapacitacion,
  { programacion: number; colaborador: number }
>(ejecucionFormacionApi, thKeys.ejecucionesFormacion, 'Inscripcion', { isFeminine: true });

export function useEjecucionesFormacion() {
  return ejecucionHooks.useList();
}

export function useEjecucionesFormacionPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.ejecuciones.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await apiClient.get(
        `${FORMACION_URL}/ejecuciones/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EjecucionCapacitacion[];
    },
    enabled: !!colaboradorId,
  });
}

export const useCreateEjecucionFormacion = ejecucionHooks.useCreate;

export function useRegistrarAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      asistio,
      horaEntrada,
      horaSalida,
    }: {
      id: number;
      asistio: boolean;
      horaEntrada?: string;
      horaSalida?: string;
    }) => {
      const { data } = await apiClient.post(
        `${FORMACION_URL}/ejecuciones/${id}/registrar_asistencia/`,
        {
          asistio,
          hora_entrada: horaEntrada,
          hora_salida: horaSalida,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.ejecucionesFormacion.all });
      toast.success('Asistencia registrada');
    },
    onError: () => toast.error('Error al registrar asistencia'),
  });
}

export function useRegistrarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: number; nota: number }) => {
      const { data } = await apiClient.post(
        `${FORMACION_URL}/ejecuciones/${id}/registrar_evaluacion/`,
        { nota }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.ejecucionesFormacion.all });
      toast.success('Evaluacion registrada');
    },
    onError: () => toast.error('Error al registrar evaluacion'),
  });
}

// ============================================================================
// HOOKS - GAMIFICACION (custom — no standard CRUD)
// ============================================================================

export function useLeaderboard(limite = 10) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.leaderboard(limite),
    queryFn: async () => {
      const response = await apiClient.get(
        `${FORMACION_URL}/gamificacion/leaderboard/?limite=${limite}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as LeaderboardEntry[];
    },
  });
}

export function useMiPerfilGamificacion(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.miPerfil(colaboradorId),
    queryFn: async () => {
      const { data } = await apiClient.get<GamificacionColaborador>(
        `${FORMACION_URL}/gamificacion/mi_perfil/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useMisBadges(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.misBadges(colaboradorId),
    queryFn: async () => {
      const response = await apiClient.get(
        `${FORMACION_URL}/gamificacion/mis_badges/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as BadgeColaborador[];
    },
    enabled: !!colaboradorId,
  });
}

// ============================================================================
// HOOKS - BADGES (read-only list)
// ============================================================================

export function useBadges() {
  return useQuery({
    queryKey: formacionKeys.badges.list(),
    queryFn: async () => {
      const response = await apiClient.get(`${FORMACION_URL}/badges/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Badge[];
    },
  });
}

// ============================================================================
// HOOKS - EVALUACIONES DE EFICACIA (factory)
// ============================================================================

const eficaciaHooks = createCrudHooks<EvaluacionEficacia, Partial<EvaluacionEficacia>>(
  evaluacionEficaciaApi,
  thKeys.evaluacionesEficacia,
  'Evaluacion',
  { isFeminine: true }
);

export function useEvaluacionesEficacia() {
  return eficaciaHooks.useList();
}

export const useCreateEvaluacionEficacia = eficaciaHooks.useCreate;

// ============================================================================
// HOOKS - CERTIFICADOS (factory + custom actions)
// ============================================================================

export function useCertificados() {
  return useQuery({
    queryKey: formacionKeys.certificados.list(),
    queryFn: async () => {
      const response = await certificadoApi.getAll();
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
}

export function useCertificadosPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.certificados.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await apiClient.get(
        `${FORMACION_URL}/certificados/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Certificado[];
    },
    enabled: !!colaboradorId,
  });
}

export function useVerificarCertificado(codigo: string) {
  return useQuery({
    queryKey: [...thKeys.certificados.all, 'verificar', codigo],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `${FORMACION_URL}/certificados/verificar/?codigo=${codigo}`
      );
      return data;
    },
    enabled: !!codigo,
  });
}

export function useAnularCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data } = await apiClient.post(`${FORMACION_URL}/certificados/${id}/anular/`, {
        motivo,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.certificados.all });
      toast.success('Certificado anulado');
    },
    onError: () => toast.error('Error al anular certificado'),
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS (custom — read-only)
// ============================================================================

export function useFormacionEstadisticas() {
  return useQuery({
    queryKey: formacionKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await apiClient.get<FormacionEstadisticas>(`${FORMACION_URL}/estadisticas/`);
      return data;
    },
  });
}
