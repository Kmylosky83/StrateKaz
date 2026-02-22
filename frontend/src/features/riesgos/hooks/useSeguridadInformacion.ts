/**
 * React Query Hooks para Seguridad de la Información — ISO 27001:2022
 * Backend: /api/riesgos/seguridad-info/
 */
import { useQuery } from '@tanstack/react-query';
import {
  activosInformacionApi,
  amenazasApi,
  vulnerabilidadesApi,
  riesgosSeguridadApi,
  controlesSeguridadApi,
  incidentesSeguridadApi,
} from '../api/seguridadInformacionApi';

// ============================================
// QUERY KEYS
// ============================================

export const seguridadInfoKeys = {
  all: ['seguridad-informacion'] as const,
  activos: () => [...seguridadInfoKeys.all, 'activos'] as const,
  activosList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.activos(), 'list', params] as const,
  activosCriticos: () => [...seguridadInfoKeys.activos(), 'criticos'] as const,
  activosEstadisticas: () => [...seguridadInfoKeys.activos(), 'estadisticas'] as const,
  amenazas: () => [...seguridadInfoKeys.all, 'amenazas'] as const,
  amenazasList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.amenazas(), 'list', params] as const,
  vulnerabilidades: () => [...seguridadInfoKeys.all, 'vulnerabilidades'] as const,
  vulnerabilidadesList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.vulnerabilidades(), 'list', params] as const,
  riesgos: () => [...seguridadInfoKeys.all, 'riesgos'] as const,
  riesgosList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.riesgos(), 'list', params] as const,
  riesgosCriticos: () => [...seguridadInfoKeys.riesgos(), 'criticos'] as const,
  riesgosResumen: () => [...seguridadInfoKeys.riesgos(), 'resumen'] as const,
  controles: () => [...seguridadInfoKeys.all, 'controles'] as const,
  controlesList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.controles(), 'list', params] as const,
  controlesPendientes: () => [...seguridadInfoKeys.controles(), 'pendientes'] as const,
  controlesEfectividad: () => [...seguridadInfoKeys.controles(), 'efectividad'] as const,
  incidentes: () => [...seguridadInfoKeys.all, 'incidentes'] as const,
  incidentesList: (params?: Record<string, unknown>) =>
    [...seguridadInfoKeys.incidentes(), 'list', params] as const,
  incidentesAbiertos: () => [...seguridadInfoKeys.incidentes(), 'abiertos'] as const,
  incidentesCriticos: () => [...seguridadInfoKeys.incidentes(), 'criticos'] as const,
  incidentesResumen: () => [...seguridadInfoKeys.incidentes(), 'resumen'] as const,
};

// ============================================
// HOOKS PARA ACTIVOS DE INFORMACIÓN
// ============================================

export function useActivosInformacion(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.activosList(params),
    queryFn: () => activosInformacionApi.getAll(params),
  });
}

export function useActivosCriticos() {
  return useQuery({
    queryKey: seguridadInfoKeys.activosCriticos(),
    queryFn: activosInformacionApi.criticos,
  });
}

export function useActivosEstadisticas() {
  return useQuery({
    queryKey: seguridadInfoKeys.activosEstadisticas(),
    queryFn: activosInformacionApi.estadisticas,
  });
}

// ============================================
// HOOKS PARA AMENAZAS
// ============================================

export function useAmenazas(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.amenazasList(params),
    queryFn: () => amenazasApi.getAll(params),
    staleTime: 10 * 60 * 1000, // catálogo
  });
}

// ============================================
// HOOKS PARA VULNERABILIDADES
// ============================================

export function useVulnerabilidades(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.vulnerabilidadesList(params),
    queryFn: () => vulnerabilidadesApi.getAll(params),
  });
}

// ============================================
// HOOKS PARA RIESGOS DE SEGURIDAD
// ============================================

export function useRiesgosSeguridad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.riesgosList(params),
    queryFn: () => riesgosSeguridadApi.getAll(params),
  });
}

export function useRiesgosSeguridadCriticos() {
  return useQuery({
    queryKey: seguridadInfoKeys.riesgosCriticos(),
    queryFn: riesgosSeguridadApi.criticos,
  });
}

export function useResumenRiesgosSeguridad() {
  return useQuery({
    queryKey: seguridadInfoKeys.riesgosResumen(),
    queryFn: riesgosSeguridadApi.resumen,
  });
}

// ============================================
// HOOKS PARA CONTROLES
// ============================================

export function useControlesSeguridad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.controlesList(params),
    queryFn: () => controlesSeguridadApi.getAll(params),
  });
}

export function useControlesPendientes() {
  return useQuery({
    queryKey: seguridadInfoKeys.controlesPendientes(),
    queryFn: controlesSeguridadApi.pendientes,
  });
}

export function useControlesEfectividad() {
  return useQuery({
    queryKey: seguridadInfoKeys.controlesEfectividad(),
    queryFn: controlesSeguridadApi.porEfectividad,
  });
}

// ============================================
// HOOKS PARA INCIDENTES
// ============================================

export function useIncidentesSeguridad(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: seguridadInfoKeys.incidentesList(params),
    queryFn: () => incidentesSeguridadApi.getAll(params),
  });
}

export function useIncidentesAbiertos() {
  return useQuery({
    queryKey: seguridadInfoKeys.incidentesAbiertos(),
    queryFn: incidentesSeguridadApi.abiertos,
  });
}

export function useIncidentesCriticos() {
  return useQuery({
    queryKey: seguridadInfoKeys.incidentesCriticos(),
    queryFn: incidentesSeguridadApi.criticosIncidentes,
  });
}

export function useResumenIncidentes() {
  return useQuery({
    queryKey: seguridadInfoKeys.incidentesResumen(),
    queryFn: incidentesSeguridadApi.resumen,
  });
}
