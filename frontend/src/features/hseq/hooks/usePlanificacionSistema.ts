/**
 * Custom Hooks para Planificación del Sistema - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Hooks basados en TanStack Query (React Query) para gestión de estado del servidor
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  planTrabajoApi,
  actividadPlanApi,
  objetivoSistemaApi,
  programaGestionApi,
  actividadProgramaApi,
  seguimientoCronogramaApi,
} from '../api/planificacionApi';
import type {
  PlanTrabajoAnual,
  ActividadPlan,
  ObjetivoSistema,
  ProgramaGestion,
  ActividadPrograma,
  SeguimientoCronograma,
  CreatePlanTrabajoAnualDTO,
  UpdatePlanTrabajoAnualDTO,
  CreateActividadPlanDTO,
  UpdateActividadPlanDTO,
  CreateObjetivoSistemaDTO,
  UpdateObjetivoSistemaDTO,
  CreateProgramaGestionDTO,
  UpdateProgramaGestionDTO,
  CreateActividadProgramaDTO,
  UpdateActividadProgramaDTO,
  CreateSeguimientoCronogramaDTO,
  UpdateSeguimientoCronogramaDTO,
} from '../types/planificacion-sistema.types';

// ==================== PLAN TRABAJO ANUAL ====================

/**
 * Hook para obtener todos los planes de trabajo
 */
export function usePlanesTrabajoQuery(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  periodo?: number;
  estado?: string;
  responsable?: number;
}) {
  return useQuery({
    queryKey: ['planes-trabajo', params],
    queryFn: () => planTrabajoApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un plan de trabajo por ID
 */
export function usePlanTrabajoQuery(id: number | null | undefined) {
  return useQuery({
    queryKey: ['plan-trabajo', id],
    queryFn: () => planTrabajoApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener estadísticas de un plan
 */
export function usePlanTrabajoEstadisticasQuery(id: number | null | undefined) {
  return useQuery({
    queryKey: ['plan-trabajo-estadisticas', id],
    queryFn: () => planTrabajoApi.getEstadisticas(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear un plan de trabajo
 */
export function useCreatePlanTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanTrabajoAnualDTO) => planTrabajoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-trabajo'] });
      toast.success('Plan de trabajo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear el plan de trabajo');
    },
  });
}

/**
 * Hook para actualizar un plan de trabajo
 */
export function useUpdatePlanTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanTrabajoAnualDTO }) =>
      planTrabajoApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planes-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', variables.id] });
      toast.success('Plan de trabajo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el plan de trabajo');
    },
  });
}

/**
 * Hook para aprobar un plan de trabajo
 */
export function useAprobarPlanTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => planTrabajoApi.aprobar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['planes-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', id] });
      toast.success('Plan de trabajo aprobado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al aprobar el plan de trabajo');
    },
  });
}

/**
 * Hook para cambiar estado de un plan de trabajo
 */
export function useCambiarEstadoPlanTrabajo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: number;
      estado: 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'EN_EJECUCION' | 'CERRADO' | 'CANCELADO';
    }) => planTrabajoApi.cambiarEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planes-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', variables.id] });
      toast.success('Estado del plan actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar estado del plan');
    },
  });
}

// ==================== ACTIVIDAD PLAN ====================

/**
 * Hook para obtener actividades del plan
 */
export function useActividadesPlanQuery(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  plan_trabajo?: number;
  tipo_actividad?: string;
  estado?: string;
  responsable?: number;
}) {
  return useQuery({
    queryKey: ['actividades-plan', params],
    queryFn: () => actividadPlanApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener actividades de un plan específico
 */
export function useActividadesPorPlanQuery(planId: number | null | undefined) {
  return useQuery({
    queryKey: ['actividades-plan', 'por-plan', planId],
    queryFn: () => actividadPlanApi.porPlan(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook para crear una actividad del plan
 */
export function useCreateActividadPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActividadPlanDTO) => actividadPlanApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actividades-plan'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', data.plan_trabajo] });
      toast.success('Actividad creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la actividad');
    },
  });
}

/**
 * Hook para actualizar avance de una actividad
 */
export function useActualizarAvanceActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, porcentaje, observaciones }: { id: number; porcentaje: number; observaciones?: string }) =>
      actividadPlanApi.actualizarAvance(id, porcentaje, observaciones),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actividades-plan'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', data.plan_trabajo] });
      toast.success('Avance actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el avance');
    },
  });
}

// ==================== OBJETIVO SISTEMA ====================

/**
 * Hook para obtener objetivos del sistema
 */
