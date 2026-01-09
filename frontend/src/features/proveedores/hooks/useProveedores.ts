import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresAPI } from '@/api/proveedores.api';
import { toast } from 'sonner';
import type {
  ProveedorFilters,
  CreateProveedorDTO,
  UpdateProveedorDTO,
  CambiarPrecioDTO,
  PruebaAcidezFilters,
  CreatePruebaAcidezDTO,
} from '@/types/proveedores.types';

// ==================== PROVEEDORES ====================

export const useProveedores = (filters?: ProveedorFilters) => {
  return useQuery({
    queryKey: ['proveedores', filters],
    queryFn: () => proveedoresAPI.getProveedores(filters),
  });
};

export const useProveedor = (id: number) => {
  return useQuery({
    queryKey: ['proveedor', id],
    queryFn: () => proveedoresAPI.getProveedor(id),
    enabled: !!id,
  });
};

export const useCreateProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProveedorDTO) => proveedoresAPI.createProveedor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor creado exitosamente');
    },
    onError: (error: any) => {
      // Manejar errores de validación de campos específicos
      const errorData = error.response?.data;

      if (errorData && typeof errorData === 'object') {
        // Si hay errores específicos por campo
        if (errorData.numero_documento) {
          toast.error(`Número de documento: ${Array.isArray(errorData.numero_documento) ? errorData.numero_documento[0] : errorData.numero_documento}`);
          return;
        }
        if (errorData.nit) {
          toast.error(`NIT: ${Array.isArray(errorData.nit) ? errorData.nit[0] : errorData.nit}`);
          return;
        }
        if (errorData.email) {
          toast.error(`Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`);
          return;
        }

        // Mensaje genérico si hay otros campos con error
        const firstError = Object.values(errorData)[0];
        if (firstError) {
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(`Error: ${errorMsg}`);
          return;
        }
      }

      // Mensaje genérico
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear el proveedor';
      toast.error(message);
    },
  });
};

export const useUpdateProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProveedorDTO }) =>
      proveedoresAPI.updateProveedor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['proveedor', variables.id] });
      toast.success('Proveedor actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al actualizar el proveedor';
      toast.error(message);
    },
  });
};

export const useDeleteProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => proveedoresAPI.deleteProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor eliminado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al eliminar el proveedor';
      toast.error(message);
    },
  });
};

export const useRestoreProveedor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => proveedoresAPI.restoreProveedor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor restaurado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al restaurar el proveedor';
      toast.error(message);
    },
  });
};

export const useToggleProveedorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      proveedoresAPI.toggleProveedorStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Estado del proveedor actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al cambiar el estado del proveedor');
    },
  });
};

// ==================== GESTIÓN DE PRECIOS ====================

export const useCambiarPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarPrecioDTO }) =>
      proveedoresAPI.cambiarPrecio(id, data),
    onSuccess: async (_, variables) => {
      // Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({ queryKey: ['proveedores'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['proveedor', variables.id], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['historial-precio', variables.id], refetchType: 'active' });

      // Forzar refetch de la lista de proveedores
      await queryClient.refetchQueries({ queryKey: ['proveedores'] });

      toast.success('Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al cambiar el precio';
      toast.error(message);
    },
  });
};

export const useHistorialPrecio = (id: number) => {
  return useQuery({
    queryKey: ['historial-precio', id],
    queryFn: () => proveedoresAPI.getHistorialPrecio(id),
    enabled: !!id,
  });
};

// ==================== CONDICIONES COMERCIALES ====================

export const useCondicionesComerciales = (proveedorId?: number) => {
  return useQuery({
    queryKey: ['condiciones-comerciales', proveedorId],
    queryFn: () => proveedoresAPI.getCondicionesComerciales(proveedorId),
    enabled: !!proveedorId,
  });
};

// ==================== PRUEBAS DE ACIDEZ ====================

export const usePruebasAcidez = (filters?: PruebaAcidezFilters) => {
  return useQuery({
    queryKey: ['pruebas-acidez', filters],
    queryFn: () => proveedoresAPI.getPruebasAcidez(filters),
  });
};

export const usePruebaAcidez = (id: number) => {
  return useQuery({
    queryKey: ['prueba-acidez', id],
    queryFn: () => proveedoresAPI.getPruebaAcidez(id),
    enabled: !!id,
  });
};

export const usePruebasAcidezPorProveedor = (
  proveedorId: number,
  filters?: Omit<PruebaAcidezFilters, 'proveedor'>
) => {
  return useQuery({
    queryKey: ['pruebas-acidez-proveedor', proveedorId, filters],
    queryFn: () => proveedoresAPI.getPruebasAcidezPorProveedor(proveedorId, filters),
    enabled: !!proveedorId,
  });
};

export const useCreatePruebaAcidez = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePruebaAcidezDTO) => proveedoresAPI.createPruebaAcidez(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pruebas-acidez'] });
      toast.success('Prueba de acidez registrada exitosamente');
    },
    onError: (error: any) => {
      const errorData = error.response?.data;

      if (errorData && typeof errorData === 'object') {
        if (errorData.proveedor) {
          toast.error(`Proveedor: ${Array.isArray(errorData.proveedor) ? errorData.proveedor[0] : errorData.proveedor}`);
          return;
        }
        if (errorData.valor_acidez) {
          toast.error(`Acidez: ${Array.isArray(errorData.valor_acidez) ? errorData.valor_acidez[0] : errorData.valor_acidez}`);
          return;
        }
        if (errorData.foto_prueba) {
          toast.error(`Foto: ${Array.isArray(errorData.foto_prueba) ? errorData.foto_prueba[0] : errorData.foto_prueba}`);
          return;
        }

        const firstError = Object.values(errorData)[0];
        if (firstError) {
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(`Error: ${errorMsg}`);
          return;
        }
      }

      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al registrar la prueba de acidez';
      toast.error(message);
    },
  });
};

export const useDeletePruebaAcidez = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => proveedoresAPI.deletePruebaAcidez(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pruebas-acidez'] });
      toast.success('Prueba de acidez eliminada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al eliminar la prueba de acidez';
      toast.error(message);
    },
  });
};

export const useRestorePruebaAcidez = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => proveedoresAPI.restorePruebaAcidez(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pruebas-acidez'] });
      toast.success('Prueba de acidez restaurada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al restaurar la prueba de acidez';
      toast.error(message);
    },
  });
};

export const useEstadisticasAcidez = (filters?: {
  proveedor_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) => {
  return useQuery({
    queryKey: ['estadisticas-acidez', filters],
    queryFn: () => proveedoresAPI.getEstadisticasAcidez(filters),
  });
};
