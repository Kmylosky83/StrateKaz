/**
 * ErrorPage - Página genérica de error (500, errores inesperados)
 * Sprint 11 Fix - Complementa NotFoundPage (404)
 */
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

export const ErrorPage = ({
  statusCode = 500,
  title = 'Error inesperado',
  message = 'Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.',
}: ErrorPageProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-7xl font-bold text-red-600 dark:text-red-400">
          {statusCode}
        </h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {message}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
              Ir al Dashboard
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          Si el problema persiste, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
};
