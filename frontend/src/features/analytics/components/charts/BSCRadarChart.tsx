/**
 * BSCRadarChart - Radar Chart para Balanced Scorecard
 * Visualiza las 4 perspectivas BSC con valores actuales vs metas
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

// ==================== TIPOS ====================

export interface BSCPerspectiveData {
  perspective: 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';
  label: string;
  currentValue: number;
  targetValue: number;
  previousValue?: number;
  projectedValue?: number;
  kpiCount: number;
  kpisInGreen: number;
  kpisInYellow: number;
  kpisInRed: number;
}

export interface BSCRadarChartProps {
  data: BSCPerspectiveData[];
  title?: string;
  showProjection?: boolean;
  showPrevious?: boolean;
  showLegend?: boolean;
  height?: number;
  animated?: boolean;
  className?: string;
  onPerspectiveClick?: (perspective: string) => void;
}

// ==================== COLORES ====================

const BSC_COLORS = {
  FINANCIERA: '#10b981',
  CLIENTES: '#3b82f6',
  PROCESOS: '#f59e0b',
  APRENDIZAJE: '#8b5cf6',
};

const SERIES_COLORS = {
  current: '#3b82f6',
  target: '#10b981',
  previous: '#9ca3af',
  projected: '#8b5cf6',
};

// ==================== COMPONENTE ====================

export function BSCRadarChart({
  data,
  title = 'Balanced Scorecard',
  showProjection = false,
  showPrevious = false,
  showLegend = true,
  height = 500,
  animated = true,
  className,
  onPerspectiveClick,
}: BSCRadarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // Indicadores del radar (las 4 perspectivas)
    const indicators = data.map((d) => ({
      name: d.label,
      max: Math.max(d.targetValue * 1.2, d.currentValue * 1.2, 100),
      color: BSC_COLORS[d.perspective],
    }));

    // Series de datos
    const series: EChartsOption['series'] = [
      {
        name: 'Valor Actual',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: SERIES_COLORS.current,
        },
        itemStyle: {
          color: SERIES_COLORS.current,
        },
        areaStyle: {
          color: SERIES_COLORS.current,
          opacity: 0.2,
        },
        data: [
          {
            value: data.map((d) => d.currentValue),
            name: 'Valor Actual',
          },
        ],
        emphasis: {
          lineStyle: {
            width: 4,
          },
        },
      },
      {
        name: 'Meta',
        type: 'radar',
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: SERIES_COLORS.target,
        },
        itemStyle: {
          color: SERIES_COLORS.target,
        },
        data: [
          {
            value: data.map((d) => d.targetValue),
            name: 'Meta',
          },
        ],
      },
    ];

    // Agregar serie de período anterior si está habilitado
    if (showPrevious) {
      series.push({
        name: 'Período Anterior',
        type: 'radar',
        symbol: 'rect',
        symbolSize: 5,
        lineStyle: {
          width: 1,
          type: 'dotted',
          color: SERIES_COLORS.previous,
        },
        itemStyle: {
          color: SERIES_COLORS.previous,
        },
        data: [
          {
            value: data.map((d) => d.previousValue || 0),
            name: 'Período Anterior',
          },
        ],
      });
    }

    // Agregar serie de proyección si está habilitado
    if (showProjection) {
      series.push({
        name: 'Proyección',
        type: 'radar',
        symbol: 'triangle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: SERIES_COLORS.projected,
        },
        itemStyle: {
          color: SERIES_COLORS.projected,
        },
        areaStyle: {
          color: SERIES_COLORS.projected,
          opacity: 0.1,
        },
        data: [
          {
            value: data.map((d) => d.projectedValue || d.currentValue),
            name: 'Proyección',
          },
        ],
      });
    }

    return {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#1f2937',
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
        },
        formatter: (params: any) => {
          const dataIndex = params.dataIndex;
          const perspective = data[dataIndex];
          if (!perspective) return '';

          const healthScore =
            ((perspective.kpisInGreen / perspective.kpiCount) * 100).toFixed(0);

          return `
            <div style="padding: 12px; min-width: 200px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: ${BSC_COLORS[perspective.perspective]};">
                ${perspective.label}
              </div>
              <div style="display: grid; gap: 4px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Valor Actual:</span>
                  <strong>${perspective.currentValue.toFixed(1)}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Meta:</span>
                  <strong style="color: #10b981;">${perspective.targetValue.toFixed(1)}%</strong>
                </div>
                ${
                  perspective.previousValue
                    ? `<div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Anterior:</span>
                    <span>${perspective.previousValue.toFixed(1)}%</span>
                  </div>`
                    : ''
                }
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 6px 0;" />
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">KPIs:</span>
                  <span>${perspective.kpiCount}</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: #10b981;">●${perspective.kpisInGreen}</span>
                  <span style="color: #eab308;">●${perspective.kpisInYellow}</span>
                  <span style="color: #ef4444;">●${perspective.kpisInRed}</span>
                </div>
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e5e7eb;">
                  <span style="color: #6b7280;">Salud:</span>
                  <strong style="color: ${Number(healthScore) >= 70 ? '#10b981' : Number(healthScore) >= 50 ? '#eab308' : '#ef4444'};">
                    ${healthScore}%
                  </strong>
                </div>
              </div>
            </div>
          `;
        },
      },
      legend: showLegend
        ? {
            data: ['Valor Actual', 'Meta', ...(showPrevious ? ['Período Anterior'] : []), ...(showProjection ? ['Proyección'] : [])],
            bottom: 10,
            itemWidth: 14,
            itemHeight: 14,
            textStyle: {
              fontSize: 12,
              color: '#6b7280',
            },
          }
        : undefined,
      radar: {
        indicator: indicators,
        center: ['50%', '55%'],
        radius: '65%',
        startAngle: 90,
        splitNumber: 5,
        shape: 'polygon',
        axisName: {
          color: '#374151',
          fontSize: 13,
          fontWeight: 500,
          padding: [3, 5],
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.02)', 'rgba(59, 130, 246, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
      },
      series,
      animation: animated,
      animationDuration: 1000,
      animationEasing: 'elasticOut',
    };
  }, [data, title, showProjection, showPrevious, showLegend, animated]);

  const handleChartClick = (params: any) => {
    if (onPerspectiveClick && params.dataIndex !== undefined) {
      const perspective = data[params.dataIndex];
      if (perspective) {
        onPerspectiveClick(perspective.perspective);
      }
    }
  };

  // Calcular estadísticas globales
  const globalStats = useMemo(() => {
    const totalKPIs = data.reduce((sum, d) => sum + d.kpiCount, 0);
    const totalGreen = data.reduce((sum, d) => sum + d.kpisInGreen, 0);
    const avgCurrent = data.reduce((sum, d) => sum + d.currentValue, 0) / data.length;
    const avgTarget = data.reduce((sum, d) => sum + d.targetValue, 0) / data.length;
    const overallHealth = ((totalGreen / totalKPIs) * 100).toFixed(0);

    return { totalKPIs, totalGreen, avgCurrent, avgTarget, overallHealth };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos de perspectivas BSC disponibles
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{globalStats.avgCurrent.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Promedio Actual</p>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{globalStats.avgTarget.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Meta Promedio</p>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{globalStats.totalKPIs}</p>
          <p className="text-xs text-gray-500">Total KPIs</p>
        </div>
        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-2xl font-bold text-emerald-600">{globalStats.overallHealth}%</p>
          <p className="text-xs text-gray-500">Salud Global</p>
        </div>
      </div>

      {/* Chart */}
      <ReactECharts
        option={option}
        style={{ height }}
        onEvents={{
          click: handleChartClick,
        }}
        notMerge
        lazyUpdate
      />

      {/* Perspective Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {data.map((perspective) => {
          const progress = (perspective.currentValue / perspective.targetValue) * 100;
          const isOnTrack = progress >= 90;

          return (
            <div
              key={perspective.perspective}
              className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: BSC_COLORS[perspective.perspective] + '40' }}
              onClick={() => onPerspectiveClick?.(perspective.perspective)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BSC_COLORS[perspective.perspective] }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {perspective.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span
                  className="text-xl font-bold"
                  style={{ color: BSC_COLORS[perspective.perspective] }}
                >
                  {perspective.currentValue.toFixed(1)}%
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isOnTrack
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {isOnTrack ? 'En meta' : `${progress.toFixed(0)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default BSCRadarChart;
