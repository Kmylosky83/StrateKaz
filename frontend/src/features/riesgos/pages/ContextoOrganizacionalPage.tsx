/**
 * Contexto Organizacional — Motor de Riesgos
 *
 * Análisis DOFA, Estrategias TOWS, PESTEL y 5 Fuerzas de Porter
 * Conecta con backend: /api/motor-riesgos/contexto/
 * Tab principal: ContextoOrganizacionalTab (4 subtabs)
 */
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';
import { ContextoOrganizacionalTab } from '../components/tabs/ContextoOrganizacionalTab';

export default function ContextoOrganizacionalPage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');

  if (isColorLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/riesgos"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-${moduleColor}-100 rounded-lg`}>
            <TrendingUp className={`h-8 w-8 text-${moduleColor}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Contexto Organizacional
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis DOFA, PESTEL y 5 Fuerzas de Porter
            </p>
          </div>
        </div>
      </div>

      <ContextoOrganizacionalTab />
    </div>
  );
}
