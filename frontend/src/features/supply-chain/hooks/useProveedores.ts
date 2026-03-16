/**
 * Hooks React Query para Proveedores - Gestión de Proveedores
 * Sistema de gestión de proveedores y precios
 *
 * ALINEADO con backend ViewSet url_path (kebab-case)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import proveedoresApi from '../api/proveedores.api';
import type {
  CreateProveedorDTO,
  UpdateProveedorDTO,
  CambiarPrecioDTO,
  CreateCondicionComercialDTO,
  UpdateCondicionComercialDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const proveedoresKeys = {
  all: ['supply-chain', 'proveedores'] as const,

  // Proveedores
  proveedores: () => [...proveedoresKeys.all, 'list'] as const,
  proveedoresFiltered: (filters: Record<string, unknown>) =>
    [...proveedoresKeys.proveedores(), 'filtered', filters] as const,
  proveedor: (id: number) => [...proveedoresKeys.all, 'detail', id] as const,
  estadisticas: () => [...proveedoresKeys.all, 'estadisticas'] as const,

  // Precios e Historial
  historialPrecio: (proveedorId: number) =>
    [...proveedoresKeys.all, 'historial-precio', proveedorId] as const,

  // Condiciones Comerciales
  condiciones: () => [...proveedoresKeys.all, 'condiciones-comerciales'] as const,
  condicionesPorProveedor: (proveedorId: number) =>
    [...proveedoresKeys.condiciones(), 'proveedor', proveedorId] as const,
};

// ==================== PROVEEDORES ====================

export function useProveedores(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  tipo_proveedor?: number;
  tipo_materia_prima?: number;
  categoria_materia_prima?: number;
  modalidad_logistica?: number;
  departamento?: number;
  forma_pago?: number;
  is_active?: boolean;
  es_materia_prima?: boolean;
  ordering?: string;
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
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al crear proveedor');
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
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al actualizar proveedor');
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
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al eliminar proveedor');
    },
  });
}

export function useRestoreProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proveedoresApi.proveedor.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success('Proveedor restaurado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al restaurar proveedor');
    },
  });
}

// ==================== ACTIVAR/DESACTIVAR ====================

export function useToggleActivoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      proveedoresApi.proveedor.toggleActivo(id, is_active),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedor(id) });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success('Estado del proveedor actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al cambiar estado del proveedor');
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
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.historialPrecio(id) });
      toast.success('Precio actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al cambiar precio');
    },
  });
}

/**
 * Obtener historial de precios + precios actuales de un proveedor
 * Usa el endpoint /proveedores/{id}/historial-precio/
 */
export function useHistorialPrecio(proveedorId: number) {
  return useQuery({
    queryKey: proveedoresKeys.historialPrecio(proveedorId),
    queryFn: () => proveedoresApi.proveedor.getHistorialPrecio(proveedorId),
    enabled: !!proveedorId,
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
    queryKey: params
      ? proveedoresKeys.condicionesPorProveedor(params.proveedor!)
      : proveedoresKeys.condiciones(),
    queryFn: () => proveedoresApi.condicionComercial.getAll(params),
    enabled: params?.proveedor ? !!params.proveedor : true,
  });
}

export function useCreateCondicionComercial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCondicionComercialDTO) =>
      proveedoresApi.condicionComercial.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.condiciones() });
      queryClient.invalidateQueries({
        queryKey: proveedoresKeys.condicionesPorProveedor(data.proveedor),
      });
      toast.success('Condición comercial creada exitosamente');
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al crear condición comercial');
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
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al actualizar condición comercial');
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
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al eliminar condición comercial');
    },
  });
}

// ==================== CREAR ACCESO ====================

export function useCrearAccesoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      email,
      username,
      cargo_id,
    }: {
      id: number;
      email: string;
      username: string;
      cargo_id?: number;
    }) => {
      const payload: { email: string; username: string; cargo_id?: number } = { email, username };
      if (cargo_id) payload.cargo_id = cargo_id;
      return proveedoresApi.proveedor.crearAcceso(id, payload);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedor(id) });
      toast.success('Acceso al sistema creado. Se envió un correo para configurar la contraseña.');
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { data?: Record<string, unknown> };
      };
      const data = apiError?.response?.data;
      // Extraer detail o errores de campo (DRF devuelve {"campo": ["error"]})
      if (data?.detail) {
        toast.error(String(data.detail));
      } else if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        toast.error(msgs || 'Error al crear acceso al sistema');
      } else {
        toast.error('Error al crear acceso al sistema');
      }
    },
  });
}

// ==================== PLANTILLA E IMPORTACIÓN ====================

export function useDescargarPlantilla() {
  return useMutation({
    mutationFn: () => proveedoresApi.proveedor.getPlantillaImportacion(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-proveedores.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Plantilla descargada exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar plantilla');
    },
  });
}

export function useImportarProveedores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => proveedoresApi.proveedor.importar(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.proveedores() });
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.estadisticas() });
      toast.success(`${result.importados} proveedores importados exitosamente`);
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError?.response?.data?.detail || 'Error al importar proveedores');
    },
  });
}
