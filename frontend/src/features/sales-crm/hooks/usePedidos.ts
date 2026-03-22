/**
 * Hooks React Query para Pedidos - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pedidosApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type { CreatePedidoDTO, UpdatePedidoDTO, AprobarPedidoDTO, CancelarPedidoDTO } from '../types';

export function usePedidos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? salesCRMKeys.pedidosFiltered(params) : salesCRMKeys.pedidos(),
    queryFn: () => pedidosApi.getAll(params),
  });
}

export function usePedidoById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.pedidoById(id),
    queryFn: () => pedidosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreatePedidoDTO) => pedidosApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      toast.success('Pedido creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al crear pedido'));
    },
  });
}

export function useUpdatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdatePedidoDTO }) =>
      pedidosApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidoById(id) });
      toast.success('Pedido actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar pedido'));
    },
  });
}

export function useAprobarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AprobarPedidoDTO }) =>
      pedidosApi.aprobar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidoById(id) });
      toast.success('Pedido aprobado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al aprobar pedido'));
    },
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CancelarPedidoDTO }) =>
      pedidosApi.cancelar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidoById(id) });
      toast.success('Pedido cancelado');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al cancelar pedido'));
    },
  });
}

export function useGenerarFactura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pedidosApi.generarFactura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pedidos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturas() });
      toast.success('Factura generada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Error al generar factura'));
    },
  });
}
