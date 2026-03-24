/**
 * Tipos para módulo de gestión de usuarios
 */

export interface Cargo {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
}

export type UserOrigen =
  | 'colaborador'
  | 'proveedor_portal'
  | 'proveedor_profesional'
  | 'cliente_portal'
  | 'manual';

export const ORIGEN_LABELS: Record<UserOrigen, string> = {
  colaborador: 'Colaborador (TH)',
  proveedor_portal: 'Proveedor (Portal)',
  proveedor_profesional: 'Proveedor (Profesional)',
  cliente_portal: 'Cliente (Portal)',
  manual: 'Manual',
};

export const ORIGEN_COLORS: Record<UserOrigen, string> = {
  colaborador: 'info',
  proveedor_portal: 'warning',
  proveedor_profesional: 'primary',
  cliente_portal: 'success',
  manual: 'gray',
};

export type NivelFirma = 1 | 2 | 3;

export const NIVEL_FIRMA_LABELS: Record<NivelFirma, string> = {
  1: 'Nivel 1 — Operativo',
  2: 'Nivel 2 — TOTP',
  3: 'Nivel 3 — TOTP + Email',
};

export const NIVEL_FIRMA_DESCRIPTIONS: Record<NivelFirma, string> = {
  1: 'Solo firma manuscrita digital (sin verificación 2FA)',
  2: 'Firma manuscrita + código TOTP obligatorio',
  3: 'Firma manuscrita + TOTP o código OTP por email',
};

export const NIVEL_FIRMA_COLORS: Record<NivelFirma, string> = {
  1: 'gray',
  2: 'warning',
  3: 'danger',
};

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cargo: Cargo | null;
  cargo_name?: string;
  phone?: string | null;
  photo?: string | null;
  document_type: 'CC' | 'CE' | 'NIT' | '';
  document_type_display?: string;
  document_number: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  date_joined: string;
  origen?: UserOrigen;
  nivel_firma: NivelFirma;
  nivel_firma_manual?: boolean;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  cargo_id?: number;
  phone?: string;
  document_type?: string;
  document_number?: string;
  is_active?: boolean;
  is_staff?: boolean;
  nivel_firma?: NivelFirma;
  nivel_firma_manual?: boolean;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserFilters {
  search?: string;
  cargo?: string;
  cargo__code?: string;
  is_active?: boolean | string;
  tipo?: 'todos' | 'interno' | 'externo';
  origen?: UserOrigen | '';
  page?: number;
  page_size?: number;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}
