/**
 * Hook para subir foto de perfil
 * Invalida miPortalKeys.perfil() para que el hero de Mi Portal refleje el cambio inmediatamente.
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
      // Refrescar user en el store (authStore)
      refreshUserProfile();
      // Invalida la cache del perfil ESS para que Mi Portal refleje la nueva foto
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
