import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/api/auth.api';
import { clearLastRoute } from '@/hooks/useLastRoute';
import { invalidateAllQueries, clearAllQueries } from '@/lib/queryClient';
import type { AuthState, LoginCredentials, User, TenantInfo } from '@/types/auth.types';

// Duración máxima de impersonación: 60 minutos
const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

// Constantes para claves de localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_TENANT_ID: 'current_tenant_id',
  IS_IMPERSONATING: 'is_impersonating',
  IMPERSONATED_USER_ID: 'impersonated_user_id',
  IMPERSONATION_STARTED_AT: 'impersonation_started_at',
} as const;

// Inicializar currentTenantId desde localStorage
const getInitialTenantId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT_ID);
  return stored ? Number(stored) : null;
};

// Inicializar isImpersonating desde localStorage
const getInitialImpersonating = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.IS_IMPERSONATING) === 'true';
};

// Inicializar impersonatedUserId desde localStorage
const getInitialImpersonatedUserId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
  return stored ? Number(stored) : null;
};

/**
 * Verifica si la impersonación de usuario ha expirado (>60 min).
 * Retorna true si expiró o si no hay timestamp registrado.
 */
export const isImpersonationExpired = (): boolean => {
  const startedAt = localStorage.getItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT);
  if (!startedAt) return true;
  const elapsed = Date.now() - Number(startedAt);
  return elapsed > IMPERSONATION_TTL_MS;
};

