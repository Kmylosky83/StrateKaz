/**
 * React Query Hooks para Desempeno - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks + createApiClient factories.
 * Custom actions (activar, calibrar, firmar, etc.) remain manual.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  cicloEvaluacionApi,
  evaluacionDesempenoApi,
  planMejoraApi,
  actividadPlanMejoraApi,
  reconocimientoApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  CicloEvaluacion,
  CicloEvaluacionFormData,
  CompetenciaEvaluacion,
  EscalaCalificacion,
  EvaluacionDesempeno,
  EvaluacionCreateFormData,
  PlanMejora,
  PlanMejoraFormData,
  ActividadPlanMejora,
  ActividadMejoraFormData,
  SeguimientoFormData,
  TipoReconocimiento,
  Reconocimiento,
  ReconocimientoFormData,
  MuroReconocimiento,
  PublicarMuroFormData,
  DesempenoEstadisticas,
  DistribucionCalificaciones,
  TopReconocido,
} from '../types';

const DESEMPENO_URL = '/talent-hub/desempeno';

// ============================================================================
// QUERY KEYS (backward compat re-exports)
// ============================================================================

export const desempenoKeys = {
  all: ['desempeno'] as const,

  ciclos: {
    all: thKeys.ciclosEvaluacion.all,
    list: () => thKeys.ciclosEvaluacion.lists(),
    detail: (id: string) => thKeys.ciclosEvaluacion.detail(id),
    activo: () => thKeys.ciclosEvaluacion.custom('activo'),
    escala: (id: string) => thKeys.ciclosEvaluacion.custom('escala', id),
  },

  competencias: {
    all: thKeys.competenciasEvaluacion.all,
    list: () => thKeys.competenciasEvaluacion.lists(),
    detail: (id: string) => thKeys.competenciasEvaluacion.detail(id),
    porTipo: () => thKeys.competenciasEvaluacion.custom('por-tipo'),
  },

  evaluaciones: {
    all: thKeys.evaluacionesDesempeno.all,
    list: () => thKeys.evaluacionesDesempeno.lists(),
    detail: (id: string) => thKeys.evaluacionesDesempeno.detail(id),
    porColaborador: (id: string) => thKeys.evaluacionesDesempeno.custom('colaborador', id),
    misEvaluaciones: () => thKeys.evaluacionesDesempeno.custom('mis-evaluaciones'),
    pendientesPares: () => thKeys.evaluacionesDesempeno.custom('pendientes-pares'),
  },

  planesMejora: {
    all: thKeys.planesMejora.all,
    list: () => thKeys.planesMejora.lists(),
    detail: (id: string) => thKeys.planesMejora.detail(id),
    porColaborador: (id: string) => thKeys.planesMejora.custom('colaborador', id),
  },

  actividades: {
    all: thKeys.actividadesPlanMejora.all,
    list: () => thKeys.actividadesPlanMejora.lists(),
    porPlan: (planId: string) => thKeys.actividadesPlanMejora.custom('plan', planId),
  },

  tiposReconocimiento: {
    all: thKeys.tiposReconocimiento.all,
    list: () => thKeys.tiposReconocimiento.lists(),
  },

  reconocimientos: {
    all: thKeys.reconocimientos.all,
    list: () => thKeys.reconocimientos.lists(),
    detail: (id: string) => thKeys.reconocimientos.detail(id),
    porColaborador: (id: string) => thKeys.reconocimientos.custom('colaborador', id),
    pendientes: () => thKeys.reconocimientos.custom('pendientes'),
  },

  muro: {
    all: thKeys.muroReconocimientos.all,
    list: () => thKeys.muroReconocimientos.lists(),
    destacados: () => thKeys.muroReconocimientos.custom('destacados'),
  },

  estadisticas: () => thKeys.estadisticasDesempeno.custom('estadisticas'),
  distribucion: (cicloId?: string) => thKeys.estadisticasDesempeno.custom('distribucion', cicloId),
  topReconocidos: (limite?: number) =>
    thKeys.estadisticasDesempeno.custom('top-reconocidos', limite),
};

// ============================================================================
// FACTORY HOOKS - CICLOS DE EVALUACION
// ============================================================================

const cicloHooks = createCrudHooks<CicloEvaluacion, CicloEvaluacionFormData>(
  cicloEvaluacionApi,
  thKeys.ciclosEvaluacion,
  'Ciclo de evaluacion'
);

export function useCiclosEvaluacion() {
  return cicloHooks.useList();
}

export function useCicloEvaluacion(id: string) {
  return cicloHooks.useDetail(id ? Number(id) || id : undefined);
}

export function useCicloActivo() {
  return useQuery({
    queryKey: desempenoKeys.ciclos.activo(),
    queryFn: async () => {
      const { data } = await apiClient.get<CicloEvaluacion>(`${DESEMPENO_URL}/ciclos/activo/`);
      return data;
    },
  });
}

export function useEscalaCiclo(cicloId: string) {
  return useQuery({
    queryKey: desempenoKeys.ciclos.escala(cicloId),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/ciclos/${cicloId}/escala/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EscalaCalificacion[];
    },
    enabled: !!cicloId,
  });
}

export const useCreateCiclo = cicloHooks.useCreate;

export function useActivarCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/ciclos/${id}/activar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.ciclosEvaluacion.all });
      toast.success('Ciclo activado');
    },
    onError: () => toast.error('Error al activar ciclo'),
  });
}

export function useIniciarEvaluacionCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/ciclos/${id}/iniciar_evaluacion/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.ciclosEvaluacion.all });
      toast.success('Evaluacion iniciada');
    },
    onError: () => toast.error('Error al iniciar evaluacion'),
  });
}

export function useCerrarCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/ciclos/${id}/cerrar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.ciclosEvaluacion.all });
      toast.success('Ciclo cerrado');
    },
    onError: () => toast.error('Error al cerrar ciclo'),
  });
}

// ============================================================================
// HOOKS - COMPETENCIAS (read-only, custom endpoints)
// ============================================================================

export function useCompetenciasEvaluacion() {
  return useQuery({
    queryKey: desempenoKeys.competencias.list(),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/competencias/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as CompetenciaEvaluacion[];
    },
  });
}

export function useCompetenciasPorTipo() {
  return useQuery({
    queryKey: desempenoKeys.competencias.porTipo(),
    queryFn: async () => {
      const { data } = await apiClient.get<Record<string, CompetenciaEvaluacion[]>>(
        `${DESEMPENO_URL}/competencias/por_tipo/`
      );
      return data;
    },
  });
}

// ============================================================================
// HOOKS - EVALUACIONES DE DESEMPENO
// ============================================================================

const evaluacionHooks = createCrudHooks<EvaluacionDesempeno, EvaluacionCreateFormData>(
  evaluacionDesempenoApi,
  thKeys.evaluacionesDesempeno,
  'Evaluacion',
  { isFeminine: true }
);

export function useEvaluacionesDesempeno() {
  return evaluacionHooks.useList();
}

export function useEvaluacionDesempeno(id: string) {
  return evaluacionHooks.useDetail(id ? Number(id) || id : undefined);
}

export function useMisEvaluaciones() {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.misEvaluaciones(),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/evaluaciones/mis_evaluaciones/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EvaluacionDesempeno[];
    },
  });
}

export function usePendientesPares() {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.pendientesPares(),
    queryFn: async () => {
      const { data } = await apiClient.get(`${DESEMPENO_URL}/evaluaciones/pendientes_pares/`);
      return data;
    },
  });
}

export const useCreateEvaluacion = evaluacionHooks.useCreate;

export function useIniciarAutoevaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(
        `${DESEMPENO_URL}/evaluaciones/${id}/iniciar_autoevaluacion/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.evaluacionesDesempeno.all });
      toast.success('Autoevaluacion iniciada');
    },
    onError: () => toast.error('Error al iniciar autoevaluacion'),
  });
}

export function useCompletarAutoevaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, calificacion }: { id: string; calificacion: number }) => {
      const { data } = await apiClient.post(
        `${DESEMPENO_URL}/evaluaciones/${id}/completar_autoevaluacion/`,
        { calificacion }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.evaluacionesDesempeno.all });
      toast.success('Autoevaluacion completada');
    },
    onError: () => toast.error('Error al completar autoevaluacion'),
  });
}

export function useEvaluarJefe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      calificacion,
      fortalezas,
      areasMejora,
    }: {
      id: string;
      calificacion: number;
      fortalezas: string;
      areasMejora: string;
    }) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/evaluaciones/${id}/evaluar_jefe/`, {
        calificacion,
        fortalezas,
        areas_mejora: areasMejora,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.evaluacionesDesempeno.all });
      toast.success('Evaluacion de jefe registrada');
    },
    onError: () => toast.error('Error al registrar evaluacion'),
  });
}

export function useCalibrar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      calificacion,
      motivo,
    }: {
      id: string;
      calificacion: number;
      motivo: string;
    }) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/evaluaciones/${id}/calibrar/`, {
        calificacion,
        motivo,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.evaluacionesDesempeno.all });
      toast.success('Calibracion aplicada');
    },
    onError: () => toast.error('Error al calibrar'),
  });
}

export function useFirmarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comentarios }: { id: string; comentarios?: string }) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/evaluaciones/${id}/firmar/`, {
        comentarios,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.evaluacionesDesempeno.all });
      toast.success('Evaluacion firmada');
    },
    onError: () => toast.error('Error al firmar evaluacion'),
  });
}

// ============================================================================
// HOOKS - PLANES DE MEJORA
// ============================================================================

const planMejoraHooks = createCrudHooks<PlanMejora, PlanMejoraFormData>(
  planMejoraApi,
  thKeys.planesMejora,
  'Plan de mejora'
);

export function usePlanesMejora() {
  return planMejoraHooks.useList();
}

export function usePlanMejora(id: string) {
  return planMejoraHooks.useDetail(id ? Number(id) || id : undefined);
}

export function usePlanesMejoraPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: desempenoKeys.planesMejora.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await apiClient.get(
        `${DESEMPENO_URL}/planes-mejora/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as PlanMejora[];
    },
    enabled: !!colaboradorId,
  });
}

export const useCreatePlanMejora = planMejoraHooks.useCreate;

export function useAprobarPlanMejora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/planes-mejora/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.planesMejora.all });
      toast.success('Plan aprobado');
    },
    onError: () => toast.error('Error al aprobar plan'),
  });
}

export function useIniciarPlanMejora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/planes-mejora/${id}/iniciar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.planesMejora.all });
      toast.success('Plan iniciado');
    },
    onError: () => toast.error('Error al iniciar plan'),
  });
}

export function useAgregarSeguimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: SeguimientoFormData }) => {
      const { data } = await apiClient.post(
        `${DESEMPENO_URL}/planes-mejora/${id}/agregar_seguimiento/`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.planesMejora.all });
      toast.success('Seguimiento registrado');
    },
    onError: () => toast.error('Error al registrar seguimiento'),
  });
}

// ============================================================================
// HOOKS - ACTIVIDADES
// ============================================================================

export function useActividadesPorPlan(planId: string) {
  return useQuery({
    queryKey: desempenoKeys.actividades.porPlan(planId),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/actividades-plan/?plan=${planId}`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ActividadPlanMejora[];
    },
    enabled: !!planId,
  });
}

const actividadHooks = createCrudHooks<ActividadPlanMejora, ActividadMejoraFormData>(
  actividadPlanMejoraApi,
  thKeys.actividadesPlanMejora,
  'Actividad',
  { isFeminine: true }
);

export const useCreateActividad = actividadHooks.useCreate;

export function useCompletarActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/actividades-plan/${id}/completar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.actividadesPlanMejora.all });
      queryClient.invalidateQueries({ queryKey: thKeys.planesMejora.all });
      toast.success('Actividad completada');
    },
    onError: () => toast.error('Error al completar actividad'),
  });
}

// ============================================================================
// HOOKS - RECONOCIMIENTOS
// ============================================================================

export function useTiposReconocimiento() {
  return useQuery({
    queryKey: desempenoKeys.tiposReconocimiento.list(),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/tipos-reconocimiento/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as TipoReconocimiento[];
    },
  });
}

const reconocimientoHooks = createCrudHooks<Reconocimiento, ReconocimientoFormData>(
  reconocimientoApi,
  thKeys.reconocimientos,
  'Reconocimiento'
);

export function useReconocimientos() {
  return reconocimientoHooks.useList();
}

export function useReconocimientosPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: desempenoKeys.reconocimientos.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await apiClient.get(
        `${DESEMPENO_URL}/reconocimientos/mis_reconocimientos/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Reconocimiento[];
    },
    enabled: !!colaboradorId,
  });
}

export function useReconocimientosPendientes() {
  return useQuery({
    queryKey: desempenoKeys.reconocimientos.pendientes(),
    queryFn: async () => {
      const response = await apiClient.get(
        `${DESEMPENO_URL}/reconocimientos/pendientes_aprobacion/`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Reconocimiento[];
    },
  });
}

export const useCreateReconocimiento = reconocimientoHooks.useCreate;

export function useAprobarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/reconocimientos/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.reconocimientos.all });
      toast.success('Reconocimiento aprobado');
    },
    onError: () => toast.error('Error al aprobar'),
  });
}

export function useRechazarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/reconocimientos/${id}/rechazar/`, {
        motivo,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.reconocimientos.all });
      toast.success('Reconocimiento rechazado');
    },
    onError: () => toast.error('Error al rechazar'),
  });
}

export function useEntregarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/reconocimientos/${id}/entregar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.reconocimientos.all });
      toast.success('Reconocimiento entregado');
    },
    onError: () => toast.error('Error al entregar'),
  });
}

export function usePublicarEnMuro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData?: PublicarMuroFormData }) => {
      const { data } = await apiClient.post(
        `${DESEMPENO_URL}/reconocimientos/${id}/publicar_muro/`,
        formData || {}
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.reconocimientos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.muroReconocimientos.all });
      toast.success('Publicado en muro');
    },
    onError: () => toast.error('Error al publicar'),
  });
}

// ============================================================================
// HOOKS - MURO (custom — no standard CRUD)
// ============================================================================

export function useMuroReconocimientos() {
  return useQuery({
    queryKey: desempenoKeys.muro.list(),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/muro/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as MuroReconocimiento[];
    },
  });
}

export function useMuroDestacados() {
  return useQuery({
    queryKey: desempenoKeys.muro.destacados(),
    queryFn: async () => {
      const response = await apiClient.get(`${DESEMPENO_URL}/muro/destacados/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as MuroReconocimiento[];
    },
  });
}

export function useDarLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`${DESEMPENO_URL}/muro/${id}/dar_like/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.muroReconocimientos.all });
    },
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS (custom — read-only aggregations)
// ============================================================================

export function useDesempenoEstadisticas() {
  return useQuery({
    queryKey: desempenoKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await apiClient.get<DesempenoEstadisticas>(`${DESEMPENO_URL}/estadisticas/`);
      return data;
    },
  });
}

export function useDistribucionCalificaciones(cicloId?: string) {
  return useQuery({
    queryKey: desempenoKeys.distribucion(cicloId),
    queryFn: async () => {
      const params = cicloId ? `?ciclo_id=${cicloId}` : '';
      const { data } = await apiClient.get<DistribucionCalificaciones>(
        `${DESEMPENO_URL}/estadisticas/distribucion_calificaciones/${params}`
      );
      return data;
    },
  });
}

export function useTopReconocidos(limite = 10) {
  return useQuery({
    queryKey: desempenoKeys.topReconocidos(limite),
    queryFn: async () => {
      const response = await apiClient.get(
        `${DESEMPENO_URL}/estadisticas/top_reconocidos/?limite=${limite}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as TopReconocido[];
    },
  });
}
