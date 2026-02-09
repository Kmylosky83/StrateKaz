/**
 * usePermissions - Hook para verificar permisos RBAC
 *
 * RBAC Unificado v4.0:
 * Los permisos se generan desde CargoSectionAccess, donde cada sección tiene
 * acciones CRUD (can_view, can_create, can_edit, can_delete) configurables.
 *
 * Formato de códigos de permiso: "modulo.seccion.accion"
 * - modulo: código del módulo en lowercase (ej: gestion_estrategica)
 * - seccion: código de la sección en lowercase (ej: empresa, politicas)
 * - accion: view, create, edit, delete
 *
 * @example
 * const { hasPermission, canDo, hasCargo, canAccess } = usePermissions();
 *
 * // Verificar permiso CRUD directo
 * if (hasPermission('gestion_estrategica.empresa.edit')) {
 *   // Mostrar boton editar
 * }
 *
 * // Usar helper canDo
 * if (canDo('gestion_estrategica', 'politicas', 'create')) {
 *   // Mostrar boton crear política
 * }
 *
 * // Verificar cargo
 * if (hasCargo(CargoCodes.GERENTE_OPERACIONES)) {
 *   // Mostrar seccion especial
 * }
 */

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CargoLevels } from '@/constants/permissions';
import type { CargoCode, CargoLevel, RoleCode, GroupCode } from '@/constants/permissions';

interface PermissionsContext {
  /** Si el usuario es superadmin */
  isSuperAdmin: boolean;

  /** Codigo del cargo actual */
  cargoCode: string | null;

  /** Nivel del cargo actual (0-3) */
  cargoLevel: number | null;

  /** IDs de secciones autorizadas (del cargo del usuario) */
  sectionIds: number[] | null;

  /** Códigos de permisos CRUD autorizados */
  permissionCodes: string[] | null;

  /** Verifica si tiene acceso a una sección específica por ID */
  hasSectionAccess: (sectionId: number) => boolean;

  /** Verifica si tiene un permiso CRUD específico (ej: "gestion_estrategica.politica.create") */
  hasPermission: (permissionCode: string) => boolean;

  /** Verifica permiso CRUD por módulo/sección/acción (RBAC Unificado v4.0) */
  canDo: (modulo: string, seccion: string, accion: 'view' | 'create' | 'edit' | 'delete') => boolean;

  /** Verifica si tiene al menos uno de los permisos */
  hasAnyPermission: (permissions: string[]) => boolean;

  /** Verifica si tiene todos los permisos */
  hasAllPermissions: (permissions: string[]) => boolean;

  /** Verifica si tiene un cargo especifico */
  hasCargo: (cargo: CargoCode | CargoCode[]) => boolean;

  /** Verifica si tiene un nivel de cargo minimo */
  hasCargoLevel: (minLevel: CargoLevel) => boolean;

  /** Verifica si tiene un rol especifico (pendiente: requiere API de roles) */
  hasRole: (role: RoleCode) => boolean;

  /** Verifica si pertenece a un grupo (pendiente: requiere API de grupos) */
  isInGroup: (group: GroupCode) => boolean;

  /** Verifica acceso combinado (OR de permisos O cargo O nivel O sección) */
  canAccess: (options: AccessOptions) => boolean;

  /** Helper para mostrar/ocultar elementos UI */
  show: (options: AccessOptions) => boolean;
}

interface AccessOptions {
  /** Permisos CRUD requeridos (OR) - códigos como "modulo.recurso.accion" */
  permissions?: string[];
  /** ID de sección requerida */
  sectionId?: number;
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
  const isSuperadminGlobal = useAuthStore((state) => state.isSuperadmin);

  // Superadmin si: TenantUser.is_superadmin (global) O User.is_superuser (dentro del tenant)
  const isSuperAdmin = useMemo(() => {
    return isSuperadminGlobal || (user?.is_superuser ?? false);
  }, [isSuperadminGlobal, user?.is_superuser]);

