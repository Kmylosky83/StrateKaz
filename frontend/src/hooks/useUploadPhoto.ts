/**
 * Hook para subir foto de perfil — Compartido entre módulos
 *
 * Extraído de features/perfil/hooks/useUploadPhoto.ts para evitar
 * imports cruzados (mi-portal → perfil).
 * Invalida miPortalKeys.perfil() para que Mi Portal refleje el cambio.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.photo?.[0] ||
        error?.response?.data?.detail ||
        'Error al subir la foto de perfil';
      toast.error(errorMessage);
    },
  });
};
