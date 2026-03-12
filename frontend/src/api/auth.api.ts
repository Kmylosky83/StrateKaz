import axios from './axios-config';
import type {
  LoginCredentials,
  LoginResponse,
  User,
  TenantMeResponse,
  SelectTenantResponse,
} from '@/types/auth.types';

/**
 * API de autenticación multi-tenant.
 *
 * FLUJO:
 * 1. login() - Autentica con TenantUser (schema público)
 * 2. getTenantProfile() - Obtiene info del TenantUser + tenants accesibles
 * 3. selectTenant() - Selecciona un tenant para trabajar
 * 4. Una vez en un tenant, las demás APIs usan X-Tenant-ID header
 */
export const authAPI = {
  /**
   * Iniciar sesión con TenantUser (sistema multi-tenant)
   * Retorna tokens JWT + info de usuario + lista de tenants accesibles
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>('/tenant/auth/login/', credentials);
    return response.data;
  },

  /**
   * Obtener perfil del TenantUser autenticado y sus tenants accesibles
   * Usa el token JWT para identificar al usuario
   */
  getTenantProfile: async (): Promise<TenantMeResponse> => {
    const response = await axios.get<TenantMeResponse>('/tenant/auth/me/');
    return response.data;
  },

  /**
   * Seleccionar/cambiar de tenant
   * Guarda la preferencia y retorna info del tenant seleccionado
   */
  selectTenant: async (tenantId: number): Promise<SelectTenantResponse> => {
    const response = await axios.post<SelectTenantResponse>('/tenant/auth/select-tenant/', {
      tenant_id: tenantId,
    });
    return response.data;
  },

  /**
   * Obtener perfil del usuario dentro del tenant actual
   * Este endpoint requiere X-Tenant-ID header
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
  refreshToken: async (refreshToken: string): Promise<{ access: string; refresh?: string }> => {
    const response = await axios.post<{ access: string; refresh?: string }>(
      '/tenant/auth/refresh/',
      {
        refresh: refreshToken,
      }
    );
    return response.data;
  },

  /**
   * Cerrar sesión (invalida el refresh token en el servidor)
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await axios.post('/tenant/auth/logout/', { refresh: refreshToken });
    } catch (error) {
      // Si falla el logout en servidor (token ya inválido), continuamos
      console.warn('Server logout failed (token may be expired):', error);
    }
  },

  /**
   * Solicitar restablecimiento de contrasena
   * Siempre retorna 200 por seguridad (no revela si el email existe)
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    // MB-TENANT: Enviar tenant_id para branding correcto en el email de reset
    const tenantId = localStorage.getItem('current_tenant_id');
    const response = await axios.post<{ message: string }>('/tenant/auth/forgot-password/', {
      email,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    });
    return response.data;
  },

  /**
   * Restablecer contrasena con token
   */
  resetPassword: async (data: {
    email: string;
    token: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/tenant/auth/reset-password/', data);
    return response.data;
  },

  /**
   * Configurar contraseña inicial (empleados creados desde Talent Hub)
   * Endpoint publico sin autenticacion - usa token temporal
   */
  setupPassword: async (data: {
    email: string;
    token: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/core/setup-password/', data);
    return response.data;
  },

  /**
   * Reenviar enlace de configuración de contraseña.
   * Endpoint público sin autenticación.
   * Genera nuevo token y envía email de setup nuevamente.
   */
  resendSetupPassword: async (email: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>('/core/setup-password/resend/', {
      email,
    });
    return response.data;
  },

  /**
   * Obtener perfil de un usuario para impersonación (solo superadmins).
   * Retorna el mismo formato que getProfile() pero para el usuario especificado.
   */
  getImpersonateProfile: async (userId: number): Promise<User> => {
    const response = await axios.get<User>(`/core/users/${userId}/impersonate-profile/`);
    return response.data;
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
