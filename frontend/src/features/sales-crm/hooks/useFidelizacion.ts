/**
 * Hooks React Query para Fidelización - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { programasFidelizacionApi, puntosFidelizacionApi, movimientosPuntosApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { AcumularPuntosDTO, CanjearPuntosDTO } from '../types';

export function useProgramasFidelizacion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: salesCRMKeys.programasFidelizacion(),
    queryFn: () => programasFidelizacionApi.getAll(params),
  });
}

export function useProgramaFidelizacionById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.programaFidelizacionById(id),
    queryFn: () => programasFidelizacionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProgramaFidelizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: Record<string, unknown>) => programasFidelizacionApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.programasFidelizacion() });
      toast.success('Programa creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear programa'));
    },
  });
}

export function useUpdateProgramaFidelizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Record<string, unknown> }) =>
      programasFidelizacionApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.programasFidelizacion() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.programaFidelizacionById(id) });
      toast.success('Programa actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar programa'));
    },
  });
}

export function usePuntosFidelizacion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? salesCRMKeys.puntosFidelizacionFiltered(params) : salesCRMKeys.puntosFidelizacion(),
    queryFn: () => puntosFidelizacionApi.getAll(params),
  });
}

export function usePuntosFidelizacionById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.puntosFidelizacionById(id),
    queryFn: () => puntosFidelizacionApi.getById(id),
    enabled: !!id,
  });
}

export function useAcumularPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: AcumularPuntosDTO) => puntosFidelizacionApi.acumular(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.puntosFidelizacion() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.movimientosPuntos() });
      toast.success('Puntos acumulados exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al acumular puntos'));
    },
  });
}

export function useCanjearPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CanjearPuntosDTO) => puntosFidelizacionApi.canjear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.puntosFidelizacion() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.movimientosPuntos() });
      toast.success('Puntos canjeados exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al canjear puntos'));
    },
  });
}

export function useMovimientosPuntos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? salesCRMKeys.movimientosPuntosFiltered(params) : salesCRMKeys.movimientosPuntos(),
    queryFn: () => movimientosPuntosApi.getAll(params),
  });
}
