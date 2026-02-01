/**
 * Hooks para gestion de Riesgos Ocupacionales (SST)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-config';
import type {
  RiesgoOcupacional,
  RiesgoFilters,
  PaginatedRiesgosResponse,
  SelectOption,
} from '../types/rbac.types';

// API functions
const riesgosAPI = {
  getRiesgos: async (filters?: RiesgoFilters): Promise<PaginatedRiesgosResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/core/riesgos-ocupacionales/?${queryString}` : '/core/riesgos-ocupacionales/';
    const response = await axiosInstance.get<RiesgoOcupacional[] | PaginatedRiesgosResponse>(url);

    // El endpoint puede retornar array directo (sin paginacion) o paginado
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    return response.data;
  },

  getRiesgo: async (id: number): Promise<RiesgoOcupacional> => {
    const response = await axiosInstance.get<RiesgoOcupacional>(`/core/riesgos-ocupacionales/${id}/`);
    return response.data;
  },

  createRiesgo: async (data: Partial<RiesgoOcupacional>): Promise<RiesgoOcupacional> => {
    const response = await axiosInstance.post<RiesgoOcupacional>('/core/riesgos-ocupacionales/', data);
    return response.data;
  },

  updateRiesgo: async (id: number, data: Partial<RiesgoOcupacional>): Promise<RiesgoOcupacional> => {
    const response = await axiosInstance.patch<RiesgoOcupacional>(`/core/riesgos-ocupacionales/${id}/`, data);
    return response.data;
  },

  deleteRiesgo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/core/riesgos-ocupacionales/${id}/`);
  },

  getClasificaciones: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get<SelectOption[]>('/core/riesgos-ocupacionales/clasificaciones/');
    return response.data;
  },

  getNivelesRiesgo: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get<SelectOption[]>('/core/riesgos-ocupacionales/niveles-riesgo/');
    return response.data;
  },
};

/**
 * Hook para obtener lista de riesgos ocupacionales
 */
export function useRiesgosOcupacionales(filters?: RiesgoFilters) {
  return useQuery({
    queryKey: ['riesgos-ocupacionales', filters],
    queryFn: () => riesgosAPI.getRiesgos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un riesgo especifico
 */
export function useRiesgoOcupacional(id: number | null) {
  return useQuery({
    queryKey: ['riesgo-ocupacional', id],
    queryFn: () => riesgosAPI.getRiesgo(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un riesgo
 */
export function useCreateRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RiesgoOcupacional>) => riesgosAPI.createRiesgo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riesgos-ocupacionales'] });
    },
  });
}

/**
 * Hook para actualizar un riesgo
 */
export function useUpdateRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RiesgoOcupacional> }) =>
      riesgosAPI.updateRiesgo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['riesgos-ocupacionales'] });
      queryClient.invalidateQueries({ queryKey: ['riesgo-ocupacional', variables.id] });
    },
  });
}

/**
 * Hook para eliminar un riesgo
 */
export function useDeleteRiesgo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => riesgosAPI.deleteRiesgo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riesgos-ocupacionales'] });
    },
  });
}

/**
 * Hook para obtener clasificaciones GTC 45
 */
export function useClasificacionesRiesgo() {
  return useQuery({
    queryKey: ['clasificaciones-riesgo'],
    queryFn: () => riesgosAPI.getClasificaciones(),
    staleTime: Infinity,
  });
}

/**
 * Hook para obtener niveles de riesgo
 */
export function useNivelesRiesgo() {
  return useQuery({
    queryKey: ['niveles-riesgo'],
    queryFn: () => riesgosAPI.getNivelesRiesgo(),
    staleTime: Infinity,
  });
}
