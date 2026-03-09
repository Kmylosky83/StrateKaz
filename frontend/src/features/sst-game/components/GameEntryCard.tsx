/**
 * GameEntryCard: Tarjeta de entrada al juego SST desde Mi Portal
 * Muestra stats del jugador, progreso y CTA para jugar
 */
import { useNavigate } from 'react-router-dom';
import { Shield, Swords, Trophy, Star, Target, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameProgress, useGameLeaderboard } from '../hooks/useGameProgress';

export function GameEntryCard() {
  const navigate = useNavigate();
  const { data: progress, isLoading } = useGameProgress();
  const { data: leaderboard = [] } = useGameLeaderboard(3);

  const handlePlay = () => {
    navigate('/mi-portal/juego-sst');
  };

  return (
    <div className="space-y-4">
      {/* Main Game Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-slate-700/50
          bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600
              flex items-center justify-center shadow-lg shadow-amber-500/20"
            >
              <Shield className="w-6 h-6 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white leading-tight">
                Los Héroes de la Seguridad
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aventura RPG · Capacitación SST Gamificada
              </p>
            </div>
            <Swords className="w-5 h-5 text-amber-500/50 shrink-0" />
          </div>

          {/* Player Stats */}
          {!isLoading && progress && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {/* XP Bar */}
              <div className="col-span-2 bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Nivel {progress.nivel_actual}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {progress.xp_total} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.porcentaje_xp}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Stats mini cards */}
              <div className="bg-slate-800/50 rounded-lg p-2.5 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {progress.precision_quizzes || '0'}%
                  </p>
                  <p className="text-[9px] text-slate-500">Precisión</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2.5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {progress.tiempo_jugado_formateado || '0m'}
                  </p>
                  <p className="text-[9px] text-slate-500">Jugado</p>
                </div>
              </div>
            </div>
          )}

          {/* Not started state */}
          {!isLoading && (!progress || progress.xp_total === 0) && (
            <div className="bg-slate-800/30 rounded-lg p-4 mb-5 text-center">
              <p className="text-xs text-slate-400 mb-1">Conviértete en un Héroe de la Seguridad</p>
              <p className="text-[10px] text-slate-500">
                Explora la planta, recolecta EPP y demuestra tus conocimientos en SST
              </p>
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={handlePlay}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg
              bg-gradient-to-r from-amber-500 to-amber-600
              hover:from-amber-400 hover:to-amber-500
              text-slate-900 font-bold text-sm
              shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Swords className="w-4 h-4" />
            {progress && progress.xp_total > 0 ? 'Continuar Misión' : 'Jugar Ahora'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Mini Leaderboard */}
      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-semibold text-slate-300">Top Héroes</h4>
          </div>
          <div className="divide-y divide-slate-800/50">
            {leaderboard.slice(0, 3).map((entry) => (
              <div key={entry.posicion} className="px-4 py-2 flex items-center gap-3">
                <span
                  className={`text-xs font-bold w-5 text-center ${
                    entry.posicion === 1
                      ? 'text-amber-400'
                      : entry.posicion === 2
                        ? 'text-slate-300'
                        : 'text-amber-700'
                  }`}
                >
                  {entry.posicion === 1 ? '🥇' : entry.posicion === 2 ? '🥈' : '🥉'}
                </span>
                <span className="text-xs text-slate-300 flex-1 truncate">
                  {entry.colaborador_nombre}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500/50" />
                  <span className="text-[10px] text-slate-500 font-mono">{entry.xp_total} XP</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
