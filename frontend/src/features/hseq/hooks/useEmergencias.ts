/**
 * Hooks React Query para Módulo de Emergencias - HSEQ Management
 * Sistema de gestión integral de emergencias
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import emergenciasApi from '../api/emergenciasApi';

/** Extrae el mensaje de error de un AxiosError o Error genérico */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as Record<string, unknown> | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
import type {
  CreateAnalisisVulnerabilidadDTO,
  UpdateAnalisisVulnerabilidadDTO,
  CreateAmenazaDTO,
  UpdateAmenazaDTO,
  CreatePlanEmergenciaDTO,
  UpdatePlanEmergenciaDTO,
  CreateProcedimientoEmergenciaDTO,
  UpdateProcedimientoEmergenciaDTO,
  CreatePlanoEvacuacionDTO,
  UpdatePlanoEvacuacionDTO,
  CreateTipoBrigadaDTO,
  UpdateTipoBrigadaDTO,
  CreateBrigadaDTO,
  UpdateBrigadaDTO,
  CreateBrigadistaActivoDTO,
  UpdateBrigadistaActivoDTO,
  CreateSimulacroDTO,
  UpdateSimulacroDTO,
  CreateRecursoEmergenciaDTO,
  UpdateRecursoEmergenciaDTO,
  CreateInspeccionRecursoDTO,
  UpdateInspeccionRecursoDTO,
} from '../types/emergencias.types';

// ==================== QUERY KEYS ====================

export const emergenciasKeys = {
  all: ['hseq', 'emergencias'] as const,

  // Análisis de Vulnerabilidad
  analisisVulnerabilidad: () => [...emergenciasKeys.all, 'analisis-vulnerabilidad'] as const,
  analisisVulnerabilidadById: (id: number) =>
    [...emergenciasKeys.analisisVulnerabilidad(), id] as const,
  analisisVulnerabilidadFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.analisisVulnerabilidad(), 'filtered', filters] as const,

  // Amenazas
  amenazas: () => [...emergenciasKeys.all, 'amenazas'] as const,
  amenazaById: (id: number) => [...emergenciasKeys.amenazas(), id] as const,
  amenazasFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.amenazas(), 'filtered', filters] as const,

  // Planes de Emergencia
  planes: () => [...emergenciasKeys.all, 'planes-emergencia'] as const,
  planById: (id: number) => [...emergenciasKeys.planes(), id] as const,
  planesFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.planes(), 'filtered', filters] as const,

  // Procedimientos
  procedimientos: () => [...emergenciasKeys.all, 'procedimientos'] as const,
  procedimientoById: (id: number) => [...emergenciasKeys.procedimientos(), id] as const,
  procedimientosFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.procedimientos(), 'filtered', filters] as const,

  // Planos de Evacuación
  planos: () => [...emergenciasKeys.all, 'planos-evacuacion'] as const,
  planoById: (id: number) => [...emergenciasKeys.planos(), id] as const,
  planosFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.planos(), 'filtered', filters] as const,

  // Tipos de Brigada
  tiposBrigada: () => [...emergenciasKeys.all, 'tipos-brigada'] as const,
  tipoBrigadaById: (id: number) => [...emergenciasKeys.tiposBrigada(), id] as const,

  // Brigadas
  brigadas: () => [...emergenciasKeys.all, 'brigadas'] as const,
  brigadaById: (id: number) => [...emergenciasKeys.brigadas(), id] as const,
  brigadasFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.brigadas(), 'filtered', filters] as const,

  // Brigadistas
  brigadistas: () => [...emergenciasKeys.all, 'brigadistas'] as const,
  brigadistaById: (id: number) => [...emergenciasKeys.brigadistas(), id] as const,
  brigadistasFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.brigadistas(), 'filtered', filters] as const,

  // Simulacros
  simulacros: () => [...emergenciasKeys.all, 'simulacros'] as const,
  simulacroById: (id: number) => [...emergenciasKeys.simulacros(), id] as const,
  simulacrosFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.simulacros(), 'filtered', filters] as const,

  // Evaluaciones
  evaluaciones: () => [...emergenciasKeys.all, 'evaluaciones'] as const,
  evaluacionById: (id: number) => [...emergenciasKeys.evaluaciones(), id] as const,

  // Recursos
  recursos: () => [...emergenciasKeys.all, 'recursos'] as const,
  recursoById: (id: number) => [...emergenciasKeys.recursos(), id] as const,
  recursosFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.recursos(), 'filtered', filters] as const,
  recursosRequierenInspeccion: () =>
    [...emergenciasKeys.recursos(), 'requieren-inspeccion'] as const,
  recursosPorVencer: () => [...emergenciasKeys.recursos(), 'por-vencer'] as const,

  // Inspecciones
  inspecciones: () => [...emergenciasKeys.all, 'inspecciones'] as const,
  inspeccionById: (id: number) => [...emergenciasKeys.inspecciones(), id] as const,
  inspeccionesFiltered: (filters: Record<string, unknown>) =>
    [...emergenciasKeys.inspecciones(), 'filtered', filters] as const,
};

