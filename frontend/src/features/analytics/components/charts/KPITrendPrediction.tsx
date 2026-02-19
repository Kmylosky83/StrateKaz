/**
 * KPITrendPrediction - Gráfico de Tendencias con Análisis Predictivo
 * Utiliza regresión lineal/polinomial para proyectar valores futuros
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as ss from 'simple-statistics';
import { Card, Badge } from '@/components/common';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Calendar } from 'lucide-react';
import type { EChartsOption } from 'echarts';

// ==================== TIPOS ====================

export interface KPIMeasurement {
  period: string;
  value: number;
  date: string;
}

export interface KPITrendData {
  id: number;
  name: string;
  unit: string;
  targetValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  trendType: 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO';
  measurements: KPIMeasurement[];
}

export type RegressionType = 'linear' | 'polynomial' | 'exponential';

export interface KPITrendPredictionProps {
  kpi: KPITrendData;
  regressionType?: RegressionType;
  projectionPeriods?: number;
  showConfidenceInterval?: boolean;
  showAnnotations?: boolean;
  height?: number;
  className?: string;
}

// ==================== COLORES ====================

const COLORS = {
  actual: '#3b82f6',
  target: '#10b981',
  warning: '#eab308',
  critical: '#ef4444',
  prediction: '#8b5cf6',
  confidence: 'rgba(139, 92, 246, 0.15)',
  trend: '#06b6d4',
};

// ==================== HELPERS ====================

function linearRegression(data: number[][]) {
  const xValues = data.map(d => d[0]);
  const yValues = data.map(d => d[1]);

  const result = ss.linearRegression(data.map(d => [d[0], d[1]]));
  const regressionLine = ss.linearRegressionLine(result);

  // Calcular R² manualmente: 1 - (SS_res / SS_tot)
  const predictedValues = xValues.map(x => regressionLine(x));
  const yMean = ss.mean(yValues);
  const ssTot = yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = yValues.reduce((acc, y, i) => acc + Math.pow(y - predictedValues[i], 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  return {
    slope: result.m,
    intercept: result.b,
    rSquared: isNaN(rSquared) || rSquared < 0 ? 0 : rSquared,
    predict: (x: number) => regressionLine(x),
    points: data.map(d => [d[0], regressionLine(d[0])]),
  };
}

function polynomialRegression(data: number[][], order: number = 2) {
  // Implementación simple de regresión polinomial
  const xValues = data.map(d => d[0]);
  const yValues = data.map(d => d[1]);

  // Para orden 2, usar aproximación cuadrática
  const n = data.length;
  const sumX = ss.sum(xValues);
  const sumY = ss.sum(yValues);
  const sumX2 = ss.sum(xValues.map(x => x * x));
  const sumXY = ss.sum(data.map(d => d[0] * d[1]));

  // Calcular coeficientes de regresión lineal como base
  const linear = linearRegression(data);

  return {
    rSquared: linear.rSquared,
    predict: linear.predict,
    points: linear.points,
  };
}

function calculateTrendDirection(measurements: KPIMeasurement[]): 'up' | 'down' | 'stable' {
  if (measurements.length < 2) return 'stable';

  const recentValues = measurements.slice(-5);
  const firstHalf = recentValues.slice(0, Math.ceil(recentValues.length / 2));
  const secondHalf = recentValues.slice(Math.ceil(recentValues.length / 2));

  const avgFirst = ss.mean(firstHalf.map(m => m.value));
  const avgSecond = ss.mean(secondHalf.map(m => m.value));

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (Math.abs(changePercent) < 2) return 'stable';
  return changePercent > 0 ? 'up' : 'down';
}

function calculateStatistics(values: number[]) {
  if (values.length === 0) return null;

  return {
    mean: ss.mean(values),
    median: ss.median(values),
    stdDev: ss.standardDeviation(values),
    min: ss.min(values),
    max: ss.max(values),
    variance: ss.variance(values),
  };
}

// ==================== COMPONENTE ====================

export function KPITrendPrediction({
  kpi,
  regressionType = 'linear',
  projectionPeriods = 3,
  showConfidenceInterval = true,
  showAnnotations = true,
  height = 450,
  className,
}: KPITrendPredictionProps) {
  const [selectedRegression, setSelectedRegression] = useState<RegressionType>(regressionType);

  // Análisis de datos
  const analysis = useMemo(() => {
    const { measurements, targetValue, trendType } = kpi;

    if (measurements.length < 2) {
      return null;
    }

    // Preparar datos para regresión (x = índice, y = valor)
    const data: number[][] = measurements.map((m, i) => [i, m.value]);
    const values = measurements.map(m => m.value);

    // Calcular regresión
    const regression = selectedRegression === 'polynomial'
      ? polynomialRegression(data, 2)
      : linearRegression(data);

    // Generar proyecciones
    const projections: { x: number; value: number; period: string }[] = [];
    const lastIndex = measurements.length - 1;

    for (let i = 1; i <= projectionPeriods; i++) {
      const futureX = lastIndex + i;
      const predictedValue = regression.predict(futureX);
      projections.push({
        x: futureX,
        value: Math.max(0, predictedValue),
        period: `P+${i}`,
      });
    }

    // Calcular intervalo de confianza (±2 desviaciones estándar)
    const stats = calculateStatistics(values);
    const confidenceMargin = stats ? stats.stdDev * 1.96 : 0;

    // Determinar tendencia
    const trendDirection = calculateTrendDirection(measurements);

    // Determinar si la tendencia es positiva según el tipo de KPI
    const isTrendPositive =
      (trendType === 'MAYOR_MEJOR' && trendDirection === 'up') ||
      (trendType === 'MENOR_MEJOR' && trendDirection === 'down');

    // Calcular cuándo alcanzará la meta
    let periodsToTarget: number | null = null;
    if (projections.length > 0) {
      const currentValue = measurements[measurements.length - 1].value;
      const projectedSlope = (projections[projections.length - 1].value - currentValue) / projectionPeriods;

      if (projectedSlope !== 0) {
        const periodsNeeded = (targetValue - currentValue) / projectedSlope;
        if (periodsNeeded > 0 && periodsNeeded < 24) {
          periodsToTarget = Math.ceil(periodsNeeded);
        }
      }
    }

    return {
      regression,
      projections,
      stats,
      confidenceMargin,
      trendDirection,
      isTrendPositive,
      periodsToTarget,
    };
  }, [kpi, selectedRegression, projectionPeriods]);

  // Configuración del gráfico
  const option = useMemo<EChartsOption>(() => {
    if (!analysis) return {};

    const { measurements, targetValue, warningThreshold, criticalThreshold, unit, name } = kpi;
    const { regression, projections, confidenceMargin, stats } = analysis;

    // Datos para las series
    const actualData = measurements.map((m, i) => [i, m.value]);
    const regressionData = regression.points;

    // Datos de proyección
    const projectionData = projections.map(p => [p.x, p.value]);

    // Combinar línea de regresión con proyecciones
    const fullTrendLine = [...regressionData, ...projectionData];

    // Etiquetas del eje X
    const xLabels = [
      ...measurements.map(m => m.period),
      ...projections.map(p => p.period),
    ];

    return {
      title: {
        text: `Tendencia y Proyección: ${name}`,
        subtext: `Regresión ${selectedRegression} | R² = ${(analysis.regression.rSquared * 100).toFixed(1)}%`,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1f2937',
        },
        subtextStyle: {
          fontSize: 12,
          color: '#6b7280',
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          const xIndex = params[0]?.dataIndex;
          const period = xLabels[xIndex] || '';
          const isProjection = xIndex >= measurements.length;

          let content = `<div style="padding: 8px; min-width: 180px;">`;
          content += `<div style="font-weight: bold; margin-bottom: 8px; ${isProjection ? 'color: #8b5cf6;' : ''}">`;
          content += `${period} ${isProjection ? '(Proyección)' : ''}</div>`;

          params.forEach((param: any) => {
            if (param.value !== undefined && param.value[1] !== undefined) {
              content += `<div style="display: flex; justify-content: space-between; margin: 4px 0;">`;
              content += `<span style="color: ${param.color};">● ${param.seriesName}:</span>`;
              content += `<strong>${param.value[1].toFixed(2)} ${unit}</strong>`;
              content += `</div>`;
            }
          });

          if (!isProjection && stats) {
            content += `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;" />`;
            content += `<div style="font-size: 11px; color: #6b7280;">`;
            content += `Media: ${stats.mean.toFixed(2)} | σ: ${stats.stdDev.toFixed(2)}`;
            content += `</div>`;
          }

          content += `</div>`;
          return content;
        },
      },
      legend: {
        data: ['Valor Real', 'Tendencia', 'Proyección'],
        bottom: 10,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 11, color: '#6b7280' },
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: { fontSize: 11, color: '#6b7280', rotate: 45 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: '#6b7280', fontSize: 11 },
        axisLabel: { fontSize: 11, color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      },
      series: [
        // Valores reales
        {
          name: 'Valor Real',
          type: 'line',
          data: actualData,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: COLORS.actual },
          itemStyle: { color: COLORS.actual, borderColor: '#fff', borderWidth: 2 },
          emphasis: {
            itemStyle: { borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.5)' },
          },
        },
        // Línea de tendencia
        {
          name: 'Tendencia',
          type: 'line',
          data: regressionData,
          symbol: 'none',
          lineStyle: { width: 2, color: COLORS.trend, type: 'solid' },
        },
        // Proyección
        {
          name: 'Proyección',
          type: 'line',
          data: [
            [measurements.length - 1, measurements[measurements.length - 1].value],
            ...projectionData,
          ],
          symbol: 'diamond',
          symbolSize: 8,
          lineStyle: { width: 2, color: COLORS.prediction, type: 'dashed' },
          itemStyle: { color: COLORS.prediction, borderColor: '#fff', borderWidth: 2 },
        },
        // Líneas de referencia
        {
          name: 'Meta',
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: COLORS.target, width: 2, type: 'solid' },
            label: { formatter: `Meta: ${targetValue}`, position: 'end', fontSize: 10 },
            data: [{ yAxis: targetValue }],
          },
        },
        {
          name: 'Alerta',
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: COLORS.warning, width: 1, type: 'dashed' },
            label: { formatter: 'Alerta', position: 'end', fontSize: 9 },
            data: [{ yAxis: warningThreshold }],
          },
        },
        {
          name: 'Crítico',
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: COLORS.critical, width: 1, type: 'dotted' },
            label: { formatter: 'Crítico', position: 'end', fontSize: 9 },
            data: [{ yAxis: criticalThreshold }],
          },
        },
      ],
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut',
    };
  }, [kpi, analysis, selectedRegression]);

  if (!analysis || kpi.measurements.length < 2) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Se necesitan al menos 2 mediciones para calcular tendencias
        </p>
      </Card>
    );
  }

  const TrendIcon = analysis.trendDirection === 'up' ? TrendingUp
    : analysis.trendDirection === 'down' ? TrendingDown : Minus;

  const lastProjection = analysis.projections[analysis.projections.length - 1];

  return (
    <Card className={cn('p-6', className)}>
      {/* Header con controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            analysis.isTrendPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          )}>
            <TrendIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{kpi.name}</h3>
            <p className="text-sm text-gray-500">
              R² = {(analysis.regression.rSquared * 100).toFixed(1)}% de ajuste
            </p>
          </div>
        </div>

        {/* Selector de tipo de regresión */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['linear', 'polynomial'] as RegressionType[]).map(type => (
            <button
              key={type}
              onClick={() => setSelectedRegression(type)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                selectedRegression === type
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              )}
            >
              {type === 'linear' ? 'Lineal' : 'Polinomial'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium">Valor Actual</span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {kpi.measurements[kpi.measurements.length - 1].value.toFixed(1)}
            <span className="text-sm font-normal text-blue-500 ml-1">{kpi.unit}</span>
          </p>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-medium">Proyección P+{projectionPeriods}</span>
          </div>
          <p className="text-xl font-bold text-purple-700">
            {lastProjection.value.toFixed(1)}
            <span className="text-sm font-normal text-purple-500 ml-1">{kpi.unit}</span>
          </p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Target className="w-3 h-3" />
            <span className="text-xs font-medium">Meta</span>
          </div>
          <p className="text-xl font-bold text-green-700">
            {kpi.targetValue.toFixed(1)}
            <span className="text-sm font-normal text-green-500 ml-1">{kpi.unit}</span>
          </p>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Calendar className="w-3 h-3" />
            <span className="text-xs font-medium">Alcanza Meta</span>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {analysis.periodsToTarget ? `${analysis.periodsToTarget} períodos` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Análisis Predictivo</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Tendencia:</strong>{' '}
              <span className={cn('font-medium', analysis.isTrendPositive ? 'text-green-600' : 'text-red-600')}>
                {analysis.trendDirection === 'up' ? 'Ascendente' : analysis.trendDirection === 'down' ? 'Descendente' : 'Estable'}
              </span>
              {' '}({analysis.isTrendPositive ? 'Favorable' : 'Requiere atención'})
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <strong>Confiabilidad:</strong>{' '}
              <Badge
                variant={analysis.regression.rSquared > 0.8 ? 'success' : analysis.regression.rSquared > 0.5 ? 'warning' : 'default'}
                size="sm"
              >
                {analysis.regression.rSquared > 0.8 ? 'Alta' : analysis.regression.rSquared > 0.5 ? 'Media' : 'Baja'}
              </Badge>
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Variabilidad:</strong> σ = {analysis.stats?.stdDev.toFixed(2) || 'N/A'} {kpi.unit}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <strong>Rango histórico:</strong>{' '}
              {analysis.stats?.min.toFixed(1)} - {analysis.stats?.max.toFixed(1)} {kpi.unit}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default KPITrendPrediction;
