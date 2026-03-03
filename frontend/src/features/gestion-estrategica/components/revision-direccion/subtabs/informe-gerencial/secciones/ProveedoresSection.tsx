/**
 * Sección 8: Desempeño de Proveedores Externos (§9.3.2e)
 *
 * Evaluación promedio. Proveedores activos. Nuevos en periodo.
 */
import { Truck, Star } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import type {
  ModuloConsolidado,
  ResumenProveedores,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenProveedores>;
}

export function ProveedoresSection({ modulo }: Props) {
  const d = modulo.data;
  const calif = d.calificacion_promedio ?? 0;

  return (
    <SeccionISOCard
      seccionNumero="8"
      titulo="Desempeno de Proveedores"
      isoRef="§9.3.2e"
      icon={<Truck className="w-5 h-5" />}
      iconColor="text-orange-600 dark:text-orange-400"
      disponible={modulo.disponible}
    >
      {calif > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Calificacion promedio</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              {calif.toFixed(1)}
            </span>
          </div>
          <Progress
            value={calif}
            color={calif >= 80 ? 'success' : calif >= 60 ? 'warning' : 'danger'}
          />
        </div>
      )}
      <KpiCardGrid columns={2}>
        <KpiCard label="Proveedores activos" value={d.total_activos} color="blue" />
        <KpiCard label="Nuevos en periodo" value={d.nuevos_en_periodo} color="green" />
        <KpiCard label="Evaluaciones" value={d.evaluaciones_total} color="purple" />
        <KpiCard
          label="Evaluaciones completas"
          value={d.evaluaciones_completadas}
          color="success"
        />
      </KpiCardGrid>
    </SeccionISOCard>
  );
}
