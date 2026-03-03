/**
 * Sección 12: Accidentalidad y SST (§9.3.2c — Desempeño SST)
 *
 * Total accidentes, incidentes, días incapacidad, enfermedades laborales.
 * Bar chart por gravedad.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { HardHat, Activity, Heart } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeBarOption, STATUS_COLORS, RISK_COLORS } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenAccidentalidad,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenAccidentalidad>;
}

export function AccidentalidadSection({ modulo }: Props) {
  const d = modulo.data;

  const gravedadOption = useMemo(() => {
    const labels = ['Leves', 'Moderados', 'Graves', 'Mortales'];
    const values = [
      d.por_gravedad.leves,
      d.por_gravedad.moderados,
      d.por_gravedad.graves,
      d.por_gravedad.mortales,
    ];
    return makeBarOption(labels, values, {
      colorFn: (i) => {
        const colors = [
          STATUS_COLORS.success,
          STATUS_COLORS.warning,
          RISK_COLORS.alto,
          RISK_COLORS.critico,
        ];
        return colors[i];
      },
      showLabel: true,
    });
  }, [d.por_gravedad]);

  return (
    <SeccionISOCard
      seccionNumero="12"
      titulo="Accidentalidad y SST"
      isoRef="§9.3.2c"
      icon={<HardHat className="w-5 h-5" />}
      iconColor="text-yellow-600 dark:text-yellow-400"
      disponible={modulo.disponible}
    >
      <KpiCardGrid columns={2}>
        <KpiCard
          label="Accidentes de Trabajo"
          value={d.total_accidentes}
          icon={<Activity className="w-4 h-4" />}
          color={d.total_accidentes > 0 ? 'danger' : 'success'}
          description={`${d.total_dias_incapacidad} dias incapacidad`}
        />
        <KpiCard
          label="Incidentes"
          value={d.total_incidentes}
          color={d.total_incidentes > 5 ? 'warning' : 'info'}
        />
        <KpiCard
          label="Enfermedades Laborales"
          value={d.total_enfermedades_laborales}
          icon={<Heart className="w-4 h-4" />}
          color={d.total_enfermedades_laborales > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label="Dias incapacidad"
          value={d.total_dias_incapacidad}
          color={
            d.total_dias_incapacidad > 30
              ? 'danger'
              : d.total_dias_incapacidad > 0
                ? 'warning'
                : 'success'
          }
        />
      </KpiCardGrid>
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Accidentes por gravedad
        </p>
        <ReactECharts option={gravedadOption} style={{ height: 180 }} notMerge lazyUpdate />
      </div>
    </SeccionISOCard>
  );
}
