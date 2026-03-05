/**
 * Hooks para Off-Boarding - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks + createApiClient factories.
 * Custom actions (finalizar, cancelar, completar, aprobar, etc.) remain manual.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  tipoRetiroApi,
  procesoRetiroApi,
  checklistRetiroApi,
  pazSalvoApi,
  examenEgresoApi,
  entrevistaRetiroApi,
  liquidacionFinalApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  TipoRetiro,
  TipoRetiroFormData,
  ProcesoRetiro,
  ProcesoRetiroFormData,
  ProcesoRetiroFilter,
  ChecklistRetiro,
  ChecklistRetiroFormData,
  ChecklistRetiroFilter,
  CompletarItemData,
  PazSalvo,
  PazSalvoFormData,
  PazSalvoFilter,
  AprobarPazSalvoData,
  ExamenEgreso,
  ExamenEgresoFormData,
  ExamenEgresoFilter,
  RegistrarResultadoExamenData,
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  EntrevistaRetiroFilter,
  LiquidacionFinal,
  LiquidacionFinalFilter,
  CalcularLiquidacionFinalData,
} from '../types';

const BASE_URL = '/talent-hub/off-boarding';

// ============== QUERY KEYS (backward compat re-exports) ==============

export const offBoardingKeys = {
  all: ['off-boarding'] as const,
  tiposRetiro: {
    all: () => thKeys.tiposRetiro.all,
    list: () => thKeys.tiposRetiro.lists(),
    detail: (id: number) => thKeys.tiposRetiro.detail(id),
  },
  procesos: {
    all: () => thKeys.procesosRetiro.all,
    list: (filters?: ProcesoRetiroFilter) =>
      thKeys.procesosRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.procesosRetiro.detail(id),
  },
  checklist: {
    all: () => thKeys.checklistRetiro.all,
    list: (filters?: ChecklistRetiroFilter) =>
      thKeys.checklistRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.checklistRetiro.detail(id),
  },
  pazSalvos: {
    all: () => thKeys.pazSalvos.all,
    list: (filters?: PazSalvoFilter) => thKeys.pazSalvos.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.pazSalvos.detail(id),
  },
  examenes: {
    all: () => thKeys.examenesEgreso.all,
    list: (filters?: ExamenEgresoFilter) =>
      thKeys.examenesEgreso.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.examenesEgreso.detail(id),
  },
  entrevistas: {
    all: () => thKeys.entrevistasRetiro.all,
    list: (filters?: EntrevistaRetiroFilter) =>
      thKeys.entrevistasRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.entrevistasRetiro.detail(id),
  },
  liquidaciones: {
    all: () => thKeys.liquidacionesFinales.all,
    list: (filters?: LiquidacionFinalFilter) =>
      thKeys.liquidacionesFinales.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.liquidacionesFinales.detail(id),
  },
};

// ============== TIPOS RETIRO (via factory) ==============

const tipoRetiroHooks = createCrudHooks<
  TipoRetiro,
  TipoRetiroFormData,
  Partial<TipoRetiroFormData>
>(tipoRetiroApi, thKeys.tiposRetiro, 'Tipo de retiro');

export const useTiposRetiro = tipoRetiroHooks.useList;

export const useTipoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.tiposRetiro.detail(id),
    queryFn: () => tipoRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateTipoRetiro = tipoRetiroHooks.useCreate;
export const useUpdateTipoRetiro = tipoRetiroHooks.useUpdate;
export const useDeleteTipoRetiro = tipoRetiroHooks.useDelete;

// ============== PROCESOS RETIRO (via factory + custom actions) ==============

const procesoRetiroHooks = createCrudHooks<
  ProcesoRetiro,
  ProcesoRetiroFormData,
  Partial<ProcesoRetiroFormData>
>(procesoRetiroApi, thKeys.procesosRetiro, 'Proceso de retiro');

export const useProcesosRetiro = (filters?: ProcesoRetiroFilter) => {
  return procesoRetiroHooks.useList(filters as Record<string, unknown>);
};

export const useProcesoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.procesosRetiro.detail(id),
    queryFn: () => procesoRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateProcesoRetiro = procesoRetiroHooks.useCreate;
export const useUpdateProcesoRetiro = procesoRetiroHooks.useUpdate;
export const useDeleteProcesoRetiro = procesoRetiroHooks.useDelete;

export const useFinalizarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<ProcesoRetiro>(
        `${BASE_URL}/procesos/${id}/finalizar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Proceso de retiro finalizado exitosamente');
    },
    onError: () => toast.error('Error al finalizar el proceso de retiro'),
  });
};

export const useCancelarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data: response } = await apiClient.post<ProcesoRetiro>(
        `${BASE_URL}/procesos/${id}/cancelar/`,
        { observaciones: motivo }
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Proceso de retiro cancelado');
    },
    onError: () => toast.error('Error al cancelar el proceso de retiro'),
  });
};

// ============== CHECKLIST RETIRO (via factory + custom action) ==============

const checklistHooks = createCrudHooks<
  ChecklistRetiro,
  ChecklistRetiroFormData,
  Partial<ChecklistRetiroFormData>
>(checklistRetiroApi, thKeys.checklistRetiro, 'Item de checklist');

export const useChecklistRetiro = (filters?: ChecklistRetiroFilter) => {
  return checklistHooks.useList(filters as Record<string, unknown>);
};

export const useChecklistRetiroDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.checklistRetiro.detail(id),
    queryFn: () => checklistRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateChecklistItem = checklistHooks.useCreate;
export const useUpdateChecklistItem = checklistHooks.useUpdate;
export const useDeleteChecklistItem = checklistHooks.useDelete;

export const useCompletarChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: CompletarItemData }) => {
      const { data: response } = await apiClient.post<ChecklistRetiro>(
        `${BASE_URL}/checklist/${id}/completar/`,
        data || {}
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Item completado exitosamente');
    },
    onError: () => toast.error('Error al completar el item'),
  });
};

// ============== PAZ Y SALVOS (via factory + custom actions) ==============

const pazSalvoHooks = createCrudHooks<PazSalvo, PazSalvoFormData, Partial<PazSalvoFormData>>(
  pazSalvoApi,
  thKeys.pazSalvos,
  'Paz y salvo'
);

export const usePazSalvos = (filters?: PazSalvoFilter) => {
  return pazSalvoHooks.useList(filters as Record<string, unknown>);
};

export const usePazSalvo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.pazSalvos.detail(id),
    queryFn: () => pazSalvoApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreatePazSalvo = pazSalvoHooks.useCreate;
export const useUpdatePazSalvo = pazSalvoHooks.useUpdate;
export const useDeletePazSalvo = pazSalvoHooks.useDelete;

export const useAprobarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AprobarPazSalvoData }) => {
      const { data: response } = await apiClient.post<PazSalvo>(
        `${BASE_URL}/paz-salvos/${id}/aprobar/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.detail(id) });
      toast.success('Paz y salvo aprobado exitosamente');
    },
    onError: () => toast.error('Error al aprobar el paz y salvo'),
  });
};

export const useRechazarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await apiClient.post<PazSalvo>(
        `${BASE_URL}/paz-salvos/${id}/rechazar/`,
        { observaciones }
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.detail(id) });
      toast.success('Paz y salvo rechazado');
    },
    onError: () => toast.error('Error al rechazar el paz y salvo'),
  });
};

// ============== EXAMENES EGRESO (via factory + custom action) ==============

const examenHooks = createCrudHooks<
  ExamenEgreso,
  ExamenEgresoFormData,
  Partial<ExamenEgresoFormData>
>(examenEgresoApi, thKeys.examenesEgreso, 'Examen de egreso');

export const useExamenesEgreso = (filters?: ExamenEgresoFilter) => {
  return examenHooks.useList(filters as Record<string, unknown>);
};

export const useExamenEgreso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.examenesEgreso.detail(id),
    queryFn: () => examenEgresoApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateExamenEgreso = examenHooks.useCreate;
export const useUpdateExamenEgreso = examenHooks.useUpdate;
export const useDeleteExamenEgreso = examenHooks.useDelete;

export const useRegistrarResultadoExamen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarResultadoExamenData }) => {
      const { data: response } = await apiClient.post<ExamenEgreso>(
        `${BASE_URL}/examenes/${id}/registrar_resultado/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.examenesEgreso.all });
      queryClient.invalidateQueries({ queryKey: thKeys.examenesEgreso.detail(id) });
      toast.success('Resultado registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el resultado'),
  });
};

// ============== ENTREVISTAS RETIRO (via factory) ==============

const entrevistaRetiroHooks = createCrudHooks<
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  Partial<EntrevistaRetiroFormData>
>(entrevistaRetiroApi, thKeys.entrevistasRetiro, 'Entrevista de retiro', { isFeminine: true });

export const useEntrevistasRetiro = (filters?: EntrevistaRetiroFilter) => {
  return entrevistaRetiroHooks.useList(filters as Record<string, unknown>);
};

export const useEntrevistaRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.entrevistasRetiro.detail(id),
    queryFn: () => entrevistaRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateEntrevistaRetiro = entrevistaRetiroHooks.useCreate;
export const useUpdateEntrevistaRetiro = entrevistaRetiroHooks.useUpdate;
export const useDeleteEntrevistaRetiro = entrevistaRetiroHooks.useDelete;

// ============== LIQUIDACIONES FINALES (custom — non-standard CRUD) ==============

export const useLiquidacionesFinales = (filters?: LiquidacionFinalFilter) => {
  return useQuery({
    queryKey: thKeys.liquidacionesFinales.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const response = await liquidacionFinalApi.getAll(filters as Record<string, unknown>);
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
};

export const useLiquidacionFinal = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.liquidacionesFinales.detail(id),
    queryFn: () => liquidacionFinalApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCalcularLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CalcularLiquidacionFinalData) => {
      const { data: response } = await apiClient.post<LiquidacionFinal>(
        `${BASE_URL}/liquidaciones/calcular/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Liquidacion final calculada exitosamente');
    },
    onError: () => toast.error('Error al calcular la liquidacion final'),
  });
};

export const useAprobarLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<LiquidacionFinal>(
        `${BASE_URL}/liquidaciones/${id}/aprobar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.detail(id) });
      toast.success('Liquidacion final aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidacion final'),
  });
};

export const usePagarLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<LiquidacionFinal>(
        `${BASE_URL}/liquidaciones/${id}/pagar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Liquidacion final pagada exitosamente');
    },
    onError: () => toast.error('Error al pagar la liquidacion final'),
  });
};
