/**
 * KPIScatter3D - Visualización 3D Científica con Plotly
 * Sistema de Gestión StrateKaz - Analytics Pro Edition
 */
import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import { Card, Spinner } from '@/components/common';
import { cn } from '@/lib/utils';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { SEMAFORO_COLORS, getBSCColor, formatValue } from '../../../types/kpi.types';

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
        DIARIO: 1,
        SEMANAL: 2,
        QUINCENAL: 3,
        MENSUAL: 4,
        BIMESTRAL: 5,
        TRIMESTRAL: 6,
        SEMESTRAL: 7,
        ANUAL: 8,
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
  const plotData = useMemo(() => {
    if (kpis.length === 0) return [];

    const xConfig = AXIS_CONFIG[xAxis];
    const yConfig = AXIS_CONFIG[yAxis];
    const zConfig = AXIS_CONFIG[zAxis];

    const data: Data = {
      type: 'scatter3d',
      mode: 'markers',
      x: kpis.map(xConfig.getValue),
      y: kpis.map(yConfig.getValue),
      z: kpis.map(zConfig.getValue),
      text: kpis.map((kpi) => kpi.name),
      hovertemplate:
        '<b>%{text}</b><br>' +
        `${xConfig.label}: %{x}<br>` +
        `${yConfig.label}: %{y}<br>` +
        `${zConfig.label}: %{z}<br>` +
        '<extra></extra>',
      marker: {
        size: kpis.map((kpi) => {
          // Tamaño según importancia (target_value normalizado)
          const maxTarget = Math.max(...kpis.map((k) => k.target_value));
          return 5 + (kpi.target_value / maxTarget) * 15;
        }),
        color: kpis.map((kpi) => {
          if (colorBy === 'semaforo') {
            return SEMAFORO_COLORS[kpi.status_semaforo];
          } else {
            return getBSCColor(kpi.bsc_perspective);
          }
        }),
        opacity: 0.8,
        line: {
          color: 'rgba(0, 0, 0, 0.2)',
          width: 1,
        },
      },
    };

    return [data];
  }, [kpis, xAxis, yAxis, zAxis, colorBy]);

  const layout = useMemo<Partial<Layout>>(() => {
    const xConfig = AXIS_CONFIG[xAxis];
    const yConfig = AXIS_CONFIG[yAxis];
    const zConfig = AXIS_CONFIG[zAxis];

    return {
      autosize: true,
      height,
      scene: {
        xaxis: { title: xConfig.label },
        yaxis: { title: yConfig.label },
        zaxis: { title: zConfig.label },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 },
        },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 0, r: 0, t: 30, b: 0 },
      title: {
        text: 'Vista 3D de KPIs',
        font: { size: 16 },
      },
    };
  }, [xAxis, yAxis, zAxis, height]);

  if (kpis.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles para visualizar</p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <Plot
        data={plotData}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </Card>
  );
}
