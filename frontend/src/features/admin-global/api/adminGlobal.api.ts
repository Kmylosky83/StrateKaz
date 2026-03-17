/**
 * API para Admin Global - Panel de Superusuarios
 *
 * Endpoints para gestión de Tenants, Planes y Usuarios Globales.
 * Todos los endpoints requieren autenticación de superusuario.
 */
import axiosInstance from '@/api/axios-config';
import type {
  Plan,
  CreatePlanDTO,
  UpdatePlanDTO,
  PlanStats,
  Tenant,
  CreateTenantDTO,
  UpdateTenantDTO,
  TenantStats,
  TenantUser,
  CreateTenantUserDTO,
  UpdateTenantUserDTO,
  AssignTenantDTO,
  TenantUserStats,
} from '../types';

const BASE_URL = '/tenant';

// =============================================================================
// TIPOS AUXILIARES
// =============================================================================

/**
 * Respuesta paginada de DRF (Django Rest Framework)
 */
interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

/**
 * Extrae el array de datos de una respuesta que puede ser paginada o directa
 */
function extractResults<T>(data: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results || [];
}

// =============================================================================
// PLANES API
// =============================================================================

export const plansApi = {
  /**
   * Lista todos los planes
   */
  getAll: async (): Promise<Plan[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/plans/`);
    return extractResults(response.data);
  },

  /**
   * Obtiene un plan por ID
   */
  getById: async (id: number): Promise<Plan> => {
    const response = await axiosInstance.get(`${BASE_URL}/plans/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo plan
   */
  create: async (data: CreatePlanDTO): Promise<Plan> => {
    const response = await axiosInstance.post(`${BASE_URL}/plans/`, data);
    return response.data;
  },

  /**
   * Actualiza un plan
   */
  update: async (id: number, data: UpdatePlanDTO): Promise<Plan> => {
    const response = await axiosInstance.patch(`${BASE_URL}/plans/${id}/`, data);
    return response.data;
  },

  /**
   * Elimina un plan
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/plans/${id}/`);
  },

  /**
   * Obtiene estadísticas de planes
   */
  getStats: async (): Promise<PlanStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/plans/stats/`);
    return response.data;
  },
};

// =============================================================================
// TIPOS PARA CREACIÓN ASÍNCRONA DE TENANT
// =============================================================================

/**
 * Respuesta de creación de tenant (incluye task_id para seguimiento)
 */
export interface TenantCreateResponse extends Tenant {
  task_id: string;
  schema_status: 'pending' | 'creating' | 'ready' | 'failed';
}

/**
 * Estado del progreso de creación del tenant
 */
export interface TenantCreationStatus {
  status: 'pending' | 'creating' | 'running' | 'ready' | 'completed' | 'failed';
  progress: number;
  message: string;
  phase: string;
  tenant_id?: number;
  schema_name?: string;
  error?: string;
  duration_seconds?: number;
  current_migration?: string;
}

// =============================================================================
// TENANTS API
// =============================================================================

export const tenantsApi = {
  /**
   * Lista todos los tenants con filtros opcionales
   */
  getAll: async (params?: {
    is_active?: boolean;
    is_trial?: boolean;
    plan?: number;
    tier?: string;
    search?: string;
    ordering?: string;
  }): Promise<Tenant[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/tenants/`, { params });
    return extractResults(response.data);
  },

  /**
   * Obtiene un tenant por ID
   */
  getById: async (id: number): Promise<Tenant> => {
    const response = await axiosInstance.get(`${BASE_URL}/tenants/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo tenant (creación asíncrona)
   *
   * El tenant se crea inmediatamente en la BD, pero el schema PostgreSQL
   * se crea de forma asíncrona via Celery. Usa getCreationStatus() para
   * seguir el progreso.
   *
   * @returns TenantCreateResponse con task_id para seguimiento
   */
  create: async (data: CreateTenantDTO): Promise<TenantCreateResponse> => {
    // El backend construye el dominio completo usando PLATFORM_DOMAIN
    // Solo enviamos el subdomain limpio
    const response = await axiosInstance.post(`${BASE_URL}/tenants/`, data);
    return response.data;
  },

  /**
   * Obtiene el estado de creación de un tenant
   *
   * Usar para polling mientras el schema se está creando.
   * Recomendación: polling cada 2-3 segundos.
   */
  getCreationStatus: async (tenantId: number): Promise<TenantCreationStatus> => {
    const response = await axiosInstance.get(`${BASE_URL}/tenants/${tenantId}/creation-status/`);
    return response.data;
  },

  /**
   * Reintenta la creación del schema de un tenant que falló
   */
  retryCreation: async (
    tenantId: number
  ): Promise<{ status: string; task_id: string; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/tenants/${tenantId}/retry-creation/`);
    return response.data;
  },

  /**
   * Actualiza un tenant
   * Excluye campos inmutables (code, subdomain) del payload
   * Convierte valores vacíos a null para campos opcionales
   * Soporta FormData para subir archivos (logos, iconos PWA)
   */
  update: async (id: number, data: UpdateTenantDTO | FormData): Promise<Tenant> => {
    // Si es FormData (con archivos), enviar con Content-Type multipart
    // IMPORTANTE: Eliminar el Content-Type default (application/json) para que
    // axios auto-genere el boundary correcto de multipart/form-data
    if (data instanceof FormData) {
      const response = await axiosInstance.patch(`${BASE_URL}/tenants/${id}/`, data, {
        headers: { 'Content-Type': undefined },
      });
      return response.data;
    }

    // Si es objeto normal, procesar como antes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { code, subdomain, ...rest } = data as CreateTenantDTO & {
      code?: string;
      subdomain?: string;
    };

    // Convertir valores vacíos a null para campos opcionales
    const updateData = {
      ...rest,
      // plan debe ser null si está vacío o undefined, no string vacío
      plan: rest.plan === '' || rest.plan === undefined ? null : rest.plan,
      // fechas vacías deben ser null
      trial_ends_at: rest.trial_ends_at === '' ? null : rest.trial_ends_at,
      subscription_ends_at: rest.subscription_ends_at === '' ? null : rest.subscription_ends_at,
      // nit vacío debe ser null
      nit: rest.nit === '' ? null : rest.nit,
    };

    const response = await axiosInstance.patch(`${BASE_URL}/tenants/${id}/`, updateData);
    return response.data;
  },

  /**
   * Eliminacion permanente de un tenant (hard delete).
   * Borra schema PostgreSQL + registro. IRREVERSIBLE.
   * Solo superadmin.
   */
  hardDelete: async (id: number, confirmName: string): Promise<{ detail: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/tenants/${id}/hard-delete/`, {
      confirm_name: confirmName,
    });
    return response.data;
  },

  /**
   * Activa/desactiva un tenant
   */
  toggleActive: async (
    id: number
  ): Promise<{ id: number; is_active: boolean; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/tenants/${id}/toggle-active/`);
    return response.data;
  },

  /**
   * Obtiene usuarios de un tenant
   */
  getUsers: async (
    id: number
  ): Promise<{
    users: Array<{
      id: number;
      email: string;
      full_name: string;
      role: string;
      is_active: boolean;
      last_login: string | null;
    }>;
    count: number;
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/tenants/${id}/users/`);
    return response.data;
  },

  /**
   * Obtiene estadísticas de tenants
   */
  getStats: async (): Promise<TenantStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/tenants/stats/`);
    return response.data;
  },
};

