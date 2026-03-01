/**
 * MonitoreoPage - Métricas, alertas SLA y monitoreo del Workflow Engine
 *
 * Secciones:
 * 1. KPI Cards: Tasa Completadas, Tiempo Promedio, Cuellos de Botella, Alertas SLA
 * 2. Resumen visual de flujos (barras de estado)
 * 3. Tabla de MetricaFlujo por plantilla/período
 * 4. Tabla de AlertaFlujo con acciones
 */
import { useState } from 'react';
import { BarChart3, ArrowLeft, GitBranch, Bell, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
  EmptyState,
  Spinner,
  StatusBadge,
  KpiCard,
  KpiCardGrid,
  KpiCardSkeleton,
} from '@/components/common';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/layout';
import {
  useMonitoreoDashboard,
  useMonitoreoMetricas,
  useMonitoreoAlertas,
  useInstancias,
  useEstadisticasTareas,
  useEstadisticasInstancias,
} from '../hooks/useWorkflows';

// ============================================================
// UTILIDADES
// ============================================================

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const periodoLabels: Record<string, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  anual: 'Anual',
};

const tipoAlertaLabels: Record<string, string> = {
  retraso: 'Retraso',
  escalamiento: 'Escalamiento',
  error: 'Error',
  vencimiento: 'Vencimiento',
};

const severidadConfig: Record<string, { label: string; variant: string }> = {
  baja: { label: 'Baja', variant: 'gray' },
  media: { label: 'Media', variant: 'warning' },
  alta: { label: 'Alta', variant: 'danger' },
  critica: { label: 'Crítica', variant: 'danger' },
};

const estadoAlertaLabels: Record<string, string> = {
  activa: 'Activa',
  atendida: 'Atendida',
  ignorada: 'Ignorada',
};

type ActiveTabType = 'metricas' | 'alertas';

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

interface StatBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const StatBar = ({ label, value, total, color }: StatBarProps) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {value} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

interface SLACardProps {
  label: string;
  description: string;
  value: number;
  color: 'green' | 'yellow' | 'red';
}

