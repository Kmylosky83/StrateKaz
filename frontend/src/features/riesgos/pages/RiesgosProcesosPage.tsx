/**
 * Riesgos y Oportunidades por Proceso — ISO 31000
 *
 * Conecta con backend: /api/motor-riesgos/riesgos-procesos/
 * Tab principal: RiesgosOportunidadesTab (riesgos, oportunidades, tratamientos)
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { RiesgosOportunidadesTab } from '../components/tabs/RiesgosOportunidadesTab';
import { useRiesgos, useOportunidades } from '../hooks/useRiesgos';

export default function RiesgosProcesosPage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');

  const { data: riesgosData, isLoading: isLoadingRiesgos, error: riesgosError } = useRiesgos();
  const { data: oportunidadesData, isLoading: isLoadingOportunidades } = useOportunidades();

  const riesgos = useMemo(() => {
    if (!riesgosData) return [];
    return Array.isArray(riesgosData) ? riesgosData : (riesgosData?.results ?? []);
  }, [riesgosData]);

  const oportunidades = useMemo(() => {
    if (!oportunidadesData) return [];
    return Array.isArray(oportunidadesData)
      ? oportunidadesData
      : (oportunidadesData?.results ?? []);
  }, [oportunidadesData]);

  const isLoading = isColorLoading || isLoadingRiesgos || isLoadingOportunidades;

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
            <AlertTriangle className={`h-8 w-8 text-${moduleColor}-600`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Riesgos y Oportunidades
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestión de riesgos y oportunidades por proceso — ISO 31000
            </p>
          </div>
        </div>
      </div>

      {riesgosError && (
        <Alert
          variant="error"
          message="Error al cargar los riesgos. Verifique la conexión con el servidor."
        />
      )}

      <RiesgosOportunidadesTab
        riesgos={riesgos}
        oportunidades={oportunidades}
        tratamientos={[]}
        isLoading={isLoading}
      />
    </div>
  );
}
