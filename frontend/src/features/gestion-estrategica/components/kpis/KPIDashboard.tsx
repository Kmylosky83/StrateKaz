/**
 * Dashboard de KPIs con Gauges Enterprise
 * Sistema de Gestión StrateKaz - Sprint 4
 *
 * Integrado con componentes Analytics Enterprise:
 * - KPIGaugeAdvanced: Velocímetros con predicción y tendencias
 * - Semáforos visuales según umbrales
 */
import {
  Target,
  TrendingUp,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Plus,
  BarChart3,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/common';
import { StatsGrid } from '@/components/layout';
import type { StatItem } from '@/components/layout';
import { KPIGaugeAdvanced, type KPIGaugeData } from '@/components/data-display';
import { useKPIs } from '../../hooks/useKPIs';
import type { KPIObjetivo, SemaforoStatus } from '../../types/kpi.types';
import { FREQUENCY_CONFIG, SEMAFORO_CONFIG, getProgressColor } from '../../types/kpi.types';

interface KPIDashboardProps {
  objectiveId: number;
  onSelectKPI?: (kpi: KPIObjetivo) => void;
  onCreateKPI?: () => void;
}

export function KPIDashboard({ objectiveId, onSelectKPI, onCreateKPI }: KPIDashboardProps) {
  const { data, isLoading } = useKPIs({ objective: objectiveId, is_active: true });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = data?.results || [];

  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-12 w-12" />}
        title="No hay KPIs configurados"
        description="Crea el primer KPI para comenzar a medir el progreso de este objetivo"
        action={
          onCreateKPI
            ? {
                label: 'Crear KPI',
                onClick: onCreateKPI,
                icon: <Plus className="h-4 w-4" />,
              }
            : undefined
        }
      />
    );
  }

  // Calcular estadísticas
  const stats: StatItem[] = [
    {
      label: 'Total KPIs',
      value: kpis.length,
      icon: Target,
      iconColor: 'primary',
      description: 'KPIs activos',
    },
    {
      label: 'En Meta',
      value: kpis.filter((k) => k.status_semaforo === 'VERDE').length,
      icon: TrendingUp,
      iconColor: 'success',
      description: 'Cumpliendo objetivo',
    },
    {
      label: 'En Alerta',
      value: kpis.filter((k) => k.status_semaforo === 'AMARILLO').length,
      icon: AlertTriangle,
      iconColor: 'warning',
      description: 'Requieren atención',
    },
    {
      label: 'Críticos',
      value: kpis.filter((k) => k.status_semaforo === 'ROJO').length,
      icon: XCircle,
      iconColor: 'danger',
      description: 'Fuera de meta',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <StatsGrid stats={stats} />

      {/* Botón Crear KPI */}
      {onCreateKPI && (
        <div className="flex justify-end">
          <Button onClick={onCreateKPI} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo KPI
          </Button>
        </div>
      )}

      {/* Grid de Gauges Enterprise */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIGaugeAdvanced
            key={kpi.id}
            kpi={mapKPIToGaugeData(kpi)}
            size="sm"
            showPrediction
            showTrend
            onClick={() => onSelectKPI?.(kpi)}
          />
        ))}
      </div>

      {/* Grid de Cards con información detallada (toggle para vista alternativa) */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Vista Detallada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} onClick={() => onSelectKPI?.(kpi)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAPPER: KPIObjetivo -> KPIGaugeData
// =============================================================================

function mapKPIToGaugeData(kpi: KPIObjetivo): KPIGaugeData {
  const targetVal = Number(kpi.target_value) || 100;
  return {
    id: kpi.id,
    name: kpi.name,
    unit: kpi.unit || '%',
    currentValue: Number(kpi.last_value) || 0,
    targetValue: targetVal,
    warningThreshold: Number(kpi.warning_threshold) || targetVal * 0.8,
    criticalThreshold: Number(kpi.critical_threshold) || targetVal * 0.6,
    trendType: kpi.trend_type as 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO',
    historicalValues: undefined,
    projectedValue: undefined,
    lastPeriodValue: undefined,
  };
}

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================

interface KPICardProps {
  kpi: KPIObjetivo;
  onClick?: () => void;
}

function KPICard({ kpi, onClick }: KPICardProps) {
  const semaforoConfig = SEMAFORO_CONFIG[kpi.status_semaforo];
  const frequencyConfig = FREQUENCY_CONFIG[kpi.frequency];
  const progressColor = getProgressColor(kpi.status_semaforo);

  // Calcular progreso visual (0-100) — last_value/target_value son string (DecimalField)
  const progress =
    kpi.last_value != null
      ? calculateVisualProgress(Number(kpi.last_value), Number(kpi.target_value), kpi.trend_type)
      : 0;

  // Icono de semáforo
  const SemaforoIcon = getSemaforoIcon(kpi.status_semaforo);

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all border-l-4 ${semaforoConfig.color}`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Header: Nombre + Badge de Frecuencia */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">{kpi.name}</h3>
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {frequencyConfig.label}
          </Badge>
        </div>

        {/* Semáforo Central */}
        <div className="flex items-center justify-center py-3">
          <div className={`rounded-full p-4 ${semaforoConfig.bgColor}`}>
            <SemaforoIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Valor Actual vs Meta */}
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold">
            {kpi.last_value != null ? formatValue(Number(kpi.last_value), kpi.unit) : 'Sin datos'}
          </div>
          <div className="text-sm text-muted-foreground">
            Meta: {formatValue(Number(kpi.target_value), kpi.unit)}
          </div>
        </div>

        {/* Progress Bar */}
        {kpi.last_value != null && (
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-300`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{semaforoConfig.label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Última Medición */}
        {kpi.last_measurement_date && (
          <div className="text-xs text-muted-foreground text-center">
            Última medición: {new Date(kpi.last_measurement_date).toLocaleDateString('es-CO')}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getSemaforoIcon(status: SemaforoStatus) {
  switch (status) {
    case 'VERDE':
      return TrendingUp;
    case 'AMARILLO':
      return AlertTriangle;
    case 'ROJO':
      return XCircle;
    default:
      return HelpCircle;
  }
}

function calculateVisualProgress(
  currentValue: number,
  targetValue: number,
  trendType: string
): number {
  if (trendType === 'MAYOR_MEJOR') {
    return Math.min((currentValue / targetValue) * 100, 100);
  } else if (trendType === 'MENOR_MEJOR') {
    // Invertir: si currentValue es menor, el progreso es mayor
    const ratio = targetValue / currentValue;
    return Math.min(ratio * 100, 100);
  }
  // EN_RANGO: no aplica progreso lineal simple
  return 50;
}

function formatValue(value: number, unit: string): string {
  const formattedNumber = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  // Si la unidad es $, ponerla antes
  if (unit === '$' || unit === 'USD') {
    return `${unit} ${formattedNumber}`;
  }

  // Si es %, ponerla después
  if (unit === '%') {
    return `${formattedNumber}${unit}`;
  }

  // Para otras unidades, después con espacio
  return `${formattedNumber} ${unit}`;
}
