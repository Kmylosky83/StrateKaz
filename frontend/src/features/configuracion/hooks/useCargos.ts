/**
 * Hooks para gestion de Cargos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    enabled: id !== null,
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
