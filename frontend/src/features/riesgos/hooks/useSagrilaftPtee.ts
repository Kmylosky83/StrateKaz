/**
 * React Query Hooks para SAGRILAFT / PTEE
 * Backend: /api/riesgos/sagrilaft/
 */
import { useQuery } from '@tanstack/react-query';
import {
  factoresRiesgoLAFTApi,
  segmentosClienteApi,
  matricesRiesgoLAFTApi,
  senalesAlertaApi,
  reportesROSApi,
  debidasDiligenciasApi,
} from '../api/sagrilaftPteeApi';

// ============================================
// QUERY KEYS
// ============================================

export const sagrilaftKeys = {
  all: ['sagrilaft'] as const,
  factores: () => [...sagrilaftKeys.all, 'factores'] as const,
  factoresList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.factores(), 'list', params] as const,
  factoresPorTipo: () => [...sagrilaftKeys.factores(), 'por-tipo'] as const,
  segmentos: () => [...sagrilaftKeys.all, 'segmentos'] as const,
  segmentosList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.segmentos(), 'list', params] as const,
  matrices: () => [...sagrilaftKeys.all, 'matrices'] as const,
  matricesList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.matrices(), 'list', params] as const,
  matricesResumen: () => [...sagrilaftKeys.matrices(), 'resumen'] as const,
  matricesProximasRevisiones: () => [...sagrilaftKeys.matrices(), 'proximas-revisiones'] as const,
  senales: () => [...sagrilaftKeys.all, 'senales'] as const,
  senalesList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.senales(), 'list', params] as const,
  senalesPendientes: () => [...sagrilaftKeys.senales(), 'pendientes'] as const,
  senalesRequierenROS: () => [...sagrilaftKeys.senales(), 'requieren-ros'] as const,
  reportes: () => [...sagrilaftKeys.all, 'reportes'] as const,
  reportesList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.reportes(), 'list', params] as const,
  reportesPendientesEnvio: () => [...sagrilaftKeys.reportes(), 'pendientes-envio'] as const,
  diligencias: () => [...sagrilaftKeys.all, 'diligencias'] as const,
  diligenciasList: (params?: Record<string, unknown>) =>
    [...sagrilaftKeys.diligencias(), 'list', params] as const,
  diligenciasVencidas: () => [...sagrilaftKeys.diligencias(), 'vencidas'] as const,
  diligenciasProximasActualizacion: () =>
    [...sagrilaftKeys.diligencias(), 'proximas-actualizacion'] as const,
  diligenciasPEPs: () => [...sagrilaftKeys.diligencias(), 'peps'] as const,
};

// ============================================
// HOOKS PARA FACTORES DE RIESGO
// ============================================

export function useFactoresRiesgoLAFT(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.factoresList(params),
    queryFn: () => factoresRiesgoLAFTApi.getAll(params),
    staleTime: 10 * 60 * 1000, // catálogo
  });
}

export function useFactoresPorTipo() {
  return useQuery({
    queryKey: sagrilaftKeys.factoresPorTipo(),
    queryFn: factoresRiesgoLAFTApi.porTipo,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================
// HOOKS PARA SEGMENTOS
// ============================================

export function useSegmentosCliente(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.segmentosList(params),
    queryFn: () => segmentosClienteApi.getAll(params),
  });
}

// ============================================
// HOOKS PARA MATRICES DE RIESGO
// ============================================

export function useMatricesRiesgoLAFT(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.matricesList(params),
    queryFn: () => matricesRiesgoLAFTApi.getAll(params),
  });
}

export function useResumenMatricesLAFT() {
  return useQuery({
    queryKey: sagrilaftKeys.matricesResumen(),
    queryFn: matricesRiesgoLAFTApi.resumen,
  });
}

export function useProximasRevisionesLAFT() {
  return useQuery({
    queryKey: sagrilaftKeys.matricesProximasRevisiones(),
    queryFn: matricesRiesgoLAFTApi.proximasRevisiones,
  });
}

// ============================================
// HOOKS PARA SEÑALES DE ALERTA
// ============================================

export function useSenalesAlerta(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.senalesList(params),
    queryFn: () => senalesAlertaApi.getAll(params),
  });
}

export function useSenalesPendientes() {
  return useQuery({
    queryKey: sagrilaftKeys.senalesPendientes(),
    queryFn: senalesAlertaApi.pendientes,
  });
}

export function useSenalesRequierenROS() {
  return useQuery({
    queryKey: sagrilaftKeys.senalesRequierenROS(),
    queryFn: senalesAlertaApi.requierenROS,
  });
}

// ============================================
// HOOKS PARA REPORTES ROS
// ============================================

export function useReportesROS(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.reportesList(params),
    queryFn: () => reportesROSApi.getAll(params),
  });
}

export function useReportesPendientesEnvio() {
  return useQuery({
    queryKey: sagrilaftKeys.reportesPendientesEnvio(),
    queryFn: reportesROSApi.pendientesEnvio,
  });
}

// ============================================
// HOOKS PARA DEBIDAS DILIGENCIAS
// ============================================

export function useDebidasDiligencias(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: sagrilaftKeys.diligenciasList(params),
    queryFn: () => debidasDiligenciasApi.getAll(params),
  });
}

export function useDebidasDiligenciasVencidas() {
  return useQuery({
    queryKey: sagrilaftKeys.diligenciasVencidas(),
    queryFn: debidasDiligenciasApi.vencidas,
  });
}

export function useDebidasDiligenciasProximasActualizacion() {
  return useQuery({
    queryKey: sagrilaftKeys.diligenciasProximasActualizacion(),
    queryFn: debidasDiligenciasApi.proximasActualizacion,
  });
}

export function useDebidasDiligenciasPEPs() {
  return useQuery({
    queryKey: sagrilaftKeys.diligenciasPEPs(),
    queryFn: debidasDiligenciasApi.peps,
  });
}
