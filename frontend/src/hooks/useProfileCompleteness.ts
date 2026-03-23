/**
 * Hook para obtener el porcentaje de completitud del perfil del usuario.
 * Consulta el endpoint GET /api/core/profile-completeness/
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios-config';

const profileKeys = {
  all: ['profile-completeness'] as const,
  status: () => [...profileKeys.all, 'status'] as const,
};

interface MissingField {
  field: string;
  label: string;
  weight: number;
}

interface NextAction {
  field: string;
  label: string;
  link: string;
}

interface ProfileCompleteness {
  percentage: number;
  missing_fields: MissingField[];
  next_action: NextAction | null;
}

export function useProfileCompleteness(enabled = true) {
  return useQuery({
    queryKey: profileKeys.status(),
    queryFn: async () => {
      const { data } = await api.get<ProfileCompleteness>('/core/profile-completeness/');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export type { ProfileCompleteness, MissingField, NextAction };
