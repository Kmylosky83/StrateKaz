/**
 * Sección 7: Resultados de Auditorías (§9.3.2d)
 *
 * Programadas vs ejecutadas. Hallazgos por tipo. Donut chart.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, FileCheck } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makePieOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenAuditorias,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenAuditorias>;
}

export function AuditoriasSection({ modulo }: Props) {
  const d = modulo.data;

  const hallazgosPieOption = useMemo(() => {
    const ht = d.hallazgos?.por_tipo;
    if (!ht || ht.length === 0) return null;
    const data = ht.map((t) => ({
      name: String(t.tipo ?? 'Otro'),
      value: t.cantidad,
    }));
    return makePieOption(data, { isDonut: true });
  }, [d.hallazgos]);

  return (
    <SeccionISOCard
      seccionNumero="7"
      titulo="Resultados de Auditorias"
      isoRef="§9.3.2d"
      icon={<Search className="w-5 h-5" />}
      iconColor="text-teal-600 dark:text-teal-400"
      disponible={modulo.disponible}
      detalle={
        d.por_tipo && d.por_tipo.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Auditorias por tipo
            </p>
            {d.por_tipo.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                  {String(t.tipo ?? '')
                    .replace(/_/g, ' ')
                    .toLowerCase()}
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {t.cantidad}
                </span>
              </div>
            ))}
          </div>
        ) : undefined
      }
    >
      <KpiCardGrid columns={3}>
        <KpiCard label="Total auditorias" value={d.total_auditorias} color="info" />
        <KpiCard
          label="Total hallazgos"
          value={d.hallazgos.total}
          icon={<FileCheck className="w-4 h-4" />}
          color="orange"
        />
        <KpiCard label="Hallazgos cerrados" value={d.hallazgos.cerrados} color="success" />
      </KpiCardGrid>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">% Cierre hallazgos</span>
          <span className="text-xs font-semibold">{d.hallazgos.porcentaje_cierre}%</span>
        </div>
        <Progress
          value={d.hallazgos.porcentaje_cierre}
          color={
            d.hallazgos.porcentaje_cierre >= 80
              ? 'success'
              : d.hallazgos.porcentaje_cierre >= 50
                ? 'warning'
                : 'danger'
          }
        />
      </div>
      {hallazgosPieOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Hallazgos por tipo
          </p>
          <ReactECharts option={hallazgosPieOption} style={{ height: 200 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
