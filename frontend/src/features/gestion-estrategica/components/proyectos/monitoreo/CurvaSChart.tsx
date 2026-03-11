/**
 * Curva S — Gráfico EVM (PV, EV, AC)
 * Usa ECharts (ya instalado en el proyecto)
 * DS: Card
 */
import { useMemo } from 'react';
import { Card } from '@/components/common';
import ReactECharts from 'echarts-for-react';
import { useCurvaS } from '../../../hooks/useProyectos';

interface CurvaSChartProps {
  proyectoId: number;
}

export const CurvaSChart = ({ proyectoId }: CurvaSChartProps) => {
  const { data: curvaData, isLoading } = useCurvaS(proyectoId);

  const points = useMemo(() => curvaData ?? [], [curvaData]);

  const option = useMemo(() => {
    if (points.length === 0) return {};

    const fechas = points.map((p) =>
      new Date(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    );

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['PV (Planificado)', 'EV (Ganado)', 'AC (Costo Real)'],
        bottom: 0,
        textStyle: { fontSize: 11 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: fechas,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          formatter: (val: number) =>
            val >= 1000000
              ? `$${(val / 1000000).toFixed(1)}M`
              : val >= 1000
                ? `$${(val / 1000).toFixed(0)}K`
                : `$${val}`,
        },
      },
      series: [
        {
          name: 'PV (Planificado)',
          type: 'line',
          data: points.map((p) => p.valor_planificado),
          smooth: true,
          lineStyle: { width: 2, color: '#6B7280' },
          itemStyle: { color: '#6B7280' },
        },
        {
          name: 'EV (Ganado)',
          type: 'line',
          data: points.map((p) => p.valor_ganado),
          smooth: true,
          lineStyle: { width: 2, color: '#3B82F6' },
          itemStyle: { color: '#3B82F6' },
          areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
        },
        {
          name: 'AC (Costo Real)',
          type: 'line',
          data: points.map((p) => p.costo_actual),
          smooth: true,
          lineStyle: { width: 2, color: '#EF4444', type: 'dashed' },
          itemStyle: { color: '#EF4444' },
        },
      ],
    };
  }, [points]);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 animate-pulse-subtle">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  if (points.length < 2) return null;

  return (
    <Card>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Curva S — Valor Ganado (EVM)
        </h4>
        <ReactECharts option={option} style={{ height: 280 }} />
      </div>
    </Card>
  );
};