  const cargoCode = useMemo(() => {
    return user?.cargo_code ?? null;
  }, [user?.cargo_code]);

  const cargoLevel = useMemo(() => {
    return user?.cargo_level ?? null;
  }, [user?.cargo_level]);

  // IDs de secciones autorizadas (del backend)
  const sectionIds = useMemo(() => {
    return user?.section_ids ?? null;
  }, [user?.section_ids]);

  // Códigos de permisos CRUD autorizados (del backend)
  const permissionCodes = useMemo(() => {
    return user?.permission_codes ?? null;
  }, [user?.permission_codes]);

  /**
   * Verifica si tiene acceso a una sección específica por ID
   */
  const hasSectionAccess = useCallback(
    (sectionId: number): boolean => {
      // Superadmin tiene acceso a todas las secciones
      if (isSuperAdmin) return true;

      // Si no hay usuario, no tiene acceso
      if (!user) return false;

      // Si section_ids es null (superuser), tiene acceso total
      if (sectionIds === null) return true;

      // Verificar si el ID está en la lista de secciones autorizadas
      return sectionIds.includes(sectionId);
    },
    [isSuperAdmin, user, sectionIds]
  );

  /**
   * Verifica si tiene un permiso CRUD específico
   * @param permissionCode Código del permiso (ej: "gestion_estrategica.politica.create")
   */
  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      // Superadmin tiene todos los permisos
      if (isSuperAdmin) return true;

      // Si no hay usuario, no tiene permisos
      if (!user) return false;

      // Si permission_codes es null, no tiene permisos
      if (!permissionCodes) return false;

      // Si tiene '*', tiene todos los permisos (superuser)
      if (permissionCodes.includes('*')) return true;

      // Verificar si el código está en la lista de permisos autorizados
      return permissionCodes.includes(permissionCode);
    },
    [isSuperAdmin, user, permissionCodes]
  );

  /**
   * Verifica permiso CRUD por módulo/sección/acción
   * RBAC Unificado v4.0: Acciones son view, create, edit, delete
   * @param modulo Código del módulo (ej: "gestion_estrategica")
   * @param seccion Código de la sección (ej: "empresa", "politicas")
   * @param accion Acción CRUD (view, create, edit, delete)
   */
  const canDo = useCallback(
    (modulo: string, seccion: string, accion: 'view' | 'create' | 'edit' | 'delete' | string): boolean => {
      const code = `${modulo}.${seccion}.${accion}`;
      return hasPermission(code);
    },
    [hasPermission]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (isSuperAdmin) return true;
      return permissions.some((p) => hasPermission(p));
    },
    [isSuperAdmin, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
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

      // Verificar acceso a sección específica
      if (options.sectionId !== undefined) {
        if (!hasSectionAccess(options.sectionId)) return false;
      }

      // Verificar nivel minimo de cargo
      if (options.minLevel !== undefined) {
        if (hasCargoLevel(options.minLevel)) return true;
      }

      // Verificar cargos (OR)
      if (options.cargos && options.cargos.length > 0) {
        if (hasCargo(options.cargos)) return true;
      }

      // Verificar permisos CRUD (OR)
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
    [isSuperAdmin, user, hasSectionAccess, hasCargoLevel, hasCargo, hasAnyPermission, hasRole]
  );

  // Alias de canAccess para semantica mas clara en UI
  const show = canAccess;

  return {
    isSuperAdmin,
    cargoCode,
    cargoLevel,
    sectionIds,
    permissionCodes,
    hasSectionAccess,
    hasPermission,
    canDo,
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
 * Considera tanto TenantUser.is_superadmin (global) como User.is_superuser (local)
 */
export function useIsSuperAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  const isSuperadminGlobal = useAuthStore((state) => state.isSuperadmin);
  return isSuperadminGlobal || (user?.is_superuser ?? false);
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
