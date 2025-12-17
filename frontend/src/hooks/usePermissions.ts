/**
 * usePermissions - Hook para verificar permisos RBAC
 *
 * Este hook proporciona funciones para verificar permisos, roles y cargos
 * del usuario actual sin hardcodear valores en los componentes.
 *
 * @example
 * const { hasPermission, hasCargo, hasRole, canAccess } = usePermissions();
 *
 * // Verificar permiso
 * if (hasPermission(PermissionCodes.RECOLECCIONES.CREATE)) {
 *   // Mostrar boton crear
 * }
 *
 * // Verificar cargo
 * if (hasCargo(CargoCodes.LIDER_COMERCIAL_ECONORTE)) {
 *   // Mostrar seccion especial
 * }
 */

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CargoLevels } from '@/constants/permissions';
import type { CargoCode, CargoLevel, PermissionCode, RoleCode, GroupCode } from '@/constants/permissions';

interface PermissionsContext {
  /** Si el usuario es superadmin */
  isSuperAdmin: boolean;

  /** Codigo del cargo actual */
  cargoCode: string | null;

  /** Nivel del cargo actual (0-3) */
  cargoLevel: number | null;

  /** Verifica si tiene un permiso especifico */
  hasPermission: (permission: PermissionCode) => boolean;

  /** Verifica si tiene al menos uno de los permisos */
  hasAnyPermission: (permissions: PermissionCode[]) => boolean;

  /** Verifica si tiene todos los permisos */
  hasAllPermissions: (permissions: PermissionCode[]) => boolean;

  /** Verifica si tiene un cargo especifico */
  hasCargo: (cargo: CargoCode | CargoCode[]) => boolean;

  /** Verifica si tiene un nivel de cargo minimo */
  hasCargoLevel: (minLevel: CargoLevel) => boolean;

  /** Verifica si tiene un rol especifico (pendiente: requiere API de roles) */
  hasRole: (role: RoleCode) => boolean;

  /** Verifica si pertenece a un grupo (pendiente: requiere API de grupos) */
  isInGroup: (group: GroupCode) => boolean;

  /** Verifica acceso combinado (OR de permisos O cargo O nivel) */
  canAccess: (options: AccessOptions) => boolean;

  /** Helper para mostrar/ocultar elementos UI */
  show: (options: AccessOptions) => boolean;
}

