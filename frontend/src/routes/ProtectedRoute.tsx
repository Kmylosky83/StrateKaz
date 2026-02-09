import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentTenantId = useAuthStore((state) => state.currentTenantId);
  const isSuperadmin = useAuthStore((state) => state.isSuperadmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay tenant seleccionado y no es superadmin navegando a admin-global
  // → redirigir al login para que seleccione tenant
  const isAdminGlobalRoute = location.pathname.startsWith('/admin-global');
  if (!currentTenantId && !isSuperadmin && !isAdminGlobalRoute) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
