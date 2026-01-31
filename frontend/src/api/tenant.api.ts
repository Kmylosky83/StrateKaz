/**
 * API para Multi-Tenant
 *
 * Endpoints para gestión de tenants desde el frontend.
 * Usado principalmente en el login genérico cuando un usuario
 * tiene acceso a múltiples empresas.
 */
import axios from './axios-config';
import type {
  UserTenantsResponse,
  SelectTenantRequest,
  SelectTenantResponse,
} from '@/types/tenant.types';

export const tenantAPI = {
  /**
   * Obtiene la lista de tenants a los que el usuario tiene acceso.
   * Requiere autenticación previa (token de BD master).
   */
  getUserTenants: async (): Promise<UserTenantsResponse> => {
    const response = await axios.get<UserTenantsResponse>('/tenant/users/tenants/');
    return response.data;
  },

  /**
   * Selecciona un tenant y obtiene la URL de redirección.
   * El backend genera un token temporal para el redirect.
   */
  selectTenant: async (data: SelectTenantRequest): Promise<SelectTenantResponse> => {
    const response = await axios.post<SelectTenantResponse>('/tenant/users/select/', data);
    return response.data;
  },
};
