/**
 * IPEVR — Matriz GTC-45
 *
 * Identificación de Peligros, Evaluación y Valoración de Riesgos
 * Conecta con backend: /api/motor-riesgos/ipevr/
 * Tab principal: IPEVRTab (4 subtabs: Resumen, Matriz, Peligros, Controles)
 */
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';
import { IPEVRTab } from '../components/tabs/IPEVRTab';

export default function IPEVRPage() {
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
            <Shield className={`h-8 w-8 text-${moduleColor}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              IPEVR — Matriz GTC-45
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Identificación de Peligros, Evaluación y Valoración de Riesgos
            </p>
          </div>
        </div>
      </div>

      <IPEVRTab />
    </div>
  );
}
