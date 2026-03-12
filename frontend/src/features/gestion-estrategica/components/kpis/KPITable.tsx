/**
 * Tabla de KPIs con acciones
 * Sistema de Gestión StrateKaz - Sprint 4
 */
import { Edit, BarChart3, Plus } from 'lucide-react';
import { Badge, Button } from '@/components/common';
import { DataTableCard } from '@/components/layout';
import type { KPIObjetivo } from '../../types/kpi.types';
import {
  FREQUENCY_CONFIG,
  TREND_TYPE_CONFIG,
  SEMAFORO_CONFIG,
  getProgressColor,
} from '../../types/kpi.types';

interface KPITableProps {
  kpis: KPIObjetivo[];
  onEdit?: (kpi: KPIObjetivo) => void;
  onAddMeasurement?: (kpi: KPIObjetivo) => void;
  onViewChart?: (kpi: KPIObjetivo) => void;
  isLoading?: boolean;
}

export function KPITable({
  kpis,
  onEdit,
  onAddMeasurement,
  onViewChart,
  isLoading,
}: KPITableProps) {
  if (isLoading) {
    return (
      <DataTableCard isLoading={isLoading}>
        <div className="h-64" />
      </DataTableCard>
    );
  }

  return (
    <DataTableCard isEmpty={kpis.length === 0} emptyMessage="No hay KPIs registrados">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                KPI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fórmula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Frecuencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Última Medición
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {kpis.map((kpi) => (
              <KPITableRow
                key={kpi.id}
                kpi={kpi}
                onEdit={onEdit}
                onAddMeasurement={onAddMeasurement}
                onViewChart={onViewChart}
              />
            ))}
          </tbody>
        </table>
      </div>
    </DataTableCard>
  );
}

// =============================================================================
// KPI TABLE ROW
// =============================================================================

interface KPITableRowProps {
  kpi: KPIObjetivo;
  onEdit?: (kpi: KPIObjetivo) => void;
  onAddMeasurement?: (kpi: KPIObjetivo) => void;
  onViewChart?: (kpi: KPIObjetivo) => void;
}

function KPITableRow({ kpi, onEdit, onAddMeasurement, onViewChart }: KPITableRowProps) {
  const semaforoConfig = SEMAFORO_CONFIG[kpi.status_semaforo];
  const frequencyConfig = FREQUENCY_CONFIG[kpi.frequency];
  const trendConfig = TREND_TYPE_CONFIG[kpi.trend_type];
  const progressColor = getProgressColor(kpi.status_semaforo);

  // Calcular progreso (0-100) — last_value/target_value son string (DecimalField)
  const progress =
    kpi.last_value != null
      ? calculateProgress(Number(kpi.last_value), Number(kpi.target_value), kpi.trend_type)
      : 0;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* Nombre + Semáforo */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${semaforoConfig.bgColor}`} />
          <div>
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{kpi.name}</div>
            {kpi.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                {kpi.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Fórmula */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
          <span className="line-clamp-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {kpi.formula || 'N/A'}
          </span>
        </div>
      </td>

      {/* Progreso */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              {kpi.last_value != null ? formatValue(Number(kpi.last_value), kpi.unit) : 'Sin datos'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              / {formatValue(Number(kpi.target_value), kpi.unit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${progressColor} transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {trendConfig.label}
          </Badge>
        </div>
      </td>

      {/* Frecuencia */}
      <td className="px-6 py-4">
        <Badge variant="outline" className="text-xs">
          {frequencyConfig.label}
        </Badge>
      </td>

      {/* Última Medición */}
      <td className="px-6 py-4">
        {kpi.last_measurement_date ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {new Date(kpi.last_measurement_date).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin mediciones</span>
        )}
      </td>

      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {onViewChart && (
            <Button variant="ghost" size="sm" onClick={() => onViewChart(kpi)} title="Ver gráfico">
              <BarChart3 className="h-4 w-4" />
            </Button>
          )}
          {onAddMeasurement && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddMeasurement(kpi)}
              title="Agregar medición"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(kpi)} title="Editar KPI">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateProgress(currentValue: number, targetValue: number, trendType: string): number {
  if (trendType === 'MAYOR_MEJOR') {
    return Math.min((currentValue / targetValue) * 100, 100);
  } else if (trendType === 'MENOR_MEJOR') {
    const ratio = targetValue / currentValue;
    return Math.min(ratio * 100, 100);
  }
  return 50; // EN_RANGO
}

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
