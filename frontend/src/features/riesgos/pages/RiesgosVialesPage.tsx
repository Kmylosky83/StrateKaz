/**
 * Riesgos Viales — PESV (Resolución 40595/2022)
 *
 * Conecta con backend: /api/riesgos/riesgos-viales/
 * Hooks: useRiesgosViales, useEstadisticasRiesgosViales, useEstadisticasIncidentesViales,
 *        useIncidentesViales, useInspeccionesVehiculo
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ArrowLeft,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { useModuleColor } from '@/hooks/useModuleColor';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Tabs } from '@/components/common/Tabs';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import {
  useRiesgosViales,
  useEstadisticasRiesgosViales,
  useEstadisticasIncidentesViales,
  useIncidentesViales,
  useInspeccionesVehiculo,
} from '../hooks/useRiesgosViales';
import {
  NIVEL_RIESGO_VIAL_LABELS,
  NIVEL_RIESGO_VIAL_COLORS,
  ESTADO_RIESGO_VIAL_LABELS,
  GRAVEDAD_INCIDENTE_LABELS,
  GRAVEDAD_INCIDENTE_COLORS,
  ESTADO_INVESTIGACION_LABELS,
  RESULTADO_INSPECCION_LABELS,
  RESULTADO_INSPECCION_COLORS,
  type NivelRiesgoVial,
  type GravedadIncidente,
  type EstadoRiesgoVial,
  type EstadoInvestigacion,
  type ResultadoInspeccion,
  type RiesgoVialList,
  type IncidenteVialList,
  type InspeccionVehiculoList,
} from '../types/riesgos-viales.types';

export default function RiesgosVialesPage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');
  const [activeTab, setActiveTab] = useState('riesgos');

  const {
    data: riesgosData,
    isLoading: isLoadingRiesgos,
    error: riesgosError,
  } = useRiesgosViales();
  const { data: estadisticasRiesgos, isLoading: isLoadingStatsRiesgos } =
    useEstadisticasRiesgosViales();
  const { data: estadisticasIncidentes, isLoading: isLoadingStatsIncidentes } =
    useEstadisticasIncidentesViales();
  const isLoadingStats = isLoadingStatsRiesgos || isLoadingStatsIncidentes;

  const { data: incidentesData, isLoading: isLoadingIncidentes } = useIncidentesViales();
  const { data: inspeccionesData, isLoading: isLoadingInspecciones } = useInspeccionesVehiculo();

  const riesgos = useMemo(() => {
    if (!riesgosData) return [];
    return Array.isArray(riesgosData)
      ? riesgosData
      : (((riesgosData as Record<string, unknown>)?.results as RiesgoVialList[]) ?? []);
  }, [riesgosData]);

  const incidentes = useMemo(() => {
    if (!incidentesData) return [];
    return Array.isArray(incidentesData)
      ? incidentesData
      : (((incidentesData as Record<string, unknown>)?.results as IncidenteVialList[]) ?? []);
  }, [incidentesData]);

  const inspecciones = useMemo(() => {
    if (!inspeccionesData) return [];
    return Array.isArray(inspeccionesData)
      ? inspeccionesData
      : (((inspeccionesData as Record<string, unknown>)?.results as InspeccionVehiculoList[]) ??
          []);
  }, [inspeccionesData]);

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Riesgos Viales',
        value: estadisticasRiesgos?.total_riesgos ?? riesgos.length,
        icon: AlertTriangle,
        iconColor: 'danger',
        description: 'Identificados',
      },
      {
        label: 'Incidentes',
        value: estadisticasIncidentes?.total_incidentes ?? incidentes.length,
        icon: Activity,
        iconColor: 'warning',
        description: 'Registrados',
      },
      {
        label: 'Inspecciones',
        value: inspecciones.length,
        icon: ClipboardCheck,
        iconColor: 'info',
        description: 'Realizadas',
      },
      {
        label: 'Riesgos Críticos',
        value: estadisticasRiesgos?.requieren_accion_inmediata ?? '-',
        icon: Shield,
        iconColor: 'danger',
        description: 'Requieren atención',
      },
    ],
    [estadisticasRiesgos, estadisticasIncidentes, riesgos, incidentes, inspecciones]
  );

  const tabs = [
    { id: 'riesgos', label: 'Riesgos', icon: <Layers className="h-4 w-4" /> },
    { id: 'incidentes', label: 'Incidentes', icon: <Activity className="h-4 w-4" /> },
    { id: 'inspecciones', label: 'Inspecciones', icon: <ClipboardCheck className="h-4 w-4" /> },
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Car className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Riesgos Viales - PESV
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Plan Estratégico de Seguridad Vial — Resolución 40595/2022
            </p>
          </div>
        </div>
      </div>

      {riesgosError && <Alert variant="error" message="Error al cargar los riesgos viales." />}

      <StatsGrid stats={stats} isLoading={isLoadingStats} moduleColor={moduleColor} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB: Riesgos */}
      {activeTab === 'riesgos' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingRiesgos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : riesgos.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sin riesgos viales"
              description="No se han identificado riesgos viales aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Riesgo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {riesgos.map((r: RiesgoVialList) => {
                    const nivel = r.nivel_riesgo;
                    const estado = r.estado;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {r.codigo ?? '-'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {r.descripcion ?? ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {r.tipo_riesgo_categoria ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              NIVEL_RIESGO_VIAL_COLORS[nivel] ?? 'bg-gray-100 text-gray-800'
                            }
                          >
                            {NIVEL_RIESGO_VIAL_LABELS[nivel] ?? nivel ?? 'Sin evaluar'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ESTADO_RIESGO_VIAL_LABELS[estado] ?? estado ?? '-'}
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

      {/* TAB: Incidentes */}
      {activeTab === 'incidentes' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingIncidentes ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : incidentes.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Sin incidentes viales"
              description="No se han registrado incidentes viales aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Incidente
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Gravedad
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
                  {incidentes.map((i: IncidenteVialList) => {
                    const gravedad = i.gravedad;
                    const estadoInv = i.estado_investigacion;
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {i.numero_incidente ?? '-'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {i.ubicacion ?? i.conductor_nombre ?? ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              GRAVEDAD_INCIDENTE_COLORS[gravedad] ?? 'bg-gray-100 text-gray-800'
                            }
                          >
                            {GRAVEDAD_INCIDENTE_LABELS[gravedad] ?? gravedad ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ESTADO_INVESTIGACION_LABELS[estadoInv] ?? estadoInv ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {i.fecha_incidente ?? '-'}
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

      {/* TAB: Inspecciones */}
      {activeTab === 'inspecciones' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingInspecciones ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : inspecciones.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Sin inspecciones"
              description="No se han registrado inspecciones de vehículos aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Conformidad
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Resultado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inspecciones.map((ins: InspeccionVehiculoList) => {
                    const resultado = ins.resultado;
                    return (
                      <tr key={ins.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {ins.vehiculo_placa ?? ins.numero_inspeccion ?? '-'}
                          </p>
                          <p className="text-xs text-gray-500">{ins.conductor_nombre ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Number(ins.porcentaje_conformidad ?? 0)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {Number(ins.porcentaje_conformidad ?? 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              RESULTADO_INSPECCION_COLORS[resultado] ?? 'bg-gray-100 text-gray-800'
                            }
                          >
                            {RESULTADO_INSPECCION_LABELS[resultado] ?? resultado ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ins.fecha_inspeccion ?? '-'}
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
