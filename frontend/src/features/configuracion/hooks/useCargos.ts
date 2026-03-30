/**
 * Hooks para gestion de Cargos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { rbacAPI } from '../api/rbac.api';
import type { CargoFilters, CreateCargoDTO, UpdateCargoDTO } from '../types/rbac.types';

/**
 * Hook para obtener lista de cargos
 */
export function useCargos(filters?: CargoFilters) {
  return useQuery({
    queryKey: ['cargos-rbac', filters],
    queryFn: () => rbacAPI.getCargos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un cargo especifico
 */
export function useCargo(id: number | null) {
  return useQuery({
    queryKey: ['cargo-rbac', id],
    queryFn: () => rbacAPI.getCargo(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear un cargo
 */
export function useCreateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCargoDTO) => rbacAPI.createCargo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

/**
 * Hook para actualizar un cargo
 */
export function useUpdateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCargoDTO }) =>
      rbacAPI.updateCargo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

/**
 * Hook para eliminar un cargo
 */
export function useDeleteCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rbacAPI.deleteCargo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['rbac-stats'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

/**
 * Hook para asignar permisos a cargo
 */
export function useAssignPermissionsToCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      permission_ids,
      replace = false,
    }: {
      id: number;
      permission_ids: number[];
      replace?: boolean;
    }) => rbacAPI.assignPermissionsToCargo(id, permission_ids, replace),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.id] });
    },
  });
}

/**
 * Hook para asignar roles por defecto a cargo
 */
export function useAssignRolesToCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      role_ids,
      replace = false,
    }: {
      id: number;
      role_ids: number[];
      replace?: boolean;
    }) => rbacAPI.assignRolesToCargo(id, role_ids, replace),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.id] });
    },
  });
}

/**
 * Hook para reordenar cargos
 */
export function useReorderCargos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { id: number; orden: number }[]) => rbacAPI.reorderCargos(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
    },
  });
}

/**
 * Hook para activar/desactivar un cargo
 */
export function useToggleCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive?: boolean }) =>
      rbacAPI.toggleCargo(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['select-lists'] });
    },
  });
}

/**
 * Hook para obtener niveles de cargo
 */
export function useCargoLevels() {
  return useQuery({
    queryKey: ['cargo-levels'],
    queryFn: () => rbacAPI.getCargoLevels(),
    staleTime: Infinity, // No cambian
  });
}

/**
 * Hook para obtener areas de cargo
 */
export function useCargoAreas() {
  return useQuery({
    queryKey: ['cargo-areas'],
    queryFn: () => rbacAPI.getCargoAreas(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

/**
 * Hook para obtener todos los choices de cargo (niveles, educacion, experiencia, areas)
 */
export function useCargoChoices() {
  return useQuery({
    queryKey: ['cargo-choices'],
    queryFn: () => rbacAPI.getCargoChoices(),
    staleTime: Infinity, // No cambian frecuentemente
  });
}

// ============================================================================
// PERMISOS DE CARGO (para TabPermisosAcciones)
// ============================================================================

/**
 * Hook para obtener permisos agrupados por módulo
 */
export function usePermisosAgrupados() {
  return useQuery({
    queryKey: ['permisos-agrupados'],
    queryFn: () => rbacAPI.getPermissionsGrouped(),
    staleTime: 10 * 60 * 1000, // 10 minutos (permisos no cambian frecuentemente)
  });
}

/**
 * Hook para obtener permisos de un cargo específico
 */
export function useCargoPermisos(cargoId: number | null) {
  return useQuery({
    queryKey: ['cargo-permisos', cargoId],
    queryFn: async () => {
      const cargo = await rbacAPI.getCargo(cargoId!);
      // El backend devuelve 'permisos', normalizamos a 'permissions'
      return {
        ...cargo,
        permissions: cargo.permisos || [],
        permissions_count: cargo.permisos?.length || cargo.permissions_count || 0,
      };
    },
    enabled: cargoId !== null,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para asignar permisos a un cargo (usado por TabPermisosAcciones)
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
      return rbacAPI.assignPermissionsToCargo(cargoId, permissionIds, true);
    },
    onSuccess: (_, variables) => {
      // Invalidar y refetch inmediato de todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.cargoId] });
      queryClient.invalidateQueries({ queryKey: ['cargo-permisos', variables.cargoId] });
      // También invalidar el sidebar y tree para que se actualice la navegación
      queryClient.invalidateQueries({ queryKey: ['modules', 'sidebar'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'tree'] });
    },
  });
}

// ============================================================================
// ACCESO A SECCIONES (para TabAccesoSecciones)
// Sistema RBAC Unificado v4.0 - acciones integradas en acceso a secciones
// ============================================================================

/** Tipo para acceso a sección con acciones CRUD */
export interface SectionAccessData {
  section_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  custom_actions?: Record<string, boolean>;
}

/** Respuesta del endpoint de accesos */
interface CargoSectionAccessResponse {
  cargo_id: number;
  cargo_name: string;
  accesses: Array<{
    section_id: number;
    section_code: string;
    section_name: string;
    module_code: string;
    module_name: string;
    tab_code: string;
    tab_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    custom_actions?: Record<string, boolean>;
    supported_actions: string[];
  }>;
  total_sections: number;
}

/**
 * Hook para obtener accesos a secciones de un cargo (con acciones CRUD)
 */
export function useCargoSectionAccess(cargoId: number | null) {
  return useQuery<CargoSectionAccessResponse>({
    queryKey: ['cargo-section-access', cargoId],
    queryFn: () => rbacAPI.getCargoSectionAccess(cargoId!),
    enabled: !!cargoId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para guardar accesos a secciones de un cargo (con acciones CRUD)
 * Sistema RBAC Unificado v4.0
 */
export function useSaveCargoSectionAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cargoId,
      accesses,
      sectionIds,
    }: {
      cargoId: number;
      accesses?: SectionAccessData[];
      sectionIds?: number[];
    }) => {
      // Usar nuevo formato con acciones si está disponible
      if (accesses) {
        return rbacAPI.assignCargoSectionAccessWithActions(cargoId, accesses, true);
      }
      // Fallback al formato legacy (solo IDs)
      return rbacAPI.assignCargoSectionAccess(cargoId, sectionIds || [], true);
    },
    onSuccess: (_, variables) => {
      // Invalidar y refetch inmediato de todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.cargoId] });
      queryClient.invalidateQueries({ queryKey: ['cargo-section-access', variables.cargoId] });
      // Invalidar sidebar y tree para actualización inmediata de navegación
      queryClient.invalidateQueries({ queryKey: ['modules', 'sidebar'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'tree'] });

      // Si el cargo modificado es el del usuario logueado, refrescar su perfil
      // para que permission_codes y section_ids se actualicen
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser?.cargo?.id === variables.cargoId) {
        useAuthStore.getState().refreshUserProfile();
      }
    },
  });
}
