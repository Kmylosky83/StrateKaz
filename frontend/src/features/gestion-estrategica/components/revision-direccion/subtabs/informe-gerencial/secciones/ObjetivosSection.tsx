/**
 * Sección 5: Objetivos Estratégicos (§9.3.2c — Grado de logro)
 *
 * % avance global, objetivos por semáforo, horizontal stacked bar.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Target, TrendingUp } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeBarOption, STATUS_COLORS } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenPlaneacion,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenPlaneacion>;
}

export function ObjetivosSection({ modulo }: Props) {
  const d = modulo.data;

  const bscOption = useMemo(() => {
    if (!d.por_perspectiva_bsc || d.por_perspectiva_bsc.length === 0) return null;
    const labels = d.por_perspectiva_bsc.map((p) =>
      String(p.bsc_perspective ?? '').replace(/_/g, ' ')
    );
    const values = d.por_perspectiva_bsc.map((p) => Math.round(p.avance));
    return makeBarOption(labels, values, {
      horizontal: true,
      colorFn: (_, v) =>
        v >= 75 ? STATUS_COLORS.success : v >= 50 ? STATUS_COLORS.warning : STATUS_COLORS.danger,
      showLabel: true,
    });
  }, [d.por_perspectiva_bsc]);

  return (
    <SeccionISOCard
      seccionNumero="5"
      titulo="Objetivos Estrategicos"
      isoRef="§9.3.2c"
      icon={<Target className="w-5 h-5" />}
      iconColor="text-indigo-600 dark:text-indigo-400"
      disponible={modulo.disponible}
      detalle={
        d.por_estado && d.por_estado.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Objetivos por estado
            </p>
            {d.por_estado.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                  {String(e.status ?? '')
                    .replace(/_/g, ' ')
                    .toLowerCase()}
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {e.cantidad}
                </span>
              </div>
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Avance global</span>
          <span
            className="text-lg font-bold"
            style={{
              color:
                d.avance_global >= 75
                  ? STATUS_COLORS.success
                  : d.avance_global >= 50
                    ? STATUS_COLORS.warning
                    : STATUS_COLORS.danger,
            }}
          >
            {d.avance_global}%
          </span>
        </div>
        <Progress
          value={d.avance_global}
          color={d.avance_global >= 75 ? 'success' : d.avance_global >= 50 ? 'warning' : 'danger'}
          size="lg"
        />
      </div>
      <KpiCardGrid columns={3}>
        <KpiCard label="Total objetivos" value={d.total_objetivos} color="info" />
        <KpiCard
          label="Completados"
          value={d.completados}
          icon={<TrendingUp className="w-4 h-4" />}
          color="success"
        />
        <KpiCard label="Retrasados" value={d.retrasados} color="danger" />
      </KpiCardGrid>
      {bscOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Avance por perspectiva BSC
          </p>
          <ReactECharts option={bscOption} style={{ height: 180 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
