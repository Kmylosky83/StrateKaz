/**
 * Hooks para gestión de Cargos en Dirección Estratégica
 *
 * Consume el endpoint /api/core/cargos-rbac/ para visualización
 * organizacional (organigrama y jerarquía)
 */
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-config';

// Tipos inline para evitar dependencia circular
interface Cargo {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  area?: string;
  area_display?: string;
  parent_cargo?: number;
  parent_cargo_name?: string;
  is_system: boolean;
  is_active: boolean;
  users_count: number;
  default_roles_count?: number;
}

interface CargoFilters {
  is_active?: boolean;
  level?: number;
  area?: string;
  search?: string;
}

interface PaginatedCargosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cargo[];
}

/**
 * Construye query string desde filtros
 */
function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

/**
 * Hook para obtener lista de cargos
 */
export function useCargos(filters?: CargoFilters) {
  return useQuery({
    queryKey: ['cargos-organizacion', filters],
    queryFn: async () => {
      const queryString = filters ? buildQueryString(filters) : '';
      const url = queryString ? `/core/cargos-rbac/?${queryString}` : '/core/cargos-rbac/';
      const response = await axiosInstance.get<PaginatedCargosResponse>(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un cargo específico
 */
export function useCargo(id: number | null) {
  return useQuery({
    queryKey: ['cargo-organizacion', id],
    queryFn: async () => {
      const response = await axiosInstance.get<Cargo>(`/core/cargos-rbac/${id}/`);
      return response.data;
    },
    enabled: id !== null,
  });
}

/**
 * Hook para obtener niveles de cargo
 */
export function useCargoLevels() {
  return useQuery({
    queryKey: ['cargo-levels-organizacion'],
    queryFn: async () => {
      const response = await axiosInstance.get('/core/cargos-rbac/levels/');
      return response.data;
    },
    staleTime: Infinity, // No cambian
  });
}

/**
 * Hook para obtener áreas de cargo
 */
export function useCargoAreas() {
  return useQuery({
    queryKey: ['cargo-areas-organizacion'],
    queryFn: async () => {
      const response = await axiosInstance.get('/core/cargos-rbac/areas/');
      return response.data;
    },
    staleTime: Infinity, // No cambian frecuentemente
  });
}
