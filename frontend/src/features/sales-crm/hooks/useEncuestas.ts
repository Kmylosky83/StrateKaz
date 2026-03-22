/**
 * Hooks React Query para Encuestas - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encuestasApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { CreateEncuestaDTO, UpdateEncuestaDTO, ResponderEncuestaDTO } from '../types';

export function useEncuestas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? salesCRMKeys.encuestasFiltered(params) : salesCRMKeys.encuestas(),
    queryFn: () => encuestasApi.getAll(params),
  });
}

export function useEncuestaById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.encuestaById(id),
    queryFn: () => encuestasApi.getById(id),
    enabled: !!id,
  });
}

export function useNPSDashboard(params?: { fecha_desde?: string; fecha_hasta?: string }) {
  return useQuery({
    queryKey: salesCRMKeys.npsDashboard(),
    queryFn: () => encuestasApi.getNPSDashboard(params),
  });
}

export function useCreateEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateEncuestaDTO) => encuestasApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestas() });
      toast.success('Encuesta creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear encuesta'));
    },
  });
}

export function useUpdateEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateEncuestaDTO }) =>
      encuestasApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestas() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestaById(id) });
      toast.success('Encuesta actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar encuesta'));
    },
  });
}

export function useEnviarEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => encuestasApi.enviar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestas() });
      toast.success('Encuesta enviada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al enviar encuesta'));
    },
  });
}

export function useResponderEncuesta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ResponderEncuestaDTO }) =>
      encuestasApi.responder(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestas() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.encuestaById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.npsDashboard() });
      toast.success('Encuesta respondida exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al responder encuesta'));
    },
  });
}
