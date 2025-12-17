import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/api/auth.api';
import { clearLastRoute } from '@/hooks/useLastRoute';
import type { AuthState, LoginCredentials, User } from '@/types/auth.types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        try {
          // Obtener tokens
          const { access, refresh } = await authAPI.login(credentials);

          // Guardar tokens en localStorage
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          // Obtener perfil del usuario
          const user = await authAPI.getProfile();

          // Actualizar estado
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
          });
        } catch (error) {
          // Limpiar estado en caso de error
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Limpiar última ruta para que el próximo login use landing por rol
        clearLastRoute();

        // Limpiar estado
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
