/**
 * Hook para cambio de contraseña — Compartido entre módulos
 *
 * Extraído de features/users/hooks/useUsers.ts para evitar
 * imports cruzados (perfil → users).
 */
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { usersAPI } from '@/api/users.api';
import type { ChangePasswordDTO } from '@/types/users.types';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePasswordDTO }) =>
      usersAPI.changePassword(id, data),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
    },
    onError: (error: unknown) => {
      let message = 'Error al cambiar la contraseña';
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as Record<string, unknown>;
        if (typeof data.current_password === 'string') {
          message = data.current_password;
        } else if (Array.isArray(data.current_password)) {
          message = String(data.current_password[0]);
        } else if (typeof data.message === 'string') {
          message = data.message;
        }
      }
      toast.error(message);
    },
  });
};
