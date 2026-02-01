/**
 * React Query Hooks para Portafolios y Programas
 * Sistema de Gestión StrateKaz
 * Semana 5: Gestión de Proyectos
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { portafoliosApi, programasApi } from '../api/proyectosApi';
import type {
  CreatePortafolioDTO,
  UpdatePortafolioDTO,
  PortafolioFilters,
  CreateProgramaDTO,
  UpdateProgramaDTO,
  ProgramaFilters,
} from '../types/proyectos';

// ==================== QUERY KEYS ====================

export const portafoliosKeys = {
  // Portafolios
  portafolios: (filters?: PortafolioFilters) => ['portafolios', filters] as const,
  portafolio: (id: number) => ['portafolio', id] as const,

  // Programas
  programas: (filters?: ProgramaFilters) => ['programas', filters] as const,
  programa: (id: number) => ['programa', id] as const,
};

// ==================== PORTAFOLIOS HOOKS ====================

export const usePortafolios = (filters?: PortafolioFilters) => {
  return useQuery({
    queryKey: portafoliosKeys.portafolios(filters),
    queryFn: () => portafoliosApi.getAll(filters),
  });
};

export const usePortafolio = (id: number) => {
  return useQuery({
    queryKey: portafoliosKeys.portafolio(id),
    queryFn: () => portafoliosApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePortafolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePortafolioDTO) => portafoliosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.portafolios() });
      toast.success('Portafolio creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el portafolio');
    },
  });
};

export const useUpdatePortafolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePortafolioDTO }) =>
      portafoliosApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.portafolios() });
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.portafolio(id) });
      toast.success('Portafolio actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el portafolio');
    },
  });
};

export const useDeletePortafolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => portafoliosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.portafolios() });
      toast.success('Portafolio eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el portafolio');
    },
  });
};

// ==================== PROGRAMAS HOOKS ====================

export const useProgramas = (filters?: ProgramaFilters) => {
  return useQuery({
    queryKey: portafoliosKeys.programas(filters),
    queryFn: () => programasApi.getAll(filters),
  });
};

export const usePrograma = (id: number) => {
  return useQuery({
    queryKey: portafoliosKeys.programa(id),
    queryFn: () => programasApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePrograma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgramaDTO) => programasApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.programas() });
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.portafolio(variables.portafolio) });
      toast.success('Programa creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el programa');
    },
  });
};

export const useUpdatePrograma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProgramaDTO }) =>
      programasApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.programas() });
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.programa(id) });
      toast.success('Programa actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el programa');
    },
  });
};

export const useDeletePrograma = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => programasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portafoliosKeys.programas() });
      toast.success('Programa eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el programa');
    },
  });
};
