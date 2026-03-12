/**
 * KPIGaugeAdvanced - Velocímetro Avanzado con Predicción y Animaciones
 * Gauge enterprise con múltiples capas de información
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as ss from 'simple-statistics';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus, Target, Clock, Zap } from 'lucide-react';
import type { EChartsOption } from 'echarts';

// ==================== TIPOS ====================

export interface KPIGaugeData {
  id: number;
  name: string;
  unit: string;
  currentValue: number;
  targetValue: number;
  minValue?: number;
  maxValue?: number;
  warningThreshold: number;
  criticalThreshold: number;
  trendType: 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO';
  historicalValues?: number[];
  projectedValue?: number;
  lastPeriodValue?: number;
}

export type GaugeVariant = 'default' | 'gradient' | 'multi-ring' | 'speedometer';

export interface KPIGaugeAdvancedProps {
  kpi: KPIGaugeData;
  variant?: GaugeVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPrediction?: boolean;
  showTrend?: boolean;
  showProgress?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

// ==================== CONFIGURACIÓN DE TAMAÑOS ====================

const SIZE_CONFIG = {
  sm: { height: 200, fontSize: 12, titleSize: 14 },
  md: { height: 280, fontSize: 14, titleSize: 16 },
  lg: { height: 360, fontSize: 16, titleSize: 18 },
  xl: { height: 450, fontSize: 18, titleSize: 20 },
};

// ==================== COLORES ====================

const COLORS = {
  verde: '#10b981',
  amarillo: '#eab308',
  rojo: '#ef4444',
  azul: '#3b82f6',
  gris: '#9ca3af',
  violeta: '#8b5cf6',
};

// ==================== HELPERS ====================

function calculateTrend(values: number[]): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
} {
  if (!values || values.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }

  const recent = values.slice(-5);
  const firstHalf = recent.slice(0, Math.ceil(recent.length / 2));
  const secondHalf = recent.slice(Math.ceil(recent.length / 2));

  const avgFirst = ss.mean(firstHalf);
  const avgSecond = ss.mean(secondHalf);

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

  if (Math.abs(changePercent) < 2) return { direction: 'stable', percentage: changePercent };
  return {
    direction: changePercent > 0 ? 'up' : 'down',
    percentage: changePercent,
  };
}

function getSemaforoColor(
  value: number,
  target: number,
  warning: number,
  critical: number,
  trendType: 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO'
): string {
  if (trendType === 'MAYOR_MEJOR') {
    if (value >= target) return COLORS.verde;
    if (value >= warning) return COLORS.amarillo;
    return COLORS.rojo;
  } else if (trendType === 'MENOR_MEJOR') {
    if (value <= target) return COLORS.verde;
    if (value <= warning) return COLORS.amarillo;
    return COLORS.rojo;
  } else {
    // EN_RANGO
    if (value >= warning && value <= critical) return COLORS.verde;
    return COLORS.amarillo;
  }
}

// ==================== COMPONENTE ====================

export function KPIGaugeAdvanced({
  kpi,
  variant = 'default',
  size = 'md',
  showPrediction = true,
  showTrend = true,
  showProgress = true,
  animated = true,
  className,
  onClick,
}: KPIGaugeAdvancedProps) {
  const sizeConfig = SIZE_CONFIG[size];

  // Análisis de datos
  const analysis = useMemo(() => {
    const {
      currentValue,
      targetValue,
      warningThreshold,
      criticalThreshold,
      trendType,
      historicalValues,
    } = kpi;

    // Calcular tendencia
    const trend = historicalValues
      ? calculateTrend(historicalValues)
      : { direction: 'stable' as const, percentage: 0 };

    // Determinar si la tendencia es positiva según el tipo de KPI
    const isTrendPositive =
      (trendType === 'MAYOR_MEJOR' && trend.direction === 'up') ||
      (trendType === 'MENOR_MEJOR' && trend.direction === 'down');

    // Color del semáforo
    const semaforoColor = getSemaforoColor(
      currentValue,
      targetValue,
      warningThreshold,
      criticalThreshold,
      trendType
    );

    // Progreso hacia la meta
    let progress = 0;
    if (trendType === 'MAYOR_MEJOR') {
      progress = Math.min((currentValue / targetValue) * 100, 100);
    } else if (trendType === 'MENOR_MEJOR') {
      progress = Math.min((targetValue / currentValue) * 100, 100);
    }

    // Estadísticas históricas
    const stats =
      historicalValues && historicalValues.length > 0
        ? {
            mean: ss.mean(historicalValues),
            stdDev: ss.standardDeviation(historicalValues),
            min: ss.min(historicalValues),
            max: ss.max(historicalValues),
          }
        : null;

    return {
      trend,
      isTrendPositive,
      semaforoColor,
      progress,
      stats,
    };
  }, [kpi]);

  // Configuración del gráfico
  const option = useMemo<EChartsOption>(() => {
    const {
      currentValue,
      targetValue,
      minValue = 0,
      maxValue,
      warningThreshold,
      criticalThreshold,
      unit,
      name,
      trendType,
      projectedValue,
    } = kpi;

    // Calcular max del gauge
    const gaugeMax =
      maxValue ?? Math.max(targetValue, currentValue, warningThreshold, criticalThreshold) * 1.3;

    // Colores de las zonas según tipo de tendencia
    let axisLineColors: [number, string][];
    if (trendType === 'MAYOR_MEJOR') {
      axisLineColors = [
        [criticalThreshold / gaugeMax, COLORS.rojo],
        [warningThreshold / gaugeMax, COLORS.amarillo],
        [1, COLORS.verde],
      ];
    } else if (trendType === 'MENOR_MEJOR') {
      axisLineColors = [
        [warningThreshold / gaugeMax, COLORS.verde],
        [criticalThreshold / gaugeMax, COLORS.amarillo],
        [1, COLORS.rojo],
      ];
    } else {
      // EN_RANGO
      axisLineColors = [
        [0.3, COLORS.amarillo],
        [0.7, COLORS.verde],
        [1, COLORS.amarillo],
      ];
    }

    const series: any[] = [
      // Gauge principal
      {
        type: 'gauge',
        radius: '85%',
        center: ['50%', '55%'],
        startAngle: 200,
        endAngle: -20,
        min: minValue,
        max: gaugeMax,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: variant === 'gradient' ? 20 : 15,
            color: axisLineColors,
          },
        },
        pointer: {
          icon: 'path://M2090.36389,615.30999 L2## Continúa abajo090.36389,615.30999 ...',
          length: '70%',
          width: 6,
          offsetCenter: [0, 0],
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 3,
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: sizeConfig.fontSize - 2,
          distance: 25,
          formatter: (value: number) => {
            if (value === gaugeMax || value === minValue || value === targetValue) {
              return value.toFixed(0);
            }
            return '';
          },
        },
        title: {
          offsetCenter: [0, '75%'],
          fontSize: sizeConfig.titleSize,
          color: '#374151',
          fontWeight: 600,
        },
        detail: {
          valueAnimation: animated,
          formatter: (value: number) => `${value.toFixed(1)}${unit}`,
          offsetCenter: [0, '45%'],
          fontSize: sizeConfig.fontSize + 8,
          fontWeight: 'bold',
          color: analysis.semaforoColor,
        },
        data: [
          {
            value: currentValue,
            name: name,
          },
        ],
        // Marca de la meta
        markPoint: {
          symbol: 'triangle',
          symbolSize: 12,
          itemStyle: { color: COLORS.azul },
          data: [
            {
              name: 'Meta',
              value: targetValue,
              xAxis: 0,
              yAxis: targetValue,
            },
          ],
        },
      },
    ];

    // Agregar anillo de proyección si está habilitado
    if (showPrediction && projectedValue !== undefined) {
      series.push({
        type: 'gauge',
        radius: '95%',
        center: ['50%', '55%'],
        startAngle: 200,
        endAngle: -20,
        min: minValue,
        max: gaugeMax,
        axisLine: {
          lineStyle: {
            width: 3,
            color: [
              [projectedValue / gaugeMax, COLORS.violeta],
              [1, 'transparent'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: { show: false },
      });
    }

    // Agregar anillo de progreso si está habilitado
    if (showProgress) {
      series.push({
        type: 'gauge',
        radius: '70%',
        center: ['50%', '55%'],
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [analysis.progress / 100, analysis.semaforoColor + '40'],
              [1, '#f3f4f6'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: { show: false },
      });
    }

    return {
      series,
      animation: animated,
      animationDuration: 2000,
      animationEasing: 'elasticOut',
    };
  }, [kpi, variant, sizeConfig, showPrediction, showProgress, animated, analysis]);

  const TrendIcon =
    analysis.trend.direction === 'up'
      ? TrendingUp
      : analysis.trend.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <Card
      className={cn('p-4 cursor-pointer transition-all hover:shadow-lg', className)}
      onClick={onClick}
    >
      {/* Header con badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: analysis.semaforoColor }}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
            {kpi.name}
          </span>
        </div>
        {showTrend && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              analysis.isTrendPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(analysis.trend.percentage).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ReactECharts option={option} style={{ height: sizeConfig.height }} notMerge lazyUpdate />

      {/* Footer con métricas adicionales */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Target className="w-3 h-3" />
          </div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">
            {kpi.targetValue.toFixed(1)}
          </p>
          <p className="text-[10px] text-gray-500">Meta</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
            <Zap className="w-3 h-3" />
          </div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">
            {analysis.progress.toFixed(0)}%
          </p>
          <p className="text-[10px] text-gray-500">Avance</p>
        </div>

        {kpi.projectedValue !== undefined && showPrediction && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
              <Clock className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium text-purple-600">{kpi.projectedValue.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">Proyección</p>
          </div>
        )}

        {kpi.lastPeriodValue !== undefined && !showPrediction && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Clock className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium text-gray-600">{kpi.lastPeriodValue.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500">Anterior</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default KPIGaugeAdvanced;
