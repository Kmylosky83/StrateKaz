/**
 * Types para Juego SST: Los Héroes de la Seguridad
 * Talent Hub - StrateKaz
 */

// =============================================================================
// NIVEL DEL JUEGO
// =============================================================================

export interface GameLevel {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  zona: ZonaJuego;
  zona_display: string;
  numero_nivel: number;
  puntos_completar: number;
  tiempo_limite_segundos: number;
  min_preguntas_correctas: number;
  total_epps: number;
  mapa_key: string;
  es_boss: boolean;
  disponible_desde: string | null;
  total_preguntas: number;
  orden: number;
  // Agregados por el endpoint /niveles/
  completado?: boolean;
  mejor_puntaje?: number;
  desbloqueado?: boolean;
}

export type ZonaJuego = 'obra_civil' | 'industria' | 'quimica' | 'oficinas' | 'logistica' | 'final';

// =============================================================================
// PREGUNTAS QUIZ
// =============================================================================

export interface GameQuizQuestion {
  id: number;
  pregunta: string;
  opciones: QuizOption[];
  explicacion: string;
  norma_referencia: string;
  categoria: CategoriaQuiz;
  categoria_display: string;
  dificultad: DificultadQuiz;
  dificultad_display: string;
  puntos: number;
  orden: number;
}

export interface QuizOption {
  id: string;
  texto: string;
  es_correcta: boolean;
}

export type CategoriaQuiz =
  | 'epp'
  | 'procedimientos'
  | 'normas'
  | 'emergencias'
  | 'senalizacion'
  | 'riesgos'
  | 'ambiental'
  | 'ergonomia';

export type DificultadQuiz = 'facil' | 'medio' | 'dificil';

// =============================================================================
// PROGRESO DEL JUGADOR
// =============================================================================

export interface GameProgress {
  id: number;
  colaborador_nombre: string;
  nivel_actual: number;
  xp_total: number;
  xp_nivel_actual: number;
  xp_siguiente_nivel: number;
  vidas: number;
  epps_recolectados: string[];
  niveles_completados: number[];
  mejor_puntaje_nivel: Record<string, number>;
  preguntas_correctas: number;
  preguntas_totales: number;
  tiempo_jugado_segundos: number;
  sesiones_jugadas: number;
  ultima_sesion: string | null;
  porcentaje_xp: number;
  precision_quizzes: number;
  tiempo_jugado_formateado: string;
}

// =============================================================================
// SESIÓN DE JUEGO
// =============================================================================

export interface GameSession {
  id: number;
  nivel: number;
  nivel_nombre: string;
  nivel_numero: number;
  puntaje: number;
  xp_ganado: number;
  preguntas_correctas: number;
  preguntas_totales: number;
  epps_recolectados: string[];
  completado: boolean;
  duracion_segundos: number;
  detalle_respuestas: QuizAnswer[];
  fecha_sesion: string;
}

export interface QuizAnswer {
  pregunta_id: number;
  respuesta: string;
  correcta: boolean;
}

// =============================================================================
// COMPLETAR NIVEL (input al API)
// =============================================================================

export interface CompletarNivelData {
  nivel_id: number;
  puntaje: number;
  preguntas_correctas: number;
  preguntas_totales: number;
  epps_recolectados: string[];
  duracion_segundos: number;
  detalle_respuestas: QuizAnswer[];
}

export interface CompletarNivelResponse {
  sesion: GameSession;
  progreso: GameProgress;
  completado: boolean;
  xp_ganado: number;
  level_up: boolean;
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface GameLeaderboardEntry {
  posicion: number;
  colaborador_id: number;
  colaborador_nombre: string;
  nivel_actual: number;
  xp_total: number;
  niveles_completados: number;
  precision_quizzes: number;
}

// =============================================================================
// EVENT BRIDGE (Phaser <-> React)
// =============================================================================

export interface GameEvents {
  // Phaser → React
  'quiz:start': { npcId: string; questionIds: number[] };
  'player:health': { hp: number; maxHp: number };
  'player:xp': { xp: number; level: number; xpToNext: number };
  'epp:collected': { eppId: string; name: string; emoji: string };
  'level:complete': {
    score: number;
    xp: number;
    epps: string[];
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  };
  'game:ready': void;
  'game:pause': void;
  'game:resume': void;
  // React → Phaser
  'quiz:answer': { questionId: number; answerId: string; correct: boolean };
  'quiz:close': void;
  'input:joystick': { angle: number; force: number };
  'input:joystick-end': void;
  'input:action': void;
  'game:quit': void;
}

// =============================================================================
// GAME STATE (internal Phaser)
// =============================================================================

export interface GameState {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  xpToNext: number;
  score: number;
  eppsCollected: string[];
  quizzesAnswered: number;
  quizzesCorrect: number;
  running: boolean;
  paused: boolean;
}

export interface PlayerConfig {
  x: number;
  y: number;
  speed: number;
}

export interface NPCConfig {
  id: string;
  x: number;
  y: number;
  name: string;
  questionIds: number[];
  interacted: boolean;
}

export interface CollectibleConfig {
  id: string;
  x: number;
  y: number;
  name: string;
  emoji: string;
  collected: boolean;
}
