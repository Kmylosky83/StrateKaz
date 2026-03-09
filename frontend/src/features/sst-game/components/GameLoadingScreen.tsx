/**
 * GameLoadingScreen: Pantalla de carga branded para el juego SST
 * Se muestra mientras Phaser inicializa y carga assets
 */
import { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBridge } from '../game/utils/eventBridge';

export function GameLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleProgress = (payload: unknown) => {
      const { progress: p } = payload as { progress: number };
      setProgress(Math.round(p * 100));
    };

    const handleReady = () => {
      setProgress(100);
      // Small delay to show 100% before hiding
      setTimeout(() => setVisible(false), 400);
    };

    eventBridge.on('game:load-progress', handleProgress);
    eventBridge.on('game:ready', handleReady);

    return () => {
      eventBridge.off('game:load-progress', handleProgress);
      eventBridge.off('game:ready', handleReady);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center
            bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
        >
          {/* Shield icon with glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150" />
            <Shield className="w-16 h-16 text-amber-500 relative" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-white tracking-wide mb-1">
              LOS HÉROES DE LA SEGURIDAD
            </h1>
            <p className="text-xs text-amber-400/70 font-mono tracking-widest">
              CAPACITACIÓN SST GAMIFICADA
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '16rem', opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-3"
          >
            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* Loading text */}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{progress < 100 ? 'Preparando misión...' : 'Listo'}</span>
            <span className="font-mono text-slate-600">{progress}%</span>
          </div>

          {/* Tips */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 text-[10px] text-slate-700 text-center px-8 max-w-sm"
          >
            Consejo: Recolecta todo el EPP y responde correctamente para maximizar tu XP
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
