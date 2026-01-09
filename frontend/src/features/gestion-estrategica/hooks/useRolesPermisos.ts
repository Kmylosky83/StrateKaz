/**
 * Hooks para gestión de Roles y Permisos (RBAC Híbrido)
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios-config';
import type {
  Permiso,
  PermisoAgrupado,
  CargoConPermisos,
  RolAdicional,
  CreateRolAdicionalDTO,
  UpdateRolAdicionalDTO,
  PermisosFilters,
  RolesFilters,
} from '../components/organizacion/roles/types';

// Tipo para asignación de rol a usuario
interface AsignarRolUsuarioDTO {
  user_id: number;
  rol_adicional_id: number;
  expires_at?: string | null;
  justificacion?: string;
  fecha_certificacion?: string | null;
  certificacion_expira?: string | null;
}

// Alias para consistencia
const api = axiosInstance;

// ==================== API ENDPOINTS ====================

const ENDPOINTS = {
  permisos: '/core/permissions/',
  permisosAgrupados: '/core/permissions/grouped/',
  cargosPermisos: '/core/cargos-rbac/',
  rolesAdicionales: '/core/roles-adicionales/',
} as const;

// ==================== PERMISOS ====================

/**
 * Hook para obtener lista de todos los permisos
 */
export function usePermisos(filters?: PermisosFilters) {
  return useQuery({
    queryKey: ['permisos', filters],
    queryFn: async () => {
      const response = await api.get<{ results: Permiso[]; count: number }>(
        ENDPOINTS.permisos,
        { params: filters }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos (los permisos no cambian frecuentemente)
  });
}

/**
 * Hook para obtener permisos agrupados por módulo
 */
export function usePermisosAgrupados() {
  return useQuery({
    queryKey: ['permisos-agrupados'],
    queryFn: async () => {
      const response = await api.get<PermisoAgrupado[]>(ENDPOINTS.permisosAgrupados);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== CARGOS CON PERMISOS ====================

/**
 * Hook para obtener cargos con sus permisos asignados
 */
export function useCargosConPermisos(filters?: { search?: string; area?: number }) {
  return useQuery({
    queryKey: ['cargos-permisos', filters],
    queryFn: async () => {
      const response = await api.get<{ results: CargoConPermisos[]; count: number }>(
        ENDPOINTS.cargosPermisos,
        { params: filters }
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener permisos de un cargo específico
 */
export function useCargoPermisos(cargoId: number | null) {
  return useQuery({
    queryKey: ['cargo-permisos', cargoId],
    queryFn: async () => {
      const response = await api.get<CargoConPermisos>(
        `${ENDPOINTS.cargosPermisos}${cargoId}/`
      );
      return response.data;
    },
    enabled: !!cargoId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para asignar/actualizar permisos de un cargo
 */
export function useAsignarPermisosCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cargoId,
      permissionIds,
    }: {
      cargoId: number;
      permissionIds: number[];
    }) => {
      const response = await api.post<CargoConPermisos>(
        `${ENDPOINTS.cargosPermisos}${cargoId}/asignar-permisos/`,
        { permission_ids: permissionIds }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cargos-permisos'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-permisos', data.id] });
      toast.success('Permisos del cargo actualizados correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al asignar permisos al cargo';
      toast.error(message);
    },
  });
}

// ==================== ROLES ADICIONALES ====================

/**
 * Hook para obtener roles adicionales
 */
export function useRolesAdicionales(filters?: RolesFilters) {
  return useQuery({
    queryKey: ['roles-adicionales', filters],
    queryFn: async () => {
      const response = await api.get<{ results: RolAdicional[]; count: number }>(
        ENDPOINTS.rolesAdicionales,
        { params: filters }
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener un rol adicional específico
 */
export function useRolAdicional(rolId: number | null) {
  return useQuery({
    queryKey: ['rol-adicional', rolId],
    queryFn: async () => {
      const response = await api.get<RolAdicional>(
        `${ENDPOINTS.rolesAdicionales}${rolId}/`
      );
      return response.data;
    },
    enabled: !!rolId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para crear rol adicional
 */
export function useCreateRolAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRolAdicionalDTO) => {
      const response = await api.post<RolAdicional>(ENDPOINTS.rolesAdicionales, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      toast.success('Rol adicional creado correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al crear el rol adicional';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar rol adicional
 */
export function useUpdateRolAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateRolAdicionalDTO;
    }) => {
      const response = await api.patch<RolAdicional>(
        `${ENDPOINTS.rolesAdicionales}${id}/`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      queryClient.invalidateQueries({ queryKey: ['rol-adicional', data.id] });
      toast.success('Rol adicional actualizado correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al actualizar el rol adicional';
      toast.error(message);
    },
  });
}

/**
 * Hook para eliminar rol adicional
 */
export function useDeleteRolAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${ENDPOINTS.rolesAdicionales}${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      toast.success('Rol adicional eliminado correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al eliminar el rol adicional';
      toast.error(message);
    },
  });
}

/**
 * Hook para activar/desactivar rol adicional
 */
export function useToggleRolActivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const response = await api.patch<RolAdicional>(
        `${ENDPOINTS.rolesAdicionales}${id}/`,
        { is_active }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      queryClient.invalidateQueries({ queryKey: ['rol-adicional', data.id] });
      toast.success(
        `Rol ${data.is_active ? 'activado' : 'desactivado'} correctamente`
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al cambiar estado del rol';
      toast.error(message);
    },
  });
}

// ==================== TIPOS DE ROL ====================

/**
 * Hook para obtener tipos de roles disponibles
 */
export function useTiposRol() {
  return useQuery({
    queryKey: ['tipos-rol'],
    queryFn: async () => {
      const response = await api.get<{ value: string; label: string }[]>(
        `${ENDPOINTS.rolesAdicionales}tipos/`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== ASIGNACIÓN DE ROLES A USUARIOS ====================

/**
 * Hook para obtener usuarios asignados a un rol
 */
export function useUsuariosRol(rolId: number | null) {
  return useQuery({
    queryKey: ['usuarios-rol', rolId],
    queryFn: async () => {
      const response = await api.get<any[]>(
        `${ENDPOINTS.rolesAdicionales}${rolId}/usuarios/`
      );
      return response.data;
    },
    enabled: !!rolId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para asignar rol adicional a un usuario
 */
export function useAsignarRolUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AsignarRolUsuarioDTO) => {
      const response = await api.post(
        `${ENDPOINTS.rolesAdicionales}asignar/`,
        data
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-rol', variables.rol_adicional_id] });
      queryClient.invalidateQueries({ queryKey: ['rol-adicional', variables.rol_adicional_id] });
      toast.success('Rol asignado al usuario correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al asignar rol al usuario';
      toast.error(message);
    },
  });
}

/**
 * Hook para revocar rol adicional de un usuario
 */
export function useRevocarRolUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, rol_adicional_id }: { user_id: number; rol_adicional_id: number }) => {
      const response = await api.post(
        `${ENDPOINTS.rolesAdicionales}revocar/`,
        { user_id, rol_adicional_id }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles-adicionales'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-rol', variables.rol_adicional_id] });
      queryClient.invalidateQueries({ queryKey: ['rol-adicional', variables.rol_adicional_id] });
      toast.success('Rol revocado correctamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Error al revocar rol del usuario';
      toast.error(message);
    },
  });
}

// ==================== PERMISOS EFECTIVOS ====================

/**
 * Hook para obtener permisos efectivos de un usuario
 */
export function usePermisosEfectivos(userId: number | null) {
  return useQuery({
    queryKey: ['permisos-efectivos', userId],
    queryFn: async () => {
      const response = await api.get(
        `/core/users/${userId}/permisos-efectivos/`
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener roles adicionales de un usuario
 */
export function useRolesUsuario(userId: number | null) {
  return useQuery({
    queryKey: ['roles-usuario', userId],
    queryFn: async () => {
      const response = await api.get(
        `/core/users/${userId}/roles-adicionales/`
      );
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ==================== CATÁLOGOS DINÁMICOS ====================

/** Tipo para opciones de select dinámico */
export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Hook para obtener módulos de permisos dinámicamente desde la API
 * Reemplaza MODULO_OPTIONS hardcodeado
 */
export function usePermisoModulos() {
  return useQuery({
    queryKey: ['permiso-modulos'],
    queryFn: async () => {
      const response = await api.get<SelectOption[]>(
        `${ENDPOINTS.permisos}modules/`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - los módulos no cambian frecuentemente
  });
}

/**
 * Hook para obtener acciones de permisos dinámicamente desde la API
 * Reemplaza ACCION_OPTIONS hardcodeado
 */
export function usePermisoAcciones() {
  return useQuery({
    queryKey: ['permiso-acciones'],
    queryFn: async () => {
      const response = await api.get<SelectOption[]>(
        `${ENDPOINTS.permisos}actions/`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - las acciones no cambian frecuentemente
  });
}
