/**
 * Hooks React Query para Módulo de Higiene Industrial - HSEQ Management
 * Sistema de gestión de mediciones ambientales, controles de exposición y monitoreo biológico
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import higieneIndustrialApi from '../api/higieneIndustrialApi';

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
  CreateTipoAgenteDTO,
  UpdateTipoAgenteDTO,
  CreateAgenteRiesgoDTO,
  UpdateAgenteRiesgoDTO,
  CreateGrupoExposicionSimilarDTO,
  UpdateGrupoExposicionSimilarDTO,
  CreatePuntoMedicionDTO,
  UpdatePuntoMedicionDTO,
  CreateMedicionAmbientalDTO,
  UpdateMedicionAmbientalDTO,
  CreateControlExposicionDTO,
  UpdateControlExposicionDTO,
  CreateMonitoreoBiologicoDTO,
  UpdateMonitoreoBiologicoDTO,
} from '../types/higiene-industrial.types';

// ==================== QUERY KEYS ====================

export const higieneIndustrialKeys = {
  all: ['hseq', 'higiene-industrial'] as const,

  // Tipos de Agente
  tiposAgente: () => [...higieneIndustrialKeys.all, 'tipos-agente'] as const,
  tipoAgenteById: (id: number) => [...higieneIndustrialKeys.tiposAgente(), id] as const,
  tiposAgenteFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.tiposAgente(), 'filtered', filters] as const,

  // Agentes de Riesgo
  agentesRiesgo: () => [...higieneIndustrialKeys.all, 'agentes-riesgo'] as const,
  agenteRiesgoById: (id: number) => [...higieneIndustrialKeys.agentesRiesgo(), id] as const,
  agentesRiesgoFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.agentesRiesgo(), 'filtered', filters] as const,

  // Grupos de Exposición
  gruposExposicion: () => [...higieneIndustrialKeys.all, 'grupos-exposicion'] as const,
  grupoExposicionById: (id: number) => [...higieneIndustrialKeys.gruposExposicion(), id] as const,
  gruposExposicionFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.gruposExposicion(), 'filtered', filters] as const,

  // Puntos de Medición
  puntosMedicion: () => [...higieneIndustrialKeys.all, 'puntos-medicion'] as const,
  puntoMedicionById: (id: number) => [...higieneIndustrialKeys.puntosMedicion(), id] as const,
  puntosMedicionFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.puntosMedicion(), 'filtered', filters] as const,

  // Mediciones Ambientales
  medicionesAmbientales: () => [...higieneIndustrialKeys.all, 'mediciones-ambientales'] as const,
  medicionAmbientalById: (id: number) =>
    [...higieneIndustrialKeys.medicionesAmbientales(), id] as const,
  medicionesAmbientalesFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.medicionesAmbientales(), 'filtered', filters] as const,
  medicionesEstadisticas: () =>
    [...higieneIndustrialKeys.medicionesAmbientales(), 'estadisticas'] as const,
  proximasMediciones: () => [...higieneIndustrialKeys.medicionesAmbientales(), 'proximas'] as const,

  // Controles de Exposición
  controlesExposicion: () => [...higieneIndustrialKeys.all, 'controles-exposicion'] as const,
  controlExposicionById: (id: number) =>
    [...higieneIndustrialKeys.controlesExposicion(), id] as const,
  controlesExposicionFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.controlesExposicion(), 'filtered', filters] as const,
  controlesEstadisticas: () =>
    [...higieneIndustrialKeys.controlesExposicion(), 'estadisticas'] as const,
  controlesPorJerarquia: () =>
    [...higieneIndustrialKeys.controlesExposicion(), 'por-jerarquia'] as const,

  // Monitoreo Biológico
  monitoreoBiologico: () => [...higieneIndustrialKeys.all, 'monitoreo-biologico'] as const,
  monitoreoBiologicoById: (id: number) =>
    [...higieneIndustrialKeys.monitoreoBiologico(), id] as const,
  monitoreoBiologicoFiltered: (filters: Record<string, unknown>) =>
    [...higieneIndustrialKeys.monitoreoBiologico(), 'filtered', filters] as const,
  monitoreoEstadisticas: () =>
    [...higieneIndustrialKeys.monitoreoBiologico(), 'estadisticas'] as const,
  examenesVencidos: () => [...higieneIndustrialKeys.monitoreoBiologico(), 'vencidos'] as const,
  alertasSeguimiento: () =>
    [...higieneIndustrialKeys.monitoreoBiologico(), 'alertas-seguimiento'] as const,
};

// ==================== TIPOS DE AGENTE ====================

export function useTiposAgente(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.tiposAgenteFiltered(params)
      : higieneIndustrialKeys.tiposAgente(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.tipoAgente.getAll(params);
      return data;
    },
  });
}

export function useTipoAgenteById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.tipoAgenteById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.tipoAgente.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTipoAgente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateTipoAgenteDTO) => {
      const data = await higieneIndustrialApi.tipoAgente.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.tiposAgente() });
      toast.success('Tipo de agente creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear tipo de agente'));
    },
  });
}

export function useUpdateTipoAgente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateTipoAgenteDTO }) => {
      const data = await higieneIndustrialApi.tipoAgente.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.tiposAgente() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.tipoAgenteById(id) });
      toast.success('Tipo de agente actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar tipo de agente'));
    },
  });
}

export function useDeleteTipoAgente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.tipoAgente.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.tiposAgente() });
      toast.success('Tipo de agente eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar tipo de agente'));
    },
  });
}

// ==================== AGENTES DE RIESGO ====================

export function useAgentesRiesgo(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.agentesRiesgoFiltered(params)
      : higieneIndustrialKeys.agentesRiesgo(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.agenteRiesgo.getAll(params);
      return data;
    },
  });
}

export function useAgenteRiesgoById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.agenteRiesgoById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.agenteRiesgo.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAgenteRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateAgenteRiesgoDTO) => {
      const data = await higieneIndustrialApi.agenteRiesgo.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.agentesRiesgo() });
      toast.success('Agente de riesgo creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear agente de riesgo'));
    },
  });
}

export function useUpdateAgenteRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateAgenteRiesgoDTO }) => {
      const data = await higieneIndustrialApi.agenteRiesgo.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.agentesRiesgo() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.agenteRiesgoById(id) });
      toast.success('Agente de riesgo actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar agente de riesgo'));
    },
  });
}

export function useDeleteAgenteRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.agenteRiesgo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.agentesRiesgo() });
      toast.success('Agente de riesgo eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar agente de riesgo'));
    },
  });
}

// ==================== GRUPOS DE EXPOSICIÓN SIMILAR ====================

export function useGruposExposicion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.gruposExposicionFiltered(params)
      : higieneIndustrialKeys.gruposExposicion(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.grupoExposicion.getAll(params);
      return data;
    },
  });
}

export function useGrupoExposicionById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.grupoExposicionById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.grupoExposicion.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateGrupoExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateGrupoExposicionSimilarDTO) => {
      const data = await higieneIndustrialApi.grupoExposicion.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.gruposExposicion() });
      toast.success('Grupo de exposición creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear grupo de exposición'));
    },
  });
}

export function useUpdateGrupoExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateGrupoExposicionSimilarDTO }) => {
      const data = await higieneIndustrialApi.grupoExposicion.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.gruposExposicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.grupoExposicionById(id) });
      toast.success('Grupo de exposición actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar grupo de exposición'));
    },
  });
}

export function useDeleteGrupoExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.grupoExposicion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.gruposExposicion() });
      toast.success('Grupo de exposición eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar grupo de exposición'));
    },
  });
}

// ==================== PUNTOS DE MEDICIÓN ====================

export function usePuntosMedicion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.puntosMedicionFiltered(params)
      : higieneIndustrialKeys.puntosMedicion(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.puntoMedicion.getAll(params);
      return data;
    },
  });
}

export function usePuntoMedicionById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.puntoMedicionById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.puntoMedicion.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePuntoMedicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreatePuntoMedicionDTO) => {
      const data = await higieneIndustrialApi.puntoMedicion.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.puntosMedicion() });
      toast.success('Punto de medición creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear punto de medición'));
    },
  });
}

export function useUpdatePuntoMedicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdatePuntoMedicionDTO }) => {
      const data = await higieneIndustrialApi.puntoMedicion.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.puntosMedicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.puntoMedicionById(id) });
      toast.success('Punto de medición actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar punto de medición'));
    },
  });
}

export function useDeletePuntoMedicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.puntoMedicion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.puntosMedicion() });
      toast.success('Punto de medición eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar punto de medición'));
    },
  });
}

// ==================== MEDICIONES AMBIENTALES ====================

export function useMedicionesAmbientales(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.medicionesAmbientalesFiltered(params)
      : higieneIndustrialKeys.medicionesAmbientales(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.medicionAmbiental.getAll(params);
      return data;
    },
  });
}

export function useMedicionAmbientalById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.medicionAmbientalById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.medicionAmbiental.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMedicionAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateMedicionAmbientalDTO) => {
      const data = await higieneIndustrialApi.medicionAmbiental.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesAmbientales() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesEstadisticas() });
      toast.success('Medición ambiental creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear medición ambiental'));
    },
  });
}

export function useUpdateMedicionAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateMedicionAmbientalDTO }) => {
      const data = await higieneIndustrialApi.medicionAmbiental.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesAmbientales() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionAmbientalById(id) });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesEstadisticas() });
      toast.success('Medición ambiental actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar medición ambiental'));
    },
  });
}

export function useDeleteMedicionAmbiental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.medicionAmbiental.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesAmbientales() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesEstadisticas() });
      toast.success('Medición ambiental eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar medición ambiental'));
    },
  });
}

export function useMedicionesEstadisticas() {
  return useQuery({
    queryKey: higieneIndustrialKeys.medicionesEstadisticas(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.medicionAmbiental.getEstadisticas();
      return data;
    },
  });
}

export function useEvaluarCumplimientoMedicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await higieneIndustrialApi.medicionAmbiental.evaluarCumplimiento(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionesAmbientales() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.medicionAmbientalById(id) });
      toast.success('Cumplimiento evaluado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al evaluar cumplimiento'));
    },
  });
}

export function useProximasMediciones() {
  return useQuery({
    queryKey: higieneIndustrialKeys.proximasMediciones(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.medicionAmbiental.proximasMediciones();
      return data;
    },
  });
}

// ==================== CONTROLES DE EXPOSICIÓN ====================

export function useControlesExposicion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.controlesExposicionFiltered(params)
      : higieneIndustrialKeys.controlesExposicion(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.controlExposicion.getAll(params);
      return data;
    },
  });
}

export function useControlExposicionById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.controlExposicionById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.controlExposicion.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateControlExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateControlExposicionDTO) => {
      const data = await higieneIndustrialApi.controlExposicion.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesExposicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesEstadisticas() });
      toast.success('Control de exposición creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear control de exposición'));
    },
  });
}

export function useUpdateControlExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateControlExposicionDTO }) => {
      const data = await higieneIndustrialApi.controlExposicion.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesExposicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlExposicionById(id) });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesEstadisticas() });
      toast.success('Control de exposición actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar control de exposición'));
    },
  });
}

export function useDeleteControlExposicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.controlExposicion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesExposicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesEstadisticas() });
      toast.success('Control de exposición eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar control de exposición'));
    },
  });
}

export function useControlesEstadisticas() {
  return useQuery({
    queryKey: higieneIndustrialKeys.controlesEstadisticas(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.controlExposicion.getEstadisticas();
      return data;
    },
  });
}

export function useControlesPorJerarquia() {
  return useQuery({
    queryKey: higieneIndustrialKeys.controlesPorJerarquia(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.controlExposicion.porJerarquia();
      return data;
    },
  });
}

export function useMedirEfectividadControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await higieneIndustrialApi.controlExposicion.efectividad(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlesExposicion() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.controlExposicionById(id) });
      toast.success('Efectividad medida exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al medir efectividad'));
    },
  });
}

// ==================== MONITOREO BIOLÓGICO ====================

export function useMonitoreoBiologico(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? higieneIndustrialKeys.monitoreoBiologicoFiltered(params)
      : higieneIndustrialKeys.monitoreoBiologico(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.monitoreoBiologico.getAll(params);
      return data;
    },
  });
}

export function useMonitoreoBiologicoById(id: number) {
  return useQuery({
    queryKey: higieneIndustrialKeys.monitoreoBiologicoById(id),
    queryFn: async () => {
      const data = await higieneIndustrialApi.monitoreoBiologico.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMonitoreoBiologico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CreateMonitoreoBiologicoDTO) => {
      const data = await higieneIndustrialApi.monitoreoBiologico.create(datos);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoBiologico() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoEstadisticas() });
      toast.success('Examen de monitoreo biológico creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear examen de monitoreo biológico'));
    },
  });
}

export function useUpdateMonitoreoBiologico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateMonitoreoBiologicoDTO }) => {
      const data = await higieneIndustrialApi.monitoreoBiologico.update(id, datos);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoBiologico() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoBiologicoById(id) });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoEstadisticas() });
      toast.success('Examen de monitoreo biológico actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar examen de monitoreo biológico'));
    },
  });
}

export function useDeleteMonitoreoBiologico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await higieneIndustrialApi.monitoreoBiologico.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoBiologico() });
      queryClient.invalidateQueries({ queryKey: higieneIndustrialKeys.monitoreoEstadisticas() });
      toast.success('Examen de monitoreo biológico eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar examen de monitoreo biológico'));
    },
  });
}

export function useMonitoreoEstadisticas() {
  return useQuery({
    queryKey: higieneIndustrialKeys.monitoreoEstadisticas(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.monitoreoBiologico.getEstadisticas();
      return data;
    },
  });
}

export function useExamenesVencidos() {
  return useQuery({
    queryKey: higieneIndustrialKeys.examenesVencidos(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.monitoreoBiologico.vencidos();
      return data;
    },
  });
}

export function useAlertasSeguimiento() {
  return useQuery({
    queryKey: higieneIndustrialKeys.alertasSeguimiento(),
    queryFn: async () => {
      const data = await higieneIndustrialApi.monitoreoBiologico.alertasSeguimiento();
      return data;
    },
  });
}
