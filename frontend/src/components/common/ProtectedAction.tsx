/**
 * ProtectedAction - Componente para control de acceso en UI
 *
 * Muestra u oculta contenido basado en permisos del usuario.
 * NO reemplaza la verificacion del backend, solo mejora la UX.
 *
 * @example
 * // Por permiso
 * <ProtectedAction permission={PermissionCodes.RECOLECCIONES.CREATE}>
 *   <Button>Crear Recoleccion</Button>
 * </ProtectedAction>
 *
 * @example
 * // Por cargo(s)
 * <ProtectedAction cargos={[CargoCodes.LIDER_COMERCIAL_ECONORTE]}>
 *   <AdminPanel />
 * </ProtectedAction>
 *
 * @example
 * // Por nivel minimo
 * <ProtectedAction minLevel={CargoLevels.COORDINACION}>
 *   <ManagementDashboard />
 * </ProtectedAction>
 *
 * @example
 * // Combinado (OR)
 * <ProtectedAction
 *   permissions={[PermissionCodes.RECOLECCIONES.APPROVE]}
 *   cargos={[CargoCodes.GERENTE_GENERAL]}
 *   fallback={<DisabledButton />}
 * >
 *   <ApproveButton />
 * </ProtectedAction>
 */

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { CargoCode, CargoLevel, PermissionCode, RoleCode } from '@/constants/permissions';

interface ProtectedActionProps {
  /** Contenido a mostrar si tiene acceso */
  children: ReactNode;

  /** Contenido a mostrar si NO tiene acceso (opcional) */
  fallback?: ReactNode;

  /** Permiso unico requerido */
  permission?: PermissionCode;

  /** Permisos requeridos (OR - cualquiera) */
  permissions?: PermissionCode[];

  /** Cargo(s) permitido(s) */
  cargos?: CargoCode[];

  /** Nivel minimo de cargo */
  minLevel?: CargoLevel;

  /** Roles permitidos (OR) */
  roles?: RoleCode[];

  /** Solo visible para superadmin */
  superAdminOnly?: boolean;

  /** Invierte la logica (oculta si tiene acceso) */
  invert?: boolean;
}

export function ProtectedAction({
  children,
  fallback = null,
  permission,
  permissions,
  cargos,
  minLevel,
  roles,
  superAdminOnly = false,
  invert = false,
}: ProtectedActionProps) {
  const { canAccess, hasPermission } = usePermissions();

  // Si hay permiso unico, verificar directamente
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else {
    // Usar canAccess para logica combinada
    hasAccess = canAccess({
      permissions,
      cargos,
      minLevel,
      roles,
      superAdminOnly,
    });
  }

  // Invertir logica si es necesario
  if (invert) {
    hasAccess = !hasAccess;
  }

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * Componente para mostrar contenido solo a superadmin
 */
export function SuperAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ProtectedAction superAdminOnly fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

/**
 * Componente para mostrar contenido a nivel coordinacion+
 */
export function CoordinationOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { CargoLevels } = require('@/constants/permissions');
  return (
    <ProtectedAction minLevel={CargoLevels.COORDINACION} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

/**
 * Componente para mostrar contenido a nivel direccion
 */
export function DirectionOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { CargoLevels } = require('@/constants/permissions');
  return (
    <ProtectedAction minLevel={CargoLevels.DIRECCION} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

/**
 * HOC para proteger componentes completos
 *
 * @example
 * const ProtectedAdminPanel = withProtection(AdminPanel, {
 *   minLevel: CargoLevels.COORDINACION,
 *   fallback: <AccessDenied />,
 * });
 */
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedActionProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedAction {...options}>
        <Component {...props} />
      </ProtectedAction>
    );
  };
}

export default ProtectedAction;
