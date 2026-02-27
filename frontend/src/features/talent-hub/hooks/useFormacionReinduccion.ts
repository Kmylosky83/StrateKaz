/**
 * React Query Hooks para Formacion y Reinduccion - Talent Hub
 * Sistema de Gestion StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
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

// ============================================================================
// QUERY KEYS
// ============================================================================

export const formacionKeys = {
  all: ['formacion'] as const,

  planes: {
    all: ['formacion', 'planes'] as const,
    list: () => [...formacionKeys.planes.all, 'list'] as const,
    detail: (id: number) => [...formacionKeys.planes.all, 'detail', id] as const,
  },

  capacitaciones: {
    all: ['formacion', 'capacitaciones'] as const,
    list: () => [...formacionKeys.capacitaciones.all, 'list'] as const,
    detail: (id: number) => [...formacionKeys.capacitaciones.all, 'detail', id] as const,
    porTipo: () => [...formacionKeys.capacitaciones.all, 'por-tipo'] as const,
  },

  programaciones: {
    all: ['formacion', 'programaciones'] as const,
    list: () => [...formacionKeys.programaciones.all, 'list'] as const,
    detail: (id: number) => [...formacionKeys.programaciones.all, 'detail', id] as const,
    calendario: (fechaInicio?: string, fechaFin?: string) =>
      [...formacionKeys.programaciones.all, 'calendario', fechaInicio, fechaFin] as const,
    proximas: (dias?: number) => [...formacionKeys.programaciones.all, 'proximas', dias] as const,
  },

  ejecuciones: {
    all: ['formacion', 'ejecuciones'] as const,
    list: () => [...formacionKeys.ejecuciones.all, 'list'] as const,
    detail: (id: number) => [...formacionKeys.ejecuciones.all, 'detail', id] as const,
    porColaborador: (id: number) => [...formacionKeys.ejecuciones.all, 'colaborador', id] as const,
  },

  gamificacion: {
    all: ['formacion', 'gamificacion'] as const,
    leaderboard: (limite?: number) =>
      [...formacionKeys.gamificacion.all, 'leaderboard', limite] as const,
    miPerfil: (colaboradorId: number) =>
      [...formacionKeys.gamificacion.all, 'perfil', colaboradorId] as const,
    misBadges: (colaboradorId: number) =>
      [...formacionKeys.gamificacion.all, 'badges', colaboradorId] as const,
  },

  badges: {
    all: ['formacion', 'badges'] as const,
    list: () => [...formacionKeys.badges.all, 'list'] as const,
  },

  evaluacionesEficacia: {
    all: ['formacion', 'evaluaciones-eficacia'] as const,
    list: () => [...formacionKeys.evaluacionesEficacia.all, 'list'] as const,
  },

  certificados: {
    all: ['formacion', 'certificados'] as const,
    list: () => [...formacionKeys.certificados.all, 'list'] as const,
    porColaborador: (id: number) => [...formacionKeys.certificados.all, 'colaborador', id] as const,
  },

  estadisticas: () => [...formacionKeys.all, 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - PLANES DE FORMACION
// ============================================================================

export function usePlanesFormacion() {
  return useQuery({
    queryKey: formacionKeys.planes.list(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/formacion/planes-formacion/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as PlanFormacion[];
    },
  });
}

export function usePlanFormacion(id: number) {
  return useQuery({
    queryKey: formacionKeys.planes.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PlanFormacion>(
        `/talent-hub/formacion/planes-formacion/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePlanFormacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: PlanFormacionFormData) => {
      const { data } = await api.post<PlanFormacion>(
        '/talent-hub/formacion/planes-formacion/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.planes.all });
      toast.success('Plan creado');
    },
    onError: () => toast.error('Error al crear plan'),
  });
}

export function useUpdatePlanFormacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data: formData,
    }: {
      id: number;
      data: Partial<PlanFormacionFormData>;
    }) => {
      const { data } = await api.patch<PlanFormacion>(
        `/talent-hub/formacion/planes-formacion/${id}/`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.planes.all });
      toast.success('Plan actualizado');
    },
    onError: () => toast.error('Error al actualizar plan'),
  });
}

export function useAprobarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
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

export function useDeletePlanFormacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/talent-hub/formacion/planes-formacion/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.planes.all });
      toast.success('Plan eliminado');
    },
    onError: () => toast.error('Error al eliminar plan'),
  });
}

// ============================================================================
// HOOKS - CAPACITACIONES
// ============================================================================

export function useCapacitaciones() {
  return useQuery({
    queryKey: formacionKeys.capacitaciones.list(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/formacion/capacitaciones/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Capacitacion[];
    },
  });
}

export function useCapacitacion(id: number) {
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
      const { data } = await api.get<Record<string, Capacitacion[]>>(
        '/talent-hub/formacion/capacitaciones/por_tipo/'
      );
      return data;
    },
  });
}

export function useCreateCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CapacitacionFormData) => {
      const { data } = await api.post<Capacitacion>(
        '/talent-hub/formacion/capacitaciones/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.capacitaciones.all });
      toast.success('Capacitacion creada');
    },
    onError: () => toast.error('Error al crear capacitacion'),
  });
}

export function useUpdateCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data: formData,
    }: {
      id: number;
      data: Partial<CapacitacionFormData>;
    }) => {
      const { data } = await api.patch<Capacitacion>(
        `/talent-hub/formacion/capacitaciones/${id}/`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.capacitaciones.all });
      toast.success('Capacitacion actualizada');
    },
    onError: () => toast.error('Error al actualizar capacitacion'),
  });
}

export function useDeleteCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/talent-hub/formacion/capacitaciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.capacitaciones.all });
      toast.success('Capacitacion eliminada');
    },
    onError: () => toast.error('Error al eliminar capacitacion'),
  });
}

export function usePublicarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
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
      const response = await api.get('/talent-hub/formacion/programaciones/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ProgramacionCapacitacion[];
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
      const response = await api.get(`/talent-hub/formacion/programaciones/calendario/?${params}`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ProgramacionCapacitacion[];
    },
  });
}

export function useProximasSesiones(dias = 7) {
  return useQuery({
    queryKey: formacionKeys.programaciones.proximas(dias),
    queryFn: async () => {
      const response = await api.get(`/talent-hub/formacion/programaciones/proximas/?dias=${dias}`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ProgramacionCapacitacion[];
    },
  });
}

export function useCreateProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ProgramacionFormData) => {
      const { data } = await api.post<ProgramacionCapacitacion>(
        '/talent-hub/formacion/programaciones/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.programaciones.all });
      toast.success('Sesion programada');
    },
    onError: () => toast.error('Error al programar sesion'),
  });
}

export function useDeleteProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/talent-hub/formacion/programaciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.programaciones.all });
      toast.success('Sesion eliminada');
    },
    onError: () => toast.error('Error al eliminar sesion'),
  });
}

// ============================================================================
// HOOKS - EJECUCIONES
// ============================================================================

export function useEjecucionesFormacion() {
  return useQuery({
    queryKey: formacionKeys.ejecuciones.list(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/formacion/ejecuciones/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EjecucionCapacitacion[];
    },
  });
}

export function useEjecucionesFormacionPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.ejecuciones.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get(
        `/talent-hub/formacion/ejecuciones/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EjecucionCapacitacion[];
    },
    enabled: !!colaboradorId,
  });
}

export function useCreateEjecucionFormacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: { programacion: number; colaborador: number }) => {
      const { data } = await api.post<EjecucionCapacitacion>(
        '/talent-hub/formacion/ejecuciones/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.ejecuciones.all });
      queryClient.invalidateQueries({ queryKey: formacionKeys.programaciones.all });
      toast.success('Inscripcion registrada');
    },
    onError: () => toast.error('Error al inscribir'),
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
      id: number;
      asistio: boolean;
      horaEntrada?: string;
      horaSalida?: string;
    }) => {
      const { data } = await api.post(
        `/talent-hub/formacion/ejecuciones/${id}/registrar_asistencia/`,
        {
          asistio,
          hora_entrada: horaEntrada,
          hora_salida: horaSalida,
        }
      );
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
    mutationFn: async ({ id, nota }: { id: number; nota: number }) => {
      const { data } = await api.post(
        `/talent-hub/formacion/ejecuciones/${id}/registrar_evaluacion/`,
        { nota }
      );
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
      const response = await api.get(
        `/talent-hub/formacion/gamificacion/leaderboard/?limite=${limite}`
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
      const { data } = await api.get<GamificacionColaborador>(
        `/talent-hub/formacion/gamificacion/mi_perfil/?colaborador_id=${colaboradorId}`
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
      const response = await api.get(
        `/talent-hub/formacion/gamificacion/mis_badges/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as BadgeColaborador[];
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
      const response = await api.get('/talent-hub/formacion/badges/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Badge[];
    },
  });
}

// ============================================================================
// HOOKS - EVALUACIONES DE EFICACIA
// ============================================================================

export function useEvaluacionesEficacia() {
  return useQuery({
    queryKey: formacionKeys.evaluacionesEficacia.list(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/formacion/evaluaciones-eficacia/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EvaluacionEficacia[];
    },
  });
}

export function useCreateEvaluacionEficacia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: Partial<EvaluacionEficacia>) => {
      const { data } = await api.post<EvaluacionEficacia>(
        '/talent-hub/formacion/evaluaciones-eficacia/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formacionKeys.evaluacionesEficacia.all });
      toast.success('Evaluacion registrada');
    },
    onError: () => toast.error('Error al registrar evaluacion'),
  });
}

// ============================================================================
// HOOKS - CERTIFICADOS
// ============================================================================

export function useCertificados() {
  return useQuery({
    queryKey: formacionKeys.certificados.list(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/formacion/certificados/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Certificado[];
    },
  });
}

export function useCertificadosPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: formacionKeys.certificados.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get(
        `/talent-hub/formacion/certificados/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Certificado[];
    },
    enabled: !!colaboradorId,
  });
}

export function useVerificarCertificado(codigo: string) {
  return useQuery({
    queryKey: [...formacionKeys.certificados.all, 'verificar', codigo],
    queryFn: async () => {
      const { data } = await api.get(
        `/talent-hub/formacion/certificados/verificar/?codigo=${codigo}`
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
      const { data } = await api.post(`/talent-hub/formacion/certificados/${id}/anular/`, {
        motivo,
      });
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
      const { data } = await api.get<FormacionEstadisticas>('/talent-hub/formacion/estadisticas/');
      return data;
    },
  });
}
