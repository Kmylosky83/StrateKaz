/**
 * AdaptiveLayout — Selector inteligente de layout segun tipo de usuario
 *
 * Determina si el usuario autenticado es "portal-only" (proveedor sin acceso
 * a modulos del sistema) y renderiza el layout apropiado:
 *
 * - Portal-only → PortalLayout (sin sidebar, header minimo)
 * - Todos los demas → DashboardLayout (sidebar + modulos + header completo)
 *
 * Tambien se encarga de cargar el perfil del User (core.User) cuando hay
 * tenant seleccionado pero el perfil aun no se ha cargado (ej: F5 refresh).
 *
 * SEGURIDAD: Los usuarios portal-only son redirigidos forzosamente a
 * /proveedor-portal si intentan acceder a cualquier otra ruta por URL.
 */
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isPortalOnlyUser } from '@/utils/portalUtils';
import { DashboardLayout } from './DashboardLayout';
import { PortalLayout } from './PortalLayout';

export const AdaptiveLayout = () => {
  const location = useLocation();

  // Auth state
  const currentTenantId = useAuthStore((s) => s.currentTenantId);
  const user = useAuthStore((s) => s.user);
  const isLoadingUser = useAuthStore((s) => s.isLoadingUser);
  const loadUserProfile = useAuthStore((s) => s.loadUserProfile);

  // Cargar perfil del User cuando hay tenant pero no user
  // (Cubre: F5, navegacion directa, primer acceso post-login)
  // NOTA: Esta logica estaba antes en DashboardLayout, movida aqui
  // para poder decidir el layout ANTES de renderizar.
  useEffect(() => {
    if (currentTenantId && !user && !isLoadingUser) {
      loadUserProfile();
    }
  }, [currentTenantId, user, isLoadingUser, loadUserProfile]);

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

  // DEBUG: Usar alert porque Vite elimina console.log en producción
   
  alert(
    `[DEBUG] path=${location.pathname} tenant=${currentTenantId} user=${!!user} proveedor=${user?.proveedor}(${typeof user?.proveedor}) cargo=${user?.cargo?.code} portalOnly=${portalOnly}`
  );

  if (portalOnly) {
    // SEGURIDAD: Forzar redirect a /proveedor-portal si intenta acceder a otra ruta
    if (location.pathname !== '/proveedor-portal') {
      return <Navigate to="/proveedor-portal" replace />;
    }
    return <PortalLayout />;
  }

  // Usuario normal (empleado interno o profesional colocado) → DashboardLayout
  return <DashboardLayout />;
};
