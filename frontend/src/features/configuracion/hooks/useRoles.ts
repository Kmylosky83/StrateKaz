/**
 * Hooks para gestion de Roles
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacAPI } from '../api/rbac.api';
import type { RoleFilters, CreateRoleDTO, UpdateRoleDTO } from '../types/rbac.types';

/**
 * Hook para obtener lista de roles
 */
export function useRoles(filters?: RoleFilters) {
  return useQuery({
    queryKey: ['roles', filters],
    queryFn: () => rbacAPI.getRoles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un rol especifico
 */
export function useRole(id: number | null) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => rbacAPI.getRole(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un rol
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleDTO) => rbacAPI.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
    },
  });
}

/**
 * Hook para actualizar un rol
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleDTO }) =>
      rbacAPI.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
    },
  });
}

/**
 * Hook para eliminar un rol
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rbacAPI.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
    },
  });
}

/**
 * Hook para asignar permisos a un rol
 */
export function useAssignPermissionsToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      permission_ids,
      replace = false,
    }: {
      id: number;
      permission_ids: number[];
      replace?: boolean;
    }) => rbacAPI.assignPermissionsToRole(id, permission_ids, replace),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
    },
  });
}

/**
 * Hook para remover permisos de un rol
 */
export function useRemovePermissionsFromRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permission_ids }: { id: number; permission_ids: number[] }) =>
      rbacAPI.removePermissionsFromRole(id, permission_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
    },
  });
}
