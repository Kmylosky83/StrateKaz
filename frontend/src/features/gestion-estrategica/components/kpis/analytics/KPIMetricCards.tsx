/**
 * KPIMetricCards - Cards Enterprise con Tremor
 * Sistema de Gestión StrateKaz - Analytics Pro
 */
import { useMemo } from 'react';
import { Card as TremorCard, Text, Metric, BadgeDelta, type Color } from '@tremor/react';
import { cn } from '@/lib/utils';
import type { KPIObjetivo, SemaforoStatus } from '../../../types/kpi.types';
import { formatValue, calculateDelta, isDeltaPositive, SEMAFORO_COLORS } from '../../../types/kpi.types';
import { DynamicIcon } from '@/components/common';

export interface KPIMetricCardsProps {
  kpis: KPIObjetivo[];
  layout?: 'grid' | 'list';
  showSparkline?: boolean;
  showDelta?: boolean;
  onCardClick?: (kpi: KPIObjetivo) => void;
  className?: string;
}

const SEMAFORO_TO_TREMOR_COLOR: Record<SemaforoStatus, Color> = {
  VERDE: 'emerald',
  AMARILLO: 'amber',
  ROJO: 'rose',
  SIN_DATOS: 'gray',
};

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
        <Text>No hay KPIs disponibles</Text>
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

  const semaforoColor = SEMAFORO_TO_TREMOR_COLOR[kpi.status_semaforo];

  // Color del borde según semáforo
  const borderColor = SEMAFORO_COLORS[kpi.status_semaforo];

  return (
    <div
      className={cn(
        'relative',
        onClick && 'cursor-pointer transition-transform hover:scale-105 hover:shadow-lg'
      )}
      onClick={onClick}
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <TremorCard decoration="left" decorationColor={semaforoColor}>
        <div className="space-y-2">
          <Text className="truncate" title={kpi.name}>
            {kpi.name}
          </Text>
          <div className="flex items-baseline justify-between gap-2">
            <Metric>{formatValue(kpi.last_value, kpi.unit)}</Metric>
            {delta && (
              <BadgeDelta
                deltaType={delta.isPositive ? 'increase' : 'decrease'}
                size="xs"
              >
                {Math.abs(delta.value).toFixed(1)}%
              </BadgeDelta>
            )}
          </div>
          {kpi.responsible_name && (
            <Text className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Responsable: {kpi.responsible_name}
            </Text>
          )}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3">
              <MiniSparkline data={sparklineData} color={borderColor} />
            </div>
          )}
        </div>
      </TremorCard>
    </div>
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
