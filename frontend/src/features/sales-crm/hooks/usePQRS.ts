/**
 * Hooks React Query para PQRS - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pqrsApi, seguimientoPQRSApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import type {
  CreatePQRSDTO,
  UpdatePQRSDTO,
  AsignarPQRSDTO,
  EscalarPQRSDTO,
  ResolverPQRSDTO,
  CerrarPQRSDTO,
} from '../types';

export function usePQRS(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.pqrsFiltered(params) : salesCRMKeys.pqrs(),
    queryFn: () => pqrsApi.getAll(params),
  });
}

export function usePQRSById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.pqrsById(id),
    queryFn: () => pqrsApi.getById(id),
    enabled: !!id,
  });
}

export function usePQRSDashboard(params?: { empresa_id?: number }) {
  return useQuery({
    queryKey: salesCRMKeys.pqrsDashboard(),
    queryFn: () => pqrsApi.getDashboard(params),
  });
}

export function useCreatePQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreatePQRSDTO) => pqrsApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsDashboard() });
      toast.success('PQRS creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear PQRS');
    },
  });
}

export function useUpdatePQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdatePQRSDTO }) => pqrsApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsById(id) });
      toast.success('PQRS actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar PQRS');
    },
  });
}

export function useDeletePQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pqrsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsDashboard() });
      toast.success('PQRS eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar PQRS');
    },
  });
}

export function useAsignarPQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AsignarPQRSDTO }) =>
      pqrsApi.asignar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsById(id) });
      toast.success('PQRS asignada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al asignar PQRS');
    },
  });
}

export function useEscalarPQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EscalarPQRSDTO }) =>
      pqrsApi.escalar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsById(id) });
      toast.success('PQRS escalada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al escalar PQRS');
    },
  });
}

export function useResolverPQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ResolverPQRSDTO }) =>
      pqrsApi.resolver(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsDashboard() });
      toast.success('PQRS resuelta exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al resolver PQRS');
    },
  });
}

export function useCerrarPQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CerrarPQRSDTO }) => pqrsApi.cerrar(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrs() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pqrsDashboard() });
      toast.success('PQRS cerrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cerrar PQRS');
    },
  });
}

export function useSeguimientoPQRS(params?: any) {
  return useQuery({
    queryKey: params
      ? salesCRMKeys.seguimientoPQRSFiltered(params)
      : salesCRMKeys.seguimientoPQRS(),
    queryFn: () => seguimientoPQRSApi.getAll(params),
  });
}

export function useCreateSeguimientoPQRS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: any) => seguimientoPQRSApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.seguimientoPQRS() });
      toast.success('Seguimiento registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al registrar seguimiento');
    },
  });
}
