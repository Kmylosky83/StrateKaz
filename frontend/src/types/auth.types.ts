/**
 * Tipos para autenticación y usuarios
 */

export interface Cargo {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  level_display: string;
  parent_cargo: number | null;
  is_active: boolean;
  /** Indica si el cargo tiene rol de jefatura (ve Mi Equipo en sidebar) */
  is_jefatura: boolean;
  subordinados_count: number;
  /** ID del área a la que pertenece el cargo */
  area_id?: number;
  /** Nombre del área a la que pertenece el cargo */
  area_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  cargo: Cargo | null;
  cargo_code: string | null;
  cargo_level: number | null;
  document_type: string;
  document_type_display: string;
  document_number: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_deleted: boolean;
  date_joined: string;
  last_login: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Campos de contexto organizacional
  /** Nombre de la empresa (desde el Tenant actual) */
  empresa_nombre?: string;
  /** Nombre del área del usuario (desde cargo.area) */
  area_nombre?: string;
  // Campos RBAC para control de acceso
  /** IDs de secciones autorizadas. null = superuser (acceso total), [] = sin acceso */
  section_ids: number[] | null;
  /** Códigos de permisos CRUD. ['*'] = superuser (todos), [] = sin permisos */
  permission_codes: string[] | null;
  /** URL de la foto de perfil del usuario */
  photo_url?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Información mínima de un tenant (coincide con TenantMinimalSerializer)
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
 */
export interface TenantAccess {
  tenant: TenantInfo;
  role: string;
}

/**
 * Usuario global del sistema multi-tenant (TenantUser)
 */
export interface TenantUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_superadmin: boolean;
  last_tenant_id: number | null;
}

/**
 * Respuesta del login multi-tenant
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  user: TenantUser;
  tenants: TenantAccess[];
  last_tenant_id: number | null;
}

/**
 * Respuesta del endpoint /me/ multi-tenant
 */
export interface TenantMeResponse extends TenantUser {
  tenants: TenantAccess[];
}

/**
 * Respuesta de selección de tenant
 */
export interface SelectTenantResponse {
  status: string;
  tenant: TenantInfo;
  message: string;
}

export interface AuthState {
  // Usuario global del sistema multi-tenant
  tenantUser: TenantUser | null;
  // Usuario del tenant actual (cargado después de seleccionar tenant)
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Indica si el perfil del User (core.User) está siendo cargado */
  isLoadingUser: boolean;
  /** ID del tenant actual (null = modo Admin Global o sin tenant) */
  currentTenantId: number | null;
  /** Información del tenant actual */
  currentTenant: TenantInfo | null;
  /** Lista de tenants accesibles */
  accessibleTenants: TenantAccess[];
  /** Es superadmin (acceso a todos los tenants) */
  isSuperadmin: boolean;
  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTenantProfile: () => Promise<void>;
  selectTenant: (tenantId: number) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  setUser: (user: User) => void;
  setCurrentTenantId: (tenantId: number | null) => void;
  clearTenantContext: () => void;
}
