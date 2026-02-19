/**
 * KPIMetricCards - Cards de KPIs con componentes propios
 * Sistema de Gestion StrateKaz - Analytics Pro
 */
import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import type { KPIObjetivo } from '../../../types/kpi.types';
import { formatValue, calculateDelta, isDeltaPositive, SEMAFORO_COLORS } from '../../../types/kpi.types';

export interface KPIMetricCardsProps {
  kpis: KPIObjetivo[];
  layout?: 'grid' | 'list';
  showSparkline?: boolean;
  showDelta?: boolean;
  onCardClick?: (kpi: KPIObjetivo) => void;
  className?: string;
}

export function KPIMetricCards({
  kpis,
  layout = 'grid',
  showSparkline = false,
  showDelta = true,
  onCardClick,
  className,
}: KPIMetricCardsProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay KPIs disponibles</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'flex flex-col gap-4',
        className
      )}
    >
      {kpis.map((kpi) => (
        <KPIMetricCard
          key={kpi.id}
          kpi={kpi}
          showSparkline={showSparkline}
          showDelta={showDelta}
          onClick={onCardClick ? () => onCardClick(kpi) : undefined}
        />
      ))}
    </div>
  );
}

// =============================================================================
// KPI METRIC CARD
// =============================================================================

interface KPIMetricCardProps {
  kpi: KPIObjetivo;
  showSparkline?: boolean;
  showDelta?: boolean;
  onClick?: () => void;
}

function KPIMetricCard({ kpi, showSparkline, showDelta, onClick }: KPIMetricCardProps) {
  const delta = useMemo(() => {
    if (!showDelta || !kpi.recent_measurements || kpi.recent_measurements.length < 2) {
      return null;
    }

    const measurements = [...kpi.recent_measurements].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const current = measurements[measurements.length - 1]?.value || 0;
    const previous = measurements[measurements.length - 2]?.value || 0;

    return {
      value: calculateDelta(current, previous),
      isPositive: isDeltaPositive(calculateDelta(current, previous), kpi.trend_type),
    };
  }, [kpi, showDelta]);

  const sparklineData = useMemo(() => {
    if (!showSparkline || !kpi.recent_measurements) return undefined;

    return kpi.recent_measurements
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m) => m.value);
  }, [kpi, showSparkline]);

  const borderColor = SEMAFORO_COLORS[kpi.status_semaforo];

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4',
        onClick && 'cursor-pointer transition-transform hover:scale-105 hover:shadow-lg'
      )}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={kpi.name}>
          {kpi.name}
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatValue(kpi.last_value, kpi.unit)}
          </p>
          {delta && <DeltaBadge value={delta.value} isPositive={delta.isPositive} />}
        </div>
        {kpi.responsible_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Responsable: {kpi.responsible_name}
          </p>
        )}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3">
            <MiniSparkline data={sparklineData} color={borderColor} />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// DELTA BADGE
// =============================================================================

interface DeltaBadgeProps {
  value: number;
  isPositive: boolean;
}

function DeltaBadge({ value, isPositive }: DeltaBadgeProps) {
  const absValue = Math.abs(value).toFixed(1);
  const isIncrease = value > 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
        isPositive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      )}
    >
      <span>{isIncrease ? '\u2191' : '\u2193'}</span>
      {absValue}%
    </span>
  );
}

// =============================================================================
// MINI SPARKLINE
// =============================================================================

interface MiniSparklineProps {
  data: number[];
  color: string;
}

function MiniSparkline({ data }: MiniSparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        className="stroke-current text-primary-500"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
