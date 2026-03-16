/**
 * Hooks para Tesoreria — Modulo V2 (Cascada)
 * Usan DRF paginated responses: Array.isArray(data) ? data : (data?.results ?? [])
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bancosApi,
  cuentasPorPagarApi,
  cuentasPorCobrarApi,
  flujoCajaApi,
  pagosApi,
  recaudosApi,
} from '../api';

// ==================== BANCOS ====================

export const useBancos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'bancos', params],
    queryFn: () => bancosApi.getAll(params).then((r) => r.data),
  });

export const useBanco = (id: number) =>
  useQuery({
    queryKey: ['tesoreria', 'banco', id],
    queryFn: () => bancosApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useBancoSaldos = () =>
  useQuery({
    queryKey: ['tesoreria', 'bancos', 'saldos'],
    queryFn: () => bancosApi.getSaldos().then((r) => r.data),
  });

export const useCreateBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bancosApi.create>[0]) =>
      bancosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tesoreria', 'bancos'] }),
  });
};

export const useUpdateBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof bancosApi.update>[1] }) =>
      bancosApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tesoreria', 'bancos'] }),
  });
};

export const useDeleteBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bancosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tesoreria', 'bancos'] }),
  });
};

// ==================== CUENTAS POR PAGAR ====================

export const useCuentasPorPagar = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'cuentas-por-pagar', params],
    queryFn: () => cuentasPorPagarApi.getAll(params).then((r) => r.data),
  });

export const useCuentaPorPagar = (id: number) =>
  useQuery({
    queryKey: ['tesoreria', 'cuenta-por-pagar', id],
    queryFn: () => cuentasPorPagarApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });

export const useCuentasPorPagarEstadisticas = () =>
  useQuery({
    queryKey: ['tesoreria', 'cuentas-por-pagar', 'estadisticas'],
    queryFn: () => cuentasPorPagarApi.getEstadisticas().then((r) => r.data),
  });

export const useCuentasPorPagarPorVencer = () =>
  useQuery({
    queryKey: ['tesoreria', 'cuentas-por-pagar', 'por-vencer'],
    queryFn: () => cuentasPorPagarApi.getPorVencer().then((r) => r.data),
  });

export const useCreateCuentaPorPagar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof cuentasPorPagarApi.create>[0]) =>
      cuentasPorPagarApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tesoreria', 'cuentas-por-pagar'] }),
  });
};

// ==================== CUENTAS POR COBRAR ====================

export const useCuentasPorCobrar = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'cuentas-por-cobrar', params],
    queryFn: () => cuentasPorCobrarApi.getAll(params).then((r) => r.data),
  });

export const useCuentasPorCobrarEstadisticas = () =>
  useQuery({
    queryKey: ['tesoreria', 'cuentas-por-cobrar', 'estadisticas'],
    queryFn: () => cuentasPorCobrarApi.getEstadisticas().then((r) => r.data),
  });

export const useCreateCuentaPorCobrar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof cuentasPorCobrarApi.create>[0]) =>
      cuentasPorCobrarApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tesoreria', 'cuentas-por-cobrar'] }),
  });
};

// ==================== FLUJO DE CAJA ====================

export const useFlujoCaja = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'flujo-caja', params],
    queryFn: () => flujoCajaApi.getAll(params).then((r) => r.data),
  });

export const useFlujoCajaResumen = (fechaInicio: string, fechaFin: string) =>
  useQuery({
    queryKey: ['tesoreria', 'flujo-caja', 'resumen', fechaInicio, fechaFin],
    queryFn: () =>
      flujoCajaApi
        .getResumenPeriodo({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
        .then((r) => r.data),
    enabled: !!fechaInicio && !!fechaFin,
  });

// ==================== PAGOS ====================

export const usePagos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'pagos', params],
    queryFn: () => pagosApi.getAll(params).then((r) => r.data),
  });

export const useCreatePago = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof pagosApi.create>[0]) =>
      pagosApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tesoreria', 'pagos'] });
      qc.invalidateQueries({ queryKey: ['tesoreria', 'cuentas-por-pagar'] });
      qc.invalidateQueries({ queryKey: ['tesoreria', 'bancos'] });
    },
  });
};

// ==================== RECAUDOS ====================

export const useRecaudos = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['tesoreria', 'recaudos', params],
    queryFn: () => recaudosApi.getAll(params).then((r) => r.data),
  });

export const useCreateRecaudo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof recaudosApi.create>[0]) =>
      recaudosApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tesoreria', 'recaudos'] });
      qc.invalidateQueries({ queryKey: ['tesoreria', 'cuentas-por-cobrar'] });
      qc.invalidateQueries({ queryKey: ['tesoreria', 'bancos'] });
    },
  });
};
