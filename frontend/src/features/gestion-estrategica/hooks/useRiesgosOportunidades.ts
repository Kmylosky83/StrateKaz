/**
 * React Query Hooks para Riesgos y Oportunidades - Vista Estratégica GE
 * Conecta con motor_riesgos para vista consolidada ISO 6.1
 */
import { useQuery } from '@tanstack/react-query';
import { riesgosEstrategicosApi } from '../api/riesgosOportunidadesApi';

export const riesgosEstrategicosKeys = {
  resumen: ['riesgos-estrategicos-resumen'] as const,
  riesgos: (params?: Record<string, string>) => ['riesgos-estrategicos', params] as const,
  criticos: ['riesgos-estrategicos-criticos'] as const,
  mapaCalor: ['riesgos-mapa-calor'] as const,
  oportunidades: (params?: Record<string, string>) => ['oportunidades-estrategicas', params] as const,
  tratamientos: (params?: Record<string, string>) => ['tratamientos-estrategicos', params] as const,
};

export const useRiesgosResumen = () => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.resumen,
    queryFn: riesgosEstrategicosApi.getResumen,
    staleTime: 60_000,
  });
};

export const useRiesgosEstrategicos = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.riesgos(params),
    queryFn: () => riesgosEstrategicosApi.getRiesgos(params),
  });
};

export const useRiesgosCriticos = () => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.criticos,
    queryFn: riesgosEstrategicosApi.getCriticos,
    staleTime: 60_000,
  });
};

export const useMapaCalorRiesgos = () => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.mapaCalor,
    queryFn: riesgosEstrategicosApi.getMapaCalor,
    staleTime: 60_000,
  });
};

export const useOportunidadesEstrategicas = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.oportunidades(params),
    queryFn: () => riesgosEstrategicosApi.getOportunidades(params),
  });
};

export const useTratamientosEstrategicos = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: riesgosEstrategicosKeys.tratamientos(params),
    queryFn: () => riesgosEstrategicosApi.getTratamientos(params),
  });
};
