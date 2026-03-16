/**
 * DashboardTab - KPIs y metricas de Onboarding
 */
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { BookOpen, Clock, CheckCircle, AlertTriangle, HardHat, Package } from 'lucide-react';
import {
  useOnboardingEstadisticas,
  useEjecucionesVencidas,
} from '@/features/talent-hub/hooks/useOnboardingInduccion';

const ESTADO_BADGE: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  pendiente: 'warning',
  en_progreso: 'info',
  completado: 'success',
  reprobado: 'danger',
  cancelado: 'danger',
};

export const DashboardTab = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const { data: stats, isLoading } = useOnboardingEstadisticas();
  const { data: vencidas } = useEjecucionesVencidas();

  const kpis: StatItem[] = useMemo(
    () => [
      {
        label: 'Modulos Activos',
        value: stats?.modulos_activos ?? 0,
        icon: BookOpen,
        iconColor: 'primary' as const,
      },
      {
        label: 'Inducciones Pendientes',
        value: stats?.inducciones_pendientes ?? 0,
        icon: Clock,
        iconColor: 'warning' as const,
      },
      {
        label: 'Completadas (Mes)',
        value: stats?.inducciones_completadas_mes ?? 0,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
      {
        label: 'Tasa Cumplimiento',
        value: `${stats?.tasa_cumplimiento ?? 0}%`,
        icon: CheckCircle,
        iconColor: 'info' as const,
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
      {/* KPIs */}
      <StatsGrid stats={kpis} columns={4} moduleColor={moduleColor} />

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EPP por vencer */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <HardHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                EPP por Vencer
              </h3>
              <p className="text-xs text-gray-500">Proximos 30 dias</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats?.epp_por_vencer ?? 0}
            </span>
          </div>
        </Card>

        {/* Activos pendientes devolucion */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Activos Pendientes
              </h3>
              <p className="text-xs text-gray-500">Pendientes de devolucion</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-red-600 dark:text-red-400">
              {stats?.activos_pendientes_devolucion ?? 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Inducciones vencidas */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Inducciones Vencidas
          </h3>
          {vencidas && vencidas.length > 0 && (
            <Badge variant="danger" size="sm">
              {vencidas.length}
            </Badge>
          )}
        </div>

        {!vencidas || vencidas.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="h-10 w-10 text-green-300" />}
            title="Sin vencimientos"
            description="No hay inducciones vencidas. Todo al dia."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Colaborador
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Modulo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Fecha Limite
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {vencidas.slice(0, 10).map((ej) => (
                  <tr key={ej.id}>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {ej.colaborador_nombre}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {ej.modulo_nombre}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={ESTADO_BADGE[ej.estado] || 'gray'} size="sm">
                        {ej.estado_display || ej.estado}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      {new Date(ej.fecha_limite).toLocaleDateString('es-CO')}
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