export function useObjetivosSistemaQuery(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  plan_trabajo?: number;
  perspectiva_bsc?: string;
  tipo_objetivo?: string;
  area_aplicacion?: string;
  estado?: string;
}) {
  return useQuery({
    queryKey: ['objetivos-sistema', params],
    queryFn: () => objetivoSistemaApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener objetivos por perspectiva BSC
 */
export function useObjetivosPorPerspectivaQuery(
  planId: number | null | undefined,
  perspectiva: 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE'
) {
  return useQuery({
    queryKey: ['objetivos-sistema', 'perspectiva', planId, perspectiva],
    queryFn: () => objetivoSistemaApi.porPerspectiva(planId!, perspectiva),
    enabled: !!planId,
  });
}

/**
 * Hook para actualizar cumplimiento de un objetivo
 */
export function useActualizarCumplimientoObjetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, valor_actual, porcentaje }: { id: number; valor_actual: number; porcentaje: number }) =>
      objetivoSistemaApi.actualizarCumplimiento(id, valor_actual, porcentaje),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objetivos-sistema'] });
      toast.success('Cumplimiento actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el cumplimiento');
    },
  });
}

// ==================== PROGRAMA GESTION ====================

/**
 * Hook para obtener programas de gestión
 */
export function useProgramasGestionQuery(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  plan_trabajo?: number;
  tipo_programa?: string;
  estado?: string;
}) {
  return useQuery({
    queryKey: ['programas-gestion', params],
    queryFn: () => programaGestionApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener programas de un plan específico
 */
export function useProgramasPorPlanQuery(planId: number | null | undefined) {
  return useQuery({
    queryKey: ['programas-gestion', 'por-plan', planId],
    queryFn: () => programaGestionApi.porPlan(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook para actualizar avance de un programa
 */
export function useActualizarAvancePrograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, porcentaje }: { id: number; porcentaje: number }) =>
      programaGestionApi.actualizarAvance(id, porcentaje),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-gestion'] });
      toast.success('Avance del programa actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el avance del programa');
    },
  });
}

// ==================== ACTIVIDAD PROGRAMA ====================

/**
 * Hook para obtener actividades de programas
 */
export function useActividadesProgramaQuery(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  programa?: number;
  estado?: string;
}) {
  return useQuery({
    queryKey: ['actividades-programa', params],
    queryFn: () => actividadProgramaApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener actividades de un programa específico
 */
export function useActividadesPorProgramaQuery(programaId: number | null | undefined) {
  return useQuery({
    queryKey: ['actividades-programa', 'por-programa', programaId],
    queryFn: () => actividadProgramaApi.porPrograma(programaId!),
    enabled: !!programaId,
  });
}

/**
 * Hook para ejecutar una actividad de programa
 */
export function useEjecutarActividadPrograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resultado, evidencias }: { id: number; resultado: string; evidencias?: string }) =>
      actividadProgramaApi.ejecutar(id, resultado, evidencias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades-programa'] });
      toast.success('Actividad ejecutada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al ejecutar la actividad');
    },
  });
}

/**
 * Hook para cancelar una actividad de programa
 */
export function useCancelarActividadPrograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => actividadProgramaApi.cancelar(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades-programa'] });
      toast.success('Actividad cancelada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar la actividad');
    },
  });
}

// ==================== SEGUIMIENTO CRONOGRAMA ====================

/**
 * Hook para obtener seguimientos de cronograma
 */
export function useSeguimientosCronogramaQuery(params?: {
  page?: number;
  page_size?: number;
  plan_trabajo?: number;
  periodo?: string;
}) {
  return useQuery({
    queryKey: ['seguimientos-cronograma', params],
    queryFn: () => seguimientoCronogramaApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener seguimientos de un plan específico
 */
export function useSeguimientosPorPlanQuery(planId: number | null | undefined) {
  return useQuery({
    queryKey: ['seguimientos-cronograma', 'por-plan', planId],
    queryFn: () => seguimientoCronogramaApi.porPlan(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook para crear un seguimiento de cronograma
 */
export function useCreateSeguimientoCronograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSeguimientoCronogramaDTO) => seguimientoCronogramaApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seguimientos-cronograma'] });
      queryClient.invalidateQueries({ queryKey: ['plan-trabajo', data.plan_trabajo] });
      toast.success('Seguimiento registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar el seguimiento');
    },
  });
}

/**
 * Hook para generar reporte de seguimiento
 */
export function useGenerarReporteSeguimiento() {
  return useMutation({
    mutationFn: ({ planId, formato }: { planId: number; formato: 'pdf' | 'excel' | 'json' }) =>
      seguimientoCronogramaApi.generarReporte(planId, formato),
    onSuccess: (data, variables) => {
      if (variables.formato !== 'json') {
        // Descargar archivo
        const blob = data as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-seguimiento-${Date.now()}.${variables.formato}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      toast.success('Reporte generado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar el reporte');
    },
  });
}
