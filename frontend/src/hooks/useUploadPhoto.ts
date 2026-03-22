/**
 * Hook para subir foto de perfil — Compartido entre módulos
 *
 * Extraído de features/perfil/hooks/useUploadPhoto.ts para evitar
 * imports cruzados (mi-portal → perfil).
 * Invalida miPortalKeys.perfil() para que Mi Portal refleje el cambio.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  const refreshUserProfile = useAuthStore((s) => s.refreshUserProfile);

  return useMutation({
    mutationFn: async (file: File) => {
      return authAPI.uploadPhoto(file);
    },
    onSuccess: () => {
      refreshUserProfile();
      queryClient.invalidateQueries({ queryKey: ['mi-portal', 'perfil'] });
      toast.success('Foto de perfil actualizada exitosamente');
    },
    onError: (error: unknown) => {
      let errorMessage = 'Error al subir la foto de perfil';
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as Record<string, unknown>;
        const photo = data.photo;
        if (Array.isArray(photo) && typeof photo[0] === 'string') {
          errorMessage = photo[0];
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
      }
      toast.error(errorMessage);
    },
  });
};
