/**
 * React Query Hooks para Portal Público de Vacantes
 *
 * Endpoints públicos (AllowAny) - No requieren autenticación.
 * El tenant se detecta automáticamente por subdominio via TenantMainMiddleware.
 *
 * Incluye:
 * - Vacantes públicas (listar, detalle)
 * - Postulación pública
 * - Branding público del tenant (logo, colores, nombre)
 *
 * API Base: /talent-hub/seleccion/vacantes-publicas/
 * Branding: /tenant/public/branding/
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { apiClient as api } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface VacantePublicaItem {
  id: number;
  codigo_vacante: string;
  titulo: string;
  cargo_requerido: string;
  area: string;
  descripcion: string;
  tipo_contrato_nombre: string;
  modalidad: 'presencial' | 'hibrido' | 'remoto';
  modalidad_display: string;
  ubicacion: string;
  horario: string;
  prioridad: string;
  prioridad_display: string;
  numero_posiciones: number;
  posiciones_cubiertas: number;
  fecha_apertura: string;
  rango_salarial: { minimo?: string; maximo?: string } | null;
  empresa_nombre: string;
}

export interface VacantePublicaDetail extends VacantePublicaItem {
  requisitos_minimos: string;
  requisitos_deseables: string | null;
  funciones_principales: string;
  competencias_requeridas: string | null;
  beneficios: string | null;
}

/** Branding público del tenant — viene de /tenant/public/branding/ */
export interface BrandingPublico {
  name: string;
  nombre_comercial: string | null;
  company_slogan: string | null;
  logo: string | null;
  logo_white: string | null;
  logo_dark: string | null;
  favicon: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string | null;
  background_color: string | null;
  logo_url: string | null; // legacy fallback
}

// ============================================================================
// Error helper
// ============================================================================

function getMsg(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const d = error.response.data;
    if (typeof d === 'string') return d;
    if (d.detail) return String(d.detail);
    if (d.message) return String(d.message);
    if (d.non_field_errors) return String(d.non_field_errors[0]);
    const first = Object.values(d)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// ============================================================================
// Query keys
// ============================================================================

export const vacantesPublicasKeys = {
  all: ['vacantes-publicas'] as const,
  list: (filters?: { search?: string; modalidad?: string }) =>
    [...vacantesPublicasKeys.all, 'list', filters] as const,
  detail: (id: number) => [...vacantesPublicasKeys.all, 'detail', id] as const,
  branding: ['public-branding'] as const,
};

// ============================================================================
// Hooks - Branding Público del Tenant
// ============================================================================

/**
 * Hook para obtener el branding del tenant SIN autenticación.
 * Usa el endpoint público /tenant/public/branding/?domain={hostname}
 * Retorna logo, colores, nombre de empresa del tenant actual.
 */
export function useBrandingPublico() {
  return useQuery({
    queryKey: vacantesPublicasKeys.branding,
    queryFn: async () => {
      const domain = window.location.hostname;
      const response = await api.get<BrandingPublico>('/tenant/public/branding/', {
        params: { domain },
      });
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 min — branding cambia poco
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Helper: extrae datos útiles del branding con fallbacks seguros
 */
export function useBrandingPublicoHelpers() {
  const { data: branding, isLoading } = useBrandingPublico();

  const empresaNombre = branding?.nombre_comercial || branding?.name || 'Empresa';
  const empresaSlogan = branding?.company_slogan || 'Portal de empleo';

  // Logo efectivo: logo > logo_url (legacy) > null
  const logoUrl =
    (branding?.logo && branding.logo.trim() !== '' ? branding.logo : null) ||
    (branding?.logo_url && branding.logo_url.trim() !== '' ? branding.logo_url : null);

  const logoWhiteUrl =
    branding?.logo_white && branding.logo_white.trim() !== '' ? branding.logo_white : null;

  const primaryColor = branding?.primary_color || '#3B82F6';
  const secondaryColor = branding?.secondary_color || '#6B7280';
  const accentColor = branding?.accent_color || '#F59E0B';

  return {
    branding,
    isLoading,
    empresaNombre,
    empresaSlogan,
    logoUrl,
    logoWhiteUrl,
    primaryColor,
    secondaryColor,
    accentColor,
  };
}

/** Convierte hex + alpha a rgba string (para fondos claros, focus rings, etc.) */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// Hooks - Vacantes Públicas
// ============================================================================

export function useVacantesPublicas(filters?: { search?: string; modalidad?: string }) {
  return useQuery({
    queryKey: vacantesPublicasKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.search) params.search = filters.search;
      if (filters?.modalidad) params.modalidad = filters.modalidad;

      const response = await api.get<VacantePublicaItem[]>(
        '/talent-hub/seleccion/vacantes-publicas/',
        { params }
      );
      const data = response.data;
      return Array.isArray(data)
        ? data
        : ((data as unknown as { results?: VacantePublicaItem[] })?.results ?? []);
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useVacantePublicaDetail(id: number) {
  return useQuery({
    queryKey: vacantesPublicasKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<VacantePublicaDetail>(
        `/talent-hub/seleccion/vacantes-publicas/${id}/`
      );
      return response.data;
    },
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ============================================================================
// Hooks - Postulación Pública
// ============================================================================

export function usePostulacionPublica() {
  return useMutation({
    mutationFn: async ({ vacanteId, formData }: { vacanteId: number; formData: FormData }) => {
      const response = await api.post(
        `/talent-hub/seleccion/vacantes-publicas/${vacanteId}/postular/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Postulación enviada exitosamente');
    },
    onError: (e) => {
      toast.error(getMsg(e, 'Error al enviar la postulación'));
    },
  });
}
