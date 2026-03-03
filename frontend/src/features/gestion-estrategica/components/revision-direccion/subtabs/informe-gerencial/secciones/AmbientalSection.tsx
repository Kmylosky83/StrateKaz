/**
 * Sección 13: Gestión Ambiental (§9.3.2c — Desempeño ambiental)
 *
 * Residuos generados/aprovechados, consumos de recursos, certificados.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Leaf, Recycle, Award } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeBarOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenAmbiental,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenAmbiental>;
}

export function AmbientalSection({ modulo }: Props) {
  const d = modulo.data;

  const consumoOption = useMemo(() => {
    if (!d.consumos_recursos || d.consumos_recursos.length === 0) return null;
    const labels = d.consumos_recursos.map((c) => String(c.tipo_recurso__nombre ?? 'Otro'));
    const values = d.consumos_recursos.map((c) => Number(c.total));
    return makeBarOption(labels, values, { horizontal: true, showLabel: true });
  }, [d.consumos_recursos]);

  return (
    <SeccionISOCard
      seccionNumero="13"
      titulo="Gestion Ambiental"
      isoRef="§9.3.2c"
      icon={<Leaf className="w-5 h-5" />}
      iconColor="text-emerald-600 dark:text-emerald-400"
      disponible={modulo.disponible}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            % Aprovechamiento de residuos
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {d.porcentaje_aprovechamiento}%
          </span>
        </div>
        <Progress
          value={d.porcentaje_aprovechamiento}
          color={
            d.porcentaje_aprovechamiento >= 70
              ? 'success'
              : d.porcentaje_aprovechamiento >= 40
                ? 'warning'
                : 'danger'
          }
          size="lg"
        />
      </div>
      <KpiCardGrid columns={3}>
        <KpiCard
          label="Residuos generados"
          value={`${d.residuos_generados_kg.toFixed(0)} kg`}
          icon={<Recycle className="w-4 h-4" />}
          color="orange"
        />
        <KpiCard
          label="Residuos aprovechados"
          value={`${d.residuos_aprovechados_kg.toFixed(0)} kg`}
          color="green"
        />
        <KpiCard
          label="Certificados vigentes"
          value={d.certificados_vigentes}
          icon={<Award className="w-4 h-4" />}
          color="blue"
        />
      </KpiCardGrid>
      {consumoOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Consumo de recursos por tipo
          </p>
          <ReactECharts option={consumoOption} style={{ height: 180 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
