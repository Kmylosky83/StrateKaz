/**
 * GamificacionTab - Leaderboard, badges y perfil de gamificacion
 */
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useModuleColor } from '@/hooks/useModuleColor';
import { getModuleColorClasses } from '@/utils/moduleColors';
import { Trophy, Medal, Star, Flame, TrendingUp } from 'lucide-react';
import { useLeaderboard, useBadges } from '../../hooks/useFormacionReinduccion';

const TIPO_BADGE_ICON: Record<string, string> = {
  logro: '🏆',
  nivel: '⭐',
  especial: '💎',
  competencia: '🎯',
  racha: '🔥',
};

export const GamificacionTab = () => {
  const { color: moduleColor } = useModuleColor('TALENT_HUB');
  const colorClasses = getModuleColorClasses(moduleColor);

  const { data: leaderboard, isLoading: loadingLeaderboard } = useLeaderboard(20);
  const { data: badges, isLoading: loadingBadges } = useBadges();

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={
          <div className={`p-2 rounded-lg ${colorClasses.badge}`}>
            <Trophy className={`h-5 w-5 ${colorClasses.icon}`} />
          </div>
        }
        title="Gamificacion"
        description="Rankings, badges y logros de capacitacion"
        variant="compact"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Leaderboard
              </h3>
            </div>

            {loadingLeaderboard ? (
              <div className="py-8 text-center">
                <Spinner size="md" className="mx-auto" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <EmptyState
                icon={<Trophy className="h-10 w-10 text-gray-300" />}
                title="Sin datos"
                description="El leaderboard se llenara cuando los colaboradores completen capacitaciones."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Pos
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Colaborador
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                        Nivel
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                        Puntos
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                        Badges
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">
                        Capacitaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.colaborador_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold">
                            {entry.posicion <= 3 ? (
                              <span className="text-lg">
                                {entry.posicion === 1 ? '🥇' : entry.posicion === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-gray-500">{entry.posicion}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.colaborador_nombre}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant="info" size="sm">
                            Nv. {entry.nivel} - {entry.nombre_nivel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            <Star size={14} />
                            {entry.puntos_totales}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                            <Medal size={14} />
                            {entry.badges_obtenidos}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <TrendingUp size={14} />
                            {entry.capacitaciones_completadas}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Badges disponibles */}
        <div>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Medal className="h-5 w-5 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Badges Disponibles
              </h3>
            </div>

            {loadingBadges ? (
              <div className="py-8 text-center">
                <Spinner size="md" className="mx-auto" />
              </div>
            ) : !badges || badges.length === 0 ? (
              <EmptyState
                icon={<Medal className="h-10 w-10 text-gray-300" />}
                title="Sin badges"
                description="No se han configurado badges de gamificacion."
              />
            ) : (
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-lg"
                      style={{ backgroundColor: `${badge.color}20` }}
                    >
                      {TIPO_BADGE_ICON[badge.tipo] || '🏅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {badge.nombre}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {badge.descripcion || `${badge.puntos_requeridos} pts requeridos`}
                      </p>
                    </div>
                    <Badge variant="gray" size="sm">
                      {badge.tipo_display || badge.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Info gamificacion */}
          <Card className="p-5 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Como funciona
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <Star size={12} className="text-yellow-500 mt-0.5 shrink-0" />
                Gana puntos al completar capacitaciones
              </li>
              <li className="flex items-start gap-2">
                <Medal size={12} className="text-purple-500 mt-0.5 shrink-0" />
                Desbloquea badges al alcanzar objetivos
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp size={12} className="text-green-500 mt-0.5 shrink-0" />
                Sube de nivel acumulando puntos
              </li>
              <li className="flex items-start gap-2">
                <Flame size={12} className="text-orange-500 mt-0.5 shrink-0" />
                Mantiene tu racha participando seguido
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
