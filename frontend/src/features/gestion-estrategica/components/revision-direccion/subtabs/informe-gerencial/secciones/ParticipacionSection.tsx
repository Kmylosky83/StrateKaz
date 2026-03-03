/**
 * Sección 15: Participación de Trabajadores — Comités (§9.3.2g)
 *
 * Reuniones COPASST/comités, asistencia %, compromisos.
 */
import { UsersRound, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { KpiCard, KpiCardGrid, Progress } from '@/components/common';
import { SeccionISOCard } from '../SeccionISOCard';
import type {
  ModuloConsolidado,
  ResumenComites,
} from '../../../../../types/revision-direccion.types';

interface Props {
  modulo: ModuloConsolidado<ResumenComites>;
}

export function ParticipacionSection({ modulo }: Props) {
  const d = modulo.data;

  const pctCompromisos =
    d.compromisos_total > 0 ? Math.round((d.compromisos_cumplidos / d.compromisos_total) * 100) : 0;

  return (
    <SeccionISOCard
      seccionNumero="15"
      titulo="Participacion de Trabajadores"
      isoRef="§9.3.2g"
      icon={<UsersRound className="w-5 h-5" />}
      iconColor="text-sky-600 dark:text-sky-400"
      disponible={modulo.disponible}
    >
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              % Cumplimiento reuniones
            </span>
            <span className="text-xs font-semibold">{d.porcentaje_cumplimiento}%</span>
          </div>
          <Progress
            value={d.porcentaje_cumplimiento}
            color={
              d.porcentaje_cumplimiento >= 80
                ? 'success'
                : d.porcentaje_cumplimiento >= 60
                  ? 'warning'
                  : 'danger'
            }
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              % Compromisos cumplidos
            </span>
            <span className="text-xs font-semibold">{pctCompromisos}%</span>
          </div>
          <Progress
            value={pctCompromisos}
            color={pctCompromisos >= 80 ? 'success' : pctCompromisos >= 50 ? 'warning' : 'danger'}
          />
        </div>
      </div>
      <KpiCardGrid columns={2}>
        <KpiCard
          label="Reuniones programadas"
          value={d.reuniones_programadas}
          icon={<CalendarCheck className="w-4 h-4" />}
          color="blue"
          description={`${d.reuniones_realizadas} realizadas`}
        />
        <KpiCard label="Asistencia promedio" value={d.asistencia_promedio} color="green" />
        <KpiCard label="Compromisos generados" value={d.compromisos_total} color="purple" />
        <KpiCard
          label="Compromisos cumplidos"
          value={d.compromisos_cumplidos}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="success"
        />
      </KpiCardGrid>
    </SeccionISOCard>
  );
}