const SLACard = ({ label, description, value, color }: SLACardProps) => {
  const colorMap = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };
  const valueColorMap = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${colorMap[color]}`}>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</div>
    </div>
  );
};

// ============================================================
// PAGINA PRINCIPAL
// ============================================================

export default function MonitoreoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTabType>('metricas');
  const [alertaEstadoFilter, setAlertaEstadoFilter] = useState<string>('');

  // Queries
  const { isLoading: loadingDashboard } = useMonitoreoDashboard();
  const { data: statsInstancias, isLoading: loadingInstancias } = useEstadisticasInstancias();
  const { data: statsTareas, isLoading: loadingTareas } = useEstadisticasTareas();
  const { data: metricasData, isLoading: loadingMetricas } = useMonitoreoMetricas();
  const { data: alertasData, isLoading: loadingAlertas } = useMonitoreoAlertas(
    alertaEstadoFilter ? { estado: alertaEstadoFilter } : undefined
  );
  const { data: instanciasEnProceso } = useInstancias({ estado: 'EN_PROCESO' });

  const isLoadingKpis = loadingDashboard || loadingInstancias || loadingTareas;

  const metricas = Array.isArray(metricasData) ? metricasData : (metricasData?.results ?? []);

  const alertas = Array.isArray(alertasData) ? alertasData : (alertasData?.results ?? []);

  const instancias = Array.isArray(instanciasEnProceso)
    ? instanciasEnProceso
    : (instanciasEnProceso?.results ?? []);

  // Calcular KPIs del dashboard
  const alertasActivas = alertas.filter(
    (a: Record<string, unknown>) => a.estado === 'activa'
  ).length;

  // Calcular tasa de completadas y tiempo promedio de las métricas
  const tasaCompletadas = (() => {
    if (metricas.length === 0) return 0;
    const totalInst = metricas.reduce(
      (sum: number, m: Record<string, unknown>) => sum + (Number(m.total_instancias) || 0),
      0
    );
    const completadasInst = metricas.reduce(
      (sum: number, m: Record<string, unknown>) => sum + (Number(m.instancias_completadas) || 0),
      0
    );
    return totalInst > 0 ? Math.round((completadasInst / totalInst) * 100) : 0;
  })();

  const tiempoPromedio = (() => {
    const conTiempo = metricas.filter(
      (m: Record<string, unknown>) => m.tiempo_promedio_dias != null
    );
    if (conTiempo.length === 0) return 0;
    const sum = conTiempo.reduce(
      (acc: number, m: Record<string, unknown>) => acc + Number(m.tiempo_promedio_dias),
      0
    );
    return Math.round((sum / conTiempo.length) * 10) / 10;
  })();

  const tabs = [
    {
      id: 'metricas' as const,
      label: 'Métricas por Plantilla',
      count: metricas.length,
    },
    {
      id: 'alertas' as const,
      label: 'Alertas SLA',
      count: alertasActivas || alertas.length,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoreo y Métricas"
        description="Análisis de rendimiento, tiempos y cumplimiento de SLAs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      {isLoadingKpis ? (
        <KpiCardGrid columns={4}>
          {[1, 2, 3, 4].map((i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </KpiCardGrid>
      ) : (
        <KpiCardGrid columns={4}>
          <KpiCard
            title="Tasa Completadas"
            value={`${tasaCompletadas}%`}
            icon="TrendingUp"
            color="green"
          />
          <KpiCard title="Tiempo Promedio" value={`${tiempoPromedio}d`} icon="Clock" color="blue" />
          <KpiCard
            title="Flujos Activos"
            value={statsInstancias?.activas ?? 0}
            icon="Activity"
            color="purple"
          />
          <KpiCard
            title="Alertas Activas"
            value={alertasActivas}
            icon="AlertTriangle"
            color="red"
          />
        </KpiCardGrid>
      )}

      {/* Resumen de estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas generales */}
        <Card>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Resumen de Flujos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estado general de instancias de flujo
            </p>
          </div>
          <div className="p-5 space-y-4">
            <StatBar
              label="Activas"
              value={statsInstancias?.activas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-blue-500"
            />
            <StatBar
              label="Completadas"
              value={statsInstancias?.completadas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-green-500"
            />
            <StatBar
              label="Canceladas"
              value={statsInstancias?.canceladas ?? 0}
              total={statsInstancias?.total ?? 1}
              color="bg-red-500"
            />
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total de flujos</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {statsInstancias?.total ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cumplimiento SLA */}
        <Card>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cumplimiento de SLAs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estado de tareas respecto a tiempos límite
            </p>
          </div>
          <div className="p-5 space-y-3">
            <SLACard
              label="Dentro de SLA"
              description="Completadas a tiempo"
              value={statsTareas?.completadas_hoy ?? 0}
              color="green"
            />
            <SLACard
              label="En Proceso"
              description="Dentro de plazo"
              value={statsTareas?.en_progreso ?? 0}
              color="yellow"
            />
            <SLACard
              label="Fuera de SLA"
              description="Vencidas"
              value={statsTareas?.vencidas ?? 0}
              color="red"
            />
          </div>
        </Card>
      </div>

      {/* Tabs: Métricas y Alertas */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.id === 'metricas' ? (
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                )}
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <Badge
                    variant={activeTab === tab.id ? 'purple' : 'gray'}
                    size="sm"
                    className="ml-2"
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* ---- TAB: Métricas ---- */}
        {activeTab === 'metricas' && (
          <div>
            {loadingMetricas ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : metricas.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<BarChart3 className="h-12 w-12" />}
                  title="Sin métricas"
                  description="No hay datos de métricas disponibles aún. Las métricas se generan automáticamente con la ejecución de flujos."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Plantilla
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Período
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Instancias
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Completadas
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Canceladas
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tasa
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tiempo Prom.
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Rango
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.map((metrica: Record<string, unknown>) => {
                      const tasa = Number(metrica.tasa_completadas) || 0;
                      return (
                        <tr
                          key={String(metrica.id)}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {String(metrica.plantilla_nombre || '-')}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="gray" size="sm">
                              {periodoLabels[String(metrica.periodo)] || String(metrica.periodo)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                            {String(metrica.total_instancias ?? 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              {String(metrica.instancias_completadas ?? 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                              {String(metrica.instancias_canceladas ?? 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={tasa} preset="cumplimiento" label={`${tasa}%`} />
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                            {metrica.tiempo_promedio_dias != null
                              ? `${Number(metrica.tiempo_promedio_dias).toFixed(1)} días`
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(metrica.fecha_inicio as string)} -{' '}
                            {formatDate(metrica.fecha_fin as string)}
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

        {/* ---- TAB: Alertas ---- */}
        {activeTab === 'alertas' && (
          <div>
            {/* Filtro de estado */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '', label: 'Todas' },
                  { value: 'activa', label: 'Activas' },
                  { value: 'atendida', label: 'Atendidas' },
                  { value: 'ignorada', label: 'Ignoradas' },
                ].map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={alertaEstadoFilter === f.value ? 'secondary' : 'ghost'}
                    onClick={() => setAlertaEstadoFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {loadingAlertas ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : alertas.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<ShieldAlert className="h-12 w-12" />}
                  title="Sin alertas"
                  description="No hay alertas de SLA actualmente. El sistema genera alertas automáticamente."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Alerta
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Severidad
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Instancia
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Tarea
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Generada
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Horas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((alerta: Record<string, unknown>) => {
                      const severidad = String(alerta.severidad || 'baja');
                      const sevConfig = severidadConfig[severidad] || severidadConfig.baja;
                      const estado = String(alerta.estado || 'activa');

                      return (
                        <tr
                          key={String(alerta.id)}
                          className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            estado === 'activa' && (severidad === 'alta' || severidad === 'critica')
                              ? 'bg-red-50/50 dark:bg-red-900/10'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                                {String(alerta.titulo || '-')}
                              </p>
                              {alerta.descripcion && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                  {String(alerta.descripcion)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge
                              status={String(alerta.tipo || '')}
                              label={tipoAlertaLabels[String(alerta.tipo)] || String(alerta.tipo)}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge
                              status={severidad.toUpperCase()}
                              preset="gravedad"
                              label={sevConfig.label}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {String(alerta.instancia_codigo || '-')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {String(alerta.tarea_codigo || '-')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge
                              status={
                                estado === 'activa'
                                  ? 'PENDIENTE'
                                  : estado === 'atendida'
                                    ? 'COMPLETADO'
                                    : 'CANCELADO'
                              }
                              label={estadoAlertaLabels[estado] || estado}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(alerta.fecha_generacion as string)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {alerta.tiempo_sin_atender != null ? (
                              <span
                                className={`text-sm font-medium ${
                                  Number(alerta.tiempo_sin_atender) > 24
                                    ? 'text-red-600'
                                    : Number(alerta.tiempo_sin_atender) > 8
                                      ? 'text-orange-600'
                                      : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {Number(alerta.tiempo_sin_atender).toFixed(1)}h
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
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
      </Card>

      {/* Flujos en Proceso */}
      <Card>
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Flujos en Proceso
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Instancias de flujo actualmente en ejecución
          </p>
        </div>
        <div className="overflow-x-auto">
          {instancias.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<GitBranch className="h-10 w-10" />}
                title="Sin flujos activos"
                description="No hay instancias de flujo en proceso actualmente"
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Flujo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Plantilla
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Prioridad
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Progreso
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Inicio
                  </th>
                </tr>
              </thead>
              <tbody>
                {instancias.slice(0, 10).map((inst: Record<string, unknown>) => (
                  <tr
                    key={String(inst.id)}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                          {String(inst.titulo || '-')}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {String(inst.codigo_instancia || '')}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {(inst.plantilla_detail as Record<string, unknown>)?.nombre
                        ? String((inst.plantilla_detail as Record<string, unknown>).nombre)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={String(inst.estado || 'EN_PROCESO')} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={String(inst.prioridad || 'NORMAL')} preset="prioridad" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Number(inst.progreso_porcentaje) || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {Number(inst.progreso_porcentaje) || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {inst.fecha_inicio
                        ? new Date(String(inst.fecha_inicio)).toLocaleDateString('es-CO')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