/**
 * Store de autenticación multi-tenant.
 *
 * FLUJO DE AUTENTICACIÓN:
 * 1. Usuario hace login con email/password
 * 2. Backend retorna:
 *    - Tokens JWT
 *    - Info del TenantUser (usuario global)
 *    - Lista de tenants accesibles
 * 3. Si tiene múltiples tenants, mostrar selector
 * 4. Al seleccionar tenant:
 *    - Guardar currentTenantId
 *    - Todas las APIs incluirán X-Tenant-ID header
 * 5. Cargar perfil de User dentro del tenant (si existe)
 *
 * IMPERSONACIÓN:
 * - startImpersonation(tenantId): Superadmin entra a un tenant (vista admin)
 * - startUserImpersonation(userId): Override de user con perfil de otro usuario
 * - stopUserImpersonation(): Restaura perfil original (queda en tenant)
 * - stopImpersonation(): Sale del tenant completamente → Admin Global
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      tenantUser: null,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoadingUser: false,
      currentTenantId: getInitialTenantId(),
      currentTenant: null,
      accessibleTenants: [],
      isSuperadmin: false,
      isImpersonating: getInitialImpersonating(),
      originalUser: null,
      impersonatedUserId: getInitialImpersonatedUserId(),
      pendingUserSelection: false,

      /**
       * Login con TenantUser (sistema multi-tenant)
       */
      login: async (credentials: LoginCredentials) => {
        try {
          // Obtener tokens + info de usuario + tenants
          const response = await authAPI.login(credentials);

          // Verificar si requiere 2FA
          if ('requires_2fa' in response && (response as Record<string, unknown>).requires_2fa) {
            // Lanzar objeto especial para que LoginPage lo intercepte
            throw {
              requires_2fa: true,
              email: (response as Record<string, unknown>).email as string,
            };
          }

          // Guardar tokens en localStorage
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh);

          // Determinar tenant inicial
          let initialTenantId = get().currentTenantId;
          let initialTenant: TenantInfo | null = null;

          // Si no hay tenant guardado, usar el último o el primero disponible
          if (!initialTenantId && response.tenants.length > 0) {
            if (response.last_tenant_id) {
              // Usar último tenant accedido
              const lastTenant = response.tenants.find(
                (t) => t.tenant.id === response.last_tenant_id
              );
              if (lastTenant) {
                initialTenantId = lastTenant.tenant.id;
                initialTenant = lastTenant.tenant;
              }
            }

            // Si no hay último tenant válido, usar el primero
            if (!initialTenantId && response.tenants.length > 0) {
              initialTenantId = response.tenants[0].tenant.id;
              initialTenant = response.tenants[0].tenant;
            }
          } else if (initialTenantId) {
            // Verificar que el tenant guardado sigue siendo accesible
            const savedTenant = response.tenants.find((t) => t.tenant.id === initialTenantId);
            if (savedTenant) {
              initialTenant = savedTenant.tenant;
            } else {
              // Tenant no accesible, usar el primero
              initialTenantId = response.tenants[0]?.tenant.id || null;
              initialTenant = response.tenants[0]?.tenant || null;
            }
          }

          // Guardar tenant inicial
          if (initialTenantId) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT_ID, String(initialTenantId));
          }

          // Actualizar estado
          set({
            tenantUser: response.user,
            accessToken: response.access,
            refreshToken: response.refresh,
            isAuthenticated: true,
            accessibleTenants: response.tenants,
            isSuperadmin: response.user.is_superadmin,
            currentTenantId: initialTenantId,
            currentTenant: initialTenant,
          });

          // Si hay tenant seleccionado, notificar al backend y cargar perfil del User
          if (initialTenantId) {
            try {
              await authAPI.selectTenant(initialTenantId);
            } catch (error) {
              console.warn('Failed to notify backend of tenant selection:', error);
            }

            // Cargar perfil del User dentro del tenant (permission_codes, cargo, etc.)
            try {
              set({ isLoadingUser: true });
              const userProfile = await authAPI.getProfile();
              set({ user: userProfile, isLoadingUser: false });
            } catch (error) {
              console.warn('Failed to load user profile after login:', error);
              set({ isLoadingUser: false });
            }
          }
        } catch (error) {
          // Limpiar estado en caso de error
          set({
            tenantUser: null,
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            accessibleTenants: [],
            isSuperadmin: false,
            currentTenantId: null,
            currentTenant: null,
          });
          throw error;
        }
      },

      /**
       * Cerrar sesión
       */
      logout: async () => {
        // Invalidar refresh token en el servidor
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          await authAPI.logout(refreshToken);
        }

        // Usar forceLogout para limpiar estado local
        get().forceLogout();
      },

      /**
       * Logout sin llamada al backend.
       * Usar cuando el refresh token ya falló y no podemos contactar al servidor.
       * Evita loops infinitos en el interceptor de axios.
       */
      forceLogout: () => {
        // Limpiar localStorage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT_ID);
        localStorage.removeItem(STORAGE_KEYS.IS_IMPERSONATING);
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT);

        // Limpiar última ruta
        clearLastRoute();

        // Limpiar todo el cache de React Query
        clearAllQueries();

        // Limpiar estado
        set({
          tenantUser: null,
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          accessibleTenants: [],
          isSuperadmin: false,
          isImpersonating: false,
          currentTenantId: null,
          currentTenant: null,
          originalUser: null,
          impersonatedUserId: null,
        });
      },

      /**
       * Refrescar perfil del TenantUser
       */
      refreshTenantProfile: async () => {
        try {
          const profile = await authAPI.getTenantProfile();
          set({
            tenantUser: {
              id: profile.id,
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              full_name: profile.full_name,
              is_superadmin: profile.is_superadmin,
              last_tenant_id: profile.last_tenant_id,
            },
            accessibleTenants: profile.tenants,
            isSuperadmin: profile.is_superadmin,
          });
        } catch (error) {
          console.error('Error refreshing tenant profile:', error);
        }
      },

      /**
       * Seleccionar un tenant para trabajar
       *
       * IMPORTANTE: Invalida todas las queries de React Query para forzar
       * la recarga de datos del nuevo tenant.
       */
      selectTenant: async (tenantId: number) => {
        const { accessibleTenants, currentTenantId } = get();

        // Si es el mismo tenant, no hacer nada
        if (tenantId === currentTenantId) {
          return;
        }

        // Verificar que el tenant es accesible
        const tenantAccess = accessibleTenants.find((t) => t.tenant.id === tenantId);
        if (!tenantAccess) {
          throw new Error('No tienes acceso a este tenant');
        }

        // Notificar al backend
        await authAPI.selectTenant(tenantId);

        // Guardar en localStorage ANTES de invalidar queries
        // para que las nuevas requests usen el nuevo X-Tenant-ID
        localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT_ID, String(tenantId));

        // Limpiar impersonación de usuario al cambiar de tenant
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);

        // Actualizar estado
        set({
          currentTenantId: tenantId,
          currentTenant: tenantAccess.tenant,
          user: null, // Limpiar usuario del tenant anterior
          isLoadingUser: true,
          originalUser: null,
          impersonatedUserId: null,
        });

        // Limpiar cache de branding en localStorage para evitar flash con datos del tenant anterior
        try {
          localStorage.removeItem('last_branding');
        } catch {
          /* ignore */
        }

        // CRÍTICO: Invalidar TODAS las queries para forzar recarga con nuevo tenant
        // Esto asegura que branding, usuarios, configuración, etc. se recarguen
        invalidateAllQueries();

        // Cargar perfil del User dentro del nuevo tenant (permission_codes, cargo, etc.)
        try {
          const userProfile = await authAPI.getProfile();
          set({ user: userProfile, isLoadingUser: false });
        } catch (error) {
          console.warn('Failed to load user profile after tenant switch:', error);
          set({ isLoadingUser: false });
        }
      },

      /**
       * Cargar perfil del User dentro del tenant actual.
       * Se llama automáticamente desde DashboardLayout cuando hay tenant pero no user.
       * Esto cubre el caso de recarga de página (F5) donde user no se persiste.
       *
       * Si hay impersonación activa (impersonatedUserId en localStorage),
       * recarga el perfil del usuario impersonado en vez del propio.
       */
      loadUserProfile: async () => {
        const { currentTenantId, user, isLoadingUser } = get();

        // Solo cargar si hay tenant seleccionado y no hay user ni carga en curso
        if (!currentTenantId || user || isLoadingUser) return;

        try {
          set({ isLoadingUser: true });

          let impersonatedId = getInitialImpersonatedUserId();

          // Verificar si la impersonación expiró (>60 min)
          if (impersonatedId && isImpersonationExpired()) {
            console.warn('Impersonación expirada — restaurando perfil de superadmin');
            localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
            localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT);
            impersonatedId = null;
          }

          if (impersonatedId) {
            // Estamos impersonando: recargar perfil del usuario target
            const impersonatedProfile = await authAPI.getImpersonateProfile(impersonatedId);

            // También recargar perfil del superadmin como originalUser
            const superadminProfile = await authAPI.getProfile();

            set({
              user: impersonatedProfile,
              originalUser: superadminProfile,
              impersonatedUserId: impersonatedId,
              isImpersonating: true,
              isLoadingUser: false,
            });
          } else {
            // Flujo normal: cargar perfil propio
            const userProfile = await authAPI.getProfile();
            set({ user: userProfile, isLoadingUser: false });
          }
        } catch (error) {
          console.warn('Failed to load user profile:', error);
          // Si falla la impersonación, limpiar estado y cargar como admin
          localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
          set({
            isLoadingUser: false,
            impersonatedUserId: null,
            originalUser: null,
          });
        }
      },

      /**
       * Fuerza recarga del perfil del User (core.User) dentro del tenant actual.
       * A diferencia de loadUserProfile(), ignora el guard de user existente.
       * Usar cuando el cargo o permisos del usuario cambian.
       */
      refreshUserProfile: async () => {
        const { currentTenantId } = get();
        if (!currentTenantId) return;

        try {
          set({ isLoadingUser: true, user: null });
          const userProfile = await authAPI.getProfile();
          set({ user: userProfile, isLoadingUser: false });
        } catch (error) {
          console.warn('Failed to refresh user profile:', error);
          set({ isLoadingUser: false });
        }
      },

      /**
       * Establecer usuario del tenant actual (User)
       */
      setUser: (user: User) => {
        set({ user });
      },

      /**
       * Establecer tenant actual (para restaurar desde localStorage)
       */
      setCurrentTenantId: (tenantId: number | null) => {
        const { accessibleTenants } = get();

        if (tenantId) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT_ID, String(tenantId));
          const tenantAccess = accessibleTenants.find((t) => t.tenant.id === tenantId);
          set({
            currentTenantId: tenantId,
            currentTenant: tenantAccess?.tenant || null,
          });
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT_ID);
          set({
            currentTenantId: null,
            currentTenant: null,
          });
        }
      },

      /**
       * Limpiar contexto de tenant (para modo Admin Global)
       */
      clearTenantContext: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT_ID);
        localStorage.removeItem(STORAGE_KEYS.IS_IMPERSONATING);
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT);
        set({
          currentTenantId: null,
          currentTenant: null,
          user: null,
          isImpersonating: false,
          originalUser: null,
          impersonatedUserId: null,
        });
        // Invalidar queries para modo Admin Global
        invalidateAllQueries();
      },

      /**
       * Superadmin entra a un tenant desde Admin Global.
       * Usa selectTenant() internamente (llama backend + invalida queries + recarga perfil).
       */
      startImpersonation: async (tenantId: number) => {
        await get().selectTenant(tenantId);
        localStorage.setItem(STORAGE_KEYS.IS_IMPERSONATING, 'true');
        set({ isImpersonating: true });
      },

      /**
       * Superadmin sale del tenant y vuelve a Admin Global.
       * Limpia contexto de tenant y flag de impersonación.
       */
      stopImpersonation: () => {
        get().clearTenantContext();
      },

      /**
       * Superadmin ve la app como un usuario específico dentro del tenant actual.
       * Override de authStore.user con el perfil del usuario target.
       *
       * El JWT sigue siendo del superadmin (acceso completo a APIs),
       * pero el rendering del frontend (sidebar, guards, portals) se adapta
       * al perfil del usuario impersonado.
       *
       * @param userId - ID del usuario a impersonar
       * @param impersonationToken - Token 2FA temporal (requerido si superadmin tiene 2FA)
       */
      startUserImpersonation: async (userId: number, impersonationToken?: string) => {
        const { user } = get();

        // Guardar perfil original del superadmin
        const originalUser = user;

        // Obtener perfil completo del usuario target
        const impersonatedProfile = await authAPI.getImpersonateProfile(userId, impersonationToken);

        // Persistir en localStorage para sobrevivir F5
        localStorage.setItem(STORAGE_KEYS.IMPERSONATED_USER_ID, String(userId));
        localStorage.setItem(STORAGE_KEYS.IS_IMPERSONATING, 'true');
        localStorage.setItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT, String(Date.now()));

        // Override del user en el store
        set({
          originalUser,
          user: impersonatedProfile,
          impersonatedUserId: userId,
          isImpersonating: true,
        });
      },

      /**
       * Dejar de impersonar un usuario específico.
       * Restaura el perfil del superadmin pero mantiene el contexto de tenant.
       * El superadmin queda como admin en el tenant (puede elegir otro usuario).
       */
      stopUserImpersonation: () => {
        const { originalUser } = get();

        // Limpiar localStorage de impersonación de usuario
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_STARTED_AT);

        // Restaurar perfil original, mantener contexto de tenant
        set({
          user: originalUser,
          originalUser: null,
          impersonatedUserId: null,
          // isImpersonating se mantiene true (sigue en el tenant como admin)
        });
      },

      setPendingUserSelection: (pending: boolean) => set({ pendingUserSelection: pending }),
    }),
    {
      name: 'auth-storage',
      version: 5, // Bump: impersonación de usuario
      partialize: (state) => ({
        tenantUser: state.tenantUser,
        isAuthenticated: state.isAuthenticated,
        currentTenantId: state.currentTenantId,
        currentTenant: state.currentTenant,
        accessibleTenants: state.accessibleTenants,
        isSuperadmin: state.isSuperadmin,
        isImpersonating: state.isImpersonating,
        impersonatedUserId: state.impersonatedUserId,
      }),
      // Migración: preserva estado existente, agrega campos nuevos
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown>;
        if (version < 5) {
          // Solo agregar campo nuevo de impersonación de usuario
          return {
            ...state,
            impersonatedUserId: null,
          };
        }
        return persistedState as Partial<AuthState>;
      },
    }
  )
);
