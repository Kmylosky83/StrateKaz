/**
 * Hooks de React Query para el modulo de Recepciones
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recepcionesAPI } from './recepcionesApi';
import toast from 'react-hot-toast';
import type {
  RecepcionFilters,
  IniciarRecepcionDTO,
  RegistrarPesajeDTO,
  ConfirmarRecepcionDTO,
  CancelarRecepcionDTO,
} from '../types/recepcion.types';

const QUERY_KEY = 'recepciones';

// ==================== QUERIES ====================

/**
 * Hook para obtener lista de recepciones con filtros
 */
export const useRecepciones = (filters: RecepcionFilters = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => recepcionesAPI.getRecepciones(filters),
  });
};

/**
 * Hook para obtener detalle de una recepcion
 */
export const useRecepcion = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => recepcionesAPI.getRecepcion(id!),
    enabled: !!id,
  });
};

/**
 * Hook para obtener recolecciones pendientes de recepcion
 * Recolecciones completadas sin recepcion asociada
 */
export const useRecoleccionesPendientes = (
  recolectorId?: number,
  fechaDesde?: string,
  fechaHasta?: string
) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'pendientes', recolectorId, fechaDesde, fechaHasta],
    queryFn: () =>
      recepcionesAPI.getRecoleccionesPendientes(recolectorId, fechaDesde, fechaHasta),
  });
};

/**
 * Hook para obtener estadisticas de recepciones
 */
export const useEstadisticasRecepciones = (fechaDesde?: string, fechaHasta?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'estadisticas', fechaDesde, fechaHasta],
    queryFn: () => recepcionesAPI.getEstadisticas(fechaDesde, fechaHasta),
  });
};

/**
 * Hook para obtener recepciones de un recolector especifico
 */
export const useRecepcionesPorRecolector = (
  recolectorId: number | null,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'por-recolector', recolectorId, page, pageSize],
    queryFn: () => recepcionesAPI.getRecepcionesPorRecolector(recolectorId!, page, pageSize),
    enabled: !!recolectorId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Hook para iniciar una nueva recepcion
 * Agrupa varias recolecciones de un recolector en una sola recepcion
 */
export const useIniciarRecepcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IniciarRecepcionDTO) => recepcionesAPI.iniciarRecepcion(data),
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['recolecciones'] });
      toast.success(response.message || 'Recepcion iniciada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al iniciar la recepcion';
      toast.error(message);
    },
  });
};

/**
 * Hook para registrar pesaje en bascula
 * Calcula la merma automaticamente
 */
export const useRegistrarPesaje = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RegistrarPesajeDTO }) =>
      recepcionesAPI.registrarPesaje(id, data),
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(response.message || 'Pesaje registrado exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al registrar el pesaje';
      toast.error(message);
    },
  });
};

/**
 * Hook para confirmar recepcion y aplicar prorrateo de merma
 * Actualiza las recolecciones con los pesos reales
 */
export const useConfirmarRecepcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: ConfirmarRecepcionDTO }) =>
      recepcionesAPI.confirmarRecepcion(id, data),
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['recolecciones'] });
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      toast.success(response.message || 'Recepcion confirmada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al confirmar la recepcion';
      toast.error(message);
    },
  });
};

/**
 * Hook para cancelar una recepcion
 * Solo se pueden cancelar recepciones en estado INICIADA o PESADA
 */
export const useCancelarRecepcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelarRecepcionDTO }) =>
      recepcionesAPI.cancelarRecepcion(id, data),
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['recolecciones'] });
      toast.success(response.message || 'Recepcion cancelada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al cancelar la recepcion';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar (soft delete) una recepcion
 * Solo se pueden eliminar recepciones en estado INICIADA o CANCELADA
 */
export const useEliminarRecepcion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recepcionesAPI.deleteRecepcion(id),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Recepcion eliminada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al eliminar la recepcion';
      toast.error(message);
    },
  });
};
