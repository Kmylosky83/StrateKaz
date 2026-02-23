import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — Guard de autenticacion para rutas protegidas.
 *
 * PROBLEMA RESUELTO: En F5 (hard reload), Zustand persist rehidrata de forma
 * asincrona. Antes de que termine, `isAuthenticated` es `false` (estado inicial),
 * lo que causaba un redirect falso a /login.
 *
 * SOLUCION: Verificar tokens JWT directamente en localStorage (sincrono,
 * no depende de Zustand). Si hay tokens pero Zustand aun no rehidrato,
 * mostramos un spinner breve hasta que el estado se sincronice.
 */

/** Check sincrono: hay tokens JWT en localStorage? */
function hasTokensInStorage(): boolean {
  try {
    return !!localStorage.getItem('access_token') && !!localStorage.getItem('refresh_token');
  } catch {
    return false;
  }
}

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const location = useLocation();

  // Tokens en localStorage es la fuente de verdad para "hay sesion activa"
  const tokensExist = hasTokensInStorage();

  // CASO 1: Hay tokens pero Zustand aun no rehidrato (F5 / hard reload)
  // → Mostrar spinner breve. Zustand restaurara isAuthenticated=true en ms.
  if (tokensExist && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // CASO 2: No hay tokens y no esta autenticado → ir a login
  if (!tokensExist && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // CASO 3: Autenticado pero sin tenant (y no es superadmin en admin-global)
  const isAdminGlobalRoute = location.pathname.startsWith('/admin-global');
  if (!currentTenantId && !isSuperadmin && !isAdminGlobalRoute) {
    // Verificar si hay tenant_id en localStorage que Zustand aun no restauro
    const storedTenantId = localStorage.getItem('current_tenant_id');
    if (storedTenantId) {
      // Tokens + tenantId existen, Zustand aun no sincronizo → esperar
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  // CASO 4: Todo OK → renderizar la ruta protegida
  return <Outlet />;
};
