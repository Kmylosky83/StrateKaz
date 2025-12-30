/**
 * Hooks React Query para Proveedores - Gestión de Proveedores
 * Sistema de gestión de proveedores y precios
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import proveedoresApi from '../api/proveedores.api';
import type {
  Proveedor,
  ProveedorList,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  UnidadNegocio,
  CreateUnidadNegocioDTO,
  UpdateUnidadNegocioDTO,
  CambiarPrecioDTO,
  CondicionComercialProveedor,
  CreateCondicionComercialDTO,
  UpdateCondicionComercialDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const proveedoresKeys = {
  all: ['supply-chain', 'proveedores'] as const,

  // Proveedores
  proveedores: () => [...proveedoresKeys.all, 'list'] as const,
  proveedoresFiltered: (filters: Record<string, any>) => [...proveedoresKeys.proveedores(), 'filtered', filters] as const,
  proveedor: (id: number) => [...proveedoresKeys.all, 'detail', id] as const,
  estadisticas: () => [...proveedoresKeys.all, 'estadisticas'] as const,

  // Unidades de Negocio
  unidades: () => [...proveedoresKeys.all, 'unidades-negocio'] as const,
  unidad: (id: number) => [...proveedoresKeys.unidades(), id] as const,

  // Precios
  precios: (proveedorId: number) => [...proveedoresKeys.all, 'precios', proveedorId] as const,
  historialPrecios: (proveedorId: number) => [...proveedoresKeys.all, 'historial-precios', proveedorId] as const,

  // Condiciones Comerciales
  condiciones: () => [...proveedoresKeys.all, 'condiciones-comerciales'] as const,
  condicionesPorProveedor: (proveedorId: number) => [...proveedoresKeys.condiciones(), 'proveedor', proveedorId] as const,
};

// ==================== UNIDADES DE NEGOCIO ====================

export function useUnidadesNegocio(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: params ? proveedoresKeys.unidades() : proveedoresKeys.unidades(),
    queryFn: () => (params?.is_active ? proveedoresApi.unidadNegocio.getActivas() : proveedoresApi.unidadNegocio.getAll()),
  });
}

export function useUnidadNegocio(id: number) {
  return useQuery({
    queryKey: proveedoresKeys.unidad(id),
    queryFn: () => proveedoresApi.unidadNegocio.getById(id),
    enabled: !!id,
  });
}

export function useCreateUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnidadNegocioDTO) => proveedoresApi.unidadNegocio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.unidades() });
      toast.success('Unidad de negocio creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear unidad de negocio');
    },
  });
}

export function useUpdateUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnidadNegocioDTO }) =>
      proveedoresApi.unidadNegocio.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.unidades() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.unidad(id) });
      toast.success('Unidad de negocio actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar unidad de negocio');
    },
  });
}

export function useDeleteUnidadNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proveedoresApi.unidadNegocio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.unidades() });
      toast.success('Unidad de negocio eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar unidad de negocio');
    },
  });
}

// ==================== PROVEEDORES ====================

export function useProveedores(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_proveedor?: number;
  estado?: string;
  tipos_materia_prima?: number[];
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: params ? proveedoresKeys.proveedoresFiltered(params) : proveedoresKeys.proveedores(),
    queryFn: () => proveedoresApi.proveedor.getAll(params),
  });
}

export function useProveedor(id: number) {
  return useQuery({
    queryKey: proveedoresKeys.proveedor(id),
    queryFn: () => proveedoresApi.proveedor.getById(id),
    enabled: !!id,
  });
}

export function useCreateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProveedorDTO) => proveedoresApi.proveedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success('Proveedor creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear proveedor');
    },
  });
}

export function useUpdateProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProveedorDTO }) =>
      proveedoresApi.proveedor.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedor(id) });
      toast.success('Proveedor actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar proveedor');
    },
  });
}

export function useDeleteProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proveedoresApi.proveedor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success('Proveedor eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar proveedor');
    },
  });
}

// ==================== PRECIOS ====================

export function useCambiarPrecio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarPrecioDTO }) =>
      proveedoresApi.proveedor.cambiarPrecio(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedor(id) });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.precios(id) });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.historialPrecios(id) });
      toast.success('Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cambiar precio');
    },
  });
}

export function usePreciosActuales(proveedorId: number) {
  return useQuery({
    queryKey: proveedoresKeys.precios(proveedorId),
    queryFn: () => proveedoresApi.proveedor.getPreciosActuales(proveedorId),
    enabled: !!proveedorId,
  });
}

export function useHistorialPrecios(proveedorId: number, params?: { tipo_materia_prima?: number; limit?: number }) {
  return useQuery({
    queryKey: proveedoresKeys.historialPrecios(proveedorId),
    queryFn: () => proveedoresApi.proveedor.getHistorialPrecios(proveedorId, params),
    enabled: !!proveedorId,
  });
}

// ==================== CAMBIAR ESTADO ====================

export function useCambiarEstadoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, motivo }: { id: number; estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO'; motivo?: string }) =>
      proveedoresApi.proveedor.cambiarEstado(id, estado, motivo),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedor(id) });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success('Estado del proveedor actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al cambiar estado del proveedor');
    },
  });
}

// ==================== ESTADÍSTICAS ====================

export function useEstadisticasProveedores() {
  return useQuery({
    queryKey: proveedoresKeys.estadisticas(),
    queryFn: () => proveedoresApi.proveedor.getEstadisticas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== CONDICIONES COMERCIALES ====================

export function useCondicionesComerciales(params?: { proveedor?: number; vigente?: boolean }) {
  return useQuery({
    queryKey: params ? proveedoresKeys.condicionesPorProveedor(params.proveedor!) : proveedoresKeys.condiciones(),
    queryFn: () => proveedoresApi.condicionComercial.getAll(params),
    enabled: params?.proveedor ? !!params.proveedor : true,
  });
}

export function useCreateCondicionComercial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCondicionComercialDTO) => proveedoresApi.condicionComercial.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.condiciones() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.condicionesPorProveedor(data.proveedor) });
      toast.success('Condición comercial creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al crear condición comercial');
    },
  });
}

export function useUpdateCondicionComercial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCondicionComercialDTO }) =>
      proveedoresApi.condicionComercial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.condiciones() });
      toast.success('Condición comercial actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al actualizar condición comercial');
    },
  });
}

export function useDeleteCondicionComercial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proveedoresApi.condicionComercial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.condiciones() });
      toast.success('Condición comercial eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Error al eliminar condición comercial');
    },
  });
}

// ==================== EXPORTAR ====================

export function useExportProveedores() {
  return useMutation({
    mutationFn: (params?: Record<string, any>) => proveedoresApi.proveedor.exportExcel(params),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proveedores-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Archivo descargado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar proveedores');
    },
  });
}
