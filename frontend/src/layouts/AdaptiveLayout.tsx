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
 * REDIRECT PORTAL: Se usa PortalRedirect (navigate imperativo + spinner)
 * en vez de <Navigate> que renderiza null y causa flash negro en dark mode.
 *
 * SEGURIDAD: Los usuarios portal-only son redirigidos forzosamente
 * a su portal correspondiente si intentan acceder a cualquier otra ruta.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser } from '@/utils/portalUtils';
import { DashboardLayout } from './DashboardLayout';

const MAX_PROFILE_RETRIES = 5;
const ABSOLUTE_TIMEOUT_MS = 15_000; // 15s máximo de espera antes de mostrar error

/** Delay progresivo entre reintentos (ms): 0, 2s, 4s, 8s, 16s */
function getRetryDelay(attempt: number): number {
  if (attempt <= 1) return 0; // Primer intento: inmediato
  return Math.min(2000 * Math.pow(2, attempt - 2), 16_000);
}

export const AdaptiveLayout = () => {
  const retryCount = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timedOut, setTimedOut] = useState(false);

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

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Timeout absoluto: si después de 15s no hay user, mostrar error
  useEffect(() => {
    if (user) {
      setTimedOut(false);
      return;
    }
    if (!currentTenantId) return;
    const timer = setTimeout(() => setTimedOut(true), ABSOLUTE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [currentTenantId, user]);

  // Retry con backoff progresivo
  const scheduleRetry = useCallback(() => {
    const attempt = retryCount.current + 1;
    const delay = getRetryDelay(attempt);

    retryCount.current = attempt;

    if (delay === 0) {
      loadUserProfile();
    } else {
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        loadUserProfile();
      }, delay);
    }
  }, [loadUserProfile]);

  // Cargar perfil del User cuando hay tenant pero no user
  // (Cubre: F5, navegación directa, primer acceso post-login)
  // Limita reintentos con backoff progresivo para evitar logouts prematuros
  useEffect(() => {
    if (currentTenantId && !user && !isLoadingUser) {
      // No re-disparar si hay un timer pendiente
      if (retryTimerRef.current) return;

      if (retryCount.current < MAX_PROFILE_RETRIES) {
        scheduleRetry();
      } else {
        // Reintentos agotados: la sesión no puede recuperarse → forzar logout
        console.error(
          `AdaptiveLayout: profile load failed after ${MAX_PROFILE_RETRIES} attempts. Forcing logout.`
        );
        forceLogout();
      }
    }
  }, [currentTenantId, user, isLoadingUser, scheduleRetry, forceLogout]);

  // Mientras se carga el perfil, mostrar spinner o error
  if (isLoadingUser || (currentTenantId && !user)) {
    if (timedOut) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            No se pudo cargar tu sesión. Tu sesión puede haber expirado.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setTimedOut(false);
                retryCount.current = 0;
                loadUserProfile();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              onClick={() => forceLogout()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Determinar si es portal-only
  const portalOnly = isPortalOnlyUser(user);

  if (portalOnly) {
    // Portales proveedor/cliente desactivados hasta L50/L53.
    // Portal-only users se redirigen a /mi-portal que muestra vista informativa.
    // TODO: Reactivar cuando supply_chain (L50) y sales_crm (L53) se liberen:
    //   const onPortalRoute =
    //     location.pathname.startsWith('/proveedor-portal') ||
    //     location.pathname.startsWith('/cliente-portal');
    //   if (onPortalRoute) return <PortalLayout />;
    //   const targetRoute = isClientePortalUser(user) ? '/cliente-portal' : '/proveedor-portal';
    //   return <PortalRedirect to={targetRoute} />;

    // Mientras tanto: DashboardLayout con acceso a /mi-portal
    return <DashboardLayout />;
  }

  // Usuario normal (empleado interno o profesional colocado) → DashboardLayout
  return <DashboardLayout />;
};
