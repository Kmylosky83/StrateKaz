/**
 * Hooks para gestion de Grupos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacAPI } from '../api/rbac.api';
import type { GroupFilters, CreateGroupDTO, UpdateGroupDTO } from '../types/rbac.types';

/**
 * Hook para obtener lista de grupos
 */
export function useGroups(filters?: GroupFilters) {
  return useQuery({
    queryKey: ['groups', filters],
    queryFn: () => rbacAPI.getGroups(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un grupo especifico
 */
export function useGroup(id: number | null) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => rbacAPI.getGroup(id!),
    enabled: id !== null,
  });
}

/**
 * Hook para crear un grupo
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupDTO) => rbacAPI.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
    },
  });
}

/**
 * Hook para actualizar un grupo
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGroupDTO }) =>
      rbacAPI.updateGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
    },
  });
}

/**
 * Hook para eliminar un grupo
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rbacAPI.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
    },
  });
}

/**
 * Hook para agregar usuarios a grupo
 */
export function useAddUsersToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      user_ids,
      leader_id,
    }: {
      id: number;
      user_ids: number[];
      leader_id?: number;
    }) => rbacAPI.addUsersToGroup(id, user_ids, leader_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
    },
  });
}

/**
 * Hook para remover usuarios de grupo
 */
export function useRemoveUsersFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, user_ids }: { id: number; user_ids: number[] }) =>
      rbacAPI.removeUsersFromGroup(id, user_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
    },
  });
}

/**
 * Hook para asignar roles a grupo
 */
export function useAssignRolesToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      role_ids,
      replace = false,
    }: {
      id: number;
      role_ids: number[];
      replace?: boolean;
    }) => rbacAPI.assignRolesToGroup(id, role_ids, replace),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.id] });
    },
  });
}
