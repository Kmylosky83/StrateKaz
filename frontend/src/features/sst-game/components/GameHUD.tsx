/**
 * GameHUD: Overlay de stats del jugador (React, encima del canvas Phaser)
 * HP, XP, nivel, EPP recolectados
 */
import { useState, useEffect, useCallback } from 'react';
import { Shield, Heart, Zap, ArrowLeft, Pause } from 'lucide-react';
import { eventBridge } from '../game/utils/eventBridge';

interface GameHUDProps {
  onPause: () => void;
  onQuit: () => void;
}

export function GameHUD({ onPause, onQuit }: GameHUDProps) {
  const [hp, setHp] = useState(100);
  const [maxHp] = useState(100);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNext, setXpToNext] = useState(100);
  const [epps, setEpps] = useState<Array<{ id: string; name: string; emoji: string }>>([]);

  const handleHealth = useCallback((payload: unknown) => {
    const { hp: newHp } = payload as { hp: number; maxHp: number };
    setHp(newHp);
  }, []);

  const handleXP = useCallback((payload: unknown) => {
    const {
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
    } = payload as { xp: number; level: number; xpToNext: number };
    setXp(newXp);
    setLevel(newLevel);
    setXpToNext(newXpToNext);
  }, []);

  const handleEPP = useCallback((payload: unknown) => {
    const { eppId, name, emoji } = payload as { eppId: string; name: string; emoji: string };
    setEpps((prev) => {
      if (prev.some((e) => e.id === eppId)) return prev;
      return [...prev, { id: eppId, name, emoji }];
    });
  }, []);

  useEffect(() => {
    eventBridge.on('player:health', handleHealth);
    eventBridge.on('player:xp', handleXP);
    eventBridge.on('epp:collected', handleEPP);

    return () => {
      eventBridge.off('player:health', handleHealth);
      eventBridge.off('player:xp', handleXP);
      eventBridge.off('epp:collected', handleEPP);
    };
  }, [handleHealth, handleXP, handleEPP]);

  const hpPercent = Math.round((hp / maxHp) * 100);
  const xpPercent = xpToNext > 0 ? Math.round((xp / xpToNext) * 100) : 0;
  const hpColor = hpPercent > 60 ? '#22c55e' : hpPercent > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-sm pointer-events-auto">
        {/* Left: Back + Pause */}
        <div className="flex items-center gap-2">
          <button
            onClick={onQuit}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            aria-label="Salir del juego"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onPause}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            aria-label="Pausar juego"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Center: HP + XP */}
        <div className="flex items-center gap-4">
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5" style={{ color: hpColor }} />
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPercent}%`,
                  backgroundColor: hpColor,
                }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: hpColor }}>
              {hp}
            </span>
          </div>

          {/* XP Bar */}
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-violet-400">{xp}</span>
          </div>

          {/* Level */}
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Nv.{level}</span>
          </div>
        </div>

        {/* Right: EPP Inventory */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 mr-1">EPP</span>
          {['casco', 'guantes', 'gafas', 'botas', 'overol'].map((eppId) => {
            const collected = epps.find((e) => e.id === eppId);
            return (
              <div
                key={eppId}
                className={`w-6 h-6 rounded border flex items-center justify-center text-xs
                  ${collected ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900'}`}
              >
                {collected ? collected.emoji : '?'}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
