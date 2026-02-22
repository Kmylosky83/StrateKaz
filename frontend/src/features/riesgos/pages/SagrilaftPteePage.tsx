/**
 * SAGRILAFT / PTEE — Sistema Antilavado y Transparencia
 *
 * Conecta con backend: /api/riesgos/sagrilaft/
 * Hooks: useMatricesRiesgoLAFT, useSenalesAlerta, useReportesROS, useDebidasDiligencias
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ArrowLeft,
  AlertTriangle,
  Shield,
  FileCheck,
  Search,
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
  useMatricesRiesgoLAFT,
  useResumenMatricesLAFT,
  useSenalesAlerta,
  useReportesROS,
  useDebidasDiligencias,
} from '../hooks/useSagrilaftPtee';
import {
  NIVEL_LAFT_LABELS,
  NIVEL_LAFT_COLORS,
  ESTADO_MATRIZ_LABELS,
  ESTADO_MATRIZ_COLORS,
  SEVERIDAD_SENAL_LABELS,
  SEVERIDAD_SENAL_COLORS,
  ESTADO_SENAL_LABELS,
  ESTADO_ROS_LABELS,
  ESTADO_ROS_COLORS,
  ESTADO_DILIGENCIA_LABELS,
  ESTADO_DILIGENCIA_COLORS,
  type NivelRiesgoLAFT,
  type EstadoMatrizLAFT,
  type SeveridadSenal,
  type EstadoSenal,
  type EstadoROS,
  type EstadoDiligencia,
} from '../types/sagrilaft-ptee.types';

export default function SagrilaftPteePage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');
  const [activeTab, setActiveTab] = useState('matrices');

  const {
    data: matricesData,
    isLoading: isLoadingMatrices,
    error: matricesError,
  } = useMatricesRiesgoLAFT();
  const { data: resumen, isLoading: isLoadingResumen } = useResumenMatricesLAFT();
  const { data: senalesData, isLoading: isLoadingSenales } = useSenalesAlerta();
  const { data: reportesData, isLoading: isLoadingReportes } = useReportesROS();
  const { data: diligenciasData, isLoading: isLoadingDiligencias } = useDebidasDiligencias();

  const matrices = useMemo(() => {
    if (!matricesData) return [];
    return Array.isArray(matricesData) ? matricesData : (matricesData?.results ?? []);
  }, [matricesData]);

  const senales = useMemo(() => {
    if (!senalesData) return [];
    return Array.isArray(senalesData) ? senalesData : (senalesData?.results ?? []);
  }, [senalesData]);

  const reportes = useMemo(() => {
    if (!reportesData) return [];
    return Array.isArray(reportesData) ? reportesData : (reportesData?.results ?? []);
  }, [reportesData]);

  const diligencias = useMemo(() => {
    if (!diligenciasData) return [];
    return Array.isArray(diligenciasData) ? diligenciasData : (diligenciasData?.results ?? []);
  }, [diligenciasData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumenData = resumen as Record<string, any> | undefined;

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Matrices',
        value: resumenData?.total ?? matrices.length,
        icon: Layers,
        iconColor: 'info',
        description: 'Evaluaciones LA/FT',
      },
      {
        label: 'Señales de Alerta',
        value: senales.length,
        icon: AlertTriangle,
        iconColor: 'warning',
        description: 'Detectadas',
      },
      {
        label: 'Reportes ROS',
        value: reportes.length,
        icon: FileCheck,
        iconColor: 'danger',
        description: 'Operaciones sospechosas',
      },
      {
        label: 'Debidas Diligencias',
        value: diligencias.length,
        icon: Search,
        iconColor: 'success',
        description: 'Registradas',
      },
    ],
    [resumenData, matrices, senales, reportes, diligencias]
  );

  const tabs = [
    { id: 'matrices', label: 'Matrices', icon: <Layers className="h-4 w-4" /> },
    { id: 'senales', label: 'Señales', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'reportes', label: 'Reportes ROS', icon: <Shield className="h-4 w-4" /> },
    {
      id: 'diligencias',
      label: 'Debidas Diligencias',
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
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
          <div className="p-3 bg-purple-100 rounded-lg">
            <Landmark className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SAGRILAFT / PTEE</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema Antilavado de Activos y Contra el Terrorismo
            </p>
          </div>
        </div>
      </div>

      {matricesError && (
        <Alert variant="error" message="Error al cargar las matrices de riesgo LA/FT." />
      )}

      <StatsGrid stats={stats} isLoading={isLoadingResumen} moduleColor={moduleColor} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB: Matrices de Riesgo */}
      {activeTab === 'matrices' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingMatrices ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : matrices.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Sin matrices de riesgo"
              description="No se han creado matrices de riesgo LA/FT aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Evaluado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Nivel Residual
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Próxima Revisión
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {matrices.map((m: Record<string, unknown>) => {
                    const nivel = (m.nivel_riesgo_residual ?? '') as NivelRiesgoLAFT;
                    const estado = (m.estado ?? '') as EstadoMatrizLAFT;
                    return (
                      <tr
                        key={m.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(m.nombre_evaluado ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(m.tipo_evaluado_display ?? m.tipo_evaluado ?? '') as string} —{' '}
                            {(m.identificacion_evaluado ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={NIVEL_LAFT_COLORS[nivel] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {NIVEL_LAFT_LABELS[nivel] ?? nivel ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={ESTADO_MATRIZ_COLORS[estado] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {ESTADO_MATRIZ_LABELS[estado] ?? estado ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(m.proxima_revision ?? '-') as string}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Señales de Alerta */}
      {activeTab === 'senales' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingSenales ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : senales.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sin señales de alerta"
              description="No se han detectado señales de alerta aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Señal
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Severidad
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {senales.map((s: Record<string, unknown>) => {
                    const sev = (s.severidad ?? '') as SeveridadSenal;
                    const estado = (s.estado ?? '') as EstadoSenal;
                    return (
                      <tr
                        key={s.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(s.nombre ?? s.codigo ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(s.categoria_display ?? s.categoria ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={SEVERIDAD_SENAL_COLORS[sev] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {SEVERIDAD_SENAL_LABELS[sev] ?? sev ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ESTADO_SENAL_LABELS[estado] ?? (s.estado_display as string) ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(s.fecha_deteccion ?? '-') as string}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Reportes ROS */}
      {activeTab === 'reportes' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingReportes ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : reportes.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Sin reportes ROS"
              description="No se han generado reportes de operaciones sospechosas aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Reporte
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reportes.map((r: Record<string, unknown>) => {
                    const estado = (r.estado ?? '') as EstadoROS;
                    return (
                      <tr
                        key={r.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(r.numero_ros ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(r.nombre_reportado ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(r.tipo_operacion_display ?? r.tipo_operacion ?? '-') as string}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={ESTADO_ROS_COLORS[estado] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {ESTADO_ROS_LABELS[estado] ?? estado ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          ${Number(r.monto_total ?? 0).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Debidas Diligencias */}
      {activeTab === 'diligencias' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingDiligencias ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : diligencias.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Sin debidas diligencias"
              description="No se han registrado debidas diligencias aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Evaluado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Completitud
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Vencimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {diligencias.map((d: Record<string, unknown>) => {
                    const estado = (d.estado ?? '') as EstadoDiligencia;
                    const completitud = Number(d.porcentaje_completitud ?? 0);
                    return (
                      <tr
                        key={d.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(d.evaluado_nombre ?? d.codigo ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(d.tipo_display ?? d.tipo_diligencia ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${completitud}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {completitud}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              ESTADO_DILIGENCIA_COLORS[estado] ?? 'bg-gray-100 text-gray-800'
                            }
                          >
                            {ESTADO_DILIGENCIA_LABELS[estado] ?? estado ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(d.fecha_vencimiento ?? '-') as string}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
