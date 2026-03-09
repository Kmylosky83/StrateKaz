/**
 * GamePauseMenu: Menú de pausa del juego SST
 * Overlay con opciones de reanudar y volver al portal
 */
import { useState, useEffect, useCallback } from 'react';
import { Play, LogOut, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBridge } from '../game/utils/eventBridge';

interface GamePauseMenuProps {
  onExit: () => void;
}

export function GamePauseMenu({ onExit }: GamePauseMenuProps) {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);

  const handlePause = useCallback(() => {
    setVisible(true);
    eventBridge.emit('game:pause');
  }, []);

  useEffect(() => {
    eventBridge.on('game:pause-menu', handlePause);
    return () => {
      eventBridge.off('game:pause-menu', handlePause);
    };
  }, [handlePause]);

  // ESC key to toggle pause
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (visible) {
          handleResume();
        } else {
          handlePause();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, handlePause]);

  const handleResume = () => {
    setVisible(false);
    eventBridge.emit('game:resume');
  };

  const handleExit = () => {
    setVisible(false);
    eventBridge.emit('game:resume');
    onExit();
  };

  const toggleMute = () => {
    setMuted((prev) => !prev);
    eventBridge.emit('game:mute', { muted: !muted });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 30 }}
            className="w-full max-w-xs mx-4"
          >
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-wider">PAUSA</h2>
              <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-2" />
            </div>

            {/* Menu buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg
                  bg-amber-500 hover:bg-amber-400 text-slate-900
                  font-semibold text-sm transition-all hover:scale-[1.02]"
              >
                <Play className="w-5 h-5" />
                Reanudar
              </button>

              <button
                onClick={toggleMute}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg
                  bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700
                  font-medium text-sm transition-all hover:scale-[1.02]"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                {muted ? 'Activar Sonido' : 'Silenciar'}
              </button>

              <button
                onClick={handleExit}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-lg
                  bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300
                  border border-slate-700 hover:border-red-500/50
                  font-medium text-sm transition-all hover:scale-[1.02]"
              >
                <LogOut className="w-5 h-5" />
                Volver al Portal
              </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[10px] text-slate-600 mt-4 font-mono">
              ESC para reanudar
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
