/**
 * React Query Hooks para Desempeno - Talent Hub
 * Sistema de Gestion Grasas y Huesos del Norte
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
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

// ============================================================================
// QUERY KEYS
// ============================================================================

export const desempenoKeys = {
  all: ['desempeno'] as const,

  // Ciclos
  ciclos: {
    all: ['desempeno', 'ciclos'] as const,
    list: () => [...desempenoKeys.ciclos.all, 'list'] as const,
    detail: (id: string) => [...desempenoKeys.ciclos.all, 'detail', id] as const,
    activo: () => [...desempenoKeys.ciclos.all, 'activo'] as const,
    escala: (id: string) => [...desempenoKeys.ciclos.all, 'escala', id] as const,
  },

  // Competencias
  competencias: {
    all: ['desempeno', 'competencias'] as const,
    list: () => [...desempenoKeys.competencias.all, 'list'] as const,
    detail: (id: string) => [...desempenoKeys.competencias.all, 'detail', id] as const,
    porTipo: () => [...desempenoKeys.competencias.all, 'por-tipo'] as const,
  },

  // Evaluaciones
  evaluaciones: {
    all: ['desempeno', 'evaluaciones'] as const,
    list: () => [...desempenoKeys.evaluaciones.all, 'list'] as const,
    detail: (id: string) => [...desempenoKeys.evaluaciones.all, 'detail', id] as const,
    porColaborador: (id: string) => [...desempenoKeys.evaluaciones.all, 'colaborador', id] as const,
    misEvaluaciones: () => [...desempenoKeys.evaluaciones.all, 'mis-evaluaciones'] as const,
    pendientesPares: () => [...desempenoKeys.evaluaciones.all, 'pendientes-pares'] as const,
  },

  // Planes de Mejora
  planesMejora: {
    all: ['desempeno', 'planes-mejora'] as const,
    list: () => [...desempenoKeys.planesMejora.all, 'list'] as const,
    detail: (id: string) => [...desempenoKeys.planesMejora.all, 'detail', id] as const,
    porColaborador: (id: string) => [...desempenoKeys.planesMejora.all, 'colaborador', id] as const,
  },

  // Actividades
  actividades: {
    all: ['desempeno', 'actividades'] as const,
    list: () => [...desempenoKeys.actividades.all, 'list'] as const,
    porPlan: (planId: string) => [...desempenoKeys.actividades.all, 'plan', planId] as const,
  },

  // Tipos de Reconocimiento
  tiposReconocimiento: {
    all: ['desempeno', 'tipos-reconocimiento'] as const,
    list: () => [...desempenoKeys.tiposReconocimiento.all, 'list'] as const,
  },

  // Reconocimientos
  reconocimientos: {
    all: ['desempeno', 'reconocimientos'] as const,
    list: () => [...desempenoKeys.reconocimientos.all, 'list'] as const,
    detail: (id: string) => [...desempenoKeys.reconocimientos.all, 'detail', id] as const,
    porColaborador: (id: string) => [...desempenoKeys.reconocimientos.all, 'colaborador', id] as const,
    pendientes: () => [...desempenoKeys.reconocimientos.all, 'pendientes'] as const,
  },

  // Muro
  muro: {
    all: ['desempeno', 'muro'] as const,
    list: () => [...desempenoKeys.muro.all, 'list'] as const,
    destacados: () => [...desempenoKeys.muro.all, 'destacados'] as const,
  },

  // Estadisticas
  estadisticas: () => [...desempenoKeys.all, 'estadisticas'] as const,
  distribucion: (cicloId?: string) => [...desempenoKeys.all, 'distribucion', cicloId] as const,
  topReconocidos: (limite?: number) => [...desempenoKeys.all, 'top-reconocidos', limite] as const,
};

// ============================================================================
// HOOKS - CICLOS DE EVALUACION
// ============================================================================

export function useCiclosEvaluacion() {
  return useQuery({
    queryKey: desempenoKeys.ciclos.list(),
    queryFn: async () => {
      const { data } = await api.get<CicloEvaluacion[]>('/talent-hub/desempeno/ciclos/');
      return data;
    },
  });
}

export function useCicloEvaluacion(id: string) {
  return useQuery({
    queryKey: desempenoKeys.ciclos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<CicloEvaluacion>(`/talent-hub/desempeno/ciclos/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCicloActivo() {
  return useQuery({
    queryKey: desempenoKeys.ciclos.activo(),
    queryFn: async () => {
      const { data } = await api.get<CicloEvaluacion>('/talent-hub/desempeno/ciclos/activo/');
      return data;
    },
  });
}

export function useEscalaCiclo(cicloId: string) {
  return useQuery({
    queryKey: desempenoKeys.ciclos.escala(cicloId),
    queryFn: async () => {
      const { data } = await api.get<EscalaCalificacion[]>(`/talent-hub/desempeno/ciclos/${cicloId}/escala/`);
      return data;
    },
    enabled: !!cicloId,
  });
}

export function useCreateCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CicloEvaluacionFormData) => {
      const { data } = await api.post<CicloEvaluacion>('/talent-hub/desempeno/ciclos/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.ciclos.all });
      toast.success('Ciclo de evaluacion creado');
    },
    onError: () => toast.error('Error al crear ciclo'),
  });
}

export function useActivarCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/ciclos/${id}/activar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.ciclos.all });
      toast.success('Ciclo activado');
    },
    onError: () => toast.error('Error al activar ciclo'),
  });
}

export function useIniciarEvaluacionCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/ciclos/${id}/iniciar_evaluacion/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.ciclos.all });
      toast.success('Evaluacion iniciada');
    },
    onError: () => toast.error('Error al iniciar evaluacion'),
  });
}

export function useCerrarCiclo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/ciclos/${id}/cerrar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.ciclos.all });
      toast.success('Ciclo cerrado');
    },
    onError: () => toast.error('Error al cerrar ciclo'),
  });
}

// ============================================================================
// HOOKS - COMPETENCIAS
// ============================================================================

export function useCompetenciasEvaluacion() {
  return useQuery({
    queryKey: desempenoKeys.competencias.list(),
    queryFn: async () => {
      const { data } = await api.get<CompetenciaEvaluacion[]>('/talent-hub/desempeno/competencias/');
      return data;
    },
  });
}

export function useCompetenciasPorTipo() {
  return useQuery({
    queryKey: desempenoKeys.competencias.porTipo(),
    queryFn: async () => {
      const { data } = await api.get<Record<string, CompetenciaEvaluacion[]>>(
        '/talent-hub/desempeno/competencias/por_tipo/'
      );
      return data;
    },
  });
}

// ============================================================================
// HOOKS - EVALUACIONES DE DESEMPENO
// ============================================================================

export function useEvaluacionesDesempeno() {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.list(),
    queryFn: async () => {
      const { data } = await api.get<EvaluacionDesempeno[]>('/talent-hub/desempeno/evaluaciones/');
      return data;
    },
  });
}

export function useEvaluacionDesempeno(id: string) {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<EvaluacionDesempeno>(`/talent-hub/desempeno/evaluaciones/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMisEvaluaciones() {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.misEvaluaciones(),
    queryFn: async () => {
      const { data } = await api.get<EvaluacionDesempeno[]>('/talent-hub/desempeno/evaluaciones/mis_evaluaciones/');
      return data;
    },
  });
}

export function usePendientesPares() {
  return useQuery({
    queryKey: desempenoKeys.evaluaciones.pendientesPares(),
    queryFn: async () => {
      const { data } = await api.get('/talent-hub/desempeno/evaluaciones/pendientes_pares/');
      return data;
    },
  });
}

export function useCreateEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EvaluacionCreateFormData) => {
      const { data } = await api.post<EvaluacionDesempeno>('/talent-hub/desempeno/evaluaciones/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
      toast.success('Evaluacion creada');
    },
    onError: () => toast.error('Error al crear evaluacion'),
  });
}

export function useIniciarAutoevaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/evaluaciones/${id}/iniciar_autoevaluacion/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
      toast.success('Autoevaluacion iniciada');
    },
    onError: () => toast.error('Error al iniciar autoevaluacion'),
  });
}

export function useCompletarAutoevaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, calificacion }: { id: string; calificacion: number }) => {
      const { data } = await api.post(`/talent-hub/desempeno/evaluaciones/${id}/completar_autoevaluacion/`, {
        calificacion,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
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
      const { data } = await api.post(`/talent-hub/desempeno/evaluaciones/${id}/evaluar_jefe/`, {
        calificacion,
        fortalezas,
        areas_mejora: areasMejora,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
      toast.success('Evaluacion de jefe registrada');
    },
    onError: () => toast.error('Error al registrar evaluacion'),
  });
}

export function useCalibrar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, calificacion, motivo }: { id: string; calificacion: number; motivo: string }) => {
      const { data } = await api.post(`/talent-hub/desempeno/evaluaciones/${id}/calibrar/`, { calificacion, motivo });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
      toast.success('Calibracion aplicada');
    },
    onError: () => toast.error('Error al calibrar'),
  });
}

export function useFirmarEvaluacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comentarios }: { id: string; comentarios?: string }) => {
      const { data } = await api.post(`/talent-hub/desempeno/evaluaciones/${id}/firmar/`, { comentarios });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.evaluaciones.all });
      toast.success('Evaluacion firmada');
    },
    onError: () => toast.error('Error al firmar evaluacion'),
  });
}

// ============================================================================
// HOOKS - PLANES DE MEJORA
// ============================================================================

export function usePlanesMejora() {
  return useQuery({
    queryKey: desempenoKeys.planesMejora.list(),
    queryFn: async () => {
      const { data } = await api.get<PlanMejora[]>('/talent-hub/desempeno/planes-mejora/');
      return data;
    },
  });
}

export function usePlanMejora(id: string) {
  return useQuery({
    queryKey: desempenoKeys.planesMejora.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PlanMejora>(`/talent-hub/desempeno/planes-mejora/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePlanesMejoraPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: desempenoKeys.planesMejora.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<PlanMejora[]>(
        `/talent-hub/desempeno/planes-mejora/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useCreatePlanMejora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: PlanMejoraFormData) => {
      const { data } = await api.post<PlanMejora>('/talent-hub/desempeno/planes-mejora/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
      toast.success('Plan de mejora creado');
    },
    onError: () => toast.error('Error al crear plan'),
  });
}

export function useAprobarPlanMejora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/planes-mejora/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
      toast.success('Plan aprobado');
    },
    onError: () => toast.error('Error al aprobar plan'),
  });
}

export function useIniciarPlanMejora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/planes-mejora/${id}/iniciar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
      toast.success('Plan iniciado');
    },
    onError: () => toast.error('Error al iniciar plan'),
  });
}

export function useAgregarSeguimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: SeguimientoFormData }) => {
      const { data } = await api.post(`/talent-hub/desempeno/planes-mejora/${id}/agregar_seguimiento/`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
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
      const { data } = await api.get<ActividadPlanMejora[]>(`/talent-hub/desempeno/actividades-plan/?plan=${planId}`);
      return data;
    },
    enabled: !!planId,
  });
}

export function useCreateActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ActividadMejoraFormData) => {
      const { data } = await api.post<ActividadPlanMejora>('/talent-hub/desempeno/actividades-plan/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.actividades.all });
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
      toast.success('Actividad creada');
    },
    onError: () => toast.error('Error al crear actividad'),
  });
}

export function useCompletarActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/actividades-plan/${id}/completar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.actividades.all });
      queryClient.invalidateQueries({ queryKey: desempenoKeys.planesMejora.all });
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
      const { data } = await api.get<TipoReconocimiento[]>('/talent-hub/desempeno/tipos-reconocimiento/');
      return data;
    },
  });
}

export function useReconocimientos() {
  return useQuery({
    queryKey: desempenoKeys.reconocimientos.list(),
    queryFn: async () => {
      const { data } = await api.get<Reconocimiento[]>('/talent-hub/desempeno/reconocimientos/');
      return data;
    },
  });
}

export function useReconocimientosPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: desempenoKeys.reconocimientos.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<Reconocimiento[]>(
        `/talent-hub/desempeno/reconocimientos/mis_reconocimientos/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useReconocimientosPendientes() {
  return useQuery({
    queryKey: desempenoKeys.reconocimientos.pendientes(),
    queryFn: async () => {
      const { data } = await api.get<Reconocimiento[]>('/talent-hub/desempeno/reconocimientos/pendientes_aprobacion/');
      return data;
    },
  });
}

export function useCreateReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ReconocimientoFormData) => {
      const { data } = await api.post<Reconocimiento>('/talent-hub/desempeno/reconocimientos/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.reconocimientos.all });
      toast.success('Reconocimiento nominado');
    },
    onError: () => toast.error('Error al nominar reconocimiento'),
  });
}

export function useAprobarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/reconocimientos/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.reconocimientos.all });
      toast.success('Reconocimiento aprobado');
    },
    onError: () => toast.error('Error al aprobar'),
  });
}

export function useRechazarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data } = await api.post(`/talent-hub/desempeno/reconocimientos/${id}/rechazar/`, { motivo });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.reconocimientos.all });
      toast.success('Reconocimiento rechazado');
    },
    onError: () => toast.error('Error al rechazar'),
  });
}

export function useEntregarReconocimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/reconocimientos/${id}/entregar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.reconocimientos.all });
      toast.success('Reconocimiento entregado');
    },
    onError: () => toast.error('Error al entregar'),
  });
}

export function usePublicarEnMuro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData?: PublicarMuroFormData }) => {
      const { data } = await api.post(`/talent-hub/desempeno/reconocimientos/${id}/publicar_muro/`, formData || {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.reconocimientos.all });
      queryClient.invalidateQueries({ queryKey: desempenoKeys.muro.all });
      toast.success('Publicado en muro');
    },
    onError: () => toast.error('Error al publicar'),
  });
}

// ============================================================================
// HOOKS - MURO
// ============================================================================

export function useMuroReconocimientos() {
  return useQuery({
    queryKey: desempenoKeys.muro.list(),
    queryFn: async () => {
      const { data } = await api.get<MuroReconocimiento[]>('/talent-hub/desempeno/muro/');
      return data;
    },
  });
}

export function useMuroDestacados() {
  return useQuery({
    queryKey: desempenoKeys.muro.destacados(),
    queryFn: async () => {
      const { data } = await api.get<MuroReconocimiento[]>('/talent-hub/desempeno/muro/destacados/');
      return data;
    },
  });
}

export function useDarLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/talent-hub/desempeno/muro/${id}/dar_like/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desempenoKeys.muro.all });
    },
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useDesempenoEstadisticas() {
  return useQuery({
    queryKey: desempenoKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await api.get<DesempenoEstadisticas>('/talent-hub/desempeno/estadisticas/resumen/');
      return data;
    },
  });
}

export function useDistribucionCalificaciones(cicloId?: string) {
  return useQuery({
    queryKey: desempenoKeys.distribucion(cicloId),
    queryFn: async () => {
      const params = cicloId ? `?ciclo_id=${cicloId}` : '';
      const { data } = await api.get<DistribucionCalificaciones>(
        `/talent-hub/desempeno/estadisticas/distribucion_calificaciones/${params}`
      );
      return data;
    },
  });
}

export function useTopReconocidos(limite = 10) {
  return useQuery({
    queryKey: desempenoKeys.topReconocidos(limite),
    queryFn: async () => {
      const { data } = await api.get<TopReconocido[]>(
        `/talent-hub/desempeno/estadisticas/top_reconocidos/?limite=${limite}`
      );
      return data;
    },
  });
}
