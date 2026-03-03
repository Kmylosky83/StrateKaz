/**
 * Hooks React Query para el Portal Proveedor — Mi Empresa
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMiEmpresa,
  fetchMisContratos,
  fetchMisEvaluaciones,
  fetchMisPrecios,
  fetchMisProfesionales,
  toggleEstadoProfesional,
} from '../api/miEmpresa.api';
import { useAuthStore } from '@/store/authStore';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const miEmpresaKeys = {
  all: ['mi-empresa'] as const,
  empresa: () => [...miEmpresaKeys.all, 'detalle'] as const,
  contratos: () => [...miEmpresaKeys.all, 'contratos'] as const,
  evaluaciones: () => [...miEmpresaKeys.all, 'evaluaciones'] as const,
  precios: () => [...miEmpresaKeys.all, 'precios'] as const,
  profesionales: () => [...miEmpresaKeys.all, 'profesionales'] as const,
};

// ============================================================================
// HOOKS — QUERIES
// ============================================================================

/** Datos del proveedor vinculado al usuario */
export function useMiEmpresa() {
  const hasProveedor = useAuthStore((s) => Boolean(s.user?.proveedor));

  return useQuery({
    queryKey: miEmpresaKeys.empresa(),
    queryFn: fetchMiEmpresa,
    enabled: hasProveedor,
    staleTime: 10 * 60 * 1000, // 10 min
    retry: false,
  });
}

/** Condiciones comerciales del proveedor vinculado */
export function useMisContratos() {
  const hasProveedor = useAuthStore((s) => Boolean(s.user?.proveedor));

  return useQuery({
    queryKey: miEmpresaKeys.contratos(),
    queryFn: fetchMisContratos,
    enabled: hasProveedor,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** Evaluaciones del proveedor vinculado */
export function useMisEvaluaciones() {
  const hasProveedor = useAuthStore((s) => Boolean(s.user?.proveedor));

  return useQuery({
    queryKey: miEmpresaKeys.evaluaciones(),
    queryFn: fetchMisEvaluaciones,
    enabled: hasProveedor,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** Precios de materia prima del proveedor vinculado */
export function useMisPrecios() {
  const hasProveedor = useAuthStore((s) => Boolean(s.user?.proveedor));

  return useQuery({
    queryKey: miEmpresaKeys.precios(),
    queryFn: fetchMisPrecios,
    enabled: hasProveedor,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** Profesionales vinculados al mismo proveedor (solo CONSULTOR) */
export function useMisProfesionales() {
  const hasProveedor = useAuthStore((s) => Boolean(s.user?.proveedor));

  return useQuery({
    queryKey: miEmpresaKeys.profesionales(),
    queryFn: fetchMisProfesionales,
    enabled: hasProveedor,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ============================================================================
// HOOKS — MUTATIONS
// ============================================================================

/** Toggle activo/inactivo de un profesional */
export function useToggleEstadoProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleEstadoProfesional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: miEmpresaKeys.profesionales() });
    },
  });
}