interface AccessOptions {
  /** Permisos requeridos (OR) */
  permissions?: PermissionCode[];
  /** Cargos permitidos (OR) */
  cargos?: CargoCode[];
  /** Nivel minimo de cargo */
  minLevel?: CargoLevel;
  /** Roles permitidos (OR) - pendiente */
  roles?: RoleCode[];
  /** Solo superadmin */
  superAdminOnly?: boolean;
}

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions(): PermissionsContext {
  const user = useAuthStore((state) => state.user);

  const isSuperAdmin = useMemo(() => {
    return user?.is_superuser ?? false;
  }, [user?.is_superuser]);

  const cargoCode = useMemo(() => {
    return user?.cargo_code ?? null;
  }, [user?.cargo_code]);

  const cargoLevel = useMemo(() => {
    return user?.cargo_level ?? null;
  }, [user?.cargo_level]);

  /**
   * Verifica si tiene un permiso especifico
   * NOTA: En esta implementacion inicial, verificamos por cargo.
   * En futuras versiones, esto llamara a una API para verificar permisos reales.
   */
  const hasPermission = useCallback(
    (permission: PermissionCode): boolean => {
      // Superadmin tiene todos los permisos
      if (isSuperAdmin) return true;

      // Si no hay usuario, no tiene permisos
      if (!user) return false;

      // TODO: Implementar verificacion real contra API o cache de permisos
      // Por ahora, verificamos si el usuario tiene un cargo asignado
      // La verificacion real se hace en el backend

      // Placeholder: asumimos que si tiene cargo, tiene permisos basicos de lectura
      // Esta logica se reemplazara cuando el backend devuelva los permisos del usuario
      return user.cargo !== null;
    },
    [isSuperAdmin, user]
  );

  const hasAnyPermission = useCallback(
    (permissions: PermissionCode[]): boolean => {
      if (isSuperAdmin) return true;
      return permissions.some((p) => hasPermission(p));
    },
    [isSuperAdmin, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: PermissionCode[]): boolean => {
      if (isSuperAdmin) return true;
      return permissions.every((p) => hasPermission(p));
    },
    [isSuperAdmin, hasPermission]
  );

  const hasCargo = useCallback(
    (cargo: CargoCode | CargoCode[]): boolean => {
      if (isSuperAdmin) return true;
      if (!cargoCode) return false;

      const cargos = Array.isArray(cargo) ? cargo : [cargo];
      return cargos.includes(cargoCode as CargoCode);
    },
    [isSuperAdmin, cargoCode]
  );

  const hasCargoLevel = useCallback(
    (minLevel: CargoLevel): boolean => {
      if (isSuperAdmin) return true;
      if (cargoLevel === null) return false;

      return cargoLevel >= minLevel;
    },
    [isSuperAdmin, cargoLevel]
  );

  const hasRole = useCallback(
    (_role: RoleCode): boolean => {
      if (isSuperAdmin) return true;

      // TODO: Implementar cuando el backend devuelva roles del usuario
      // Por ahora, retornamos false ya que no tenemos info de roles
      return false;
    },
    [isSuperAdmin]
  );

  const isInGroup = useCallback(
    (_group: GroupCode): boolean => {
      if (isSuperAdmin) return true;

      // TODO: Implementar cuando el backend devuelva grupos del usuario
      return false;
    },
    [isSuperAdmin]
  );

  const canAccess = useCallback(
    (options: AccessOptions): boolean => {
      // Solo superadmin
      if (options.superAdminOnly) {
        return isSuperAdmin;
      }

      // Superadmin puede acceder a todo
      if (isSuperAdmin) return true;

      // Si no hay usuario, no tiene acceso
      if (!user) return false;

      // Verificar nivel minimo de cargo
      if (options.minLevel !== undefined) {
        if (hasCargoLevel(options.minLevel)) return true;
      }

      // Verificar cargos (OR)
      if (options.cargos && options.cargos.length > 0) {
        if (hasCargo(options.cargos)) return true;
      }

      // Verificar permisos (OR)
      if (options.permissions && options.permissions.length > 0) {
        if (hasAnyPermission(options.permissions)) return true;
      }

      // Verificar roles (OR)
      if (options.roles && options.roles.length > 0) {
        if (options.roles.some((r) => hasRole(r))) return true;
      }

      // Si no se especifica ninguna condicion, no tiene acceso
      return false;
    },
    [isSuperAdmin, user, hasCargoLevel, hasCargo, hasAnyPermission, hasRole]
  );

  // Alias de canAccess para semantica mas clara en UI
  const show = canAccess;

  return {
    isSuperAdmin,
    cargoCode,
    cargoLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasCargo,
    hasCargoLevel,
    hasRole,
    isInGroup,
    canAccess,
    show,
  };
}

// ==================== HELPERS ADICIONALES ====================

/**
 * Hook simplificado para verificar si es superadmin
 */
export function useIsSuperAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.is_superuser ?? false;
}

/**
 * Hook para obtener el cargo actual
 */
export function useCurrentCargo() {
  const user = useAuthStore((state) => state.user);
  return {
    code: user?.cargo_code ?? null,
    level: user?.cargo_level ?? null,
    cargo: user?.cargo ?? null,
  };
}

/**
 * Hook para verificar nivel de coordinacion o superior
 */
export function useIsCoordinationOrAbove(): boolean {
  const user = useAuthStore((state) => state.user);
  if (user?.is_superuser) return true;
  return (user?.cargo_level ?? -1) >= CargoLevels.COORDINACION;
}

/**
 * Hook para verificar nivel de direccion
 */
export function useIsDirection(): boolean {
  const user = useAuthStore((state) => state.user);
  if (user?.is_superuser) return true;
  return (user?.cargo_level ?? -1) >= CargoLevels.DIRECCION;
}

export default usePermissions;
