/**
 * MobileControls: Joystick virtual + botón de acción para móvil
 * Usa nipplejs para el joystick analógico
 */
import { useRef, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { eventBridge } from '../game/utils/eventBridge';

export function MobileControls() {
  const joystickRef = useRef<HTMLDivElement>(null);
  const nippleManagerRef = useRef<ReturnType<typeof import('nipplejs').create> | null>(null);

  useEffect(() => {
    if (!joystickRef.current) return;

    let manager: ReturnType<typeof import('nipplejs').create> | null = null;

    // Dynamic import para evitar cargar nipplejs en desktop
    import('nipplejs').then((nipplejs) => {
      if (!joystickRef.current) return;

      manager = nipplejs.create({
        zone: joystickRef.current,
        mode: 'static',
        position: { left: '75px', bottom: '75px' },
        color: '#f59e0b',
        size: 120,
        restOpacity: 0.7,
        fadeTime: 100,
      });

      manager.on('move', (_evt, data) => {
        if (data.angle && data.force) {
          eventBridge.emit('input:joystick', {
            angle: data.angle.radian,
            force: Math.min(data.force, 1),
          });
        }
      });

      manager.on('end', () => {
        eventBridge.emit('input:joystick-end');
      });

      nippleManagerRef.current = manager;
    });

    return () => {
      if (manager) {
        manager.destroy();
      }
      nippleManagerRef.current = null;
    };
  }, []);

  const handleAction = useCallback(() => {
    eventBridge.emit('input:action');
  }, []);

  return (
    <>
      {/* Joystick zone — esquina inferior izquierda */}
      <div
        ref={joystickRef}
        className="absolute bottom-0 left-0 z-40 w-[200px] h-[200px]"
        style={{ touchAction: 'none' }}
      />

      {/* Botón de acción — esquina inferior derecha */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          handleAction();
        }}
        className="absolute bottom-8 right-8 z-40 w-16 h-16 rounded-full
          bg-amber-500/90 active:bg-amber-400 border-2 border-amber-300/50
          flex items-center justify-center shadow-lg shadow-amber-500/30
          transition-transform active:scale-95"
        style={{ touchAction: 'none' }}
        aria-label="Acción"
      >
        <Zap className="w-7 h-7 text-slate-900" />
      </button>

      {/* Label hint */}
      <span className="absolute bottom-2 right-7 z-40 text-[9px] text-amber-400/70 font-mono">
        ACCIÓN
      </span>
    </>
  );
}
