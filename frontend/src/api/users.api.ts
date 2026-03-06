import axiosInstance from './axios-config';
import type {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  ChangePasswordDTO,
  UserFilters,
  PaginatedUsersResponse,
  Cargo,
} from '@/types/users.types';

/**
 * API Client para gestión de usuarios
 */
export const usersAPI = {
  /**
   * Obtener lista de usuarios con paginación y filtros
   */
  getUsers: async (filters?: UserFilters): Promise<PaginatedUsersResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.cargo) params.append('cargo', filters.cargo);
    if (filters?.cargo__code) params.append('cargo__code', filters.cargo__code);
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active));
    }
    if (filters?.tipo && filters.tipo !== 'todos') {
      params.append('tipo', filters.tipo);
    }
    if (filters?.origen) {
      params.append('origen', filters.origen);
    }
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString ? `/core/users/?${queryString}` : '/core/users/';

    const response = await axiosInstance.get<PaginatedUsersResponse>(url);
    return response.data;
  },

  /**
   * Obtener un usuario por ID
   */
  getUser: async (id: number): Promise<User> => {
    const response = await axiosInstance.get<User>(`/core/users/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo usuario
   */
  createUser: async (data: CreateUserDTO): Promise<User> => {
    const response = await axiosInstance.post<User>('/core/users/', data);
    return response.data;
  },

  /**
   * Actualizar usuario existente
   */
  updateUser: async (id: number, data: UpdateUserDTO): Promise<User> => {
    const response = await axiosInstance.patch<User>(`/core/users/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar usuario (soft delete)
   */
  deleteUser: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/core/users/${id}/`);
  },

  /**
   * Cambiar contraseña de un usuario
   */
  changePassword: async (id: number, data: ChangePasswordDTO): Promise<void> => {
    await axiosInstance.post(`/core/users/${id}/change_password/`, {
      old_password: data.current_password,
      new_password: data.new_password,
    });
  },

  /**
   * Obtener lista de cargos (sin system cargos, page_size=100)
   */
  getCargos: async (): Promise<{ count: number; results: Cargo[] }> => {
    const response = await axiosInstance.get<{ count: number; results: Cargo[] }>(
      '/core/cargos-rbac/?page_size=100'
    );
    return response.data;
  },

  /**
   * Activar/Desactivar usuario
   */
  toggleUserStatus: async (id: number, is_active: boolean): Promise<User> => {
    const response = await axiosInstance.patch<User>(`/core/users/${id}/`, {
      is_active,
    });
    return response.data;
  },
};
