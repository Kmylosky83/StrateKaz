/**
 * Hooks React Query para Módulo de Mejora Continua - HSEQ Management
 * Sistema de gestión de auditorías, hallazgos y evaluación de cumplimiento
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import mejoraContinuaApi from '../api/mejoraContinuaApi';
import type {
  ProgramaAuditoria,
  Auditoria,
  Hallazgo,
  EvaluacionCumplimiento,
  CreateProgramaAuditoriaDTO,
  UpdateProgramaAuditoriaDTO,
  CreateAuditoriaDTO,
  UpdateAuditoriaDTO,
  CreateHallazgoDTO,
  UpdateHallazgoDTO,
  CreateEvaluacionCumplimientoDTO,
  UpdateEvaluacionCumplimientoDTO,
} from '../types/mejora-continua.types';

// ==================== QUERY KEYS ====================

export const mejoraContinuaKeys = {
  all: ['hseq', 'mejora-continua'] as const,

  // Programas de Auditoría
  programas: () => [...mejoraContinuaKeys.all, 'programas-auditoria'] as const,
  programaById: (id: number) => [...mejoraContinuaKeys.programas(), id] as const,
  programasFiltered: (filters: Record<string, any>) => [...mejoraContinuaKeys.programas(), 'filtered', filters] as const,

  // Auditorías
  auditorias: () => [...mejoraContinuaKeys.all, 'auditorias'] as const,
  auditoriaById: (id: number) => [...mejoraContinuaKeys.auditorias(), id] as const,
  auditoriasFiltered: (filters: Record<string, any>) => [...mejoraContinuaKeys.auditorias(), 'filtered', filters] as const,

  // Hallazgos
  hallazgos: () => [...mejoraContinuaKeys.all, 'hallazgos'] as const,
  hallazgoById: (id: number) => [...mejoraContinuaKeys.hallazgos(), id] as const,
  hallazgosFiltered: (filters: Record<string, any>) => [...mejoraContinuaKeys.hallazgos(), 'filtered', filters] as const,

  // Evaluaciones de Cumplimiento
  evaluaciones: () => [...mejoraContinuaKeys.all, 'evaluaciones-cumplimiento'] as const,
  evaluacionById: (id: number) => [...mejoraContinuaKeys.evaluaciones(), id] as const,
  evaluacionesFiltered: (filters: Record<string, any>) => [...mejoraContinuaKeys.evaluaciones(), 'filtered', filters] as const,
  evaluacionesPorVencer: () => [...mejoraContinuaKeys.evaluaciones(), 'por-vencer'] as const,
};

// ==================== PROGRAMA DE AUDITORÍA ====================

export function useProgramasAuditoria(params?: any) {
  return useQuery({
    queryKey: params ? mejoraContinuaKeys.programasFiltered(params) : mejoraContinuaKeys.programas(),
    queryFn: async () => {
      const data = await mejoraContinuaApi.programaAuditoria.getAll(params);
      return data;
    },
  });
}

export function useProgramaAuditoriaById(id: number) {
  return useQuery({
    queryKey: mejoraContinuaKeys.programaById(id),
    queryFn: async () => {
      const data = await mejoraContinuaApi.programaAuditoria.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateProgramaAuditoriaDTO) => {
      const data = await mejoraContinuaApi.programaAuditoria.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      toast.success('Programa de auditoría creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear programa de auditoría');
    },
  });
}

export function useUpdateProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateProgramaAuditoriaDTO }) => {
      const data = await mejoraContinuaApi.programaAuditoria.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programaById(id) });
      toast.success('Programa de auditoría actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar programa de auditoría');
    },
  });
}

export function useDeleteProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await mejoraContinuaApi.programaAuditoria.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      toast.success('Programa de auditoría eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar programa de auditoría');
    },
  });
}

export function useAprobarProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.programaAuditoria.aprobar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programaById(id) });
      toast.success('Programa de auditoría aprobado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al aprobar programa de auditoría');
    },
  });
}

export function useIniciarProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.programaAuditoria.iniciar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programaById(id) });
      toast.success('Programa de auditoría iniciado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al iniciar programa de auditoría');
    },
  });
}

export function useCompletarProgramaAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.programaAuditoria.completar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programaById(id) });
      toast.success('Programa de auditoría completado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al completar programa de auditoría');
    },
  });
}

// ==================== AUDITORÍA ====================

export function useAuditorias(params?: any) {
  return useQuery({
    queryKey: params ? mejoraContinuaKeys.auditoriasFiltered(params) : mejoraContinuaKeys.auditorias(),
    queryFn: async () => {
      const data = await mejoraContinuaApi.auditoria.getAll(params);
      return data;
    },
  });
}

export function useAuditoriaById(id: number) {
  return useQuery({
    queryKey: mejoraContinuaKeys.auditoriaById(id),
    queryFn: async () => {
      const data = await mejoraContinuaApi.auditoria.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateAuditoriaDTO) => {
      const data = await mejoraContinuaApi.auditoria.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.programas() });
      toast.success('Auditoría creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear auditoría');
    },
  });
}

export function useUpdateAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateAuditoriaDTO }) => {
      const data = await mejoraContinuaApi.auditoria.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditoriaById(id) });
      toast.success('Auditoría actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar auditoría');
    },
  });
}

export function useDeleteAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await mejoraContinuaApi.auditoria.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      toast.success('Auditoría eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar auditoría');
    },
  });
}

export function useIniciarAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.auditoria.iniciar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditoriaById(id) });
      toast.success('Auditoría iniciada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al iniciar auditoría');
    },
  });
}

export function useCerrarAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.auditoria.cerrar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditoriaById(id) });
      toast.success('Auditoría cerrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar auditoría');
    },
  });
}

export function useUploadPlanAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const data = await mejoraContinuaApi.auditoria.uploadPlan(id, file);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditoriaById(id) });
      toast.success('Plan de auditoría cargado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cargar plan de auditoría');
    },
  });
}

export function useUploadInformeAuditoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const data = await mejoraContinuaApi.auditoria.uploadInforme(id, file);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditoriaById(id) });
      toast.success('Informe de auditoría cargado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cargar informe de auditoría');
    },
  });
}

// ==================== HALLAZGO ====================

export function useHallazgos(params?: any) {
  return useQuery({
    queryKey: params ? mejoraContinuaKeys.hallazgosFiltered(params) : mejoraContinuaKeys.hallazgos(),
    queryFn: async () => {
      const data = await mejoraContinuaApi.hallazgo.getAll(params);
      return data;
    },
  });
}

export function useHallazgoById(id: number) {
  return useQuery({
    queryKey: mejoraContinuaKeys.hallazgoById(id),
    queryFn: async () => {
      const data = await mejoraContinuaApi.hallazgo.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateHallazgoDTO) => {
      const data = await mejoraContinuaApi.hallazgo.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.auditorias() });
      toast.success('Hallazgo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear hallazgo');
    },
  });
}

export function useUpdateHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateHallazgoDTO }) => {
      const data = await mejoraContinuaApi.hallazgo.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Hallazgo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar hallazgo');
    },
  });
}

export function useDeleteHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await mejoraContinuaApi.hallazgo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      toast.success('Hallazgo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar hallazgo');
    },
  });
}

export function useComunicarHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.hallazgo.comunicar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Hallazgo comunicado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al comunicar hallazgo');
    },
  });
}

export function useIniciarTratamientoHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.hallazgo.iniciarTratamiento(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Tratamiento de hallazgo iniciado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al iniciar tratamiento');
    },
  });
}

export function useVerificarHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: { es_eficaz: boolean; observaciones?: string } }) => {
      const data = await mejoraContinuaApi.hallazgo.verificar(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Hallazgo verificado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al verificar hallazgo');
    },
  });
}

export function useCerrarHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.hallazgo.cerrar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Hallazgo cerrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar hallazgo');
    },
  });
}

export function useUploadEvidenciaHallazgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const data = await mejoraContinuaApi.hallazgo.uploadEvidencia(id, file);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgos() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.hallazgoById(id) });
      toast.success('Evidencia cargada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cargar evidencia');
    },
  });
}

// ==================== EVALUACIÓN DE CUMPLIMIENTO ====================

export function useEvaluacionesCumplimiento(params?: any) {
  return useQuery({
    queryKey: params ? mejoraContinuaKeys.evaluacionesFiltered(params) : mejoraContinuaKeys.evaluaciones(),
    queryFn: async () => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.getAll(params);
      return data;
    },
  });
}

export function useEvaluacionCumplimientoById(id: number) {
  return useQuery({
    queryKey: mejoraContinuaKeys.evaluacionById(id),
    queryFn: async () => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEvaluacionCumplimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateEvaluacionCumplimientoDTO) => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluaciones() });
      toast.success('Evaluación de cumplimiento creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear evaluación de cumplimiento');
    },
  });
}

export function useUpdateEvaluacionCumplimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateEvaluacionCumplimientoDTO }) => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluacionById(id) });
      toast.success('Evaluación de cumplimiento actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar evaluación de cumplimiento');
    },
  });
}

export function useDeleteEvaluacionCumplimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await mejoraContinuaApi.evaluacionCumplimiento.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluaciones() });
      toast.success('Evaluación de cumplimiento eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar evaluación de cumplimiento');
    },
  });
}

export function useCalcularProximaEvaluacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.calcularProximaEvaluacion(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluaciones() });
      queryClient.invalidateQueries({ queryKey: mejoraContinuaKeys.evaluacionById(id) });
      toast.success('Próxima evaluación calculada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al calcular próxima evaluación');
    },
  });
}

export function useEvaluacionesPorVencer() {
  return useQuery({
    queryKey: mejoraContinuaKeys.evaluacionesPorVencer(),
    queryFn: async () => {
      const data = await mejoraContinuaApi.evaluacionCumplimiento.porVencer();
      return data;
    },
  });
}
