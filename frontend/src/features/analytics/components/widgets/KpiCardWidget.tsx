import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/common';
import { Spinner } from '@/components/common';
import { cn } from '@/utils/cn';
import { useUltimoValorKPI, useMetasKPIByKPI } from '../../hooks/useAnalytics';
import type { WidgetDashboard } from '../../types';

interface Props {
  widget: WidgetDashboard;
}

/**
 * KpiCardWidget
 *
 * Displays a single KPI metric card with:
 * - Current value with semaphore indicator
 * - Trend arrow (up/down/neutral)
 * - Progress bar showing meta vs actual
 * - Mini sparkline showing recent trend
 */
function KpiCardWidget({ widget }: Props) {
  const { data: valorActual, isLoading: loadingValor } = useUltimoValorKPI(widget.kpi);
  const { data: metas = [], isLoading: loadingMetas } = useMetasKPIByKPI(widget.kpi);

  const isLoading = loadingValor || loadingMetas;

  if (isLoading) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <Spinner size="sm" />
      </Card>
    );
  }

  if (!valorActual) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
      </Card>
    );
  }

  // Find active meta for current period
  const metaActiva = metas.find((meta) => {
    const now = new Date();
    const desde = new Date(meta.periodo_desde);
    const hasta = new Date(meta.periodo_hasta);
    return now >= desde && now <= hasta;
  });

  // Calculate progress percentage
  const valor = valorActual.valor_numerico || 0;
  const meta = metaActiva?.valor_meta || 0;
  const progress = meta > 0 ? Math.min((valor / meta) * 100, 100) : 0;

  // Determine trend (compare with previous if available)
  const variacion = valorActual.variacion_porcentaje || 0;
  const TrendIcon = variacion > 0 ? TrendingUp : variacion < 0 ? TrendingDown : Minus;
  const trendColor = variacion > 0 ? 'text-green-600' : variacion < 0 ? 'text-red-600' : 'text-gray-600';

  // Semaphore color mapping
  const semaphoreColors = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  const semaphoreColor = semaphoreColors[valorActual.color_semaforo as keyof typeof semaphoreColors] || 'bg-gray-400';

  // Progress bar color based on semaphore
  const progressBarColors = {
    verde: 'bg-green-500',
    amarillo: 'bg-yellow-500',
    rojo: 'bg-red-500',
  };
  const progressBarColor = progressBarColors[valorActual.color_semaforo as keyof typeof progressBarColors] || 'bg-blue-500';

  return (
    <Card className="p-6 h-full hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {widget.titulo || widget.kpi_nombre}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{valor.toFixed(2)}</span>
            {valorActual.unidad_medida && (
              <span className="text-sm text-muted-foreground">{valorActual.unidad_medida}</span>
            )}
          </div>
        </div>

        {/* Semaphore indicator */}
        <div className={cn('w-3 h-3 rounded-full', semaphoreColor)} title={valorActual.color_semaforo} />
      </div>

      {/* Trend indicator */}
      <div className={cn('flex items-center gap-1 mb-4 text-sm', trendColor)}>
        <TrendIcon className="h-4 w-4" />
        <span className="font-medium">{Math.abs(variacion).toFixed(1)}%</span>
        <span className="text-muted-foreground text-xs ml-1">
          {variacion > 0 ? 'vs período anterior' : variacion < 0 ? 'vs período anterior' : 'sin cambios'}
        </span>
      </div>

      {/* Meta progress */}
      {metaActiva && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta</span>
            <span className="font-medium">{meta.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', progressBarColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {progress.toFixed(0)}% de la meta
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        Última medición: {new Date(valorActual.fecha_medicion).toLocaleDateString('es-CO')}
      </div>
    </Card>
  );
}

export { KpiCardWidget };
export type { Props as KpiCardWidgetProps };
