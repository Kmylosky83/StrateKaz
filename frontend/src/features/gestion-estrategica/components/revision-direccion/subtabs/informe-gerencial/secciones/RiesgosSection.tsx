/**
 * Sección 11: Riesgos y Oportunidades (§9.3.2e)
 *
 * Mapa de calor por nivel. Top riesgos. Tratamientos activos.
 */
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Shield, AlertTriangle, Zap } from 'lucide-react';
import { KpiCard, KpiCardGrid } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import { makeRiskHeatmapOption } from '../chart-helpers';
import type {
  ModuloConsolidado,
  ResumenRiesgos,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenRiesgos>;
}

export function RiesgosSection({ modulo }: Props) {
  const d = modulo.data;

  const heatmapOption = useMemo(() => {
    return makeRiskHeatmapOption(d.por_nivel_residual);
  }, [d.por_nivel_residual]);

  return (
    <SeccionISOCard
      seccionNumero="11"
      titulo="Riesgos y Oportunidades"
      isoRef="§9.3.2e"
      icon={<Shield className="w-5 h-5" />}
      iconColor="text-rose-600 dark:text-rose-400"
      disponible={modulo.disponible}
      detalle={
        d.por_estado && d.por_estado.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Riesgos por estado
            </p>
            {d.por_estado.map((e, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                  {String(e.estado ?? '')
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
      <KpiCardGrid columns={3}>
        <KpiCard label="Total riesgos" value={d.total_riesgos} color="info" />
        <KpiCard
          label="Criticos + Altos"
          value={d.criticos_y_altos}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={d.criticos_y_altos > 5 ? 'danger' : d.criticos_y_altos > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Oportunidades"
          value={d.total_oportunidades}
          icon={<Zap className="w-4 h-4" />}
          color="purple"
        />
      </KpiCardGrid>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>
          Tratamientos activos:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {d.tratamientos_activos}
          </span>
        </span>
        <span>
          Nuevos en periodo:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{d.nuevos_en_periodo}</span>
        </span>
      </div>
      <div className="mt-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Distribucion por nivel de riesgo residual
        </p>
        <ReactECharts option={heatmapOption} style={{ height: 160 }} notMerge lazyUpdate />
      </div>
    </SeccionISOCard>
  );
}
