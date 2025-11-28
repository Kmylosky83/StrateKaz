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
};