// ==================== ANÁLISIS DE VULNERABILIDAD ====================

export function useAnalisisVulnerabilidad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? emergenciasKeys.analisisVulnerabilidadFiltered(params)
      : emergenciasKeys.analisisVulnerabilidad(),
    queryFn: async () => {
      const data = await emergenciasApi.analisisVulnerabilidad.getAll(params);
      return data;
    },
  });
}

export function useAnalisisVulnerabilidadById(id: number) {
  return useQuery({
    queryKey: emergenciasKeys.analisisVulnerabilidadById(id),
    queryFn: async () => {
      const data = await emergenciasApi.analisisVulnerabilidad.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAnalisisVulnerabilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateAnalisisVulnerabilidadDTO) => {
      const data = await emergenciasApi.analisisVulnerabilidad.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidad() });
      toast.success('Análisis de vulnerabilidad creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear análisis de vulnerabilidad'));
    },
  });
}

export function useUpdateAnalisisVulnerabilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateAnalisisVulnerabilidadDTO }) => {
      const data = await emergenciasApi.analisisVulnerabilidad.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidad() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidadById(id) });
      toast.success('Análisis de vulnerabilidad actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar análisis de vulnerabilidad'));
    },
  });
}

export function useDeleteAnalisisVulnerabilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.analisisVulnerabilidad.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidad() });
      toast.success('Análisis de vulnerabilidad eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar análisis de vulnerabilidad'));
    },
  });
}

export function useAprobarAnalisisVulnerabilidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await emergenciasApi.analisisVulnerabilidad.aprobar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidad() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidadById(id) });
      toast.success('Análisis aprobado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al aprobar análisis'));
    },
  });
}

// ==================== AMENAZAS ====================

export function useAmenazas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.amenazasFiltered(params) : emergenciasKeys.amenazas(),
    queryFn: async () => {
      const data = await emergenciasApi.amenaza.getAll(params);
      return data;
    },
  });
}

export function useCreateAmenaza() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateAmenazaDTO) => {
      const data = await emergenciasApi.amenaza.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.amenazas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.analisisVulnerabilidad() });
      toast.success('Amenaza creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear amenaza'));
    },
  });
}

export function useUpdateAmenaza() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateAmenazaDTO }) => {
      const data = await emergenciasApi.amenaza.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.amenazas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.amenazaById(id) });
      toast.success('Amenaza actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar amenaza'));
    },
  });
}

export function useDeleteAmenaza() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.amenaza.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.amenazas() });
      toast.success('Amenaza eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar amenaza'));
    },
  });
}

// ==================== PLANES DE EMERGENCIA ====================

export function usePlanesEmergencia(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.planesFiltered(params) : emergenciasKeys.planes(),
    queryFn: async () => {
      const data = await emergenciasApi.planEmergencia.getAll(params);
      return data;
    },
  });
}

export function usePlanEmergenciaById(id: number) {
  return useQuery({
    queryKey: emergenciasKeys.planById(id),
    queryFn: async () => {
      const data = await emergenciasApi.planEmergencia.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePlanEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreatePlanEmergenciaDTO) => {
      const data = await emergenciasApi.planEmergencia.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planes() });
      toast.success('Plan de emergencia creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear plan de emergencia'));
    },
  });
}

export function useUpdatePlanEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdatePlanEmergenciaDTO }) => {
      const data = await emergenciasApi.planEmergencia.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planes() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planById(id) });
      toast.success('Plan de emergencia actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar plan de emergencia'));
    },
  });
}

export function useDeletePlanEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.planEmergencia.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planes() });
      toast.success('Plan de emergencia eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar plan de emergencia'));
    },
  });
}

export function useAprobarPlanEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await emergenciasApi.planEmergencia.aprobar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planes() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planById(id) });
      toast.success('Plan de emergencia aprobado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al aprobar plan de emergencia'));
    },
  });
}

export function useActivarPlanEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await emergenciasApi.planEmergencia.activar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planes() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planById(id) });
      toast.success('Plan de emergencia activado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al activar plan de emergencia'));
    },
  });
}

// ==================== PROCEDIMIENTOS ====================

