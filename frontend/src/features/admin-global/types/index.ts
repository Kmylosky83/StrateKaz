/**
 * Tipos para Admin Global - Panel de Superusuarios
 *
 * Gestión de: Tenants, Planes, Usuarios Globales, Módulos
 */

// =============================================================================
// PLAN
// =============================================================================

export interface Plan {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  max_users: number;
  max_storage_gb: number;
  price_monthly: string;
  price_yearly: string;
  features: string[];
  is_active: boolean;
  is_default: boolean;
  tenant_count?: number;
}

export interface CreatePlanDTO {
  code: string;
  name: string;
  description?: string;
  max_users?: number;
  max_storage_gb?: number;
  price_monthly?: string;
  price_yearly?: string;
  features?: string[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdatePlanDTO extends Partial<CreatePlanDTO> {}

// =============================================================================
// TENANT
// =============================================================================

export interface Tenant {
  id: number;
  code: string;
  name: string;
  nit?: string | null;
  subdomain: string;
  custom_domain?: string | null;
  full_domain: string;
  db_name: string;
  db_host: string;
  db_port: string;
  plan?: number | null;
  plan_name?: string | null;
  max_users: number;
  max_storage_gb: number;
  tier: TenantTier;
  enabled_modules: string[];
  effective_max_users: number;
  effective_modules: string[];
  is_active: boolean;
  is_trial: boolean;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  is_subscription_valid: boolean;
  logo_url?: string | null;
  primary_color: string;
  backup_enabled: boolean;
  backup_retention_days: number;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  user_count?: number;
}

export type TenantTier = 'starter' | 'small' | 'medium' | 'large' | 'enterprise';

export interface CreateTenantDTO {
  code: string;
  name: string;
  nit?: string;
  subdomain: string;
  custom_domain?: string;
  plan?: number;
  max_users?: number;
  max_storage_gb?: number;
  tier?: TenantTier;
  enabled_modules?: string[];
  is_active?: boolean;
  is_trial?: boolean;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  logo_url?: string;
  primary_color?: string;
  notes?: string;
}

export interface UpdateTenantDTO extends Partial<CreateTenantDTO> {}

export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
  trial: number;
  expiring_soon: number;
  expired: number;
  by_plan: Array<{ plan__name: string | null; count: number }>;
}

// =============================================================================
// TENANT USER (Usuario Global)
// =============================================================================

export interface TenantUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  last_login?: string | null;
  last_tenant?: number | null;
  accesses: TenantUserAccess[];
  tenant_count: number;
  created_at: string;
  updated_at: string;
}

export interface TenantUserAccess {
  tenant: TenantMinimal;
  role: TenantRole;
  is_active: boolean;
  created_at: string;
}

export interface TenantMinimal {
  id: number;
  code: string;
  name: string;
  subdomain: string;
  logo_url?: string | null;
  primary_color: string;
  is_active: boolean;
}

export type TenantRole = 'admin' | 'user' | 'readonly';

export interface CreateTenantUserDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active?: boolean;
  is_superadmin?: boolean;
}

export interface UpdateTenantUserDTO {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
  is_superadmin?: boolean;
}

export interface AssignTenantDTO {
  tenant_id: number;
  role: TenantRole;
}

export interface TenantUserStats {
  total: number;
  active: number;
  inactive: number;
  superadmins: number;
  multi_tenant: number;
}

// =============================================================================
// PLAN STATS
// =============================================================================

export interface PlanStats {
  plans: Array<{
    id: number;
    name: string;
    code: string;
    price_monthly: string;
    tenant_count: number;
    is_active: boolean;
  }>;
}
