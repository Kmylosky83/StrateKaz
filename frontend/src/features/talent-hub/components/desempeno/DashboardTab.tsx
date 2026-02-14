/**
 * DashboardTab - KPIs y metricas de Desempeno
 */
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsGrid } from '@/components/layout/StatsGrid';
import type { StatItem } from '@/components/layout/StatsGrid';
import { useModuleColor } from '@/hooks/useModuleColor';
import { ClipboardCheck, CheckCircle, TrendingUp, Award, Target, Star, Trophy } from 'lucide-react';
import {
  useDesempenoEstadisticas,
  useDistribucionCalificaciones,
  useTopReconocidos,
} from '../../hooks/useDesempeno';

const DISTRIBUCION_COLORS: Record<string, string> = {
  excelente: 'bg-green-500',
  sobresaliente: 'bg-blue-500',
  bueno: 'bg-yellow-500',
  aceptable: 'bg-orange-500',
  necesita_mejora: 'bg-red-500',
};

const DISTRIBUCION_LABELS: Record<string, string> = {
  excelente: 'Excelente',
  sobresaliente: 'Sobresaliente',
  bueno: 'Bueno',
  aceptable: 'Aceptable',
  necesita_mejora: 'Necesita Mejora',
};

export const DashboardTab = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const { data: stats, isLoading } = useDesempenoEstadisticas();
  const { data: distribucion } = useDistribucionCalificaciones();
  const { data: topReconocidos } = useTopReconocidos(5);

  const kpis: StatItem[] = useMemo(
    () => [
      {
        label: 'Evaluaciones Pendientes',
        value: stats?.evaluaciones_pendientes ?? 0,
        icon: ClipboardCheck,
        iconColor: 'warning' as const,
      },
      {
        label: 'Tasa Completitud',
        value: `${stats?.tasa_completitud ?? 0}%`,
        icon: CheckCircle,
        iconColor: 'success' as const,
      },
      {
        label: 'Planes Mejora Activos',
        value: stats?.planes_mejora_activos ?? 0,
        icon: TrendingUp,
        iconColor: 'info' as const,
      },
      {
        label: 'Reconocimientos (Mes)',
        value: stats?.reconocimientos_mes ?? 0,
        icon: Award,
        iconColor: 'primary' as const,
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

  const totalDistribucion = distribucion
    ? Object.values(distribucion).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <StatsGrid stats={kpis} columns={4} moduleColor={moduleColor} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ciclo Activo</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats?.ciclo_activo || 'Ninguno'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completadas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.evaluaciones_completadas ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Proceso</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.evaluaciones_en_proceso ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Promedio Calificacion</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.promedio_calificacion
                  ? Number(stats.promedio_calificacion).toFixed(1)
                  : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribucion de Calificaciones */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Distribucion de Calificaciones
            </h3>
          </div>

          {!distribucion || totalDistribucion === 0 ? (
            <EmptyState
              icon={<Target className="h-10 w-10 text-gray-300" />}
              title="Sin datos"
              description="No hay calificaciones registradas."
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(distribucion).map(([key, value]) => {
                const pct = totalDistribucion > 0 ? (value / totalDistribucion) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">
                        {DISTRIBUCION_LABELS[key] || key}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${DISTRIBUCION_COLORS[key] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Reconocidos */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Top Reconocidos
            </h3>
          </div>

          {!topReconocidos || topReconocidos.length === 0 ? (
            <EmptyState
              icon={<Trophy className="h-10 w-10 text-gray-300" />}
              title="Sin reconocimientos"
              description="No hay reconocimientos registrados."
            />
          ) : (
            <div className="space-y-3">
              {topReconocidos.map((item, idx) => (
                <div
                  key={item.colaborador_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6 text-center">
                      {idx === 0
                        ? '\u{1F947}'
                        : idx === 1
                          ? '\u{1F948}'
                          : idx === 2
                            ? '\u{1F949}'
                            : `${idx + 1}`}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.colaborador_nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={14} className="text-amber-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {item.reconocimientos}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
