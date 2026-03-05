/**
 * React Query Hooks para Matriz Legal
 * Sistema de Gestión StrateKaz
 *
 * Usa useGenericCRUD como base para operaciones CRUD estándar
 */
import { useGenericCRUD } from '@/hooks/useGenericCRUD';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tiposNormaApi, normasLegalesApi, empresaNormasApi } from '../api';
import type { TipoNorma, NormaLegal, EmpresaNorma, CumplimientoLevel } from '../types';

// Local filter types
interface NormaLegalFilters {
  tipo_norma?: number;
  vigente?: boolean;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  search?: string;
}

interface EmpresaNormaFilters {
  empresa_id?: number;
  norma?: number;
  aplica?: boolean;
  responsable?: number;
}

// ==================== QUERY KEYS ====================

export const matrizLegalKeys = {
  // Tipos de Norma
  tiposNorma: ['tipos-norma'] as const,
  tipoNorma: (id: number) => ['tipo-norma', id] as const,

  // Normas Legales
  normas: (filters?: NormaLegalFilters) => ['normas-legales', filters] as const,
  norma: (id: number) => ['norma-legal', id] as const,
  normasBySistema: (sistema: string) => ['normas-legales', 'sistema', sistema] as const,

  // Empresa-Norma
  empresaNormas: (filters?: EmpresaNormaFilters) => ['empresa-normas', filters] as const,
  empresaNorma: (id: number) => ['empresa-norma', id] as const,
};

// ==================== TIPOS DE NORMA HOOKS ====================

export const useTiposNorma = () => {
  return useGenericCRUD<TipoNorma>({
    queryKey: matrizLegalKeys.tiposNorma,
    endpoint: '/cumplimiento/matriz-legal/tipos-norma/',
    entityName: 'Tipo de Norma',
    isPaginated: true,
  });
};

// ==================== NORMAS LEGALES HOOKS ====================

export const useNormasLegales = (filters?: NormaLegalFilters) => {
  return useGenericCRUD<NormaLegal>({
    queryKey: matrizLegalKeys.normas(filters),
    endpoint: `/cumplimiento/matriz-legal/normas/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Norma Legal',
    isFeminine: true,
    isPaginated: true,
  });
};

export const useNormasLegalesBySistema = (sistema: 'sst' | 'ambiental' | 'calidad' | 'pesv') => {
  const queryClient = useQueryClient();

  return {
    data: [] as NormaLegal[],
    isLoading: false,
    fetch: async () => {
      try {
        const data = await normasLegalesApi.getBySistema(sistema);
        queryClient.setQueryData(matrizLegalKeys.normasBySistema(sistema), data);
        return data;
      } catch (error) {
        toast.error('Error al obtener normas por sistema');
        throw error;
      }
    },
  };
};

// ==================== EMPRESA-NORMA HOOKS ====================

export const useEmpresaNormas = (filters?: EmpresaNormaFilters) => {
  return useGenericCRUD<EmpresaNorma>({
    queryKey: matrizLegalKeys.empresaNormas(filters),
    endpoint: `/cumplimiento/matriz-legal/empresa-normas/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Asignación de Norma',
    isFeminine: true,
    isPaginated: true,
  });
};

export const useEvaluarCumplimiento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      porcentaje_cumplimiento,
      fecha_evaluacion,
      observaciones,
    }: {
      id: number;
      porcentaje_cumplimiento: CumplimientoLevel;
      fecha_evaluacion: string;
      observaciones?: string;
    }) =>
      empresaNormasApi.evaluarCumplimiento(id, {
        porcentaje_cumplimiento,
        fecha_evaluacion,
        observaciones,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: matrizLegalKeys.empresaNormas() });
      queryClient.invalidateQueries({ queryKey: matrizLegalKeys.empresaNorma(id) });
      toast.success('Evaluación de cumplimiento registrada exitosamente');
    },
    onError: () => {
      toast.error('Error al evaluar el cumplimiento');
    },
  });
};
