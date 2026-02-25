/**
 * Hook para cambio de contraseña — Compartido entre módulos
 *
 * Extraído de features/users/hooks/useUsers.ts para evitar
 * imports cruzados (perfil → users).
 */
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersAPI } from '@/api/users.api';
import type { ChangePasswordDTO } from '@/types/users.types';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePasswordDTO }) =>
      usersAPI.changePassword(id, data),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(message);
    },
  });
};
