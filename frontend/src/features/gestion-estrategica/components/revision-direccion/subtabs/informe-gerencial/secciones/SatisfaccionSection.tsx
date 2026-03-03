/**
 * Sección 4: Satisfacción del Cliente (§9.3.2c — Retroalimentación)
 *
 * NPS/CSAT, PQRS: total, resueltas, tiempo promedio.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Smile, MessageSquare, Clock } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makePieOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenSatisfaccion,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenSatisfaccion>;
}

export function SatisfaccionSection({ modulo }: Props) {
  const d = modulo.data;

  const pieOption = useMemo(() => {
    if (!d.por_tipo || d.por_tipo.length === 0) return null;
    const data = d.por_tipo.map((t) => ({
      name: String(t.tipo__nombre ?? 'Otro'),
      value: t.cantidad,
    }));
    return makePieOption(data, { isDonut: true });
  }, [d.por_tipo]);

  return (
    <SeccionISOCard
      seccionNumero="4"
      titulo="Satisfaccion del Cliente"
      isoRef="§9.3.2c"
      icon={<Smile className="w-5 h-5" />}
      iconColor="text-amber-600 dark:text-amber-400"
      disponible={modulo.disponible}
    >
      <KpiCardGrid columns={2}>
        <KpiCard
          label="NPS Promedio"
          value={d.nps_promedio != null ? d.nps_promedio.toFixed(1) : 'N/A'}
          icon={<Smile className="w-5 h-5" />}
          color={
            d.nps_promedio != null
              ? d.nps_promedio >= 50
                ? 'success'
                : d.nps_promedio >= 0
                  ? 'warning'
                  : 'danger'
              : 'gray'
          }
        />
        <KpiCard
          label="Total PQRS"
          value={d.total_pqrs}
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
          description={`${d.resueltas} resueltas`}
        />
        <KpiCard
          label="Tiempo promedio"
          value={`${d.tiempo_promedio_respuesta} dias`}
          icon={<Clock className="w-5 h-5" />}
          color={d.tiempo_promedio_respuesta <= 5 ? 'success' : 'warning'}
        />
        <KpiCard label="Encuestas respondidas" value={d.encuestas_respondidas} color="purple" />
      </KpiCardGrid>
      {pieOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">PQRS por tipo</p>
          <ReactECharts option={pieOption} style={{ height: 200 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
