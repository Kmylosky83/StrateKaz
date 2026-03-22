/**
 * Hook para actualizar el perfil del usuario autenticado
 *
 * Features:
 * - Mutation con TanStack Query para actualización de perfil
 * - Actualiza authStore automáticamente con datos del servidor
 * - Toast notifications para éxito/error
 * - Invalidación de queries relacionadas
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { User } from '@/types/auth.types';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => authAPI.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Actualizar authStore con datos del servidor
      setUser(updatedUser);

      // Invalidar queries relacionadas (si existen)
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });

      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Error al actualizar perfil';

      toast.error(errorMessage);
    },
  });
};
