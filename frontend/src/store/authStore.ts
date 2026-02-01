import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/api/auth.api';
import { clearLastRoute } from '@/hooks/useLastRoute';
import type { AuthState, LoginCredentials, User } from '@/types/auth.types';

// Inicializar currentTenantId desde localStorage
const getInitialTenantId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('current_tenant_id');
  return stored ? Number(stored) : null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      currentTenantId: getInitialTenantId(),

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

      logout: async () => {
        // P0-03: Invalidar refresh token en el servidor antes de limpiar cliente
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          await authAPI.logout(refreshToken);
        }

        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_tenant_id');

        // Limpiar última ruta para que el próximo login use landing por rol
        clearLastRoute();

        // Limpiar estado
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          currentTenantId: null,
        });
      },

      refreshProfile: async () => {
        try {
          const user = await authAPI.getProfile();
          set({ user });
        } catch (error) {
          console.error('Error refreshing profile:', error);
          // Opcional: si falla el perfil (ej: token vencido), hacer logout
          // set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setCurrentTenantId: (tenantId: number | null) => {
        if (tenantId) {
          localStorage.setItem('current_tenant_id', String(tenantId));
        } else {
          localStorage.removeItem('current_tenant_id');
        }
        set({ currentTenantId: tenantId });
      },

      clearTenantContext: () => {
        localStorage.removeItem('current_tenant_id');
        set({ currentTenantId: null });
      },
    }),
    {
      name: 'auth-storage',
      version: 3, // Incrementar al cambiar estructura de User
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTenantId: state.currentTenantId,
      }),
      // Migración: limpia datos antiguos para forzar re-login
      migrate: (persistedState, version) => {
        if (version < 3) {
          // Versiones anteriores: forzar re-login para obtener nuevos campos
          return {
            user: null,
            isAuthenticated: false,
            currentTenantId: null,
          };
        }
        return persistedState as { user: null; isAuthenticated: boolean; currentTenantId: number | null };
      },
    }
  )
);
