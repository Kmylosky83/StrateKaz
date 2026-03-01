/**
 * Hooks React Query para Oportunidades - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { oportunidadesApi, actividadesApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import type {
  CreateOportunidadDTO,
  UpdateOportunidadDTO,
  CambiarEtapaOportunidadDTO,
  CerrarGanadaDTO,
  CerrarPerdidaDTO,
} from '../types';

// ==================== OPORTUNIDADES ====================

export function useOportunidades(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.oportunidadesFiltered(params) : salesCRMKeys.oportunidades(),
    queryFn: () => oportunidadesApi.getAll(params),
  });
}

export function useOportunidadById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.oportunidadById(id),
    queryFn: () => oportunidadesApi.getById(id),
    enabled: !!id,
  });
}

export function usePipelineKanban(vendedor?: number) {
  return useQuery({
    queryKey: salesCRMKeys.pipelineKanban(vendedor),
    queryFn: () => oportunidadesApi.getKanban({ vendedor }),
  });
}

export function usePipelineDashboard(vendedor?: number) {
  return useQuery({
    queryKey: salesCRMKeys.pipelineDashboard(vendedor),
    queryFn: () => oportunidadesApi.getDashboard({ vendedor }),
  });
}

export function useCreateOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateOportunidadDTO) => oportunidadesApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineDashboard() });
      toast.success('Oportunidad creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear oportunidad');
    },
  });
}

export function useUpdateOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateOportunidadDTO }) =>
      oportunidadesApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidadById(id) });
      toast.success('Oportunidad actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar oportunidad');
    },
  });
}

export function useDeleteOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => oportunidadesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineKanban() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineDashboard() });
      toast.success('Oportunidad eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar oportunidad');
    },
  });
}

export function useCambiarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CambiarEtapaOportunidadDTO }) =>
      oportunidadesApi.cambiarEtapa(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidadById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineKanban() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineDashboard() });
      toast.success('Etapa actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cambiar etapa');
    },
  });
}

export function useCerrarGanada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CerrarGanadaDTO }) =>
      oportunidadesApi.cerrarGanada(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineKanban() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineDashboard() });
      toast.success('Oportunidad cerrada como GANADA');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar oportunidad');
    },
  });
}

export function useCerrarPerdida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CerrarPerdidaDTO }) =>
      oportunidadesApi.cerrarPerdida(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.oportunidades() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineKanban() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pipelineDashboard() });
      toast.success('Oportunidad cerrada como PERDIDA');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar oportunidad');
    },
  });
}

// ==================== ACTIVIDADES ====================

export function useActividades(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.actividadesFiltered(params) : salesCRMKeys.actividades(),
    queryFn: () => actividadesApi.getAll(params),
  });
}

export function useCreateActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: any) => actividadesApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.actividades() });
      toast.success('Actividad registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear actividad');
    },
  });
}

export function useUpdateActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) => actividadesApi.update(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.actividades() });
      toast.success('Actividad actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar actividad');
    },
  });
}
