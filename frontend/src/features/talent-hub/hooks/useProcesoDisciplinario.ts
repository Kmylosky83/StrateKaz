/**
 * Hooks para Proceso Disciplinario - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks / createApiClient / thKeys factories.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  tipoFaltaApi,
  llamadoAtencionApi,
  descargoApi,
  memorandoApi,
  historialDisciplinarioApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  TipoFaltaFilter,
  LlamadoAtencion,
  LlamadoAtencionFilter,
  Descargo,
  DescargoFilter,
  RegistrarDescargoData,
  EmitirDecisionData,
  Memorando,
  MemorandoFilter,
  RegistrarApelacionData,
  HistorialDisciplinarioFilter,
  ResumenDisciplinario,
} from '../types';

const BASE_URL = '/talent-hub/proceso-disciplinario';

// ============== LEGACY QUERY KEYS (backward compat) ==============

export const procesoDisciplinarioKeys = {
  all: ['proceso-disciplinario'] as const,
  tiposFalta: {
    all: () => [...procesoDisciplinarioKeys.all, 'tipos-falta'] as const,
    list: (filters?: TipoFaltaFilter) =>
      [...procesoDisciplinarioKeys.tiposFalta.all(), 'list', filters] as const,
    detail: (id: number) => [...procesoDisciplinarioKeys.tiposFalta.all(), 'detail', id] as const,
  },
  llamados: {
    all: () => [...procesoDisciplinarioKeys.all, 'llamados'] as const,
    list: (filters?: LlamadoAtencionFilter) =>
      [...procesoDisciplinarioKeys.llamados.all(), 'list', filters] as const,
    detail: (id: number) => [...procesoDisciplinarioKeys.llamados.all(), 'detail', id] as const,
  },
  descargos: {
    all: () => [...procesoDisciplinarioKeys.all, 'descargos'] as const,
    list: (filters?: DescargoFilter) =>
      [...procesoDisciplinarioKeys.descargos.all(), 'list', filters] as const,
    detail: (id: number) => [...procesoDisciplinarioKeys.descargos.all(), 'detail', id] as const,
  },
  memorandos: {
    all: () => [...procesoDisciplinarioKeys.all, 'memorandos'] as const,
    list: (filters?: MemorandoFilter) =>
      [...procesoDisciplinarioKeys.memorandos.all(), 'list', filters] as const,
    detail: (id: number) => [...procesoDisciplinarioKeys.memorandos.all(), 'detail', id] as const,
  },
  historial: {
    all: () => [...procesoDisciplinarioKeys.all, 'historial'] as const,
    list: (filters?: HistorialDisciplinarioFilter) =>
      [...procesoDisciplinarioKeys.historial.all(), 'list', filters] as const,
    detail: (id: number) => [...procesoDisciplinarioKeys.historial.all(), 'detail', id] as const,
    resumen: (colaboradorId: number) =>
      [...procesoDisciplinarioKeys.historial.all(), 'resumen', colaboradorId] as const,
  },
};

// ============== TIPOS FALTA (factory CRUD) ==============

const tipoFaltaHooks = createCrudHooks(tipoFaltaApi, thKeys.tiposFalta, 'Tipo de falta');

export const useTiposFalta = tipoFaltaHooks.useList;
export const useTipoFalta = tipoFaltaHooks.useDetail;
export const useCreateTipoFalta = tipoFaltaHooks.useCreate;
export const useUpdateTipoFalta = tipoFaltaHooks.useUpdate;
export const useDeleteTipoFalta = tipoFaltaHooks.useDelete;

// ============== LLAMADOS DE ATENCION (factory CRUD + custom actions) ==============

const llamadoHooks = createCrudHooks(
  llamadoAtencionApi,
  thKeys.llamadosAtencion,
  'Llamado de atencion'
);

export const useLlamadosAtencion = llamadoHooks.useList;
export const useLlamadoAtencion = llamadoHooks.useDetail;
export const useUpdateLlamadoAtencion = llamadoHooks.useUpdate;
export const useDeleteLlamadoAtencion = llamadoHooks.useDelete;

/** Custom create to also invalidate historial */
export const useCreateLlamadoAtencion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').LlamadoAtencionFormData) => {
      const response = await llamadoAtencionApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.llamadosAtencion.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.historialDisciplinario.lists() });
      toast.success('Llamado de atencion creado exitosamente');
    },
    onError: () => toast.error('Error al crear el llamado de atencion'),
  });
};

