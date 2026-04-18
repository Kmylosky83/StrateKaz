/**
 * Hooks React Query para Gestión de Compras - Supply Chain
 * Sistema de gestión de requisiciones, cotizaciones, órdenes de compra y contratos.
 * (Recepciones viven en features/supply-chain/recepcion desde S3.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import comprasApi from '../api/comprasApi';
import type { ApiError } from '@/types';
import { getApiErrorMessage } from '@/utils/errorUtils';
import type {
  CreateRequisicionDTO,
  UpdateRequisicionDTO,
  CreateCotizacionDTO,
  UpdateCotizacionDTO,
  CreateEvaluacionCotizacionDTO,
  CreateOrdenCompraDTO,
  UpdateOrdenCompraDTO,
  CreateContratoDTO,
  UpdateContratoDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const comprasKeys = {
  all: ['supply-chain', 'compras'] as const,

  // Catálogos
  estadosRequisicion: () => [...comprasKeys.all, 'estados-requisicion'] as const,
  estadosCotizacion: () => [...comprasKeys.all, 'estados-cotizacion'] as const,
  estadosOrdenCompra: () => [...comprasKeys.all, 'estados-orden-compra'] as const,
  tiposContrato: () => [...comprasKeys.all, 'tipos-contrato'] as const,
  prioridadesRequisicion: () => [...comprasKeys.all, 'prioridades-requisicion'] as const,
  monedas: () => [...comprasKeys.all, 'monedas'] as const,
  estadosContrato: () => [...comprasKeys.all, 'estados-contrato'] as const,
  estadosMaterial: () => [...comprasKeys.all, 'estados-material'] as const,

  // Requisiciones
  requisiciones: () => [...comprasKeys.all, 'requisiciones'] as const,
  requisicionesFiltered: (filters: Record<string, unknown>) =>
    [...comprasKeys.requisiciones(), 'filtered', filters] as const,
  requisicion: (id: number) => [...comprasKeys.all, 'requisicion', id] as const,

  // Cotizaciones
  cotizaciones: () => [...comprasKeys.all, 'cotizaciones'] as const,
  cotizacionesFiltered: (filters: Record<string, unknown>) =>
    [...comprasKeys.cotizaciones(), 'filtered', filters] as const,
  cotizacion: (id: number) => [...comprasKeys.all, 'cotizacion', id] as const,

  // Órdenes de Compra
  ordenesCompra: () => [...comprasKeys.all, 'ordenes-compra'] as const,
  ordenesCompraFiltered: (filters: Record<string, unknown>) =>
    [...comprasKeys.ordenesCompra(), 'filtered', filters] as const,
  ordenCompra: (id: number) => [...comprasKeys.all, 'orden-compra', id] as const,

  // Contratos
  contratos: () => [...comprasKeys.all, 'contratos'] as const,
  contratosFiltered: (filters: Record<string, unknown>) =>
    [...comprasKeys.contratos(), 'filtered', filters] as const,
  contrato: (id: number) => [...comprasKeys.all, 'contrato', id] as const,
  contratosVigentes: () => [...comprasKeys.all, 'contratos-vigentes'] as const,
  contratosPorVencer: (dias: number) => [...comprasKeys.all, 'contratos-por-vencer', dias] as const,

  // Recepciones: keys eliminadas en S3 (ver features/supply-chain/recepcion/)

  // Estadísticas
  estadisticas: () => [...comprasKeys.all, 'estadisticas'] as const,
};

// ==================== CATÁLOGOS ====================

// Note: These would typically come from dedicated catalog endpoints
// For now, they return empty queries as placeholders

export function useEstadosRequisicion() {
  return useQuery({
    queryKey: comprasKeys.estadosRequisicion(),
    queryFn: async () => {
      // This would call a catalog endpoint
      return [];
    },
  });
}

export function useEstadosCotizacion() {
  return useQuery({
    queryKey: comprasKeys.estadosCotizacion(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useEstadosOrdenCompra() {
  return useQuery({
    queryKey: comprasKeys.estadosOrdenCompra(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useTiposContrato() {
  return useQuery({
    queryKey: comprasKeys.tiposContrato(),
    queryFn: async () => {
      return [];
    },
  });
}

export function usePrioridadesRequisicion() {
  return useQuery({
    queryKey: comprasKeys.prioridadesRequisicion(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useMonedas() {
  return useQuery({
    queryKey: comprasKeys.monedas(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useEstadosContrato() {
  return useQuery({
    queryKey: comprasKeys.estadosContrato(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useEstadosMaterial() {
  return useQuery({
    queryKey: comprasKeys.estadosMaterial(),
    queryFn: async () => {
      return [];
    },
  });
}

// ==================== REQUISICIONES ====================

export function useRequisiciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comprasKeys.requisicionesFiltered(params) : comprasKeys.requisiciones(),
    queryFn: async () => {
      const response = await comprasApi.requisicion.getAll(params);
      return response.data;
    },
  });
}

export function useRequisicion(id: number) {
  return useQuery({
    queryKey: comprasKeys.requisicion(id),
    queryFn: async () => {
      const response = await comprasApi.requisicion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateRequisicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequisicionDTO) => {
      const response = await comprasApi.requisicion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisiciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.estadisticas() });
      toast.success('Requisición creada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear requisición'));
    },
  });
}

export function useUpdateRequisicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRequisicionDTO }) => {
      const response = await comprasApi.requisicion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisiciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisicion(id) });
      toast.success('Requisición actualizada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar requisición'));
    },
  });
}

export function useDeleteRequisicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await comprasApi.requisicion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisiciones() });
      toast.success('Requisición eliminada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar requisición'));
    },
  });
}

export function useAprobarRequisicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await comprasApi.requisicion.aprobar(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisiciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisicion(id) });
      toast.success('Requisición aprobada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al aprobar requisición'));
    },
  });
}

export function useRechazarRequisicion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const response = await comprasApi.requisicion.rechazar(id, motivo);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisiciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.requisicion(id) });
      toast.success('Requisición rechazada');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al rechazar requisición'));
    },
  });
}

// ==================== COTIZACIONES ====================

export function useCotizaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comprasKeys.cotizacionesFiltered(params) : comprasKeys.cotizaciones(),
    queryFn: async () => {
      const response = await comprasApi.cotizacion.getAll(params);
      return response.data;
    },
  });
}

export function useCotizacion(id: number) {
  return useQuery({
    queryKey: comprasKeys.cotizacion(id),
    queryFn: async () => {
      const response = await comprasApi.cotizacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCotizacionDTO) => {
      const response = await comprasApi.cotizacion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizaciones() });
      toast.success('Cotización creada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear cotización'));
    },
  });
}

export function useUpdateCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCotizacionDTO }) => {
      const response = await comprasApi.cotizacion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizacion(id) });
      toast.success('Cotización actualizada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar cotización'));
    },
  });
}

export function useDeleteCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await comprasApi.cotizacion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizaciones() });
      toast.success('Cotización eliminada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar cotización'));
    },
  });
}

export function useEvaluarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateEvaluacionCotizacionDTO }) => {
      const response = await comprasApi.cotizacion.evaluar(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizacion(id) });
      toast.success('Cotización evaluada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al evaluar cotización'));
    },
  });
}

export function useSeleccionarCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await comprasApi.cotizacion.seleccionar(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizaciones() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.cotizacion(id) });
      toast.success('Cotización seleccionada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al seleccionar cotización'));
    },
  });
}

// ==================== ÓRDENES DE COMPRA ====================

export function useOrdenesCompra(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comprasKeys.ordenesCompraFiltered(params) : comprasKeys.ordenesCompra(),
    queryFn: async () => {
      const response = await comprasApi.ordenCompra.getAll(params);
      return response.data;
    },
  });
}

export function useOrdenCompra(id: number) {
  return useQuery({
    queryKey: comprasKeys.ordenCompra(id),
    queryFn: async () => {
      const response = await comprasApi.ordenCompra.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrdenCompraDTO) => {
      const response = await comprasApi.ordenCompra.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenesCompra() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.estadisticas() });
      toast.success('Orden de compra creada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear orden de compra'));
    },
  });
}

export function useUpdateOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOrdenCompraDTO }) => {
      const response = await comprasApi.ordenCompra.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenesCompra() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenCompra(id) });
      toast.success('Orden de compra actualizada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar orden de compra'));
    },
  });
}

export function useDeleteOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await comprasApi.ordenCompra.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.ordenesCompra() });
      toast.success('Orden de compra eliminada exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar orden de compra'));
    },
  });
}

// Nota: useRecepcionarOrdenCompra eliminado en S3 (RecepcionCompra legacy removida).

// ==================== CONTRATOS ====================

export function useContratos(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? comprasKeys.contratosFiltered(params) : comprasKeys.contratos(),
    queryFn: async () => {
      const response = await comprasApi.contrato.getAll(params);
      return response.data;
    },
  });
}

export function useContrato(id: number) {
  return useQuery({
    queryKey: comprasKeys.contrato(id),
    queryFn: async () => {
      const response = await comprasApi.contrato.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateContratoDTO) => {
      const response = await comprasApi.contrato.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.contratos() });
      toast.success('Contrato creado exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al crear contrato'));
    },
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateContratoDTO }) => {
      const response = await comprasApi.contrato.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.contratos() });
      queryClient.invalidateQueries({ queryKey: comprasKeys.contrato(id) });
      toast.success('Contrato actualizado exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al actualizar contrato'));
    },
  });
}

export function useDeleteContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await comprasApi.contrato.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comprasKeys.contratos() });
      toast.success('Contrato eliminado exitosamente');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(getApiErrorMessage(error, 'Error al eliminar contrato'));
    },
  });
}

export function useContratosVigentes() {
  return useQuery({
    queryKey: comprasKeys.contratosVigentes(),
    queryFn: async () => {
      const response = await comprasApi.contrato.vigentes();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useContratosPorVencer(dias: number = 30) {
  return useQuery({
    queryKey: comprasKeys.contratosPorVencer(dias),
    queryFn: async () => {
      const response = await comprasApi.contrato.porVencer(dias);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Nota: Hooks useRecepcionesCompra/useRecepcionCompra/useCreateRecepcionCompra/
// useUpdateRecepcionCompra/useDeleteRecepcionCompra/useRecepcionesNoConformes
// eliminados en S3. Ver features/supply-chain/recepcion/ para los nuevos hooks
// de VoucherRecepcion.

// ==================== ESTADÍSTICAS ====================

export function useEstadisticasCompras() {
  return useQuery({
    queryKey: comprasKeys.estadisticas(),
    queryFn: async () => {
      const response = await comprasApi.estadisticas();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
