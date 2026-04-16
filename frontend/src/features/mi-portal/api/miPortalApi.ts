/**
 * React Query Hooks para Mi Portal (ESS)
 * Sistema de Gestión StrateKaz
 *
 * Mi Portal consume de:
 * - /api/mi-portal/ (perfil ESS — app propia LIVE)
 * - /api/core/users/ (firma digital, stats admin)
 * - /api/mi-equipo/ (hoja de vida)
 *
 * Cuando se activen módulos L60+ (novedades, nómina, formación, desempeño),
 * sus hooks se agregan aquí.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import type { ColaboradorESS, InfoPersonalUpdateData } from '../types';

const BASE_URL = '/mi-portal';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const miPortalKeys = {
  all: ['mi-portal'] as const,
  perfil: () => [...miPortalKeys.all, 'perfil'] as const,
  documentos: () => [...miPortalKeys.all, 'documentos'] as const,
  adminStats: () => [...miPortalKeys.all, 'admin-stats'] as const,
};

// ============================================================================
// HOOKS - PERFIL
// ============================================================================

export function useMiPerfil(enabled = true) {
  return useQuery({
    queryKey: miPortalKeys.perfil(),
    queryFn: async (): Promise<ColaboradorESS | null> => {
      try {
        const response = await api.get<ColaboradorESS>(`${BASE_URL}/mi-perfil/`);
        return response.data;
      } catch (error: unknown) {
        // 404 = usuario sin colaborador asociado (no es error real)
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) return null;
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled,
  });
}

export function useUpdateMiPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InfoPersonalUpdateData) => {
      const response = await api.put(`${BASE_URL}/mi-perfil/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miPortalKeys.perfil() });
      toast.success('Datos personales actualizados');
    },
    onError: (error: unknown) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar datos');
    },
  });
}

export function useUploadMiPhoto() {
  const queryClient = useQueryClient();
  const refreshUserProfile = useAuthStore((s) => s.refreshUserProfile);

  return useMutation({
    mutationFn: (file: File) => authAPI.uploadPhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miPortalKeys.perfil() });
      refreshUserProfile();
      toast.success('Foto actualizada');
    },
    onError: (error: unknown) => {
      toast.error(error.response?.data?.detail || 'Error al subir la foto');
    },
  });
}

// ============================================================================
// HOOKS - FIRMA GUARDADA
// ============================================================================

interface FirmaGuardadaResponse {
  firma_guardada: string | null;
  iniciales_guardadas: string | null;
}

export const firmaGuardadaKeys = {
  all: ['firma-guardada'] as const,
  detail: () => [...firmaGuardadaKeys.all, 'detail'] as const,
};

export function useFirmaGuardada() {
  return useQuery({
    queryKey: firmaGuardadaKeys.detail(),
    queryFn: async (): Promise<FirmaGuardadaResponse> => {
      const response = await api.get<FirmaGuardadaResponse>('/core/users/firma-guardada/');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useGuardarFirma() {
  const queryClient = useQueryClient();
  const refreshUserProfile = useAuthStore((s) => s.refreshUserProfile);

  return useMutation({
    mutationFn: async (data: {
      firma_guardada?: string | null;
      iniciales_guardadas?: string | null;
    }) => {
      const response = await api.patch('/core/users/firma-guardada/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firmaGuardadaKeys.all });
      refreshUserProfile();
      toast.success('Firma guardada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(error.response?.data?.detail || 'Error al guardar la firma');
    },
  });
}

// ============================================================================
// HOOKS - DOCUMENTOS (HOJA DE VIDA)
// ============================================================================

interface HojaVidaESS {
  id: number;
  colaborador: number;
  nivel_estudio_maximo: string;
  titulo_academico: string;
  institucion: string;
  anio_graduacion: number | null;
  estudios_adicionales: unknown[];
  certificaciones: unknown[];
  experiencia_previa: unknown[];
  idiomas: { idioma: string; nivel: string }[];
  habilidades: unknown[];
  competencias_blandas: unknown[];
  referencias_laborales: unknown[];
  cv_documento: string | null;
  certificados_estudios: string | null;
  observaciones: string;
  total_anios_experiencia: number;
  tiene_formacion_completa: boolean;
}

export function useMisDocumentos(colaboradorId: number | null | undefined) {
  return useQuery({
    queryKey: [...miPortalKeys.documentos(), colaboradorId],
    queryFn: async (): Promise<HojaVidaESS | null> => {
      if (!colaboradorId) return null;
      try {
        const response = await api.get<HojaVidaESS>(
          `/mi-equipo/empleados/hojas-vida/por-colaborador/${colaboradorId}/`
        );
        return response.data;
      } catch (error: unknown) {
        // 404 = no tiene hoja de vida aun
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!colaboradorId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

// ============================================================================
// HOOKS - ADMIN STATS (superadmin dashboard en Mi Portal)
// ============================================================================

export interface AdminStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  internos: number;
  externos: number;
  by_cargo: Array<{ cargo__name: string | null; cargo__code: string | null; count: number }>;
  by_origen: {
    colaborador: number;
    proveedor_portal: number;
    proveedor_profesional: number;
    cliente_portal: number;
    manual: number;
  };
}

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: miPortalKeys.adminStats(),
    queryFn: async () => {
      const response = await api.get<AdminStats>('/core/users/stats/');
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled,
  });
}
