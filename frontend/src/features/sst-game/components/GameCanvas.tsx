/**
 * GameCanvas: React wrapper que monta/desmonta Phaser.Game
 * Patrón similar a NetworkBackground.tsx (Three.js)
 */
import { useRef, useEffect, useState } from 'react';

interface GameCanvasProps {
  isMobile: boolean;
  onReady: () => void;
}

export function GameCanvas({ isMobile, onReady }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [, setMounted] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamic import to ensure Phaser only loads when this component mounts
    // This works with the vendor-phaser chunk splitting
    const initGame = async () => {
      const { createGameConfig } = await import('../game/config');

      if (!containerRef.current) return;

      const config = createGameConfig(containerRef.current, isMobile);
      gameRef.current = new Phaser.Game(config);
      setMounted(true);
      onReady();
    };

    initGame();

    return () => {
      // Cleanup: destroy Phaser instance to prevent memory leaks
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{ touchAction: 'none' }} // Prevent browser touch gestures
    />
  );
}
