/**
 * React Query hooks para Juego SST
 * Módulo independiente — gamificacion/juego_sst
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryKeys } from '@/lib/query-keys';
import { sstGameApi } from '../api/sstGameApi';
import type { CompletarNivelData } from '../types/game.types';

// Query keys
export const gameKeys = createQueryKeys('juego-sst');

export const gameQueryKeys = {
  progreso: () => [...gameKeys.all, 'progreso'] as const,
  niveles: () => [...gameKeys.all, 'niveles'] as const,
  preguntas: (nivelId: number) => [...gameKeys.all, 'preguntas', nivelId] as const,
  leaderboard: () => [...gameKeys.all, 'leaderboard'] as const,
  historial: () => [...gameKeys.all, 'historial'] as const,
};

/** Hook para obtener el progreso del jugador */
export function useGameProgress() {
  return useQuery({
    queryKey: gameQueryKeys.progreso(),
    queryFn: sstGameApi.getMiProgreso,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Hook para listar niveles disponibles */
export function useGameNiveles() {
  return useQuery({
    queryKey: gameQueryKeys.niveles(),
    queryFn: sstGameApi.getNiveles,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/** Hook para obtener preguntas de un nivel */
export function useGamePreguntas(nivelId: number) {
  return useQuery({
    queryKey: gameQueryKeys.preguntas(nivelId),
    queryFn: () => sstGameApi.getNivelPreguntas(nivelId),
    enabled: nivelId > 0,
    staleTime: 30 * 60 * 1000, // 30 min (preguntas no cambian frecuentemente)
  });
}

/** Hook para completar un nivel */
export function useCompletarNivel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompletarNivelData) => sstGameApi.completarNivel(data),
    onSuccess: () => {
      // Invalidar progreso, niveles y leaderboard
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.progreso() });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.niveles() });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.leaderboard() });
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.historial() });
    },
  });
}

/** Hook para el leaderboard */
export function useGameLeaderboard(limite = 10) {
  return useQuery({
    queryKey: gameQueryKeys.leaderboard(),
    queryFn: () => sstGameApi.getLeaderboard(limite),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/** Hook para historial de sesiones */
export function useGameHistorial() {
  return useQuery({
    queryKey: gameQueryKeys.historial(),
    queryFn: sstGameApi.getHistorial,
    staleTime: 5 * 60 * 1000,
  });
}
