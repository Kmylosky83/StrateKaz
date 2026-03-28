/**
 * KPIDashboardPro - Dashboard Enterprise con ECharts
 * Sistema de Gestion StrateKaz - Analytics Pro Edition
 */
import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react';
import { Card, Spinner, EmptyState } from '@/components/common';
import { BarChart3, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { useKPIs } from '../../../hooks/useKPIs';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { SEMAFORO_COLORS, formatValue } from '../../../types/kpi.types';
import { KPIGaugeChart } from './KPIGaugeChart';
import { KPIMetricCards } from './KPIMetricCards';

export interface KPIDashboardProProps {
  planId: number;
  objectiveId?: number;
  className?: string;
}

export function KPIDashboardPro({ planId: _planId, objectiveId, className }: KPIDashboardProProps) {
  const { data: kpisData, isLoading } = useKPIs(
    objectiveId ? { objective: objectiveId, is_active: true } : { is_active: true }
  );

  const kpis = useMemo(() => kpisData?.results || [], [kpisData]);

  const stats = useMemo(() => {
    if (kpis.length === 0) {
      return {
        total: 0,
        verde: 0,
        amarillo: 0,
        rojo: 0,
        sinDatos: 0,
        avgProgress: 0,
      };
    }

    const verde = kpis.filter((k) => k.status_semaforo === 'VERDE').length;
    const amarillo = kpis.filter((k) => k.status_semaforo === 'AMARILLO').length;
    const rojo = kpis.filter((k) => k.status_semaforo === 'ROJO').length;
    const sinDatos = kpis.filter((k) => k.status_semaforo === 'SIN_DATOS').length;

    const kpisWithValues = kpis.filter((k) => k.last_value !== null && k.last_value !== undefined);
    const avgProgress =
      kpisWithValues.length > 0
        ? kpisWithValues.reduce((acc, k) => {
            const progress = ((k.last_value || 0) / k.target_value) * 100;
            return acc + Math.min(progress, 100);
          }, 0) / kpisWithValues.length
        : 0;

    return { total: kpis.length, verde, amarillo, rojo, sinDatos, avgProgress };
  }, [kpis]);

  const pieData = useMemo(() => {
    return [
      { value: stats.verde, name: 'En Meta', itemStyle: { color: SEMAFORO_COLORS.VERDE } },
      { value: stats.amarillo, name: 'En Alerta', itemStyle: { color: SEMAFORO_COLORS.AMARILLO } },
      { value: stats.rojo, name: 'Crítico', itemStyle: { color: SEMAFORO_COLORS.ROJO } },
      { value: stats.sinDatos, name: 'Sin Datos', itemStyle: { color: SEMAFORO_COLORS.SIN_DATOS } },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const pieOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, left: 'center' },
      series: [
        {
          type: 'pie' as const,
          radius: ['40%', '70%'],
          padAngle: 2,
          itemStyle: { borderRadius: 4 },
          label: { show: true, formatter: '{b}\n{d}%' },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' as const },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
          data: pieData,
        },
      ],
    }),
    [pieData]
  );

  const topPerformers = useMemo(() => {
    return [...kpis]
      .filter((k) => k.last_value !== null)
      .sort((a, b) => {
        const progressA = ((a.last_value || 0) / a.target_value) * 100;
        const progressB = ((b.last_value || 0) / b.target_value) * 100;
        return progressB - progressA;
      })
      .slice(0, 5);
  }, [kpis]);

  const bottomPerformers = useMemo(() => {
    return [...kpis]
      .filter((k) => k.last_value !== null && k.status_semaforo !== 'VERDE')
      .sort((a, b) => {
        const progressA = ((a.last_value || 0) / a.target_value) * 100;
        const progressB = ((b.last_value || 0) / b.target_value) * 100;
        return progressA - progressB;
      })
      .slice(0, 5);
  }, [kpis]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No hay KPIs disponibles"
        description="Crea KPIs y agrega mediciones para visualizar el dashboard"
      />
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total KPIs" value={stats.total} color="blue" icon={Target} />
          <StatCard label="En Meta" value={stats.verde} color="emerald" icon={TrendingUp} />
          <StatCard label="En Alerta" value={stats.amarillo} color="amber" icon={AlertTriangle} />
          <StatCard label="Críticos" value={stats.rojo} color="rose" icon={AlertTriangle} />
        </div>

        {/* Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Distribucion de KPIs por Estado
            </h3>
            <div className="h-80">
              <ReactEChartsCore option={pieOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>

          {topPerformers[0] && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Mejor Desempeno
              </h3>
              <KPIGaugeChart kpi={topPerformers[0]} size="md" showThresholds />
            </div>
          )}
        </div>

        {/* Performance Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topPerformers.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-success-600" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Top 5 - Mejor Desempeno
                </h3>
              </div>
              <div className="space-y-3">
                {topPerformers.map((kpi) => (
                  <PerformanceItem key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </Card>
          )}

          {bottomPerformers.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-danger-600" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Top 5 - Requieren Atencion
                </h3>
              </div>
              <div className="space-y-3">
                {bottomPerformers.map((kpi) => (
                  <PerformanceItem key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* All KPIs Grid */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Todos los KPIs
          </h3>
          <KPIMetricCards kpis={kpis} layout="grid" showDelta showSparkline />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

const COLOR_MAP: Record<string, { border: string; text: string; bg: string }> = {
  blue: {
    border: 'border-t-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  emerald: {
    border: 'border-t-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  amber: {
    border: 'border-t-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  rose: {
    border: 'border-t-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 border-t-4 ${colors.border} bg-white dark:bg-gray-800 p-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PERFORMANCE ITEM
// =============================================================================

interface PerformanceItemProps {
  kpi: KPIObjetivo;
}

function PerformanceItem({ kpi }: PerformanceItemProps) {
  const progress = useMemo(() => {
    if (kpi.last_value === null || kpi.last_value === undefined) return 0;
    return Math.min(((kpi.last_value || 0) / kpi.target_value) * 100, 100);
  }, [kpi]);

  const statusColor = SEMAFORO_COLORS[kpi.status_semaforo];

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-2 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{kpi.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatValue(kpi.last_value, kpi.unit)} / {formatValue(kpi.target_value, kpi.unit)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold" style={{ color: statusColor }}>
          {progress.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
