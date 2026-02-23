/**
 * React Query Hooks para Mi Portal (ESS)
 * Sistema de Gestion StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { authAPI } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import type {
  ColaboradorESS,
  InfoPersonalUpdateData,
  VacacionesSaldo,
  SolicitudVacacionesFormData,
  SolicitudPermisoFormData,
  ReciboNomina,
  CapacitacionESS,
  EvaluacionESS,
} from '../types';

const BASE_URL = '/talent-hub/mi-portal';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const miPortalKeys = {
  all: ['mi-portal'] as const,
  perfil: () => [...miPortalKeys.all, 'perfil'] as const,
  documentos: () => [...miPortalKeys.all, 'documentos'] as const,
  vacaciones: () => [...miPortalKeys.all, 'vacaciones'] as const,
  recibos: () => [...miPortalKeys.all, 'recibos'] as const,
  capacitaciones: () => [...miPortalKeys.all, 'capacitaciones'] as const,
  evaluacion: () => [...miPortalKeys.all, 'evaluacion'] as const,
};

// ============================================================================
// HOOKS - PERFIL
// ============================================================================

export function useMiPerfil() {
  return useQuery({
    queryKey: miPortalKeys.perfil(),
    queryFn: async (): Promise<ColaboradorESS | null> => {
      try {
        const response = await api.get<ColaboradorESS>(`${BASE_URL}/mi-perfil/`);
        return response.data;
      } catch (error: any) {
        // 404 = usuario sin colaborador asociado (no es error real)
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
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
    onError: (error: any) => {
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
      // Refresh foto_url en el perfil ESS (Colaborador.foto via signal)
      queryClient.invalidateQueries({ queryKey: miPortalKeys.perfil() });
      // Refresh photo_url en el user del authStore
      refreshUserProfile();
      toast.success('Foto actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al subir la foto');
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
          `/talent-hub/empleados/hojas-vida/por-colaborador/${colaboradorId}/`
        );
        return response.data;
      } catch (error: any) {
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
// HOOKS - VACACIONES
// ============================================================================

export function useMisVacaciones() {
  return useQuery({
    queryKey: miPortalKeys.vacaciones(),
    queryFn: async () => {
      const response = await api.get<VacacionesSaldo>(`${BASE_URL}/mis-vacaciones/`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSolicitarVacaciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SolicitudVacacionesFormData) => {
      const response = await api.post(`${BASE_URL}/mis-vacaciones/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miPortalKeys.vacaciones() });
      toast.success('Solicitud de vacaciones creada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al solicitar vacaciones');
    },
  });
}

// ============================================================================
// HOOKS - PERMISOS
// ============================================================================

export function useSolicitarPermiso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SolicitudPermisoFormData) => {
      const response = await api.post(`${BASE_URL}/solicitar-permiso/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miPortalKeys.all });
      toast.success('Permiso solicitado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al solicitar permiso');
    },
  });
}

// ============================================================================
// HOOKS - RECIBOS DE NOMINA
// ============================================================================

export function useMisRecibos() {
  return useQuery({
    queryKey: miPortalKeys.recibos(),
    queryFn: async () => {
      const response = await api.get<ReciboNomina[]>(`${BASE_URL}/mis-recibos/`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - CAPACITACIONES
// ============================================================================

export function useMisCapacitaciones() {
  return useQuery({
    queryKey: miPortalKeys.capacitaciones(),
    queryFn: async () => {
      const response = await api.get<CapacitacionESS[]>(`${BASE_URL}/mis-capacitaciones/`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - EVALUACION
// ============================================================================

export function useMiEvaluacion() {
  return useQuery({
    queryKey: miPortalKeys.evaluacion(),
    queryFn: async () => {
      const response = await api.get<EvaluacionESS[]>(`${BASE_URL}/mi-evaluacion/`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
