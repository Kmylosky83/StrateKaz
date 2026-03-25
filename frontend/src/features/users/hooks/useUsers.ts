import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/api/users.api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { UserFilters, UpdateUserDTO, ChangePasswordDTO } from '@/types/users.types';

export const useUsers = (filters?: UserFilters) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersAPI.getUsers(filters),
  });
};

export const useUser = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getUser(id),
    enabled: !!id && (options?.enabled ?? true),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDTO }) =>
      usersAPI.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });

      // Si se cambió el cargo, invalidar sidebar para que refleje los nuevos permisos
      if (variables.data.cargo_id !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['modules', 'sidebar'] });
        queryClient.invalidateQueries({ queryKey: ['modules', 'tree'] });
        // Invalidar lista de cargos para actualizar users_count (cargo anterior y nuevo)
        queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });

        // Si el usuario editado es el usuario logueado, refrescar su perfil
        const loggedUserId = useAuthStore.getState().user?.id;
        if (loggedUserId === variables.id) {
          useAuthStore.getState().refreshUserProfile();
        }
      }

      toast.success('Usuario actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Error al actualizar el usuario';
      toast.error(message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Usuario eliminado afecta users_count del cargo que tenía
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Error al eliminar el usuario';
      toast.error(message);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      usersAPI.toggleUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Activar/desactivar afecta users_count del cargo (filtra por is_active)
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: () => {
      toast.error('Error al cambiar el estado del usuario');
    },
  });
};

export const useCargos = () => {
  return useQuery({
    queryKey: ['cargos'],
    queryFn: () => usersAPI.getCargos(),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePasswordDTO }) =>
      usersAPI.changePassword(id, data),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(message);
    },
  });
};

/**
 * Hook genérico para obtener usuarios por código de cargo
 * @param cargoCode - Código del cargo a filtrar (opcional)
 * @param enabled - Si el query debe ejecutarse (default: true)
 */
export const useUsersByCargoCode = (cargoCode?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', cargoCode ? { cargo__code: cargoCode } : {}],
    queryFn: () => {
      if (!cargoCode) {
        return usersAPI.getUsers({});
      }
      return usersAPI.getUsers({ cargo__code: cargoCode });
    },
    enabled: enabled && !!cargoCode,
  });
};

/**
 * Hook para obtener usuarios con un permiso específico
 * @param permission - Código del permiso requerido
 * @param enabled - Si el query debe ejecutarse (default: true)
 */
export const useUsersByPermission = (permission: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['users', { has_permission: permission }],
    queryFn: () => usersAPI.getUsers({ has_permission: permission } as unknown),
    enabled: enabled && !!permission,
  });
};

/**
 * @deprecated Use useUsersByCargoCode('cargo_code') or useUsersByPermission('recolecciones.register') instead
 * Hook para obtener lista de recolectores - mantener por compatibilidad
 */
export const useRecolectores = () => {
  console.warn(
    'useRecolectores is deprecated. Use useUsersByCargoCode or useUsersByPermission instead.'
  );
  // Mantener funcionalidad básica - obtener todos los usuarios para no romper código existente
  return useQuery({
    queryKey: ['users', {}],
    queryFn: () => usersAPI.getUsers({}),
  });
};
