/**
 * Hook para obtener el progreso de onboarding de Fundación.
 *
 * Endpoint: GET /api/configuracion/fundacion-progress/
 * Usado en el Dashboard para mostrar el checklist de configuración inicial.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios-config';

// ── Tipos ──

export interface FundacionStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  route: string;
  tab: string;
}

export interface FundacionProgress {
  steps: FundacionStep[];
  done_count: number;
  total: number;
  overall_progress: number;
  is_complete: boolean;
}

// ── API ──

const fetchFundacionProgress = async (): Promise<FundacionProgress> => {
  const { data } = await apiClient.get<FundacionProgress>('/configuracion/fundacion-progress/');
  return data;
};

// ── Hook ──

export const useFundacionProgress = (enabled = true) => {
  return useQuery({
    queryKey: ['fundacion', 'progress'],
    queryFn: fetchFundacionProgress,
    staleTime: 5 * 60 * 1000, // 5 min
    enabled,
  });
};
