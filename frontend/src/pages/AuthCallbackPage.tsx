/**
 * AuthCallbackPage - Callback para Multi-Tenant Auth
 *
 * Esta página maneja la redirección después de seleccionar un tenant.
 * En desarrollo: Recibe tenant_id como query param y configura el header.
 * En producción: El subdominio ya indica el tenant.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const tenantId = searchParams.get('tenant_id');

    if (!isAuthenticated) {
      // Si no está autenticado, redirigir al login
      navigate('/login', { replace: true });
      return;
    }

    if (tenantId) {
      // En desarrollo: Guardar tenant_id para usar en headers
      localStorage.setItem('current_tenant_id', tenantId);

      // Redirigir al dashboard
      navigate('/dashboard', { replace: true });
    } else {
      // Sin tenant_id, verificar si ya hay uno guardado
      const savedTenantId = localStorage.getItem('current_tenant_id');
      if (savedTenantId) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('No se especificó la empresa. Por favor seleccione una empresa.');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    }
  }, [searchParams, navigate, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <p className="text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Configurando acceso...</p>
      </div>
    </div>
  );
};
