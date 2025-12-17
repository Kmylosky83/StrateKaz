/**
 * API Client para gestion de RBAC (Cargos, Roles, Permisos, Grupos)
 */
import axiosInstance from '@/api/axios-config';
import type {
  Cargo,
  CreateCargoDTO,
  UpdateCargoDTO,
  CargoFilters,
  PaginatedCargosResponse,
  Role,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleFilters,
  PaginatedRolesResponse,
  Group,
  CreateGroupDTO,
  UpdateGroupDTO,
  GroupFilters,
  PaginatedGroupsResponse,
  Permission,
  PermissionFilters,
  PaginatedPermissionsResponse,
  PermissionGroup,
  RBACStats,
  SelectOption,
} from '../types/rbac.types';

/**
 * Construye query string desde filtros
 */
function buildQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

export const rbacAPI = {
  // ==================== CARGOS ====================

  /**
   * Obtener lista de cargos con filtros
   */
  getCargos: async (filters?: CargoFilters): Promise<PaginatedCargosResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `/core/cargos-rbac/?${queryString}` : '/core/cargos-rbac/';
    const response = await axiosInstance.get<PaginatedCargosResponse>(url);
    return response.data;
  },

  /**
   * Obtener un cargo por ID
   */
  getCargo: async (id: number): Promise<Cargo> => {
    const response = await axiosInstance.get<Cargo>(`/core/cargos-rbac/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo cargo
   */
  createCargo: async (data: CreateCargoDTO): Promise<Cargo> => {
    const response = await axiosInstance.post<Cargo>('/core/cargos-rbac/', data);
    return response.data;
  },

  /**
   * Actualizar cargo existente
   */
  updateCargo: async (id: number, data: UpdateCargoDTO): Promise<Cargo> => {
    const response = await axiosInstance.patch<Cargo>(`/core/cargos-rbac/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar cargo (soft delete)
   */
  deleteCargo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/core/cargos-rbac/${id}/`);
  },

  /**
   * Asignar permisos a cargo
   */
  assignPermissionsToCargo: async (
    id: number,
    permission_ids: number[],
    replace = false
  ): Promise<Cargo> => {
    const response = await axiosInstance.post<Cargo>(
      `/core/cargos-rbac/${id}/assign-permissions/`,
      { permission_ids, replace }
    );
    return response.data;
  },

  /**
   * Asignar roles por defecto a cargo
   */
  assignRolesToCargo: async (
    id: number,
    role_ids: number[],
    replace = false
  ): Promise<Cargo> => {
    const response = await axiosInstance.post<Cargo>(
      `/core/cargos-rbac/${id}/assign-roles/`,
      { role_ids, replace }
    );
    return response.data;
  },

  /**
   * Obtener niveles disponibles
   */
  getCargoLevels: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get<SelectOption[]>('/core/cargos-rbac/levels/');
    return response.data;
  },

  /**
   * Obtener areas disponibles
   */
  getCargoAreas: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get<SelectOption[]>('/core/cargos-rbac/areas/');
    return response.data;
  },

  /**
   * Obtener todos los choices para formularios de cargo
   */
  getCargoChoices: async (): Promise<{
    nivel_jerarquico_choices: SelectOption[];
    nivel_educativo_choices: SelectOption[];
    experiencia_choices: SelectOption[];
    areas: SelectOption[];
  }> => {
    const response = await axiosInstance.get('/core/cargos-rbac/choices/');
    return response.data;
  },

  // ==================== ROLES ====================

  /**
   * Obtener lista de roles con filtros
   */
  getRoles: async (filters?: RoleFilters): Promise<PaginatedRolesResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `/core/roles/?${queryString}` : '/core/roles/';
    const response = await axiosInstance.get<PaginatedRolesResponse>(url);
    return response.data;
  },

  /**
   * Obtener un rol por ID
   */
  getRole: async (id: number): Promise<Role> => {
    const response = await axiosInstance.get<Role>(`/core/roles/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo rol
   */
  createRole: async (data: CreateRoleDTO): Promise<Role> => {
    const response = await axiosInstance.post<Role>('/core/roles/', data);
    return response.data;
  },

  /**
   * Actualizar rol existente
   */
  updateRole: async (id: number, data: UpdateRoleDTO): Promise<Role> => {
    const response = await axiosInstance.patch<Role>(`/core/roles/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar rol (soft delete)
   */
  deleteRole: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/core/roles/${id}/`);
  },

  /**
   * Asignar permisos a un rol
   */
  assignPermissionsToRole: async (
    id: number,
    permission_ids: number[],
    replace = false
  ): Promise<Role> => {
    const response = await axiosInstance.post<Role>(
      `/core/roles/${id}/assign-permissions/`,
      { permission_ids, replace }
    );
    return response.data;
  },

  /**
   * Remover permisos de un rol
   */
  removePermissionsFromRole: async (
    id: number,
    permission_ids: number[]
  ): Promise<{ message: string; role: Role }> => {
    const response = await axiosInstance.post<{ message: string; role: Role }>(
      `/core/roles/${id}/remove-permissions/`,
      { permission_ids }
    );
    return response.data;
  },

  // ==================== GROUPS ====================

  /**
   * Obtener lista de grupos con filtros
   */
  getGroups: async (filters?: GroupFilters): Promise<PaginatedGroupsResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `/core/groups/?${queryString}` : '/core/groups/';
    const response = await axiosInstance.get<PaginatedGroupsResponse>(url);
    return response.data;
  },

  /**
   * Obtener un grupo por ID
   */
  getGroup: async (id: number): Promise<Group> => {
    const response = await axiosInstance.get<Group>(`/core/groups/${id}/`);
    return response.data;
  },

  /**
   * Crear nuevo grupo
   */
  createGroup: async (data: CreateGroupDTO): Promise<Group> => {
    const response = await axiosInstance.post<Group>('/core/groups/', data);
    return response.data;
  },

  /**
   * Actualizar grupo existente
   */
  updateGroup: async (id: number, data: UpdateGroupDTO): Promise<Group> => {
    const response = await axiosInstance.patch<Group>(`/core/groups/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar grupo (soft delete)
   */
  deleteGroup: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/core/groups/${id}/`);
  },

  /**
   * Agregar usuarios a grupo
   */
  addUsersToGroup: async (
    id: number,
    user_ids: number[],
    leader_id?: number
  ): Promise<Group> => {
    const response = await axiosInstance.post<Group>(
      `/core/groups/${id}/add-users/`,
      { user_ids, leader_id }
    );
    return response.data;
  },

  /**
   * Remover usuarios de grupo
   */
  removeUsersFromGroup: async (
    id: number,
    user_ids: number[]
  ): Promise<{ message: string; group: Group }> => {
    const response = await axiosInstance.post<{ message: string; group: Group }>(
      `/core/groups/${id}/remove-users/`,
      { user_ids }
    );
    return response.data;
  },

  /**
   * Asignar roles a grupo
   */
  assignRolesToGroup: async (
    id: number,
    role_ids: number[],
    replace = false
  ): Promise<Group> => {
    const response = await axiosInstance.post<Group>(
      `/core/groups/${id}/assign-roles/`,
      { role_ids, replace }
    );
    return response.data;
  },

  // ==================== PERMISOS ====================

  /**
   * Obtener lista de permisos con filtros
   */
  getPermissions: async (filters?: PermissionFilters): Promise<PaginatedPermissionsResponse> => {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString ? `/core/permissions/?${queryString}` : '/core/permissions/';
    const response = await axiosInstance.get<PaginatedPermissionsResponse>(url);
    return response.data;
  },

  /**
   * Obtener un permiso por ID
   */
  getPermission: async (id: number): Promise<Permission> => {
    const response = await axiosInstance.get<Permission>(`/core/permissions/${id}/`);
    return response.data;
  },

  /**
   * Obtener modulos disponibles
   */
  getPermissionModules: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get<SelectOption[]>('/core/permissions/modules/');
    return response.data;
  },

  /**
   * Obtener permisos agrupados por modulo
   */
  getPermissionsGrouped: async (): Promise<PermissionGroup[]> => {
    const response = await axiosInstance.get<PermissionGroup[]>('/core/permissions/grouped/');
    return response.data;
  },

  // ==================== STATS ====================

  /**
   * Obtener estadisticas RBAC
   */
  getStats: async (): Promise<RBACStats> => {
    const response = await axiosInstance.get<RBACStats>('/core/rbac/stats/');
    return response.data;
  },
};
