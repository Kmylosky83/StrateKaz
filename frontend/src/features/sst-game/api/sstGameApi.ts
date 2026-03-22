/**
 * API client para Juego SST: Los Héroes de la Seguridad
 * Módulo independiente — gamificacion/juego_sst
 */
import apiClient from '@/api/axios-config';
import type {
  GameProgress,
  GameLevel,
  GameQuizQuestion,
  CompletarNivelData,
  CompletarNivelResponse,
  GameLeaderboardEntry,
  GameSession,
} from '../types/game.types';

const BASE_URL = '/game';

export const sstGameApi = {
  /** Obtiene el progreso del jugador actual (lo crea si no existe) */
  getMiProgreso: async (): Promise<GameProgress> => {
    const { data } = await apiClient.get(`${BASE_URL}/mi-progreso/`);
    return data;
  },

  /** Lista los niveles disponibles con estado de completado */
  getNiveles: async (): Promise<GameLevel[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/niveles/`);
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  /** Obtiene las preguntas quiz de un nivel específico */
  getNivelPreguntas: async (nivelId: number): Promise<GameQuizQuestion[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/niveles/${nivelId}/preguntas/`);
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  /** Registra la completación de un nivel */
  completarNivel: async (payload: CompletarNivelData): Promise<CompletarNivelResponse> => {
    const { data } = await apiClient.post(`${BASE_URL}/completar-nivel/`, payload);
    return data;
  },

  /** Obtiene el leaderboard del juego */
  getLeaderboard: async (limite = 10): Promise<GameLeaderboardEntry[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/leaderboard-juego/`, {
      params: { limite },
    });
    return Array.isArray(data) ? data : (data?.results ?? []);
  },

  /** Obtiene el historial de sesiones del jugador actual */
  getHistorial: async (): Promise<GameSession[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/historial/`);
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
};
