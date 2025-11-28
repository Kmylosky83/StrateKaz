import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
          404
        </h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Página no encontrada
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => window.history.back()}>
            Volver Atrás
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" leftIcon={<Home className="h-4 w-4" />}>
              Ir al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
