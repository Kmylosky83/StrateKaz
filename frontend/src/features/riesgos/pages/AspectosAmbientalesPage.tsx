/**
 * Aspectos e Impactos Ambientales — ISO 14001:2015
 *
 * Conecta con backend: /api/motor-riesgos/aspectos-ambientales/
 * Hooks: useAspectosAmbientales, useResumenAspectos, useProgramasAmbientales, useMonitoreosAmbientales
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  ArrowLeft,
  AlertTriangle,
  FileCheck,
  Activity,
  Layers,
  ClipboardCheck,
} from 'lucide-react';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Tabs } from '@/components/common/Tabs';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import {
  useAspectosAmbientales,
  useResumenAspectos,
  useProgramasAmbientales,
  useMonitoreosAmbientales,
} from '../hooks/useAspectosAmbientales';

const SIGNIFICANCIA_COLORS: Record<string, string> = {
  significativo: 'bg-red-100 text-red-800',
  no_significativo: 'bg-green-100 text-green-800',
  por_evaluar: 'bg-yellow-100 text-yellow-800',
};

export default function AspectosAmbientalesPage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');
  const [activeTab, setActiveTab] = useState('aspectos');

  const {
    data: aspectosData,
    isLoading: isLoadingAspectos,
    error: aspectosError,
  } = useAspectosAmbientales();
  const { data: resumen, isLoading: isLoadingResumen } = useResumenAspectos();
  const { data: programasData, isLoading: isLoadingProgramas } = useProgramasAmbientales();
  const { data: monitoreosData, isLoading: isLoadingMonitoreos } = useMonitoreosAmbientales();

  const aspectos = useMemo(() => {
    if (!aspectosData) return [];
    return Array.isArray(aspectosData) ? aspectosData : (aspectosData?.results ?? []);
  }, [aspectosData]);

  const programas = useMemo(() => {
    if (!programasData) return [];
    return Array.isArray(programasData) ? programasData : (programasData?.results ?? []);
  }, [programasData]);

  const monitoreos = useMemo(() => {
    if (!monitoreosData) return [];
    return Array.isArray(monitoreosData) ? monitoreosData : (monitoreosData?.results ?? []);
  }, [monitoreosData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData = resumen as Record<string, any> | undefined;

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Total Aspectos',
        value: resumenData?.total ?? aspectos.length,
        icon: Leaf,
        iconColor: 'success',
        description: 'Identificados',
      },
      {
        label: 'Significativos',
        value: resumenData?.significativos ?? 0,
        icon: AlertTriangle,
        iconColor: 'danger',
        description: 'Requieren acción',
      },
      {
        label: 'Programas',
        value: resumenData?.programas_activos ?? programas.length,
        icon: FileCheck,
        iconColor: 'info',
        description: 'Activos',
      },
      {
        label: 'Monitoreos',
        value: resumenData?.monitoreos_pendientes ?? monitoreos.length,
        icon: Activity,
        iconColor: 'warning',
        description: 'Registrados',
      },
    ],
    [resumenData, aspectos, programas, monitoreos]
  );

  const tabs = [
    { id: 'aspectos', label: 'Aspectos', icon: <Layers className="h-4 w-4" /> },
    { id: 'programas', label: 'Programas', icon: <FileCheck className="h-4 w-4" /> },
    { id: 'monitoreos', label: 'Monitoreos', icon: <ClipboardCheck className="h-4 w-4" /> },
  ];

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
          <div className="p-3 bg-green-100 rounded-lg">
            <Leaf className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Aspectos e Impactos Ambientales
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Identificación y evaluación según ISO 14001:2015
            </p>
          </div>
        </div>
      </div>

      {aspectosError && (
        <Alert variant="error" message="Error al cargar los aspectos ambientales." />
      )}

      <StatsGrid stats={stats} isLoading={isLoadingResumen} moduleColor={moduleColor} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB: Aspectos */}
      {activeTab === 'aspectos' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingAspectos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : aspectos.length === 0 ? (
            <EmptyState
              icon={Leaf}
              title="Sin aspectos ambientales"
              description="No se han identificado aspectos ambientales aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Aspecto
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Condición
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Significancia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {aspectos.map((a: Record<string, unknown>) => (
                    <tr key={a.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {(a.nombre ?? a.name ?? '-') as string}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {(a.descripcion ?? a.description ?? '') as string}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {(a.categoria_nombre ?? a.categoria ?? '-') as string}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {(a.condicion_operacion_display ?? a.condicion_operacion ?? '-') as string}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            SIGNIFICANCIA_COLORS[a.significancia as string] ??
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {(a.significancia_display ?? a.significancia ?? 'Por evaluar') as string}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Programas */}
      {activeTab === 'programas' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingProgramas ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : programas.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="Sin programas ambientales"
              description="No se han registrado programas de gestión ambiental aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Programa
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Avance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {programas.map((p: Record<string, unknown>) => (
                    <tr key={p.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {(p.nombre ?? p.name ?? '-') as string}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {(p.tipo_programa_display ?? p.tipo_programa ?? '-') as string}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {(p.estado_display ?? p.estado ?? '-') as string}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Number(p.porcentaje_avance ?? 0)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {Number(p.porcentaje_avance ?? 0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Monitoreos */}
      {activeTab === 'monitoreos' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingMonitoreos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : monitoreos.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Sin monitoreos"
              description="No se han registrado monitoreos ambientales aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Parámetro
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Cumple
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {monitoreos.map((m: Record<string, unknown>) => (
                    <tr key={m.id as number} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {(m.parametro_medido ?? '-') as string}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {String(m.valor_medido ?? '-')} {(m.unidad_medida ?? '') as string}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            m.cumple_normativa
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {m.cumple_normativa ? 'Sí' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {(m.fecha_monitoreo ?? '-') as string}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
