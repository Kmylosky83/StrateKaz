/**
 * Helpers compartidos para gráficos ECharts del informe gerencial
 */
import type { EChartsOption } from 'echarts';
import {
  CHART_COLORS,
  CHART_AXIS_COLORS,
  STATUS_COLORS,
  RISK_COLORS,
} from '@/constants/chart-colors';

/** Tooltip base para todos los charts */
export const baseTooltip = {
  backgroundColor: CHART_AXIS_COLORS.tooltip.bg,
  borderColor: CHART_AXIS_COLORS.tooltip.border,
  textStyle: { color: CHART_AXIS_COLORS.tooltip.text, fontSize: 12 },
  borderWidth: 1,
};

/** Pie/Donut chart genérico */
export function makePieOption(
  data: Array<{ name: string; value: number }>,
  opts?: { isDonut?: boolean; height?: number }
): EChartsOption {
  return {
    tooltip: {
      ...baseTooltip,
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10, color: CHART_AXIS_COLORS.axisLabel },
    },
    color: CHART_COLORS.slice(0, data.length),
    series: [
      {
        type: 'pie',
        radius: opts?.isDonut ? ['40%', '70%'] : '70%',
        center: ['50%', '45%'],
        data,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' },
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    ],
    animation: true,
    animationDuration: 800,
  };
}

/** Bar chart genérico (horizontal o vertical) */
export function makeBarOption(
  categories: string[],
  values: number[],
  opts?: {
    horizontal?: boolean;
    colorFn?: (idx: number, val: number) => string;
    showLabel?: boolean;
  }
): EChartsOption {
  const colors = values.map((v, i) =>
    opts?.colorFn ? opts.colorFn(i, v) : CHART_COLORS[i % CHART_COLORS.length]
  );

  const categoryAxis = {
    type: 'category' as const,
    data: categories,
    axisLabel: { fontSize: 10, color: CHART_AXIS_COLORS.axisLabel },
    axisLine: { lineStyle: { color: CHART_AXIS_COLORS.axisLine } },
  };
  const valueAxis = {
    type: 'value' as const,
    axisLabel: { fontSize: 10, color: CHART_AXIS_COLORS.axisLabel },
    splitLine: { lineStyle: { color: CHART_AXIS_COLORS.splitLine } },
  };

  return {
    tooltip: { ...baseTooltip, trigger: 'axis' },
    grid: { left: opts?.horizontal ? 80 : 40, right: 20, top: 10, bottom: 30, containLabel: false },
    xAxis: opts?.horizontal ? valueAxis : categoryAxis,
    yAxis: opts?.horizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: opts?.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
        })),
        barMaxWidth: 30,
        label: opts?.showLabel
          ? { show: true, position: opts?.horizontal ? 'right' : 'top', fontSize: 10 }
          : undefined,
      },
    ],
    animation: true,
    animationDuration: 800,
  };
}

/** Stacked horizontal bar (for progress-like displays) */
export function makeStackedBarOption(
  segments: Array<{ name: string; value: number; color: string }>
): EChartsOption {
  return {
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: false },
    xAxis: {
      type: 'value',
      max: segments.reduce((s, seg) => s + seg.value, 0) || 100,
      show: false,
    },
    yAxis: { type: 'category', data: [''], show: false },
    series: segments.map((seg) => ({
      name: seg.name,
      type: 'bar' as const,
      stack: 'total',
      data: [seg.value],
      itemStyle: { color: seg.color, borderRadius: 3 },
      barWidth: 20,
    })),
    animation: true,
  };
}

/** Heatmap 5x5 para mapa de calor de riesgos */
export function makeRiskHeatmapOption(niveles: {
  BAJO: number;
  MODERADO: number;
  ALTO: number;
  CRITICO: number;
}): EChartsOption {
  const labels = ['Bajo', 'Moderado', 'Alto', 'Critico'];
  const values = [niveles.BAJO, niveles.MODERADO, niveles.ALTO, niveles.CRITICO];
  const colors = [RISK_COLORS.bajo, RISK_COLORS.medio, RISK_COLORS.alto, RISK_COLORS.critico];

  return makeBarOption(labels, values, {
    horizontal: true,
    colorFn: (i) => colors[i],
    showLabel: true,
  });
}

export { CHART_COLORS, CHART_AXIS_COLORS, STATUS_COLORS, RISK_COLORS };
