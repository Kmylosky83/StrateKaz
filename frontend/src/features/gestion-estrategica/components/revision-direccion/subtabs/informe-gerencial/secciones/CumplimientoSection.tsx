/**
 * Sección 3: Cumplimiento Legal (§9.3.2c — Obligaciones de cumplimiento)
 *
 * % cumplimiento legal global. Pie chart por estado.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makePieOption, STATUS_COLORS } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenCumplimientoLegal,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenCumplimientoLegal>;
}

export function CumplimientoSection({ modulo }: Props) {
  const d = modulo.data;

  const pieOption = useMemo(() => {
    if (!d.por_estado || d.por_estado.length === 0) return null;
    const data = d.por_estado.map((e) => ({
      name: String(e.estado ?? 'Desconocido').replace('_', ' '),
      value: e.cantidad,
    }));
    return makePieOption(data, { isDonut: true });
  }, [d.por_estado]);

  return (
    <SeccionISOCard
      seccionNumero="3"
      titulo="Cumplimiento Legal"
      isoRef="§9.3.2c"
      icon={<ShieldCheck className="w-5 h-5" />}
      iconColor="text-emerald-600 dark:text-emerald-400"
      disponible={modulo.disponible}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Cumplimiento global</span>
          <span
            className="text-lg font-bold"
            style={{
              color:
                d.porcentaje_cumplimiento >= 90
                  ? STATUS_COLORS.success
                  : d.porcentaje_cumplimiento >= 70
                    ? STATUS_COLORS.warning
                    : STATUS_COLORS.danger,
            }}
          >
            {d.porcentaje_cumplimiento}%
          </span>
        </div>
        <Progress
          value={d.porcentaje_cumplimiento}
          color={
            d.porcentaje_cumplimiento >= 90
              ? 'success'
              : d.porcentaje_cumplimiento >= 70
                ? 'warning'
                : 'danger'
          }
          size="lg"
        />
      </div>
      <KpiCardGrid columns={3}>
        <KpiCard label="Total requisitos" value={d.total_requisitos} color="info" />
        <KpiCard
          label="Vencidos"
          value={d.vencidos}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={d.vencidos > 0 ? 'danger' : 'success'}
        />
        <KpiCard label="Proximos 30d" value={d.proximos_vencer_30d} color="warning" />
      </KpiCardGrid>
      {pieOption && (
        <div className="mt-4">
          <ReactECharts option={pieOption} style={{ height: 200 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
