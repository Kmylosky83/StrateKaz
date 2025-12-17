/**
 * SmartRedirect Component
 *
 * Redirige al usuario a su landing apropiada:
 * 1. Si hay última ruta guardada → ir ahí
 * 2. Si no → ir a landing según rol
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getLastRoute, getLandingByRole } from '@/hooks/useLastRoute';

export const SmartRedirect = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const lastRoute = getLastRoute();
    const landingByRole = getLandingByRole(user?.cargo_code);

    // Prioridad: última ruta > landing por rol
    const targetRoute = lastRoute || landingByRole;

    navigate(targetRoute, { replace: true });
  }, [isAuthenticated, user?.cargo_code, navigate]);

  // Loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
};
