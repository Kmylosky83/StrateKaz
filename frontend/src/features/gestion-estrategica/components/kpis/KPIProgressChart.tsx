/**
 * Gráfico de Progreso de KPI con Recharts
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/common';
import type { KPIObjetivo, MedicionKPI } from '../../types/kpi.types';

interface KPIProgressChartProps {
  kpi: KPIObjetivo;
  measurements: MedicionKPI[];
}

export function KPIProgressChart({ kpi, measurements }: KPIProgressChartProps) {
  // Preparar datos para Recharts
  const chartData = measurements
    .slice()
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
    .map((m) => ({
      period: new Date(m.period).toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric',
      }),
      fullDate: m.period,
      value: m.value,
      target: kpi.target_value,
      warning: kpi.warning_threshold,
      critical: kpi.critical_threshold,
      notes: m.notes,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No hay mediciones para mostrar
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {kpi.name}
        </h3>
        {kpi.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {kpi.description}
          </p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis
            dataKey="period"
            className="text-sm"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-sm"
            tick={{ fill: 'currentColor' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip unit={kpi.unit} />} />
          <Legend />

          {/* Línea de valor real */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Valor Real"
          />

          {/* Línea de meta */}
          <ReferenceLine
            y={kpi.target_value}
            stroke="#10b981"
            strokeDasharray="5 5"
            label={{ value: 'Meta', position: 'right', fill: '#10b981' }}
          />

          {/* Línea de alerta */}
          {kpi.warning_threshold && (
            <ReferenceLine
              y={kpi.warning_threshold}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Alerta', position: 'right', fill: '#f59e0b' }}
            />
          )}

          {/* Línea crítica */}
          {kpi.critical_threshold && (
            <ReferenceLine
              y={kpi.critical_threshold}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Crítico', position: 'right', fill: '#ef4444' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Leyenda personalizada */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-300">Valor Real</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2 border-green-500" />
          <span className="text-gray-600 dark:text-gray-300">
            Meta: {formatValue(kpi.target_value, kpi.unit)}
          </span>
        </div>
        {kpi.warning_threshold && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-500 border-dashed border-t-2 border-yellow-500" />
            <span className="text-gray-600 dark:text-gray-300">
              Alerta: {formatValue(kpi.warning_threshold, kpi.unit)}
            </span>
          </div>
        )}
        {kpi.critical_threshold && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500" />
            <span className="text-gray-600 dark:text-gray-300">
              Crítico: {formatValue(kpi.critical_threshold, kpi.unit)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: {
      fullDate: string;
      notes?: string;
    };
  }>;
  label?: string;
  unit: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
        {new Date(data.fullDate).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">Valor:</span> {formatValue(payload[0].value, unit)}
      </p>
      {data.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
          <span className="font-medium">Nota:</span> {data.notes}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatValue(value: number, unit: string): string {
  const formattedNumber = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  if (unit === '$' || unit === 'USD') {
    return `${unit} ${formattedNumber}`;
  }

  if (unit === '%') {
    return `${formattedNumber}${unit}`;
  }

  return `${formattedNumber} ${unit}`;
}
