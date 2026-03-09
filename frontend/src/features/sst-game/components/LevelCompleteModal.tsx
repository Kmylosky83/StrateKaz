/**
 * LevelCompleteModal: Modal de nivel completado
 * Muestra resultados, XP ganado y opciones
 */
import { Trophy, Star, Clock, Target, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface LevelCompleteModalProps {
  results: {
    score: number;
    xp: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
    epps: string[];
  };
  onExit: () => void;
  onContinue: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LevelCompleteModal({ results, onExit, onContinue }: LevelCompleteModalProps) {
  const precision =
    results.totalQuestions > 0
      ? Math.round((results.correctAnswers / results.totalQuestions) * 100)
      : 0;

  const stars = precision >= 90 ? 3 : precision >= 60 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm mx-4 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Header with trophy */}
        <div className="relative px-5 py-6 bg-gradient-to-b from-amber-500/20 to-transparent text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
          </motion.div>
          <h2 className="text-lg font-bold text-white">¡Misión Completada!</h2>
          <p className="text-xs text-slate-400 mt-1">Nivel 1 — Planta Industrial RISKORP</p>

          {/* Stars */}
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
              >
                <Star
                  className={`w-6 h-6 ${
                    i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                  }`}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{results.score}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Puntaje</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-blue-400">+{results.xp} XP</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Experiencia</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                {results.correctAnswers}/{results.totalQuestions}
              </p>
              <p className="text-[10px] text-slate-500">Precisión {precision}%</p>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-white">{formatDuration(results.duration)}</p>
              <p className="text-[10px] text-slate-500">Tiempo</p>
            </div>
          </div>
        </div>

        {/* EPPs collected */}
        {results.epps.length > 0 && (
          <div className="px-5 pb-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              EPP Recolectado
            </p>
            <div className="flex gap-1.5">
              {results.epps.map((epp) => (
                <span
                  key={epp}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300"
                >
                  {epp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg
              bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm
              transition-all hover:scale-[1.02]"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
              bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs
              border border-slate-700 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Volver al Portal
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
