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
  /** Indica si es un cargo externo (contratista, consultor, auditor) */
  is_externo: boolean;
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
  /** ID del proveedor vinculado (para usuarios externos: consultores, auditores) */
  proveedor?: number | null;
  /** Nombre comercial del proveedor vinculado */
  proveedor_nombre?: string | null;
  /** ID del cliente vinculado (para usuarios del portal de clientes) */
  cliente?: number | null;
  /** Nombre comercial del cliente vinculado */
  cliente_nombre?: string | null;
  /** Nivel de firma digital (1=sin 2FA, 2=TOTP, 3=TOTP+OTP) */
  nivel_firma?: number;
  /** Si tiene firma manuscrita guardada en perfil */
  tiene_firma_guardada?: boolean;
  /** Si tiene iniciales guardadas en perfil */
  tiene_iniciales_guardadas?: boolean;
  /** Si el usuario tiene 2FA habilitado (usado para flujo de impersonación) */
  has_2fa_enabled?: boolean;
  /** Roles adicionales activos del usuario */
  roles_adicionales?: Array<{ id: number; code: string; nombre: string }>;
  /** Grupos a los que pertenece el usuario */
  groups?: Array<{ id: number; code: string; name: string }>;
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
  /** Indica si el superadmin está visitando un tenant desde Admin Global */
  isImpersonating: boolean;
  /** Perfil original del superadmin guardado antes de impersonar un usuario */
  originalUser: User | null;
  /** ID del usuario impersonado (null = no impersonando usuario específico) */
  impersonatedUserId: number | null;
  /** Flag transitorio: el superadmin quiere seleccionar un usuario para impersonar */
  pendingUserSelection: boolean;
  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Logout sin llamada al backend — para usar cuando el refresh token falla */
  forceLogout: () => void;
  refreshTenantProfile: () => Promise<void>;
  /** Fuerza recarga del perfil del User (ignora guard de user existente) */
  refreshUserProfile: () => Promise<void>;
  selectTenant: (tenantId: number) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  setUser: (user: User) => void;
  setCurrentTenantId: (tenantId: number | null) => void;
  clearTenantContext: () => void;
  /** Superadmin entra a un tenant desde Admin Global */
  startImpersonation: (tenantId: number) => Promise<void>;
  /** Superadmin sale del tenant y vuelve a Admin Global */
  stopImpersonation: () => void;
  /** Superadmin ve la app como un usuario específico dentro del tenant */
  startUserImpersonation: (userId: number, impersonationToken?: string) => Promise<void>;
  /** Deja de ver como usuario específico (vuelve a vista admin en el tenant) */
  stopUserImpersonation: () => void;
  /** Controla el flag pendingUserSelection */
  setPendingUserSelection: (pending: boolean) => void;
}
