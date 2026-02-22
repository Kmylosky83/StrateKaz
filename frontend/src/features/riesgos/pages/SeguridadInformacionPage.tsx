/**
 * Seguridad de la Información — ISO 27001:2022
 *
 * Conecta con backend: /api/riesgos/seguridad-info/
 * Hooks: useActivosInformacion, useRiesgosSeguridad, useControlesSeguridad, useIncidentesSeguridad
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  ArrowLeft,
  Database,
  AlertTriangle,
  Shield,
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
  useActivosInformacion,
  useActivosEstadisticas,
  useRiesgosSeguridad,
  useControlesSeguridad,
  useIncidentesSeguridad,
} from '../hooks/useSeguridadInformacion';
import {
  CLASIFICACION_LABELS,
  CLASIFICACION_COLORS,
  NIVEL_RIESGO_SI_LABELS,
  NIVEL_RIESGO_SI_COLORS,
  ESTADO_RIESGO_SI_LABELS,
  SEVERIDAD_SI_LABELS,
  SEVERIDAD_SI_COLORS,
  ESTADO_INCIDENTE_SI_LABELS,
  ESTADO_IMPL_LABELS,
  ESTADO_IMPL_COLORS,
  type ClasificacionActivo,
  type NivelRiesgoSI,
  type EstadoRiesgoSI,
  type SeveridadIncidenteSI,
  type EstadoIncidenteSI,
  type EstadoImplementacion,
} from '../types/seguridad-informacion.types';

export default function SeguridadInformacionPage() {
  const { color: moduleColor, isLoading: isColorLoading } = useModuleColor('MOTOR_RIESGOS');
  const [activeTab, setActiveTab] = useState('activos');

  const {
    data: activosData,
    isLoading: isLoadingActivos,
    error: activosError,
  } = useActivosInformacion();
  const { data: estadisticas, isLoading: isLoadingStats } = useActivosEstadisticas();
  const { data: riesgosData, isLoading: isLoadingRiesgos } = useRiesgosSeguridad();
  const { data: controlesData, isLoading: isLoadingControles } = useControlesSeguridad();
  const { data: incidentesData, isLoading: isLoadingIncidentes } = useIncidentesSeguridad();

  const activos = useMemo(() => {
    if (!activosData) return [];
    return Array.isArray(activosData) ? activosData : (activosData?.results ?? []);
  }, [activosData]);

  const riesgos = useMemo(() => {
    if (!riesgosData) return [];
    return Array.isArray(riesgosData) ? riesgosData : (riesgosData?.results ?? []);
  }, [riesgosData]);

  const controles = useMemo(() => {
    if (!controlesData) return [];
    return Array.isArray(controlesData) ? controlesData : (controlesData?.results ?? []);
  }, [controlesData]);

  const incidentes = useMemo(() => {
    if (!incidentesData) return [];
    return Array.isArray(incidentesData) ? incidentesData : (incidentesData?.results ?? []);
  }, [incidentesData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsData = estadisticas as Record<string, any> | undefined;

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: 'Activos',
        value: statsData?.total ?? activos.length,
        icon: Database,
        iconColor: 'info',
        description: 'De información',
      },
      {
        label: 'Riesgos',
        value: riesgos.length,
        icon: AlertTriangle,
        iconColor: 'danger',
        description: 'Identificados',
      },
      {
        label: 'Controles',
        value: controles.length,
        icon: Shield,
        iconColor: 'success',
        description: 'ISO 27001',
      },
      {
        label: 'Incidentes',
        value: incidentes.length,
        icon: Activity,
        iconColor: 'warning',
        description: 'Registrados',
      },
    ],
    [statsData, activos, riesgos, controles, incidentes]
  );

  const tabs = [
    { id: 'activos', label: 'Activos', icon: <Database className="h-4 w-4" /> },
    { id: 'riesgos', label: 'Riesgos', icon: <Layers className="h-4 w-4" /> },
    { id: 'controles', label: 'Controles', icon: <Shield className="h-4 w-4" /> },
    { id: 'incidentes', label: 'Incidentes', icon: <ClipboardCheck className="h-4 w-4" /> },
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
          <div className="p-3 bg-red-100 rounded-lg">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seguridad de la Información
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema de Gestión según ISO 27001:2022
            </p>
          </div>
        </div>
      </div>

      {activosError && (
        <Alert variant="error" message="Error al cargar los activos de información." />
      )}

      <StatsGrid stats={stats} isLoading={isLoadingStats} moduleColor={moduleColor} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB: Activos de Información */}
      {activeTab === 'activos' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingActivos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : activos.length === 0 ? (
            <EmptyState
              icon={Database}
              title="Sin activos de información"
              description="No se han registrado activos de información aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Activo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Clasificación
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Criticidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activos.map((a: Record<string, unknown>) => {
                    const clasif = (a.clasificacion ?? '') as ClasificacionActivo;
                    const criticidad = Number(a.criticidad ?? 0);
                    return (
                      <tr
                        key={a.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(a.nombre ?? a.codigo ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {(a.ubicacion ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(a.tipo_display ?? a.tipo ?? '-') as string}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={CLASIFICACION_COLORS[clasif] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {CLASIFICACION_LABELS[clasif] ?? clasif ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full rounded-full ${
                                  criticidad >= 4
                                    ? 'bg-red-500'
                                    : criticidad >= 3
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${(criticidad / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {criticidad}/5
                            </span>
                          </div>
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
              title="Sin riesgos de seguridad"
              description="No se han identificado riesgos de seguridad de la información aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Escenario
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Aceptabilidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {riesgos.map((r: Record<string, unknown>) => {
                    const nivel = (r.nivel_riesgo ?? '') as NivelRiesgoSI;
                    const estado = (r.estado ?? '') as EstadoRiesgoSI;
                    return (
                      <tr
                        key={r.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {(r.escenario_riesgo ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(r.activo_nombre ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={NIVEL_RIESGO_SI_COLORS[nivel] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {NIVEL_RIESGO_SI_LABELS[nivel] ?? nivel ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ESTADO_RIESGO_SI_LABELS[estado] ?? (r.estado_display as string) ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(r.aceptabilidad_display ?? r.aceptabilidad ?? '-') as string}
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

      {/* TAB: Controles */}
      {activeTab === 'controles' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          {isLoadingControles ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : controles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Sin controles"
              description="No se han registrado controles de seguridad aún."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Control ISO
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Efectividad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {controles.map((c: Record<string, unknown>) => {
                    const estadoImpl = (c.estado_implementacion ?? '') as EstadoImplementacion;
                    const efectividad = Number(c.efectividad ?? 0);
                    return (
                      <tr
                        key={c.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(c.control_iso ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {(c.descripcion ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(c.tipo_control_display ?? c.tipo_control ?? '-') as string}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              ESTADO_IMPL_COLORS[estadoImpl] ?? 'bg-gray-100 text-gray-800'
                            }
                          >
                            {ESTADO_IMPL_LABELS[estadoImpl] ?? estadoImpl ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${efectividad}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {efectividad}%
                            </span>
                          </div>
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
              title="Sin incidentes"
              description="No se han registrado incidentes de seguridad aún."
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
                  {incidentes.map((i: Record<string, unknown>) => {
                    const sev = (i.severidad ?? '') as SeveridadIncidenteSI;
                    const estado = (i.estado ?? '') as EstadoIncidenteSI;
                    return (
                      <tr
                        key={i.id as number}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(i.tipo_incidente_display ?? i.tipo_incidente ?? '-') as string}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {(i.descripcion ?? '') as string}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={SEVERIDAD_SI_COLORS[sev] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {SEVERIDAD_SI_LABELS[sev] ?? sev ?? '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {ESTADO_INCIDENTE_SI_LABELS[estado] ??
                            (i.estado_display as string) ??
                            '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {(i.fecha_deteccion ?? '-') as string}
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
