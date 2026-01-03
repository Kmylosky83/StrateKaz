/**
 * React Query Hooks para Formacion y Reinduccion - Talent Hub
 * Sistema de Gestion StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  PlanFormacion,
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

// ============================================================================
// QUERY KEYS
// ============================================================================

export const formacionKeys = {
  all: ['formacion'] as const,

  // Planes de Formacion
  planes: {
    all: ['formacion', 'planes'] as const,
    list: () => [...formacionKeys.planes.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.planes.all, 'detail', id] as const,
    vigente: () => [...formacionKeys.planes.all, 'vigente'] as const,
  },

  // Capacitaciones
  capacitaciones: {
    all: ['formacion', 'capacitaciones'] as const,
    list: () => [...formacionKeys.capacitaciones.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.capacitaciones.all, 'detail', id] as const,
    porTipo: () => [...formacionKeys.capacitaciones.all, 'por-tipo'] as const,
    porPlan: (planId: string) => [...formacionKeys.capacitaciones.all, 'plan', planId] as const,
  },

  // Programaciones
  programaciones: {
    all: ['formacion', 'programaciones'] as const,
    list: () => [...formacionKeys.programaciones.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.programaciones.all, 'detail', id] as const,
    calendario: (fechaInicio?: string, fechaFin?: string) =>
      [...formacionKeys.programaciones.all, 'calendario', fechaInicio, fechaFin] as const,
    proximas: (dias?: number) => [...formacionKeys.programaciones.all, 'proximas', dias] as const,
  },

  // Ejecuciones
  ejecuciones: {
    all: ['formacion', 'ejecuciones'] as const,
    list: () => [...formacionKeys.ejecuciones.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.ejecuciones.all, 'detail', id] as const,
    porColaborador: (id: string) => [...formacionKeys.ejecuciones.all, 'colaborador', id] as const,
  },

  // Gamificacion
  gamificacion: {
    all: ['formacion', 'gamificacion'] as const,
    leaderboard: (limite?: number) => [...formacionKeys.gamificacion.all, 'leaderboard', limite] as const,
    miPerfil: (colaboradorId: string) => [...formacionKeys.gamificacion.all, 'perfil', colaboradorId] as const,
    misBadges: (colaboradorId: string) => [...formacionKeys.gamificacion.all, 'badges', colaboradorId] as const,
  },

  // Badges
  badges: {
    all: ['formacion', 'badges'] as const,
    list: () => [...formacionKeys.badges.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.badges.all, 'detail', id] as const,
  },

  // Evaluaciones de Eficacia
  evaluacionesEficacia: {
    all: ['formacion', 'evaluaciones-eficacia'] as const,
    list: () => [...formacionKeys.evaluacionesEficacia.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.evaluacionesEficacia.all, 'detail', id] as const,
  },

  // Certificados
  certificados: {
    all: ['formacion', 'certificados'] as const,
    list: () => [...formacionKeys.certificados.all, 'list'] as const,
    detail: (id: string) => [...formacionKeys.certificados.all, 'detail', id] as const,
    porColaborador: (id: string) => [...formacionKeys.certificados.all, 'colaborador', id] as const,
  },

  // Estadisticas
  estadisticas: () => [...formacionKeys.all, 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - PLANES DE FORMACION
// ============================================================================

export function usePlanesFormacion() {
  return useQuery({
    queryKey: formacionKeys.planes.list(),
    queryFn: async () => {
      const { data } = await api.get<PlanFormacion[]>('/talent-hub/formacion/planes-formacion/');
      return data;
    },
  });
}

export function usePlanFormacion(id: string) {
  return useQuery({
    queryKey: formacionKeys.planes.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PlanFormacion>(`/talent-hub/formacion/planes-formacion/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAprobarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/formacion/planes-formacion/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.planes.all });
      toast.success('Plan aprobado');
    },
    onError: () => toast.error('Error al aprobar plan'),
  });
}

// ============================================================================
// HOOKS - CAPACITACIONES
// ============================================================================

export function useCapacitaciones() {
  return useQuery({
    queryKey: formacionKeys.capacitaciones.list(),
    queryFn: async () => {
      const { data } = await api.get<Capacitacion[]>('/talent-hub/formacion/capacitaciones/');
      return data;
    },
  });
}

export function useCapacitacion(id: string) {
  return useQuery({
    queryKey: formacionKeys.capacitaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Capacitacion>(`/talent-hub/formacion/capacitaciones/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCapacitacionesPorTipo() {
  return useQuery({
    queryKey: formacionKeys.capacitaciones.porTipo(),
    queryFn: async () => {
      const { data } = await api.get<Record<string, Capacitacion[]>>('/talent-hub/formacion/capacitaciones/por_tipo/');
      return data;
    },
  });
}

export function useCreateCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CapacitacionFormData) => {
      const { data } = await api.post<Capacitacion>('/talent-hub/formacion/capacitaciones/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.capacitaciones.all });
      toast.success('Capacitacion creada');
    },
    onError: () => toast.error('Error al crear capacitacion'),
  });
}

export function usePublicarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/formacion/capacitaciones/${id}/publicar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.capacitaciones.all });
      toast.success('Capacitacion publicada');
    },
    onError: () => toast.error('Error al publicar'),
  });
}

// ============================================================================
// HOOKS - PROGRAMACIONES
// ============================================================================

export function useProgramaciones() {
  return useQuery({
    queryKey: formacionKeys.programaciones.list(),
    queryFn: async () => {
      const { data } = await api.get<ProgramacionCapacitacion[]>('/talent-hub/formacion/programaciones/');
      return data;
    },
  });
}

export function useCalendarioCapacitaciones(fechaInicio?: string, fechaFin?: string) {
  return useQuery({
    queryKey: formacionKeys.programaciones.calendario(fechaInicio, fechaFin),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);
      const { data } = await api.get<ProgramacionCapacitacion[]>(
        `/talent-hub/formacion/programaciones/calendario/?${params}`
      );
      return data;
    },
  });
}

export function useProximasSesiones(dias = 7) {
  return useQuery({
    queryKey: formacionKeys.programaciones.proximas(dias),
    queryFn: async () => {
      const { data } = await api.get<ProgramacionCapacitacion[]>(
        `/talent-hub/formacion/programaciones/proximas/?dias=${dias}`
      );
      return data;
    },
  });
}

export function useCreateProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ProgramacionFormData) => {
      const { data } = await api.post<ProgramacionCapacitacion>('/talent-hub/formacion/programaciones/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.programaciones.all });
      toast.success('Sesion programada');
    },
    onError: () => toast.error('Error al programar sesion'),
  });
}

// ============================================================================
// HOOKS - EJECUCIONES
// ============================================================================

export function useEjecucionesPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: formacionKeys.ejecuciones.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<EjecucionCapacitacion[]>(
        `/talent-hub/formacion/ejecuciones/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useRegistrarAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      asistio,
      horaEntrada,
      horaSalida,
    }: {
      id: string;
      asistio: boolean;
      horaEntrada?: string;
      horaSalida?: string;
    }) => {
      const { data } = await api.post(`/talent-hub/formacion/ejecuciones/${id}/registrar_asistencia/`, {
        asistio,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.ejecuciones.all });
      toast.success('Asistencia registrada');
    },
    onError: () => toast.error('Error al registrar asistencia'),
  });
}

export function useRegistrarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: string; nota: number }) => {
      const { data } = await api.post(`/talent-hub/formacion/ejecuciones/${id}/registrar_evaluacion/`, { nota });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.ejecuciones.all });
      toast.success('Evaluacion registrada');
    },
    onError: () => toast.error('Error al registrar evaluacion'),
  });
}

// ============================================================================
// HOOKS - GAMIFICACION
// ============================================================================

export function useLeaderboard(limite = 10) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.leaderboard(limite),
    queryFn: async () => {
      const { data } = await api.get<LeaderboardEntry[]>(
        `/talent-hub/formacion/gamificacion/leaderboard/?limite=${limite}`
      );
      return data;
    },
  });
}

export function useMiPerfilGamificacion(colaboradorId: string) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.miPerfil(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<GamificacionColaborador>(
        `/talent-hub/formacion/gamificacion/mi_perfil/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useMisBadges(colaboradorId: string) {
  return useQuery({
    queryKey: formacionKeys.gamificacion.misBadges(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<BadgeColaborador[]>(
        `/talent-hub/formacion/gamificacion/mis_badges/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

// ============================================================================
// HOOKS - BADGES
// ============================================================================

export function useBadges() {
  return useQuery({
    queryKey: formacionKeys.badges.list(),
    queryFn: async () => {
      const { data } = await api.get<Badge[]>('/talent-hub/formacion/badges/');
      return data;
    },
  });
}

// ============================================================================
// HOOKS - CERTIFICADOS
// ============================================================================

export function useCertificadosPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: formacionKeys.certificados.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<Certificado[]>(
        `/talent-hub/formacion/certificados/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useVerificarCertificado(codigo: string) {
  return useQuery({
    queryKey: [...formacionKeys.certificados.all, 'verificar', codigo],
    queryFn: async () => {
      const { data } = await api.get(`/talent-hub/formacion/certificados/verificar/?codigo=${codigo}`);
      return data;
    },
    enabled: !!codigo,
  });
}

export function useAnularCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data } = await api.post(`/talent-hub/formacion/certificados/${id}/anular/`, { motivo });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.certificados.all });
      toast.success('Certificado anulado');
    },
    onError: () => toast.error('Error al anular certificado'),
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useFormacionEstadisticas() {
  return useQuery({
    queryKey: formacionKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await api.get<FormacionEstadisticas>('/talent-hub/formacion/estadisticas/resumen/');
      return data;
    },
  });
}
