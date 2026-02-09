/**
 * Tipos para el sistema Multi-Tenant
 *
 * Estos tipos coinciden con las respuestas del backend multi-tenant.
 */

/**
 * Información básica de un tenant
 * Coincide con TenantMinimalSerializer del backend
 */
export interface TenantInfo {
  id: number;
  code: string;
  name: string;
  logo?: string | null;
  logo_url?: string | null;
  logo_effective?: string | null;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  is_active: boolean;
  subdomain?: string | null;
  primary_domain?: string | null;
  nombre_comercial?: string;
  company_slogan?: string;
  enabled_modules?: string[];
}

/**
 * Acceso de un usuario a un tenant
 * NOTA: Los permisos se manejan via User.cargo dentro del schema del tenant (RBAC v4)
 */
export interface TenantUserAccess {
  tenant: TenantInfo;
}

/**
 * Respuesta del endpoint de tenants del usuario
 */
export interface UserTenantsResponse {
  tenants: TenantUserAccess[];
  last_tenant_id: number | null;
}

/**
 * Request para seleccionar tenant
 */
export interface SelectTenantRequest {
  tenant_id: number;
}

/**
 * Respuesta de selección de tenant
 */
export interface SelectTenantResponse {
  status: string;
  tenant: TenantInfo;
  message: string;
}
