/**
 * Hooks de React Query para el modulo de Recolecciones
 * Sistema de Gestion Grasas y Huesos del Norte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recoleccionesAPI } from './recoleccionesApi';
import toast from 'react-hot-toast';
import type {
  RecoleccionFilters,
  RegistrarRecoleccionDTO,
} from '../types/recoleccion.types';

const QUERY_KEY = 'recolecciones';

// ==================== QUERIES ====================

/**
 * Hook para obtener lista de recolecciones con filtros
 */
export const useRecolecciones = (filters: RecoleccionFilters = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => recoleccionesAPI.getRecolecciones(filters),
  });
};

/**
 * Hook para obtener detalle de una recoleccion
 */
export const useRecoleccion = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => recoleccionesAPI.getRecoleccion(id!),
    enabled: !!id,
  });
};

/**
 * Hook para obtener estadisticas de recolecciones
 */
export const useEstadisticasRecolecciones = (
  fechaDesde?: string,
  fechaHasta?: string
) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'estadisticas', fechaDesde, fechaHasta],
    queryFn: () => recoleccionesAPI.getEstadisticas(fechaDesde, fechaHasta),
  });
};

/**
 * Hook para obtener programaciones EN_RUTA disponibles para registrar recoleccion
 */
export const useProgramacionesEnRuta = () => {
  return useQuery({
    queryKey: [QUERY_KEY, 'programaciones-en-ruta'],
    queryFn: () => recoleccionesAPI.getProgramacionesEnRuta(),
  });
};

/**
 * Hook para obtener datos del voucher de una recoleccion
 */
export const useVoucherRecoleccion = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'voucher', id],
    queryFn: () => recoleccionesAPI.getVoucher(id!),
    enabled: !!id,
  });
};

/**
 * Hook para obtener recolecciones del recolector actual
 */
export const useMisRecolecciones = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'mis-recolecciones', page, pageSize],
    queryFn: () => recoleccionesAPI.getMisRecolecciones(page, pageSize),
  });
};

/**
 * Hook para obtener recolecciones de un ecoaliado especifico
 */
export const useRecoleccionesPorEcoaliado = (
  ecoaliadoId: number | null,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'por-ecoaliado', ecoaliadoId, page, pageSize],
    queryFn: () => recoleccionesAPI.getRecoleccionesPorEcoaliado(ecoaliadoId!, page, pageSize),
    enabled: !!ecoaliadoId,
  });
};

// ==================== MUTATIONS ====================

/**
 * Hook para registrar una nueva recoleccion desde una programacion EN_RUTA
 */
export const useRegistrarRecoleccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegistrarRecoleccionDTO) => recoleccionesAPI.registrarRecoleccion(data),
    onSuccess: (response) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success(response.message || 'Recoleccion registrada exitosamente');
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      const message = error.response?.data?.detail || 'Error al registrar la recoleccion';
      toast.error(message);
    },
  });
};
