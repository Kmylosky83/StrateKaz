/**
 * DashboardTab - KPIs y metricas de Formacion y Reinduccion
 */
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import {
  GraduationCap,
  CalendarDays,
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
  DollarSign,
} from 'lucide-react';
import { useFormacionEstadisticas, useProximasSesiones } from '../../hooks/useFormacionReinduccion';

export const DashboardTab = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const { data: stats, isLoading } = useFormacionEstadisticas();
  const { data: proximas } = useProximasSesiones(7);

  const kpis: StatItem[] = useMemo(
    () => [
      {
        label: 'Capacitaciones Activas',
        value: stats?.capacitaciones_activas ?? 0,
        icon: GraduationCap,
        iconColor: 'primary' as const,
      },
      {
        label: 'Sesiones del Mes',
        value: stats?.sesiones_programadas_mes ?? 0,
        icon: CalendarDays,
        iconColor: 'info' as const,
      },
      {
        label: 'Participantes (Mes)',
        value: stats?.participantes_mes ?? 0,
        icon: Users,
        iconColor: 'success' as const,
      },
      {
        label: 'Tasa Asistencia',
        value: `${stats?.tasa_asistencia ?? 0}%`,
        icon: CheckCircle,
        iconColor: 'warning' as const,
      },
    ],
    [stats]
  );

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Cargando estadisticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsGrid stats={kpis} columns={4} moduleColor={moduleColor} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tasa Aprobacion</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.tasa_aprobacion ?? 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Horas Formacion (Mes)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.horas_formacion_mes ?? 0}h
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Certificados (Mes)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.certificados_emitidos_mes ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Presupuesto Ejecutado</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${(Number(stats?.presupuesto_ejecutado_anio ?? 0) / 1_000_000).toFixed(1)}M
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Proximas sesiones */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Proximas Sesiones (7 dias)
          </h3>
        </div>

        {!proximas || proximas.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10 text-gray-300" />}
            title="Sin sesiones programadas"
            description="No hay sesiones en los proximos 7 dias."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Capacitacion
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Sesion
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Fecha
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Horario
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Lugar
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Inscritos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {proximas.slice(0, 10).map((sesion) => (
                  <tr key={sesion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {sesion.capacitacion_nombre}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {sesion.titulo_sesion || `Sesion ${sesion.numero_sesion}`}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(sesion.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {sesion.hora_inicio?.slice(0, 5)} - {sesion.hora_fin?.slice(0, 5)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {sesion.lugar || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {sesion.inscritos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
