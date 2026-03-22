import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { useValoresKPIByKPI, useMetasKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';
import type { EChartsOption } from 'echarts';
import { SEMAFORO_COLORS, CHART_COLORS, CHART_AXIS_COLORS } from '@/constants/chart-colors';

interface Props {
  widget: WidgetDashboard;
}

const chartColors = {
  verde: SEMAFORO_COLORS.verde,
  amarillo: SEMAFORO_COLORS.amarillo,
  rojo: SEMAFORO_COLORS.rojo,
  primary: CHART_COLORS[0],   // blue-500
  bar: CHART_COLORS[9],       // indigo-500
  meta: '#9333EA',            // purple-600 (not in palette, kept explicit)
};

/**
 * BarChartWidget
 *
 * Time-series bar chart showing KPI values over time.
 * - X axis: fecha_medicion
 * - Y axis: valor_numerico
 * - Optional meta line overlay
 * - Bar color based on semaphore status
 */
function BarChartWidget({ widget }: Props) {
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

  // Determine bar colors based on semaphore
  const barColors = semaforos.map((color) => {
    if (color === 'verde') return chartColors.verde;
    if (color === 'amarillo') return chartColors.amarillo;
    if (color === 'rojo') return chartColors.rojo;
    return chartColors.bar;
  });

  // Meta line data (if enabled)
  const metaData = widget.mostrar_meta && metas.length > 0
    ? dates.map((date) => {
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
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return '';
        const date = params[0]?.axisValue || '';
        let content = `<strong>${date}</strong><br/>`;
        params.forEach((param: unknown) => {
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
      axisLine: { lineStyle: { color: CHART_AXIS_COLORS.axisLine } },
      axisLabel: { color: CHART_AXIS_COLORS.axisLabel, fontSize: 11, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: CHART_AXIS_COLORS.axisLine } },
      axisLabel: { color: CHART_AXIS_COLORS.axisLabel, fontSize: 11 },
      splitLine: { lineStyle: { color: CHART_AXIS_COLORS.splitLine } },
    },
    series: [
      {
        name: widget.kpi_nombre || 'Valor',
        type: 'bar',
        data: valoresData,
        itemStyle: {
          color: (params: unknown) => barColors[params.dataIndex] || chartColors.bar,
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 40,
      },
      ...(metaData
        ? [
            {
              name: 'Meta',
              type: 'line',
              data: metaData,
              lineStyle: { color: chartColors.meta, type: 'dashed' as const, width: 2 },
              itemStyle: { color: chartColors.meta },
              symbol: 'circle',
              symbolSize: 6,
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

export { BarChartWidget };
export type { Props as BarChartWidgetProps };
