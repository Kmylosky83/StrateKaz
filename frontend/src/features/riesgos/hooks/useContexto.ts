/**
 * Hooks React Query para Contexto Organizacional
 * Sistema de Gestión Grasas y Huesos del Norte
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dofaApi, pestelApi, porterApi } from '../api/contextoApi';
import type {
  AnalisisDOFA,
  FactorDOFA,
  EstrategiaTOWS,
  AnalisisPESTEL,
  FactorPESTEL,
  AnalisisPorter,
  FuerzaPorter,
  CreateAnalisisDOFADTO,
  UpdateAnalisisDOFADTO,
  CreateFactorDOFADTO,
  UpdateFactorDOFADTO,
  CreateEstrategiaTOWSDTO,
  UpdateEstrategiaTOWSDTO,
  CreateAnalisisPESTELDTO,
  UpdateAnalisisPESTELDTO,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  CreateAnalisisPorterDTO,
  UpdateAnalisisPorterDTO,
  CreateFuerzaPorterDTO,
  UpdateFuerzaPorterDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const dofaKeys = {
  all: ['dofa'] as const,
  analisis: () => [...dofaKeys.all, 'analisis'] as const,
  analisisList: () => [...dofaKeys.analisis(), 'list'] as const,
  analisisDetail: (id: number) => [...dofaKeys.analisis(), id] as const,
  factores: (analisisId: number) => [...dofaKeys.all, 'factores', analisisId] as const,
  estrategias: (analisisId: number) => [...dofaKeys.all, 'estrategias', analisisId] as const,
};

export const pestelKeys = {
  all: ['pestel'] as const,
  analisis: () => [...pestelKeys.all, 'analisis'] as const,
  analisisList: () => [...pestelKeys.analisis(), 'list'] as const,
  analisisDetail: (id: number) => [...pestelKeys.analisis(), id] as const,
  factores: (analisisId: number) => [...pestelKeys.all, 'factores', analisisId] as const,
};

export const porterKeys = {
  all: ['porter'] as const,
  analisis: () => [...porterKeys.all, 'analisis'] as const,
  analisisList: () => [...porterKeys.analisis(), 'list'] as const,
  analisisDetail: (id: number) => [...porterKeys.analisis(), id] as const,
  fuerzas: (analisisId: number) => [...porterKeys.all, 'fuerzas', analisisId] as const,
};

// ==================== DOFA HOOKS ====================

export function useAnalisisDOFAList() {
  return useQuery({
    queryKey: dofaKeys.analisisList(),
    queryFn: () => dofaApi.getAllAnalisis(),
  });
}

export function useAnalisisDOFA(id: number) {
  return useQuery({
    queryKey: dofaKeys.analisisDetail(id),
    queryFn: () => dofaApi.getAnalisisById(id),
    enabled: !!id,
  });
}

export function useFactoresDOFA(analisisId: number) {
  return useQuery({
    queryKey: dofaKeys.factores(analisisId),
    queryFn: () => dofaApi.getFactores(analisisId),
    enabled: !!analisisId,
  });
}

export function useEstrategiasTOWS(analisisId: number) {
  return useQuery({
    queryKey: dofaKeys.estrategias(analisisId),
    queryFn: () => dofaApi.getEstrategias(analisisId),
    enabled: !!analisisId,
  });
}

export function useCreateAnalisisDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnalisisDOFADTO) => dofaApi.createAnalisis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.analisisList() });
    },
  });
}

export function useUpdateAnalisisDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisDOFADTO }) =>
      dofaApi.updateAnalisis(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.analisisList() });
      queryClient.invalidateQueries({ queryKey: dofaKeys.analisisDetail(id) });
    },
  });
}

export function useDeleteAnalisisDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dofaApi.deleteAnalisis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.analisisList() });
    },
  });
}

export function useCreateFactorDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFactorDOFADTO) => dofaApi.createFactor(data),
    onSuccess: (_, { analisis }) => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.factores(analisis) });
    },
  });
}

export function useUpdateFactorDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFactorDOFADTO }) =>
      dofaApi.updateFactor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.all });
    },
  });
}

export function useDeleteFactorDOFA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dofaApi.deleteFactor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.all });
    },
  });
}

export function useCreateEstrategiaTOWS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEstrategiaTOWSDTO) => dofaApi.createEstrategia(data),
    onSuccess: (_, { analisis }) => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.estrategias(analisis) });
    },
  });
}

export function useUpdateEstrategiaTOWS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstrategiaTOWSDTO }) =>
      dofaApi.updateEstrategia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.all });
    },
  });
}

export function useDeleteEstrategiaTOWS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dofaApi.deleteEstrategia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dofaKeys.all });
    },
  });
}

// ==================== PESTEL HOOKS ====================

export function useAnalisisPESTELList() {
  return useQuery({
    queryKey: pestelKeys.analisisList(),
    queryFn: () => pestelApi.getAllAnalisis(),
  });
}

export function useAnalisisPESTEL(id: number) {
  return useQuery({
    queryKey: pestelKeys.analisisDetail(id),
    queryFn: () => pestelApi.getAnalisisById(id),
    enabled: !!id,
  });
}

export function useFactoresPESTEL(analisisId: number) {
  return useQuery({
    queryKey: pestelKeys.factores(analisisId),
    queryFn: () => pestelApi.getFactores(analisisId),
    enabled: !!analisisId,
  });
}

export function useCreateAnalisisPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnalisisPESTELDTO) => pestelApi.createAnalisis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.analisisList() });
    },
  });
}

export function useUpdateAnalisisPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisPESTELDTO }) =>
      pestelApi.updateAnalisis(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.analisisList() });
      queryClient.invalidateQueries({ queryKey: pestelKeys.analisisDetail(id) });
    },
  });
}

export function useDeleteAnalisisPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pestelApi.deleteAnalisis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.analisisList() });
    },
  });
}

export function useCreateFactorPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFactorPESTELDTO) => pestelApi.createFactor(data),
    onSuccess: (_, { analisis }) => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.factores(analisis) });
    },
  });
}

export function useUpdateFactorPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFactorPESTELDTO }) =>
      pestelApi.updateFactor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.all });
    },
  });
}

export function useDeleteFactorPESTEL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pestelApi.deleteFactor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pestelKeys.all });
    },
  });
}

// ==================== PORTER HOOKS ====================

export function useAnalisisPorterList() {
  return useQuery({
    queryKey: porterKeys.analisisList(),
    queryFn: () => porterApi.getAllAnalisis(),
  });
}

export function useAnalisisPorter(id: number) {
  return useQuery({
    queryKey: porterKeys.analisisDetail(id),
    queryFn: () => porterApi.getAnalisisById(id),
    enabled: !!id,
  });
}

export function useFuerzasPorter(analisisId: number) {
  return useQuery({
    queryKey: porterKeys.fuerzas(analisisId),
    queryFn: () => porterApi.getFuerzas(analisisId),
    enabled: !!analisisId,
  });
}

export function useCreateAnalisisPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnalisisPorterDTO) => porterApi.createAnalisis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: porterKeys.analisisList() });
    },
  });
}

export function useUpdateAnalisisPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisPorterDTO }) =>
      porterApi.updateAnalisis(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: porterKeys.analisisList() });
      queryClient.invalidateQueries({ queryKey: porterKeys.analisisDetail(id) });
    },
  });
}

export function useDeleteAnalisisPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => porterApi.deleteAnalisis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: porterKeys.analisisList() });
    },
  });
}

export function useCreateFuerzaPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFuerzaPorterDTO) => porterApi.createFuerza(data),
    onSuccess: (_, { analisis }) => {
      queryClient.invalidateQueries({ queryKey: porterKeys.fuerzas(analisis) });
    },
  });
}

export function useUpdateFuerzaPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFuerzaPorterDTO }) =>
      porterApi.updateFuerza(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: porterKeys.all });
    },
  });
}

export function useDeleteFuerzaPorter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => porterApi.deleteFuerza(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: porterKeys.all });
    },
  });
}
