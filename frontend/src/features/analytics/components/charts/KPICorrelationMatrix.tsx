/**
 * KPICorrelationMatrix - Matriz de Correlaciones entre KPIs
 * Visualiza relaciones estadísticas entre indicadores
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as ss from 'simple-statistics';
import { Card, Badge } from '@/components/common';
import { cn } from '@/utils/cn';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import { CHART_AXIS_COLORS } from '@/constants/chart-colors';

// ==================== TIPOS ====================

export interface KPIDataSeries {
  id: number;
  name: string;
  shortName?: string;
  perspective?: string;
  values: number[];
}

export interface CorrelationResult {
  kpi1Id: number;
  kpi2Id: number;
  kpi1Name: string;
  kpi2Name: string;
  correlation: number;
  pValue?: number;
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
}

export interface KPICorrelationMatrixProps {
  kpis: KPIDataSeries[];
  title?: string;
  showValues?: boolean;
  threshold?: number;
  height?: number;
  className?: string;
  onCellClick?: (correlation: CorrelationResult) => void;
}

// ==================== HELPERS ====================

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  try {
    const correlation = ss.sampleCorrelation(x, y);
    return isNaN(correlation) ? 0 : correlation;
  } catch {
    return 0;
  }
}

function getCorrelationStrength(r: number): CorrelationResult['strength'] {
  const absR = Math.abs(r);
  if (absR >= 0.9) return 'very_strong';
  if (absR >= 0.7) return 'strong';
  if (absR >= 0.4) return 'moderate';
  if (absR >= 0.2) return 'weak';
  return 'none';
}

function getCorrelationDirection(r: number): CorrelationResult['direction'] {
  if (r > 0.1) return 'positive';
  if (r < -0.1) return 'negative';
  return 'none';
}

// Correlation color scale: negative (red shades) → neutral → positive (blue shades)
const CORRELATION_SCALE_NEGATIVE = ['#991B1B', '#DC2626', '#F87171', '#FCA5A5', '#FEE2E2'];
const CORRELATION_SCALE_POSITIVE = ['#DBEAFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1E40AF'];
const CORRELATION_NEUTRAL = '#F3F4F6';

function _getCorrelationColor(r: number): string {
  const absR = Math.abs(r);
  if (r > 0) {
    // Correlación positiva (azules)
    if (absR >= 0.8) return CORRELATION_SCALE_POSITIVE[4];
    if (absR >= 0.6) return CORRELATION_SCALE_POSITIVE[3];
    if (absR >= 0.4) return CORRELATION_SCALE_POSITIVE[2];
    if (absR >= 0.2) return CORRELATION_SCALE_POSITIVE[1];
    return CORRELATION_SCALE_POSITIVE[0];
  } else if (r < 0) {
    // Correlación negativa (rojos)
    if (absR >= 0.8) return CORRELATION_SCALE_NEGATIVE[0];
    if (absR >= 0.6) return CORRELATION_SCALE_NEGATIVE[1];
    if (absR >= 0.4) return CORRELATION_SCALE_NEGATIVE[2];
    if (absR >= 0.2) return CORRELATION_SCALE_NEGATIVE[3];
    return CORRELATION_SCALE_NEGATIVE[4];
  }
  return CORRELATION_NEUTRAL;
}

// ==================== COMPONENTE ====================

export function KPICorrelationMatrix({
  kpis,
  title = 'Matriz de Correlaciones',
  showValues = true,
  threshold = 0,
  height = 500,
  className,
  onCellClick,
}: KPICorrelationMatrixProps) {
  const [_selectedCell, setSelectedCell] = useState<CorrelationResult | null>(null);

  // Calcular matriz de correlaciones
  const { matrix, correlations, stats } = useMemo(() => {
    const n = kpis.length;
    const matrix: number[][] = [];
    const correlations: CorrelationResult[] = [];

    // Calcular todas las correlaciones
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1; // Diagonal = 1
        } else if (j < i) {
          matrix[i][j] = matrix[j][i]; // Simétrica
        } else {
          const r = calculateCorrelation(kpis[i].values, kpis[j].values);
          matrix[i][j] = r;

          // Solo guardar correlaciones significativas
          if (Math.abs(r) >= threshold) {
            correlations.push({
              kpi1Id: kpis[i].id,
              kpi2Id: kpis[j].id,
              kpi1Name: kpis[i].name,
              kpi2Name: kpis[j].name,
              correlation: r,
              strength: getCorrelationStrength(r),
              direction: getCorrelationDirection(r),
            });
          }
        }
      }
    }

    // Ordenar correlaciones por fuerza
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    // Estadísticas
    const allCorrelations = correlations.map((c) => c.correlation);
    const positiveCount = correlations.filter((c) => c.direction === 'positive').length;
    const negativeCount = correlations.filter((c) => c.direction === 'negative').length;
    const strongCount = correlations.filter(
      (c) => c.strength === 'strong' || c.strength === 'very_strong'
    ).length;

    return {
      matrix,
      correlations,
      stats: {
        total: correlations.length,
        positive: positiveCount,
        negative: negativeCount,
        strong: strongCount,
        avgCorrelation: allCorrelations.length > 0 ? ss.mean(allCorrelations.map(Math.abs)) : 0,
      },
    };
  }, [kpis, threshold]);

  // Preparar datos para ECharts
  const option = useMemo<EChartsOption>(() => {
    const labels = kpis.map((k) => k.shortName || k.name.substring(0, 15));

    // Datos del heatmap
    const heatmapData: [number, number, number][] = [];
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        heatmapData.push([j, i, matrix[i][j]]);
      }
    }

    return {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: CHART_AXIS_COLORS.title,
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_AXIS_COLORS.tooltip.bg,
        borderColor: CHART_AXIS_COLORS.tooltip.border,
        borderWidth: 1,
        textStyle: { color: CHART_AXIS_COLORS.tooltip.text },
        formatter: (params: any) => {
          const [x, y, value] = params.data;
          const kpi1 = kpis[y];
          const kpi2 = kpis[x];
          const strength = getCorrelationStrength(value);
          const direction = getCorrelationDirection(value);

          const strengthLabels = {
            very_strong: 'Muy fuerte',
            strong: 'Fuerte',
            moderate: 'Moderada',
            weak: 'Débil',
            none: 'Sin relación',
          };

          const directionLabels = {
            positive: 'Positiva',
            negative: 'Negativa',
            none: 'Neutra',
          };

          return `
            <div style="padding: 10px; min-width: 220px;">
              <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">
                Correlación
              </div>
              <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;">
                <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">KPI 1:</div>
                <div style="font-weight: 500;">${kpi1.name}</div>
              </div>
              <div style="margin-bottom: 8px;">
                <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">KPI 2:</div>
                <div style="font-weight: 500;">${kpi2.name}</div>
              </div>
              <div style="display: grid; gap: 4px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Coeficiente (r):</span>
                  <strong style="color: ${value >= 0 ? '#3b82f6' : '#ef4444'};">
                    ${value.toFixed(3)}
                  </strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">R²:</span>
                  <strong>${(value * value * 100).toFixed(1)}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Fuerza:</span>
                  <span>${strengthLabels[strength]}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Dirección:</span>
                  <span>${directionLabels[direction]}</span>
                </div>
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: '20%',
        right: '10%',
        top: '15%',
        bottom: '20%',
      },
      xAxis: {
        type: 'category',
        data: labels,
        splitArea: { show: true },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          color: CHART_AXIS_COLORS.axisLabel,
          interval: 0,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        splitArea: { show: true },
        axisLabel: {
          fontSize: 10,
          color: CHART_AXIS_COLORS.axisLabel,
          interval: 0,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemHeight: 200,
        inRange: {
          color: [
            ...CORRELATION_SCALE_NEGATIVE,
            CORRELATION_NEUTRAL,
            ...CORRELATION_SCALE_POSITIVE,
          ],
        },
        textStyle: {
          fontSize: 10,
          color: CHART_AXIS_COLORS.axisLabel,
        },
      },
      series: [
        {
          name: 'Correlación',
          type: 'heatmap',
          data: heatmapData,
          label: showValues
            ? {
                show: true,
                formatter: (params: any) => {
                  const value = params.data[2];
                  if (params.data[0] === params.data[1]) return '1';
                  return value.toFixed(2);
                },
                fontSize: 9,
                color: '#374151',
              }
            : { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
    };
  }, [kpis, matrix, title, showValues]);

  const handleChartClick = (params: any) => {
    if (params.data) {
      const [x, y, value] = params.data;
      if (x !== y) {
        const correlation: CorrelationResult = {
          kpi1Id: kpis[y].id,
          kpi2Id: kpis[x].id,
          kpi1Name: kpis[y].name,
          kpi2Name: kpis[x].name,
          correlation: value,
          strength: getCorrelationStrength(value),
          direction: getCorrelationDirection(value),
        };
        setSelectedCell(correlation);
        onCellClick?.(correlation);
      }
    }
  };

  if (kpis.length < 2) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Se necesitan al menos 2 KPIs para calcular correlaciones
        </p>
      </Card>
    );
  }

  // Top correlaciones
  const topCorrelations = correlations.slice(0, 5);

  return (
    <Card className={cn('p-6', className)}>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Pares analizados</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-blue-600">{stats.positive}</p>
          <p className="text-xs text-gray-500">Positivas</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-red-600">{stats.negative}</p>
          <p className="text-xs text-gray-500">Negativas</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-purple-600">{stats.strong}</p>
          <p className="text-xs text-gray-500">Fuertes (|r|≥0.7)</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <p className="text-xl font-bold text-green-600">
            {(stats.avgCorrelation * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Fuerza promedio</p>
        </div>
      </div>

      {/* Chart */}
      <ReactECharts
        option={option}
        style={{ height }}
        onEvents={{ click: handleChartClick }}
        notMerge
        lazyUpdate
      />

      {/* Top Correlaciones */}
      {topCorrelations.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Correlaciones más fuertes
          </h4>
          <div className="space-y-2">
            {topCorrelations.map((corr, i) => (
              <div
                key={`${corr.kpi1Id}-${corr.kpi2Id}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCell(corr);
                  onCellClick?.(corr);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {corr.kpi1Name}
                    </p>
                    <p className="text-xs text-gray-500">↔ {corr.kpi2Name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {corr.direction === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  ) : corr.direction === 'negative' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <Badge
                    variant={
                      corr.strength === 'very_strong' || corr.strength === 'strong'
                        ? corr.direction === 'positive'
                          ? 'info'
                          : 'danger'
                        : 'default'
                    }
                    size="sm"
                  >
                    r = {corr.correlation.toFixed(3)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda de interpretación */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Interpretación:</strong> El coeficiente de correlación (r) varía de -1 a +1.
            Valores cercanos a +1 indican relación positiva fuerte (cuando uno sube, el otro
            también). Valores cercanos a -1 indican relación negativa fuerte (cuando uno sube, el
            otro baja). Valores cercanos a 0 indican poca o ninguna relación lineal.
          </div>
        </div>
      </div>
    </Card>
  );
}

export default KPICorrelationMatrix;
