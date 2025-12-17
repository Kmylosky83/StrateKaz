/**
 * Hooks para gestion de Permisos (solo lectura)
 */
import { useQuery } from '@tanstack/react-query';
import { rbacAPI } from '../api/rbac.api';
import type { PermissionFilters } from '../types/rbac.types';

/**
 * Hook para obtener lista de permisos
 */
export function usePermissions(filters?: PermissionFilters) {
  return useQuery({
    queryKey: ['permissions', filters],
    queryFn: () => rbacAPI.getPermissions(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos (los permisos no cambian frecuentemente)
  });
}

/**
 * Hook para obtener un permiso especifico
 */
export function usePermission(id: number | null) {
  return useQuery({
    queryKey: ['permission', id],
    queryFn: () => rbacAPI.getPermission(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para obtener permisos agrupados por modulo
 */
export function usePermissionsGrouped() {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: () => rbacAPI.getPermissionsGrouped(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener modulos disponibles
 */
export function usePermissionModules() {
  return useQuery({
    queryKey: ['permission-modules'],
    queryFn: () => rbacAPI.getPermissionModules(),
    staleTime: Infinity, // No cambian
  });
}

/**
 * Hook para obtener estadisticas RBAC
 */
export function useRBACStats() {
  return useQuery({
    queryKey: ['rbac-stats'],
    queryFn: () => rbacAPI.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
