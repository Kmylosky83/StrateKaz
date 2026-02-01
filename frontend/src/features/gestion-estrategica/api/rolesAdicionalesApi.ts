/**
 * API Client para Roles Adicionales (RBAC Híbrido)
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';

const BASE_URL = '/core/roles-adicionales';

// ==================== TYPES ====================

export type TipoRolAdicional = 'LEGAL_OBLIGATORIO' | 'SISTEMA_GESTION' | 'OPERATIVO' | 'CUSTOM';

export interface RolAdicionalList {
  id: number;
  code: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRolAdicional;
  tipo_display: string;
  justificacion_legal: string | null;
  requiere_certificacion: boolean;
  certificacion_requerida: string | null;
  is_system: boolean;
  is_active: boolean;
  permisos_count: number;
  usuarios_count: number;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermisoBasico {
  id: number;
  code: string;
  name: string;
  description: string;
  module: string;
  module_display: string;
  action: string;
  action_display: string;
  scope: string;
  scope_display: string;
  is_active: boolean;
  created_at: string;
}

export interface UsuarioAsignado {
  id: number;
  user_id: number;
  user_nombre: string;
  user_email: string;
  assigned_at: string;
  expires_at: string | null;
  assigned_by_nombre: string | null;
  justificacion: string | null;
  fecha_certificacion: string | null;
  certificacion_expira: string | null;
  is_expired: boolean;
  is_certification_expired: boolean;
}

export interface RolAdicionalDetail extends RolAdicionalList {
  permisos: PermisoBasico[];
  usuarios_asignados: UsuarioAsignado[];
  created_by: number | null;
}

export interface CreateRolAdicionalDTO {
  code: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoRolAdicional;
  justificacion_legal?: string;
  requiere_certificacion?: boolean;
  certificacion_requerida?: string;
  is_active?: boolean;
  permisos_ids?: number[];
}

export interface UpdateRolAdicionalDTO {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoRolAdicional;
  justificacion_legal?: string;
  requiere_certificacion?: boolean;
  certificacion_requerida?: string;
  is_active?: boolean;
  permisos_ids?: number[];
}

export interface AsignarRolDTO {
  user_id: number;
  rol_adicional_id: number;
  expires_at?: string | null;
  justificacion?: string;
  fecha_certificacion?: string | null;
  certificacion_expira?: string | null;
}

export interface RevocarRolDTO {
  user_id: number;
  rol_adicional_id: number;
}

export interface UserRolAdicional {
  id: number;
  user: number;
  user_nombre: string;
  rol_adicional: number;
  rol_adicional_nombre: string;
  rol_adicional_code: string;
  rol_adicional_tipo: TipoRolAdicional;
  assigned_at: string;
  expires_at: string | null;
  assigned_by: number | null;
  assigned_by_nombre: string | null;
  justificacion: string | null;
  certificacion_adjunta: string | null;
  fecha_certificacion: string | null;
  certificacion_expira: string | null;
  is_active: boolean;
  is_expired: boolean;
  is_certification_expired: boolean;
}

export interface PlantillaRol {
  code: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRolAdicional;
  tipo_display: string;
  justificacion_legal: string;
  requiere_certificacion: boolean;
  certificacion_requerida: string;
  permisos_sugeridos: string[];
  ya_existe: boolean;
}

export interface TipoRolOption {
  value: TipoRolAdicional;
  label: string;
}

export interface RolesAdicionalesFilters {
  tipo?: TipoRolAdicional;
  is_system?: boolean;
  is_active?: boolean;
  requiere_certificacion?: boolean;
  search?: string;
  include_inactive?: boolean;
}

// PaginatedResponse: importar desde '@/types'
import type { PaginatedResponse } from '@/types';

export interface PermisosEfectivos {
  user_id: number;
  user_nombre: string;
  cargo: string | null;
  permisos_cargo: PermisoBasico[];
  permisos_roles_adicionales: {
    rol_code: string;
    rol_nombre: string;
    permisos: PermisoBasico[];
  }[];
  permisos_efectivos: PermisoBasico[];
  total_permisos: number;
}

export interface CertificacionPorVencer {
  user_id: number;
  user_nombre: string;
  dias_limite: number;
  certificaciones_por_vencer: UserRolAdicional[];
  total: number;
}

// ==================== API ====================

export const rolesAdicionalesApi = {
  // ==================== CRUD ROLES ====================

  /**
   * Listar todos los roles adicionales
   */
  getAll: async (filters?: RolesAdicionalesFilters): Promise<RolAdicionalList[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/`, { params: filters });
    // La API puede retornar array o paginado
    return Array.isArray(response.data) ? response.data : response.data.results;
  },

  /**
   * Obtener detalle de un rol adicional
   */
  getById: async (id: number): Promise<RolAdicionalDetail> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo rol adicional
   */
  create: async (data: CreateRolAdicionalDTO): Promise<RolAdicionalDetail> => {
    const response = await axiosInstance.post(`${BASE_URL}/`, data);
    return response.data;
  },

  /**
   * Actualizar un rol adicional
   */
  update: async (id: number, data: UpdateRolAdicionalDTO): Promise<RolAdicionalDetail> => {
    const response = await axiosInstance.patch(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un rol adicional (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}/`);
  },

  // ==================== ENDPOINTS ESPECIALES ====================

  /**
   * Obtener tipos de roles disponibles
   */
  getTipos: async (): Promise<TipoRolOption[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/`);
    return response.data;
  },

  /**
   * Obtener plantillas de roles sugeridos
   */
  getSugeridos: async (): Promise<PlantillaRol[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/sugeridos/`);
    return response.data;
  },

  /**
   * Crear un rol desde una plantilla sugerida
   */
  crearDesdePlantilla: async (code: string): Promise<RolAdicionalDetail> => {
    const response = await axiosInstance.post(`${BASE_URL}/crear-desde-plantilla/`, { code });
    return response.data;
  },

  /**
   * Obtener usuarios asignados a un rol
   */
  getUsuarios: async (rolId: number): Promise<UserRolAdicional[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/${rolId}/usuarios/`);
    return response.data;
  },

  // ==================== ASIGNACIÓN DE ROLES ====================

  /**
   * Asignar un rol adicional a un usuario
   */
  asignar: async (data: AsignarRolDTO): Promise<UserRolAdicional> => {
    const response = await axiosInstance.post(`${BASE_URL}/asignar/`, data);
    return response.data;
  },

  /**
   * Revocar un rol adicional de un usuario
   */
  revocar: async (data: RevocarRolDTO): Promise<{ message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/revocar/`, data);
    return response.data;
  },
};

