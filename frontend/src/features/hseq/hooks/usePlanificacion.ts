/**
 * Hooks React Query para Planificación del Sistema HSEQ
 * Gestión de planes de trabajo anual, actividades, objetivos, programas y seguimientos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ==================== TYPES ====================

export interface PlanTrabajoAnual {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  año: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'BORRADOR' | 'APROBADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'CANCELADO';
  alcance: string;
  responsable: number;
  responsable_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  presupuesto_asignado?: number;
  presupuesto_ejecutado?: number;
  porcentaje_avance: number;
  numero_actividades_totales: number;
  numero_actividades_completadas: number;
  numero_actividades_vencidas: number;
  observaciones?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface ActividadPlan {
  id: number;
  plan_trabajo: number;
  codigo_actividad: string;
  nombre: string;
  descripcion?: string;
  tipo_actividad:
    | 'CAPACITACION'
    | 'INSPECCION'
    | 'MEDICION'
    | 'AUDITORIA'
    | 'SIMULACRO'
    | 'MANTENIMIENTO'
    | 'EVALUACION'
    | 'OTRO';
  objetivo_relacionado?: number;
  programa_relacionado?: number;
  fecha_inicio_programada: string;
  fecha_fin_programada: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'VENCIDA' | 'CANCELADA' | 'REPROGRAMADA';
  responsable: number;
  responsable_nombre?: string;
  participantes: number[];
  participantes_nombres?: string[];
  recursos_necesarios: string[];
  costo_estimado?: number;
  costo_real?: number;
  porcentaje_avance: number;
  evidencias: unknown[];
  resultado_obtenido?: string;
  observaciones?: string;
  requiere_aprobacion: boolean;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  periodicidad?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface ObjetivoSistema {
  id: number;
  plan_trabajo: number;
  codigo_objetivo: string;
  descripcion: string;
  categoria: 'SST' | 'AMBIENTAL' | 'CALIDAD' | 'SEGURIDAD_INFO' | 'ESTRATEGICO';
  tipo_objetivo: 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO';
  responsable: number;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO' | 'EN_REVISION';
  indicador_medicion: string;
  formula_calculo?: string;
  meta_numerica?: number;
  unidad_medida?: string;
  valor_linea_base?: number;
  valor_actual?: number;
  porcentaje_cumplimiento: number;
  frecuencia_medicion: 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  recursos_asignados?: string[];
  riesgos_identificados?: string[];
  observaciones?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramaGestion {
  id: number;
  plan_trabajo: number;
  codigo_programa: string;
  nombre: string;
  descripcion?: string;
  tipo_programa:
    | 'CAPACITACION'
    | 'PREVENCION_RIESGOS'
    | 'VIGILANCIA_SALUD'
    | 'GESTION_AMBIENTAL'
    | 'MEJORA_CONTINUA'
    | 'OTRO';
  objetivo_principal: string;
  alcance: string;
  responsable: number;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'PLANIFICADO' | 'EN_EJECUCION' | 'SUSPENDIDO' | 'COMPLETADO' | 'CANCELADO';
  presupuesto?: number;
  recursos_necesarios: string[];
  indicadores_seguimiento: string[];
  porcentaje_avance: number;
  numero_actividades: number;
  actividades_completadas: number;
  resultados_esperados: string[];
  resultados_obtenidos: string[];
  observaciones?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface ActividadPrograma {
  id: number;
  programa: number;
  codigo_actividad: string;
  nombre: string;
  descripcion?: string;
  fecha_programada: string;
  fecha_ejecucion?: string;
  estado: 'PROGRAMADA' | 'EJECUTADA' | 'REPROGRAMADA' | 'CANCELADA';
  responsable: number;
  responsable_nombre?: string;
  duracion_horas?: number;
  participantes_esperados?: number;
  participantes_reales?: number;
  costo_estimado?: number;
  costo_real?: number;
  evidencia?: string;
  resultado?: string;
  observaciones?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoCronograma {
  id: number;
  plan_trabajo: number;
  periodo: string;
  fecha_seguimiento: string;
  realizado_por: number;
  realizado_por_nombre?: string;
  porcentaje_cumplimiento_plan: number;
  actividades_programadas: number;
  actividades_ejecutadas: number;
  actividades_pendientes: number;
  actividades_vencidas: number;
  desviaciones_identificadas: string[];
  acciones_correctivas: string[];
  observaciones?: string;
  recomendaciones?: string;
  archivo_informe?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardPlanificacion {
  plan: PlanTrabajoAnual;
  resumen: {
    total_actividades: number;
    actividades_completadas: number;
    actividades_en_proceso: number;
    actividades_pendientes: number;
    actividades_vencidas: number;
    porcentaje_avance_global: number;
    porcentaje_cumplimiento_cronograma: number;
  };
  objetivos: {
    total: number;
    completados: number;
    en_proceso: number;
    cumplimiento_promedio: number;
  };
  programas: {
    total: number;
    en_ejecucion: number;
    completados: number;
    avance_promedio: number;
  };
  presupuesto: {
    asignado: number;
    ejecutado: number;
    porcentaje_ejecucion: number;
  };
  actividades_proximas: ActividadPlan[];
  actividades_vencidas: ActividadPlan[];
  objetivos_criticos: ObjetivoSistema[];
}

// DTOs
export interface CreatePlanTrabajoAnualDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  año: number;
  fecha_inicio: string;
  fecha_fin: string;
  alcance: string;
  responsable: number;
  presupuesto_asignado?: number;
  observaciones?: string;
}

export type UpdatePlanTrabajoAnualDTO = Partial<CreatePlanTrabajoAnualDTO>;

export interface CreateActividadPlanDTO {
  plan_trabajo: number;
  codigo_actividad?: string;
  nombre: string;
  descripcion?: string;
  tipo_actividad: string;
  objetivo_relacionado?: number;
  programa_relacionado?: number;
  fecha_inicio_programada: string;
  fecha_fin_programada: string;
  responsable: number;
  participantes?: number[];
  recursos_necesarios?: string[];
  costo_estimado?: number;
  prioridad?: string;
  periodicidad?: string;
  requiere_aprobacion?: boolean;
}

export type UpdateActividadPlanDTO = Partial<CreateActividadPlanDTO>;

export interface ActualizarAvanceActividadDTO {
  porcentaje_avance: number;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  costo_real?: number;
  resultado_obtenido?: string;
  observaciones?: string;
}

export interface CreateObjetivoSistemaDTO {
  plan_trabajo: number;
  codigo_objetivo?: string;
  descripcion: string;
  categoria: string;
  tipo_objetivo: string;
  responsable: number;
  fecha_inicio: string;
  fecha_fin: string;
  indicador_medicion: string;
  formula_calculo?: string;
  meta_numerica?: number;
  unidad_medida?: string;
  valor_linea_base?: number;
  frecuencia_medicion: string;
  recursos_asignados?: string[];
}

export type UpdateObjetivoSistemaDTO = Partial<CreateObjetivoSistemaDTO>;

export interface ActualizarCumplimientoDTO {
  valor_actual: number;
  observaciones?: string;
}

export interface CreateProgramaGestionDTO {
  plan_trabajo: number;
  codigo_programa?: string;
  nombre: string;
  descripcion?: string;
  tipo_programa: string;
  objetivo_principal: string;
  alcance: string;
  responsable: number;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto?: number;
  recursos_necesarios?: string[];
  indicadores_seguimiento?: string[];
  resultados_esperados?: string[];
}

export type UpdateProgramaGestionDTO = Partial<CreateProgramaGestionDTO>;

export interface ActualizarAvanceProgramaDTO {
  porcentaje_avance: number;
  resultados_obtenidos?: string[];
  observaciones?: string;
}

export interface CreateActividadProgramaDTO {
  programa: number;
  codigo_actividad?: string;
  nombre: string;
  descripcion?: string;
  fecha_programada: string;
  responsable: number;
  duracion_horas?: number;
  participantes_esperados?: number;
  costo_estimado?: number;
}

export interface EjecutarActividadDTO {
  fecha_ejecucion: string;
  participantes_reales?: number;
  costo_real?: number;
  evidencia?: string;
  resultado?: string;
  observaciones?: string;
}

export interface CreateSeguimientoCronogramaDTO {
  plan_trabajo: number;
  periodo: string;
  fecha_seguimiento: string;
  porcentaje_cumplimiento_plan: number;
  actividades_programadas: number;
  actividades_ejecutadas: number;
  actividades_pendientes: number;
  actividades_vencidas: number;
  desviaciones_identificadas?: string[];
  acciones_correctivas?: string[];
  observaciones?: string;
  recomendaciones?: string;
}

// ==================== QUERY KEYS ====================

export const planificacionKeys = {
  all: ['hseq', 'planificacion'] as const,

  // Planes de Trabajo
  planes: () => [...planificacionKeys.all, 'planes'] as const,
  plan: (id: number) => [...planificacionKeys.planes(), id] as const,
  planesByAño: (año: number) => [...planificacionKeys.planes(), 'año', año] as const,
  planesByEstado: (estado: string) => [...planificacionKeys.planes(), 'estado', estado] as const,

  // Actividades de Plan
  actividades: (planId: number) => [...planificacionKeys.all, 'actividades', planId] as const,
  actividad: (id: number) => [...planificacionKeys.all, 'actividad', id] as const,
  actividadesByTipo: (planId: number, tipo: string) =>
    [...planificacionKeys.actividades(planId), 'tipo', tipo] as const,
  actividadesByEstado: (planId: number, estado: string) =>
    [...planificacionKeys.actividades(planId), 'estado', estado] as const,

  // Objetivos
  objetivos: (planId: number) => [...planificacionKeys.all, 'objetivos', planId] as const,
  objetivo: (id: number) => [...planificacionKeys.all, 'objetivo', id] as const,
  objetivosByCategoria: (planId: number, categoria: string) =>
    [...planificacionKeys.objetivos(planId), 'categoria', categoria] as const,

  // Programas
  programas: (planId: number) => [...planificacionKeys.all, 'programas', planId] as const,
  programa: (id: number) => [...planificacionKeys.all, 'programa', id] as const,
  programasByTipo: (planId: number, tipo: string) =>
    [...planificacionKeys.programas(planId), 'tipo', tipo] as const,

  // Actividades de Programa
  actividadesPrograma: (programaId: number) =>
    [...planificacionKeys.all, 'actividades-programa', programaId] as const,

  // Seguimientos
  seguimientos: (planId: number) => [...planificacionKeys.all, 'seguimientos', planId] as const,

  // Dashboard
  dashboard: (planId: number) => [...planificacionKeys.all, 'dashboard', planId] as const,
};

// ==================== PLAN TRABAJO ANUAL HOOKS ====================

export function usePlanesTrabajo(filters?: { año?: number; estado?: string }) {
  return useQuery({
    queryKey: filters?.año
      ? planificacionKeys.planesByAño(filters.año)
      : filters?.estado
        ? planificacionKeys.planesByEstado(filters.estado)
        : planificacionKeys.planes(),
    queryFn: async () => {
      const { data } = await apiClient.get<PlanTrabajoAnual[]>('/api/hseq/planificacion/planes/', {
        params: filters,
      });
      return data;
    },
  });
}

export function usePlanTrabajo(id: number) {
  return useQuery({
    queryKey: planificacionKeys.plan(id),
    queryFn: async () => {
      const { data } = await apiClient.get<PlanTrabajoAnual>(
        `/api/hseq/planificacion/planes/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePlanTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreatePlanTrabajoAnualDTO) => {
      const { data } = await apiClient.post<PlanTrabajoAnual>(
        '/api/hseq/planificacion/planes/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.planes() });
      toast.success('Plan de trabajo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear plan de trabajo');
    },
  });
}

export function useUpdatePlanTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdatePlanTrabajoAnualDTO }) => {
      const { data } = await apiClient.patch<PlanTrabajoAnual>(
        `/api/hseq/planificacion/planes/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.planes() });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(id) });
      toast.success('Plan de trabajo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar plan de trabajo');
    },
  });
}

export function useDeletePlanTrabajo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/planificacion/planes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.planes() });
      toast.success('Plan de trabajo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar plan de trabajo');
    },
  });
}

export function useAprobarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<PlanTrabajoAnual>(
        `/api/hseq/planificacion/planes/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.planes() });
      toast.success('Plan de trabajo aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar plan de trabajo');
    },
  });
}

export function useCambiarEstadoPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const { data } = await apiClient.post<PlanTrabajoAnual>(
        `/api/hseq/planificacion/planes/${id}/cambiar_estado/`,
        { estado }
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.planes() });
      toast.success('Estado del plan actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al cambiar estado del plan');
    },
  });
}

// ==================== ACTIVIDADES PLAN HOOKS ====================

export function useActividadesPlan(planId: number, filters?: { tipo?: string; estado?: string }) {
  return useQuery({
    queryKey: filters?.tipo
      ? planificacionKeys.actividadesByTipo(planId, filters.tipo)
      : filters?.estado
        ? planificacionKeys.actividadesByEstado(planId, filters.estado)
        : planificacionKeys.actividades(planId),
    queryFn: async () => {
      const { data } = await apiClient.get<ActividadPlan[]>(
        `/api/hseq/planificacion/planes/${planId}/actividades/`,
        { params: filters }
      );
      return data;
    },
    enabled: !!planId,
  });
}

export function useActividadPlan(id: number) {
  return useQuery({
    queryKey: planificacionKeys.actividad(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ActividadPlan>(
        `/api/hseq/planificacion/actividades/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateActividadPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateActividadPlanDTO) => {
      const { data } = await apiClient.post<ActividadPlan>(
        '/api/hseq/planificacion/actividades/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividades(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Actividad creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear actividad');
    },
  });
}

export function useUpdateActividadPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateActividadPlanDTO }) => {
      const { data } = await apiClient.patch<ActividadPlan>(
        `/api/hseq/planificacion/actividades/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividades(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividad(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Actividad actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar actividad');
    },
  });
}

export function useActualizarAvanceActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: ActualizarAvanceActividadDTO }) => {
      const { data } = await apiClient.post<ActividadPlan>(
        `/api/hseq/planificacion/actividades/${id}/actualizar_avance/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividad(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividades(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Avance de actividad actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar avance de actividad');
    },
  });
}

export function useDeleteActividadPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: number; planId: number }) => {
      await apiClient.delete(`/api/hseq/planificacion/actividades/${id}/`);
      return planId;
    },
    onSuccess: (planId) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.actividades(planId) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.plan(planId) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(planId) });
      toast.success('Actividad eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar actividad');
    },
  });
}

// ==================== OBJETIVOS SISTEMA HOOKS ====================

export function useObjetivosSistema(planId: number, filters?: { categoria?: string }) {
  return useQuery({
    queryKey: filters?.categoria
      ? planificacionKeys.objetivosByCategoria(planId, filters.categoria)
      : planificacionKeys.objetivos(planId),
    queryFn: async () => {
      const { data } = await apiClient.get<ObjetivoSistema[]>(
        `/api/hseq/planificacion/planes/${planId}/objetivos/`,
        { params: filters }
      );
      return data;
    },
    enabled: !!planId,
  });
}

export function useObjetivo(id: number) {
  return useQuery({
    queryKey: planificacionKeys.objetivo(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ObjetivoSistema>(
        `/api/hseq/planificacion/objetivos/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateObjetivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateObjetivoSistemaDTO) => {
      const { data } = await apiClient.post<ObjetivoSistema>(
        '/api/hseq/planificacion/objetivos/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivos(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Objetivo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear objetivo');
    },
  });
}

export function useUpdateObjetivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateObjetivoSistemaDTO }) => {
      const { data } = await apiClient.patch<ObjetivoSistema>(
        `/api/hseq/planificacion/objetivos/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivos(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivo(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Objetivo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar objetivo');
    },
  });
}

export function useActualizarCumplimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: ActualizarCumplimientoDTO }) => {
      const { data } = await apiClient.post<ObjetivoSistema>(
        `/api/hseq/planificacion/objetivos/${id}/actualizar_cumplimiento/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivo(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivos(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Cumplimiento actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar cumplimiento');
    },
  });
}

export function useDeleteObjetivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: number; planId: number }) => {
      await apiClient.delete(`/api/hseq/planificacion/objetivos/${id}/`);
      return planId;
    },
    onSuccess: (planId) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.objetivos(planId) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(planId) });
      toast.success('Objetivo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar objetivo');
    },
  });
}

// ==================== PROGRAMAS GESTION HOOKS ====================

export function useProgramasGestion(planId: number, filters?: { tipo?: string }) {
  return useQuery({
    queryKey: filters?.tipo
      ? planificacionKeys.programasByTipo(planId, filters.tipo)
      : planificacionKeys.programas(planId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProgramaGestion[]>(
        `/api/hseq/planificacion/planes/${planId}/programas/`,
        { params: filters }
      );
      return data;
    },
    enabled: !!planId,
  });
}

export function usePrograma(id: number) {
  return useQuery({
    queryKey: planificacionKeys.programa(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ProgramaGestion>(
        `/api/hseq/planificacion/programas/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateProgramaGestionDTO) => {
      const { data } = await apiClient.post<ProgramaGestion>(
        '/api/hseq/planificacion/programas/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programas(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Programa creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear programa');
    },
  });
}

export function useUpdatePrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateProgramaGestionDTO }) => {
      const { data } = await apiClient.patch<ProgramaGestion>(
        `/api/hseq/planificacion/programas/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programas(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programa(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Programa actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar programa');
    },
  });
}

export function useActualizarAvancePrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: ActualizarAvanceProgramaDTO }) => {
      const { data } = await apiClient.post<ProgramaGestion>(
        `/api/hseq/planificacion/programas/${id}/actualizar_avance/`,
        datos
      );
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programa(id) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programas(data.plan_trabajo) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Avance de programa actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar avance de programa');
    },
  });
}

export function useDeletePrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: number; planId: number }) => {
      await apiClient.delete(`/api/hseq/planificacion/programas/${id}/`);
      return planId;
    },
    onSuccess: (planId) => {
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programas(planId) });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(planId) });
      toast.success('Programa eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar programa');
    },
  });
}

// ==================== ACTIVIDADES PROGRAMA HOOKS ====================

export function useActividadesPrograma(programaId: number) {
  return useQuery({
    queryKey: planificacionKeys.actividadesPrograma(programaId),
    queryFn: async () => {
      const { data } = await apiClient.get<ActividadPrograma[]>(
        `/api/hseq/planificacion/programas/${programaId}/actividades/`
      );
      return data;
    },
    enabled: !!programaId,
  });
}

export function useCreateActividadPrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateActividadProgramaDTO) => {
      const { data } = await apiClient.post<ActividadPrograma>(
        '/api/hseq/planificacion/actividades-programa/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: planificacionKeys.actividadesPrograma(data.programa),
      });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programa(data.programa) });
      toast.success('Actividad de programa creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear actividad de programa');
    },
  });
}

export function useEjecutarActividad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: EjecutarActividadDTO }) => {
      const { data } = await apiClient.post<ActividadPrograma>(
        `/api/hseq/planificacion/actividades-programa/${id}/ejecutar/`,
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: planificacionKeys.actividadesPrograma(data.programa),
      });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.programa(data.programa) });
      toast.success('Actividad marcada como ejecutada exitosamente');
    },
    onError: () => {
      toast.error('Error al ejecutar actividad');
    },
  });
}

// ==================== SEGUIMIENTOS CRONOGRAMA HOOKS ====================

export function useSeguimientosCronograma(planId: number) {
  return useQuery({
    queryKey: planificacionKeys.seguimientos(planId),
    queryFn: async () => {
      const { data } = await apiClient.get<SeguimientoCronograma[]>(
        `/api/hseq/planificacion/planes/${planId}/seguimientos/`
      );
      return data;
    },
    enabled: !!planId,
  });
}

export function useCreateSeguimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateSeguimientoCronogramaDTO) => {
      const { data } = await apiClient.post<SeguimientoCronograma>(
        '/api/hseq/planificacion/seguimientos/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: planificacionKeys.seguimientos(data.plan_trabajo),
      });
      queryClient.invalidateQueries({ queryKey: planificacionKeys.dashboard(data.plan_trabajo) });
      toast.success('Seguimiento registrado exitosamente');
    },
    onError: () => {
      toast.error('Error al registrar seguimiento');
    },
  });
}

// ==================== DASHBOARD HOOKS ====================

export function useDashboardPlanificacion(planId: number) {
  return useQuery({
    queryKey: planificacionKeys.dashboard(planId),
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardPlanificacion>(
        `/api/hseq/planificacion/planes/${planId}/dashboard/`
      );
      return data;
    },
    enabled: !!planId,
  });
}
