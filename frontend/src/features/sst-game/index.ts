/**
 * SST Game: Los Héroes de la Seguridad
 * Feature barrel export
 */

// Pages / Entry points
export { SSTGamePage } from './components/SSTGamePage';
export { GameEntryCard } from './components/GameEntryCard';

// Hooks
export { useGameProgress, useGameNiveles, useCompletarNivel } from './hooks/useGameProgress';

// Types
export type { GameLevel, GameProgress, GameQuizQuestion } from './types/game.types';
