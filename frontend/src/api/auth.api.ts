import axios from './axios-config';
import type { LoginCredentials, LoginResponse, User } from '@/types/auth.types';

export const authAPI = {
  /**
   * Iniciar sesión
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>('/auth/login/', credentials);
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<User> => {
    const response = await axios.get<User>('/core/users/me/');
    return response.data;
  },

  /**
   * Actualizar perfil del usuario
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axios.put<User>('/core/users/update_profile/', data);
    return response.data;
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await axios.post('/core/users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  /**
   * Refrescar token de acceso
   */
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await axios.post<{ access: string }>('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  /**
   * Cerrar sesión (P0-03: Invalida el refresh token en el servidor)
   * Esto agrega el token a la blacklist para que no pueda ser usado nuevamente
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await axios.post('/auth/logout/', { refresh: refreshToken });
    } catch (error) {
      // Si falla el logout en servidor (token ya inválido), continuamos
      // El cliente debe limpiar su estado de todas formas
      console.warn('Server logout failed (token may be expired):', error);
    }
  },

  /**
   * Subir foto de perfil
   */
  uploadPhoto: async (file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await axios.post<{ message: string; photo_url: string }>(
      '/core/users/upload_photo/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
