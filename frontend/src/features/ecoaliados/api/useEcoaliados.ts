import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ecoaliadosAPI } from './ecoaliadosApi';
import axiosInstance from '@/api/axios-config';
import toast from 'react-hot-toast';
import type {
  EcoaliadoFilters,
  CreateEcoaliadoDTO,
  UpdateEcoaliadoDTO,
  CambiarPrecioEcoaliadoDTO,
} from '../types/ecoaliado.types';

// ==================== ECOALIADOS ====================

export const useEcoaliados = (filters?: EcoaliadoFilters) => {
  return useQuery({
    queryKey: ['ecoaliados', filters],
    queryFn: () => ecoaliadosAPI.getEcoaliados(filters),
  });
};

export const useEcoaliado = (id: number) => {
  return useQuery({
    queryKey: ['ecoaliado', id],
    queryFn: () => ecoaliadosAPI.getEcoaliado(id),
    enabled: !!id,
  });
};

export const useCreateEcoaliado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEcoaliadoDTO) => ecoaliadosAPI.createEcoaliado(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecoaliados'] });
      toast.success('Ecoaliado creado exitosamente');
    },
    onError: (error: any) => {
      // Manejar errores de validación de campos específicos
      const errorData = error.response?.data;

      if (errorData && typeof errorData === 'object') {
        // Si hay errores específicos por campo
        if (errorData.documento_numero) {
          toast.error(
            `Número de documento: ${
              Array.isArray(errorData.documento_numero)
                ? errorData.documento_numero[0]
                : errorData.documento_numero
            }`
          );
          return;
        }
        if (errorData.email) {
          toast.error(
            `Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`
          );
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
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear el ecoaliado';
      toast.error(message);
    },
  });
};

export const useUpdateEcoaliado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEcoaliadoDTO }) =>
      ecoaliadosAPI.updateEcoaliado(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ecoaliados'] });
      queryClient.invalidateQueries({ queryKey: ['ecoaliado', variables.id] });
      toast.success('Ecoaliado actualizado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al actualizar el ecoaliado';
      toast.error(message);
    },
  });
};

export const useDeleteEcoaliado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ecoaliadosAPI.deleteEcoaliado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecoaliados'] });
      toast.success('Ecoaliado eliminado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al eliminar el ecoaliado';
      toast.error(message);
    },
  });
};

export const useToggleEcoaliadoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      ecoaliadosAPI.toggleEcoaliadoStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecoaliados'] });
      toast.success('Estado del ecoaliado actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al cambiar el estado del ecoaliado');
    },
  });
};

// ==================== GESTIÓN DE PRECIOS ====================

export const useCambiarPrecio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CambiarPrecioEcoaliadoDTO }) =>
      ecoaliadosAPI.cambiarPrecio(id, data),
    onSuccess: async (_, variables) => {
      // Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({
        queryKey: ['ecoaliados'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['ecoaliado', variables.id],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['historial-precios', variables.id],
        refetchType: 'active',
      });

      // Forzar refetch de la lista de ecoaliados
      await queryClient.refetchQueries({ queryKey: ['ecoaliados'] });

      toast.success('Precio actualizado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al cambiar el precio';
      toast.error(message);
    },
  });
};

export const useHistorialPrecios = (id: number) => {
  return useQuery({
    queryKey: ['historial-precios', id],
    queryFn: () => ecoaliadosAPI.getHistorialPrecios(id),
    enabled: !!id,
  });
};

/**
 * Hook para obtener lista de comerciales para asignar a ecoaliados
 */
export const useComerciales = () => {
  return useQuery({
    queryKey: ['comerciales'],
    queryFn: async () => {
      const response = await axiosInstance.get('/core/users/comerciales/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// ==================== UNIDADES DE NEGOCIO ====================

export const useUnidadesNegocio = () => {
  return useQuery({
    queryKey: ['unidades-negocio-ecoaliados'],
    queryFn: () => ecoaliadosAPI.getUnidadesNegocio(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

