/**
 * Página: Analytics Dashboard Principal
 *
 * Dashboard principal de Business Intelligence con:
 * - KPIs resumen (datos reales desde API)
 * - Últimos valores de indicadores principales
 * - Alertas pendientes
 * - Acciones rápidas
 */
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Target,
  Settings,
  FileText,
  LayoutDashboard,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';
import {
  useAnalyticsStats,
  useKPISummary,
  useAlertasKPI,
  useMarcarAlertaLeida,
} from '../hooks/useAnalytics';
import type { AlertaKPI } from '../types';

// ==================== UTILITY FUNCTIONS ====================

const getSemaforoColor = (color: string) => {
  const colors: Record<string, string> = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  return colors[color] || 'bg-gray-500';
};

const getTendenciaIcon = (tendencia: string) => {
  if (tendencia === 'ascendente') return <ArrowUpRight className="w-4 h-4" />;
  if (tendencia === 'descendente') return <ArrowDownRight className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

const getCategoriaColor = (categoria: string) => {
  const colors: Record<string, string> = {
    sst: 'bg-orange-100 text-orange-800',
    pesv: 'bg-blue-100 text-blue-800',
    ambiental: 'bg-green-100 text-green-800',
    calidad: 'bg-purple-100 text-purple-800',
    financiero: 'bg-indigo-100 text-indigo-800',
    operacional: 'bg-cyan-100 text-cyan-800',
    rrhh: 'bg-pink-100 text-pink-800',
    comercial: 'bg-teal-100 text-teal-800',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-800';
};

const getSeveridadVariant = (severidad: string) => {
  if (severidad === 'alta' || severidad === 'critica') return 'danger' as const;
  if (severidad === 'media') return 'warning' as const;
  return 'info' as const;
};

// ==================== MAIN COMPONENT ====================

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: loadingStats } = useAnalyticsStats();
  const { data: kpiSummaryData, isLoading: loadingKPIs } = useKPISummary();
  const { data: alertasData, isLoading: loadingAlertas } = useAlertasKPI();
  const marcarLeida = useMarcarAlertaLeida();

  const kpiSummary = Array.isArray(kpiSummaryData) ? kpiSummaryData : [];
  const alertas = Array.isArray(alertasData) ? alertasData.slice(0, 5) : [];

  const porcentajeVerde = stats && stats.kpis_activos > 0
    ? (stats.kpis_verde / stats.kpis_activos) * 100
    : 0;

  const isLoading = loadingStats || loadingKPIs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics - Business Intelligence"
        description="Panel de control de indicadores clave de rendimiento y business intelligence"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings className="w-4 h-4" />}
              onClick={() => navigate('/analytics/configuracion')}
            >
              Configurar KPIs
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
              onClick={() => navigate('/analytics/dashboards')}
            >
              Dashboards
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PieChart className="w-4 h-4" />}
              onClick={() => navigate('/analytics/indicadores')}
            >
              Ver Indicadores
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total KPIs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.total_kpis ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.kpis_activos ?? 0} activos
              </p>
            </div>
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">KPIs en Verde</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats?.kpis_verde ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {porcentajeVerde.toFixed(0)}% del total
              </p>
            </div>
            <div className="w-14 h-14 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">KPIs en Rojo</p>
              <p className="text-3xl font-bold text-danger-600 mt-1">
                {stats?.kpis_rojo ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Requieren atención
              </p>
            </div>
            <div className="w-14 h-14 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-7 h-7 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alertas Pendientes</p>
              <p className="text-3xl font-bold text-warning-600 mt-1">
                {stats?.alertas_pendientes ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.acciones_pendientes ?? 0} acciones abiertas
              </p>
            </div>
            <div className="w-14 h-14 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-warning-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs Principales */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Indicadores Principales
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analytics/indicadores')}
            >
              Ver todos
            </Button>
          </div>

          {kpiSummary.length === 0 ? (
            <EmptyState
              icon={<Target className="w-12 h-12" />}
              title="Sin indicadores configurados"
              description="Configure indicadores KPI desde la sección de configuración"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpiSummary.slice(0, 6).map((item: any) => {
                const kpi = item.kpi || item;
                const ultimoValor = item.ultimo_valor?.valor_numerico ?? item.ultimo_valor ?? 0;
                const meta = item.meta_actual?.meta_esperada ?? item.meta ?? 0;
                const unidad = kpi.unidad_medida || item.unidad || '';
                const tendencia = item.tendencia || 'estable';
                const variacion = item.porcentaje_cambio ?? item.variacion ?? 0;
                const colorSemaforo = item.ultimo_valor?.color_semaforo || item.color_semaforo || 'verde';
                const categoria = kpi.categoria || item.categoria || '';

                return (
                  <Card key={kpi.id} variant="bordered" padding="md">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={cn(
                                'w-3 h-3 rounded-full',
                                getSemaforoColor(colorSemaforo)
                              )}
                            />
                            {categoria && (
                              <Badge
                                variant="gray"
                                size="sm"
                                className={getCategoriaColor(categoria)}
                              >
                                {categoria.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {kpi.nombre}
                          </h4>
                          <p className="text-xs text-gray-500">{kpi.codigo}</p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {typeof ultimoValor === 'number' ? ultimoValor.toLocaleString() : ultimoValor}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              {unidad}
                            </span>
                          </p>
                          {meta > 0 && (
                            <p className="text-xs text-gray-500">
                              Meta: {meta} {unidad}
                            </p>
                          )}
                        </div>

                        <div
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                            variacion > 0
                              ? 'bg-green-100 text-green-700'
                              : variacion < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {getTendenciaIcon(tendencia)}
                          <span>{Math.abs(variacion).toFixed(1)}%</span>
                        </div>
                      </div>

                      {meta > 0 && (
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              getSemaforoColor(colorSemaforo)
                            )}
                            style={{
                              width: `${Math.min((ultimoValor / meta) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alertas Recientes
            </h3>
            <Badge variant="danger" size="sm">
              {alertas.length}
            </Badge>
          </div>

          {loadingAlertas ? (
            <Spinner size="md" />
          ) : alertas.length === 0 ? (
            <Card variant="bordered" padding="md">
              <p className="text-sm text-gray-500 text-center">Sin alertas pendientes</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta: AlertaKPI) => (
                <Card key={alerta.id} variant="bordered" padding="sm">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        className={cn(
                          'w-5 h-5 flex-shrink-0 mt-0.5',
                          alerta.severidad === 'alta' || alerta.severidad === 'critica'
                            ? 'text-red-600'
                            : alerta.severidad === 'media'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {alerta.kpi_nombre}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {alerta.descripcion}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getSeveridadVariant(alerta.severidad)} size="sm">
                            {alerta.severidad}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {alerta.fecha_alerta}
                          </span>
                          {!alerta.leida && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => marcarLeida.mutate(alerta.id)}
                              className="text-xs ml-auto"
                            >
                              Marcar leída
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/analytics/acciones')}
          >
            Ver todas las alertas
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Settings className="w-5 h-5" />}
            onClick={() => navigate('/analytics/configuracion')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Configurar KPIs</div>
              <div className="text-xs text-gray-500">Catálogo, metas, semáforos</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Activity className="w-5 h-5" />}
            onClick={() => navigate('/analytics/indicadores')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Registrar Valores</div>
              <div className="text-xs text-gray-500">Mediciones de KPIs</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<LayoutDashboard className="w-5 h-5" />}
            onClick={() => navigate('/analytics/dashboards')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Dashboards BSC</div>
              <div className="text-xs text-gray-500">4 perspectivas</div>
            </div>
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => navigate('/analytics/informes')}
            className="justify-start"
          >
            <div className="text-left">
              <div className="font-medium">Exportar Reportes</div>
              <div className="text-xs text-gray-500">Excel, PDF</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
