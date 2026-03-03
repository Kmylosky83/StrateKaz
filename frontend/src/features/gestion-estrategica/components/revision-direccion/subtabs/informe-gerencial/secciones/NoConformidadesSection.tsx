/**
 * Sección 6: No Conformidades y Acciones Correctivas (§9.3.2c)
 *
 * NCs abiertas/cerradas. Pie por tipo. Progreso acciones correctivas.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makePieOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenCalidad,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenCalidad>;
}

export function NoConformidadesSection({ modulo }: Props) {
  const d = modulo.data;

  const tipoPieOption = useMemo(() => {
    if (!d.por_tipo || d.por_tipo.length === 0) return null;
    const data = d.por_tipo.map((t) => ({
      name: String(t.tipo ?? 'Otro'),
      value: t.cantidad,
    }));
    return makePieOption(data, { isDonut: true });
  }, [d.por_tipo]);

  const pctCierre =
    d.total_no_conformidades > 0 ? Math.round((d.cerradas / d.total_no_conformidades) * 100) : 0;

  return (
    <SeccionISOCard
      seccionNumero="6"
      titulo="No Conformidades"
      isoRef="§9.3.2c"
      icon={<AlertOctagon className="w-5 h-5" />}
      iconColor="text-red-600 dark:text-red-400"
      disponible={modulo.disponible}
      detalle={
        d.por_severidad && d.por_severidad.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              NCs por severidad
            </p>
            {d.por_severidad.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                  {String(s.severidad ?? '').toLowerCase()}
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {s.cantidad}
                </span>
              </div>
            ))}
          </div>
        ) : undefined
      }
    >
      <KpiCardGrid columns={3}>
        <KpiCard label="Total NCs" value={d.total_no_conformidades} color="info" />
        <KpiCard
          label="Abiertas"
          value={d.abiertas}
          icon={<AlertOctagon className="w-4 h-4" />}
          color={d.abiertas > 5 ? 'danger' : d.abiertas > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Cerradas"
          value={d.cerradas}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="success"
        />
      </KpiCardGrid>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">% Cierre NCs</span>
          <span className="text-xs font-semibold">{pctCierre}%</span>
        </div>
        <Progress
          value={pctCierre}
          color={pctCierre >= 80 ? 'success' : pctCierre >= 50 ? 'warning' : 'danger'}
        />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Efectividad acciones correctivas
          </span>
          <span className="text-xs font-semibold">
            {d.acciones_correctivas.porcentaje_efectividad}%
          </span>
        </div>
        <Progress
          value={d.acciones_correctivas.porcentaje_efectividad}
          color={
            d.acciones_correctivas.porcentaje_efectividad >= 80
              ? 'success'
              : d.acciones_correctivas.porcentaje_efectividad >= 50
                ? 'warning'
                : 'danger'
          }
        />
      </div>
      {tipoPieOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NCs por tipo</p>
          <ReactECharts option={tipoPieOption} style={{ height: 200 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
