/**
 * Sección 14: Formación y Competencias (§9.3.2f)
 *
 * Cobertura de formación, horas, asistencia.
 */
import { GraduationCap, Clock, Users } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import type {
  ModuloConsolidado,
  ResumenFormacion,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenFormacion>;
}

export function FormacionSection({ modulo }: Props) {
  const d = modulo.data;

  return (
    <SeccionISOCard
      seccionNumero="14"
      titulo="Formacion y Competencias"
      isoRef="§9.3.2f"
      icon={<GraduationCap className="w-5 h-5" />}
      iconColor="text-violet-600 dark:text-violet-400"
      disponible={modulo.disponible}
    >
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">% Ejecucion del plan</span>
            <span className="text-xs font-semibold">{d.porcentaje_ejecucion}%</span>
          </div>
          <Progress
            value={d.porcentaje_ejecucion}
            color={
              d.porcentaje_ejecucion >= 80
                ? 'success'
                : d.porcentaje_ejecucion >= 50
                  ? 'warning'
                  : 'danger'
            }
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">% Asistencia</span>
            <span className="text-xs font-semibold">{d.porcentaje_asistencia}%</span>
          </div>
          <Progress
            value={d.porcentaje_asistencia}
            color={
              d.porcentaje_asistencia >= 80
                ? 'success'
                : d.porcentaje_asistencia >= 60
                  ? 'warning'
                  : 'danger'
            }
          />
        </div>
      </div>
      <KpiCardGrid columns={3}>
        <KpiCard
          label="Programaciones"
          value={d.programaciones_total}
          color="purple"
          description={`${d.programaciones_completadas} completadas`}
        />
        <KpiCard
          label="Total horas"
          value={d.total_horas}
          icon={<Clock className="w-4 h-4" />}
          color="blue"
        />
        <KpiCard
          label="Participaciones"
          value={d.participaciones}
          icon={<Users className="w-4 h-4" />}
          color="green"
        />
      </KpiCardGrid>
    </SeccionISOCard>
  );
}
