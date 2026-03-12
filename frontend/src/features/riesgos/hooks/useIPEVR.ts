/**
 * Hooks para IPEVR - Matriz GTC-45
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  matrizIPEVRApi,
  controlSSTApi,
  clasificacionPeligroApi,
  peligroGTC45Api,
} from '../api/ipevrApi';
import type {
  CreateMatrizIPEVRDTO,
  UpdateMatrizIPEVRDTO,
  CreateControlSSTDTO,
  UpdateControlSSTDTO,
  MatrizIPEVRFilters,
  ControlSSTFilters,
} from '../types';

// ==================== QUERY KEYS ====================

export const ipevrQueryKeys = {
  all: ['ipevr'] as const,
  clasificaciones: () => [...ipevrQueryKeys.all, 'clasificaciones'] as const,
  clasificacionesPorCategoria: () => [...ipevrQueryKeys.clasificaciones(), 'porCategoria'] as const,
  peligros: () => [...ipevrQueryKeys.all, 'peligros'] as const,
  peligrosPorClasificacion: (id?: number) =>
    [...ipevrQueryKeys.peligros(), 'porClasificacion', id] as const,
  matrices: () => [...ipevrQueryKeys.all, 'matrices'] as const,
  matricesList: (filters: MatrizIPEVRFilters) =>
    [...ipevrQueryKeys.matrices(), 'list', filters] as const,
  matrizDetail: (id: number) => [...ipevrQueryKeys.matrices(), 'detail', id] as const,
  matricesResumen: (empresaId?: number) =>
    [...ipevrQueryKeys.matrices(), 'resumen', empresaId] as const,
  matricesCriticos: (empresaId?: number) =>
    [...ipevrQueryKeys.matrices(), 'criticos', empresaId] as const,
  matricesPorArea: (empresaId?: number) =>
    [...ipevrQueryKeys.matrices(), 'porArea', empresaId] as const,
  matricesPorCargo: (empresaId?: number) =>
    [...ipevrQueryKeys.matrices(), 'porCargo', empresaId] as const,
  matricesPorPeligro: (empresaId?: number) =>
    [...ipevrQueryKeys.matrices(), 'porPeligro', empresaId] as const,
  controles: () => [...ipevrQueryKeys.all, 'controles'] as const,
  controlesList: (filters: ControlSSTFilters) =>
    [...ipevrQueryKeys.controles(), 'list', filters] as const,
  controlDetail: (id: number) => [...ipevrQueryKeys.controles(), 'detail', id] as const,
  controlesPendientes: (empresaId?: number) =>
    [...ipevrQueryKeys.controles(), 'pendientes', empresaId] as const,
  controlesPorTipo: (empresaId?: number) =>
    [...ipevrQueryKeys.controles(), 'porTipo', empresaId] as const,
};

// ==================== CLASIFICACIONES ====================

export const useClasificaciones = () => {
  return useQuery({
    queryKey: ipevrQueryKeys.clasificaciones(),
    queryFn: () => clasificacionPeligroApi.getAll({ is_active: true }),
  });
};

export const useClasificacionesPorCategoria = () => {
  return useQuery({
    queryKey: ipevrQueryKeys.clasificacionesPorCategoria(),
    queryFn: clasificacionPeligroApi.porCategoria,
  });
};

// ==================== PELIGROS ====================

export const usePeligros = (clasificacionId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.peligros(),
    queryFn: () => peligroGTC45Api.getAll({ clasificacion: clasificacionId, is_active: true }),
  });
};

export const usePeligrosPorClasificacion = (clasificacionId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.peligrosPorClasificacion(clasificacionId),
    queryFn: () => peligroGTC45Api.porClasificacion(clasificacionId),
  });
};

// ==================== MATRICES IPEVR ====================

export const useMatricesIPEVR = (filters: MatrizIPEVRFilters = {}) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesList(filters),
    queryFn: () => matrizIPEVRApi.getAll(filters),
  });
};

export const useMatrizIPEVR = (id: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matrizDetail(id),
    queryFn: () => matrizIPEVRApi.getById(id),
    enabled: !!id,
  });
};

export const useResumenIPEVR = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesResumen(empresaId),
    queryFn: () => matrizIPEVRApi.resumen(empresaId),
  });
};

export const useMatricesCriticos = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesCriticos(empresaId),
    queryFn: () => matrizIPEVRApi.criticos(empresaId),
  });
};

export const useMatricesPorArea = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesPorArea(empresaId),
    queryFn: () => matrizIPEVRApi.porArea(empresaId),
  });
};

export const useMatricesPorCargo = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesPorCargo(empresaId),
    queryFn: () => matrizIPEVRApi.porCargo(empresaId),
  });
};

export const useMatricesPorPeligro = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.matricesPorPeligro(empresaId),
    queryFn: () => matrizIPEVRApi.porPeligro(empresaId),
  });
};

// ==================== MUTATIONS MATRIZ ====================

export const useCreateMatrizIPEVR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMatrizIPEVRDTO) => matrizIPEVRApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrices() });
    },
  });
};

export const useUpdateMatrizIPEVR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMatrizIPEVRDTO }) =>
      matrizIPEVRApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrices() });
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrizDetail(variables.id) });
    },
  });
};

export const useDeleteMatrizIPEVR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => matrizIPEVRApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrices() });
    },
  });
};

export const useCambiarEstadoMatriz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      matrizIPEVRApi.cambiarEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrices() });
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrizDetail(variables.id) });
    },
  });
};

// ==================== CONTROLES SST ====================

export const useControlesSST = (filters: ControlSSTFilters = {}) => {
  return useQuery({
    queryKey: ipevrQueryKeys.controlesList(filters),
    queryFn: () => controlSSTApi.getAll(filters),
  });
};

export const useControlSST = (id: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.controlDetail(id),
    queryFn: () => controlSSTApi.getById(id),
    enabled: !!id,
  });
};

export const useControlesPendientes = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.controlesPendientes(empresaId),
    queryFn: () => controlSSTApi.pendientes(empresaId),
  });
};

export const useControlesPorTipo = (empresaId?: number) => {
  return useQuery({
    queryKey: ipevrQueryKeys.controlesPorTipo(empresaId),
    queryFn: () => controlSSTApi.porTipo(empresaId),
  });
};

// ==================== MUTATIONS CONTROL ====================

export const useCreateControlSST = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateControlSSTDTO) => controlSSTApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.controles() });
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.matrices() });
    },
  });
};

export const useUpdateControlSST = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateControlSSTDTO }) =>
      controlSSTApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.controles() });
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.controlDetail(variables.id) });
    },
  });
};

export const useDeleteControlSST = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => controlSSTApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ipevrQueryKeys.controles() });
    },
  });
};
