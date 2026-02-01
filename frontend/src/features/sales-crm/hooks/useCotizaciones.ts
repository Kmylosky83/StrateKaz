/**
 * Hooks React Query para Cotizaciones - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cotizacionesApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import type { CreateCotizacionDTO, UpdateCotizacionDTO, AprobarCotizacionDTO, RechazarCotizacionDTO } from '../types';

export function useCotizaciones(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.cotizacionesFiltered(params) : salesCRMKeys.cotizaciones(),
    queryFn: () => cotizacionesApi.getAll(params),
  });
}

export function useCotizacionById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.cotizacionById(id),
    queryFn: () => cotizacionesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateCotizacionDTO) => cotizacionesApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      toast.success('Cotización creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear cotización');
    },
  });
}

export function useUpdateCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateCotizacionDTO }) =>
      cotizacionesApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizacionById(id) });
      toast.success('Cotización actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar cotización');
    },
  });
}

export function useAprobarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AprobarCotizacionDTO }) =>
      cotizacionesApi.aprobar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizacionById(id) });
      toast.success('Cotización aprobada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al aprobar cotización');
    },
  });
}

export function useRechazarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: RechazarCotizacionDTO }) =>
      cotizacionesApi.rechazar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizacionById(id) });
      toast.success('Cotización rechazada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al rechazar cotización');
    },
  });
}

export function useClonarCotizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cotizacionesApi.clonar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      toast.success('Cotización clonada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al clonar cotización');
    },
  });
}

export function useConvertirAPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cotizacionesApi.convertirAPedido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      toast.success('Pedido generado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al convertir a pedido');
    },
  });
}
