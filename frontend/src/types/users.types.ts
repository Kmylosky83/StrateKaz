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
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  cargo_id: number;
  phone?: string;
  document_type: string;
  document_number: string;
  is_active?: boolean;
  is_staff?: boolean;
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
  page?: number;
  page_size?: number;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}
