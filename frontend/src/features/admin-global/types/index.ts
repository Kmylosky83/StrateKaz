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

export type UpdatePlanDTO = Partial<CreatePlanDTO>;

// =============================================================================
// TENANT
// =============================================================================

export type SchemaStatus = 'pending' | 'creating' | 'ready' | 'failed';

export type TipoSociedad =
  | 'SAS'
  | 'SA'
  | 'LTDA'
  | 'SCA'
  | 'SC'
  | 'COLECTIVA'
  | 'ESAL'
  | 'PERSONA_NATURAL'
  | 'SUCURSAL_EXTRANJERA'
  | 'OTRO';
export type RegimenTributario =
  | 'COMUN'
  | 'SIMPLE'
  | 'NO_RESPONSABLE'
  | 'ESPECIAL'
  | 'GRAN_CONTRIBUYENTE';
export type FormatoFecha = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
export type Moneda = 'COP' | 'USD' | 'EUR';
export type ZonaHoraria =
  | 'America/Bogota'
  | 'America/New_York'
  | 'America/Los_Angeles'
  | 'America/Mexico_City'
  | 'Europe/Madrid'
  | 'UTC';

export interface Tenant {
  id: number;
  code: string;
  name: string;
  nit?: string | null;
  subdomain: string;
  primary_domain?: string | null;
  custom_domain?: string | null;
  full_domain?: string;
  db_name?: string;
  schema_name?: string;

  // Plan y límites
  plan?: number | null;
  plan_name?: string | null;
  max_users: number;
  max_storage_gb: number;
  tier: TenantTier;
  enabled_modules: string[];
  effective_max_users?: number;
  effective_modules?: string[];

  // Estado
  is_active: boolean;
  is_trial: boolean;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  is_subscription_valid?: boolean;

  // Creación asíncrona del schema
  schema_status?: SchemaStatus;
  schema_task_id?: string;
  schema_error?: string;

  // =========================================================================
  // DATOS FISCALES Y LEGALES (migrado de EmpresaConfig)
  // =========================================================================
  razon_social?: string;
  nombre_comercial?: string;
  representante_legal?: string;
  cedula_representante?: string;
  tipo_sociedad?: TipoSociedad;
  actividad_economica?: string;
  descripcion_actividad?: string;
  regimen_tributario?: RegimenTributario;

  // =========================================================================
  // DATOS DE CONTACTO
  // =========================================================================
  direccion_fiscal?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigo_postal?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  email_corporativo?: string;
  sitio_web?: string;

  // =========================================================================
  // DATOS DE REGISTRO MERCANTIL
  // =========================================================================
  matricula_mercantil?: string;
  camara_comercio?: string;
  fecha_constitucion?: string | null;
  fecha_inscripcion_registro?: string | null;

  // =========================================================================
  // CONFIGURACIÓN REGIONAL
  // =========================================================================
  zona_horaria?: ZonaHoraria;
  formato_fecha?: FormatoFecha;
  moneda?: Moneda;
  simbolo_moneda?: string;
  separador_miles?: string;
  separador_decimales?: string;

  // =========================================================================
  // BRANDING - IDENTIDAD VISUAL (migrado de BrandingConfig)
  // =========================================================================
  company_slogan?: string;
  logo?: string | null;
  logo_white?: string | null;
  logo_dark?: string | null;
  favicon?: string | null;
  login_background?: string | null;

  // Colores
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  sidebar_color?: string;
  background_color?: string;
  showcase_background?: string;

  // Gradientes
  gradient_mission?: string;
  gradient_vision?: string;
  gradient_policy?: string;
  gradient_values?: string[];

  // PWA
  pwa_name?: string;
  pwa_short_name?: string;
  pwa_description?: string;
  pwa_theme_color?: string;
  pwa_background_color?: string;
  pwa_icon_192?: string | null;
  pwa_icon_512?: string | null;
  pwa_icon_maskable?: string | null;

  // Backup
  backup_enabled?: boolean;
  backup_retention_days?: number;

  // Legacy (deprecated)
  logo_url?: string | null;
  logo_effective?: string | null;

  // Auditoría
  created_at: string;
  updated_at: string;
  notes?: string | null;
  user_count?: number;
}

export type TenantTier = 'starter' | 'small' | 'medium' | 'large' | 'enterprise';

export interface CreateTenantDTO {
  // Identificación básica
  code: string;
  name: string;
  nit?: string | null;
  subdomain: string;

  // Plan y límites
  plan?: number | null;
  max_users?: number;
  max_storage_gb?: number;
  tier?: TenantTier;
  enabled_modules?: string[];

  // Estado
  is_active?: boolean;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;

  // Branding básico (para creación inicial)
  primary_color?: string;
  notes?: string | null;
}

export interface UpdateTenantDTO {
  // Identificación (algunos no editables)
  name?: string;
  nit?: string | null;

  // Plan y límites
  plan?: number | null;
  max_users?: number;
  max_storage_gb?: number;
  tier?: TenantTier;
  enabled_modules?: string[];

  // Estado
  is_active?: boolean;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;

  // Datos fiscales
  razon_social?: string;
  nombre_comercial?: string;
  representante_legal?: string;
  cedula_representante?: string;
  tipo_sociedad?: TipoSociedad;
  actividad_economica?: string;
  descripcion_actividad?: string;
  regimen_tributario?: RegimenTributario;

  // Contacto
  direccion_fiscal?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigo_postal?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  email_corporativo?: string;
  sitio_web?: string;

  // Registro
  matricula_mercantil?: string;
  camara_comercio?: string;
  fecha_constitucion?: string | null;
  fecha_inscripcion_registro?: string | null;

  // Configuración regional
  zona_horaria?: ZonaHoraria;
  formato_fecha?: FormatoFecha;
  moneda?: Moneda;
  simbolo_moneda?: string;
  separador_miles?: string;
  separador_decimales?: string;

  // Branding
  company_slogan?: string;
  logo?: File | string | null;
  logo_white?: File | string | null;
  logo_dark?: File | string | null;
  favicon?: File | string | null;
  login_background?: File | string | null;

  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  sidebar_color?: string;
  background_color?: string;
  showcase_background?: string;

  gradient_mission?: string;
  gradient_vision?: string;
  gradient_policy?: string;
  gradient_values?: string[];

  // PWA
  pwa_name?: string;
  pwa_short_name?: string;
  pwa_description?: string;
  pwa_theme_color?: string;
  pwa_background_color?: string;
  pwa_icon_192?: File | string | null;
  pwa_icon_512?: File | string | null;
  pwa_icon_maskable?: File | string | null;

  // Backup
  backup_enabled?: boolean;
  backup_retention_days?: number;

  notes?: string | null;
}

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
  /** @deprecated Los permisos se manejan via User.cargo dentro del tenant */
  role?: TenantRole;
  is_active: boolean;
  granted_at: string;
}

export interface TenantMinimal {
  id: number;
  code: string;
  name: string;
  subdomain?: string | null;
  primary_domain?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  logo_effective?: string | null;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  company_slogan?: string;
  nombre_comercial?: string;
  nit?: string;
  tier?: string;
  plan_name?: string | null;
  is_active: boolean;
  is_trial?: boolean;
  enabled_modules?: string[];
}

/**
 * @deprecated Los permisos se manejan via User.cargo dentro del tenant
 * Este tipo se mantiene por compatibilidad
 */
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

/**
 * DTO para asignar un usuario a un tenant.
 * Los permisos se manejan via User.cargo dentro del schema del tenant.
 */
export interface AssignTenantDTO {
  tenant_id: number;
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
