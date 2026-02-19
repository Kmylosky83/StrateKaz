/**
 * KPIHeatmapCalendar - Mapa de Calor Temporal tipo GitHub
 * Visualiza el desempeño de KPIs a lo largo del tiempo
 *
 * Sistema de Gestión StrateKaz - Analytics Enterprise Edition
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card } from '@/components/common';
import { cn } from '@/utils/cn';
import { format, parseISO, startOfYear, endOfYear, eachDayOfInterval, getDay, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EChartsOption } from 'echarts';

// ==================== TIPOS ====================

export interface DailyKPIValue {
  date: string; // ISO format: YYYY-MM-DD
  value: number;
  kpiId?: number;
  kpiName?: string;
}

export interface KPIHeatmapCalendarProps {
  data: DailyKPIValue[];
  year?: number;
  title?: string;
  colorScheme?: 'green' | 'blue' | 'purple' | 'semaforo';
  valueLabel?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  height?: number;
  showMonthLabels?: boolean;
  showDayLabels?: boolean;
  className?: string;
  onDayClick?: (date: string, value: number) => void;
}

// ==================== COLORES ====================

const COLOR_SCHEMES = {
  green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  blue: ['#ebedf0', '#9ecae1', '#6baed6', '#3182bd', '#08519c'],
  purple: ['#ebedf0', '#d8b4fe', '#a78bfa', '#8b5cf6', '#7c3aed'],
  semaforo: ['#ebedf0', '#fecaca', '#fde047', '#86efac', '#22c55e'],
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ==================== COMPONENTE ====================

export function KPIHeatmapCalendar({
  data,
  year = new Date().getFullYear(),
  title = 'Actividad Anual',
  colorScheme = 'green',
  valueLabel = 'Valor',
  unit = '',
  minValue,
  maxValue,
  height = 200,
  showMonthLabels = true,
  showDayLabels = true,
  className,
  onDayClick,
}: KPIHeatmapCalendarProps) {
  // Procesar datos para el heatmap
  const processedData = useMemo(() => {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Crear mapa de valores por fecha
    const valueMap = new Map<string, number>();
    data.forEach(item => {
      valueMap.set(item.date, item.value);
    });

    // Calcular min/max si no se proporcionan
    const values = data.map(d => d.value);
    const computedMin = minValue ?? (values.length > 0 ? Math.min(...values) : 0);
    const computedMax = maxValue ?? (values.length > 0 ? Math.max(...values) : 100);

    // Generar datos para ECharts Calendar
    const calendarData: [string, number][] = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const value = valueMap.get(dateStr) ?? 0;
      return [dateStr, value];
    });

    // Calcular estadísticas
    const daysWithData = data.length;
    const totalValue = values.reduce((sum, v) => sum + v, 0);
    const avgValue = daysWithData > 0 ? totalValue / daysWithData : 0;
    const maxDayValue = values.length > 0 ? Math.max(...values) : 0;

    return {
      calendarData,
      min: computedMin,
      max: computedMax,
      stats: {
        daysWithData,
        totalValue,
        avgValue,
        maxDayValue,
      },
    };
  }, [data, year, minValue, maxValue]);

  // Configuración del gráfico
  const option = useMemo<EChartsOption>(() => {
    const colors = COLOR_SCHEMES[colorScheme];

    return {
      title: {
        text: title,
        left: 'center',
        top: 0,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1f2937',
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          const date = params.data[0];
          const value = params.data[1];
          const formattedDate = format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es });

          return `
            <div style="padding: 8px; min-width: 160px;">
              <div style="font-weight: bold; margin-bottom: 6px; text-transform: capitalize;">
                ${formattedDate}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">${valueLabel}:</span>
                <strong style="color: ${value > 0 ? colors[4] : '#9ca3af'};">
                  ${value.toFixed(1)}${unit ? ` ${unit}` : ''}
                </strong>
              </div>
            </div>
          `;
        },
      },
      visualMap: {
        min: processedData.min,
        max: processedData.max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        itemWidth: 12,
        itemHeight: 80,
        inRange: {
          color: colors,
        },
        textStyle: {
          fontSize: 10,
          color: '#6b7280',
        },
      },
      calendar: {
        top: 60,
        left: showDayLabels ? 50 : 20,
        right: 20,
        cellSize: ['auto', 15],
        range: year.toString(),
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
        },
        yearLabel: { show: false },
        monthLabel: showMonthLabels
          ? {
              nameMap: MONTH_NAMES,
              fontSize: 11,
              color: '#6b7280',
            }
          : { show: false },
        dayLabel: showDayLabels
          ? {
              firstDay: 0,
              nameMap: DAY_NAMES,
              fontSize: 10,
              color: '#9ca3af',
            }
          : { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb',
            width: 1,
          },
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: processedData.calendarData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      ],
    };
  }, [processedData, year, title, colorScheme, valueLabel, unit, showMonthLabels, showDayLabels]);

  const handleChartClick = (params: any) => {
    if (onDayClick && params.data) {
      onDayClick(params.data[0], params.data[1]);
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.stats.daysWithData}
          </p>
          <p className="text-xs text-gray-500">Días con datos</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.stats.avgValue.toFixed(1)}
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
          <p className="text-xs text-gray-500">Promedio</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.stats.maxDayValue.toFixed(1)}
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
          <p className="text-xs text-gray-500">Máximo día</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {processedData.stats.totalValue.toFixed(0)}
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
          <p className="text-xs text-gray-500">Total acumulado</p>
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

      {/* Leyenda de colores */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <span>Menos</span>
        {COLOR_SCHEMES[colorScheme].map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>Más</span>
      </div>
    </Card>
  );
}

export default KPIHeatmapCalendar;
