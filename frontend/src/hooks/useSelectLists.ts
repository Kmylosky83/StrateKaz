/**
 * Hooks compartidos para Select Lists — Dropdowns entre módulos
 *
 * Reemplazan imports cruzados entre features de Capa 2.
 * Backend: GET /api/core/select-lists/{entidad}/
 *
 * Uso:
 *   import { useSelectAreas, useSelectCargos } from '@/hooks/useSelectLists';
 *   const { data: areas, isLoading } = useSelectAreas();
 */
import { useQuery } from '@tanstack/react-query';
import { selectListsAPI, type SelectListItem } from '@/api/select-lists.api';

// ============================================================================
// Query Keys — Centralizadas para invalidación consistente
// ============================================================================
export const selectListKeys = {
  all: ['select-lists'] as const,
  areas: () => [...selectListKeys.all, 'areas'] as const,
  cargos: () => [...selectListKeys.all, 'cargos'] as const,
  colaboradores: () => [...selectListKeys.all, 'colaboradores'] as const,
  users: () => [...selectListKeys.all, 'users'] as const,
  proveedores: () => [...selectListKeys.all, 'proveedores'] as const,
  clientes: () => [...selectListKeys.all, 'clientes'] as const,
  roles: () => [...selectListKeys.all, 'roles'] as const,
  departamentos: () => [...selectListKeys.all, 'departamentos'] as const,
  ciudades: (departamentoId?: number) =>
    [...selectListKeys.all, 'ciudades', departamentoId] as const,
  tiposDocumento: () => [...selectListKeys.all, 'tipos-documento'] as const,
  tiposMateriaPrima: () => [...selectListKeys.all, 'tipos-materia-prima'] as const,
};

// ============================================================================
// Hooks — Cada uno retorna { data: SelectListItem[], isLoading, error }
// ============================================================================

/** Áreas activas de la organización */
export const useSelectAreas = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.areas(),
    queryFn: selectListsAPI.getAreas,
    staleTime: 1000 * 60 * 5, // 5 min
    enabled,
  });
};

/** Cargos (sin system cargos) */
export const useSelectCargos = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.cargos(),
    queryFn: selectListsAPI.getCargos,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Colaboradores activos */
export const useSelectColaboradores = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.colaboradores(),
    queryFn: selectListsAPI.getColaboradores,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Usuarios activos (sin superusers) */
export const useSelectUsers = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.users(),
    queryFn: selectListsAPI.getUsers,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Proveedores activos */
export const useSelectProveedores = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.proveedores(),
    queryFn: selectListsAPI.getProveedores,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Clientes activos */
export const useSelectClientes = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.clientes(),
    queryFn: selectListsAPI.getClientes,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Roles del sistema */
export const useSelectRoles = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.roles(),
    queryFn: selectListsAPI.getRoles,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

/** Departamentos de Colombia */
export const useSelectDepartamentos = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.departamentos(),
    queryFn: selectListsAPI.getDepartamentos,
    staleTime: 1000 * 60 * 10, // 10 min (datos estáticos)
    enabled,
  });
};

/** Ciudades de Colombia (filtrar por departamento_id opcional) */
export const useSelectCiudades = (departamentoId?: number, enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.ciudades(departamentoId),
    queryFn: () => selectListsAPI.getCiudades(departamentoId),
    staleTime: 1000 * 60 * 10,
    enabled,
  });
};

/** Tipos de documento de identidad */
export const useSelectTiposDocumento = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.tiposDocumento(),
    queryFn: selectListsAPI.getTiposDocumento,
    staleTime: 1000 * 60 * 10,
    enabled,
  });
};

/** Tipos de materia prima (para pruebas de acidez, recepción) */
export const useSelectTiposMateriaPrima = (enabled = true) => {
  return useQuery<SelectListItem[]>({
    queryKey: selectListKeys.tiposMateriaPrima(),
    queryFn: selectListsAPI.getTiposMateriaPrima,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};
