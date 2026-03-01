import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { useValoresKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';
import type { EChartsOption } from 'echarts';
import { SEMAFORO_COLORS, CHART_AXIS_COLORS } from '@/constants/chart-colors';

interface Props {
  widget: WidgetDashboard;
}

const chartColors = {
  verde: SEMAFORO_COLORS.verde,
  amarillo: SEMAFORO_COLORS.amarillo,
  rojo: SEMAFORO_COLORS.rojo,
  gris: CHART_AXIS_COLORS.axisLabel,
};

/**
 * PieChartWidget
 *
 * Distribution chart showing semaphore status breakdown.
 * Since a single KPI doesn't naturally fit a pie chart,
 * we show the count of values by color_semaforo (verde/amarillo/rojo).
 *
 * This gives a quick visual of how often the KPI meets/exceeds targets.
 */
function PieChartWidget({ widget }: Props) {
  const { data: valores = [], isLoading } = useValoresKPIByKPI(widget.kpi);

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <Spinner size="sm" />
      </Card>
    );
  }

  if (valores.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
      </Card>
    );
  }

  // Count values by semaphore color
  const distribution = valores.reduce(
    (acc, valor) => {
      const color = valor.color_semaforo || 'gris';
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Prepare pie chart data
  const pieData = [
    { value: distribution.verde || 0, name: 'Verde (Óptimo)', itemStyle: { color: chartColors.verde } },
    { value: distribution.amarillo || 0, name: 'Amarillo (Aceptable)', itemStyle: { color: chartColors.amarillo } },
    { value: distribution.rojo || 0, name: 'Rojo (Crítico)', itemStyle: { color: chartColors.rojo } },
  ].filter((item) => item.value > 0); // Only show segments with data

  if (pieData.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos de semáforo</p>
      </Card>
    );
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: CHART_AXIS_COLORS.axisLabel, fontSize: 11 },
    },
    series: [
      {
        name: 'Distribución',
        type: 'pie',
        radius: ['40%', '70%'], // Donut chart
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{d}%',
          fontSize: 11,
          color: CHART_AXIS_COLORS.axisLabel,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        data: pieData,
      },
    ],
  };

  return (
    <Card className="p-4 h-full">
      <h3 className="text-sm font-medium mb-3">{widget.titulo || widget.kpi_nombre}</h3>
      <div className="text-xs text-muted-foreground mb-2">
        Distribución de {valores.length} mediciones por estado
      </div>
      <ReactECharts option={option} style={{ height: '260px' }} />
    </Card>
  );
}

export { PieChartWidget };
export type { Props as PieChartWidgetProps };
