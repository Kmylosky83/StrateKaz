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
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser, isClientePortalUser } from '@/utils/portalUtils';
import { DashboardLayout } from './DashboardLayout';
import { PortalLayout } from './PortalLayout';

const MAX_PROFILE_RETRIES = 5;

/** Delay progresivo entre reintentos (ms): 0, 2s, 4s, 8s, 16s */
function getRetryDelay(attempt: number): number {
  if (attempt <= 1) return 0; // Primer intento: inmediato
  return Math.min(2000 * Math.pow(2, attempt - 2), 16_000);
}

/**
 * PortalRedirect — Navega imperativamente mostrando un spinner.
 *
 * A diferencia de <Navigate> (que renderiza null → flash negro),
 * este componente muestra un spinner visible mientras la navegación
 * se completa. Funciona tanto para impersonación como para reload.
 */
const PortalRedirect = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
};

export const AdaptiveLayout = () => {
  const location = useLocation();
  const retryCount = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // ¿Está en una ruta de portal?
    const onPortalRoute =
      location.pathname.startsWith('/proveedor-portal') ||
      location.pathname.startsWith('/cliente-portal');

    // Si ya está en ruta de portal → renderizar PortalLayout directamente
    if (onPortalRoute) {
      return <PortalLayout />;
    }

    // No está en ruta portal → redirigir con spinner visible
    // Usa PortalRedirect (navigate imperativo) en vez de <Navigate> (renderiza null → flash negro)
    // Funciona tanto para: impersonación desde modal, reload con estado persistido, y portal real
    const targetRoute = isClientePortalUser(user) ? '/cliente-portal' : '/proveedor-portal';
    return <PortalRedirect to={targetRoute} />;
  }

  // Usuario normal (empleado interno o profesional colocado) → DashboardLayout
  return <DashboardLayout />;
};
