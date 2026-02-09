import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { useValoresKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';
import type { EChartsOption } from 'echarts';

interface Props {
  widget: WidgetDashboard;
}

/**
 * HeatmapWidget
 *
 * Calendar heatmap showing KPI activity over time.
 * - Uses ECharts calendar heatmap
 * - Fetches values for the last year
 * - Color intensity based on value magnitude
 * - Mini calendar layout for space efficiency
 */
function HeatmapWidget({ widget }: Props) {
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

  // Get date range for the last year
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // Filter values within the last year
  const recentValores = valores.filter((v) => {
    const date = new Date(v.fecha_medicion);
    return date >= oneYearAgo && date <= now;
  });

  if (recentValores.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos del último año</p>
      </Card>
    );
  }

  // Prepare heatmap data: [[date, value], ...]
  const heatmapData = recentValores.map((v) => {
    const date = new Date(v.fecha_medicion);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return [dateStr, v.valor_numerico || 0];
  });

  // Calculate min/max for color scale
  const valoresNumericos = recentValores.map((v) => v.valor_numerico || 0);
  const minValue = Math.min(...valoresNumericos);
  const maxValue = Math.max(...valoresNumericos);

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const date = new Date(params.data[0]).toLocaleDateString('es-CO');
        const value = params.data[1].toFixed(2);
        return `${date}<br/>Valor: ${value}`;
      },
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      inRange: {
        color: ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e'],
      },
      text: ['Alto', 'Bajo'],
      textStyle: {
        color: '#6b7280',
        fontSize: 10,
      },
      itemWidth: 15,
      itemHeight: 10,
    },
    calendar: {
      top: 40,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: [oneYearAgo.toISOString().split('T')[0], now.toISOString().split('T')[0]],
      itemStyle: {
        borderWidth: 0.5,
        borderColor: '#fff',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
          width: 1,
          type: 'solid',
        },
      },
      yearLabel: {
        show: true,
        fontSize: 11,
        color: '#6b7280',
      },
      monthLabel: {
        fontSize: 10,
        color: '#6b7280',
      },
      dayLabel: {
        fontSize: 9,
        color: '#9ca3af',
        nameMap: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData,
      },
    ],
  };

  return (
    <Card className="p-4 h-full">
      <h3 className="text-sm font-medium mb-2">{widget.titulo || widget.kpi_nombre}</h3>
      <div className="text-xs text-muted-foreground mb-2">
        Actividad de {recentValores.length} mediciones en el último año
      </div>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </Card>
  );
}

export { HeatmapWidget };
export type { Props as HeatmapWidgetProps };