export function useProcedimientos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? emergenciasKeys.procedimientosFiltered(params)
      : emergenciasKeys.procedimientos(),
    queryFn: async () => {
      const data = await emergenciasApi.procedimientoEmergencia.getAll(params);
      return data;
    },
  });
}

export function useCreateProcedimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateProcedimientoEmergenciaDTO) => {
      const data = await emergenciasApi.procedimientoEmergencia.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.procedimientos() });
      toast.success('Procedimiento creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear procedimiento'));
    },
  });
}

export function useUpdateProcedimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateProcedimientoEmergenciaDTO }) => {
      const data = await emergenciasApi.procedimientoEmergencia.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.procedimientos() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.procedimientoById(id) });
      toast.success('Procedimiento actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar procedimiento'));
    },
  });
}

export function useDeleteProcedimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.procedimientoEmergencia.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.procedimientos() });
      toast.success('Procedimiento eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar procedimiento'));
    },
  });
}

// ==================== PLANOS DE EVACUACIÓN ====================

export function usePlanosEvacuacion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.planosFiltered(params) : emergenciasKeys.planos(),
    queryFn: async () => {
      const data = await emergenciasApi.planoEvacuacion.getAll(params);
      return data;
    },
  });
}

export function useCreatePlanoEvacuacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreatePlanoEvacuacionDTO) => {
      const data = await emergenciasApi.planoEvacuacion.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planos() });
      toast.success('Plano de evacuación creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear plano de evacuación'));
    },
  });
}

export function useUpdatePlanoEvacuacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdatePlanoEvacuacionDTO }) => {
      const data = await emergenciasApi.planoEvacuacion.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planos() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planoById(id) });
      toast.success('Plano de evacuación actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar plano de evacuación'));
    },
  });
}

export function useDeletePlanoEvacuacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.planoEvacuacion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planos() });
      toast.success('Plano de evacuación eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar plano de evacuación'));
    },
  });
}

export function usePublicarPlanoEvacuacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await emergenciasApi.planoEvacuacion.publicar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planos() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.planoById(id) });
      toast.success('Plano de evacuación publicado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al publicar plano de evacuación'));
    },
  });
}

// ==================== TIPOS DE BRIGADA ====================

export function useTiposBrigada(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: emergenciasKeys.tiposBrigada(),
    queryFn: async () => {
      const data = await emergenciasApi.tipoBrigada.getAll(params);
      return data;
    },
  });
}

export function useCreateTipoBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateTipoBrigadaDTO) => {
      const data = await emergenciasApi.tipoBrigada.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.tiposBrigada() });
      toast.success('Tipo de brigada creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear tipo de brigada'));
    },
  });
}

export function useUpdateTipoBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateTipoBrigadaDTO }) => {
      const data = await emergenciasApi.tipoBrigada.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.tiposBrigada() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.tipoBrigadaById(id) });
      toast.success('Tipo de brigada actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar tipo de brigada'));
    },
  });
}

export function useDeleteTipoBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.tipoBrigada.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.tiposBrigada() });
      toast.success('Tipo de brigada eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar tipo de brigada'));
    },
  });
}

// ==================== BRIGADAS ====================

export function useBrigadas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.brigadasFiltered(params) : emergenciasKeys.brigadas(),
    queryFn: async () => {
      const data = await emergenciasApi.brigada.getAll(params);
      return data;
    },
  });
}

export function useBrigadaById(id: number) {
  return useQuery({
    queryKey: emergenciasKeys.brigadaById(id),
    queryFn: async () => {
      const data = await emergenciasApi.brigada.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateBrigadaDTO) => {
      const data = await emergenciasApi.brigada.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigada creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear brigada'));
    },
  });
}

export function useUpdateBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateBrigadaDTO }) => {
      const data = await emergenciasApi.brigada.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadaById(id) });
      toast.success('Brigada actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar brigada'));
    },
  });
}

export function useDeleteBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.brigada.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigada eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar brigada'));
    },
  });
}

export function useActivarBrigada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await emergenciasApi.brigada.activar(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadaById(id) });
      toast.success('Brigada activada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al activar brigada'));
    },
  });
}

// ==================== BRIGADISTAS ====================

export function useBrigadistas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.brigadistasFiltered(params) : emergenciasKeys.brigadistas(),
    queryFn: async () => {
      const data = await emergenciasApi.brigadistaActivo.getAll(params);
      return data;
    },
  });
}

export function useCreateBrigadista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateBrigadistaActivoDTO) => {
      const data = await emergenciasApi.brigadistaActivo.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigadista creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear brigadista'));
    },
  });
}

