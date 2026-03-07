/**
 * AdaptiveLayout — Selector inteligente de layout según tipo de usuario
 *
 * Determina si el usuario autenticado es "portal-only" y renderiza
 * el layout apropiado:
 *
 * - Portal proveedor → PortalLayout + redirect a /proveedor-portal
 * - Portal cliente → PortalLayout + redirect a /cliente-portal
 * - Todos los demás → DashboardLayout (sidebar + módulos + header completo)
 *
 * También se encarga de cargar el perfil del User (core.User) cuando hay
 * tenant seleccionado pero el perfil aún no se ha cargado (ej: F5 refresh).
 *
 * SEGURIDAD: Los usuarios portal-only son redirigidos forzosamente a
 * su portal correspondiente si intentan acceder a cualquier otra ruta.
 */
import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser, isClientePortalUser } from '@/utils/portalUtils';
import { DashboardLayout } from './DashboardLayout';
import { PortalLayout } from './PortalLayout';

const MAX_PROFILE_RETRIES = 3;

export const AdaptiveLayout = () => {
  const location = useLocation();
  const retryCount = useRef(0);

  // Auth state
  const currentTenantId = useAuthStore((s) => s.currentTenantId);
  const user = useAuthStore((s) => s.user);
  const isLoadingUser = useAuthStore((s) => s.isLoadingUser);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);
  const forceLogout = useAuthStore((s) => s.forceLogout);

  // Reset retry counter when user is loaded successfully
  useEffect(() => {
    if (user) {
      retryCount.current = 0;
    }
  }, [user]);

  // Cargar perfil del User cuando hay tenant pero no user
  // (Cubre: F5, navegación directa, primer acceso post-login)
  // Limita reintentos para evitar loop infinito si el endpoint falla
  useEffect(() => {
    if (currentTenantId && !user && !isLoadingUser) {
      if (retryCount.current < MAX_PROFILE_RETRIES) {
        retryCount.current += 1;
        loadUserProfile();
      } else {
        // Reintentos agotados: la sesión no puede recuperarse → forzar logout
        console.error(
          `AdaptiveLayout: profile load failed after ${MAX_PROFILE_RETRIES} attempts. Forcing logout.`
        );
        forceLogout();
      }
    }
  }, [currentTenantId, user, isLoadingUser, loadUserProfile, forceLogout]);

  // Mientras se carga el perfil, mostrar spinner
  if (isLoadingUser || (currentTenantId && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Determinar si es portal-only
  const portalOnly = isPortalOnlyUser(user);

  if (portalOnly) {
    // Cliente portal → /cliente-portal
    if (isClientePortalUser(user)) {
      if (location.pathname !== '/cliente-portal') {
        return <Navigate to="/cliente-portal" replace />;
      }
      return <PortalLayout />;
    }

    // Proveedor portal → /proveedor-portal
    if (location.pathname !== '/proveedor-portal') {
      return <Navigate to="/proveedor-portal" replace />;
    }
    return <PortalLayout />;
  }

  // Usuario normal (empleado interno o profesional colocado) → DashboardLayout
  return <DashboardLayout />;
};
