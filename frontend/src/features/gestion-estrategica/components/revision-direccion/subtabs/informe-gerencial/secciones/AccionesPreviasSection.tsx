/**
 * Sección 1: Estado de Acciones de Revisiones Anteriores (§9.3.2a)
 *
 * Compromisos de revisiones anteriores: total, cumplidos, vencidos, % cierre.
 * Bar chart por estado.
 */
import ReactECharts from 'echarts-for-react';
import { ClipboardCheck } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeBarOption, STATUS_COLORS } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenCalidad,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenCalidad>;
}

/**
 * Nota: Esta sección usa datos de calidad (acciones correctivas) como proxy
 * para el estado de acciones de revisiones anteriores.
 */
export function AccionesPreviasSection({ modulo }: Props) {
  const d = modulo.data;

  const acciones = d.acciones_correctivas;
  const total = acciones?.total ?? 0;
  const verificadas = acciones?.verificadas ?? 0;
  const pendientes = total - verificadas;
  const pct = acciones?.porcentaje_efectividad ?? 0;

  const chartOption = makeBarOption(['Verificadas', 'Pendientes'], [verificadas, pendientes], {
    colorFn: (i) => (i === 0 ? STATUS_COLORS.success : STATUS_COLORS.warning),
    showLabel: true,
  });

  return (
    <SeccionISOCard
      seccionNumero="1"
      titulo="Estado de Acciones Anteriores"
      isoRef="§9.3.2a"
      icon={<ClipboardCheck className="w-5 h-5" />}
      iconColor="text-blue-600 dark:text-blue-400"
      disponible={modulo.disponible}
    >
      <KpiCardGrid columns={3}>
        <KpiCard label="Total acciones" value={total} color="info" />
        <KpiCard label="Verificadas" value={verificadas} color="success" />
        <KpiCard label="Pendientes" value={pendientes} color="warning" />
      </KpiCardGrid>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">% Efectividad</span>
          <span className="text-xs font-semibold">{pct}%</span>
        </div>
        <Progress value={pct} color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'} />
      </div>
      {total > 0 && (
        <div className="mt-4">
          <ReactECharts option={chartOption} style={{ height: 180 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
