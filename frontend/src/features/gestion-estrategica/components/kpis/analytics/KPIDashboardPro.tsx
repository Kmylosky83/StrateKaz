/**
 * KPIDashboardPro - Dashboard Enterprise con Tremor + Nivo + ECharts
 * Sistema de Gestión StrateKaz - Analytics Pro Edition
 */
import { useMemo } from 'react';
import { Grid, Card as TremorCard, Text, Title, Metric } from '@tremor/react';
import { Card, Spinner, EmptyState, ColorLegend } from '@/components/common';
import { BarChart3, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { ResponsivePie } from '@nivo/pie';
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

export function KPIDashboardPro({ planId, objectiveId, className }: KPIDashboardProProps) {
  const { data: kpisData, isLoading } = useKPIs(
    objectiveId ? { objective: objectiveId, is_active: true } : { is_active: true }
  );

  const kpis = kpisData?.results || [];

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

    // Calcular progreso promedio
    const kpisWithValues = kpis.filter((k) => k.last_value !== null && k.last_value !== undefined);
    const avgProgress =
      kpisWithValues.length > 0
        ? kpisWithValues.reduce((acc, k) => {
            const progress = ((k.last_value || 0) / k.target_value) * 100;
            return acc + Math.min(progress, 100);
          }, 0) / kpisWithValues.length
        : 0;

    return {
      total: kpis.length,
      verde,
      amarillo,
      rojo,
      sinDatos,
      avgProgress,
    };
  }, [kpis]);

  const pieData = useMemo(() => {
    return [
      {
        id: 'En Meta',
        label: 'En Meta',
        value: stats.verde,
        color: SEMAFORO_COLORS.VERDE,
      },
      {
        id: 'En Alerta',
        label: 'En Alerta',
        value: stats.amarillo,
        color: SEMAFORO_COLORS.AMARILLO,
      },
      {
        id: 'Crítico',
        label: 'Crítico',
        value: stats.rojo,
        color: SEMAFORO_COLORS.ROJO,
      },
      {
        id: 'Sin Datos',
        label: 'Sin Datos',
        value: stats.sinDatos,
        color: SEMAFORO_COLORS.SIN_DATOS,
      },
    ].filter((item) => item.value > 0);
  }, [stats]);

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
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
          <TremorCard decoration="top" decorationColor="blue">
            <Text>Total KPIs</Text>
            <Metric>{stats.total}</Metric>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="emerald">
            <Text>En Meta</Text>
            <Metric>{stats.verde}</Metric>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="amber">
            <Text>En Alerta</Text>
            <Metric>{stats.amarillo}</Metric>
          </TremorCard>
          <TremorCard decoration="top" decorationColor="rose">
            <Text>Críticos</Text>
            <Metric>{stats.rojo}</Metric>
          </TremorCard>
        </Grid>

        {/* Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="p-6">
            <Title className="mb-4">Distribución de KPIs por Estado</Title>
            <div className="h-80">
              <ResponsivePie
                data={pieData}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ datum: 'data.color' }}
                borderWidth={1}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.2]],
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                  from: 'color',
                  modifiers: [['darker', 2]],
                }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                  },
                ]}
              />
            </div>
          </Card>

          {/* Top Performer Gauge */}
          {topPerformers[0] && (
            <div>
              <Title className="mb-4">Mejor Desempeño</Title>
              <KPIGaugeChart kpi={topPerformers[0]} size="md" showThresholds />
            </div>
          )}
        </div>

        {/* Performance Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          {topPerformers.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-success-600" />
                <Title>Top 5 - Mejor Desempeño</Title>
              </div>
              <div className="space-y-3">
                {topPerformers.map((kpi) => (
                  <PerformanceItem key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </Card>
          )}

          {/* Bottom Performers */}
          {bottomPerformers.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-danger-600" />
                <Title>Top 5 - Requieren Atención</Title>
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
          <Title className="mb-4">Todos los KPIs</Title>
          <KPIMetricCards kpis={kpis} layout="grid" showDelta showSparkline />
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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {kpi.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatValue(kpi.last_value, kpi.unit)} / {formatValue(kpi.target_value, kpi.unit)}
        </p>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-bold"
          style={{ color: statusColor }}
        >
          {progress.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
