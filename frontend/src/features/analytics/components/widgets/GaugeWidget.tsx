import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { useUltimoValorKPI, useMetasKPIByKPI, useCatalogoKPI } from '../../hooks/useAnalytics';
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
  primary: CHART_COLORS[0],
};

/**
 * GaugeWidget
 *
 * Speedometer/gauge visualization:
 * - Current value as pointer
 * - Meta as target reference
 * - Color zones based on semaphore config
 * - Percentage display relative to meta
 */
function GaugeWidget({ widget }: Props) {
  const { data: valorActual, isLoading: loadingValor } = useUltimoValorKPI(widget.kpi);
  const { data: metas = [], isLoading: loadingMetas } = useMetasKPIByKPI(widget.kpi);
  const { data: catalogoKPI, isLoading: loadingCatalogo } = useCatalogoKPI(widget.kpi);

  const isLoading = loadingValor || loadingMetas || loadingCatalogo;

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <Spinner size="sm" />
      </Card>
    );
  }

  if (!valorActual || !catalogoKPI) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
      </Card>
    );
  }

  // Find active meta
  const metaActiva = metas.find((meta) => {
    const now = new Date();
    const desde = new Date(meta.periodo_desde);
    const hasta = new Date(meta.periodo_hasta);
    return now >= desde && now <= hasta;
  });

  const valor = valorActual.valor_numerico || 0;
  const meta = metaActiva?.valor_meta || 100;

  // Calculate gauge max (extend beyond meta for better visualization)
  const maxValue = meta * 1.5;

  // Determine gauge color zones based on semaphore ranges
  // We'll use a simple 3-zone split: 0-33% red, 33-66% yellow, 66-100% green
  const axisLineColor = [
    [0.33, chartColors.rojo],
    [0.66, chartColors.amarillo],
    [1, chartColors.verde],
  ];

  const option: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: maxValue,
        splitNumber: 5,
        itemStyle: {
          color: valorActual.color_semaforo === 'verde'
            ? chartColors.verde
            : valorActual.color_semaforo === 'amarillo'
            ? chartColors.amarillo
            : chartColors.rojo,
        },
        progress: {
          show: true,
          width: 20,
        },
        pointer: {
          show: true,
          length: '70%',
          width: 6,
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: axisLineColor as any,
          },
        },
        axisTick: {
          distance: -25,
          splitNumber: 5,
          lineStyle: {
            width: 1,
            color: CHART_AXIS_COLORS.axisLabel,
          },
        },
        splitLine: {
          distance: -30,
          length: 14,
          lineStyle: {
            width: 2,
            color: CHART_AXIS_COLORS.axisLabel,
          },
        },
        axisLabel: {
          distance: -45,
          color: CHART_AXIS_COLORS.axisLabel,
          fontSize: 10,
          formatter: (value: number) => value.toFixed(0),
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            borderWidth: 6,
            borderColor: valorActual.color_semaforo === 'verde'
              ? chartColors.verde
              : valorActual.color_semaforo === 'amarillo'
              ? chartColors.amarillo
              : chartColors.rojo,
          },
        },
        title: {
          show: true,
          offsetCenter: [0, '80%'],
          fontSize: 12,
          color: CHART_AXIS_COLORS.axisLabel,
        },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '50%'],
          formatter: (value: number) => value.toFixed(2),
          color: CHART_AXIS_COLORS.title,
        },
        data: [
          {
            value: valor,
            name: widget.kpi_nombre || 'KPI',
          },
        ],
      },
    ],
  };

  return (
    <Card className="p-4 h-full">
      <h3 className="text-sm font-medium mb-2">{widget.titulo || widget.kpi_nombre}</h3>
      <ReactECharts option={option} style={{ height: '280px' }} />

      {/* Meta reference */}
      {metaActiva && (
        <div className="mt-2 pt-2 border-t text-center">
          <div className="text-xs text-muted-foreground">
            Meta: <span className="font-medium text-gray-700">{meta.toFixed(2)}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Progreso:{' '}
            <span className="font-medium text-gray-700">
              {((valor / meta) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

export { GaugeWidget };
export type { Props as GaugeWidgetProps };
