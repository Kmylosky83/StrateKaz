/**
 * Hooks React Query para Gestión de Almacenamiento - Supply Chain
 * Sistema de gestión de inventarios, movimientos, kardex, alertas y configuración de stock
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import almacenamientoApi from '../api/almacenamientoApi';
import type {
  Inventario,
  InventarioList,
  MovimientoInventario,
  MovimientoInventarioList,
  Kardex,
  KardexResponse,
  ConsultaKardexParams,
  AlertaStock,
  AlertaStockList,
  ConfiguracionStock,
  ConfiguracionStockList,
  CreateInventarioDTO,
  UpdateInventarioDTO,
  CreateMovimientoInventarioDTO,
  UpdateMovimientoInventarioDTO,
  CreateAlertaStockDTO,
  CreateConfiguracionStockDTO,
  UpdateConfiguracionStockDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const almacenamientoKeys = {
  all: ['supply-chain', 'almacenamiento'] as const,

  // Catálogos
  tiposMovimiento: () => [...almacenamientoKeys.all, 'tipos-movimiento'] as const,
  estadosInventario: () => [...almacenamientoKeys.all, 'estados-inventario'] as const,
  tiposAlerta: () => [...almacenamientoKeys.all, 'tipos-alerta'] as const,
  unidadesMedida: () => [...almacenamientoKeys.all, 'unidades-medida'] as const,

  // Inventarios
  inventarios: () => [...almacenamientoKeys.all, 'inventarios'] as const,
  inventariosFiltered: (filters: Record<string, any>) => [...almacenamientoKeys.inventarios(), 'filtered', filters] as const,
  inventario: (id: number) => [...almacenamientoKeys.all, 'inventario', id] as const,
  stockBajo: () => [...almacenamientoKeys.all, 'stock-bajo'] as const,
  stockCritico: () => [...almacenamientoKeys.all, 'stock-critico'] as const,
  stockPorVencer: (dias: number) => [...almacenamientoKeys.all, 'stock-por-vencer', dias] as const,

  // Movimientos
  movimientos: () => [...almacenamientoKeys.all, 'movimientos'] as const,
  movimientosFiltered: (filters: Record<string, any>) => [...almacenamientoKeys.movimientos(), 'filtered', filters] as const,
  movimiento: (id: number) => [...almacenamientoKeys.all, 'movimiento', id] as const,

  // Kardex
  kardex: (params: ConsultaKardexParams) => [...almacenamientoKeys.all, 'kardex', params] as const,
  kardexPorProducto: (inventarioId: number, params?: Record<string, any>) =>
    [...almacenamientoKeys.all, 'kardex-producto', inventarioId, params] as const,

  // Alertas
  alertas: () => [...almacenamientoKeys.all, 'alertas'] as const,
  alertasFiltered: (filters: Record<string, any>) => [...almacenamientoKeys.alertas(), 'filtered', filters] as const,
  alerta: (id: number) => [...almacenamientoKeys.all, 'alerta', id] as const,
  alertasNoLeidas: () => [...almacenamientoKeys.all, 'alertas-no-leidas'] as const,

  // Configuraciones
  configuraciones: () => [...almacenamientoKeys.all, 'configuraciones'] as const,
  configuracionesFiltered: (filters: Record<string, any>) => [...almacenamientoKeys.configuraciones(), 'filtered', filters] as const,
  configuracion: (id: number) => [...almacenamientoKeys.all, 'configuracion', id] as const,

  // Estadísticas
  estadisticas: () => [...almacenamientoKeys.all, 'estadisticas'] as const,
};

// ==================== CATÁLOGOS ====================

// Note: These would typically come from dedicated catalog endpoints
// For now, they return empty queries as placeholders

export function useTiposMovimiento() {
  return useQuery({
    queryKey: almacenamientoKeys.tiposMovimiento(),
    queryFn: async () => {
      // This would call a catalog endpoint
      return [];
    },
  });
}

export function useEstadosInventario() {
  return useQuery({
    queryKey: almacenamientoKeys.estadosInventario(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useTiposAlerta() {
  return useQuery({
    queryKey: almacenamientoKeys.tiposAlerta(),
    queryFn: async () => {
      return [];
    },
  });
}

export function useUnidadesMedidaAlmacenamiento() {
  return useQuery({
    queryKey: almacenamientoKeys.unidadesMedida(),
    queryFn: async () => {
      return [];
    },
  });
}

// ==================== INVENTARIOS ====================

export function useInventarios(params?: Record<string, any>) {
  return useQuery({
    queryKey: params ? almacenamientoKeys.inventariosFiltered(params) : almacenamientoKeys.inventarios(),
    queryFn: async () => {
      const response = await almacenamientoApi.inventario.getAll(params);
      return response.data;
    },
  });
}

export function useInventario(id: number) {
  return useQuery({
    queryKey: almacenamientoKeys.inventario(id),
    queryFn: async () => {
      const response = await almacenamientoApi.inventario.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInventarioDTO) => {
      const response = await almacenamientoApi.inventario.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.inventarios() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.estadisticas() });
      toast.success('Inventario creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear inventario');
    },
  });
}

export function useUpdateInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInventarioDTO }) => {
      const response = await almacenamientoApi.inventario.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.inventarios() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.inventario(id) });
      toast.success('Inventario actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar inventario');
    },
  });
}

export function useDeleteInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await almacenamientoApi.inventario.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.inventarios() });
      toast.success('Inventario eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar inventario');
    },
  });
}

export function useStockBajo() {
  return useQuery({
    queryKey: almacenamientoKeys.stockBajo(),
    queryFn: async () => {
      const response = await almacenamientoApi.inventario.stockBajo();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useStockCritico() {
  return useQuery({
    queryKey: almacenamientoKeys.stockCritico(),
    queryFn: async () => {
      const response = await almacenamientoApi.inventario.stockCritico();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useStockPorVencer(dias: number = 30) {
  return useQuery({
    queryKey: almacenamientoKeys.stockPorVencer(dias),
    queryFn: async () => {
      const response = await almacenamientoApi.inventario.porVencer(dias);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== MOVIMIENTOS DE INVENTARIO ====================

export function useMovimientosInventario(params?: Record<string, any>) {
  return useQuery({
    queryKey: params ? almacenamientoKeys.movimientosFiltered(params) : almacenamientoKeys.movimientos(),
    queryFn: async () => {
      const response = await almacenamientoApi.movimiento.getAll(params);
      return response.data;
    },
  });
}

export function useMovimientoInventario(id: number) {
  return useQuery({
    queryKey: almacenamientoKeys.movimiento(id),
    queryFn: async () => {
      const response = await almacenamientoApi.movimiento.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateMovimientoInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMovimientoInventarioDTO) => {
      const response = await almacenamientoApi.movimiento.registrarMovimiento(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.movimientos() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.inventarios() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.estadisticas() });
      toast.success('Movimiento de inventario registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al registrar movimiento');
    },
  });
}

export function useUpdateMovimientoInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateMovimientoInventarioDTO }) => {
      // The API doesn't have an update endpoint for movimientos
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.movimientos() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.movimiento(id) });
      toast.success('Movimiento actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar movimiento');
    },
  });
}

export function useDeleteMovimientoInventario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // The API doesn't have a delete endpoint for movimientos
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.movimientos() });
      toast.success('Movimiento eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar movimiento');
    },
  });
}

// ==================== KARDEX ====================

export function useKardex(params: ConsultaKardexParams) {
  return useQuery({
    queryKey: almacenamientoKeys.kardex(params),
    queryFn: async () => {
      const response = await almacenamientoApi.kardex.consultar(params);
      return response.data;
    },
    enabled: !!params.inventario_id,
  });
}

export function useKardexPorProducto(inventarioId: number, params?: Record<string, any>) {
  return useQuery({
    queryKey: almacenamientoKeys.kardexPorProducto(inventarioId, params),
    queryFn: async () => {
      const response = await almacenamientoApi.kardex.getByInventario(inventarioId, params);
      return response.data;
    },
    enabled: !!inventarioId,
  });
}

// ==================== ALERTAS DE STOCK ====================

export function useAlertasStock(params?: Record<string, any>) {
  return useQuery({
    queryKey: params ? almacenamientoKeys.alertasFiltered(params) : almacenamientoKeys.alertas(),
    queryFn: async () => {
      const response = await almacenamientoApi.alerta.getAll(params);
      return response.data;
    },
  });
}

export function useAlertaStock(id: number) {
  return useQuery({
    queryKey: almacenamientoKeys.alerta(id),
    queryFn: async () => {
      const response = await almacenamientoApi.alerta.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useMarcarAlertaLeida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await almacenamientoApi.alerta.marcarLeida(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertas() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alerta(id) });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertasNoLeidas() });
      toast.success('Alerta marcada como leída');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al marcar alerta como leída');
    },
  });
}

export function useResolverAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones?: string }) => {
      const response = await almacenamientoApi.alerta.resolver(id, observaciones);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertas() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alerta(id) });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertasNoLeidas() });
      toast.success('Alerta resuelta exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al resolver alerta');
    },
  });
}

export function useGenerarAlertas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await almacenamientoApi.alerta.generarAlertas();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertas() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.alertasNoLeidas() });
      toast.success(`${data.alertas_generadas} alertas generadas`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al generar alertas');
    },
  });
}

export function useAlertasNoLeidas() {
  return useQuery({
    queryKey: almacenamientoKeys.alertasNoLeidas(),
    queryFn: async () => {
      const response = await almacenamientoApi.alerta.noLeidas();
      return response.data;
    },
    refetchInterval: 60000, // Refrescar cada minuto
    staleTime: 30000, // 30 segundos
  });
}

// ==================== CONFIGURACIONES DE STOCK ====================

export function useConfiguracionesStock(params?: Record<string, any>) {
  return useQuery({
    queryKey: params ? almacenamientoKeys.configuracionesFiltered(params) : almacenamientoKeys.configuraciones(),
    queryFn: async () => {
      const response = await almacenamientoApi.configuracion.getAll(params);
      return response.data;
    },
  });
}

export function useConfiguracionStock(id: number) {
  return useQuery({
    queryKey: almacenamientoKeys.configuracion(id),
    queryFn: async () => {
      const response = await almacenamientoApi.configuracion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateConfiguracionStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateConfiguracionStockDTO) => {
      const response = await almacenamientoApi.configuracion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.configuraciones() });
      toast.success('Configuración de stock creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear configuración');
    },
  });
}

export function useUpdateConfiguracionStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateConfiguracionStockDTO }) => {
      const response = await almacenamientoApi.configuracion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.configuraciones() });
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.configuracion(id) });
      toast.success('Configuración de stock actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar configuración');
    },
  });
}

export function useDeleteConfiguracionStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await almacenamientoApi.configuracion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenamientoKeys.configuraciones() });
      toast.success('Configuración de stock eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar configuración');
    },
  });
}

// ==================== ESTADÍSTICAS ====================

export function useEstadisticasAlmacenamiento() {
  return useQuery({
    queryKey: almacenamientoKeys.estadisticas(),
    queryFn: async () => {
      const response = await almacenamientoApi.estadisticas();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
