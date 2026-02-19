/**
 * KPIGaugeChart - Velocímetro Enterprise con ECharts
 * Sistema de Gestión StrateKaz - Analytics Pro
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { SEMAFORO_COLORS, formatValue } from '../../../types/kpi.types';

export interface KPIGaugeChartProps {
  kpi: KPIObjetivo;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showThresholds?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { radius: '50%', fontSize: 14, height: 200 },
  md: { radius: '65%', fontSize: 16, height: 300 },
  lg: { radius: '75%', fontSize: 18, height: 400 },
  xl: { radius: '80%', fontSize: 20, height: 500 },
};

export function KPIGaugeChart({
  kpi,
  size = 'md',
  showThresholds = true,
  animated = true,
  className,
}: KPIGaugeChartProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const option = useMemo(() => {
    const currentValue = kpi.last_value || 0;
    const targetValue = kpi.target_value;
    const warningThreshold = kpi.warning_threshold;
    const criticalThreshold = kpi.critical_threshold;

    // Determinar min y max del gauge
    const maxValue =
      kpi.max_value !== null && kpi.max_value !== undefined
        ? kpi.max_value
        : Math.max(targetValue, warningThreshold, criticalThreshold, currentValue) * 1.2;

    const minValue = kpi.min_value !== null && kpi.min_value !== undefined ? kpi.min_value : 0;

    // Configurar zonas de color según trend_type
    const axisLine =
      kpi.trend_type === 'MAYOR_MEJOR'
        ? {
            lineStyle: {
              width: 30,
              color: [
                [criticalThreshold / maxValue, SEMAFORO_COLORS.ROJO],
                [warningThreshold / maxValue, SEMAFORO_COLORS.AMARILLO],
                [1, SEMAFORO_COLORS.VERDE],
              ],
            },
          }
        : kpi.trend_type === 'MENOR_MEJOR'
        ? {
            lineStyle: {
              width: 30,
              color: [
                [warningThreshold / maxValue, SEMAFORO_COLORS.VERDE],
                [criticalThreshold / maxValue, SEMAFORO_COLORS.AMARILLO],
                [1, SEMAFORO_COLORS.ROJO],
              ],
            },
          }
        : {
            lineStyle: {
              width: 30,
              color: [
                [0.3, SEMAFORO_COLORS.AMARILLO],
                [0.7, SEMAFORO_COLORS.VERDE],
                [1, SEMAFORO_COLORS.AMARILLO],
              ],
            },
          };

    return {
      series: [
        {
          type: 'gauge',
          radius: sizeConfig.radius,
          min: minValue,
          max: maxValue,
          startAngle: 200,
          endAngle: -20,
          splitNumber: 10,
          axisLine,
          pointer: {
            itemStyle: {
              color: 'auto',
            },
            width: 4,
            length: '70%',
          },
          axisTick: {
            distance: -30,
            length: 8,
            lineStyle: {
              color: '#fff',
              width: 2,
            },
          },
          splitLine: {
            distance: -30,
            length: 15,
            lineStyle: {
              color: '#fff',
              width: 4,
            },
          },
          axisLabel: {
            color: 'auto',
            distance: 35,
            fontSize: sizeConfig.fontSize - 2,
            formatter: (value: number) => {
              return value.toFixed(0);
            },
          },
          detail: {
            valueAnimation: animated,
            formatter: `{value} ${kpi.unit}`,
            color: 'auto',
            fontSize: sizeConfig.fontSize + 4,
            fontWeight: 'bold',
            offsetCenter: [0, '70%'],
          },
          title: {
            fontSize: sizeConfig.fontSize,
            fontWeight: 'bold',
            color: '#666',
            offsetCenter: [0, '90%'],
          },
          data: [
            {
              value: currentValue,
              name: kpi.name,
            },
          ],
          markPoint: showThresholds
            ? {
                data: [
                  {
                    name: 'Meta',
                    value: targetValue,
                    xAxis: targetValue,
                    yAxis: 0,
                    itemStyle: {
                      color: SEMAFORO_COLORS.VERDE,
                    },
                  },
                ],
              }
            : undefined,
        },
      ],
      tooltip: {
        formatter: () => {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${kpi.name}</div>
              <div style="margin-bottom: 4px;">Valor Actual: <strong>${formatValue(currentValue, kpi.unit)}</strong></div>
              <div style="margin-bottom: 4px;">Meta: <strong>${formatValue(targetValue, kpi.unit)}</strong></div>
              ${showThresholds ? `<div style="margin-bottom: 4px;">Umbral Alerta: <strong>${formatValue(warningThreshold, kpi.unit)}</strong></div>` : ''}
              ${showThresholds ? `<div style="margin-bottom: 4px;">Umbral Crítico: <strong>${formatValue(criticalThreshold, kpi.unit)}</strong></div>` : ''}
              ${kpi.formula ? `<div style="margin-top: 8px; font-size: 11px; color: #999;">Fórmula: ${kpi.formula}</div>` : ''}
              ${kpi.responsible_name ? `<div style="font-size: 11px; color: #999;">Responsable: ${kpi.responsible_name}</div>` : ''}
            </div>
          `;
        },
      },
    };
  }, [kpi, sizeConfig, showThresholds, animated]);

  return (
    <Card className={cn('p-6', className)}>
      <ReactECharts option={option} style={{ height: sizeConfig.height }} notMerge lazyUpdate />
    </Card>
  );
}
