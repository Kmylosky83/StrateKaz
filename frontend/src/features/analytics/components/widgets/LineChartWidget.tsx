import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { useValoresKPIByKPI, useMetasKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';
import type { EChartsOption } from 'echarts';

interface Props {
  widget: WidgetDashboard;
}

const chartColors = {
  verde: '#22c55e',
  amarillo: '#eab308',
  rojo: '#ef4444',
  primary: '#3b82f6',
  line: '#6366f1',
  meta: '#9333ea',
};

/**
 * LineChartWidget
 *
 * Time-series line chart showing KPI values over time.
 * - X axis: fecha_medicion
 * - Y axis: valor_numerico
 * - Optional meta line overlay
 * - Color based on semaphore status
 */
function LineChartWidget({ widget }: Props) {
  const { data: valores = [], isLoading: loadingValores } = useValoresKPIByKPI(widget.kpi);
  const { data: metas = [], isLoading: loadingMetas } = useMetasKPIByKPI(widget.kpi);

  const isLoading = loadingValores || loadingMetas;

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

  // Sort valores by date
  const sortedValores = [...valores].sort(
    (a, b) => new Date(a.fecha_medicion).getTime() - new Date(b.fecha_medicion).getTime()
  );

  // Prepare chart data
  const dates = sortedValores.map((v) => new Date(v.fecha_medicion).toLocaleDateString('es-CO'));
  const valoresData = sortedValores.map((v) => v.valor_numerico || 0);
  const semaforos = sortedValores.map((v) => v.color_semaforo);

  // Determine point colors based on semaphore
  const pointColors = semaforos.map((color) => {
    if (color === 'verde') return chartColors.verde;
    if (color === 'amarillo') return chartColors.amarillo;
    if (color === 'rojo') return chartColors.rojo;
    return chartColors.primary;
  });

  // Meta line data (if enabled)
  const metaData = widget.mostrar_meta && metas.length > 0
    ? dates.map((date) => {
        // Find meta for this date
        const dateObj = new Date(date);
        const meta = metas.find((m) => {
          const desde = new Date(m.periodo_desde);
          const hasta = new Date(m.periodo_hasta);
          return dateObj >= desde && dateObj <= hasta;
        });
        return meta?.valor_meta || null;
      })
    : null;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const date = params[0]?.axisValue || '';
        let content = `<strong>${date}</strong><br/>`;
        params.forEach((param: any) => {
          const value = param.value !== null ? param.value.toFixed(2) : 'N/A';
          content += `${param.marker} ${param.seriesName}: ${value}<br/>`;
        });
        return content;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        name: widget.kpi_nombre || 'Valor',
        type: 'line',
        data: valoresData,
        smooth: true,
        lineStyle: { color: chartColors.line, width: 2 },
        itemStyle: {
          color: (params: any) => pointColors[params.dataIndex] || chartColors.primary,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${chartColors.line}40` },
              { offset: 1, color: `${chartColors.line}10` },
            ],
          },
        },
      },
      ...(metaData
        ? [
            {
              name: 'Meta',
              type: 'line',
              data: metaData,
              lineStyle: { color: chartColors.meta, type: 'dashed' as const, width: 2 },
              itemStyle: { color: chartColors.meta },
              symbol: 'none',
            },
          ]
        : []),
    ],
  };

  return (
    <Card className="p-4 h-full">
      <h3 className="text-sm font-medium mb-3">{widget.titulo || widget.kpi_nombre}</h3>
      <ReactECharts option={option} style={{ height: '280px' }} />
    </Card>
  );
}

export { LineChartWidget };
export type { Props as LineChartWidgetProps };
