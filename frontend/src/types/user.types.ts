// Types para gestión de usuarios
import type { PaginatedResponse } from './api.types';

// Re-export for backwards compatibility
export type { PaginatedResponse };

export interface Cargo {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  level_display: string;
  is_active: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cargo: Cargo | null;
  phone?: string;
  document_type: 'CC' | 'CE' | 'NIT';
  document_number: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  cargo: number;
  phone?: string;
  document_type: 'CC' | 'CE' | 'NIT';
  document_number: string;
}

export interface UsersFilters {
  search?: string;
  cargo?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}
