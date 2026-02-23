import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const user = useAuthStore((state) => state.user);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);
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

  // Durante rehidratación (F5): el user no se persiste, esperar a que se cargue
  // Esto previene redirect falso mientras loadUserProfile() está en progreso
  if (currentTenantId && !user && isLoadingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
};
