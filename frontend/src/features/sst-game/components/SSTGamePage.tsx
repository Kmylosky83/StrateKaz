/**
 * SSTGamePage: Pantalla completa del juego SST
 * Ensambla: GameCanvas + HUD + QuizModal + MobileControls + PauseMenu + LoadingScreen
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { QuizModal } from './QuizModal';
import { MobileControls } from './MobileControls';
import { GamePauseMenu } from './GamePauseMenu';
import { GameLoadingScreen } from './GameLoadingScreen';
import { LevelCompleteModal } from './LevelCompleteModal';
import { useGamePreguntas, useCompletarNivel } from '../hooks/useGameProgress';
import { eventBridge } from '../game/utils/eventBridge';
import type { GameQuizQuestion } from '../types/game.types';

// Detect mobile/touch device
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768
      );
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

interface SSTGamePageProps {
  nivelId?: number;
}

export function SSTGamePage({ nivelId = 1 }: SSTGamePageProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelResults, setLevelResults] = useState<{
    score: number;
    xp: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
    epps: string[];
  } | null>(null);

  // Fetch questions for this level
  const { data: preguntas = [] } = useGamePreguntas(nivelId);
  const completarNivel = useCompletarNivel();

  // Map API questions to game format
  const gameQuestions: GameQuizQuestion[] = useMemo(() => {
    return preguntas.map((p) => ({
      id: p.id,
      pregunta: p.pregunta,
      opciones: p.opciones,
      explicacion: p.explicacion,
      norma_referencia: p.norma_referencia,
      categoria_display: p.categoria_display || p.categoria,
      dificultad_display: p.dificultad_display || p.dificultad,
      puntos: p.puntos,
    }));
  }, [preguntas]);

  // Handle level complete event from Phaser
  useEffect(() => {
    const handleLevelComplete = (payload: unknown) => {
      const data = payload as {
        score: number;
        xp: number;
        epps: Array<{ id: string; name: string; emoji: string }>;
        correctAnswers: number;
        totalQuestions: number;
        duration: number;
      };

      setLevelResults({
        score: data.score,
        xp: data.xp,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        duration: data.duration,
        epps: data.epps.map((e) => e.id),
      });
      setLevelComplete(true);

      // POST to API
      completarNivel.mutate({
        nivel_id: nivelId,
        puntaje: data.score,
        preguntas_correctas: data.correctAnswers,
        preguntas_totales: data.totalQuestions,
        duracion_segundos: data.duration,
        epps_recolectados: data.epps.map((e) => e.id),
        detalle_respuestas: [],
      });
    };

    eventBridge.on('level:complete', handleLevelComplete);
    return () => {
      eventBridge.off('level:complete', handleLevelComplete);
    };
  }, [nivelId, completarNivel]);

  const handleExit = useCallback(() => {
    navigate('/mi-portal', { replace: true });
  }, [navigate]);

  const handlePause = useCallback(() => {
    eventBridge.emit('game:pause-menu');
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* Phaser Canvas — fills screen */}
      <GameCanvas />

      {/* React Overlay UI */}
      <GameHUD onBack={handleExit} onPause={handlePause} />
      <QuizModal questions={gameQuestions} />
      {isMobile && <MobileControls />}
      <GamePauseMenu onExit={handleExit} />
      <GameLoadingScreen />

      {/* Level Complete Modal */}
      {levelComplete && levelResults && (
        <LevelCompleteModal results={levelResults} onExit={handleExit} onContinue={handleExit} />
      )}
    </div>
  );
}
