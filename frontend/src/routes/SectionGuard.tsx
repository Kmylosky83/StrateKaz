/**
 * SectionGuard - Proteccion de rutas por permisos RBAC
 *
 * Valida que el usuario tenga acceso al modulo/seccion segun su cargo.
 * Complementa ModuleGuard (que solo verifica is_enabled del modulo).
 *
 * Usa canDo() de usePermissions que verifica permission_codes del formato
 * "modulo.seccion.accion" (ej: "gestion_estrategica.planeacion.view").
 *
 * - Superadmins: bypass automatico (via usePermissions)
 * - Mientras carga el perfil: muestra loader
 * - Sin acceso: muestra pagina "Sin Acceso"
 */
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { PageLoader } from '@/components/common/PageLoader';
import { Lock } from 'lucide-react';

interface SectionGuardProps {
  /** Requiere ser superadmin (ignora moduleCode/sectionCode) */
  requireSuperadmin?: boolean;
  /** Codigo del modulo para verificar acceso RBAC (ej: 'gestion_estrategica') */
  moduleCode?: string;
  /** Codigo de la seccion dentro del modulo (ej: 'planeacion') */
  sectionCode?: string;
  children: React.ReactNode;
}

export const SectionGuard = ({
  requireSuperadmin,
  moduleCode,
  sectionCode,
  children,
}: SectionGuardProps) => {
  const user = useAuthStore((state) => state.user);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const { canDo, isSuperAdmin } = usePermissions();

  // Mientras carga el perfil del usuario, mostrar loader
  if (isLoadingUser || (!user && !isSuperadmin)) {
    return <PageLoader />;
  }

  // Guard de superadmin
  if (requireSuperadmin) {
    if (!isSuperAdmin) {
      return <AccessDeniedPage />;
    }
    return <>{children}</>;
  }

  // Guard RBAC por modulo/seccion: verificar que el usuario puede "view" la seccion
  if (moduleCode && sectionCode) {
    if (!canDo(moduleCode, sectionCode, 'view')) {
      return <AccessDeniedPage />;
    }
  }

  return <>{children}</>;
};

const AccessDeniedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
      <Lock className="w-8 h-8 text-red-400 dark:text-red-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sin acceso</h2>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
      No tienes permisos para acceder a esta sección. Contacta al administrador si necesitas acceso.
    </p>
    <a
      href="/dashboard"
      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      Volver al Dashboard
    </a>
  </div>
);
