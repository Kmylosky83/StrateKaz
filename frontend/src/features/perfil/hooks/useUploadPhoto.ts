/**
 * Hook para subir foto de perfil
 */
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

export const useUploadPhoto = () => {
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      return authAPI.uploadPhoto(file);
    },
    onSuccess: (data) => {
      // Actualizar foto en el store
      if (user) {
        setUser({ ...user, photo_url: data.photo_url });
      }
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
