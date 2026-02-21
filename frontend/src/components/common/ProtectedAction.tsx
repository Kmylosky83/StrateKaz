/**
 * ProtectedAction - Componente para control de acceso en UI
 *
 * Muestra u oculta contenido basado en permisos del usuario.
 * NO reemplaza la verificacion del backend, solo mejora la UX.
 *
 * @example
 * // Por permiso CRUD (nuevo formato)
 * <ProtectedAction permission="gestion_estrategica.politica.create">
 *   <Button>Nueva Política</Button>
 * </ProtectedAction>
 *
 * @example
 * // Por acceso a sección
 * <ProtectedAction sectionId={5}>
 *   <SectionContent />
 * </ProtectedAction>
 *
 * @example
 * // Por cargo(s)
 * <ProtectedAction cargos={[CargoCodes.LIDER_COMERCIAL]}>
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
 * // Combinado (permiso CRUD + sección)
 * <ProtectedAction
 *   sectionId={5}
 *   permission="gestion_estrategica.politica.delete"
 *   fallback={<DisabledButton />}
 * >
 *   <DeleteButton />
 * </ProtectedAction>
 */

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { CargoLevels } from '@/constants/permissions';
import type { CargoCode, CargoLevel, RoleCode } from '@/constants/permissions';

interface ProtectedActionProps {
  /** Contenido a mostrar si tiene acceso */
  children: ReactNode;

  /** Contenido a mostrar si NO tiene acceso (opcional) */
  fallback?: ReactNode;

  /** Permiso CRUD requerido (código: "modulo.recurso.accion") */
  permission?: string;

  /** Permisos CRUD requeridos (OR - cualquiera) */
  permissions?: string[];

  /** ID de sección requerida (de CargoSectionAccess) */
  sectionId?: number;

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
  sectionId,
  cargos,
  minLevel,
  roles,
  superAdminOnly = false,
  invert = false,
}: ProtectedActionProps) {
  const { canAccess, hasPermission, hasSectionAccess, isSuperAdmin } = usePermissions();

  // Super admin tiene acceso total
  if (isSuperAdmin && !invert) {
    return <>{children}</>;
  }

  let hasAccess = true;

  // Verificar acceso a sección si se especifica
  if (sectionId !== undefined) {
    if (!hasSectionAccess(sectionId)) {
      hasAccess = false;
    }
  }

  // Verificar permiso CRUD único si se especifica
  if (hasAccess && permission) {
    hasAccess = hasPermission(permission);
  }

  // Verificar permisos múltiples (OR) si se especifica
  if (hasAccess && permissions && permissions.length > 0) {
    hasAccess = permissions.some((p) => hasPermission(p));
  }

  // Verificar otras condiciones usando canAccess
  if (hasAccess && (cargos || minLevel || roles || superAdminOnly)) {
    hasAccess = canAccess({
      cargos,
      minLevel,
      roles,
      superAdminOnly,
    });
  }

  // Invertir lógica si es necesario
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

// ==================== RBAC Unificado v4.0 - Helpers para Secciones ====================

/**
 * Hook para obtener permisos CRUD de una sección específica
 *
 * @param modulo Código del módulo (ej: 'gestion_estrategica')
 * @param seccion Código de la sección (ej: 'empresa', 'cargos', 'politicas')
 * @returns Objeto con permisos booleanos y códigos de permiso
 *
 * @example
 * const { canView, canCreate, canEdit, canDelete, codes } = useSectionPermissions('gestion_estrategica', 'cargos');
 *
 * // En JSX:
 * {canCreate && <Button>Nuevo</Button>}
 * {canEdit && <Button>Editar</Button>}
 */
export function useSectionPermissions(modulo: string, seccion: string) {
  const { hasPermission, isSuperAdmin } = usePermissions();

  const codes = {
    view: `${modulo}.${seccion}.view`,
    create: `${modulo}.${seccion}.create`,
    edit: `${modulo}.${seccion}.edit`,
    delete: `${modulo}.${seccion}.delete`,
  };

  // SuperAdmin tiene todos los permisos
  if (isSuperAdmin) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      codes,
      isSuperAdmin: true,
    };
  }

  return {
    canView: hasPermission(codes.view),
    canCreate: hasPermission(codes.create),
    canEdit: hasPermission(codes.edit),
    canDelete: hasPermission(codes.delete),
    codes,
    isSuperAdmin: false,
  };
}

/**
 * Componentes de acceso rápido para acciones CRUD
 *
 * @example
 * <CanCreate modulo="gestion_estrategica" seccion="cargos">
 *   <Button>Nuevo Cargo</Button>
 * </CanCreate>
 */
interface CrudActionProps {
  modulo: string;
  seccion: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanView({ modulo, seccion, children, fallback = null }: CrudActionProps) {
  return (
    <ProtectedAction permission={`${modulo}.${seccion}.view`} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

export function CanCreate({ modulo, seccion, children, fallback = null }: CrudActionProps) {
  return (
    <ProtectedAction permission={`${modulo}.${seccion}.create`} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

export function CanEdit({ modulo, seccion, children, fallback = null }: CrudActionProps) {
  return (
    <ProtectedAction permission={`${modulo}.${seccion}.edit`} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

export function CanDelete({ modulo, seccion, children, fallback = null }: CrudActionProps) {
  return (
    <ProtectedAction permission={`${modulo}.${seccion}.delete`} fallback={fallback}>
      {children}
    </ProtectedAction>
  );
}

/**
 * Componente combinado para acciones de edición/eliminación
 */
export function CanEditOrDelete({ modulo, seccion, children, fallback = null }: CrudActionProps) {
  return (
    <ProtectedAction
      permissions={[`${modulo}.${seccion}.edit`, `${modulo}.${seccion}.delete`]}
      fallback={fallback}
    >
      {children}
    </ProtectedAction>
  );
}

export default ProtectedAction;