export const useRegistrarFirmaLlamado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<LlamadoAtencion>(
        `${BASE_URL}/llamados-atencion/${id}/registrar_firma/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.llamadosAtencion.lists() });
      toast.success('Firma registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la firma'),
  });
};

// ============== DESCARGOS (factory CRUD + custom actions) ==============

const descargoHooks = createCrudHooks(descargoApi, thKeys.descargos, 'Descargo');

export const useDescargos = descargoHooks.useList;
export const useDescargo = descargoHooks.useDetail;
export const useUpdateDescargo = descargoHooks.useUpdate;
export const useDeleteDescargo = descargoHooks.useDelete;

/** Custom create to also invalidate historial */
export const useCreateDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').DescargoFormData) => {
      const response = await descargoApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.descargos.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.historialDisciplinario.lists() });
      toast.success('Citacion a descargos creada exitosamente');
    },
    onError: () => toast.error('Error al crear la citacion a descargos'),
  });
};

export const useRegistrarDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarDescargoData }) => {
      const { data: response } = await apiClient.post<Descargo>(
        `${BASE_URL}/descargos/${id}/registrar_descargo/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.descargos.lists() });
      toast.success('Descargo registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el descargo'),
  });
};

export const useEmitirDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmitirDecisionData }) => {
      const { data: response } = await apiClient.post<Descargo>(
        `${BASE_URL}/descargos/${id}/emitir_decision/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.descargos.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.historialDisciplinario.lists() });
      toast.success('Decision emitida exitosamente');
    },
    onError: () => toast.error('Error al emitir la decision'),
  });
};

// ============== MEMORANDOS (factory CRUD + custom actions) ==============

const memorandoHooks = createCrudHooks(memorandoApi, thKeys.memorandos, 'Memorando');

export const useMemorandos = memorandoHooks.useList;
export const useMemorando = memorandoHooks.useDetail;
export const useUpdateMemorando = memorandoHooks.useUpdate;
export const useDeleteMemorando = memorandoHooks.useDelete;

/** Custom create to also invalidate historial */
export const useCreateMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').MemorandoFormData) => {
      const response = await memorandoApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.memorandos.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.historialDisciplinario.lists() });
      toast.success('Memorando creado exitosamente');
    },
    onError: () => toast.error('Error al crear el memorando'),
  });
};

export const useNotificarMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<Memorando>(
        `${BASE_URL}/memorandos/${id}/notificar/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.memorandos.lists() });
      toast.success('Memorando notificado exitosamente');
    },
    onError: () => toast.error('Error al notificar el memorando'),
  });
};

export const useRegistrarApelacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarApelacionData }) => {
      const { data: response } = await apiClient.post<Memorando>(
        `${BASE_URL}/memorandos/${id}/registrar_apelacion/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.memorandos.lists() });
      toast.success('Apelacion registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la apelacion'),
  });
};

// ============== HISTORIAL DISCIPLINARIO (custom — read-only) ==============

export const useHistorialDisciplinario = (filters?: HistorialDisciplinarioFilter) => {
  return useQuery({
    queryKey: thKeys.historialDisciplinario.list(filters),
    queryFn: async () => {
      const response = await historialDisciplinarioApi.getAll(filters as Record<string, unknown>);
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
  });
};

export const useHistorialDisciplinarioDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.historialDisciplinario.detail(id),
    queryFn: () => historialDisciplinarioApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useResumenDisciplinario = (colaboradorId: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.historialDisciplinario.custom('resumen', colaboradorId),
    queryFn: async () => {
      const { data } = await apiClient.get<ResumenDisciplinario>(
        `${BASE_URL}/historial/resumen_colaborador/`,
        {
          params: { colaborador: colaboradorId },
        }
      );
      return data;
    },
    enabled: enabled && !!colaboradorId,
  });
};
