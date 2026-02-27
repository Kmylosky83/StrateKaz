/**
 * React Query Hooks para Portal Publico de Vacantes
 *
 * Endpoints publicos (AllowAny) - No requieren autenticacion.
 * El tenant se detecta automaticamente por subdominio via TenantMainMiddleware.
 *
 * API Base: /talent-hub/seleccion/vacantes-publicas/
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

export interface EmpresaInfoPublica {
  nombre: string;
  logo_url: string | null;
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
  empresaInfo: ['vacantes-publicas', 'empresa-info'] as const,
};

// ============================================================================
// Hooks - Vacantes Publicas
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

export function useEmpresaInfoPublica() {
  return useQuery({
    queryKey: vacantesPublicasKeys.empresaInfo,
    queryFn: async () => {
      const response = await api.get<EmpresaInfoPublica>(
        '/talent-hub/seleccion/vacantes-publicas/empresa-info/'
      );
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// Hooks - Postulacion Publica
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
      toast.success('Postulacion enviada exitosamente');
    },
    onError: (e) => {
      toast.error(getMsg(e, 'Error al enviar la postulacion'));
    },
  });
}
