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
  /** Nombre de la empresa (desde BrandingConfig) */
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
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>; // P0-03: Ahora es async para invalidar token en servidor
  refreshProfile: () => Promise<void>;
  setUser: (user: User) => void;
}
