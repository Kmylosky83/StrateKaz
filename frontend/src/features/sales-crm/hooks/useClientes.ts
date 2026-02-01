/**
 * Hooks React Query para Clientes - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientesApi, contactosApi, segmentosApi, canalesVentaApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import type { CreateClienteDTO, UpdateClienteDTO } from '../types';

// ==================== CLIENTES ====================

export function useClientes(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.clientesFiltered(params) : salesCRMKeys.clientes(),
    queryFn: () => clientesApi.getAll(params),
  });
}

export function useClienteById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.clienteById(id),
    queryFn: () => clientesApi.getById(id),
    enabled: !!id,
  });
}

export function useClienteDashboard(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: salesCRMKeys.clienteDashboard(),
    queryFn: () => clientesApi.getDashboard(params),
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateClienteDTO) => clientesApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clientes() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clienteDashboard() });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear cliente');
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateClienteDTO }) =>
      clientesApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clientes() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clienteById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clienteDashboard() });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar cliente');
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clientes() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clienteDashboard() });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar cliente');
    },
  });
}

export function useActualizarScoring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientesApi.actualizarScoring(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clientes() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.clienteById(id) });
      toast.success('Scoring actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar scoring');
    },
  });
}

// ==================== CONTACTOS ====================

export function useContactos(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.contactosFiltered(params) : salesCRMKeys.contactos(),
    queryFn: () => contactosApi.getAll(params),
  });
}

export function useContactoById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.contactoById(id),
    queryFn: () => contactosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateContacto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: any) => contactosApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.contactos() });
      toast.success('Contacto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear contacto');
    },
  });
}

export function useUpdateContacto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) =>
      contactosApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.contactos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.contactoById(id) });
      toast.success('Contacto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar contacto');
    },
  });
}

export function useDeleteContacto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => contactosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.contactos() });
      toast.success('Contacto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar contacto');
    },
  });
}

// ==================== SEGMENTOS ====================

export function useSegmentos(params?: any) {
  return useQuery({
    queryKey: salesCRMKeys.segmentos(),
    queryFn: () => segmentosApi.getAll(params),
  });
}

export function useSegmentoById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.segmentoById(id),
    queryFn: () => segmentosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSegmento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: any) => segmentosApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.segmentos() });
      toast.success('Segmento creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear segmento');
    },
  });
}

export function useUpdateSegmento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) =>
      segmentosApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.segmentos() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.segmentoById(id) });
      toast.success('Segmento actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar segmento');
    },
  });
}

// ==================== CANALES DE VENTA ====================

export function useCanalesVenta(params?: any) {
  return useQuery({
    queryKey: salesCRMKeys.canalesVenta(),
    queryFn: () => canalesVentaApi.getAll(params),
  });
}

export function useCanalVentaById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.canalVentaById(id),
    queryFn: () => canalesVentaApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCanalVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: any) => canalesVentaApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.canalesVenta() });
      toast.success('Canal de venta creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear canal de venta');
    },
  });
}

export function useUpdateCanalVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) =>
      canalesVentaApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.canalesVenta() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.canalVentaById(id) });
      toast.success('Canal de venta actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar canal de venta');
    },
  });
}
