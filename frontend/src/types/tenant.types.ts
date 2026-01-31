/**
 * Tipos para el sistema Multi-Tenant
 */

export interface TenantInfo {
  id: number;
  code: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
}

export interface TenantUserAccess {
  tenant: TenantInfo;
  role: 'admin' | 'user' | 'readonly';
  is_active: boolean;
}

export interface UserTenantsResponse {
  tenants: TenantUserAccess[];
  last_tenant_id: number | null;
}

export interface SelectTenantRequest {
  tenant_id: number;
}

export interface SelectTenantResponse {
  redirect_url: string;
  tenant: TenantInfo;
}