// ==================== API PARA USUARIOS (permisos efectivos) ====================

export const userRolesAdicionalesApi = {
  /**
   * Obtener roles adicionales de un usuario específico
   */
  getRolesDeUsuario: async (userId: number): Promise<UserRolAdicional[]> => {
    const response = await axiosInstance.get(`/core/users/${userId}/roles-adicionales/`);
    return response.data;
  },

  /**
   * Obtener permisos efectivos de un usuario (desglosados por fuente)
   */
  getPermisosEfectivos: async (userId: number): Promise<PermisosEfectivos> => {
    const response = await axiosInstance.get(`/core/users/${userId}/permisos-efectivos/`);
    return response.data;
  },

  /**
   * Obtener certificaciones próximas a vencer de un usuario
   */
  getCertificacionesPorVencer: async (userId: number, dias: number = 30): Promise<CertificacionPorVencer> => {
    const response = await axiosInstance.get(`/core/users/${userId}/certificaciones-por-vencer/`, {
      params: { dias }
    });
    return response.data;
  },
};

// ==================== PERMISOS API ====================

export const permisosApi = {
  /**
   * Obtener todos los permisos del sistema
   */
  getAll: async (): Promise<PermisoBasico[]> => {
    const response = await axiosInstance.get('/core/permissions/');
    return Array.isArray(response.data) ? response.data : response.data.results;
  },

  /**
   * Obtener permisos agrupados por módulo
   */
  getGrouped: async (): Promise<{ module: string; module_name: string; permissions: PermisoBasico[] }[]> => {
    const response = await axiosInstance.get('/core/permissions/grouped/');
    return response.data;
  },

  /**
   * Obtener módulos disponibles
   */
  getModules: async (): Promise<{ value: string; label: string }[]> => {
    const response = await axiosInstance.get('/core/permissions/modules/');
    return response.data;
  },
};

// ==================== CARGOS API (para permisos) ====================

export const cargosRbacApi = {
  /**
   * Obtener todos los cargos con información de permisos
   */
  getAll: async (): Promise<{
    id: number;
    code: string;
    name: string;
    level: number;
    level_display: string;
    permissions_count: number;
    users_count: number;
    is_active: boolean;
  }[]> => {
    const response = await axiosInstance.get('/core/cargos-rbac/');
    return Array.isArray(response.data) ? response.data : response.data.results;
  },

  /**
   * Obtener detalle de un cargo con permisos
   */
  getById: async (id: number): Promise<{
    id: number;
    code: string;
    name: string;
    description: string;
    level: number;
    level_display: string;
    permissions_count: number;
    permisos: PermisoBasico[];
    is_active: boolean;
  }> => {
    const response = await axiosInstance.get(`/core/cargos-rbac/${id}/`);
    return response.data;
  },

  /**
   * Actualizar permisos de un cargo
   */
  updatePermisos: async (id: number, permisosIds: number[]): Promise<void> => {
    await axiosInstance.patch(`/core/cargos-rbac/${id}/`, { permisos_ids: permisosIds });
  },
};

export default rolesAdicionalesApi;
