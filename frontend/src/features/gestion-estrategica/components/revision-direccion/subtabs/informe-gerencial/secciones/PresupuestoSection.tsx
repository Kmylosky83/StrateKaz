/**
 * Sección 10: Adecuación de Recursos — Presupuesto (§9.3.2f)
 *
 * Ejecutado vs planificado. Desviación %. Bar chart.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeBarOption, STATUS_COLORS, CHART_COLORS } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenPresupuesto,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenPresupuesto>;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function PresupuestoSection({ modulo }: Props) {
  const d = modulo.data;

  const barOption = useMemo(() => {
    return makeBarOption(
      ['Asignado', 'Ejecutado', 'Disponible'],
      [d.total_asignado, d.total_ejecutado, d.saldo_disponible],
      {
        colorFn: (i) => (i === 0 ? CHART_COLORS[0] : i === 1 ? CHART_COLORS[1] : CHART_COLORS[2]),
        showLabel: true,
      }
    );
  }, [d]);

  return (
    <SeccionISOCard
      seccionNumero="10"
      titulo="Presupuesto y Recursos"
      isoRef="§9.3.2f"
      icon={<DollarSign className="w-5 h-5" />}
      iconColor="text-green-600 dark:text-green-400"
      disponible={modulo.disponible}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Ejecucion presupuestal {d.anio}
          </span>
          <span
            className="text-lg font-bold"
            style={{
              color:
                d.porcentaje_ejecucion >= 90
                  ? STATUS_COLORS.success
                  : d.porcentaje_ejecucion >= 60
                    ? STATUS_COLORS.warning
                    : STATUS_COLORS.danger,
            }}
          >
            {d.porcentaje_ejecucion}%
          </span>
        </div>
        <Progress
          value={d.porcentaje_ejecucion}
          color={
            d.porcentaje_ejecucion >= 90
              ? 'success'
              : d.porcentaje_ejecucion >= 60
                ? 'warning'
                : 'danger'
          }
          size="lg"
        />
      </div>
      <KpiCardGrid columns={3}>
        <KpiCard label="Asignado" value={formatCurrency(d.total_asignado)} color="blue" />
        <KpiCard
          label="Ejecutado"
          value={formatCurrency(d.total_ejecutado)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="green"
        />
        <KpiCard
          label="Disponible"
          value={formatCurrency(d.saldo_disponible)}
          icon={d.saldo_disponible < 0 ? <TrendingDown className="w-4 h-4" /> : undefined}
          color={d.saldo_disponible < 0 ? 'danger' : 'success'}
        />
      </KpiCardGrid>
      <div className="mt-4">
        <ReactECharts option={barOption} style={{ height: 180 }} notMerge lazyUpdate />
      </div>
    </SeccionISOCard>
  );
}
