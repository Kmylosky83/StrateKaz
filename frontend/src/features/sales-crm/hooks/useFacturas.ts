/**
 * Hooks React Query para Facturas - Sales CRM Module
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { facturasApi, pagosApi } from '../api';
import { salesCRMKeys } from './queryKeys';
import type { CreateFacturaDTO, UpdateFacturaDTO, RegistrarPagoDTO, AnularFacturaDTO } from '../types';

export function useFacturas(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.facturasFiltered(params) : salesCRMKeys.facturas(),
    queryFn: () => facturasApi.getAll(params),
  });
}

export function useFacturaById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.facturaById(id),
    queryFn: () => facturasApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFactura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CreateFacturaDTO) => facturasApi.create(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturas() });
      toast.success('Factura creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear factura');
    },
  });
}

export function useUpdateFactura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: UpdateFacturaDTO }) =>
      facturasApi.update(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturas() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturaById(id) });
      toast.success('Factura actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar factura');
    },
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: RegistrarPagoDTO }) =>
      facturasApi.registrarPago(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturas() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturaById(id) });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.pagos() });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al registrar pago');
    },
  });
}

export function useAnularFactura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AnularFacturaDTO }) =>
      facturasApi.anular(id, datos),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturas() });
      queryClient.invalidateQueries({ queryKey: salesCRMKeys.facturaById(id) });
      toast.success('Factura anulada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al anular factura');
    },
  });
}

export function usePagos(params?: any) {
  return useQuery({
    queryKey: params ? salesCRMKeys.pagosFiltered(params) : salesCRMKeys.pagos(),
    queryFn: () => pagosApi.getAll(params),
  });
}

export function usePagoById(id: number) {
  return useQuery({
    queryKey: salesCRMKeys.pagoById(id),
    queryFn: () => pagosApi.getById(id),
    enabled: !!id,
  });
}