export function useUpdateBrigadista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateBrigadistaActivoDTO }) => {
      const data = await emergenciasApi.brigadistaActivo.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistaById(id) });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigadista actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar brigadista'));
    },
  });
}

export function useDeleteBrigadista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.brigadistaActivo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigadista eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar brigadista'));
    },
  });
}

export function useInactivarBrigadista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const data = await emergenciasApi.brigadistaActivo.inactivar(id, motivo);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistas() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadistaById(id) });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.brigadas() });
      toast.success('Brigadista inactivado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al inactivar brigadista'));
    },
  });
}

// ==================== SIMULACROS ====================

export function useSimulacros(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.simulacrosFiltered(params) : emergenciasKeys.simulacros(),
    queryFn: async () => {
      const data = await emergenciasApi.simulacro.getAll(params);
      return data;
    },
  });
}

export function useSimulacroById(id: number) {
  return useQuery({
    queryKey: emergenciasKeys.simulacroById(id),
    queryFn: async () => {
      const data = await emergenciasApi.simulacro.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSimulacro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateSimulacroDTO) => {
      const data = await emergenciasApi.simulacro.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacros() });
      toast.success('Simulacro creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear simulacro'));
    },
  });
}

export function useUpdateSimulacro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateSimulacroDTO }) => {
      const data = await emergenciasApi.simulacro.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacros() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacroById(id) });
      toast.success('Simulacro actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar simulacro'));
    },
  });
}

export function useDeleteSimulacro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.simulacro.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacros() });
      toast.success('Simulacro eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar simulacro'));
    },
  });
}

export function useMarcarSimulacroRealizado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: number;
      datos: {
        duracion_real?: number;
        numero_participantes_reales?: number;
        observaciones?: string;
        fue_exitoso?: boolean;
      };
    }) => {
      const data = await emergenciasApi.simulacro.marcarRealizado(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacros() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.simulacroById(id) });
      toast.success('Simulacro marcado como realizado');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al marcar simulacro como realizado'));
    },
  });
}

// ==================== RECURSOS DE EMERGENCIA ====================

export function useRecursosEmergencia(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? emergenciasKeys.recursosFiltered(params) : emergenciasKeys.recursos(),
    queryFn: async () => {
      const data = await emergenciasApi.recursoEmergencia.getAll(params);
      return data;
    },
  });
}

export function useRecursosRequierenInspeccion() {
  return useQuery({
    queryKey: emergenciasKeys.recursosRequierenInspeccion(),
    queryFn: async () => {
      const data = await emergenciasApi.recursoEmergencia.requierenInspeccion();
      return data;
    },
  });
}

export function useRecursosPorVencer() {
  return useQuery({
    queryKey: emergenciasKeys.recursosPorVencer(),
    queryFn: async () => {
      const data = await emergenciasApi.recursoEmergencia.porVencer();
      return data;
    },
  });
}

export function useCreateRecursoEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateRecursoEmergenciaDTO) => {
      const data = await emergenciasApi.recursoEmergencia.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursos() });
      toast.success('Recurso de emergencia creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear recurso de emergencia'));
    },
  });
}

export function useUpdateRecursoEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateRecursoEmergenciaDTO }) => {
      const data = await emergenciasApi.recursoEmergencia.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursos() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursoById(id) });
      toast.success('Recurso de emergencia actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar recurso de emergencia'));
    },
  });
}

export function useDeleteRecursoEmergencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.recursoEmergencia.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursos() });
      toast.success('Recurso de emergencia eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar recurso de emergencia'));
    },
  });
}

// ==================== INSPECCIONES ====================

export function useInspeccionesRecurso(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? emergenciasKeys.inspeccionesFiltered(params)
      : emergenciasKeys.inspecciones(),
    queryFn: async () => {
      const data = await emergenciasApi.inspeccionRecurso.getAll(params);
      return data;
    },
  });
}

export function useCreateInspeccionRecurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateInspeccionRecursoDTO) => {
      const data = await emergenciasApi.inspeccionRecurso.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursos() });
      toast.success('Inspección registrada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al registrar inspección'));
    },
  });
}

export function useUpdateInspeccionRecurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateInspeccionRecursoDTO }) => {
      const data = await emergenciasApi.inspeccionRecurso.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.inspecciones() });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.inspeccionById(id) });
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.recursos() });
      toast.success('Inspección actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar inspección'));
    },
  });
}

export function useDeleteInspeccionRecurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await emergenciasApi.inspeccionRecurso.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergenciasKeys.inspecciones() });
      toast.success('Inspección eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar inspección'));
    },
  });
}
