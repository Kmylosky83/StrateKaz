/**
 * Hooks para Proceso Disciplinario - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  TipoFalta,
  TipoFaltaFormData,
  TipoFaltaFilter,
  LlamadoAtencion,
  LlamadoAtencionFormData,
  LlamadoAtencionFilter,
  Descargo,
  DescargoFormData,
  DescargoFilter,
  RegistrarDescargoData,
  EmitirDecisionData,
  Memorando,
  MemorandoFormData,
  MemorandoFilter,
  RegistrarApelacionData,
  HistorialDisciplinario,
  HistorialDisciplinarioFilter,
  ResumenDisciplinario,
} from '../types';

const BASE_URL = '/talent-hub/proceso-disciplinario';

// ============== QUERY KEYS ==============

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

// ============== TIPOS FALTA ==============

export const useTiposFalta = (filters?: TipoFaltaFilter) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.tiposFalta.list(filters),
    queryFn: async () => {
      const { data } = await api.get<TipoFalta[]>(`${BASE_URL}/tipos-falta/`, { params: filters });
      return data;
    },
  });
};

export const useTipoFalta = (id: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.tiposFalta.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TipoFalta>(`${BASE_URL}/tipos-falta/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTipoFalta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoFaltaFormData) => {
      const { data: response } = await api.post<TipoFalta>(`${BASE_URL}/tipos-falta/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.tiposFalta.all() });
      toast.success('Tipo de falta creado exitosamente');
    },
    onError: () => toast.error('Error al crear el tipo de falta'),
  });
};

export const useUpdateTipoFalta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TipoFaltaFormData> }) => {
      const { data: response } = await api.patch<TipoFalta>(`${BASE_URL}/tipos-falta/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.tiposFalta.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.tiposFalta.detail(id) });
      toast.success('Tipo de falta actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el tipo de falta'),
  });
};

export const useDeleteTipoFalta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/tipos-falta/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.tiposFalta.all() });
      toast.success('Tipo de falta eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el tipo de falta'),
  });
};

// ============== LLAMADOS DE ATENCION ==============

export const useLlamadosAtencion = (filters?: LlamadoAtencionFilter) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.llamados.list(filters),
    queryFn: async () => {
      const { data } = await api.get<LlamadoAtencion[]>(`${BASE_URL}/llamados-atencion/`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useLlamadoAtencion = (id: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.llamados.detail(id),
    queryFn: async () => {
      const { data } = await api.get<LlamadoAtencion>(`${BASE_URL}/llamados-atencion/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateLlamadoAtencion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LlamadoAtencionFormData) => {
      const { data: response } = await api.post<LlamadoAtencion>(
        `${BASE_URL}/llamados-atencion/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.historial.all() });
      toast.success('Llamado de atención creado exitosamente');
    },
    onError: () => toast.error('Error al crear el llamado de atención'),
  });
};

export const useUpdateLlamadoAtencion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LlamadoAtencionFormData> }) => {
      const { data: response } = await api.patch<LlamadoAtencion>(
        `${BASE_URL}/llamados-atencion/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.detail(id) });
      toast.success('Llamado de atención actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el llamado de atención'),
  });
};

export const useDeleteLlamadoAtencion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/llamados-atencion/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.all() });
      toast.success('Llamado de atención eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el llamado de atención'),
  });
};

export const useRegistrarFirmaLlamado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<LlamadoAtencion>(
        `${BASE_URL}/llamados-atencion/${id}/registrar_firma/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.llamados.detail(id) });
      toast.success('Firma registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la firma'),
  });
};

// ============== DESCARGOS ==============

export const useDescargos = (filters?: DescargoFilter) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.descargos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Descargo[]>(`${BASE_URL}/descargos/`, { params: filters });
      return data;
    },
  });
};

export const useDescargo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.descargos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Descargo>(`${BASE_URL}/descargos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DescargoFormData) => {
      const { data: response } = await api.post<Descargo>(`${BASE_URL}/descargos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.historial.all() });
      toast.success('Citación a descargos creada exitosamente');
    },
    onError: () => toast.error('Error al crear la citación a descargos'),
  });
};

export const useUpdateDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DescargoFormData> }) => {
      const { data: response } = await api.patch<Descargo>(`${BASE_URL}/descargos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.detail(id) });
      toast.success('Descargo actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el descargo'),
  });
};

export const useDeleteDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/descargos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.all() });
      toast.success('Descargo eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el descargo'),
  });
};

export const useRegistrarDescargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarDescargoData }) => {
      const { data: response } = await api.post<Descargo>(
        `${BASE_URL}/descargos/${id}/registrar_descargo/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.detail(id) });
      toast.success('Descargo registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el descargo'),
  });
};

export const useEmitirDecision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmitirDecisionData }) => {
      const { data: response } = await api.post<Descargo>(
        `${BASE_URL}/descargos/${id}/emitir_decision/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.descargos.detail(id) });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.historial.all() });
      toast.success('Decisión emitida exitosamente');
    },
    onError: () => toast.error('Error al emitir la decisión'),
  });
};

// ============== MEMORANDOS ==============

export const useMemorandos = (filters?: MemorandoFilter) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.memorandos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Memorando[]>(`${BASE_URL}/memorandos/`, { params: filters });
      return data;
    },
  });
};

export const useMemorando = (id: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.memorandos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Memorando>(`${BASE_URL}/memorandos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MemorandoFormData) => {
      const { data: response } = await api.post<Memorando>(`${BASE_URL}/memorandos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.historial.all() });
      toast.success('Memorando creado exitosamente');
    },
    onError: () => toast.error('Error al crear el memorando'),
  });
};

export const useUpdateMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MemorandoFormData> }) => {
      const { data: response } = await api.patch<Memorando>(`${BASE_URL}/memorandos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.detail(id) });
      toast.success('Memorando actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el memorando'),
  });
};

export const useDeleteMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/memorandos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.all() });
      toast.success('Memorando eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el memorando'),
  });
};

export const useNotificarMemorando = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<Memorando>(
        `${BASE_URL}/memorandos/${id}/notificar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.detail(id) });
      toast.success('Memorando notificado exitosamente');
    },
    onError: () => toast.error('Error al notificar el memorando'),
  });
};

export const useRegistrarApelacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarApelacionData }) => {
      const { data: response } = await api.post<Memorando>(
        `${BASE_URL}/memorandos/${id}/registrar_apelacion/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.all() });
      queryClient.invalidateQueries({ queryKey: procesoDisciplinarioKeys.memorandos.detail(id) });
      toast.success('Apelación registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la apelación'),
  });
};

// ============== HISTORIAL DISCIPLINARIO ==============

export const useHistorialDisciplinario = (filters?: HistorialDisciplinarioFilter) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.historial.list(filters),
    queryFn: async () => {
      const { data } = await api.get<HistorialDisciplinario[]>(`${BASE_URL}/historial/`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useHistorialDisciplinarioDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.historial.detail(id),
    queryFn: async () => {
      const { data } = await api.get<HistorialDisciplinario>(`${BASE_URL}/historial/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useResumenDisciplinario = (colaboradorId: number, enabled = true) => {
  return useQuery({
    queryKey: procesoDisciplinarioKeys.historial.resumen(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<ResumenDisciplinario>(
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
