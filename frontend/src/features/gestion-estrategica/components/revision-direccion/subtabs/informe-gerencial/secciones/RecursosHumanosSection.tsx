/**
 * Sección 9: Adecuación de Recursos — Talento Humano (§9.3.2f)
 *
 * Rotación, ingresos, retiros, distribución por tipo de contrato.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, UserPlus, UserMinus, Percent } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makePieOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenTalentoHumano,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenTalentoHumano>;
}

export function RecursosHumanosSection({ modulo }: Props) {
  const d = modulo.data;

  const contratoPieOption = useMemo(() => {
    if (!d.por_tipo_contrato || d.por_tipo_contrato.length === 0) return null;
    const data = d.por_tipo_contrato.map((t) => ({
      name: String(t.tipo_contrato ?? 'Otro').replace(/_/g, ' '),
      value: t.cantidad,
    }));
    return makePieOption(data, { isDonut: true });
  }, [d.por_tipo_contrato]);

  return (
    <SeccionISOCard
      seccionNumero="9"
      titulo="Talento Humano"
      isoRef="§9.3.2f"
      icon={<Users className="w-5 h-5" />}
      iconColor="text-cyan-600 dark:text-cyan-400"
      disponible={modulo.disponible}
    >
      <KpiCardGrid columns={2}>
        <KpiCard
          label="Colaboradores activos"
          value={d.total_activos}
          icon={<Users className="w-4 h-4" />}
          color="blue"
        />
        <KpiCard
          label="Tasa de rotacion"
          value={`${d.tasa_rotacion}%`}
          icon={<Percent className="w-4 h-4" />}
          color={d.tasa_rotacion > 15 ? 'danger' : d.tasa_rotacion > 8 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Nuevos ingresos"
          value={d.nuevos_ingresos}
          icon={<UserPlus className="w-4 h-4" />}
          color="green"
        />
        <KpiCard
          label="Retiros"
          value={d.retiros}
          icon={<UserMinus className="w-4 h-4" />}
          color={d.retiros > 5 ? 'danger' : 'orange'}
        />
      </KpiCardGrid>
      {contratoPieOption && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Distribucion por tipo de contrato
          </p>
          <ReactECharts option={contratoPieOption} style={{ height: 200 }} notMerge lazyUpdate />
        </div>
      )}
    </SeccionISOCard>
  );
}
