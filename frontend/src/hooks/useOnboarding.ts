/**
 * useOnboarding — Hook para el checklist de onboarding dinámico.
 *
 * Consume el endpoint GET /api/core/onboarding/ que devuelve pasos
 * personalizados según el tipo de usuario (admin, jefe, empleado, etc.).
 * También expone useDismissOnboarding para marcar el checklist como descartado.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios-config';

// ============================================================================
// QUERY KEYS
// ============================================================================

const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  link: string;
  cta_text: string;
}

export interface OnboardingData {
  onboarding_type: 'admin' | 'jefe' | 'empleado' | 'contratista' | 'proveedor' | 'cliente';
  steps: OnboardingStep[];
  done_count: number;
  total: number;
  overall_progress: number;
  profile_percentage: number;
  completed: boolean;
  dismissed: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook principal de onboarding.
 * Stale time de 5 min — los pasos no cambian frecuentemente.
 */
export function useOnboarding(enabled = true) {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: async () => {
      const { data } = await api.get<OnboardingData>('/core/onboarding/');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

/**
 * Mutation para descartar el checklist de onboarding.
 * Invalida la query de onboarding para que la UI se actualice.
 */
export function useDismissOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/core/onboarding/dismiss/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

/**
 * Mutation para reabrir el checklist de onboarding previamente descartado.
 * Setea dismissed = false en el backend.
 */
export function useReopenOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/core/onboarding/reopen/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

/**
 * Mutation para marcar un paso de onboarding como completado manualmente.
 * Se usa para pasos sin verificación automática (e.g. primer_lectura).
 */
export function useMarkOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (step: string) => api.post('/core/onboarding/mark-step/', { step }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}
