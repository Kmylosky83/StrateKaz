/**
 * React Query Hooks para Requisitos Legales
 * Sistema de Gestión StrateKaz
 *
 * Usa useGenericCRUD como base para operaciones CRUD estándar
 */
import { useGenericCRUD } from '@/hooks/useGenericCRUD';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { empresaRequisitosApi } from '../api';
import type {
  TipoRequisito,
  RequisitoLegal,
  EmpresaRequisito,
  EmpresaRequisitoCreate,
} from '../types';

// Local filter types
interface RequisitoLegalFilters {
  tipo?: number;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  es_obligatorio?: boolean;
  search?: string;
}

interface EmpresaRequisitoFilters {
  empresa_id?: number;
  requisito?: number;
  estado?: string;
  responsable?: number;
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
}

// ==================== QUERY KEYS ====================

export const requisitosKeys = {
  // Tipos de Requisito
  tiposRequisito: ['tipos-requisito'] as const,
  tipoRequisito: (id: number) => ['tipo-requisito', id] as const,

  // Requisitos Legales
  requisitos: (filters?: RequisitoLegalFilters) => ['requisitos-legales', filters] as const,
  requisito: (id: number) => ['requisito-legal', id] as const,

  // Empresa-Requisito
  empresaRequisitos: (filters?: EmpresaRequisitoFilters) =>
    ['empresa-requisitos', filters] as const,
  empresaRequisito: (id: number) => ['empresa-requisito', id] as const,
  vencimientos: (empresaId: number, dias?: number) =>
    ['empresa-requisitos', 'vencimientos', empresaId, dias] as const,
};

// ==================== TIPOS DE REQUISITO HOOKS ====================

export const useTiposRequisito = () => {
  return useGenericCRUD<TipoRequisito>({
    queryKey: requisitosKeys.tiposRequisito,
    endpoint: '/cumplimiento/requisitos-legales/tipos-requisito/',
    entityName: 'Tipo de Requisito',
    isPaginated: true,
  });
};

// ==================== REQUISITOS LEGALES HOOKS ====================

export const useRequisitosLegales = (filters?: RequisitoLegalFilters) => {
  return useGenericCRUD<RequisitoLegal>({
    queryKey: requisitosKeys.requisitos(filters),
    endpoint: `/cumplimiento/requisitos-legales/requisitos/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Requisito Legal',
    isPaginated: true,
  });
};

// ==================== EMPRESA-REQUISITO HOOKS ====================

export const useEmpresaRequisitos = (filters?: EmpresaRequisitoFilters) => {
  return useGenericCRUD<EmpresaRequisito>({
    queryKey: requisitosKeys.empresaRequisitos(filters),
    endpoint: `/cumplimiento/requisitos-legales/empresa-requisitos/${filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
    entityName: 'Requisito de Empresa',
    isPaginated: true,
  });
};

export const useVencimientos = (empresaId: number, dias?: number) => {
  return useQuery({
    queryKey: requisitosKeys.vencimientos(empresaId, dias),
    queryFn: () => empresaRequisitosApi.getPorVencer(empresaId, dias),
    enabled: !!empresaId,
  });
};

export const useRenovarRequisito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpresaRequisitoCreate }) =>
      empresaRequisitosApi.renovar(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisitos() });
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisito(id) });
      queryClient.invalidateQueries({
        queryKey: [requisitosKeys.vencimientos(0)],
      });
      toast.success('Requisito renovado exitosamente');
    },
    onError: () => {
      toast.error('Error al renovar el requisito');
    },
  });
};

// ==================== DELETE EMPRESA-REQUISITO ====================

export const useDeleteEmpresaRequisito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => empresaRequisitosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisitos() });
      toast.success('Requisito eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el requisito');
    },
  });
};

// Hook especializado para crear/actualizar con archivos
export const useCreateEmpresaRequisitoWithFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmpresaRequisitoCreate) => empresaRequisitosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisitos() });
      toast.success('Requisito de empresa creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el requisito de empresa');
    },
  });
};

export const useUpdateEmpresaRequisitoWithFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpresaRequisitoCreate }) =>
      empresaRequisitosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisitos() });
      queryClient.invalidateQueries({ queryKey: requisitosKeys.empresaRequisito(id) });
      toast.success('Requisito de empresa actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el requisito de empresa');
    },
  });
};
