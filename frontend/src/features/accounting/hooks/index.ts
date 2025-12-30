/**
 * Hooks para Accounting
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  planesCuentasApi,
  cuentasContablesApi,
  tiposDocumentoApi,
  tercerosApi,
  centrosCostoApi,
  configuracionApi,
  comprobantesApi,
  plantillasApi,
  informesApi,
  generacionesApi,
  parametrosIntegracionApi,
  logsIntegracionApi,
  colaContabilizacionApi,
} from '../api';

// ==================== CONFIG CONTABLE HOOKS ====================

export const usePlanesCuentas = () => {
  return useQuery({
    queryKey: ['planes-cuentas'],
    queryFn: () => planesCuentasApi.getAll(),
  });
};

export const useCuentasContables = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['cuentas-contables', params],
    queryFn: () => cuentasContablesApi.getAll(params),
  });
};

export const useTiposDocumento = () => {
  return useQuery({
    queryKey: ['tipos-documento-contable'],
    queryFn: () => tiposDocumentoApi.getAll(),
  });
};

export const useTerceros = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['terceros', params],
    queryFn: () => tercerosApi.getAll(params),
  });
};

export const useCentrosCosto = () => {
  return useQuery({
    queryKey: ['centros-costo-contable'],
    queryFn: () => centrosCostoApi.getAll(),
  });
};

export const useConfiguracion = () => {
  return useQuery({
    queryKey: ['configuracion-contable'],
    queryFn: () => configuracionApi.get(),
  });
};

// ==================== MOVIMIENTOS HOOKS ====================

export const useComprobantes = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['comprobantes', params],
    queryFn: () => comprobantesApi.getAll(params),
  });
};

export const useComprobante = (id: number) => {
  return useQuery({
    queryKey: ['comprobante', id],
    queryFn: () => comprobantesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateComprobante = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprobantes'] });
    },
  });
};

export const useContabilizarComprobante = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: comprobantesApi.contabilizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comprobantes'] });
    },
  });
};

export const usePlantillas = () => {
  return useQuery({
    queryKey: ['plantillas-contables'],
    queryFn: () => plantillasApi.getAll(),
  });
};

// ==================== INFORMES HOOKS ====================

export const useInformes = () => {
  return useQuery({
    queryKey: ['informes-contables'],
    queryFn: () => informesApi.getAll(),
  });
};

export const useInforme = (id: number) => {
  return useQuery({
    queryKey: ['informe-contable', id],
    queryFn: () => informesApi.getById(id),
    enabled: !!id,
  });
};

export const useGeneraciones = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['generaciones-informe', params],
    queryFn: () => generacionesApi.getAll(params),
  });
};

export const useGenerarInforme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generacionesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generaciones-informe'] });
    },
  });
};

// ==================== INTEGRACIÓN HOOKS ====================

export const useParametrosIntegracion = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['parametros-integracion', params],
    queryFn: () => parametrosIntegracionApi.getAll(params),
  });
};

export const useLogsIntegracion = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['logs-integracion', params],
    queryFn: () => logsIntegracionApi.getAll(params),
  });
};

export const useColaContabilizacion = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['cola-contabilizacion', params],
    queryFn: () => colaContabilizacionApi.getAll(params),
  });
};