// =============================================================================
// TENANT USERS API (Usuarios Globales)
// =============================================================================

export const tenantUsersApi = {
  /**
   * Lista todos los usuarios globales con filtros opcionales
   */
  getAll: async (params?: {
    is_active?: boolean;
    is_superadmin?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<TenantUser[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/users/`, { params });
    return extractResults(response.data);
  },

  /**
   * Obtiene un usuario por ID
   */
  getById: async (id: number): Promise<TenantUser> => {
    const response = await axiosInstance.get(`${BASE_URL}/users/${id}/`);
    return response.data;
  },

  /**
   * Crea un nuevo usuario global
   */
  create: async (data: CreateTenantUserDTO): Promise<TenantUser> => {
    const response = await axiosInstance.post(`${BASE_URL}/users/`, data);
    return response.data;
  },

  /**
   * Actualiza un usuario global
   */
  update: async (id: number, data: UpdateTenantUserDTO): Promise<TenantUser> => {
    const response = await axiosInstance.patch(`${BASE_URL}/users/${id}/`, data);
    return response.data;
  },

  /**
   * Desactiva un usuario global (soft-delete).
   * El backend marca is_active=False en vez de eliminar.
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/users/${id}/`);
  },

  /**
   * Activa/desactiva un usuario global (toggle)
   */
  toggleActive: async (
    id: number
  ): Promise<{ id: number; is_active: boolean; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/users/${id}/toggle-active/`);
    return response.data;
  },

  /**
   * Asigna un usuario a un tenant
   */
  assignTenant: async (
    userId: number,
    data: AssignTenantDTO
  ): Promise<{
    message: string;
    tenant: string;
    role: string;
  }> => {
    const response = await axiosInstance.post(`${BASE_URL}/users/${userId}/grant-access/`, data);
    return response.data;
  },

  /**
   * Remueve acceso de un usuario a un tenant
   */
  removeTenant: async (userId: number, tenantId: number): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/users/${userId}/revoke-access/`, {
      tenant_id: tenantId,
    });
    return response.data;
  },

  /**
   * Obtiene el usuario actual (para usuarios normales)
   */
  getMe: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/users/me/`);
    return response.data;
  },

  /**
   * Obtiene tenants del usuario actual
   */
  getMyTenants: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/users/tenants/`);
    return response.data;
  },

  /**
   * Obtiene estadísticas de usuarios globales
   */
  getStats: async (): Promise<TenantUserStats> => {
    const response = await axiosInstance.get(`${BASE_URL}/users/stats/`);
    return response.data;
  },
};
