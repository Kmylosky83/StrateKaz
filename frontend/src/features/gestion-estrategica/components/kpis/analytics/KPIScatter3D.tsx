/**
 * KPIScatter3D - Visualizacion 3D con ECharts GL
 * Sistema de Gestion StrateKaz - Analytics Pro Edition
 */
import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { SEMAFORO_COLORS, getBSCColor } from '../../../types/kpi.types';

export interface KPIScatter3DProps {
  kpis: KPIObjetivo[];
  xAxis?: 'target' | 'progress' | 'measurements_count';
  yAxis?: 'value' | 'frequency_order';
  zAxis?: 'objective' | 'responsible';
  colorBy?: 'semaforo' | 'bsc_perspective';
  height?: number;
  className?: string;
}

const AXIS_CONFIG = {
  target: { label: 'Meta', getValue: (kpi: KPIObjetivo) => kpi.target_value },
  progress: {
    label: 'Progreso (%)',
    getValue: (kpi: KPIObjetivo) => {
      if (kpi.last_value === null || kpi.last_value === undefined) return 0;
      return Math.min(((kpi.last_value || 0) / kpi.target_value) * 100, 100);
    },
  },
  measurements_count: {
    label: 'Mediciones',
    getValue: (kpi: KPIObjetivo) => kpi.measurements_count || 0,
  },
  value: {
    label: 'Valor Actual',
    getValue: (kpi: KPIObjetivo) => kpi.last_value || 0,
  },
  frequency_order: {
    label: 'Frecuencia',
    getValue: (kpi: KPIObjetivo) => {
      const order: Record<string, number> = {
        DIARIO: 1, SEMANAL: 2, QUINCENAL: 3, MENSUAL: 4,
        BIMESTRAL: 5, TRIMESTRAL: 6, SEMESTRAL: 7, ANUAL: 8,
      };
      return order[kpi.frequency] || 0;
    },
  },
  objective: {
    label: 'Objetivo',
    getValue: (kpi: KPIObjetivo) => kpi.objective,
  },
  responsible: {
    label: 'Responsable',
    getValue: (kpi: KPIObjetivo) => kpi.responsible || 0,
  },
};

export function KPIScatter3D({
  kpis,
  xAxis = 'target',
  yAxis = 'value',
  zAxis = 'objective',
  colorBy = 'semaforo',
  height = 600,
  className,
}: KPIScatter3DProps) {
  const option = useMemo(() => {
    if (kpis.length === 0) return {};

    const xConfig = AXIS_CONFIG[xAxis];
    const yConfig = AXIS_CONFIG[yAxis];
    const zConfig = AXIS_CONFIG[zAxis];

    const maxTarget = Math.max(...kpis.map((k) => k.target_value));

    const data = kpis.map((kpi) => {
      const color =
        colorBy === 'semaforo'
          ? SEMAFORO_COLORS[kpi.status_semaforo]
          : getBSCColor(kpi.bsc_perspective);

      const size = 10 + (kpi.target_value / maxTarget) * 30;

      return {
        value: [xConfig.getValue(kpi), yConfig.getValue(kpi), zConfig.getValue(kpi)],
        name: kpi.name,
        itemStyle: { color, opacity: 0.8 },
        symbolSize: size,
      };
    });

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: { name: string; value: number[] }) => {
          return `<b>${params.name}</b><br/>${xConfig.label}: ${params.value[0]}<br/>${yConfig.label}: ${params.value[1]}<br/>${zConfig.label}: ${params.value[2]}`;
        },
      },
      xAxis3D: { name: xConfig.label, type: 'value' as const },
      yAxis3D: { name: yConfig.label, type: 'value' as const },
      zAxis3D: { name: zConfig.label, type: 'value' as const },
      grid3D: {
        viewControl: { autoRotate: false, distance: 200 },
        light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } },
      },
      series: [
        {
          type: 'scatter3D' as const,
          data,
          emphasis: {
            itemStyle: { borderColor: '#333', borderWidth: 1 },
          },
        },
      ],
    };
  }, [kpis, xAxis, yAxis, zAxis, colorBy]);

  if (kpis.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles para visualizar</p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Vista 3D de KPIs
      </h3>
      <ReactEChartsCore option={option} style={{ height: `${height}px`, width: '100%' }} />
    </Card>
  );
}
