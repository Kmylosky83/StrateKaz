import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Timeout de seguridad para la hidratacion de Zustand persist.
 * Si onFinishHydration no dispara en este tiempo, asumimos que ya paso
 * o que nunca va a pasar, y dejamos que la app continue.
 */
const HYDRATION_TIMEOUT_MS = 1500;

/**
 * Hook que detecta de forma robusta si Zustand persist ya termino de hidratar.
 * Usa 3 mecanismos complementarios:
 *   1. persist.hasHydrated() — check sincrono al inicializar
 *   2. persist.onFinishHydration() — callback oficial de Zustand
 *   3. setTimeout — failsafe si los anteriores fallan
 */
function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    // Check sincrono: si ya hidrató antes de montar el componente
    return useAuthStore.persist?.hasHydrated?.() ?? true;
  });

  useEffect(() => {
    // Si ya está hidratado, no hacer nada
    if (hydrated) return;

    // Listener oficial de Zustand persist
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    // Double-check: puede haber hidratado entre el useState y el useEffect
    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    }

    // Failsafe: si nada funciona, desbloquear después del timeout
    const timer = setTimeout(() => {
      setHydrated(true);
    }, HYDRATION_TIMEOUT_MS);

    return () => {
      unsubscribe?.();
      clearTimeout(timer);
    };
  }, [hydrated]);

  return hydrated;
}

export const ProtectedRoute = () => {
  const hasHydrated = useHasHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const location = useLocation();

  // Esperar a que Zustand termine de rehidratarse desde localStorage.
  // Sin esto, en F5 el estado inicial tiene isAuthenticated=false ANTES de que
  // persist middleware restaure el valor real, causando un redirect falso a /login.
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay tenant seleccionado y no es superadmin navegando a admin-global
  // → redirigir al login para que seleccione tenant
  const isAdminGlobalRoute = location.pathname.startsWith('/admin-global');
  if (!currentTenantId && !isSuperadmin && !isAdminGlobalRoute) {
    return <Navigate to="/login" replace />;
  }

  // NOTA: No bloquear con spinner mientras user se carga (isLoadingUser).
  // DashboardLayout maneja la carga del user via loadUserProfile().
  return <Outlet />;
};
